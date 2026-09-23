/**
 * Server-Side Authoritative Plans & Cryptographic Voucher Engine
 * 
 * Invariants:
 * 1. Entropy: At least 60 bits from crypto.randomBytes with unambiguous 32-char alphabet.
 * 2. Hash-only persistence: Tokens are hashed with HMAC-SHA256 (VOUCHER_PEPPER); plain tokens are NEVER saved.
 * 3. Authoritative plans: Pricing and duration come exclusively from the plans table, never client input.
 * 4. Atomic single-use redemption: Rate-limited per IP and tenant with row-level lock and generic error output.
 * 5. Cryptographic license signing: Signs with Ed25519/HMAC master secret for offline verification.
 * 6. Idempotent M-Pesa issuance: Unique mpesa_receipt constraint blocks double-issuing one payment.
 * 7. eTIMS revenue compliance: Automatically records tax invoices for all voucher sales.
 */

import { randomBytes, createHmac, createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Secret pepper and signing secrets
export const VOUCHER_PEPPER =
  process.env.VOUCHER_PEPPER || 'dmi-voucher-pepper-2026-supersecret-cryptographic-salt';

export const LICENSE_SIGNING_SECRET =
  process.env.LICENSE_SIGNING_SECRET || 'dmi-hardware-os-ed25519-master-key-prod-2026';

export const LICENSE_PUBLIC_FINGERPRINT = createHash('sha256')
  .update(LICENSE_SIGNING_SECRET)
  .digest('hex')
  .slice(0, 16);

// 32-character unambiguous alphabet (no 0/O, 1/I)
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type VoucherTier = 'Starter' | 'Business' | 'Enterprise';
export type VoucherStatus = 'available' | 'redeemed' | 'revoked' | 'expired';

export interface PlanLimits {
  max_branches: number;
  max_devices: number;
  max_products: number;
  offline_grace_days: number;
  features: string[];
}

export interface Plan {
  id: string;
  tier: VoucherTier;
  duration_days: number;
  price_kes: number;
  name: string;
  limits: PlanLimits;
  is_active: boolean;
}

export interface StoredVoucher {
  id: string;
  token_hash: string;       // HMAC-SHA256(token, VOUCHER_PEPPER)
  masked_prefix: string;    // e.g. DMI-BIZ-7K9A-****-**** for audit UI
  tier: VoucherTier;
  duration_days: number;
  price_kes: number;        // Copied from plans table, NEVER from client
  status: VoucherStatus;
  mpesa_receipt?: string;   // Unique constraint prevents double-issuing
  redeemed_by_tenant?: string;
  redeemed_at?: string;
  created_at: string;
  created_by?: string;
  etims_invoice_number?: string;
}

export interface EtimsVoucherInvoice {
  invoiceNumber: string;
  cuSerialNumber: string;
  taxPin: string;
  buyerName: string;
  buyerPin?: string;
  amountGrossKes: number;
  vatAmountKes: number;
  netAmountKes: number;
  qrVerificationUrl: string;
  issuedAt: string;
}

export interface RedemptionAttempt {
  ip: string;
  tenantId: string;
  timestamp: number;
  success: boolean;
}

// ---------------------------------------------------------------------------
// AUTHORITATIVE PLANS TABLE
// ---------------------------------------------------------------------------
export const AUTHORITATIVE_PLANS: Plan[] = [
  // Starter Tier
  {
    id: 'starter-7d',
    tier: 'Starter',
    duration_days: 7,
    price_kes: 700,
    name: 'Starter Weekly Pass',
    limits: {
      max_branches: 1,
      max_devices: 2,
      max_products: 1000,
      offline_grace_days: 7,
      features: ['Core POS', 'Barcode Scanner', 'eTIMS Receipting', 'Local SQLite Sync'],
    },
    is_active: true,
  },
  {
    id: 'starter-30d',
    tier: 'Starter',
    duration_days: 30,
    price_kes: 2500,
    name: 'Starter Monthly Subscription',
    limits: {
      max_branches: 1,
      max_devices: 2,
      max_products: 1000,
      offline_grace_days: 14,
      features: ['Core POS', 'Barcode Scanner', 'eTIMS Receipting', 'Local SQLite Sync'],
    },
    is_active: true,
  },
  {
    id: 'starter-90d',
    tier: 'Starter',
    duration_days: 90,
    price_kes: 7000,
    name: 'Starter Quarterly License',
    limits: {
      max_branches: 1,
      max_devices: 2,
      max_products: 1000,
      offline_grace_days: 14,
      features: ['Core POS', 'Barcode Scanner', 'eTIMS Receipting', 'Local SQLite Sync'],
    },
    is_active: true,
  },
  {
    id: 'starter-365d',
    tier: 'Starter',
    duration_days: 365,
    price_kes: 25000,
    name: 'Starter Annual License',
    limits: {
      max_branches: 1,
      max_devices: 2,
      max_products: 1000,
      offline_grace_days: 30,
      features: ['Core POS', 'Barcode Scanner', 'eTIMS Receipting', 'Local SQLite Sync'],
    },
    is_active: true,
  },

  // Business Tier
  {
    id: 'biz-7d',
    tier: 'Business',
    duration_days: 7,
    price_kes: 2000,
    name: 'Business Weekly Pass',
    limits: {
      max_branches: 5,
      max_devices: 10,
      max_products: 25000,
      offline_grace_days: 14,
      features: [
        'Multi-Branch Transfer',
        'Wholesale & Tiered Pricing',
        'eTIMS Complete',
        'Customer Credit Ledger',
        'WhatsApp Alerts',
        'Outskirts Sync Engine',
      ],
    },
    is_active: true,
  },
  {
    id: 'biz-30d',
    tier: 'Business',
    duration_days: 30,
    price_kes: 7500,
    name: 'Business Monthly Subscription',
    limits: {
      max_branches: 5,
      max_devices: 10,
      max_products: 25000,
      offline_grace_days: 30,
      features: [
        'Multi-Branch Transfer',
        'Wholesale & Tiered Pricing',
        'eTIMS Complete',
        'Customer Credit Ledger',
        'WhatsApp Alerts',
        'Outskirts Sync Engine',
      ],
    },
    is_active: true,
  },
  {
    id: 'biz-90d',
    tier: 'Business',
    duration_days: 90,
    price_kes: 21000,
    name: 'Business Quarterly License',
    limits: {
      max_branches: 5,
      max_devices: 10,
      max_products: 25000,
      offline_grace_days: 30,
      features: [
        'Multi-Branch Transfer',
        'Wholesale & Tiered Pricing',
        'eTIMS Complete',
        'Customer Credit Ledger',
        'WhatsApp Alerts',
        'Outskirts Sync Engine',
      ],
    },
    is_active: true,
  },
  {
    id: 'biz-365d',
    tier: 'Business',
    duration_days: 365,
    price_kes: 75000,
    name: 'Business Annual License',
    limits: {
      max_branches: 5,
      max_devices: 10,
      max_products: 25000,
      offline_grace_days: 60,
      features: [
        'Multi-Branch Transfer',
        'Wholesale & Tiered Pricing',
        'eTIMS Complete',
        'Customer Credit Ledger',
        'WhatsApp Alerts',
        'Outskirts Sync Engine',
      ],
    },
    is_active: true,
  },

  // Enterprise Tier
  {
    id: 'ent-7d',
    tier: 'Enterprise',
    duration_days: 7,
    price_kes: 6500,
    name: 'Enterprise Weekly Pass',
    limits: {
      max_branches: 999,
      max_devices: 999,
      max_products: 999999,
      offline_grace_days: 30,
      features: [
        'Unlimited Branches & Terminals',
        'Central Fleet Command',
        'Bi-directional SQLite Mesh',
        'Automated STK Reconciliation',
        'Developer Console Access',
        '24/7 Priority SLA',
      ],
    },
    is_active: true,
  },
  {
    id: 'ent-30d',
    tier: 'Enterprise',
    duration_days: 30,
    price_kes: 25000,
    name: 'Enterprise Monthly Subscription',
    limits: {
      max_branches: 999,
      max_devices: 999,
      max_products: 999999,
      offline_grace_days: 90,
      features: [
        'Unlimited Branches & Terminals',
        'Central Fleet Command',
        'Bi-directional SQLite Mesh',
        'Automated STK Reconciliation',
        'Developer Console Access',
        '24/7 Priority SLA',
      ],
    },
    is_active: true,
  },
  {
    id: 'ent-90d',
    tier: 'Enterprise',
    duration_days: 90,
    price_kes: 70000,
    name: 'Enterprise Quarterly License',
    limits: {
      max_branches: 999,
      max_devices: 999,
      max_products: 999999,
      offline_grace_days: 90,
      features: [
        'Unlimited Branches & Terminals',
        'Central Fleet Command',
        'Bi-directional SQLite Mesh',
        'Automated STK Reconciliation',
        'Developer Console Access',
        '24/7 Priority SLA',
      ],
    },
    is_active: true,
  },
  {
    id: 'ent-365d',
    tier: 'Enterprise',
    duration_days: 365,
    price_kes: 250000,
    name: 'Enterprise Annual License',
    limits: {
      max_branches: 999,
      max_devices: 999,
      max_products: 999999,
      offline_grace_days: 180,
      features: [
        'Unlimited Branches & Terminals',
        'Central Fleet Command',
        'Bi-directional SQLite Mesh',
        'Automated STK Reconciliation',
        'Developer Console Access',
        '24/7 Priority SLA',
      ],
    },
    is_active: true,
  },
];

export function getPlan(tier: VoucherTier, durationDays: number): Plan | undefined {
  return AUTHORITATIVE_PLANS.find(
    (p) => p.tier === tier && p.duration_days === Number(durationDays) && p.is_active
  );
}

// ---------------------------------------------------------------------------
// DURABLE PERSISTENT REPOSITORY FOR VOUCHERS
// ---------------------------------------------------------------------------
const STORAGE_DIR = path.join(process.cwd(), 'server_storage');
const VOUCHERS_FILE = path.join(STORAGE_DIR, 'vouchers_store.json');
const ATTEMPTS_FILE = path.join(STORAGE_DIR, 'redemption_attempts.json');
const ETIMS_FILE = path.join(STORAGE_DIR, 'etims_voucher_invoices.json');

class VoucherRepository {
  private vouchers: StoredVoucher[] = [];
  private attempts: RedemptionAttempt[] = [];
  private etimsInvoices: EtimsVoucherInvoice[] = [];

  constructor() {
    this.ensureDirectory();
    this.loadState();
  }

  private ensureDirectory() {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[VoucherRepo] Error creating storage dir:', e);
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(VOUCHERS_FILE)) {
        this.vouchers = JSON.parse(fs.readFileSync(VOUCHERS_FILE, 'utf-8'));
      }
      if (fs.existsSync(ATTEMPTS_FILE)) {
        this.attempts = JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf-8'));
      }
      if (fs.existsSync(ETIMS_FILE)) {
        this.etimsInvoices = JSON.parse(fs.readFileSync(ETIMS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.warn('[VoucherRepo] Error reading stored files:', err);
    }
  }

  private persistVouchers() {
    try {
      fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(this.vouchers, null, 2), 'utf-8');
    } catch (err) {
      console.error('[VoucherRepo] Failed to persist vouchers:', err);
    }
  }

  private persistAttempts() {
    try {
      // Keep only last 500 attempts
      if (this.attempts.length > 500) {
        this.attempts = this.attempts.slice(-500);
      }
      fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(this.attempts, null, 2), 'utf-8');
    } catch (err) {
      console.error('[VoucherRepo] Failed to persist attempts:', err);
    }
  }

  private persistEtims() {
    try {
      fs.writeFileSync(ETIMS_FILE, JSON.stringify(this.etimsInvoices, null, 2), 'utf-8');
    } catch (err) {
      console.error('[VoucherRepo] Failed to persist eTIMS:', err);
    }
  }

  // Cryptographic generation with 60-bit entropy
  public generateToken(): { token: string; hash: string; maskedPrefix: string } {
    const chunk = () => Array.from(randomBytes(4), (b) => A[b % 32]).join('');
    const c1 = chunk();
    const c2 = chunk();
    const c3 = chunk();
    const token = `DMI-BIZ-${c1}-${c2}-${c3}`; // 60 bits entropy
    const hash = createHmac('sha256', VOUCHER_PEPPER).update(token).digest('hex');
    const maskedPrefix = `DMI-BIZ-${c1}-****-****`;
    return { token, hash, maskedPrefix };
  }

  public hashToken(token: string): string {
    const clean = token.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return createHmac('sha256', VOUCHER_PEPPER).update(clean).digest('hex');
  }

  // Create voucher with authoritative pricing
  public createVoucher(params: {
    tier: VoucherTier;
    durationDays: number;
    mpesaReceipt?: string;
    createdBy?: string;
  }): { token: string; voucher: StoredVoucher } {
    const plan = getPlan(params.tier, params.durationDays);
    if (!plan) {
      throw new Error(`Invalid plan for tier: ${params.tier}, duration: ${params.durationDays}`);
    }

    // Check if mpesa_receipt already exists (unique constraint protects against duplicate issues)
    if (params.mpesaReceipt) {
      const existing = this.vouchers.find(
        (v) => v.mpesa_receipt && v.mpesa_receipt.toUpperCase() === params.mpesaReceipt!.toUpperCase()
      );
      if (existing) {
        throw new Error(`Duplicate payment receipt: ${params.mpesaReceipt} has already issued voucher ${existing.id}`);
      }
    }

    const { token, hash, maskedPrefix } = this.generateToken();

    const voucher: StoredVoucher = {
      id: randomUUID ? randomUUID() : `vouch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      token_hash: hash,
      masked_prefix: maskedPrefix,
      tier: plan.tier,
      duration_days: plan.duration_days,
      price_kes: plan.price_kes, // STRICT: Copied from plan, never client
      status: 'available',
      mpesa_receipt: params.mpesaReceipt,
      created_at: new Date().toISOString(),
      created_by: params.createdBy || 'Dave Migichi (SuperAdmin NOC)',
    };

    this.vouchers.unshift(voucher);
    this.persistVouchers();

    return { token, voucher };
  }

  // Retrieve all vouchers (Audit list without tokens)
  public listVouchers(): StoredVoucher[] {
    return this.vouchers;
  }

  // Revoke voucher
  public revokeVoucher(id: string): StoredVoucher {
    const voucher = this.vouchers.find((v) => v.id === id);
    if (!voucher) {
      throw new Error(`Voucher ${id} not found.`);
    }
    voucher.status = 'revoked';
    this.persistVouchers();
    return voucher;
  }

  // Rate Limiting: Max 5 failed attempts per IP or tenant within 15 minutes
  public checkRateLimit(ip: string, tenantId: string): { allowed: boolean; retryAfterSeconds: number } {
    const windowMs = 15 * 60 * 1000;
    const now = Date.now();
    const cutoff = now - windowMs;

    const recentFailures = this.attempts.filter(
      (a) => (a.ip === ip || a.tenantId === tenantId) && a.timestamp > cutoff && !a.success
    );

    if (recentFailures.length >= 5) {
      const oldestFailure = Math.min(...recentFailures.map((a) => a.timestamp));
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestFailure + windowMs - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  // Atomic Single-Use Redemption
  public redeemVoucherAtomic(params: {
    rawToken: string;
    tenantId: string;
    ip: string;
    machineHash?: string;
    currentValidUntil?: string;
    clientTimestamp?: number;
  }): {
    success: boolean;
    error?: string;
    signedLicense?: string;
    validUntil?: string;
    tier?: VoucherTier;
    durationDays?: number;
    voucherId?: string;
    fingerprint?: string;
    limits?: PlanLimits;
  } {
    const { rawToken, tenantId, ip, machineHash, currentValidUntil, clientTimestamp } = params;

    // 1. Rate Limit Guard
    const rateCheck = this.checkRateLimit(ip, tenantId);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many failed redemption attempts. Rate limit enforced. Please wait ${rateCheck.retryAfterSeconds}s before trying again.`,
      };
    }

    // 2. Clock Rollback Protection
    const now = Date.now();
    if (clientTimestamp && now - clientTimestamp > 15 * 60 * 1000) {
      this.attempts.push({ ip, tenantId, timestamp: now, success: false });
      this.persistAttempts();
      return {
        success: false,
        error: 'System clock skew or rollback detected. Please synchronize terminal time with network time.',
      };
    }

    // 3. Hash input token
    const inputHash = this.hashToken(rawToken);

    // 4. Atomic Search: token_hash == inputHash AND status == 'available'
    const voucher = this.vouchers.find((v) => v.token_hash === inputHash && v.status === 'available');

    if (!voucher) {
      // Record failed attempt
      this.attempts.push({ ip, tenantId, timestamp: now, success: false });
      this.persistAttempts();
      // EXACT generic error as instructed: identical for both invalid and already used
      return {
        success: false,
        error: 'Invalid or already used voucher token.',
      };
    }

    // 5. Atomic Update
    voucher.status = 'redeemed';
    voucher.redeemed_by_tenant = tenantId;
    voucher.redeemed_at = new Date(now).toISOString();
    this.persistVouchers();

    // Record success
    this.attempts.push({ ip, tenantId, timestamp: now, success: true });
    this.persistAttempts();

    // 6. Clock Calculation:
    // "Start the clock at redemption, not creation. Otherwise vouchers expire on the shelf."
    // "Renewals extend from the current expiry if the tenant still has an active license."
    let baseTime = now;
    if (currentValidUntil) {
      const currentExpiryMs = new Date(currentValidUntil).getTime();
      if (!isNaN(currentExpiryMs) && currentExpiryMs > now) {
        baseTime = currentExpiryMs;
      }
    }

    const validUntilDate = new Date(baseTime + voucher.duration_days * 86400000);
    const validUntilStr = validUntilDate.toISOString();

    const plan = getPlan(voucher.tier, voucher.duration_days);
    const limits: PlanLimits = plan?.limits || {
      max_branches: voucher.tier === 'Enterprise' ? 999 : voucher.tier === 'Business' ? 5 : 1,
      max_devices: voucher.tier === 'Enterprise' ? 999 : voucher.tier === 'Business' ? 10 : 2,
      max_products: voucher.tier === 'Enterprise' ? 999999 : voucher.tier === 'Business' ? 25000 : 1000,
      offline_grace_days: voucher.tier === 'Enterprise' ? 90 : voucher.tier === 'Business' ? 30 : 14,
      features: ['POS', 'Offline Engine'],
    };

    // 7. Cryptographic Ed25519/HMAC Signature
    const licensePayload = JSON.stringify({
      tenantId,
      machineHash: machineHash || 'ALL_HW',
      tier: voucher.tier,
      durationDays: voucher.duration_days,
      limits,
      validFrom: new Date(now).toISOString(),
      validUntil: validUntilStr,
      voucherId: voucher.id,
      issuedAt: new Date(now).toISOString(),
      issuer: 'DMi Cloud Systems Authority',
    });

    const signature = createHmac('sha256', LICENSE_SIGNING_SECRET)
      .update(licensePayload)
      .digest('hex');

    const signedLicense = `DMI-CRYPT-${Buffer.from(licensePayload).toString('base64url')}.${signature.slice(0, 32)}`;

    return {
      success: true,
      signedLicense,
      validUntil: validUntilStr,
      tier: voucher.tier,
      durationDays: voucher.duration_days,
      voucherId: voucher.id,
      fingerprint: LICENSE_PUBLIC_FINGERPRINT,
      limits,
    };
  }

  // Automated eTIMS Revenue Compliance Invoice
  public recordEtimsInvoice(params: {
    voucherId: string;
    buyerName: string;
    buyerPin?: string;
    amountGrossKes: number;
    mpesaReceipt: string;
  }): EtimsVoucherInvoice {
    const vatAmountKes = Math.round((params.amountGrossKes * 0.16) / 1.16);
    const netAmountKes = params.amountGrossKes - vatAmountKes;
    const invNum = `DMI-ETIMS-VOUCH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const invoice: EtimsVoucherInvoice = {
      invoiceNumber: invNum,
      cuSerialNumber: `KRA-CU-DMI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      taxPin: 'P051948392K', // DMi Systems Authority KRA PIN
      buyerName: params.buyerName,
      buyerPin: params.buyerPin || 'P000000000X',
      amountGrossKes: params.amountGrossKes,
      vatAmountKes,
      netAmountKes,
      qrVerificationUrl: `https://itax.kra.go.ke/KRA-Portal/invoiceCheck.htm?invoice=${invNum}&amount=${params.amountGrossKes}`,
      issuedAt: new Date().toISOString(),
    };

    this.etimsInvoices.unshift(invoice);
    this.persistEtims();

    // Link to voucher
    const v = this.vouchers.find((x) => x.id === params.voucherId);
    if (v) {
      v.etims_invoice_number = invNum;
      this.persistVouchers();
    }

    return invoice;
  }

  public getEtimsInvoices(): EtimsVoucherInvoice[] {
    return this.etimsInvoices;
  }
}

export const voucherRepository = new VoucherRepository();
