// DMi SaaS Platform: Super Admin backend (Supabase / Postgres)
-- Principle: the platform admin sees tenants, billing, devices, health.
-- Sales, debts, payroll live in tenant tables and are NOT granted to platform admins.

create extension if not exists pgcrypto;

-- ---------- Enums & reference data ----------
do $$ begin
  create type tenant_status as enum ('trial','active','grace','suspended');
exception when duplicate_object then null; end $$;

create table if not exists plans (
  id            text primary key,
  name          text not null,
  monthly_fee   int,            -- KES, null if not sold monthly
  yearly_fee    int,            -- KES, null if not sold yearly
  max_branches  int not null,
  max_devices   int not null
);

-- ADJUST branch/device limits to your real plan rules.
insert into plans (id, name, monthly_fee, yearly_fee, max_branches, max_devices) values
  ('starter',    'Starter',    2500,  null,   1,   2),
  ('business',   'Business',   7500,  null,   5,  10),
  ('enterprise', 'Enterprise', null, 270000, 50, 200)
on conflict (id) do nothing;

-- ---------- Identity ----------
create table if not exists platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null default 'superadmin',
  created_at timestamptz not null default now()
);

create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_name  text,
  owner_phone text,
  till        text,
  plan_id     text references plans(id),
  status      tenant_status not null default 'trial',
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz            -- soft delete only
);

create table if not exists tenant_members (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  role      text not null default 'owner',   -- owner | employee
  primary key (tenant_id, user_id)
);

create table if not exists branches (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name      text not null,
  code      text,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  branch_id    uuid references branches(id) on delete set null,
  label        text,
  app_version  text,
  platform     text,                 -- android | windows | web
  last_seen_at timestamptz,
  authorized   boolean not null default true
);

-- ---------- Billing ----------
create table if not exists subscription_payments (
  id                  bigint generated always as identity primary key,
  invoice_no          text unique not null default ('INV-' || to_char(now(),'YYMM') || '-' || upper(encode(gen_random_bytes(3),'hex'))),
  tenant_id           uuid not null references tenants(id),
  plan_id             text not null references plans(id),
  period_days         int  not null,
  amount              int  not null,
  method              text not null default 'mpesa_stk',   -- mpesa_stk | paybill | voucher | wire
  phone               text,
  checkout_request_id text unique,
  mpesa_receipt       text unique,
  status              text not null default 'pending'
                      check (status in ('pending','paid','failed','cancelled')),
  result_desc         text,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  verified_at         timestamptz
);
create index if not exists idx_pay_tenant on subscription_payments(tenant_id, created_at desc);

create table if not exists vouchers (
  code             text primary key,
  plan_id          text not null references plans(id),
  days             int  not null,
  status           text not null default 'unused' check (status in ('unused','redeemed','void')),
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  redeemed_tenant  uuid references tenants(id),
  redeemed_at      timestamptz
);

-- ---------- Support access audit ----------
create table if not exists support_sessions (
  id          bigint generated always as identity primary key,
  admin_id    uuid not null references auth.users(id),
  tenant_id   uuid not null references tenants(id),
  reason      text not null check (length(trim(reason)) >= 10),
  data_scopes text[] not null default '{}',
  actions     text not null default 'VIEW ONLY',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  expires_at  timestamptz not null default (now() + interval '30 minutes'),
  status      text not null default 'open' check (status in ('open','closed','expired'))
);

create table if not exists platform_audit (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  detail jsonb,
  at timestamptz not null default now()
);

-- ---------- Helpers ----------
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function is_tenant_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tenant_members where tenant_id = t and user_id = auth.uid());
$$;

-- Extend a subscription. service_role only (called by the M-Pesa callback / voucher redeem).
create or replace function extend_subscription(p_tenant uuid, p_plan text, p_days int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update tenants
     set plan_id    = p_plan,
         status     = 'active',
         expires_at = greatest(now(), expires_at) + make_interval(days => p_days)
   where id = p_tenant;
  insert into platform_audit(action, detail)
  values ('extend_subscription', jsonb_build_object('tenant', p_tenant, 'plan', p_plan, 'days', p_days));
end $$;
revoke all on function extend_subscription(uuid, text, int) from public, anon, authenticated;
grant execute on function extend_subscription(uuid, text, int) to service_role;

-- Tenant owner redeems a prepaid voucher (Cloud & Devices -> Enter Developer Voucher)
create or replace function redeem_voucher(p_tenant uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v vouchers%rowtype;
begin
  if not exists (select 1 from tenant_members
                  where tenant_id = p_tenant and user_id = auth.uid() and role = 'owner') then
    raise exception 'not allowed';
  end if;
  select * into v from vouchers where code = upper(trim(p_code)) for update;
  if not found or v.status <> 'unused' then
    raise exception 'invalid or already used voucher';
  end if;
  update vouchers set status='redeemed', redeemed_tenant=p_tenant, redeemed_at=now() where code=v.code;
  perform extend_subscription(p_tenant, v.plan_id, v.days);
  insert into subscription_payments(tenant_id, plan_id, period_days, amount, method, status, verified_at, mpesa_receipt)
  select p_tenant, v.plan_id, v.days, coalesce(pl.monthly_fee, pl.yearly_fee, 0), 'voucher', 'paid', now(), v.code
    from plans pl where pl.id = v.plan_id;
  return jsonb_build_object('plan', v.plan_id, 'days', v.days);
end $$;
grant execute on function redeem_voucher(uuid, text) to authenticated;

-- Admin generates vouchers, e.g. select * from generate_vouchers('business', 30, 10);
create or replace function generate_vouchers(p_plan text, p_days int, p_qty int) returns setof vouchers
language plpgsql security definer set search_path = public as $$
declare i int; c text;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  if p_qty < 1 or p_qty > 500 then raise exception 'qty 1..500'; end if;
  for i in 1..p_qty loop
    c := 'DMI-' || upper(left(p_plan,3)) || '-' ||
         upper(encode(gen_random_bytes(3),'hex')) || '-' || upper(encode(gen_random_bytes(3),'hex'));
    return query insert into vouchers(code, plan_id, days, created_by)
                 values (c, p_plan, p_days, auth.uid()) returning *;
  end loop;
end $$;
grant execute on function generate_vouchers(text, int, int) to authenticated;

-- Time-bound, reason-justified support session
create or replace function start_support_session(p_tenant uuid, p_reason text, p_scopes text[]) returns bigint
language plpgsql security definer set search_path = public as $$
declare sid bigint;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  insert into support_sessions(admin_id, tenant_id, reason, data_scopes)
  values (auth.uid(), p_tenant, p_reason, p_scopes) returning id into sid;
  return sid;
end $$;
grant execute on function start_support_session(uuid, text, text[]) to authenticated;

create or replace function end_support_session(p_id bigint) returns void
language sql security definer set search_path = public as $$
  update support_sessions set ended_at = now(), status = 'closed'
   where id = p_id and admin_id = auth.uid() and status = 'open';
$$;
grant execute on function end_support_session(bigint) to authenticated;

-- Dashboard KPIs (replaces the simulated zeros)
create or replace function platform_metrics() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'subscribers',      count(*) filter (where t.deleted_at is null),
    'active',           count(*) filter (where t.status = 'active'),
    'grace',            count(*) filter (where t.status = 'grace'),
    'suspended',        count(*) filter (where t.status = 'suspended'),
    'mrr',              coalesce(sum(coalesce(p.monthly_fee, p.yearly_fee / 12)) filter (where t.status = 'active'), 0),
    'collections_month',(select coalesce(sum(amount),0) from subscription_payments
                          where status='paid' and verified_at >= date_trunc('month', now())),
    'terminals',        (select count(*) from devices where authorized),
    'terminals_online', (select count(*) from devices where authorized and last_seen_at > now() - interval '5 minutes')
  ) into r
  from tenants t left join plans p on p.id = t.plan_id where t.deleted_at is null;
  return r;
end $$;
grant execute on function platform_metrics() to authenticated;

-- Lifecycle: run daily via pg_cron. Grace length (7 days) is an assumption - change to your policy.
create or replace function expire_subscriptions() returns void
language sql security definer set search_path = public as $$
  update tenants set status = 'grace'
   where status in ('active','trial') and expires_at < now() and deleted_at is null;
  update tenants set status = 'suspended'
   where status = 'grace' and expires_at < now() - interval '7 days' and deleted_at is null;
$$;
revoke all on function expire_subscriptions() from public, anon, authenticated;
-- select cron.schedule('dmi-expire', '0 1 * * *', $$select public.expire_subscriptions()$$);

-- ---------- Row Level Security ----------
alter table plans                 enable row level security;
alter table platform_admins       enable row level security;
alter table tenants               enable row level security;
alter table tenant_members        enable row level security;
alter table branches              enable row level security;
alter table devices               enable row level security;
alter table subscription_payments enable row level security;
alter table vouchers              enable row level security;
alter table support_sessions      enable row level security;
alter table platform_audit        enable row level security;

create policy plans_read      on plans for select to authenticated using (true);
create policy admins_self     on platform_admins for select to authenticated using (user_id = auth.uid());

create policy tenants_read    on tenants for select to authenticated
  using (is_platform_admin() or is_tenant_member(id));
create policy tenants_admin_w on tenants for update to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

create policy members_read    on tenant_members for select to authenticated
  using (user_id = auth.uid() or is_platform_admin());

create policy branches_read   on branches for select to authenticated
  using (is_platform_admin() or is_tenant_member(tenant_id));
create policy devices_read    on devices for select to authenticated
  using (is_platform_admin() or is_tenant_member(tenant_id));
create policy devices_admin_w on devices for update to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

create policy pay_read        on subscription_payments for select to authenticated
  using (is_platform_admin() or is_tenant_member(tenant_id));
create policy vouchers_admin  on vouchers for select to authenticated using (is_platform_admin());

-- Owners can review every support access event on their business
create policy support_read    on support_sessions for select to authenticated
  using (is_platform_admin() or is_tenant_member(tenant_id));
create policy audit_admin     on platform_audit for select to authenticated using (is_platform_admin());
