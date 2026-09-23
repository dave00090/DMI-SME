-- 002: align the platform backend with DeveloperConsoleModal.tsx
-- Run AFTER 001. Rebuilds `vouchers` (assumes none issued yet) and drops plans.monthly_fee / yearly_fee.

-- ============ 1. MFA enforced in the database ============
-- Every admin policy and RPC calls is_platform_admin(); it now requires an AAL2 (TOTP-verified) session.
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- ============ 2. Plans: limits + per-duration prices (server is the only source of truth) ============
alter table plans
  add column if not exists max_products int not null default 500,
  add column if not exists max_staff int not null default 3,
  add column if not exists offline_grace_days int not null default 3;

update plans set max_branches = 1,  max_devices = 2,   max_staff = 3,   max_products = 500,   offline_grace_days = 3  where id = 'starter';
update plans set max_branches = 5,  max_devices = 15,  max_staff = 25,  max_products = 5000,  offline_grace_days = 7  where id = 'business';
update plans set max_branches = 50, max_devices = 200, max_staff = 500, max_products = 50000, offline_grace_days = 30 where id = 'enterprise';

create table if not exists plan_prices (
  plan_id       text references plans(id) on delete cascade,
  duration_days int  check (duration_days in (7, 30, 90, 365)),
  price_kes     int  not null check (price_kes > 0),
  primary key (plan_id, duration_days)
);
insert into plan_prices (plan_id, duration_days, price_kes) values
  ('starter',    7,    800), ('starter',    30,  2500), ('starter',    90,  7000), ('starter',    365,  25000),
  ('business',   7,   2200), ('business',   30,  7500), ('business',   90, 21000), ('business',   365,  75000),
  ('enterprise', 7,   7000), ('enterprise', 30, 25000), ('enterprise', 90, 70000), ('enterprise', 365, 250000)
on conflict (plan_id, duration_days) do nothing;
alter table plan_prices enable row level security;
drop policy if exists prices_read on plan_prices;
create policy prices_read on plan_prices for select to authenticated using (true);

-- ============ 3. Tenants: the fields the console shows ============
alter table tenants
  add column if not exists business_code text unique default ('BUS-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6))),
  add column if not exists city text,
  add column if not exists license_key text,
  add column if not exists monthly_fee int not null default 0,   -- agreed fee, may differ from list price
  add column if not exists last_payment_at timestamptz;

create or replace function extend_subscription(p_tenant uuid, p_plan text, p_days int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update tenants
     set plan_id = p_plan, status = 'active',
         expires_at = greatest(now(), expires_at) + make_interval(days => p_days),
         last_payment_at = now()
   where id = p_tenant;
  insert into platform_audit(action, detail)
  values ('extend_subscription', jsonb_build_object('tenant', p_tenant, 'plan', p_plan, 'days', p_days));
end $$;
revoke all on function extend_subscription(uuid, text, int) from public, anon, authenticated;
grant execute on function extend_subscription(uuid, text, int) to service_role;

-- KPI strip: MRR now comes from the agreed per-client fee (as the console does today)
create or replace function platform_metrics() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'subscribers',       count(*),
    'active',            count(*) filter (where status = 'active'),
    'grace',             count(*) filter (where status = 'grace'),
    'suspended',         count(*) filter (where status = 'suspended'),
    'mrr',               coalesce(sum(monthly_fee) filter (where status = 'active'), 0),
    'collections_month', (select coalesce(sum(amount), 0) from subscription_payments
                           where status = 'paid' and verified_at >= date_trunc('month', now())),
    'terminals',         (select count(*) from devices where authorized),
    'terminals_online',  (select count(*) from devices where authorized and last_seen_at > now() - interval '5 minutes')
  ) into r from tenants where deleted_at is null;
  return r;
end $$;

alter table plans drop column if exists monthly_fee, drop column if exists yearly_fee;

-- ============ 4. "Sold Clients" tab ============
create or replace function console_clients() returns table (
  id uuid, business_id text, business_name text, owner_name text, contact_phone text, city text,
  installed_date date, package text, monthly_fee int, license_key text, status text,
  fleet_count bigint, branches_count bigint, last_payment_date timestamptz, renewal_date timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return query
  select t.id, t.business_code, t.name, t.owner_name, t.owner_phone, t.city, t.created_at::date,
         initcap(t.plan_id), t.monthly_fee, t.license_key, t.status::text,
         (select count(*) from devices d where d.tenant_id = t.id and d.authorized),
         (select count(*) from branches b where b.tenant_id = t.id),
         t.last_payment_at, t.expires_at
    from tenants t where t.deleted_at is null order by t.created_at desc;
end $$;
grant execute on function console_clients() to authenticated;

create or replace function admin_register_client(p_name text, p_owner text, p_phone text, p_city text, p_plan text, p_fee int)
returns text language plpgsql security definer set search_path = public as $$
declare code text;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  insert into tenants(name, owner_name, owner_phone, city, plan_id, monthly_fee, status, expires_at, last_payment_at)
  values (p_name, p_owner, p_phone, p_city, p_plan, p_fee, 'active', now() + interval '30 days', now())
  returning business_code into code;
  -- Display key only. Real licence signing (Ed25519) must happen in an edge function, never in the browser.
  update tenants set license_key = 'DMI-LIC-' || upper(left(p_plan, 3)) || '-' || replace(code, 'BUS-', '') || '-ACT'
   where business_code = code;
  insert into platform_audit(actor, action, detail) values (auth.uid(), 'register_client', jsonb_build_object('business', code, 'plan', p_plan));
  return code;
end $$;
grant execute on function admin_register_client(text, text, text, text, text, int) to authenticated;

create or replace function admin_update_client_plan(p_business text, p_plan text, p_fee int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  update tenants set plan_id = p_plan, monthly_fee = p_fee where business_code = p_business;
  insert into platform_audit(actor, action, detail) values (auth.uid(), 'update_plan', jsonb_build_object('business', p_business, 'plan', p_plan, 'fee', p_fee));
end $$;
grant execute on function admin_update_client_plan(text, text, int) to authenticated;

create or replace function admin_set_suspension(p_business text, p_suspend boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  update tenants
     set status = case when p_suspend then 'suspended'::tenant_status else 'active'::tenant_status end
   where business_code = p_business;
  insert into platform_audit(actor, action, detail) values (auth.uid(), case when p_suspend then 'suspend' else 'reactivate' end, jsonb_build_object('business', p_business));
end $$;
grant execute on function admin_set_suspension(text, boolean) to authenticated;

-- Manual payment confirmation: a real 10-char M-Pesa receipt is mandatory and can only be used once.
create or replace function admin_record_payment(p_business text, p_amount int, p_receipt text) returns void
language plpgsql security definer set search_path = public as $$
declare t tenants%rowtype; floor_price int;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  p_receipt := upper(trim(p_receipt));
  if p_receipt !~ '^[A-Z0-9]{10}$' then raise exception 'invalid M-Pesa receipt code'; end if;
  select * into t from tenants where business_code = p_business;
  if not found then raise exception 'unknown business'; end if;
  select coalesce(nullif(t.monthly_fee, 0), price_kes) into floor_price
    from plan_prices where plan_id = t.plan_id and duration_days = 30;
  if p_amount < floor_price then raise exception 'amount below agreed fee (%)', floor_price; end if;
  insert into subscription_payments(tenant_id, plan_id, period_days, amount, method, mpesa_receipt, status, verified_at, created_by)
  values (t.id, t.plan_id, 30, p_amount, 'manual', p_receipt, 'paid', now(), auth.uid());   -- unique(mpesa_receipt) blocks reuse
  perform extend_subscription(t.id, t.plan_id, 30);
  insert into platform_audit(actor, action, detail) values (auth.uid(), 'manual_payment', jsonb_build_object('business', p_business, 'receipt', p_receipt, 'amount', p_amount));
end $$;
grant execute on function admin_record_payment(text, int, text) to authenticated;

-- ============ 5. Vouchers: HMAC-hashed at rest, plaintext shown once ============
drop function if exists redeem_voucher(uuid, text);
drop function if exists generate_vouchers(text, int, int);
drop table if exists vouchers cascade;

create table vouchers (
  id                   uuid primary key default gen_random_uuid(),
  token_hash           text unique not null,
  masked_prefix        text not null,
  plan_id              text not null references plans(id),
  duration_days        int  not null,
  price_kes            int  not null,
  status               text not null default 'available' check (status in ('available','redeemed','expired','revoked')),
  mpesa_receipt        text unique,
  etims_invoice_number text,
  created_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  redeemed_tenant      uuid references tenants(id),
  redeemed_at          timestamptz
);
alter table vouchers enable row level security;
create policy vouchers_admin on vouchers for select to authenticated using (is_platform_admin());

create table voucher_orders (            -- STK-push voucher sales
  checkout_request_id text primary key,
  plan_id             text not null references plans(id),
  duration_days       int  not null,
  amount              int  not null,
  phone               text not null,
  buyer_name          text,
  status              text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  error               text,
  voucher_id          uuid references vouchers(id),
  token_once          text,               -- plaintext, scrubbed shortly after the console picks it up
  delivered_at        timestamptz,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now()
);
alter table voucher_orders enable row level security;   -- no policies: service role + RPCs only

create or replace function console_vouchers() returns table (
  id uuid, masked_prefix text, tier text, duration_days int, price_kes int, mpesa_receipt text,
  etims_invoice_number text, generated_at timestamptz, status text, redeemed_by_business_id text
) language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return query
  select v.id, v.masked_prefix, initcap(v.plan_id), v.duration_days, v.price_kes, v.mpesa_receipt,
         v.etims_invoice_number, v.created_at, v.status, t.business_code
    from vouchers v left join tenants t on t.id = v.redeemed_tenant
   order by v.created_at desc limit 500;
end $$;
grant execute on function console_vouchers() to authenticated;

create or replace function admin_revoke_voucher(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  update vouchers set status = 'revoked' where id = p_id and status = 'available';
  insert into platform_audit(actor, action, detail) values (auth.uid(), 'revoke_voucher', jsonb_build_object('voucher', p_id));
end $$;
grant execute on function admin_revoke_voucher(uuid) to authenticated;

-- Called only by the voucher-engine edge function (which computes the HMAC with a server secret)
create or replace function redeem_voucher_hash(p_tenant uuid, p_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v vouchers%rowtype;
begin
  select * into v from vouchers where token_hash = p_hash for update;
  if not found or v.status <> 'available' then raise exception 'invalid or already used voucher'; end if;
  update vouchers set status = 'redeemed', redeemed_tenant = p_tenant, redeemed_at = now() where id = v.id;
  perform extend_subscription(p_tenant, v.plan_id, v.duration_days);
  insert into subscription_payments(tenant_id, plan_id, period_days, amount, method, status, verified_at)
  values (p_tenant, v.plan_id, v.duration_days, v.price_kes, 'voucher', 'paid', now());
  return jsonb_build_object('plan', v.plan_id, 'days', v.duration_days);
end $$;
revoke all on function redeem_voucher_hash(uuid, text) from public, anon, authenticated;
grant execute on function redeem_voucher_hash(uuid, text) to service_role;

-- Console polls this after an STK push
create or replace function poll_voucher_order(p_checkout text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o voucher_orders%rowtype; v vouchers%rowtype;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select * into o from voucher_orders where checkout_request_id = p_checkout for update;
  if not found then return jsonb_build_object('status', 'failed', 'error', 'order not found'); end if;
  if o.status = 'completed' then
    update voucher_orders set delivered_at = coalesce(delivered_at, now()) where checkout_request_id = p_checkout;
    select * into v from vouchers where id = o.voucher_id;
    return jsonb_build_object('status', 'completed', 'voucherResult', jsonb_build_object(
      'token', o.token_once,
      'voucher', jsonb_build_object('mpesa_receipt', v.mpesa_receipt, 'etims_invoice_number', v.etims_invoice_number)));
  end if;
  return jsonb_build_object('status', o.status, 'error', o.error);
end $$;
grant execute on function poll_voucher_order(text) to authenticated;

-- ============ 6. Remote repair command channel ============
create table if not exists maintenance_commands (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null,               -- business_code (or 'BUS-MASTER')
  type        text not null check (type in ('lag_fix','vacuum_db','release_sync_lock','restore_snapshot',
                                            'safe_reboot','reindex_ledgers','repair_license_keys','full_diagnostic_repair')),
  status      text not null default 'queued' check (status in ('queued','running','completed','failed','expired')),
  issued_by   text not null,
  result      jsonb,
  created_at  timestamptz not null default now(),
  started_at  timestamptz,
  finished_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '10 minutes')
);
create index if not exists idx_cmd_tenant on maintenance_commands(tenant_id, created_at desc);
alter table maintenance_commands enable row level security;
create policy cmd_read on maintenance_commands for select to authenticated using (
  is_platform_admin() or exists (select 1 from tenants t join tenant_members m on m.tenant_id = t.id
                                  where t.business_code = maintenance_commands.tenant_id and m.user_id = auth.uid()));

-- Commands that touch a tenant's local business data need an open, reasoned support session.
create or replace function admin_queue_command(p_tenant text, p_type text) returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid; cid uuid;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select id into tid from tenants where business_code = p_tenant;
  if tid is null and p_tenant <> 'BUS-MASTER' then raise exception 'unknown business'; end if;
  if p_type in ('vacuum_db','restore_snapshot','reindex_ledgers','full_diagnostic_repair') then
    if not exists (select 1 from support_sessions
                    where admin_id = auth.uid() and tenant_id = tid and status = 'open' and expires_at > now()) then
      raise exception 'open a support session (with a reason) before running % on this tenant', p_type;
    end if;
  end if;
  insert into maintenance_commands(tenant_id, type, issued_by)
  values (p_tenant, p_type, coalesce(auth.jwt() ->> 'email', 'admin')) returning id into cid;
  insert into platform_audit(actor, action, detail) values (auth.uid(), 'queue_command', jsonb_build_object('tenant', p_tenant, 'type', p_type, 'id', cid));
  return cid;
end $$;
grant execute on function admin_queue_command(text, text) to authenticated;

create or replace function admin_start_support(p_business text, p_reason text, p_scopes text[]) returns bigint
language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  select id into tid from tenants where business_code = p_business;
  if tid is null then raise exception 'unknown business'; end if;
  return start_support_session(tid, p_reason, p_scopes);
end $$;
grant execute on function admin_start_support(text, text, text[]) to authenticated;

-- Terminal reports progress; only legal transitions, only for its own tenant.
create or replace function terminal_update_command(p_id uuid, p_status text, p_result jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c maintenance_commands%rowtype;
begin
  select * into c from maintenance_commands where id = p_id for update;
  if not found or not exists (select 1 from tenants t join tenant_members m on m.tenant_id = t.id
                               where t.business_code = c.tenant_id and m.user_id = auth.uid()) then
    raise exception 'not allowed';
  end if;
  if c.expires_at < now() and c.status = 'queued' then
    update maintenance_commands set status = 'expired' where id = p_id; return;
  end if;
  if (c.status, p_status) not in (('queued','running'), ('running','completed'), ('running','failed')) then
    raise exception 'illegal transition % -> %', c.status, p_status;
  end if;
  update maintenance_commands
     set status = p_status, result = coalesce(p_result, result),
         started_at  = case when p_status = 'running' then now() else started_at end,
         finished_at = case when p_status in ('completed','failed') then now() else finished_at end
   where id = p_id;
end $$;
grant execute on function terminal_update_command(uuid, text, jsonb) to authenticated;

-- ============ 7. Real "outskirts" telemetry, reported by each terminal ============
create table if not exists device_telemetry (
  device_id         uuid primary key references devices(id) on delete cascade,
  tenant_id         uuid not null references tenants(id) on delete cascade,
  event_loop_lag_ms int, memory_mb int, storage_mb int, fragmentation_pct numeric(5,2),
  pending_sync int, network_latency_ms int, crashes int, uptime_hours numeric(8,1),
  reported_at       timestamptz not null default now()
);
alter table device_telemetry enable row level security;   -- access via RPCs only

create or replace function terminal_report_telemetry(p_device uuid, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare d devices%rowtype;
begin
  select * into d from devices where id = p_device;
  if not found or not is_tenant_member(d.tenant_id) then raise exception 'not allowed'; end if;
  insert into device_telemetry(device_id, tenant_id, event_loop_lag_ms, memory_mb, storage_mb, fragmentation_pct,
                               pending_sync, network_latency_ms, crashes, uptime_hours, reported_at)
  values (p_device, d.tenant_id, (p_payload->>'eventLoopLagMs')::int, (p_payload->>'memoryUsageMb')::int,
          (p_payload->>'storageUsageMb')::int, (p_payload->>'storageFragmentationPct')::numeric,
          (p_payload->>'pendingSyncQueue')::int, (p_payload->>'networkLatencyMs')::int,
          (p_payload->>'crashesCount')::int, (p_payload->>'systemUptimeHours')::numeric, now())
  on conflict (device_id) do update set
    event_loop_lag_ms = excluded.event_loop_lag_ms, memory_mb = excluded.memory_mb, storage_mb = excluded.storage_mb,
    fragmentation_pct = excluded.fragmentation_pct, pending_sync = excluded.pending_sync,
    network_latency_ms = excluded.network_latency_ms, crashes = excluded.crashes,
    uptime_hours = excluded.uptime_hours, reported_at = now();
  update devices set last_seen_at = now(), app_version = coalesce(p_payload->>'appVersion', app_version) where id = p_device;
end $$;
grant execute on function terminal_report_telemetry(uuid, jsonb) to authenticated;

create or replace function console_telemetry(p_business text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'devices', count(*),
    'eventLoopLagMs', coalesce(max(event_loop_lag_ms), 0),
    'memoryUsageMb', coalesce(max(memory_mb), 0),
    'storageUsageMb', coalesce(max(storage_mb), 0),
    'storageFragmentationPct', coalesce(max(fragmentation_pct), 0),
    'pendingSyncQueue', coalesce(sum(pending_sync), 0),
    'networkLatencyMs', coalesce(max(network_latency_ms), 0),
    'crashesCount', coalesce(sum(crashes), 0),
    'systemUptimeHours', coalesce(min(uptime_hours), 0),
    'lastReportedAt', max(reported_at)
  ) into r
  from device_telemetry x join tenants t on t.id = x.tenant_id where t.business_code = p_business;
  return r;
end $$;
grant execute on function console_telemetry(text) to authenticated;

-- ============ 8. Housekeeping (schedule every 5 minutes with pg_cron) ============
create or replace function platform_housekeeping() returns void
language sql security definer set search_path = public as $$
  update voucher_orders set token_once = null
   where token_once is not null and (delivered_at < now() - interval '15 minutes' or created_at < now() - interval '24 hours');
  update maintenance_commands set status = 'expired' where status = 'queued' and expires_at < now();
  update support_sessions set status = 'expired', ended_at = expires_at where status = 'open' and expires_at < now();
$$;
revoke all on function platform_housekeeping() from public, anon, authenticated;
-- select cron.schedule('dmi-housekeeping', '*/5 * * * *', $$select public.platform_housekeeping()$$);
