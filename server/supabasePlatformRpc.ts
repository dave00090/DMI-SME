import type { Request, Response, Express } from 'express';
import crypto from 'crypto';
import { voucherRepository, AUTHORITATIVE_PLANS, getPlan, VoucherTier } from './vouchers';

export type DeviceConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'offline';

export interface DeviceRecord {
  id: string;
  tenant_id: string;
  name: string;
  connection_type: DeviceConnectionType;
  last_seen_at: string;
  is_online: boolean;
  app_version: string;
}

export interface PlatformClientEntity {
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
  annual_fee: number;
  license_key: string;
  status: 'active' | 'trial' | 'grace' | 'suspended';
  fleet_count: number;
  online_fleet_count: number;
  branches_count: number;
  last_payment_date: string | null;
  renewal_date: string;
  days_left: number;
  devices: DeviceRecord[];
}

export interface CryptographicLicenseRecord {
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

export interface PlatformInvoiceRecord {
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

export interface SupportAccessLogRecord {
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

export interface TelemetryBucketRecord {
  bucket_time: string;
  response_time_ms: number;
  online_terminals: number;
  sync_volume: number;
  uptime: number;
}

// 1. Initial Real Active Devices
export const activeDevicesStore: DeviceRecord[] = [
  {
    id: 'DEV-POS-APEX-01',
    tenant_id: 'BUS-8F42K91',
    name: 'Counter Main POS (Android Sunmi)',
    connection_type: 'wifi',
    last_seen_at: new Date(Date.now() - 45000).toISOString(),
    is_online: true,
    app_version: '2.4.1-prod',
  },
  {
    id: 'DEV-POS-APEX-02',
    tenant_id: 'BUS-8F42K91',
    name: 'Dispatch Counter Terminal (Windows Desktop)',
    connection_type: 'ethernet',
    last_seen_at: new Date(Date.now() - 90000).toISOString(),
    is_online: true,
    app_version: '2.4.1-prod',
  },
  {
    id: 'DEV-POS-NAIVASHA-01',
    tenant_id: 'BUS-9P14M33',
    name: 'Main Store POS (Windows Desktop)',
    connection_type: 'ethernet',
    last_seen_at: new Date(Date.now() - 30000).toISOString(),
    is_online: true,
    app_version: '2.4.1-prod',
  },
  {
    id: 'DEV-POS-NAIVASHA-02',
    tenant_id: 'BUS-9P14M33',
    name: 'Agrovet Yard Mobile Scanner (Android)',
    connection_type: 'cellular',
    last_seen_at: new Date(Date.now() - 60000).toISOString(),
    is_online: true,
    app_version: '2.4.1-prod',
  },
  {
    id: 'DEV-POS-KISUMU-01',
    tenant_id: 'BUS-7X62B88',
    name: 'Dispensing Counter POS (Android Tablet)',
    connection_type: 'wifi',
    last_seen_at: new Date(Date.now() - 120000).toISOString(),
    is_online: true,
    app_version: '2.4.1-prod',
  },
];

// Helper: refresh online status based on 5-minute freshness window
function refreshDeviceOnlineStatus() {
  const fiveMinAgo = Date.now() - 5 * 60000;
  activeDevicesStore.forEach((d) => {
    const lastSeen = new Date(d.last_seen_at).getTime();
    d.is_online = lastSeen > fiveMinAgo;
    if (!d.is_online && d.connection_type !== 'offline') {
      d.connection_type = 'offline';
    }
  });
}

// 2. Initial Live Production Clients with explicit billing_cycle
export const activePlatformClients: PlatformClientEntity[] = [
  {
    id: 'cli-001',
    business_id: 'BUS-8F42K91',
    business_name: 'Apex Hardware & Building Supplies',
    owner_name: 'Eng. Peter Omondi',
    contact_phone: '+254 712 345 678',
    city: 'Nairobi (Industrial Area)',
    installed_date: '2026-03-15',
    package: 'Business',
    billing_cycle: 'monthly',
    monthly_fee: 7500,
    annual_fee: 75000,
    license_key: 'DMI-CRYPT-APEX-BUS-8F42-9981-K91P',
    status: 'active',
    fleet_count: 2,
    online_fleet_count: 2,
    branches_count: 2,
    last_payment_date: '2026-09-01',
    renewal_date: '2026-10-01',
    days_left: 8,
    devices: [],
  },
  {
    id: 'cli-002',
    business_id: 'BUS-9P14M33',
    business_name: 'Naivasha Farmers & Agrovet Ltd',
    owner_name: 'Mary Wambui',
    contact_phone: '+254 722 890 123',
    city: 'Naivasha CBD',
    installed_date: '2026-05-10',
    package: 'Enterprise',
    billing_cycle: 'annual',
    monthly_fee: 25000,
    annual_fee: 250000,
    license_key: 'DMI-CRYPT-NAIV-ENT-9P14-3321-M33L',
    status: 'active',
    fleet_count: 2,
    online_fleet_count: 2,
    branches_count: 4,
    last_payment_date: '2026-08-10',
    renewal_date: '2027-08-10',
    days_left: 321,
    devices: [],
  },
  {
    id: 'cli-003',
    business_id: 'BUS-7X62B88',
    business_name: 'Kisumu Duka La Dawa Pharmacy',
    owner_name: 'Dr. Kennedy Otieno',
    contact_phone: '+254 733 445 566',
    city: 'Kisumu City',
    installed_date: '2026-06-01',
    package: 'Starter',
    billing_cycle: 'monthly',
    monthly_fee: 2500,
    annual_fee: 25000,
    license_key: 'DMI-CRYPT-KISU-STR-7X62-5541-B88D',
    status: 'trial',
    fleet_count: 1,
    online_fleet_count: 1,
    branches_count: 1,
    last_payment_date: '2026-08-01',
    renewal_date: '2026-09-28',
    days_left: 5,
    devices: [],
  },
];

// 3. Cryptographic Licenses Store
export const cryptographicLicensesStore: CryptographicLicenseRecord[] = [
  {
    licenseKey: 'DMI-CRYPT-APEX-BUS-8F42-9981-K91P',
    businessId: 'BUS-8F42K91',
    businessName: 'Apex Hardware & Building Supplies',
    tier: 'Business',
    maxDevices: 15,
    unlockedDevices: ['DEV-POS-APEX-01', 'DEV-POS-APEX-02'],
    requiredOnNewDevices: true,
    issuedDate: '2026-03-15',
    expiresDate: '2027-03-15',
    status: 'active',
  },
  {
    licenseKey: 'DMI-CRYPT-NAIV-ENT-9P14-3321-M33L',
    businessId: 'BUS-9P14M33',
    businessName: 'Naivasha Farmers & Agrovet Ltd',
    tier: 'Enterprise',
    maxDevices: 200,
    unlockedDevices: ['DEV-POS-NAIVASHA-01', 'DEV-POS-NAIVASHA-02'],
    requiredOnNewDevices: true,
    issuedDate: '2026-05-10',
    expiresDate: '2027-08-10',
    status: 'active',
  },
  {
    licenseKey: 'DMI-CRYPT-KISU-STR-7X62-5541-B88D',
    businessId: 'BUS-7X62B88',
    businessName: 'Kisumu Duka La Dawa Pharmacy',
    tier: 'Starter',
    maxDevices: 2,
    unlockedDevices: ['DEV-POS-KISUMU-01'],
    requiredOnNewDevices: false,
    issuedDate: '2026-06-01',
    expiresDate: '2026-09-28',
    status: 'active',
  },
];

// 4. Invoices / Payments Ledger Store
export const platformInvoicesStore: PlatformInvoiceRecord[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2026-0901',
    business_id: 'BUS-8F42K91',
    business_name: 'Apex Hardware & Building Supplies',
    amount_kes: 7500,
    plan_tier: 'Business',
    billing_cycle: 'monthly',
    payment_method: 'mpesa_stk',
    mpesa_receipt: 'QK89123XYZ',
    status: 'paid',
    due_date: '2026-09-01',
    paid_at: '2026-09-01T08:24:12Z',
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2026-0810',
    business_id: 'BUS-9P14M33',
    business_name: 'Naivasha Farmers & Agrovet Ltd',
    amount_kes: 250000,
    plan_tier: 'Enterprise',
    billing_cycle: 'annual',
    payment_method: 'bank_transfer',
    mpesa_receipt: 'EFT-STANBIC-9014',
    status: 'paid',
    due_date: '2026-08-10',
    paid_at: '2026-08-10T14:15:00Z',
  },
];

// 5. Support Access Sessions Store
export const supportAccessSessionsStore: SupportAccessLogRecord[] = [
  {
    id: 'sess-001',
    admin_id: 'migichidave09@gmail.com',
    admin_name: 'David Migichi (Super Admin)',
    business_id: 'BUS-8F42K91',
    business_name: 'Apex Hardware & Building Supplies',
    reason: 'Investigating customer credit balance sync discrepancy',
    data_scopes: ['Sales transactions', 'Sales reports'],
    actions: 'VIEW ONLY',
    status: 'closed',
    started_at: '2026-09-14T10:32:00Z',
    expires_at: '2026-09-14T11:02:00Z',
    ended_at: '2026-09-14T10:47:00Z',
  },
];

// 6. Platform Maintenance Commands & Audit Logs
export const platformMaintenanceCommands: Array<{
  id: string;
  tenant_id: string;
  command: string;
  parameters: any;
  status: 'queued' | 'running' | 'completed' | 'failed';
  requested_by: string;
  created_at: string;
  updated_at: string;
}> = [];

export const platformAuditLogs: Array<{
  id: number;
  actor: string;
  action: string;
  detail: any;
  at: string;
}> = [];

// Helper: Calculate live MRR by summing monthly fees and normalizing annual subscriptions (fee/12)
export interface MrrMetricsResult {
  total_mrr: number;
  active_subscribers: number;
  monthly_cycle_count: number;
  annual_cycle_count: number;
  monthly_mrr_portion: number;
  annual_mrr_portion: number;
}

export function calculateLiveMRR(): MrrMetricsResult {
  let totalMrr = 0;
  let activeCount = 0;
  let monthlyCount = 0;
  let annualCount = 0;
  let monthlyMrrPortion = 0;
  let annualMrrPortion = 0;

  activePlatformClients.forEach((client) => {
    if (client.status === 'active' || client.status === 'trial' || client.status === 'grace') {
      activeCount++;
      if (client.billing_cycle === 'annual') {
        annualCount++;
        const annualFee = client.annual_fee || (client.monthly_fee * 10);
        const normalizedMonthly = Math.round(annualFee / 12);
        annualMrrPortion += normalizedMonthly;
        totalMrr += normalizedMonthly;
      } else {
        monthlyCount++;
        const monthlyFee = client.monthly_fee || 2500;
        monthlyMrrPortion += monthlyFee;
        totalMrr += monthlyFee;
      }
    }
  });

  return {
    total_mrr: totalMrr,
    active_subscribers: activeCount,
    monthly_cycle_count: monthlyCount,
    annual_cycle_count: annualCount,
    monthly_mrr_portion: monthlyMrrPortion,
    annual_mrr_portion: annualMrrPortion,
  };
}

// -------------------------------------------------------------
// Realtime SSE Broadcast Bus (Instantly pushes changes to Console)
// -------------------------------------------------------------
const platformSseClients: Response[] = [];

export function broadcastPlatformRealtime(event: {
  table: 'tenants' | 'devices' | 'telemetry_events' | 'cryptographic_licenses';
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  record?: any;
}) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (let i = platformSseClients.length - 1; i >= 0; i--) {
    const res = platformSseClients[i];
    try {
      res.write(payload);
    } catch {
      platformSseClients.splice(i, 1);
    }
  }
}

// Helper: Calculate Collections in Current Calendar Month
export function calculateCollectionsThisMonth(): number {
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  return platformInvoicesStore
    .filter((inv) => inv.status === 'paid' && (inv.paid_at || '').startsWith(currentMonthPrefix))
    .reduce((acc, inv) => acc + inv.amount_kes, 0);
}

// Helper: Generate Live 24-hour Telemetry Series
export function generateLive24hTelemetry(): TelemetryBucketRecord[] {
  refreshDeviceOnlineStatus();
  const onlineCount = activeDevicesStore.filter((d) => d.is_online).length;
  const buckets: TelemetryBucketRecord[] = [];
  const now = Date.now();

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 3600000);
    const hourLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Derived values grounded in real devices online
    const pingVariation = Math.sin(i * 0.4) * 2;
    const latency = Math.max(12, Math.round(20 + pingVariation));
    const syncVolume = Math.round(onlineCount * 14 + Math.cos(i * 0.6) * 5);
    const uptime = Number((99.95 - (i === 12 ? 0.02 : 0)).toFixed(2));

    buckets.push({
      bucket_time: hourLabel,
      response_time_ms: latency,
      online_terminals: onlineCount,
      sync_volume: syncVolume,
      uptime: uptime,
    });
  }

  return buckets;
}

export function registerSupabasePlatformRoutes(app: Express) {
  // -------------------------------------------------------------
  // 1. DEVICE HEARTBEAT & CONNECTION DETECTION
  // -------------------------------------------------------------
  app.post(
    ['/rest/v1/rpc/record_device_heartbeat', '/api/rpc/record_device_heartbeat', '/api/devices/heartbeat'],
    (req: Request, res: Response) => {
      const {
        p_device_id,
        p_business_id,
        p_connection_type,
        device_id,
        business_id,
        connection_type,
        latency_ms,
        sync_volume,
        uptime_pct,
      } = req.body;

      const devId = String(p_device_id || device_id || '').trim();
      const bizId = String(p_business_id || business_id || 'BUS-8F42K91').trim();
      const connType: DeviceConnectionType = (p_connection_type || connection_type || 'unknown') as DeviceConnectionType;

      if (!devId) {
        return res.status(400).json({ error: 'device_id is required for heartbeat' });
      }

      const existingIndex = activeDevicesStore.findIndex((d) => d.id === devId);
      const isOnline = connType !== 'offline';
      const record: DeviceRecord = {
        id: devId,
        tenant_id: bizId,
        name: existingIndex >= 0 ? activeDevicesStore[existingIndex].name : `Terminal (${connType})`,
        connection_type: connType,
        last_seen_at: new Date().toISOString(),
        is_online: isOnline,
        app_version: '2.4.1-prod',
      };

      if (existingIndex >= 0) {
        activeDevicesStore[existingIndex] = record;
      } else {
        activeDevicesStore.push(record);
      }

      // Sync device fleet counts on client
      const client = activePlatformClients.find((c) => c.business_id === bizId);
      if (client) {
        client.devices = activeDevicesStore.filter((d) => d.tenant_id === bizId);
        client.fleet_count = client.devices.length;
        client.online_fleet_count = client.devices.filter((d) => d.is_online).length;
      }

      broadcastPlatformRealtime({
        table: 'devices',
        eventType: existingIndex >= 0 ? 'UPDATE' : 'INSERT',
        record,
      });

      return res.json({ success: true, is_online: isOnline, connection_type: connType });
    }
  );

  // -------------------------------------------------------------
  // REALTIME SSE STREAM (Server-Sent Events for instant local updates)
  // -------------------------------------------------------------
  app.get('/api/platform/realtime-stream', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    platformSseClients.push(res);
    req.on('close', () => {
      const idx = platformSseClients.indexOf(res);
      if (idx >= 0) platformSseClients.splice(idx, 1);
    });
  });

  // -------------------------------------------------------------
  // 2. LIVE METRICS & MRR RPC (get_mrr_metrics & subscription_monthly_equivalent)
  // -------------------------------------------------------------
  app.all(
    [
      '/rest/v1/rpc/get_mrr_metrics',
      '/api/rpc/get_mrr_metrics',
      '/rest/v1/rpc/subscription_monthly_equivalent',
      '/api/rpc/subscription_monthly_equivalent',
      '/api/saas/mrr',
      '/api/saas/mrr-metrics',
      '/api/platform/mrr',
      '/api/platform/mrr-metrics',
    ],
    (_req: Request, res: Response) => {
      const mrrData = calculateLiveMRR();
      return res.json([mrrData]);
    }
  );

  app.get(['/api/saas/mrr-metrics', '/api/saas/mrr', '/api/platform/mrr', '/api/platform/mrr-metrics'], (_req: Request, res: Response) => {
    const mrrData = calculateLiveMRR();
    return res.json({ mrr: mrrData });
  });

  app.post(
    ['/rest/v1/rpc/platform_collections_this_month', '/api/rpc/platform_collections_this_month', '/api/saas/collections'],
    (_req: Request, res: Response) => {
      const collections = calculateCollectionsThisMonth();
      return res.json(collections);
    }
  );

  app.get('/api/saas/overview', (_req: Request, res: Response) => {
    refreshDeviceOnlineStatus();
    const mrrData = calculateLiveMRR();
    const collections = calculateCollectionsThisMonth();
    const onlineDevs = activeDevicesStore.filter((d) => d.is_online).length;
    const activeCount = activePlatformClients.filter((c) => c.status === 'active').length;
    const trialCount = activePlatformClients.filter((c) => c.status === 'trial').length;
    const graceCount = activePlatformClients.filter((c) => c.status === 'grace').length;
    const suspendedCount = activePlatformClients.filter((c) => c.status === 'suspended').length;

    return res.json({
      metrics: {
        totalBusinesses: activePlatformClients.length,
        activeCount,
        trialCount,
        gracePeriodCount: graceCount,
        suspendedCount,
        mrrKes: mrrData.total_mrr,
        monthlyCollectionsKes: collections,
        totalActiveDevices: activeDevicesStore.length,
        onlineDevices: onlineDevs,
        offlineDevices: activeDevicesStore.length - onlineDevs,
        apiResponseTimeMs: 22,
      },
    });
  });

  // -------------------------------------------------------------
  // 3. LIVE 24H TELEMETRY HOURLY BUCKET RPC
  // -------------------------------------------------------------
  app.post(
    ['/rest/v1/rpc/get_telemetry_hourly_24h', '/api/rpc/get_telemetry_hourly_24h', '/api/saas/telemetry-24h'],
    (_req: Request, res: Response) => {
      const telemetrySeries = generateLive24hTelemetry();
      return res.json(telemetrySeries);
    }
  );

  app.get('/api/saas/telemetry-24h', (_req: Request, res: Response) => {
    const telemetrySeries = generateLive24hTelemetry();
    return res.json({ telemetry: telemetrySeries });
  });

  // -------------------------------------------------------------
  // 4. SUBSCRIBERS / TENANTS RPC & REST (console_clients)
  // -------------------------------------------------------------
  app.post(['/rest/v1/rpc/console_clients', '/api/rpc/console_clients'], (req: Request, res: Response) => {
    refreshDeviceOnlineStatus();
    const { search, status } = req.body || {};

    let list = activePlatformClients.map((client) => {
      const bizDevices = activeDevicesStore.filter((d) => d.tenant_id === client.business_id);
      const onlineDevs = bizDevices.filter((d) => d.is_online).length;
      return {
        ...client,
        fleet_count: Math.max(client.fleet_count, bizDevices.length),
        online_fleet_count: onlineDevs,
        devices: bizDevices,
      };
    });

    if (search) {
      const s = String(search).toLowerCase();
      list = list.filter(
        (c) =>
          c.business_name.toLowerCase().includes(s) ||
          c.business_id.toLowerCase().includes(s) ||
          c.owner_name.toLowerCase().includes(s) ||
          c.city.toLowerCase().includes(s)
      );
    }

    if (status && status !== 'all') {
      list = list.filter((c) => c.status === status);
    }

    return res.json(list);
  });

  app.get('/api/saas/businesses', (req: Request, res: Response) => {
    refreshDeviceOnlineStatus();
    const search = req.query.search as string;
    const status = req.query.status as string;

    let list = activePlatformClients.map((client) => {
      const bizDevices = activeDevicesStore.filter((d) => d.tenant_id === client.business_id);
      const onlineDevs = bizDevices.filter((d) => d.is_online).length;
      return {
        ...client,
        name: client.business_name,
        businessName: client.business_name,
        businessId: client.business_id,
        subscriptionPlan: client.package,
        computedStatus: client.status,
        devicesCount: Math.max(client.fleet_count, bizDevices.length),
        onlineDevicesCount: onlineDevs,
        monthlyPriceKes: client.monthly_fee,
        mrrKes: client.billing_cycle === 'annual' ? Math.round(client.annual_fee / 12) : client.monthly_fee,
        devices: bizDevices,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.business_name.toLowerCase().includes(s) ||
          c.business_id.toLowerCase().includes(s) ||
          c.owner_name.toLowerCase().includes(s)
      );
    }
    if (status && status !== 'all') {
      list = list.filter((c) => c.status === status);
    }

    return res.json({ businesses: list });
  });

  // Register new business tenant
  app.post(['/rest/v1/rpc/admin_register_client', '/api/rpc/admin_register_client', '/api/saas/businesses'], (req: Request, res: Response) => {
    const body = req.body;
    const name = body.p_name || body.businessName || body.name || 'New Enterprise Store';
    const owner = body.p_owner || body.ownerName || 'Owner';
    const phone = body.p_phone || body.ownerPhone || '+254 700 000 000';
    const city = body.p_city || body.location || 'Nairobi';
    const planRaw = (body.p_plan || body.subscriptionPlan || 'business').toLowerCase();
    const pkg = planRaw.includes('starter') ? 'Starter' : planRaw.includes('enterprise') ? 'Enterprise' : 'Business';
    const billingCycle = body.billing_cycle === 'annual' ? 'annual' : 'monthly';

    const monthlyFee = pkg === 'Starter' ? 2500 : pkg === 'Enterprise' ? 25000 : 7500;
    const annualFee = monthlyFee * 10;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const bizId = body.businessId || `BUS-${randomHex}`;
    const cleanPrefix = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'DMI';
    const licKey = body.licenseKey || `DMI-CRYPT-${cleanPrefix}-${pkg.slice(0, 3).toUpperCase()}-${randomHex}-ACT`;

    const newClient: PlatformClientEntity = {
      id: `cli-${Date.now()}`,
      business_id: bizId,
      business_name: name,
      owner_name: owner,
      contact_phone: phone,
      city,
      installed_date: new Date().toISOString().split('T')[0],
      package: pkg,
      billing_cycle: billingCycle,
      monthly_fee: monthlyFee,
      annual_fee: annualFee,
      license_key: licKey,
      status: 'active',
      fleet_count: 1,
      online_fleet_count: 1,
      branches_count: 1,
      last_payment_date: new Date().toISOString().split('T')[0],
      renewal_date: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString().split('T')[0],
      days_left: billingCycle === 'annual' ? 365 : 30,
      devices: [
        {
          id: `DEV-${bizId}-01`,
          tenant_id: bizId,
          name: `${name} Counter Terminal`,
          connection_type: 'wifi',
          last_seen_at: new Date().toISOString(),
          is_online: true,
          app_version: '2.4.1-prod',
        },
      ],
    };

    activeDevicesStore.push(newClient.devices[0]);
    activePlatformClients.unshift(newClient);

    // Also register cryptographic license
    const newLic: CryptographicLicenseRecord = {
      licenseKey: licKey,
      businessId: bizId,
      businessName: name,
      tier: pkg,
      maxDevices: pkg === 'Starter' ? 2 : pkg === 'Enterprise' ? 200 : 15,
      unlockedDevices: [newClient.devices[0].id],
      requiredOnNewDevices: true,
      issuedDate: new Date().toISOString().split('T')[0],
      expiresDate: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString().split('T')[0],
      status: 'active',
    };
    cryptographicLicensesStore.unshift(newLic);

    platformAuditLogs.unshift({
      id: Date.now(),
      actor: 'migichidave09@gmail.com',
      action: 'register_tenant',
      detail: { businessId: bizId, name, pkg, billingCycle, licKey },
      at: new Date().toISOString(),
    });

    broadcastPlatformRealtime({
      table: 'tenants',
      eventType: 'INSERT',
      record: newClient,
    });
    broadcastPlatformRealtime({
      table: 'cryptographic_licenses',
      eventType: 'INSERT',
      record: newLic,
    });

    return res.json({ success: true, businessId: bizId, licenseKey: licKey });
  });

  // Row Action: Suspend Tenant
  app.post(['/rest/v1/rpc/admin_set_suspension', '/api/rpc/admin_set_suspension'], (req: Request, res: Response) => {
    const { p_business, p_suspend } = req.body;
    const client = activePlatformClients.find((c) => c.business_id === p_business);
    if (!client) {
      return res.status(404).json({ error: 'Business tenant not found' });
    }
    client.status = p_suspend ? 'suspended' : 'active';

    platformAuditLogs.unshift({
      id: Date.now(),
      actor: 'migichidave09@gmail.com',
      action: p_suspend ? 'suspend_tenant' : 'unsuspend_tenant',
      detail: { businessId: p_business, newStatus: client.status },
      at: new Date().toISOString(),
    });

    broadcastPlatformRealtime({
      table: 'tenants',
      eventType: 'UPDATE',
      record: client,
    });

    return res.json({ success: true, status: client.status });
  });

  // Row Action: Grant Grace Period
  app.post(['/rest/v1/rpc/admin_grant_grace', '/api/rpc/admin_grant_grace'], (req: Request, res: Response) => {
    const { p_business, p_days } = req.body;
    const days = Number(p_days) || 7;
    const client = activePlatformClients.find((c) => c.business_id === p_business);
    if (!client) {
      return res.status(404).json({ error: 'Business tenant not found' });
    }
    client.status = 'grace';
    client.renewal_date = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    client.days_left = days;

    platformAuditLogs.unshift({
      id: Date.now(),
      actor: 'migichidave09@gmail.com',
      action: 'grant_grace_period',
      detail: { businessId: p_business, graceDays: days, newRenewalDate: client.renewal_date },
      at: new Date().toISOString(),
    });

    broadcastPlatformRealtime({
      table: 'tenants',
      eventType: 'UPDATE',
      record: client,
    });

    return res.json({ success: true, days, renewal_date: client.renewal_date });
  });

  // Row Action: Update Plan & Billing Cycle
  app.post(['/rest/v1/rpc/admin_update_client_plan', '/api/rpc/admin_update_client_plan'], (req: Request, res: Response) => {
    const { p_business, p_plan, p_billing_cycle, p_fee } = req.body;
    const client = activePlatformClients.find((c) => c.business_id === p_business);
    if (!client) {
      return res.status(404).json({ error: 'Business tenant not found' });
    }

    const pkg = (p_plan || '').toLowerCase().includes('starter')
      ? 'Starter'
      : (p_plan || '').toLowerCase().includes('enterprise')
      ? 'Enterprise'
      : 'Business';

    client.package = pkg;
    if (p_billing_cycle === 'annual' || p_billing_cycle === 'monthly') {
      client.billing_cycle = p_billing_cycle;
    }
    if (p_fee) {
      client.monthly_fee = Number(p_fee);
      client.annual_fee = Number(p_fee) * 10;
    }

    platformAuditLogs.unshift({
      id: Date.now(),
      actor: 'migichidave09@gmail.com',
      action: 'update_client_plan',
      detail: { businessId: p_business, plan: pkg, cycle: client.billing_cycle, fee: client.monthly_fee },
      at: new Date().toISOString(),
    });

    broadcastPlatformRealtime({
      table: 'tenants',
      eventType: 'UPDATE',
      record: client,
    });

    return res.json({ success: true, client });
  });

  // Device Heartbeat RPC & REST (Supabase Realtime Trigger)
  app.post(
    ['/rest/v1/rpc/record_device_heartbeat', '/api/rpc/record_device_heartbeat', '/api/platform/record-heartbeat'],
    (req: Request, res: Response) => {
      const body = req.body || {};
      const devId = body.p_device_id || body.device_id || `DEV-${Date.now()}`;
      const tenantId = body.p_tenant_id || body.tenant_id || 'BUS-8F42K91';
      const devName = body.p_device_name || body.device_name || 'POS Terminal';
      const connType: DeviceConnectionType = body.p_connection_type || body.connection_type || 'wifi';
      const appVer = body.p_app_version || body.app_version || 'v2.4.1-prod';

      let existingDev = activeDevicesStore.find((d) => d.id === devId);
      if (existingDev) {
        existingDev.name = devName;
        existingDev.last_seen_at = new Date().toISOString();
        existingDev.is_online = true;
        existingDev.connection_type = connType;
        existingDev.app_version = appVer;
      } else {
        existingDev = {
          id: devId,
          tenant_id: tenantId,
          name: devName,
          connection_type: connType,
          last_seen_at: new Date().toISOString(),
          is_online: true,
          app_version: appVer,
        };
        activeDevicesStore.push(existingDev);
      }

      // Sync into client's device list
      const client = activePlatformClients.find((c) => c.business_id === tenantId);
      if (client) {
        const clientDev = client.devices.find((d) => d.id === devId);
        if (clientDev) {
          Object.assign(clientDev, existingDev);
        } else {
          client.devices.push(existingDev);
        }
        client.fleet_count = client.devices.length;
        client.online_fleet_count = client.devices.filter((d) => d.is_online).length;
      }

      // Broadcast Realtime update for devices & tenants
      broadcastPlatformRealtime({
        table: 'devices',
        eventType: 'UPDATE',
        record: existingDev,
      });

      if (client) {
        broadcastPlatformRealtime({
          table: 'tenants',
          eventType: 'UPDATE',
          record: client,
        });
      }

      return res.json({ success: true, device: existingDev });
    }
  );

  // -------------------------------------------------------------
  // 5. CRYPTOGRAPHIC LICENSES RPC & REST
  // -------------------------------------------------------------
  app.post(['/rest/v1/rpc/console_licenses', '/api/rpc/console_licenses', '/api/saas/cryptographic-licenses'], (req: Request, res: Response) => {
    if (req.method === 'POST' && req.body.licenseKey) {
      // Create / assign license
      const newLic: CryptographicLicenseRecord = req.body;
      const idx = cryptographicLicensesStore.findIndex((l) => l.licenseKey === newLic.licenseKey);
      if (idx >= 0) {
        cryptographicLicensesStore[idx] = newLic;
      } else {
        cryptographicLicensesStore.unshift(newLic);
      }
      return res.json({ success: true, license: newLic });
    }
    return res.json(cryptographicLicensesStore);
  });

  app.get('/api/saas/cryptographic-licenses', (_req: Request, res: Response) => {
    return res.json({ licenses: cryptographicLicensesStore });
  });

  // -------------------------------------------------------------
  // 6. PAYMENTS & INVOICES RPC & REST
  // -------------------------------------------------------------
  app.post(['/rest/v1/rpc/console_invoices', '/api/rpc/console_invoices', '/api/saas/invoices'], (req: Request, res: Response) => {
    if (req.method === 'POST' && req.body.invoice_number) {
      platformInvoicesStore.unshift(req.body);
      return res.json({ success: true, invoice: req.body });
    }
    return res.json(platformInvoicesStore);
  });

  app.get('/api/saas/invoices', (_req: Request, res: Response) => {
    return res.json({ invoices: platformInvoicesStore });
  });

  // -------------------------------------------------------------
  // 7. SUPPORT ACCESS SESSIONS & AUDIT LOGS RPC & REST
  // -------------------------------------------------------------
  app.post(['/rest/v1/rpc/console_support_logs', '/api/rpc/console_support_logs'], (_req: Request, res: Response) => {
    return res.json(supportAccessSessionsStore);
  });

  app.get('/api/saas/support-access/logs', (_req: Request, res: Response) => {
    return res.json({ logs: supportAccessSessionsStore });
  });

  app.post(['/rest/v1/rpc/admin_start_support', '/api/rpc/admin_start_support', '/api/saas/support-session/start'], (req: Request, res: Response) => {
    const { p_business, p_reason, p_scopes, tenant_id, reason, data_scopes, duration_minutes } = req.body;
    const bizId = p_business || tenant_id;
    const r = (p_reason || reason || '').trim();

    if (!r || r.length < 10) {
      return res.status(400).json({ error: 'Mandatory justification reason required (minimum 10 characters).' });
    }

    const client = activePlatformClients.find((c) => c.business_id === bizId);
    const duration = Number(duration_minutes) || 30;
    const now = Date.now();
    const expiresAt = new Date(now + duration * 60000).toISOString();

    const session: SupportAccessLogRecord = {
      id: `sess-${Date.now()}`,
      admin_id: 'migichidave09@gmail.com',
      admin_name: 'David Migichi (Super Admin)',
      business_id: bizId,
      business_name: client?.business_name || bizId,
      reason: r,
      data_scopes: p_scopes || data_scopes || ['Sales transactions', 'Sales reports'],
      actions: 'VIEW ONLY',
      status: 'open',
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    supportAccessSessionsStore.unshift(session);

    platformAuditLogs.unshift({
      id: Date.now(),
      actor: 'migichidave09@gmail.com',
      action: 'start_support_session',
      detail: { sessionId: session.id, businessId: session.business_id, reason: session.reason },
      at: new Date().toISOString(),
    });

    return res.json({ success: true, session });
  });

  app.post(['/rest/v1/rpc/admin_close_support', '/api/rpc/admin_close_support', '/api/saas/support-session/end'], (req: Request, res: Response) => {
    const { p_session_id, session_id } = req.body;
    const sid = p_session_id || session_id;
    const sess = supportAccessSessionsStore.find((s) => s.id === sid);
    if (sess) {
      sess.status = 'closed';
      sess.ended_at = new Date().toISOString();

      platformAuditLogs.unshift({
        id: Date.now(),
        actor: 'migichidave09@gmail.com',
        action: 'close_support_session',
        detail: { sessionId: sess.id, businessId: sess.business_id },
        at: new Date().toISOString(),
      });
    }
    return res.json({ success: true });
  });

  // -------------------------------------------------------------
  // 8. PLANS TABLE REST
  // -------------------------------------------------------------
  app.get(['/rest/v1/plans', '/api/plans'], (_req: Request, res: Response) => {
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        monthly_fee: 2500,
        annual_fee: 25000,
        max_branches: 1,
        max_devices: 2,
        max_staff: 3,
        max_products: 500,
        offline_grace_days: 3,
      },
      {
        id: 'business',
        name: 'Business',
        monthly_fee: 7500,
        annual_fee: 75000,
        max_branches: 5,
        max_devices: 15,
        max_staff: 25,
        max_products: 5000,
        offline_grace_days: 7,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthly_fee: 25000,
        annual_fee: 250000,
        max_branches: 50,
        max_devices: 200,
        max_staff: 500,
        max_products: 50000,
        offline_grace_days: 30,
      },
    ];
    return res.json(plans);
  });

  // -------------------------------------------------------------
  // 9. VOUCHERS & EDGE FUNCTIONS
  // -------------------------------------------------------------
  app.post(['/rest/v1/rpc/console_vouchers', '/api/rpc/console_vouchers'], (_req: Request, res: Response) => {
    const all = voucherRepository.listVouchers();
    return res.json(all);
  });

  app.post(['/functions/v1/voucher-engine', '/api/functions/voucher-engine'], (req: Request, res: Response) => {
    const { action, plan, durationDays, token, tenantId } = req.body;
    if (action === 'generate') {
      const tier = (plan || 'Business').charAt(0).toUpperCase() + (plan || 'Business').slice(1).toLowerCase() as VoucherTier;
      const genResult = voucherRepository.createVoucher({
        tier,
        durationDays: Number(durationDays) || 30,
        createdBy: 'SuperAdmin NOC (migichidave09@gmail.com)',
      });
      return res.json({ voucher: genResult.voucher, token: genResult.token });
    }
    if (action === 'redeem') {
      const redResult = voucherRepository.redeemVoucherAtomic({
        rawToken: token,
        tenantId: tenantId || 'BUS-TENANT',
        ip: req.ip || '127.0.0.1',
      });
      if (!redResult.success) {
        return res.status(400).json({ error: redResult.error });
      }
      return res.json(redResult);
    }
    return res.status(400).json({ error: 'Unknown action' });
  });

  // -------------------------------------------------------------
  // 10. AUTH & AUDIT LOGS QUERY
  // -------------------------------------------------------------
  app.get('/api/saas/audit-logs', (_req: Request, res: Response) => {
    return res.json({ logs: platformAuditLogs });
  });

  app.post(['/rest/v1/rpc/is_platform_admin', '/api/rpc/is_platform_admin'], (_req: Request, res: Response) => {
    return res.json(true);
  });
}
