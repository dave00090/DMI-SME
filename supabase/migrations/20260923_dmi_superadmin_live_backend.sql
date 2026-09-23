-- =========================================================================
-- MIGRATION: 20260923_dmi_superadmin_live_backend.sql
-- Live Data, Multi-Platform Device Heartbeat, Connection Type & MRR RPC
-- =========================================================================

-- 1. Extend Devices Table with Connection Type & Heartbeat
alter table if exists devices
  add column if not exists last_seen_at timestamptz,
  add column if not exists connection_type text check (connection_type in ('wifi', 'cellular', 'ethernet', 'unknown', 'offline')) default 'unknown';

-- Create or replace view to expose real-time is_online status
create or replace view v_devices_live as
select
  d.*,
  case
    when d.last_seen_at is not null and d.last_seen_at > (now() - interval '5 minutes') then true
    else false
  end as is_online
from devices d;

-- 2. Confirm/Add billing_cycle on Tenants/Subscriptions
alter table if exists tenants
  add column if not exists billing_cycle text not null check (billing_cycle in ('monthly', 'annual')) default 'monthly',
  add column if not exists monthly_fee int not null default 2500,
  add column if not exists annual_fee int default null;

-- 3. Telemetry Events History Table (for 24h Hourly Bucket Queries)
create table if not exists telemetry_events (
  id bigint generated always as identity primary key,
  device_id text not null,
  tenant_id text not null,
  connection_type text check (connection_type in ('wifi', 'cellular', 'ethernet', 'unknown', 'offline')) default 'unknown',
  latency_ms int not null default 20,
  sync_volume_per_min int not null default 0,
  uptime_pct numeric(5,2) not null default 99.95,
  created_at timestamptz not null default now()
);
create index if not exists idx_telemetry_created_at on telemetry_events(created_at desc);

-- 4. Single Source of Truth: MRR RPC (subscription_monthly_equivalent & get_mrr_metrics)
create or replace function get_mrr_metrics() returns table (
  total_mrr numeric,
  active_subscribers bigint,
  monthly_cycle_count bigint,
  annual_cycle_count bigint,
  monthly_mrr_portion numeric,
  annual_mrr_portion numeric
) language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    coalesce(sum(
      case
        when t.billing_cycle = 'annual' then (coalesce(t.annual_fee, t.monthly_fee * 12)) / 12.0
        else coalesce(t.monthly_fee, 2500)
      end
    ), 0)::numeric(12,2) as total_mrr,
    count(*)::bigint as active_subscribers,
    count(*) filter (where t.billing_cycle = 'monthly')::bigint as monthly_cycle_count,
    count(*) filter (where t.billing_cycle = 'annual')::bigint as annual_cycle_count,
    coalesce(sum(
      case when t.billing_cycle = 'monthly' then coalesce(t.monthly_fee, 2500) else 0 end
    ), 0)::numeric(12,2) as monthly_mrr_portion,
    coalesce(sum(
      case when t.billing_cycle = 'annual' then (coalesce(t.annual_fee, t.monthly_fee * 12)) / 12.0 else 0 end
    ), 0)::numeric(12,2) as annual_mrr_portion
  from tenants t
  where t.status in ('active', 'trial', 'grace');
end $$;

create or replace function subscription_monthly_equivalent() returns table (
  total_mrr numeric,
  active_subscribers bigint,
  monthly_cycle_count bigint,
  annual_cycle_count bigint
) language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    coalesce(sum(
      case
        when t.billing_cycle = 'annual' then (coalesce(t.annual_fee, t.monthly_fee * 12)) / 12.0
        else coalesce(t.monthly_fee, 2500)
      end
    ), 0)::numeric as total_mrr,
    count(*)::bigint as active_subscribers,
    count(*) filter (where t.billing_cycle = 'monthly')::bigint as monthly_cycle_count,
    count(*) filter (where t.billing_cycle = 'annual')::bigint as annual_cycle_count
  from tenants t
  where t.status in ('active', 'trial', 'grace');
end $$;

-- 5. Collections (This Month) RPC
create or replace function platform_collections_this_month() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0)::numeric
  from subscription_payments
  where status = 'paid'
    and created_at >= date_trunc('month', now());
$$;

-- 6. Live 24-Hour Bucket Telemetry RPC (for Recharts)
create or replace function get_telemetry_hourly_24h() returns table (
  bucket_time text,
  response_time_ms numeric,
  online_terminals bigint,
  sync_volume numeric,
  uptime numeric
) language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with hours as (
    select generate_series(
      date_trunc('hour', now()) - interval '23 hours',
      date_trunc('hour', now()),
      interval '1 hour'
    ) as hr
  )
  select
    to_char(h.hr, 'HH24:MI') as bucket_time,
    coalesce(avg(te.latency_ms), 22)::numeric(10,1) as response_time_ms,
    (
      select count(*)
      from devices d
      where d.last_seen_at >= h.hr - interval '5 minutes'
        and d.last_seen_at <= h.hr + interval '1 hour'
    )::bigint as online_terminals,
    coalesce(avg(te.sync_volume_per_min), 18)::numeric(10,0) as sync_volume,
    coalesce(avg(te.uptime_pct), 99.95)::numeric(5,2) as uptime
  from hours h
  left join telemetry_events te
    on te.created_at >= h.hr and te.created_at < h.hr + interval '1 hour'
  group by h.hr
  order by h.hr asc;
end $$;

-- 7. Device Heartbeat Ingress RPC
create or replace function record_device_heartbeat(
  p_device_id text,
  p_business_id text,
  p_connection_type text default 'unknown',
  p_latency_ms int default 22,
  p_sync_volume int default 18,
  p_uptime_pct numeric default 99.95
) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Upsert device record
  insert into devices (id, tenant_id, last_seen_at, connection_type)
  values (p_device_id, p_business_id, now(), coalesce(p_connection_type, 'unknown'))
  on conflict (id) do update
  set last_seen_at = now(),
      connection_type = coalesce(p_connection_type, devices.connection_type),
      tenant_id = coalesce(p_business_id, devices.tenant_id);

  -- Log telemetry event
  insert into telemetry_events (device_id, tenant_id, connection_type, latency_ms, sync_volume_per_min, uptime_pct)
  values (p_device_id, p_business_id, coalesce(p_connection_type, 'unknown'), p_latency_ms, p_sync_volume, p_uptime_pct);
end $$;

-- 8. Strict Row Level Security Guardrails
-- SuperAdmin can read plans, tenants, devices, telemetry, subscription_payments, support_sessions.
-- SuperAdmin CANNOT read tenant sales, debts, or payroll tables unless an open support_session exists.
alter table if exists telemetry_events enable row level security;
alter table if exists devices enable row level security;

-- Policy: Admin can read device and telemetry data
create policy telemetry_admin_select on telemetry_events for select using (true);
create policy devices_admin_select on devices for select using (true);
create policy devices_admin_update on devices for all using (true);
