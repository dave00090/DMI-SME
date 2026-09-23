/**
 * Live Supabase Platform API & SWR Query Hooks
 * Connects SuperAdmin Console directly to Postgres RPCs, Views, and Tables.
 */

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { supabase } from '../supabaseClient';
import type { DeviceConnectionType } from '../device/networkDetection';

export interface ConsoleDeviceRecord {
  id: string;
  name: string;
  connection_type: DeviceConnectionType;
  last_seen_at: string;
  is_online: boolean;
  app_version?: string;
}

export interface ConsoleClientRow {
  id: string;
  business_id: string;
  business_name: string;
  owner_name: string;
  contact_phone: string;
  city: string;
  installed_date: string;
  package: string;
  billing_cycle: 'monthly' | 'annual';
  monthly_fee: number;
  annual_fee?: number;
  license_key: string;
  status: 'active' | 'trial' | 'grace' | 'suspended';
  fleet_count: number;
  online_fleet_count: number;
  branches_count: number;
  last_payment_date: string | null;
  renewal_date: string;
  days_left?: number;
  devices?: ConsoleDeviceRecord[];
}

export interface MrrMetricsRow {
  total_mrr: number;
  active_subscribers: number;
  monthly_cycle_count: number;
  annual_cycle_count: number;
  monthly_mrr_portion: number;
  annual_mrr_portion: number;
}

export interface LivePlatformMetrics {
  totalBusinesses: number;
  activeCount: number;
  trialCount: number;
  gracePeriodCount: number;
  suspendedCount: number;
  mrrKes: number;
  monthlyCollectionsKes: number;
  failedPaymentsCount?: number;
  totalActiveDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  apiResponseTimeMs: number;
}

export interface TelemetryBucketRow {
  bucket_time: string;
  response_time_ms: number;
  online_terminals: number;
  sync_volume: number;
  uptime: number;
}

export interface CryptographicLicenseRow {
  licenseKey: string;
  businessId: string;
  businessName: string;
  tier: string;
  maxDevices: number;
  unlockedDevices: string[];
  requiredOnNewDevices: boolean;
  issuedDate: string;
  expiresDate: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface PlatformInvoiceRow {
  id: string;
  invoice_number: string;
  business_id: string;
  business_name: string;
  amount_kes: number;
  plan_tier: string;
  billing_cycle: 'monthly' | 'annual';
  payment_method: 'mpesa_stk' | 'mpesa_c2b' | 'bank_transfer' | 'voucher';
  mpesa_receipt: string;
  status: 'paid' | 'pending' | 'failed';
  due_date: string;
  paid_at: string;
}

export interface SupportAccessRow {
  id: string;
  admin_id: string;
  admin_name: string;
  business_id: string;
  business_name: string;
  reason: string;
  data_scopes: string[];
  actions: string;
  status: 'open' | 'closed';
  started_at: string;
  expires_at: string;
  ended_at?: string;
}

export interface AuthoritativePlan {
  id: string;
  name: string;
  monthly_fee: number;
  annual_fee: number;
  limits: {
    max_branches: number;
    max_devices: number;
    max_staff: number;
    max_products: number;
    offline_grace_days: number;
  };
}

// -------------------------------------------------------------
// 1. LIVE PLATFORM METRICS
// -------------------------------------------------------------
export async function fetchLivePlatformMetrics(): Promise<LivePlatformMetrics> {
  const start = performance.now();

  // Call MRR RPC
  let mrrKes = 0;
  try {
    const { data: mrrData } = await supabase.rpc('subscription_monthly_equivalent');
    if (mrrData && Array.isArray(mrrData) && mrrData[0]) {
      mrrKes = Number(mrrData[0].total_mrr) || 0;
    }
  } catch {
    // API fallback
    const res = await fetch('/api/saas/mrr').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      mrrKes = Number(data[0]?.total_mrr) || 0;
    }
  }

  // Call Collections RPC
  let monthlyCollectionsKes = 0;
  try {
    const { data: collData } = await supabase.rpc('platform_collections_this_month');
    if (collData !== null && collData !== undefined) {
      monthlyCollectionsKes = Number(collData) || 0;
    }
  } catch {
    const res = await fetch('/api/saas/collections').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      monthlyCollectionsKes = Number(data) || 0;
    }
  }

  // Fetch Clients list for active/grace/suspended breakdown
  let clients: ConsoleClientRow[] = [];
  try {
    const { data: clientsData } = await supabase.rpc('console_clients');
    if (clientsData && Array.isArray(clientsData)) {
      clients = clientsData;
    }
  } catch {
    const res = await fetch('/api/saas/tenants').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      clients = data || [];
    }
  }

  const activeCount = clients.filter((c) => c.status === 'active').length;
  const trialCount = clients.filter((c) => c.status === 'trial').length;
  const gracePeriodCount = clients.filter((c) => c.status === 'grace').length;
  const suspendedCount = clients.filter((c) => c.status === 'suspended').length;

  let totalDevices = 0;
  let onlineDevices = 0;
  clients.forEach((c) => {
    totalDevices += c.fleet_count || (c.devices?.length || 1);
    onlineDevices += c.online_fleet_count || (c.devices?.filter((d) => d.is_online).length || 0);
  });

  const latency = Math.round(performance.now() - start);

  return {
    totalBusinesses: clients.length,
    activeCount,
    trialCount,
    gracePeriodCount,
    suspendedCount,
    mrrKes,
    monthlyCollectionsKes,
    totalActiveDevices: totalDevices,
    onlineDevices,
    offlineDevices: Math.max(0, totalDevices - onlineDevices),
    apiResponseTimeMs: Math.max(16, latency),
  };
}

export function usePlatformMetricsSWR() {
  return useSWR<LivePlatformMetrics>('platform_metrics_live', fetchLivePlatformMetrics, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });
}

// -------------------------------------------------------------
// 1b. LIVE MRR METRICS RPC (get_mrr_metrics)
// -------------------------------------------------------------
export async function fetchMrrMetrics(): Promise<MrrMetricsRow> {
  try {
    const { data, error } = await supabase.rpc('get_mrr_metrics');
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row === 'object') {
        return {
          total_mrr: Number(row.total_mrr) || 0,
          active_subscribers: Number(row.active_subscribers) || 0,
          monthly_cycle_count: Number(row.monthly_cycle_count) || 0,
          annual_cycle_count: Number(row.annual_cycle_count) || 0,
          monthly_mrr_portion: Number(row.monthly_mrr_portion) || 0,
          annual_mrr_portion: Number(row.annual_mrr_portion) || 0,
        };
      }
    }
  } catch {}

  const res = await fetch('/api/saas/mrr-metrics');
  if (!res.ok) {
    const fallbackRes = await fetch('/api/rpc/get_mrr_metrics', { method: 'POST' });
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const row = Array.isArray(fbData) ? fbData[0] : fbData;
      return {
        total_mrr: Number(row.total_mrr) || 0,
        active_subscribers: Number(row.active_subscribers) || 0,
        monthly_cycle_count: Number(row.monthly_cycle_count) || 0,
        annual_cycle_count: Number(row.annual_cycle_count) || 0,
        monthly_mrr_portion: Number(row.monthly_mrr_portion) || 0,
        annual_mrr_portion: Number(row.annual_mrr_portion) || 0,
      };
    }
    throw new Error('Failed to fetch MRR metrics');
  }
  const json = await res.json();
  const m = json.mrr || {};
  return {
    total_mrr: Number(m.total_mrr) || 0,
    active_subscribers: Number(m.active_subscribers) || 0,
    monthly_cycle_count: Number(m.monthly_cycle_count) || 0,
    annual_cycle_count: Number(m.annual_cycle_count) || 0,
    monthly_mrr_portion: Number(m.monthly_mrr_portion) || 0,
    annual_mrr_portion: Number(m.annual_mrr_portion) || 0,
  };
}

export function useMrrMetricsSWR() {
  return useSWR<MrrMetricsRow>('platform_mrr_metrics', fetchMrrMetrics, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });
}

// -------------------------------------------------------------
// 1c. SUPABASE REALTIME SUBSCRIPTION FOR 'Subscribers' & 'Fleet Terminals'
// -------------------------------------------------------------
export function usePlatformRealtimeSubscription(callbacks?: {
  onTenantChange?: () => void;
  onDeviceChange?: () => void;
  onTelemetryChange?: () => void;
}) {
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  useEffect(() => {
    // 1. Supabase Postgres Realtime Channel for 'tenants' & 'devices'
    const channel = supabase
      .channel('platform_admin_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tenants' },
        () => {
          mutate('platform_metrics_live');
          mutate('platform_mrr_metrics');
          mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
          mutate('crypto_licenses');
          callbacks?.onTenantChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          mutate('platform_metrics_live');
          mutate('platform_mrr_metrics');
          mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
          callbacks?.onTenantChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        () => {
          mutate('platform_metrics_live');
          mutate('telemetry_hourly_24h');
          mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
          callbacks?.onDeviceChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleet_terminals' },
        () => {
          mutate('platform_metrics_live');
          mutate('telemetry_hourly_24h');
          mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
          callbacks?.onDeviceChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'telemetry_events' },
        () => {
          mutate('telemetry_hourly_24h');
          mutate('platform_metrics_live');
          callbacks?.onTelemetryChange?.();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        }
      });

    // 2. Full-Stack SSE Realtime Stream for instant dev environment synchronization
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/platform/realtime-stream');
      eventSource.onopen = () => {
        setIsRealtimeActive(true);
      };
      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.table === 'tenants') {
            mutate('platform_metrics_live');
            mutate('platform_mrr_metrics');
            mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
            mutate('crypto_licenses');
            callbacks?.onTenantChange?.();
          } else if (event.table === 'devices') {
            mutate('platform_metrics_live');
            mutate('telemetry_hourly_24h');
            mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
            callbacks?.onDeviceChange?.();
          } else if (event.table === 'telemetry_events') {
            mutate('telemetry_hourly_24h');
            mutate('platform_metrics_live');
            callbacks?.onTelemetryChange?.();
          }
        } catch {}
      };
    } catch {}

    return () => {
      supabase.removeChannel(channel);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return { isRealtimeActive };
}

// -------------------------------------------------------------
// 2. LIVE 24H TELEMETRY HOURLY BUCKETS
// -------------------------------------------------------------
export async function fetchLiveTelemetryHourly(): Promise<TelemetryBucketRow[]> {
  try {
    const { data, error } = await supabase.rpc('get_telemetry_hourly_24h');
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const res = await fetch('/api/saas/telemetry-24h');
  if (!res.ok) throw new Error('Failed to fetch 24h telemetry series');
  const json = await res.json();
  return json.telemetry || [];
}

export function useTelemetryHourlySWR() {
  return useSWR<TelemetryBucketRow[]>('telemetry_hourly_24h', fetchLiveTelemetryHourly, {
    refreshInterval: 20000,
    revalidateOnFocus: true,
  });
}

// -------------------------------------------------------------
// 3. SUBSCRIBERS / TENANTS TABLE
// -------------------------------------------------------------
export async function fetchConsoleClients(search?: string, status?: string): Promise<ConsoleClientRow[]> {
  try {
    const { data, error } = await supabase.rpc('console_clients', {
      search: search || '',
      status: status || 'all',
    });
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch {}

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (status && status !== 'all') queryParams.set('status', status);

  const res = await fetch(`/api/saas/businesses?${queryParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch business tenants');
  const json = await res.json();
  return json.businesses || [];
}

export function useConsoleClientsSWR(search: string = '', status: string = 'all') {
  return useSWR<ConsoleClientRow[]>(
    ['console_clients', search, status],
    () => fetchConsoleClients(search, status),
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    }
  );
}

// -------------------------------------------------------------
// 4. CRYPTOGRAPHIC LICENSES
// -------------------------------------------------------------
export async function fetchCryptographicLicenses(): Promise<CryptographicLicenseRow[]> {
  try {
    const { data, error } = await supabase.rpc('console_licenses');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch {}

  const res = await fetch('/api/saas/cryptographic-licenses');
  if (!res.ok) throw new Error('Failed to fetch cryptographic licenses');
  const json = await res.json();
  return json.licenses || [];
}

export function useLicensesSWR() {
  return useSWR<CryptographicLicenseRow[]>('crypto_licenses', fetchCryptographicLicenses, {
    refreshInterval: 20000,
  });
}

// -------------------------------------------------------------
// 5. PAYMENTS LEDGER
// -------------------------------------------------------------
export async function fetchPaymentsLedger(): Promise<PlatformInvoiceRow[]> {
  try {
    const { data, error } = await supabase.rpc('console_invoices');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch {}

  const res = await fetch('/api/saas/invoices');
  if (!res.ok) throw new Error('Failed to fetch payment ledger');
  const json = await res.json();
  return json.invoices || [];
}

export function usePaymentsLedgerSWR() {
  return useSWR<PlatformInvoiceRow[]>('payments_ledger', fetchPaymentsLedger, {
    refreshInterval: 15000,
  });
}

// -------------------------------------------------------------
// 6. SUPPORT ACCESS SESSIONS
// -------------------------------------------------------------
export async function fetchSupportSessions(): Promise<SupportAccessRow[]> {
  try {
    const { data, error } = await supabase.rpc('console_support_logs');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch {}

  const res = await fetch('/api/saas/support-access/logs');
  if (!res.ok) throw new Error('Failed to fetch support logs');
  const json = await res.json();
  return json.logs || [];
}

export function useSupportSessionsSWR() {
  return useSWR<SupportAccessRow[]>('support_sessions', fetchSupportSessions, {
    refreshInterval: 10000,
  });
}

// -------------------------------------------------------------
// 7. PLANS TABLE
// -------------------------------------------------------------
export async function fetchPlans(): Promise<AuthoritativePlan[]> {
  try {
    const { data, error } = await supabase.from('plans').select('*');
    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        monthly_fee: p.monthly_fee || 2500,
        annual_fee: p.annual_fee || (p.monthly_fee ? p.monthly_fee * 10 : 25000),
        limits: {
          max_branches: p.max_branches || 1,
          max_devices: p.max_devices || 2,
          max_staff: p.max_staff || 3,
          max_products: p.max_products || 500,
          offline_grace_days: p.offline_grace_days || 3,
        },
      }));
    }
  } catch {}

  const res = await fetch('/api/plans');
  if (!res.ok) throw new Error('Failed to fetch plans');
  const plans = await res.json();
  return plans.map((p: any) => ({
    id: p.id,
    name: p.name,
    monthly_fee: p.monthly_fee,
    annual_fee: p.annual_fee,
    limits: {
      max_branches: p.max_branches,
      max_devices: p.max_devices,
      max_staff: p.max_staff,
      max_products: p.max_products,
      offline_grace_days: p.offline_grace_days,
    },
  }));
}

export function usePlansSWR() {
  return useSWR<AuthoritativePlan[]>('authoritative_plans', fetchPlans, {
    revalidateOnFocus: false,
  });
}

// -------------------------------------------------------------
// 8. ROW MUTATIONS (with optimistic updates and audit writes)
// -------------------------------------------------------------
export async function setClientSuspension(businessId: string, suspend: boolean) {
  try {
    await supabase.rpc('admin_set_suspension', {
      p_business: businessId,
      p_suspend: suspend,
    });
  } catch {
    await fetch('/api/rpc/admin_set_suspension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_business: businessId, p_suspend: suspend }),
    });
  }

  // Invalidate queries
  mutate('platform_metrics_live');
  mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
}

export async function grantClientGrace(businessId: string, days: number = 7) {
  try {
    await supabase.rpc('admin_grant_grace', {
      p_business: businessId,
      p_days: days,
    });
  } catch {
    await fetch('/api/rpc/admin_grant_grace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_business: businessId, p_days: days }),
    });
  }

  mutate('platform_metrics_live');
  mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
}

export async function updateClientPlan(
  businessId: string,
  plan: string,
  billingCycle: 'monthly' | 'annual',
  fee: number
) {
  try {
    await supabase.rpc('admin_update_client_plan', {
      p_business: businessId,
      p_plan: plan.toLowerCase(),
      p_billing_cycle: billingCycle,
      p_fee: fee,
    });
  } catch {
    await fetch('/api/rpc/admin_update_client_plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_business: businessId,
        p_plan: plan.toLowerCase(),
        p_billing_cycle: billingCycle,
        p_fee: fee,
      }),
    });
  }

  mutate('platform_metrics_live');
  mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
}

export async function registerNewClient(payload: {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  location: string;
  subscriptionPlan: string;
  billing_cycle: 'monthly' | 'annual';
}) {
  const res = await fetch('/api/saas/businesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to register business tenant');
  const data = await res.json();

  mutate('platform_metrics_live');
  mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
  mutate('crypto_licenses');
  return data;
}

export async function createCryptographicLicense(payload: CryptographicLicenseRow) {
  const res = await fetch('/api/saas/cryptographic-licenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create cryptographic license');
  const data = await res.json();

  mutate('crypto_licenses');
  mutate((key) => Array.isArray(key) && key[0] === 'console_clients');
  return data;
}

export async function startAuditedSupportSession(
  businessId: string,
  reason: string,
  scopes: string[] = ['Sales transactions', 'Sales reports']
) {
  const res = await fetch('/api/saas/support-session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_business: businessId,
      p_reason: reason,
      p_scopes: scopes,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start support session');
  }
  mutate('support_sessions');
  return res.json();
}

export async function closeAuditedSupportSession(sessionId: string) {
  const res = await fetch('/api/saas/support-session/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_session_id: sessionId }),
  });
  if (!res.ok) throw new Error('Failed to close support session');
  mutate('support_sessions');
}
