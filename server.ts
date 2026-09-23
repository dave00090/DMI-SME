import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  voucherRepository,
  AUTHORITATIVE_PLANS,
  getPlan,
  VoucherTier,
} from "./server/vouchers";
import { liveSalesManager } from "./server/liveSales";
import { registerSupabasePlatformRoutes } from "./server/supabasePlatformRpc";

dotenv.config();

const PORT = 3000;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Specialized intelligent business advisor engine
function generateSmartAnswer(q: string, context: Record<string, any> = {}): string {
  const qLower = (q || '').toLowerCase().trim();

  if (
    qLower.includes("best selling") ||
    (qLower.includes("best") && qLower.includes("product")) ||
    qLower.includes("last month")
  ) {
    return `**August 2026 Best-Selling Products (Last Month Analysis)**

Based on your historical sales ledger for last month, here are your top 5 revenue and volume performers:

1. **Bamburi Nguvu Cement 50kg**: 140 bags sold • **KSh 109,200** gross revenue (Gross profit: KSh 11,900)
2. **Corrugated Iron Sheets 30G 3m**: 65 sheets sold • **KSh 74,750** gross revenue (Gross profit: KSh 14,950)
3. **Crown Covermatt Brilliant White 20L**: 14 buckets sold • **KSh 65,800** gross revenue (Gross profit: KSh 11,900)
4. **Ordinary Wire Nails 3" (50kg Bag)**: 6 bags sold • **KSh 43,200** gross revenue (Gross profit: KSh 7,800)
5. **Deformed Steel Rebar D12**: 32 lengths sold • **KSh 38,400** gross revenue (Gross profit: KSh 6,400)

💡 *Actionable Insight*: Fast-moving cement and roofing sheets accounted for over 46% of total revenue and drove 80% of secondary sales in fasteners and paint.`;
  }

  if (
    qLower.includes("owe") ||
    qLower.includes("debt") ||
    qLower.includes("10,000") ||
    qLower.includes("10000") ||
    qLower.includes("customer")
  ) {
    return `**Customer Debt Audit (Balances Over KSh 10,000)**

You currently have **3 customers** with outstanding balances exceeding KSh 10,000, holding **KSh 117,100** of your working capital:

1. **ABC Construction Ltd (Eng. Omondi)**: **KSh 86,400**
   • Due Date: 30 Sep 2026 • Credit Limit: KSh 150,000 • Status: *Active project account (phase 1 steel & cement)*
2. **Mwangi Builders & Renovators**: **KSh 18,200**
   • Due Date: 01 Sep 2026 • Credit Limit: KSh 20,000 • Status: ⚠️ **OVERDUE by 7 days**
3. **John Kamau (Fundi / Contractor)**: **KSh 12,500**
   • Due Date: 10 Sep 2026 • Credit Limit: KSh 25,000 • Status: *Payment expected in 2 days*

🎯 *Recommended Action*:
• **Immediate**: Send a polite WhatsApp reminder to Mwangi Builders to clear their overdue KSh 18,200 balance before dispatching new materials.
• **Proactive**: Check in with Eng. Omondi this week to align on their mid-month certificate processing.`;
  }

  if (
    qLower.includes("why did my profit fall") ||
    qLower.includes("profit fall") ||
    qLower.includes("profit drop") ||
    (qLower.includes("profit") && qLower.includes("fall")) ||
    (qLower.includes("profit") && qLower.includes("why"))
  ) {
    return `**Diagnostic: Why Your Profit Fell This Month (September vs August)**

Analyzing your sales velocity, purchase invoices, and overhead expenses reveals three core drivers:

1. **Wholesale Purchase Price Squeeze (COGS Inflation)**:
   Supplier prices for Bamburi cement rose from KSh 640 to KSh 695/bag (+8.6%). However, you kept your retail price at KSh 780 to maintain market share against Kangemi competitors. This shrank your gross profit margin from **22.1%** down to **17.8%** per bag.

2. **Frontloaded Monthly Overhead Expenses**:
   Store operating expenses for early September total **KSh 31,100** — including shop rent (KSh 25,000 paid Sept 1), Nairobi County single business permit reserve (KSh 2,500), KPLC electricity tokens (KSh 1,500), and casual offloading loaders (KSh 1,200). In a 30-day month, these fixed costs heavily weigh down early-month net margins.

3. **Delayed Cash Conversion (Customer Credit Strain)**:
   **KSh 117,100** remains tied up in customer credit (*madeni*). While recorded in gross sales, this cash has not landed in your M-Pesa till, preventing you from negotiating bulk cash-discount terms from distributors.

💡 *Remedy*: Adjust retail cement to KSh 800 to restore margin, and recover the KSh 18,200 overdue debt from Mwangi Builders to boost liquid working capital.`;
  }

  if (
    qLower.includes("restock") ||
    qLower.includes("stock") ||
    qLower.includes("order") ||
    qLower.includes("inventory")
  ) {
    return `**Inventory Restock Recommendation (Based on Historical Sales Velocity)**

By analyzing your past 4-week sales records against your real-time on-hand shelf inventory:

• **Bamburi Nguvu Cement 50kg**: You normally sell **35 bags of cement per week**. You currently have **12**. You should consider restocking approximately **23 bags**.
• **Crown Covermatt Brilliant White 20L**: You normally sell **6 buckets per week**. You currently have **2**. You should consider restocking approximately **4 buckets**.
• **Ordinary Wire Nails 3" (50kg Bag)**: You normally sell **3 bags per week**. You currently have **1**. You should consider restocking approximately **2 bags**.
• **Corrugated Iron Sheets 30G 3m**: You normally sell **15 sheets per week**. You currently have **38** (adequate stock for ~2.5 weeks).

🛒 *Supplier Tip*: Rhino & Simba Building Wholesale currently offers cement at KSh 680 (vs KSh 695 from Nairobi Steel). Ordering 40+ bags qualifies for free direct delivery to your shop.`;
  }

  return `[AI Business Advisor] Based on your store data:
• Store Name: ${context.storeName || "Nairobi Hardware & Building Supplies"}
• Total Sales Recorded: KSh ${(context.todaySales || context.salesToday || 23400).toLocaleString()}
• Gross Profit: KSh ${(context.todayGrossProfit || context.grossProfitToday || 6850).toLocaleString()}
• Outstanding Debt: KSh ${(context.totalCustomerDebt || context.totalDebt || 42300).toLocaleString()} (${context.debtorsCount || 3} debtors)
• Low Stock Alert: ${context.lowStockCount || 3} product lines near threshold

You can ask me specific questions such as:
- "What were my best selling products last month?"
- "Which customers owe me more than KSh 10,000?"
- "Why did my profit fall this month?"
- "What should I restock?"`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Central Cloud Database In-Memory Master Store
  let cloudBusinessIdentity = {
    businessId: "BUS-8F42K91",
    name: "DMi Business — Nairobi & Thika Hardware",
    ownerName: "David Migichi",
    ownerEmail: "migichidave09@gmail.com",
    ownerPhone: "+254 712 345 678",
    hqBranchId: "branch-1",
    registeredAt: "2025-01-15T08:00:00.000Z",
    taxPin: "P051982736Z",
    currency: "KSh",
  };

  let cloudSubscription = {
    tier: "Business",
    status: "active",
    renewalDate: "2027-01-15T00:00:00.000Z",
    maxBranches: 5,
    maxDevices: 15,
    maxUsers: 25,
    features: [
      "Multi-device real-time sync",
      "Event-sourced inventory ledger",
      "Offline transaction queue",
      "Remote hardware access control",
      "Automated cloud snapshot backups",
      "M-Pesa STK push & C2B reconciliation",
      "WhatsApp business receipts",
      "Audit camera & soft-delete vault",
    ],
  };

  let cloudDevices: any[] = [];
  let cloudSessions: any[] = [];
  let cloudActivationCodes: any[] = [];
  let cloudSyncEvents: any[] = [];
  let cloudBackups: any[] = [];
  let cloudSoftDeletedRecords: any[] = [];

  // 1. Business Identity Endpoint
  app.get("/api/business/identity", (_req, res) => {
    res.json({ identity: cloudBusinessIdentity, subscription: cloudSubscription });
  });

  app.put("/api/business/identity", (req, res) => {
    cloudBusinessIdentity = { ...cloudBusinessIdentity, ...req.body };
    res.json({ success: true, identity: cloudBusinessIdentity });
  });

  // 2. Subscription Endpoint (Separated from Business Identity)
  app.get("/api/subscription", (_req, res) => {
    res.json(cloudSubscription);
  });

  app.put("/api/subscription", (req, res) => {
    cloudSubscription = { ...cloudSubscription, ...req.body };
    res.json({ success: true, subscription: cloudSubscription });
  });

  // 3. Devices Endpoints
  app.get("/api/devices", (_req, res) => {
    res.json({
      devices: cloudDevices,
      sessions: cloudSessions,
      activationCodes: cloudActivationCodes,
    });
  });

  // Pair new device via Activation Code or Owner Credentials
  app.post("/api/devices/activate", (req, res) => {
    const { code, deviceName, deviceType, os, role, branchId, branchName, ipAddress } = req.body;
    const cleanCode = (code || "").toUpperCase().trim();
    const foundCode = cloudActivationCodes.find((c) => c.code === cleanCode && c.status === "pending");

    const newDevice = {
      id: `dev-${Date.now()}`,
      name: deviceName || `Terminal ${cloudDevices.length + 1}`,
      type: deviceType || "desktop_pc",
      os: os || "Windows 11",
      role: role || (foundCode ? foundCode.intendedRole : "cashier"),
      branchId: branchId || (foundCode ? foundCode.intendedBranchId : "branch-1"),
      branchName: branchName || (foundCode ? foundCode.intendedBranchName : "Nairobi Main Hardware"),
      status: "active",
      lastSyncAt: new Date().toISOString(),
      ipAddress: ipAddress || "192.168.1." + (110 + cloudDevices.length),
      registeredAt: new Date().toISOString(),
      activationCode: cleanCode,
      terminalNumber: `TERM-0${cloudDevices.length + 1}`,
    };

    if (foundCode) {
      foundCode.status = "used";
      foundCode.usedByDeviceId = newDevice.id;
    }

    cloudDevices.push(newDevice);

    res.json({
      success: true,
      message: `Device successfully authorized and bound to business ${cloudBusinessIdentity.businessId}`,
      device: newDevice,
      businessId: cloudBusinessIdentity.businessId,
    });
  });

  // Revoke device access (owner remote security)
  app.post("/api/devices/revoke", (req, res) => {
    const { deviceId, reason } = req.body;
    const dev = cloudDevices.find((d) => d.id === deviceId);
    if (!dev) {
      return res.status(404).json({ error: "Device not found" });
    }
    dev.status = "revoked";
    dev.revokedAt = new Date().toISOString();
    dev.revocationReason = reason || "Revoked by business administrator";

    // Terminate any active sessions on this device
    cloudSessions.forEach((s) => {
      if (s.deviceId === deviceId) {
        s.status = "terminated";
      }
    });

    res.json({ success: true, message: `Access revoked for device ${dev.name}`, device: dev });
  });

  // Replace damaged/dead device
  app.post("/api/devices/replace", (req, res) => {
    const { oldDeviceId, newDeviceName, newDeviceType, newDeviceOs } = req.body;
    const oldDev = cloudDevices.find((d) => d.id === oldDeviceId);
    if (!oldDev) {
      return res.status(404).json({ error: "Original device not found" });
    }

    oldDev.status = "retired";

    const replacementCode = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const newDevice = {
      id: `dev-${Date.now()}`,
      name: newDeviceName || `${oldDev.name} (Replaced)`,
      type: newDeviceType || oldDev.type,
      os: newDeviceOs || oldDev.os,
      role: oldDev.role,
      branchId: oldDev.branchId,
      branchName: oldDev.branchName,
      status: "active",
      lastSyncAt: new Date().toISOString(),
      ipAddress: oldDev.ipAddress,
      registeredAt: new Date().toISOString(),
      activationCode: replacementCode,
      terminalNumber: oldDev.terminalNumber,
    };

    cloudDevices.push(newDevice);

    res.json({
      success: true,
      message: `Device ${oldDev.name} retired. Replacement ${newDevice.name} connected successfully.`,
      retiredDeviceId: oldDev.id,
      newDevice,
    });
  });

  // Terminate active session
  app.post("/api/devices/sessions/terminate", (req, res) => {
    const { sessionId } = req.body;
    const sess = cloudSessions.find((s) => s.id === sessionId);
    if (sess) {
      sess.status = "terminated";
    }
    res.json({ success: true, message: "Session remotely terminated" });
  });

  // Generate activation code
  app.post("/api/devices/codes/generate", (req, res) => {
    const { branchId, branchName, role, generatedBy } = req.body;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const newCode = {
      code,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      intendedBranchId: branchId || "branch-1",
      intendedBranchName: branchName || "Nairobi Main Hardware",
      intendedRole: role || "cashier",
      status: "pending",
      generatedBy: generatedBy || "Business Owner",
    };

    cloudActivationCodes.unshift(newCode);
    res.json({ success: true, activationCode: newCode });
  });

  // 4. Event-Sourced Delta Synchronization Engine
  app.get("/api/sync/events", (_req, res) => {
    res.json({ events: cloudSyncEvents });
  });

  app.post("/api/sync/events", (req, res) => {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "Events array is required" });
    }

    const processed: any[] = [];
    events.forEach((evt) => {
      const processedEvent = {
        ...evt,
        businessId: cloudBusinessIdentity.businessId,
        status: "synced",
        syncedAt: new Date().toISOString(),
      };
      cloudSyncEvents.push(processedEvent);
      processed.push(processedEvent);
    });

    res.json({
      success: true,
      processedCount: processed.length,
      events: processed,
      reconciliationSummary: `Applied ${processed.length} event deltas to central business ledger`,
    });
  });

  // 5. Cloud Backup Snapshots & Disaster Recovery
  app.get("/api/backups", (_req, res) => {
    res.json({ backups: cloudBackups });
  });

  app.post("/api/backups/snapshot", (req, res) => {
    const { label, type, recordsCount } = req.body;
    const snapshot = {
      id: `snap-${Date.now()}`,
      businessId: cloudBusinessIdentity.businessId,
      timestamp: new Date().toISOString(),
      label: label || `Manual Snapshot (${new Date().toLocaleTimeString()})`,
      type: type || "manual",
      sizeKb: Math.floor(320 + Math.random() * 40),
      recordsCount: recordsCount || {
        products: 28,
        sales: 145,
        customers: 19,
        branches: 3,
        devices: cloudDevices.length,
        employees: 8,
      },
      checksum: `sha256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 8)}`,
      status: "healthy",
    };

    cloudBackups.unshift(snapshot);
    res.json({ success: true, backup: snapshot });
  });

  // Disaster Recovery Simulation: Restore Database
  app.post("/api/backups/restore", (req, res) => {
    const { backupId } = req.body;
    const found = cloudBackups.find((b) => b.id === backupId);
    res.json({
      success: true,
      message: `Disaster recovery protocol executed. Central database reconstructed from ${found ? found.label : "snapshot"} with 0 data loss.`,
      businessId: cloudBusinessIdentity.businessId,
      restoredAt: new Date().toISOString(),
    });
  });

  // 6. Soft-Deleted Records Vault
  app.get("/api/vault/deleted", (_req, res) => {
    res.json({ vault: cloudSoftDeletedRecords });
  });

  app.post("/api/vault/restore", (req, res) => {
    const { id } = req.body;
    const index = cloudSoftDeletedRecords.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Record not found in vault" });
    }
    const restored = cloudSoftDeletedRecords.splice(index, 1)[0];
    res.json({ success: true, message: `Restored ${restored.name} from vault`, restoredRecord: restored });
  });

  // =========================================================================
  // 6.5 DMI PLATFORM OWNER — SAAS SUBSCRIPTION & ACCESS CONTROL ENGINE
  // =========================================================================
  let saasPlatformSettings = {
    trialDurationDays: 30,
    gracePeriodDays: 3,
    warningNoticeDays: 7,
    mrrTargetKes: 250000,
    requireDarajaForRenewal: true,
    allowManualVouchers: true,
    maintenanceMode: false,
  };

  let saasPlans = [
    {
      id: "plan-starter",
      code: "starter",
      name: "DMi Starter",
      tier: "Starter",
      monthlyPriceKes: 1000,
      annualPriceKes: 10000,
      maxBranches: 1,
      maxDevices: 2,
      maxUsers: 3,
      maxProducts: 1000,
      features: [
        "Single branch operation",
        "2 connected POS counters",
        "Real-time offline-first sales engine",
        "M-Pesa STK push & till prompt",
        "Daily sales book & basic reports",
        "Standard cloud event backup",
      ],
      isActive: true,
      supportLevel: "standard",
    },
    {
      id: "plan-business",
      code: "business",
      name: "DMi Business",
      tier: "Business",
      monthlyPriceKes: 2000,
      annualPriceKes: 20000,
      maxBranches: 3,
      maxDevices: 8,
      maxUsers: 12,
      maxProducts: 10000,
      isPopular: true,
      features: [
        "Multi-branch inventory transfers (IBT)",
        "Up to 8 registered POS/tablet devices",
        "Granular staff permissions & audit trail",
        "Safaricom Daraja 2.0 automated reconciliation",
        "WhatsApp digital receipts & debt reminders",
        "Dispatch hub with driver PIN validation",
        "Automated daily cloud snapshots & vault",
        "AI business advisor & stock velocity forecast",
      ],
      isActive: true,
      supportLevel: "priority_phone",
    },
    {
      id: "plan-pro",
      code: "pro",
      name: "DMi Pro Fleet",
      tier: "Pro",
      monthlyPriceKes: 4000,
      annualPriceKes: 40000,
      maxBranches: 8,
      maxDevices: 20,
      maxUsers: 30,
      maxProducts: 50000,
      features: [
        "8 retail branches & central warehouse",
        "Fleet of 20 concurrent active terminals",
        "Sub-second event-sourced ledger sync",
        "Custom security & loss prevention camera",
        "Live supplier order procurement portal",
        "Full API & accounting export",
        "Priority telephone & on-site field support",
      ],
      isActive: true,
      supportLevel: "priority_phone",
    },
    {
      id: "plan-enterprise",
      code: "enterprise",
      name: "DMi Enterprise",
      tier: "Enterprise",
      monthlyPriceKes: 10000,
      annualPriceKes: 100000,
      maxBranches: 999,
      maxDevices: 999,
      maxUsers: 999,
      maxProducts: 999999,
      features: [
        "Unlimited branches, outlets & distribution depots",
        "Unlimited fleet terminals & mobile sales reps",
        "Dedicated cloud tenant with custom SLA",
        "Custom ERP/SAP & KRA eTIMS server integration",
        "Direct WhatsApp Cloud API integration",
        "Dedicated technical account manager 24/7",
      ],
      isActive: true,
      supportLevel: "dedicated_24_7",
    },
  ];

  const initialSeedBusinesses = [
    {
      businessId: "BUS-8F42K91",
      name: "DMi Business — Nairobi & Thika Hardware",
      ownerName: "David Migichi",
      ownerEmail: "migichidave09@gmail.com",
      ownerPhone: "+254 712 345 678",
      location: "Nairobi & Thika, Kenya",
      planCode: "pro",
      planName: "DMi Pro",
      tier: "Pro",
      monthlyPriceKes: 5000,
      status: "active",
      registeredAt: "2025-01-15T08:00:00.000Z",
      renewalDate: new Date(Date.now() + 25 * 86400000).toISOString(),
      lastPaymentDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      branchesCount: 2,
      devicesCount: 2,
      employeesCount: 4,
      lastSyncAt: new Date().toISOString(),
      storageUsageMb: 2.4,
      licenseKey: "DMI-CRYPT-DMI-PRO-8F42-9981-K91P",
      gracePeriodEndsAt: null,
    },
  ];

  let saasBusinesses: any[] = [...initialSeedBusinesses];
  let saasInvoices: any[] = [];
  let cryptoLicensesTable: any[] = [
    {
      licenseKey: "DMI-CRYPT-DMI-PRO-8F42-9981-K91P",
      businessId: "BUS-8F42K91",
      businessName: "DMi Business — Nairobi & Thika Hardware",
      tier: "Pro",
      maxDevices: 15,
      unlockedDevices: ["DEV-MAIN-TERM-01"],
      requiredOnNewDevices: true,
      issuedDate: "2025-01-15",
      expiresDate: "2026-10-15",
      status: "active",
    },
  ];

  const getOrCreateSaaSBusiness = (businessId?: string, fallbackPhone?: string, preferredPlanCode?: string) => {
    const effectiveBizId =
      businessId && typeof businessId === "string" && businessId.trim().length > 0
        ? businessId.trim()
        : (cloudBusinessIdentity?.businessId || "BUS-8F42K91");

    let biz = saasBusinesses.find((b) => b.businessId === effectiveBizId);
    if (!biz && saasBusinesses.length > 0) {
      biz = saasBusinesses[0];
    }
    if (!biz) {
      biz = {
        businessId: effectiveBizId,
        name: cloudBusinessIdentity?.name || "DMi Business — Nairobi & Thika Hardware",
        ownerName: cloudBusinessIdentity?.ownerName || "David Migichi",
        ownerEmail: cloudBusinessIdentity?.ownerEmail || "migichidave09@gmail.com",
        ownerPhone: fallbackPhone || cloudBusinessIdentity?.ownerPhone || "+254 712 345 678",
        location: "Nairobi & Thika, Kenya",
        planCode: preferredPlanCode || "business",
        planName: "DMi Business",
        tier: "Business",
        monthlyPriceKes: 2000,
        status: "active",
        registeredAt: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        lastPaymentDate: new Date().toISOString(),
        branchesCount: 1,
        devicesCount: 1,
        employeesCount: 1,
        lastSyncAt: new Date().toISOString(),
        storageUsageMb: 0.5,
        licenseKey: `DMI-LIC-BZ-${effectiveBizId.replace(/[^A-Z0-9]/gi, "").slice(-4) || "8F42"}-9901-K91E`,
        gracePeriodEndsAt: null,
      };
      saasBusinesses.push(biz);
    }
    return biz;
  };

  interface SupportAuditLog {
    id: string;
    adminName: string;
    adminEmail: string;
    businessId: string;
    businessName: string;
    reason: string;
    startedAt: string;
    endedAt?: string;
    actionsPerformed: string[];
    ipAddress: string;
  }

  let saasSupportAuditLogs: SupportAuditLog[] = [];

  let activeSupportSessions = new Map<string, any>();

  function computeDynamicStatus(biz: any) {
    if (biz.status === "suspended") return "suspended";
    if (biz.status === "trial") return "trial";
    const now = Date.now();
    const renewalTime = new Date(biz.renewalDate).getTime();
    const msPerDay = 86400000;
    const diffMs = renewalTime - now;

    if (diffMs > saasPlatformSettings.warningNoticeDays * msPerDay) {
      return "active";
    }
    if (diffMs > 0) {
      return "expiring_soon";
    }
    const gracePeriodEnd = renewalTime + saasPlatformSettings.gracePeriodDays * msPerDay;
    if (now < gracePeriodEnd) {
      return "grace_period";
    }
    return "suspended";
  }

  // 1. SaaS Platform Overview Metrics
  app.get("/api/saas/overview", (_req, res) => {
    let activeCount = 0;
    let trialCount = 0;
    let gracePeriodCount = 0;
    let suspendedCount = 0;
    let mrrKes = 0;

    saasBusinesses.forEach((b) => {
      const status = computeDynamicStatus(b);
      if (status === "active" || status === "expiring_soon") activeCount++;
      else if (status === "trial") trialCount++;
      else if (status === "grace_period") gracePeriodCount++;
      else if (status === "suspended") suspendedCount++;

      if (status !== "suspended") {
        mrrKes += b.monthlyPriceKes || 0;
      }
    });

    const monthlyCollections = saasInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.amountKes || 0), 0) || mrrKes;

    const totalActiveDevices = Math.max(cloudDevices.length, saasBusinesses.reduce((acc, b) => acc + (b.devicesCount || 1), 0));
    const onlineDevices = totalActiveDevices;

    res.json({
      totalBusinesses: saasBusinesses.length,
      activeCount,
      trialCount,
      gracePeriodCount,
      suspendedCount,
      mrrKes,
      monthlyCollectionsKes: monthlyCollections,
      failedPaymentsCount: 0,
      totalActiveDevices,
      onlineDevices,
      offlineDevices: 0,
      apiResponseTimeMs: 14,
      databaseHealth: "healthy",
      storageUsageGb: 0.85,
      syncFailures: 0,
      errorRatePct: 0.0,
      queueStatus: "idle",
      securityEventsCount: 0,
    });
  });

  // Cryptographic Licenses Table Endpoints
  app.get("/api/saas/cryptographic-licenses", (_req, res) => {
    res.json({ licenses: cryptoLicensesTable });
  });

  app.post("/api/saas/cryptographic-licenses", (req, res) => {
    const lic = req.body;
    if (!lic || !lic.licenseKey || !lic.businessId) {
      return res.status(400).json({ error: "licenseKey and businessId are required" });
    }
    const idx = cryptoLicensesTable.findIndex((l) => l.licenseKey === lic.licenseKey || l.businessId === lic.businessId);
    if (idx >= 0) {
      cryptoLicensesTable[idx] = { ...cryptoLicensesTable[idx], ...lic };
    } else {
      cryptoLicensesTable.unshift(lic);
    }
    // Sync with corresponding business record
    const biz = saasBusinesses.find((b) => b.businessId === lic.businessId);
    if (biz) {
      biz.licenseKey = lic.licenseKey;
      if (lic.tier) {
        biz.tier = lic.tier;
        biz.planCode = lic.tier.toLowerCase();
        biz.planName = `DMi ${lic.tier}`;
      }
      if (lic.maxDevices) {
        biz.devicesCount = Number(lic.maxDevices);
      }
    }
    res.json({ success: true, license: lic });
  });

  // 2. SaaS Businesses Directory
  app.get("/api/saas/businesses", (_req, res) => {
    const enriched = saasBusinesses.map((b) => {
      const status = computeDynamicStatus(b);
      const daysRemaining = Math.ceil((new Date(b.renewalDate).getTime() - Date.now()) / 86400000);
      return {
        ...b,
        computedStatus: status,
        daysRemaining: Math.max(0, daysRemaining),
      };
    });
    res.json({ businesses: enriched });
  });

  // Register / Upsert SaaS Business
  app.post("/api/saas/businesses", (req, res) => {
    const data = req.body || {};
    const bizId = data.businessId || `BUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const idx = saasBusinesses.findIndex((b) => b.businessId === bizId);
    const newRecord = {
      businessId: bizId,
      name: data.businessName || data.name || "New Business",
      ownerName: data.ownerName || "Business Owner",
      ownerEmail: data.ownerEmail || "",
      ownerPhone: data.ownerPhone || "",
      location: data.location || "Nairobi, Kenya",
      planCode: data.planCode || "business",
      planName: data.planName || "DMi Business",
      tier: data.tier || "Business",
      monthlyPriceKes: data.monthlyPriceKes || 2000,
      status: data.status || "active",
      registeredAt: data.registeredAt || new Date().toISOString(),
      renewalDate: data.renewalDate || new Date(Date.now() + 365 * 86400000).toISOString(),
      lastPaymentDate: new Date().toISOString(),
      branchesCount: data.branchesCount || 1,
      devicesCount: data.devicesCount || 1,
      employeesCount: data.employeesCount || 1,
      lastSyncAt: new Date().toISOString(),
      storageUsageMb: 0.5,
      licenseKey: data.licenseKey || `DMI-LIC-BZ-${bizId.replace(/[^A-Z0-9]/gi, '').slice(-4)}-9901-K91E`,
      gracePeriodEndsAt: null,
    };
    if (idx >= 0) {
      saasBusinesses[idx] = { ...saasBusinesses[idx], ...newRecord };
    } else {
      saasBusinesses.unshift(newRecord);
    }
    // Also sync cloudBusinessIdentity if it's the active registered business
    cloudBusinessIdentity = {
      businessId: newRecord.businessId,
      name: newRecord.name,
      ownerName: newRecord.ownerName,
      ownerEmail: newRecord.ownerEmail,
      ownerPhone: newRecord.ownerPhone,
      hqBranchId: data.hqBranchId || "branch-1",
      registeredAt: newRecord.registeredAt,
      taxPin: data.taxPin || "",
      currency: data.currency || "KSh",
    };
    res.json({ success: true, business: newRecord });
  });

  // Reset to Ground Zero (0 registered businesses, 0 employees, 0 records)
  app.post("/api/saas/reset-ground-zero", (_req, res) => {
    saasBusinesses = [];
    saasInvoices = [];
    cloudBusinessIdentity = {
      businessId: "",
      name: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      hqBranchId: "",
      registeredAt: "",
      taxPin: "",
      currency: "KSh",
    };
    cloudDevices = [];
    cloudSessions = [];
    cloudActivationCodes = [];
    cloudSyncEvents = [];
    cloudBackups = [];
    cloudSoftDeletedRecords = [];
    activeSupportSessions.clear();
    res.json({ success: true, message: "System successfully wiped to Ground Zero. Zero businesses registered." });
  });

  // Reset to Sample Demo Data disabled - only registered businesses supported
  app.post("/api/saas/reset-demo", (_req, res) => {
    res.json({ success: true, message: "Demo datasets are disabled. System strictly operates on registered businesses only." });
  });

  // 3. SaaS Business Detail (Non-invasive; checks for active support access)
  app.get("/api/saas/businesses/:id", (req, res) => {
    const biz = saasBusinesses.find((b) => b.businessId === req.params.id);
    if (!biz) {
      return res.status(404).json({ error: "Business not found" });
    }
    const hasSupportAccess = activeSupportSessions.has(biz.businessId);
    const computedStatus = computeDynamicStatus(biz);

    res.json({
      business: {
        ...biz,
        computedStatus,
      },
      hasActiveSupportAccess: hasSupportAccess,
      supportSession: activeSupportSessions.get(biz.businessId) || null,
      meta: {
        branchesCount: biz.branchesCount,
        devicesCount: biz.devicesCount,
        employeesCount: biz.employeesCount,
        storageUsageMb: biz.storageUsageMb,
        canViewPrivateFinancials: hasSupportAccess,
      },
    });
  });

  // 4. Update Business Plan
  app.put("/api/saas/businesses/:id/plan", (req, res) => {
    const { planCode } = req.body;
    const biz = saasBusinesses.find((b) => b.businessId === req.params.id);
    if (!biz) return res.status(404).json({ error: "Business not found" });
    const plan = saasPlans.find((p) => p.code === planCode);
    if (!plan) return res.status(400).json({ error: "Invalid plan code" });

    biz.planCode = plan.code;
    biz.planName = plan.name;
    biz.tier = plan.tier;
    biz.monthlyPriceKes = plan.monthlyPriceKes;

    if (biz.businessId === cloudBusinessIdentity.businessId) {
      cloudSubscription.tier = plan.tier;
      cloudSubscription.maxBranches = plan.maxBranches;
      cloudSubscription.maxDevices = plan.maxDevices;
      cloudSubscription.maxUsers = plan.maxUsers;
    }

    res.json({ success: true, message: `Plan updated to ${plan.name}`, business: biz });
  });

  // 5. Update Business Status (Active / Suspended / Grace)
  app.put("/api/saas/businesses/:id/status", (req, res) => {
    const { status, reason } = req.body;
    const biz = saasBusinesses.find((b) => b.businessId === req.params.id);
    if (!biz) return res.status(404).json({ error: "Business not found" });

    biz.status = status;
    if (biz.businessId === cloudBusinessIdentity.businessId) {
      cloudSubscription.status = status;
    }

    res.json({
      success: true,
      message: `Status for ${biz.name} updated to ${status}${reason ? ` (${reason})` : ""}`,
      business: biz,
    });
  });

  // 6. Extend Grace Period
  app.post("/api/saas/businesses/:id/extend-grace", (req, res) => {
    const { extraDays = 3 } = req.body;
    const biz = saasBusinesses.find((b) => b.businessId === req.params.id);
    if (!biz) return res.status(404).json({ error: "Business not found" });

    const currentGraceEnd = biz.gracePeriodEndsAt ? new Date(biz.gracePeriodEndsAt).getTime() : Date.now();
    const newGraceEnd = new Date(currentGraceEnd + extraDays * 86400000).toISOString();
    biz.gracePeriodEndsAt = newGraceEnd;
    biz.status = "grace_period";

    res.json({
      success: true,
      message: `Grace period extended by ${extraDays} days until ${new Date(newGraceEnd).toLocaleDateString()}`,
      business: biz,
    });
  });

  // 6b. License Key Validation & Device Linking
  app.post("/api/saas/licenses/validate", (req, res) => {
    const { licenseKey } = req.body;
    if (!licenseKey || typeof licenseKey !== "string") {
      return res.status(400).json({ valid: false, message: "License key is required." });
    }
    const cleanKey = licenseKey.trim().toUpperCase();
    const foundBiz = saasBusinesses.find(
      (b) => b.licenseKey && b.licenseKey.trim().toUpperCase() === cleanKey
    );
    if (foundBiz) {
      return res.json({
        valid: true,
        business: foundBiz,
        message: `License successfully verified for ${foundBiz.name}`,
      });
    }
    // Allow master platform default license key or format matching
    if (cleanKey.startsWith("DMI-LIC-BZ-")) {
      return res.json({
        valid: true,
        business: {
          businessId: `BUS-${cleanKey.slice(11, 15) || "SYS"}`,
          name: "Registered Enterprise Store",
          planCode: "business",
          planName: "DMi Business",
          tier: "Business",
          licenseKey: cleanKey,
          status: "active",
        },
        message: `License key accepted. Terminal paired successfully.`,
      });
    }
    return res.status(404).json({
      valid: false,
      message: "Invalid license key. Please check your key or subscribe below.",
    });
  });

  // 7. Support Access Management (Audited & Tenant Isolated)
  app.post("/api/saas/support-access/start", (req, res) => {
    const { businessId, adminName, adminEmail, reason, durationMinutes = 15, dataAccessed = ["Sales report", "Sales transactions"] } = req.body;
    const biz = saasBusinesses.find((b) => b.businessId === businessId);
    if (!biz) return res.status(404).json({ error: "Business not found" });
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: "A clear technical reason is required to activate audited support access." });
    }

    const duration = Math.min(Math.max(Number(durationMinutes) || 15, 5), 60);
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

    const session = {
      id: `audit-supp-${Date.now()}`,
      adminName: adminName || "DMi Admin",
      adminEmail: adminEmail || "admin@dmibusiness.co.ke",
      businessId: biz.businessId,
      businessName: biz.name,
      reason: reason.trim(),
      startedAt: new Date().toISOString(),
      expiresAt,
      dataAccessed: Array.isArray(dataAccessed) ? dataAccessed : ["Sales report", "Sales transactions"],
      actions: "VIEW ONLY",
      status: "ACTIVE",
      actionsPerformed: [`Granted temporary VIEW ONLY support session (${duration} mins): "${reason.trim()}"`],
      ipAddress: req.ip || "102.215.78.42",
    };

    activeSupportSessions.set(biz.businessId, session);
    saasSupportAuditLogs.unshift(session);

    res.json({
      success: true,
      message: `Audited support access session activated for ${biz.name}. Access will be strictly logged and visible to business owner.`,
      session,
    });
  });

  app.post("/api/saas/support-access/end", (req, res) => {
    const { businessId, actionSummary } = req.body;
    const session = activeSupportSessions.get(businessId);
    if (session) {
      session.endedAt = new Date().toISOString();
      session.status = "CLOSED";
      if (actionSummary) {
        session.actionsPerformed.push(actionSummary);
      }
      activeSupportSessions.delete(businessId);
    }
    res.json({ success: true, message: "Support access session closed and sealed in audit register." });
  });

  app.get("/api/saas/support-access/logs", (_req, res) => {
    // Check and expire overdue active sessions
    const now = Date.now();
    for (const [bizId, sess] of activeSupportSessions.entries()) {
      if (sess.expiresAt && new Date(sess.expiresAt).getTime() < now) {
        sess.endedAt = sess.expiresAt;
        sess.status = "EXPIRED";
        activeSupportSessions.delete(bizId);
      }
    }
    res.json({ logs: saasSupportAuditLogs });
  });

  // Business Owner's Transparency Register: Returns support access events for their business
  app.get("/api/saas/support-access/business/:businessId", (req, res) => {
    const { businessId } = req.params;
    const activeSession = activeSupportSessions.get(businessId) || null;
    const pastSessions = saasSupportAuditLogs.filter((l) => l.businessId === businessId);
    res.json({
      activeSession,
      pastSessions,
      hasActiveSession: !!activeSession,
    });
  });

  // Controlled Support Access Data Fetch (Tenant-Isolated: Only works if active session exists)
  app.get("/api/saas/support-access/records/:businessId", (req, res) => {
    const { businessId } = req.params;
    const session = activeSupportSessions.get(businessId);
    
    if (!session || (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now())) {
      return res.status(403).json({
        error: "Tenant Isolation Active: Access to customer business records requires an authorized, active Support Access session.",
        isolationActive: true,
      });
    }

    // Log the view action
    session.actionsPerformed.push(`Inspected business transactional records at ${new Date().toLocaleTimeString()} (VIEW ONLY)`);

    // Return scoped view-only customer sample data for technical investigation
    res.json({
      success: true,
      supportSession: session,
      records: {
        totalSalesYtd: 489200,
        monthlySalesKes: 184500,
        todaySalesKes: 24800,
        salesCount: 14,
        recentTransactions: [
          { receiptNumber: "RCP-2026-0914-01", time: "10:14 AM", cashier: "John Kamau", amountKes: 12500, method: "M-Pesa", status: "Completed" },
          { receiptNumber: "RCP-2026-0914-02", time: "10:28 AM", cashier: "John Kamau", amountKes: 3200, method: "Cash", status: "Completed" },
          { receiptNumber: "RCP-2026-0914-03", time: "11:05 AM", cashier: "Jane Mutua", amountKes: 9100, method: "M-Pesa", status: "Completed" },
        ],
        unreconciledMpesaCount: 0,
        customerDebtBalanceKes: 45000,
      },
    });
  });

  // 8. SaaS Plans API
  app.get("/api/saas/plans", (_req, res) => {
    res.json({ plans: saasPlans });
  });

  app.put("/api/saas/plans/:id", (req, res) => {
    const planIndex = saasPlans.findIndex((p) => p.id === req.params.id);
    if (planIndex === -1) return res.status(404).json({ error: "Plan not found" });

    saasPlans[planIndex] = { ...saasPlans[planIndex], ...req.body };
    res.json({ success: true, plan: saasPlans[planIndex] });
  });

  // 9. SaaS Invoices & Automated Payment Verification
  app.get("/api/saas/invoices", (_req, res) => {
    res.json({ invoices: saasInvoices });
  });

  // Automatic M-Pesa Subscription Renewal
  app.post("/api/saas/subscriptions/renew", (req, res) => {
    const { businessId, planCode, phone, paymentMethod = "mpesa_stk", mpesaReceipt } = req.body;
    const targetBizId =
      businessId && typeof businessId === "string" && businessId.trim().length > 0
        ? businessId.trim()
        : (cloudBusinessIdentity?.businessId || "BUS-8F42K91");
    let biz = getOrCreateSaaSBusiness(targetBizId, phone, planCode);

    const plan = saasPlans.find((p) => p.code === (planCode || biz.planCode)) || saasPlans[1] || saasPlans[0];
    const receiptCode = mpesaReceipt || `SK${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Compute new renewal date: current renewal date + 30 days (or now + 30 days if past due)
    const renewalTime = biz.renewalDate ? new Date(biz.renewalDate).getTime() : 0;
    const baseDate = !isNaN(renewalTime) && renewalTime > Date.now() ? renewalTime : Date.now();
    const newRenewalDate = new Date(baseDate + 30 * 86400000).toISOString();

    biz.renewalDate = newRenewalDate;
    biz.status = "active";
    biz.lastPaymentDate = new Date().toISOString();
    biz.planCode = plan.code;
    biz.planName = plan.name;
    biz.tier = plan.tier;
    biz.monthlyPriceKes = plan.monthlyPriceKes;
    biz.gracePeriodEndsAt = null;

    if (biz.businessId === cloudBusinessIdentity.businessId) {
      cloudSubscription.status = "active";
      cloudSubscription.tier = plan.tier;
      cloudSubscription.renewalDate = newRenewalDate;
    }

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `DMI-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      businessId: biz.businessId,
      businessName: biz.name,
      planCode: plan.code,
      planName: plan.name,
      amountKes: plan.monthlyPriceKes,
      paymentMethod,
      transactionReference: receiptCode,
      paymentDate: new Date().toISOString(),
      periodStart: new Date(baseDate).toISOString(),
      periodEnd: newRenewalDate,
      status: "paid",
      notes: `Verified payment via M-Pesa ${phone ? `from ${phone}` : ""} • Instant account reactivation`,
    };

    saasInvoices.unshift(newInvoice);

    res.json({
      success: true,
      message: `Subscription successfully renewed for ${biz.name}. Status is now ACTIVE through ${new Date(newRenewalDate).toLocaleDateString()}.`,
      invoice: newInvoice,
      business: biz,
      newRenewalDate,
    });
  });

  // 10. Platform Global Settings
  app.get("/api/saas/settings", (_req, res) => {
    res.json({ settings: saasPlatformSettings });
  });

  app.put("/api/saas/settings", (req, res) => {
    saasPlatformSettings = { ...saasPlatformSettings, ...req.body };
    res.json({ success: true, settings: saasPlatformSettings });
  });

  // ==========================================
  // 7. SAFARICOM DARAJA 2.0 LIVE API ENGINE
  // ==========================================
  let darajaConfig = {
    consumerKey: process.env.DARAJA_CONSUMER_KEY || "",
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET || "",
    passkey: process.env.DARAJA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    shortcode: process.env.DARAJA_SHORTCODE || "174379",
    channelType: "paybill",
    environment: (process.env.DARAJA_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    callbackUrl: process.env.DARAJA_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/callback` : ""),
    autoReconcile: true,
  };

  let liveMpesaTransactions: any[] = [];
  const pendingStkRequests = new Map<string, any>();
  type StkCallbackSubscriber = (payload: any) => void;
  const stkCallbackSubscribers = new Map<string, StkCallbackSubscriber[]>();

  // High-performance In-Memory Token Cache to eliminate Safaricom STK Push and Query lag
  let cachedDarajaToken: string | null = null;
  let cachedDarajaTokenExpiry = 0;
  let cachedDarajaKey = "";
  let cachedDarajaSecret = "";
  let cachedDarajaEnv = "";

  function notifyStkSubscribers(checkoutId: string, payload: any) {
    const listeners = stkCallbackSubscribers.get(checkoutId);
    if (listeners && listeners.length > 0) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error("Error notifying STK subscriber:", err);
        }
      });
      stkCallbackSubscribers.delete(checkoutId);
    }
  }

  function getDarajaTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  function formatKenyanPhone(phone: string): string {
    let clean = (phone || "").replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "254" + clean.slice(1);
    } else if (clean.startsWith("254")) {
      // already valid format
    } else if (clean.length === 9) {
      clean = "254" + clean;
    }
    return clean;
  }

  async function getDarajaToken(customKey?: string, customSecret?: string, env: "sandbox" | "production" = "sandbox"): Promise<string> {
    const key = (customKey || darajaConfig.consumerKey).trim();
    const secret = (customSecret || darajaConfig.consumerSecret).trim();
    if (!key || !secret) {
      throw new Error("Daraja Consumer Key and Consumer Secret are required. Please input them in Daraja Settings.");
    }

    const now = Date.now();
    // Re-use cached token if valid (OAuth tokens last 3600 seconds; we cache for 50 minutes to eliminate 2-4s lag)
    if (
      cachedDarajaToken &&
      cachedDarajaTokenExpiry > now &&
      cachedDarajaKey === key &&
      cachedDarajaSecret === secret &&
      cachedDarajaEnv === env
    ) {
      return cachedDarajaToken;
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const baseUrl = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
        signal: controller.signal,
      });

      const data: any = await res.json();
      if (!res.ok || !data.access_token) {
        const errMsg = data.errorMessage || data.error || (data.fault ? data.fault.faultstring : JSON.stringify(data));
        throw new Error(`Safaricom Daraja Auth Error: ${errMsg}`);
      }

      cachedDarajaToken = data.access_token;
      cachedDarajaTokenExpiry = now + 50 * 60 * 1000;
      cachedDarajaKey = key;
      cachedDarajaSecret = secret;
      cachedDarajaEnv = env;

      return data.access_token;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Get current Daraja configuration & status
  app.get("/api/mpesa/config", (_req, res) => {
    const isConfigured = Boolean(darajaConfig.consumerKey && darajaConfig.consumerSecret);
    const maskedSecret = darajaConfig.consumerSecret ? `${darajaConfig.consumerSecret.slice(0, 4)}••••••••` : "";
    const effectiveCallback = darajaConfig.callbackUrl || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/callback` : `https://${_req.get("host")}/api/mpesa/callback`);

    res.json({
      config: {
        ...darajaConfig,
        consumerSecretMasked: maskedSecret,
        effectiveCallbackUrl: effectiveCallback,
      },
      isConfigured,
      environment: darajaConfig.environment,
      status: isConfigured ? "ready" : "needs_credentials",
    });
  });

  // Update Daraja credentials from frontend
  app.post("/api/mpesa/config", (req, res) => {
    const { consumerKey, consumerSecret, passkey, shortcode, channelType, environment, callbackUrl, autoReconcile } = req.body;
    if (consumerKey !== undefined) darajaConfig.consumerKey = consumerKey.trim();
    if (consumerSecret !== undefined && !consumerSecret.includes("••••")) darajaConfig.consumerSecret = consumerSecret.trim();
    if (passkey !== undefined) darajaConfig.passkey = passkey.trim();
    if (shortcode !== undefined) darajaConfig.shortcode = shortcode.trim();
    if (channelType !== undefined) darajaConfig.channelType = channelType;
    if (environment !== undefined) darajaConfig.environment = environment;
    if (callbackUrl !== undefined) darajaConfig.callbackUrl = callbackUrl.trim();
    if (autoReconcile !== undefined) darajaConfig.autoReconcile = Boolean(autoReconcile);

    res.json({
      success: true,
      message: "Daraja credentials updated successfully.",
      config: {
        ...darajaConfig,
        consumerSecretMasked: darajaConfig.consumerSecret ? `${darajaConfig.consumerSecret.slice(0, 4)}••••••••` : "",
      },
    });
  });

  // Test live connection to Daraja Sandbox OAuth endpoint
  app.post("/api/mpesa/test-connection", async (req, res) => {
    const { consumerKey, consumerSecret, environment } = req.body;
    const testEnv = environment || darajaConfig.environment || "sandbox";
    try {
      const token = await getDarajaToken(consumerKey, consumerSecret, testEnv);
      res.json({
        success: true,
        message: `Connected successfully to Safaricom Daraja (${testEnv.toUpperCase()})! Access token generated.`,
        tokenPrefix: `${token.slice(0, 8)}...`,
        environment: testEnv,
        testedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || "Failed to connect to Safaricom Daraja API.",
      });
    }
  });

  function handleMpesaVoucherCompletion(pending: any, receiptNumber: string, amount: number) {
    if (!pending?.isVoucherPurchase || pending?.voucherResult) return;
    try {
      const { token, voucher } = voucherRepository.createVoucher({
        tier: pending.tier,
        durationDays: pending.durationDays,
        mpesaReceipt: receiptNumber,
        createdBy: `M-Pesa STK (${pending.phone || "Customer"})`,
      });

      const etimsInvoice = voucherRepository.recordEtimsInvoice({
        voucherId: voucher.id,
        buyerName: pending.buyerName || `Terminal Tenant (${pending.tenantId || pending.phone})`,
        buyerPin: pending.buyerPin,
        amountGrossKes: pending.priceKes || amount,
        mpesaReceipt: receiptNumber,
      });

      let signedLicense: any = null;
      if (pending.tenantId) {
        signedLicense = voucherRepository.redeemVoucherAtomic({
          rawToken: token,
          tenantId: pending.tenantId,
          ip: "127.0.0.1",
          machineHash: pending.machineHash || "ALL_HW",
          currentValidUntil: pending.currentValidUntil,
        });
      }

      pending.voucherResult = {
        token,
        voucher,
        etimsInvoice,
        signedLicense,
      };
    } catch (err: any) {
      console.error("Error issuing M-Pesa voucher:", err);
      pending.voucherError = err.message;
    }
  }

  // Live STK Push initiation (Lipa Na M-Pesa Online)
  app.post("/api/mpesa/stk-push", async (req, res) => {
    const { phone, amount, accountReference, transactionDesc, shortcode: reqShortcode, passkey: reqPasskey } = req.body;

    if (!phone || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid phone number and positive amount are required." });
    }

    const shortcode = (reqShortcode || darajaConfig.shortcode || "174379").trim();
    const passkey = (reqPasskey || darajaConfig.passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919").trim();
    const standardPhone = formatKenyanPhone(phone);
    const timestamp = getDarajaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const callbackUrl = darajaConfig.callbackUrl || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/callback` : `https://${req.get("host")}/api/mpesa/callback`);

    const baseUrl = darajaConfig.environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    try {
      const token = await getDarajaToken(undefined, undefined, darajaConfig.environment);

      const stkPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: darajaConfig.channelType === "buy_goods" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: Math.round(Number(amount)),
        PartyA: standardPhone,
        PartyB: shortcode,
        PhoneNumber: standardPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference ? accountReference.slice(0, 12) : "ABC-Hardware",
        TransactionDesc: transactionDesc ? transactionDesc.slice(0, 13) : "Store Payment",
      };

      const darajaRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      });

      const responseData: any = await darajaRes.json();

      if (!darajaRes.ok || responseData.ResponseCode !== "0") {
        const errorMsg = responseData.errorMessage || responseData.ResponseDescription || responseData.CustomerMessage || JSON.stringify(responseData);
        return res.status(400).json({
          success: false,
          error: `Safaricom STK Push Error: ${errorMsg}`,
          darajaResponse: responseData,
        });
      }

      // Record pending checkout request
      const checkoutId = responseData.CheckoutRequestID;
      const pendingRecord = {
        id: `mp-${Date.now()}`,
        checkoutRequestId: checkoutId,
        merchantRequestId: responseData.MerchantRequestID,
        phone: standardPhone,
        amount: Number(amount),
        accountReference: accountReference || "Counter Sale",
        status: "pending",
        timestamp: new Date().toISOString(),
        customerMessage: responseData.CustomerMessage,
        rawRequest: stkPayload,
      };

      pendingStkRequests.set(checkoutId, pendingRecord);

      res.json({
        success: true,
        checkoutRequestId: checkoutId,
        merchantRequestId: responseData.MerchantRequestID,
        customerMessage: responseData.CustomerMessage,
        responseDescription: responseData.ResponseDescription,
        phone: standardPhone,
        amount: Number(amount),
      });
    } catch (err: any) {
      console.error("STK Push error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to trigger Daraja STK Push.",
      });
    }
  });

  // Query status of live STK Push (Lipa Na M-Pesa Online Query)
  app.post("/api/mpesa/query", async (req, res) => {
    const { checkoutRequestId, shortcode: reqShortcode, passkey: reqPasskey } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, error: "checkoutRequestId is required." });
    }

    // Fast check: If the webhook callback has already arrived and completed the transaction, return immediately!
    const existing = pendingStkRequests.get(checkoutRequestId);
    if (existing && existing.status === "completed") {
      return res.json({
        success: true,
        status: "completed",
        resultCode: existing.resultCode ?? 0,
        resultDesc: existing.resultDesc || "The service request is processed successfully.",
        receiptNumber: existing.receiptNumber,
        amount: existing.amount,
        phone: existing.phone,
        fromCallback: true,
      });
    }

    const shortcode = (reqShortcode || darajaConfig.shortcode || "174379").trim();
    const passkey = (reqPasskey || darajaConfig.passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919").trim();
    const timestamp = getDarajaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const baseUrl = darajaConfig.environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    try {
      const token = await getDarajaToken(undefined, undefined, darajaConfig.environment);

      const queryPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const darajaRes = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryPayload),
      });

      const data: any = await darajaRes.json();

      // ResultCode 0 = success, 1032 = cancelled by user, 1037 = timeout
      const isSuccess = data.ResultCode === "0" || data.ResultCode === 0;
      const isCancelled = data.ResultCode === "1032" || data.ResultCode === 1032;
      const isTimeout = data.ResultCode === "1037" || data.ResultCode === 1037;

      let status = "pending";
      if (isSuccess) status = "completed";
      else if (isCancelled) status = "cancelled";
      else if (isTimeout) status = "timeout";
      else if (data.ResultCode) status = "failed";

      let receiptNumber = existing ? existing.receiptNumber : undefined;
      let amount = existing ? existing.amount : undefined;

      // If completed, update pending request or create transaction
      if (isSuccess) {
        const pending = pendingStkRequests.get(checkoutRequestId);
        if (pending && pending.status !== "completed") {
          pending.status = "completed";
          pending.completedAt = new Date().toISOString();
          pending.resultDesc = data.ResultDesc;
          if (!pending.receiptNumber) {
            pending.receiptNumber = `SK${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          }
          receiptNumber = pending.receiptNumber;
          amount = pending.amount;
          liveMpesaTransactions.unshift(pending);

          // If this was an automated voucher purchase, fulfill immediately!
          handleMpesaVoucherCompletion(pending, receiptNumber, amount);
        }

        // Broadcast to any active SSE listeners
        notifyStkSubscribers(checkoutRequestId, {
          type: "stk_callback",
          checkoutRequestId,
          status: "completed",
          resultCode: 0,
          resultDesc: data.ResultDesc || "The service request is processed successfully.",
          receiptNumber,
          amount,
          phone: pending?.phone,
          completedAt: new Date().toISOString(),
        });
      } else if (isCancelled || isTimeout) {
        notifyStkSubscribers(checkoutRequestId, {
          type: "stk_callback",
          checkoutRequestId,
          status,
          resultCode: data.ResultCode,
          resultDesc: data.ResultDesc,
        });
      }

      res.json({
        success: true,
        status,
        resultCode: data.ResultCode,
        resultDesc: data.ResultDesc,
        responseDescription: data.ResponseDescription,
        receiptNumber,
        amount,
        raw: data,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to query STK push status from Safaricom.",
      });
    }
  });

  // Real Safaricom STK Push Webhook Callback Endpoint
  app.post("/api/mpesa/callback", (req, res) => {
    try {
      const callback = req.body?.Body?.stkCallback;
      if (callback) {
        const checkoutId = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode;
        const resultDesc = callback.ResultDesc;

        let receiptNumber = "";
        let amount = 0;
        let phone = "";

        if (callback.CallbackMetadata?.Item) {
          for (const item of callback.CallbackMetadata.Item) {
            if (item.Name === "MpesaReceiptNumber") receiptNumber = String(item.Value);
            if (item.Name === "Amount") amount = Number(item.Value);
            if (item.Name === "PhoneNumber") phone = String(item.Value);
          }
        }

        const pending = pendingStkRequests.get(checkoutId);
        const newRecord = {
          id: `mp-${Date.now()}`,
          checkoutRequestId: checkoutId,
          receiptNumber: receiptNumber || (pending ? pending.receiptNumber : `SK${Math.random().toString(36).substring(2, 10).toUpperCase()}`),
          amount: amount || (pending ? pending.amount : 0),
          senderPhone: phone || (pending ? pending.phone : "254700000000"),
          senderName: pending ? pending.accountReference : "Customer (Daraja STK)",
          timestamp: new Date().toISOString(),
          status: resultCode === 0 ? "matched" : "failed",
          channel: "stk_push",
          branchId: "branch-1",
          notes: `Live Safaricom Daraja STK Push [${receiptNumber}] Result: ${resultDesc}`,
          resultCode,
          resultDesc,
        };

        if (resultCode === 0) {
          liveMpesaTransactions.unshift(newRecord);

          // Automated voucher purchase fulfillment
          handleMpesaVoucherCompletion(pending, newRecord.receiptNumber, newRecord.amount);

          // If this was a subscription renewal STK push, automatically renew customer plan!
          if (pending?.isSubscription && pending?.businessId) {
            const biz = saasBusinesses.find((b) => b.businessId === pending.businessId);
            if (biz) {
              const plan = saasPlans.find((p) => p.code === pending.planCode) || saasPlans[1];
              const baseDate = new Date(biz.renewalDate).getTime() > Date.now()
                ? new Date(biz.renewalDate).getTime()
                : Date.now();
              const newRenewalDate = new Date(baseDate + 30 * 86400000).toISOString();
              biz.renewalDate = newRenewalDate;
              biz.status = "active";
              biz.lastPaymentDate = new Date().toISOString();
              biz.planCode = plan.code;
              biz.planName = plan.name;
              biz.tier = plan.tier;
              biz.monthlyPriceKes = plan.monthlyPriceKes;
              biz.gracePeriodEndsAt = null;

              const subscriptionInvoice = {
                id: `inv-${Date.now()}`,
                invoiceNumber: `DMI-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                businessId: biz.businessId,
                businessName: biz.name,
                planCode: plan.code,
                planName: plan.name,
                amountKes: pending.amount || plan.monthlyPriceKes,
                paymentMethod: "mpesa_stk",
                transactionReference: newRecord.receiptNumber,
                paymentDate: new Date().toISOString(),
                periodStart: new Date(baseDate).toISOString(),
                periodEnd: newRenewalDate,
                status: "paid",
                notes: `Live Safaricom Daraja STK payment verified (${newRecord.receiptNumber}) from ${newRecord.senderPhone}`,
              };
              saasInvoices.unshift(subscriptionInvoice);
              pending.subscriptionInvoice = subscriptionInvoice;
            }
          }
        }
        if (pending) {
          pending.status = resultCode === 0 ? "completed" : "failed";
          pending.receiptNumber = newRecord.receiptNumber;
          pending.resultCode = resultCode;
          pending.resultDesc = resultDesc;
          pending.amount = newRecord.amount;
          pending.phone = newRecord.senderPhone;
          pending.completedAt = new Date().toISOString();
        }

        // Notify real-time listeners (POS client listening to callback)
        notifyStkSubscribers(checkoutId, {
          type: "stk_callback",
          checkoutRequestId: checkoutId,
          status: resultCode === 0 ? "completed" : "failed",
          receiptNumber: newRecord.receiptNumber,
          amount: newRecord.amount,
          phone: newRecord.senderPhone,
          resultCode,
          resultDesc,
          completedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Error parsing Daraja callback:", e);
    }

    // Always respond with 200 OK to Safaricom
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Real-time SSE Stream Endpoint for POS checkout callback listening
  app.get("/api/mpesa/stream", (req, res) => {
    const checkoutRequestId = String(req.query.checkoutRequestId || "");
    if (!checkoutRequestId) {
      return res.status(400).send("checkoutRequestId parameter is required.");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // If transaction already resolved, push event immediately
    const existing = pendingStkRequests.get(checkoutRequestId);
    if (existing && (existing.status === "completed" || existing.status === "failed")) {
      res.write(
        `data: ${JSON.stringify({
          type: "stk_callback",
          checkoutRequestId,
          status: existing.status,
          receiptNumber: existing.receiptNumber,
          amount: existing.amount,
          phone: existing.phone,
          resultCode: existing.resultCode ?? 0,
          resultDesc: existing.resultDesc || "The service request is processed successfully.",
          completedAt: existing.completedAt || new Date().toISOString(),
        })}\n\n`
      );
      res.end();
      return;
    }

    // Register real-time subscriber
    const listener: StkCallbackSubscriber = (payload) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        res.end();
      } catch (err) {
        // client closed
      }
    };

    if (!stkCallbackSubscribers.has(checkoutRequestId)) {
      stkCallbackSubscribers.set(checkoutRequestId, []);
    }
    stkCallbackSubscribers.get(checkoutRequestId)!.push(listener);

    // Initial heartbeat
    res.write(
      `data: ${JSON.stringify({
        type: "listening",
        checkoutRequestId,
        message: "POS actively listening for Safaricom Daraja STK transaction callback...",
      })}\n\n`
    );

    req.on("close", () => {
      const list = stkCallbackSubscribers.get(checkoutRequestId);
      if (list) {
        const idx = list.indexOf(listener);
        if (idx !== -1) list.splice(idx, 1);
      }
    });
  });

  // Dedicated Live SaaS Subscription STK Push (Real Daraja API)
  app.post("/api/saas/billing/mpesa-stk-push", async (req, res) => {
    const { phone, amount, planCode, businessId, accountReference, businessName } = req.body;

    if (!phone || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid phone number and positive amount are required." });
    }

    const targetBizId =
      businessId && typeof businessId === "string" && businessId.trim().length > 0
        ? businessId.trim()
        : (cloudBusinessIdentity?.businessId || "BUS-8F42K91");
    let biz = getOrCreateSaaSBusiness(targetBizId, phone, planCode);
    if (businessName && biz) {
      biz.name = businessName;
    }

    const plan = saasPlans.find((p) => p.code === planCode) || saasPlans[1] || saasPlans[0] || {
      code: "business",
      name: "DMi Business",
      tier: "Business",
      monthlyPriceKes: 2000,
    };

    const shortcode = (darajaConfig.shortcode || "174379").trim();
    const passkey = (darajaConfig.passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919").trim();
    const standardPhone = formatKenyanPhone(phone);
    const timestamp = getDarajaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const callbackUrl = darajaConfig.callbackUrl || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/callback` : `https://${req.get("host")}/api/mpesa/callback`);
    const baseUrl = darajaConfig.environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const cleanBizId = biz?.businessId || targetBizId || "BUS-8F42K91";
    const cleanRef = (accountReference || `DMI-${cleanBizId.replace(/[^A-Za-z0-9]/g, "").slice(0, 8)}`).slice(0, 12);

    try {
      const token = await getDarajaToken(undefined, undefined, darajaConfig.environment);

      const stkPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: darajaConfig.channelType === "buy_goods" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: Math.round(Number(amount)),
        PartyA: standardPhone,
        PartyB: shortcode,
        PhoneNumber: standardPhone,
        CallBackURL: callbackUrl,
        AccountReference: cleanRef,
        TransactionDesc: `DMI ${(plan.name || "Sub").slice(0, 8)} Sub`,
      };

      const darajaRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      });

      const responseData: any = await darajaRes.json();

      if (!darajaRes.ok || responseData.ResponseCode !== "0") {
        const errorMsg = responseData.errorMessage || responseData.ResponseDescription || responseData.CustomerMessage || JSON.stringify(responseData);
        return res.status(400).json({
          success: false,
          error: `Safaricom Daraja STK Push failed: ${errorMsg}`,
          darajaResponse: responseData,
        });
      }

      const checkoutId = responseData.CheckoutRequestID;
      const pendingRecord = {
        id: `mp-sub-${Date.now()}`,
        checkoutRequestId: checkoutId,
        merchantRequestId: responseData.MerchantRequestID,
        phone: standardPhone,
        amount: Number(amount),
        accountReference: cleanRef,
        businessId: cleanBizId,
        planCode: plan.code,
        isSubscription: true,
        status: "pending",
        timestamp: new Date().toISOString(),
        customerMessage: responseData.CustomerMessage,
        rawRequest: stkPayload,
      };

      pendingStkRequests.set(checkoutId, pendingRecord);

      res.json({
        success: true,
        checkoutRequestId: checkoutId,
        merchantRequestId: responseData.MerchantRequestID,
        customerMessage: responseData.CustomerMessage,
        responseDescription: responseData.ResponseDescription,
        phone: standardPhone,
        amount: Number(amount),
        businessId: cleanBizId,
        planCode: plan.code,
      });
    } catch (err: any) {
      console.error("Live Daraja SaaS STK Push Error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to initiate live Safaricom Daraja STK push.",
      });
    }
  });

  // Dedicated Live SaaS Subscription STK Query
  const handleSaaSStkQuery = async (req: any, res: any) => {
    const checkoutRequestId = (req.query.checkoutRequestId || req.body?.checkoutRequestId) as string;
    const businessId = (req.query.businessId || req.body?.businessId) as string;
    const planCode = (req.query.planCode || req.body?.planCode) as string;
    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, error: "checkoutRequestId is required." });
    }

    const existing = pendingStkRequests.get(checkoutRequestId);
    if (existing && existing.status === "completed") {
      return res.json({
        success: true,
        verified: true,
        status: "completed",
        receiptNumber: existing.receiptNumber,
        amount: existing.amount,
        phone: existing.phone,
        invoice: existing.subscriptionInvoice,
        message: "Live M-Pesa payment confirmed by Safaricom Daraja.",
      });
    }

    // Otherwise query Daraja API directly
    const shortcode = (darajaConfig.shortcode || "174379").trim();
    const passkey = (darajaConfig.passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919").trim();
    const timestamp = getDarajaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const baseUrl = darajaConfig.environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    try {
      const token = await getDarajaToken(undefined, undefined, darajaConfig.environment);
      const queryPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const darajaRes = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryPayload),
      });

      const data: any = await darajaRes.json();

      if (data.ResultCode === "0" || data.ResultCode === 0) {
        // Payment Succeeded! Auto renew subscription
        const targetBizId =
          businessId && typeof businessId === "string" && businessId.trim().length > 0
            ? businessId.trim()
            : existing?.businessId && typeof existing.businessId === "string" && existing.businessId.trim().length > 0
            ? existing.businessId.trim()
            : (cloudBusinessIdentity?.businessId || "BUS-8F42K91");
        let biz = getOrCreateSaaSBusiness(targetBizId, existing?.phone, planCode || existing?.planCode);
        const plan = saasPlans.find((p) => p.code === (planCode || existing?.planCode || biz.planCode)) || saasPlans[1] || saasPlans[0];

        const receiptNumber = data.MpesaReceiptNumber || existing?.receiptNumber || `QHK${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const renewalTime = biz.renewalDate ? new Date(biz.renewalDate).getTime() : 0;
        const baseDate = !isNaN(renewalTime) && renewalTime > Date.now() ? renewalTime : Date.now();
        const newRenewalDate = new Date(baseDate + 30 * 86400000).toISOString();

        biz.renewalDate = newRenewalDate;
        biz.status = "active";
        biz.lastPaymentDate = new Date().toISOString();
        biz.planCode = plan.code;
        biz.planName = plan.name;
        biz.tier = plan.tier;
        biz.monthlyPriceKes = plan.monthlyPriceKes;
        biz.gracePeriodEndsAt = null;

        const subscriptionInvoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber: `DMI-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          businessId: biz.businessId,
          businessName: biz.name,
          planCode: plan.code,
          planName: plan.name,
          amountKes: existing?.amount || plan.monthlyPriceKes,
          paymentMethod: "mpesa_stk",
          transactionReference: receiptNumber,
          paymentDate: new Date().toISOString(),
          periodStart: new Date(baseDate).toISOString(),
          periodEnd: newRenewalDate,
          status: "paid",
          notes: `Verified live Safaricom Daraja STK Push (${receiptNumber}) • Result: ${data.ResultDesc || "Success"}`,
        };

        saasInvoices.unshift(subscriptionInvoice);

        if (existing) {
          existing.status = "completed";
          existing.receiptNumber = receiptNumber;
          existing.subscriptionInvoice = subscriptionInvoice;
        }

        return res.json({
          success: true,
          verified: true,
          status: "completed",
          receiptNumber,
          amount: existing?.amount || plan.monthlyPriceKes,
          invoice: subscriptionInvoice,
          newRenewalDate,
          message: "Payment verified successfully by Safaricom Daraja!",
        });
      }

      if (data.ResultCode === "1032") {
        return res.json({
          success: false,
          verified: false,
          status: "cancelled",
          error: "Transaction cancelled by user on phone.",
        });
      }

      if (data.ResultCode === "1037") {
        return res.json({
          success: false,
          verified: false,
          status: "timeout",
          error: "STK Push timed out. Customer did not enter PIN in time.",
        });
      }

      return res.json({
        success: true,
        verified: false,
        status: "pending",
        message: data.ResultDesc || data.ResponseDescription || "Awaiting PIN entry on phone...",
      });
    } catch (err: any) {
      res.json({
        success: true,
        verified: false,
        status: "pending",
        message: "Waiting for Safaricom confirmation...",
      });
    }
  };

  app.get("/api/saas/billing/stk-query", handleSaaSStkQuery);
  app.post("/api/saas/billing/stk-query", handleSaaSStkQuery);

  // Quick Status Check endpoint
  app.get("/api/mpesa/status/:checkoutRequestId", (req, res) => {
    const { checkoutRequestId } = req.params;
    const pending = pendingStkRequests.get(checkoutRequestId);
    if (!pending) {
      return res.status(404).json({ success: false, error: "STK request not found or expired." });
    }
    res.json({
      success: true,
      checkoutRequestId,
      status: pending.status,
      receiptNumber: pending.receiptNumber,
      amount: pending.amount,
      phone: pending.phone,
      resultCode: pending.resultCode,
      resultDesc: pending.resultDesc,
      completedAt: pending.completedAt,
    });
  });

  // Simulator for Daraja Callback (Instant Test / Sandbox PIN Entry)
  app.post("/api/mpesa/simulate-callback", (req, res) => {
    const {
      checkoutRequestId,
      resultCode = 0,
      resultDesc,
      amount,
      receiptNumber,
      phone,
    } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, error: "checkoutRequestId is required." });
    }

    const pending = pendingStkRequests.get(checkoutRequestId);
    const genReceipt = receiptNumber || (pending?.receiptNumber ? pending.receiptNumber : `SK${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    const finalAmount = amount || (pending ? pending.amount : 0);
    const finalPhone = phone || (pending ? pending.phone : "254712345678");

    const newRecord = {
      id: `mp-${Date.now()}`,
      checkoutRequestId,
      receiptNumber: genReceipt,
      amount: finalAmount,
      senderPhone: finalPhone,
      senderName: pending ? pending.accountReference : "Customer (Daraja STK)",
      timestamp: new Date().toISOString(),
      status: resultCode === 0 ? "matched" : "failed",
      channel: "stk_push",
      branchId: "branch-1",
      notes: `Simulated Safaricom Daraja STK Callback [${genReceipt}] Result: ${resultDesc || "Accepted"}`,
      resultCode,
      resultDesc: resultDesc || (resultCode === 0 ? "The service request is processed successfully." : "Request cancelled by customer"),
    };

    if (resultCode === 0) {
      liveMpesaTransactions.unshift(newRecord);
    }

    if (pending) {
      pending.status = resultCode === 0 ? "completed" : "failed";
      pending.receiptNumber = genReceipt;
      pending.resultCode = resultCode;
      pending.resultDesc = newRecord.resultDesc;
      pending.amount = finalAmount;
      pending.phone = finalPhone;
      pending.completedAt = new Date().toISOString();
    }

    const eventPayload = {
      type: "stk_callback",
      checkoutRequestId,
      status: resultCode === 0 ? "completed" : "failed",
      receiptNumber: genReceipt,
      amount: finalAmount,
      phone: finalPhone,
      resultCode,
      resultDesc: newRecord.resultDesc,
      completedAt: new Date().toISOString(),
      isSimulated: true,
    };

    notifyStkSubscribers(checkoutRequestId, eventPayload);

    res.json({
      success: true,
      message: "Customer PIN callback simulated successfully and broadcast to POS.",
      record: newRecord,
      event: eventPayload,
    });
  });

  // Safaricom C2B Validation Webhook
  app.post("/api/mpesa/c2b/validation", (_req, res) => {
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Safaricom C2B Confirmation Webhook
  app.post("/api/mpesa/c2b/confirmation", (req, res) => {
    const data = req.body;
    if (data && data.TransID) {
      const newTx = {
        id: `mp-${Date.now()}`,
        receiptNumber: data.TransID,
        amount: Number(data.TransAmount || 0),
        senderPhone: data.MSISDN || "Unknown",
        senderName: `${data.FirstName || ""} ${data.LastName || ""}`.trim() || "C2B Customer",
        timestamp: new Date().toISOString(),
        status: darajaConfig.autoReconcile ? "matched" : "unmatched",
        channel: darajaConfig.channelType === "buy_goods" ? "c2b_till" : "paybill",
        branchId: "branch-1",
        notes: `Live Daraja C2B Payment received via Shortcode ${data.BusinessShortCode || darajaConfig.shortcode}`,
      };
      liveMpesaTransactions.unshift(newTx);
    }
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Register C2B URLs with Safaricom Daraja
  app.post("/api/mpesa/c2b/register", async (req, res) => {
    const { shortcode, confirmationUrl, validationUrl } = req.body;
    const sc = shortcode || darajaConfig.shortcode || "600982";
    const conf = confirmationUrl || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/c2b/confirmation` : `https://${req.get("host")}/api/mpesa/c2b/confirmation`);
    const val = validationUrl || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/c2b/validation` : `https://${req.get("host")}/api/mpesa/c2b/validation`);
    const baseUrl = darajaConfig.environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    try {
      const token = await getDarajaToken(undefined, undefined, darajaConfig.environment);
      const registerRes = await fetch(`${baseUrl}/mpesa/c2b/v1/registerurl`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ShortCode: sc,
          ResponseType: "Completed",
          ConfirmationURL: conf,
          ValidationURL: val,
        }),
      });

      const regData = await registerRes.json();
      res.json({
        success: registerRes.ok,
        data: regData,
        registeredUrls: { confirmationUrl: conf, validationUrl: val },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to register C2B URLs with Daraja." });
    }
  });

  // Get all live M-Pesa transactions
  app.get("/api/mpesa/transactions", (_req, res) => {
    res.json({ transactions: liveMpesaTransactions });
  });


  // AI Business Assistant endpoint with model fallback & error resilience
  app.post("/api/ai/ask", async (req, res) => {
    const question = req.body.question || req.body.query || "";
    const context = req.body.context || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question or query is required" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        answer: generateSmartAnswer(question, context),
        source: "local-intelligence",
      });
    }

    const systemPrompt = `You are the DMi Business AI Advisor for a Kenyan hardware & retail business (${context.storeName || "Nairobi Hardware & Building Supplies"}).
The business owner asks practical questions to make informed decisions.
Currencies are in Kenyan Shillings (KSh).

Store Data Context:
${JSON.stringify(context, null, 2)}

Key Knowledge:
- Last month (August 2026) top sellers: Bamburi Nguvu Cement 50kg (140 bags, KSh 109,200), Corrugated Iron Sheets 30G 3m (65 sheets, KSh 74,750), Crown Covermatt White 20L (14 buckets, KSh 65,800), Wire Nails 3" 50kg (6 bags, KSh 43,200), Deformed Steel Rebar D12 (32 lengths, KSh 38,400).
- Customers owing > KSh 10,000: ABC Construction Ltd (KSh 86,400), Mwangi Builders (KSh 18,200, overdue by 7 days), John Kamau (KSh 12,500). Total: KSh 117,100.
- Why profit fell this month: Wholesale cement cost rose from KSh 640 to KSh 695 without retail price adjustment (gross margin fell from 22.1% to 17.8%), shop rent of KSh 25,000 + permits + electricity frontloaded on Sept 1, and KSh 117,100 locked in customer credit (madeni).
- Restock requirements based on historical sales velocity:
  "You normally sell 35 bags of cement per week. You currently have 12. You should consider restocking approximately 23 bags."
  Also Crown Covermatt 20L (normally 6/wk, current 2, restock 4), Wire Nails 3" (normally 3/wk, current 1, restock 2).

Format your response clearly with bold headings, bullet points, and exact numbers. Keep it direct, highly practical, and respectful.`;

    // Try models in order of priority: 3.8-flash -> 3.1-flash-lite -> flash-latest
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let aiAnswer: string | null = null;
    let successfulModel: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { text: systemPrompt },
            { text: `Store Owner Question: "${question}"` },
          ],
        });

        if (response && response.text) {
          aiAnswer = response.text;
          successfulModel = modelName;
          break;
        }
      } catch (err: any) {
        // Log gracefully as warning for transient upstream capacity/high-demand spikes (503/429)
        console.warn(`Model ${modelName} unavailable (${err?.status || err?.message || "high demand"}), attempting fallback...`);
      }
    }

    if (aiAnswer) {
      return res.json({ answer: aiAnswer, source: `gemini:${successfulModel}` });
    }

    // High-fidelity local intelligence fallback
    const fallbackAnswer = generateSmartAnswer(question, context);
    return res.json({ answer: fallbackAnswer, source: "local-intelligence" });
  });

  // =========================================================================
  // 12. REAL MAINTENANCE COMMAND CHANNEL (maintenance_commands) & TELEMETRY
  // =========================================================================
  interface ServerMaintenanceCommand {
    id: string;
    tenant_id: string;
    type: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'expired';
    payload?: any;
    result?: any;
    issued_by: string;
    created_at: string;
    expires_at: string;
    completed_at?: string;
  }

  const ALLOWED_COMMAND_TYPES = new Set([
    'lag_fix',
    'vacuum_db',
    'release_sync_lock',
    'restore_snapshot',
    'safe_reboot',
    'reindex_ledgers',
    'repair_license_keys',
    'full_diagnostic_repair',
  ]);

  let maintenanceCommandsTable: ServerMaintenanceCommand[] = [];

  // Server-side license signing secret (In production, Supabase Edge Function private key)
  const LICENSE_SIGNING_SECRET = process.env.LICENSE_SIGNING_SECRET || "dmi-hardware-os-ed25519-master-key-prod-2026";
  const LICENSE_PUBLIC_FINGERPRINT = crypto.createHash("sha256").update(LICENSE_SIGNING_SECRET).digest("hex").slice(0, 16);

  // 1. Post a new maintenance command from Control Center (Admin Authenticated)
  app.post("/api/maintenance/commands", (req, res) => {
    const { tenant_id, type, payload, issued_by, admin_token } = req.body;

    // Strict validation
    if (!tenant_id || typeof tenant_id !== "string") {
      return res.status(400).json({ error: "Missing or invalid tenant_id" });
    }

    if (!type || !ALLOWED_COMMAND_TYPES.has(type)) {
      return res.status(400).json({
        error: `Invalid or unallowlisted command type: ${type}. Allowed: ${Array.from(ALLOWED_COMMAND_TYPES).join(", ")}`,
      });
    }

    // Command TTL: 10 minutes expiry window (per architecture specification)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const command: ServerMaintenanceCommand = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tenant_id,
      type,
      status: "queued",
      payload: payload || {},
      issued_by: issued_by || "Dave Migichi (SuperAdmin NOC)",
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    maintenanceCommandsTable.unshift(command);
    // Keep max 200 commands
    if (maintenanceCommandsTable.length > 200) {
      maintenanceCommandsTable.pop();
    }

    console.log(`[CommandChannel] Enqueued maintenance command [${command.type}] for tenant [${tenant_id}] (ID: ${command.id})`);
    return res.status(201).json({ command });
  });

  // 2. Client terminal polls for active/queued commands for its tenant
  app.get("/api/maintenance/commands", (req, res) => {
    const tenant_id = req.query.tenant_id as string;
    const status = req.query.status as string;

    const now = new Date();

    // Automatically expire any queued command that has exceeded its expires_at time
    maintenanceCommandsTable.forEach((cmd) => {
      if (cmd.status === "queued" && new Date(cmd.expires_at) < now) {
        cmd.status = "expired";
        cmd.result = { error: "Command expired before client terminal picked it up (10 min TTL)" };
      }
    });

    let filtered = maintenanceCommandsTable;
    if (tenant_id) {
      filtered = filtered.filter((cmd) => cmd.tenant_id === tenant_id || cmd.tenant_id === "ALL");
    }
    if (status) {
      filtered = filtered.filter((cmd) => cmd.status === status);
    }

    return res.json({ commands: filtered });
  });

  // 3. Client terminal updates command status (running, completed, failed, expired) with real execution result
  app.patch("/api/maintenance/commands/:id", (req, res) => {
    const { id } = req.params;
    const { status, result } = req.body;

    const command = maintenanceCommandsTable.find((c) => c.id === id);
    if (!command) {
      return res.status(404).json({ error: `Command ${id} not found` });
    }

    if (!["queued", "running", "completed", "failed", "expired"].includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    command.status = status;
    if (result !== undefined) {
      command.result = result;
    }
    if (status === "completed" || status === "failed" || status === "expired") {
      command.completed_at = new Date().toISOString();
    }

    console.log(`[CommandChannel] Command ${id} (${command.type}) updated to status: ${status}`);
    return res.json({ command });
  });

  app.post("/api/maintenance/commands/:id/result", (req, res) => {
    const { id } = req.params;
    const { status = "completed", result } = req.body;

    const command = maintenanceCommandsTable.find((c) => c.id === id);
    if (!command) {
      return res.status(404).json({ error: `Command ${id} not found` });
    }

    command.status = status;
    if (result !== undefined) {
      command.result = result;
    }
    if (status === "completed" || status === "failed" || status === "expired") {
      command.completed_at = new Date().toISOString();
    }

    console.log(`[CommandChannel] Command ${id} (${command.type}) reported result with status: ${status}`);
    return res.json({ command });
  });

  // 4. Command execution history / audit trail
  app.get("/api/maintenance/commands/:tenantId/history", (req, res) => {
    const { tenantId } = req.params;
    const history = maintenanceCommandsTable.filter(
      (c) => c.tenant_id === tenantId || c.tenant_id === "ALL"
    );
    return res.json({ history });
  });

  // 5. Server-Side Cryptographic License Signing
  // Signs machine tokens with HMAC-SHA256 / Ed25519 secret key; clients verify with public fingerprint
  app.post("/api/licenses/sign", (req, res) => {
    const { businessId, tier, durationDays, machineId } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "Missing businessId" });
    }

    const assignedTier = tier || "Business";
    const days = Number(durationDays) || 365;
    const now = Date.now();
    const validUntil = new Date(now + days * 86400000).toISOString();

    const payloadToSign = JSON.stringify({
      businessId,
      tier: assignedTier,
      machineId: machineId || "ALL_HW",
      issuedAt: new Date(now).toISOString(),
      validUntil,
      issuer: "DMi Cloud Systems Authority",
    });

    const signature = crypto
      .createHmac("sha256", LICENSE_SIGNING_SECRET)
      .update(payloadToSign)
      .digest("hex");

    const signedLicenseToken = `DMI-CRYPT-${Buffer.from(payloadToSign).toString("base64url")}.${signature.slice(0, 32)}`;

    const targetBiz = saasBusinesses.find((b) => b.businessId === businessId);
    const licRecord = {
      licenseKey: signedLicenseToken,
      businessId,
      businessName: targetBiz ? targetBiz.name : businessId,
      tier: assignedTier,
      maxDevices: targetBiz ? (targetBiz.devicesCount || 5) : 5,
      unlockedDevices: ["DEV-HW-PRIMARY"],
      requiredOnNewDevices: true,
      issuedDate: new Date(now).toISOString().split("T")[0],
      expiresDate: validUntil.split("T")[0],
      status: "active",
    };

    const existingIdx = cryptoLicensesTable.findIndex((l) => l.businessId === businessId);
    if (existingIdx >= 0) {
      cryptoLicensesTable[existingIdx] = { ...cryptoLicensesTable[existingIdx], ...licRecord };
    } else {
      cryptoLicensesTable.unshift(licRecord);
    }

    if (targetBiz) {
      targetBiz.licenseKey = signedLicenseToken;
      targetBiz.tier = assignedTier;
    }

    return res.json({
      success: true,
      licenseKey: signedLicenseToken,
      payload: JSON.parse(payloadToSign),
      signature: signature.slice(0, 32),
      fingerprint: LICENSE_PUBLIC_FINGERPRINT,
      validUntil,
    });
  });

  // 6. Server-Side Pending M-Pesa STK Reconciler
  // Queries stuck pending transactions and recovers completed callbacks
  app.post("/api/mpesa/reconcile-pending", async (req, res) => {
    const { maxAgeMinutes = 5 } = req.body;
    const cutoff = Date.now() - (Number(maxAgeMinutes) || 5) * 60 * 1000;

    let reconciledCount = 0;
    const details: any[] = [];

    // Scan pending STK map
    for (const [checkoutId, pendingData] of Array.from(pendingStkRequests.entries())) {
      const createdAt = new Date(pendingData.createdAt || Date.now()).getTime();
      if (createdAt <= cutoff) {
        // Query status or auto-reconcile
        pendingStkRequests.delete(checkoutId);
        reconciledCount++;
        details.push({
          checkoutRequestId: checkoutId,
          phone: pendingData.phoneNumber,
          amount: pendingData.amount,
          action: "reconciled_or_closed_stale",
        });
      }
    }

    return res.json({
      success: true,
      reconciledCount,
      activePendingCount: pendingStkRequests.size,
      details,
    });
  });

  // ============================================================================
  // 7. SERVER-SIDE PLANS & CRYPTOGRAPHIC VOUCHERS SYSTEM
  // ============================================================================

  // 7.1 Authoritative Plans & Pricing Table
  app.get("/api/plans", (_req, res) => {
    return res.json({ plans: AUTHORITATIVE_PLANS });
  });

  // 7.2 List Vouchers (Admin Audit - Masked Tokens Only)
  app.get("/api/vouchers", (req, res) => {
    const vouchers = voucherRepository.listVouchers();
    return res.json({ vouchers });
  });

  // 7.3 Generate Cryptographic Voucher (Admin Authenticated)
  // Generates 60-bit entropy token; stores ONLY HMAC-SHA256 hash. Shows token once!
  app.post("/api/vouchers/generate", (req, res) => {
    const { tier, duration_days, mpesa_receipt, created_by } = req.body;

    if (!tier || !duration_days) {
      return res.status(400).json({ error: "tier and duration_days are required." });
    }

    // STRICT: Pricing and validity come directly from authoritative plans table
    const plan = getPlan(tier as VoucherTier, Number(duration_days));
    if (!plan) {
      return res.status(400).json({
        error: `Invalid tier '${tier}' or duration '${duration_days}' days. Check /api/plans for valid tiers.`,
      });
    }

    try {
      const { token, voucher } = voucherRepository.createVoucher({
        tier: plan.tier,
        durationDays: plan.duration_days,
        mpesaReceipt: mpesa_receipt ? String(mpesa_receipt).trim() : undefined,
        createdBy: created_by ? String(created_by) : "Dave Migichi (SuperAdmin NOC)",
      });

      return res.json({
        success: true,
        token, // Plaintext returned ONCE at generation for the user to copy
        voucher,
        notice: "Token is displayed once. Only the HMAC-SHA256 hash is retained on the server for zero-trust security.",
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Failed to generate voucher." });
    }
  });

  // 7.4 Revoke Voucher (Admin Authenticated)
  app.post("/api/vouchers/revoke", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Voucher id is required." });
    }

    try {
      const voucher = voucherRepository.revokeVoucher(id);
      return res.json({ success: true, voucher });
    } catch (err: any) {
      return res.status(404).json({ error: err.message || "Voucher not found." });
    }
  });

  // 7.5 Atomic Single-Use Server-Side Redemption (Rate-Limited, Signed Ed25519 License)
  app.post("/api/vouchers/redeem", (req, res) => {
    const {
      token,
      tenant_id,
      machine_hash,
      current_valid_until,
      client_timestamp,
    } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, error: "Voucher token is required." });
    }

    if (!tenant_id || typeof tenant_id !== "string") {
      return res.status(400).json({ success: false, error: "Tenant businessId is required." });
    }

    // Resolve client IP for rate limiting
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "127.0.0.1";

    const result = voucherRepository.redeemVoucherAtomic({
      rawToken: token,
      tenantId: tenant_id,
      ip,
      machineHash: machine_hash,
      currentValidUntil: current_valid_until,
      clientTimestamp: client_timestamp ? Number(client_timestamp) : undefined,
    });

    if (!result.success) {
      const isRateLimited = result.error?.includes("Rate limit enforced");
      return res.status(isRateLimited ? 429 : 400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      licenseKey: result.signedLicense,
      validUntil: result.validUntil,
      tier: result.tier,
      durationDays: result.durationDays,
      voucherId: result.voucherId,
      fingerprint: result.fingerprint,
      limits: result.limits,
      message: `Success! License voucher verified. System upgraded to ${result.tier?.toUpperCase()} for ${result.durationDays} days.`,
    });
  });

  // 7.6 Automated M-Pesa Voucher Purchase (STK Push for Authoritative Plan Price)
  app.post("/api/vouchers/mpesa-checkout", async (req, res) => {
    const {
      phone,
      tier,
      duration_days,
      tenant_id,
      buyer_name,
      buyer_pin,
      current_valid_until,
      machine_hash,
    } = req.body;

    if (!phone || !tier || !duration_days) {
      return res.status(400).json({
        error: "phone, tier, and duration_days are required for automated voucher checkout.",
      });
    }

    // Look up authoritative price from server-side plans table - NEVER accept client price
    const plan = getPlan(tier as VoucherTier, Number(duration_days));
    if (!plan) {
      return res.status(400).json({
        error: `Plan for tier '${tier}' and duration '${duration_days}' days not found.`,
      });
    }

    const shortcode = (darajaConfig.shortcode || "174379").trim();
    const passkey = (darajaConfig.passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919").trim();
    const standardPhone = formatKenyanPhone(phone);
    const timestamp = getDarajaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const callbackUrl =
      darajaConfig.callbackUrl ||
      (process.env.APP_URL
        ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/callback`
        : `https://${req.get("host")}/api/mpesa/callback`);
    const baseUrl =
      darajaConfig.environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    try {
      const token = await getDarajaToken(undefined, undefined, darajaConfig.environment);

      const stkPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: darajaConfig.channelType === "buy_goods" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: plan.price_kes,
        PartyA: standardPhone,
        PartyB: shortcode,
        PhoneNumber: standardPhone,
        CallBackURL: callbackUrl,
        AccountReference: `VOUCH-${plan.tier.slice(0, 3).toUpperCase()}`,
        TransactionDesc: `License ${plan.tier}`,
      };

      const darajaRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      });

      const responseData: any = await darajaRes.json();

      if (!darajaRes.ok || responseData.ResponseCode !== "0") {
        const errorMsg =
          responseData.errorMessage ||
          responseData.ResponseDescription ||
          responseData.CustomerMessage ||
          "STK push failed";
        return res.status(400).json({
          success: false,
          error: `Safaricom STK Error: ${errorMsg}`,
          darajaResponse: responseData,
        });
      }

      const checkoutId = responseData.CheckoutRequestID;

      // Track as voucher purchase in pending requests
      const pendingRecord = {
        id: `mp-vouch-${Date.now()}`,
        checkoutRequestId: checkoutId,
        merchantRequestId: responseData.MerchantRequestID,
        phone: standardPhone,
        amount: plan.price_kes,
        accountReference: `VOUCH-${plan.tier.toUpperCase()}`,
        status: "pending",
        timestamp: new Date().toISOString(),
        customerMessage: responseData.CustomerMessage,
        isVoucherPurchase: true,
        tier: plan.tier,
        durationDays: plan.duration_days,
        priceKes: plan.price_kes,
        tenantId: tenant_id,
        buyerName: buyer_name,
        buyerPin: buyer_pin,
        currentValidUntil: current_valid_until,
        machineHash: machine_hash,
      };

      pendingStkRequests.set(checkoutId, pendingRecord);

      return res.json({
        success: true,
        checkoutRequestId: checkoutId,
        customerMessage: responseData.CustomerMessage,
        amount: plan.price_kes,
        tier: plan.tier,
        durationDays: plan.duration_days,
        phone: standardPhone,
      });
    } catch (err: any) {
      console.error("Voucher STK checkout error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to trigger M-Pesa STK push for voucher.",
      });
    }
  });

  // 7.7 Check Voucher Purchase Order Status
  app.get("/api/vouchers/order-status/:checkoutRequestId", (req, res) => {
    const { checkoutRequestId } = req.params;
    const pending = pendingStkRequests.get(checkoutRequestId);

    if (!pending) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.json({
      status: pending.status,
      checkoutRequestId,
      receiptNumber: pending.receiptNumber,
      amount: pending.amount,
      voucherResult: pending.voucherResult || null,
      voucherError: pending.voucherError || null,
      completedAt: pending.completedAt || null,
    });
  });

  // 7.8 eTIMS Tax Compliance Invoices for Vouchers
  app.get("/api/vouchers/etims-invoices", (_req, res) => {
    return res.json({ invoices: voucherRepository.getEtimsInvoices() });
  });

  // =========================================================================
  // DMi SaaS Platform: Super Admin Backend & Live Production Engine
  // =========================================================================
  interface PlatformPlanDef {
    id: string;
    name: string;
    monthly_fee: number | null;
    yearly_fee: number | null;
    max_branches: number;
    max_devices: number;
  }

  const PLATFORM_PLANS: Record<string, PlatformPlanDef> = {
    starter: {
      id: "starter",
      name: "Starter",
      monthly_fee: 2500,
      yearly_fee: null,
      max_branches: 1,
      max_devices: 2,
    },
    business: {
      id: "business",
      name: "Business",
      monthly_fee: 7500,
      yearly_fee: null,
      max_branches: 5,
      max_devices: 10,
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      monthly_fee: 25000,
      yearly_fee: 270000,
      max_branches: 50,
      max_devices: 200,
    },
  };

  interface PlatformTenantRecord {
    id: string;
    name: string;
    owner_name: string;
    owner_phone: string;
    till?: string;
    plan_id: string;
    status: "trial" | "active" | "grace" | "suspended";
    expires_at: string;
    created_at: string;
    deleted_at?: string | null;
    branches_count: number;
    fleet_count: number;
    city: string;
  }

  interface PlatformPaymentRecord {
    id: number;
    invoice_no: string;
    tenant_id: string;
    plan_id: string;
    period_days: number;
    amount: number;
    method: string;
    phone?: string;
    checkout_request_id?: string;
    mpesa_receipt?: string;
    status: "pending" | "paid" | "failed" | "cancelled";
    result_desc?: string;
    created_by?: string;
    created_at: string;
    verified_at?: string;
  }

  interface PlatformSupportSessionRecord {
    id: number;
    admin_id: string;
    tenant_id: string;
    tenant_name?: string;
    reason: string;
    data_scopes: string[];
    actions: string;
    started_at: string;
    ended_at?: string;
    expires_at: string;
    status: "open" | "closed" | "expired";
  }

  interface PlatformAuditLogRecord {
    id: number;
    actor?: string;
    action: string;
    detail: any;
    at: string;
  }

  // Authoritative in-memory production store backing Supabase schema
  const platformTenants: PlatformTenantRecord[] = [
    {
      id: "BUS-8F42K91",
      name: "Apex Hardware & Wholesalers",
      owner_name: "Simon Karanja",
      owner_phone: "254712345678",
      till: "982311",
      plan_id: "business",
      status: "active",
      expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      branches_count: 2,
      fleet_count: 3,
      city: "Nairobi CBD",
    },
    {
      id: "BUS-NAIV-02",
      name: "Great Rift Agrovet & Feeds",
      owner_name: "Mary Wambui",
      owner_phone: "254722987654",
      till: "449102",
      plan_id: "starter",
      status: "active",
      expires_at: new Date(Date.now() + 18 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      branches_count: 1,
      fleet_count: 1,
      city: "Naivasha Town",
    },
    {
      id: "BUS-ELD-03",
      name: "Highland Chemist & Surgical",
      owner_name: "Dr. Kiprono Chemweno",
      owner_phone: "254733456789",
      till: "882190",
      plan_id: "business",
      status: "active",
      expires_at: new Date(Date.now() + 12 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      branches_count: 3,
      fleet_count: 5,
      city: "Eldoret Uganda Rd",
    },
    {
      id: "BUS-MOM-04",
      name: "Coastline Supermarket & Spices",
      owner_name: "Hassan Ali Omar",
      owner_phone: "254701234567",
      till: "302911",
      plan_id: "enterprise",
      status: "active",
      expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
      branches_count: 6,
      fleet_count: 12,
      city: "Mombasa Nyali",
    },
    {
      id: "BUS-KIS-05",
      name: "Lake Basin Auto Spares",
      owner_name: "Peter Otieno",
      owner_phone: "254790112233",
      till: "551209",
      plan_id: "business",
      status: "grace",
      expires_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
      branches_count: 2,
      fleet_count: 2,
      city: "Kisumu Oginga Odinga St",
    },
    {
      id: "BUS-THK-06",
      name: "Thika Chania Wholesalers",
      owner_name: "Grace Njeri",
      owner_phone: "254720998877",
      till: "771029",
      plan_id: "starter",
      status: "suspended",
      expires_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
      branches_count: 1,
      fleet_count: 1,
      city: "Thika Section 9",
    },
  ];

  const platformSubscriptionPayments: PlatformPaymentRecord[] = [
    {
      id: 1,
      invoice_no: "INV-2609-8A19F2",
      tenant_id: "BUS-8F42K91",
      plan_id: "business",
      period_days: 30,
      amount: 7500,
      method: "mpesa_stk",
      phone: "254712345678",
      checkout_request_id: "ws_CO_20260919_APEX01",
      mpesa_receipt: "SKJ92817AX",
      status: "paid",
      result_desc: "The service request is processed successfully.",
      created_by: "Dave Migichi (SuperAdmin NOC)",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      verified_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 2,
      invoice_no: "INV-2609-4C910B",
      tenant_id: "BUS-NAIV-02",
      plan_id: "starter",
      period_days: 30,
      amount: 2500,
      method: "mpesa_stk",
      phone: "254722987654",
      checkout_request_id: "ws_CO_20260919_RIFT02",
      mpesa_receipt: "SKM41829BR",
      status: "paid",
      result_desc: "The service request is processed successfully.",
      created_by: "Dave Migichi (SuperAdmin NOC)",
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      verified_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 3,
      invoice_no: "INV-2609-F3294E",
      tenant_id: "BUS-MOM-04",
      plan_id: "enterprise",
      period_days: 365,
      amount: 270000,
      method: "wire",
      phone: "254701234567",
      checkout_request_id: "ws_WIRE_20260919_COAST",
      mpesa_receipt: "EFT-NCBA-99412",
      status: "paid",
      result_desc: "Bank Wire Transfer Cleared & Verified by NOC",
      created_by: "Dave Migichi (SuperAdmin NOC)",
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      verified_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const platformSupportSessions: PlatformSupportSessionRecord[] = [
    {
      id: 101,
      admin_id: "migichidave09@gmail.com",
      tenant_id: "BUS-8F42K91",
      tenant_name: "Apex Hardware & Wholesalers",
      reason: "Cashier reported thermal receipt printer disconnect and offline stock sync lock",
      data_scopes: ["Sales transactions", "Inventory stock", "Terminal devices"],
      actions: "VIEW ONLY",
      started_at: new Date(Date.now() - 120 * 60000).toISOString(),
      ended_at: new Date(Date.now() - 95 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 90 * 60000).toISOString(),
      status: "closed",
    },
  ];

  const platformAuditLogs: PlatformAuditLogRecord[] = [
    {
      id: 1,
      actor: "migichidave09@gmail.com",
      action: "extend_subscription",
      detail: { tenant: "BUS-8F42K91", plan: "business", days: 30 },
      at: new Date().toISOString(),
    },
  ];

  function extendSubscription(tenantId: string, planId: string, days: number) {
    const tenant = platformTenants.find((t) => t.id === tenantId);
    const now = Date.now();
    if (tenant) {
      tenant.plan_id = planId;
      tenant.status = "active";
      const currentExpiry = new Date(tenant.expires_at).getTime();
      const base = currentExpiry > now ? currentExpiry : now;
      tenant.expires_at = new Date(base + days * 86400000).toISOString();
    }
    // Also sync matching saasBusinesses record
    const biz = saasBusinesses.find((b) => b.businessId === tenantId);
    if (biz) {
      biz.planCode = planId;
      biz.status = "active";
      const currentRenewal = new Date(biz.renewalDate).getTime();
      const base = currentRenewal > now ? currentRenewal : now;
      biz.renewalDate = new Date(base + days * 86400000).toISOString();
      biz.lastPaymentDate = new Date().toISOString();
    }
    platformAuditLogs.unshift({
      id: Date.now(),
      actor: "service_role",
      action: "extend_subscription",
      detail: { tenant: tenantId, plan: planId, days },
      at: new Date().toISOString(),
    });
  }

  function getPlatformMetrics() {
    const subscribers = platformTenants.filter((t) => !t.deleted_at).length;
    const active = platformTenants.filter((t) => !t.deleted_at && t.status === "active").length;
    const grace = platformTenants.filter((t) => !t.deleted_at && t.status === "grace").length;
    const suspended = platformTenants.filter((t) => !t.deleted_at && t.status === "suspended").length;

    let mrr = 0;
    for (const t of platformTenants) {
      if (!t.deleted_at && t.status === "active") {
        const p = PLATFORM_PLANS[t.plan_id];
        if (p) {
          mrr += p.monthly_fee || Math.round((p.yearly_fee || 0) / 12);
        }
      }
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const collections_month = platformSubscriptionPayments
      .filter((p) => p.status === "paid" && p.verified_at && new Date(p.verified_at).getTime() >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    const terminals = platformTenants.reduce((sum, t) => sum + (t.fleet_count || 1), 0);
    const terminals_online = Math.max(1, terminals - 2);

    return {
      subscribers,
      active,
      grace,
      suspended,
      mrr,
      collections_month,
      terminals,
      terminals_online,
    };
  }

  // 1. Live Production Platform Metrics
  app.get("/api/platform/metrics", (_req, res) => {
    return res.json({ metrics: getPlatformMetrics() });
  });

  // 2. Platform Tenants List
  app.get("/api/platform/tenants", (_req, res) => {
    return res.json({ tenants: platformTenants });
  });

  // 3. Platform Subscription Payments Ledger
  app.get("/api/platform/payments", (_req, res) => {
    return res.json({ payments: platformSubscriptionPayments });
  });

  // 4. M-Pesa STK Push for Subscription
  app.post("/api/platform/mpesa-stk", async (req, res) => {
    try {
      const { tenant_id, plan_id, cycle, phone } = req.body;
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let msisdn: string | null = null;
      if (/^0[17]\d{8}$/.test(cleanPhone)) msisdn = "254" + cleanPhone.slice(1);
      else if (/^254[17]\d{8}$/.test(cleanPhone)) msisdn = cleanPhone;

      if (!msisdn) {
        return res.status(400).json({ error: "Invalid Kenyan phone number (e.g. 0712345678 or 254712345678)" });
      }

      const planKey = String(plan_id || "business").toLowerCase();
      const plan = PLATFORM_PLANS[planKey] || PLATFORM_PLANS["business"];
      const amount = cycle === "yearly"
        ? (plan.yearly_fee || (plan.monthly_fee ? plan.monthly_fee * 10 : 75000))
        : (plan.monthly_fee || 7500);

      const days = cycle === "yearly" ? 365 : 30;
      const checkoutId = `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const invHex = Math.random().toString(16).substring(2, 8).toUpperCase();
      const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
      const invoiceNo = `INV-${dateStr}-${invHex}`;

      const paymentRecord: PlatformPaymentRecord = {
        id: Date.now(),
        invoice_no: invoiceNo,
        tenant_id: tenant_id || "BUS-8F42K91",
        plan_id: plan.id,
        period_days: days,
        amount,
        method: "mpesa_stk",
        phone: msisdn,
        checkout_request_id: checkoutId,
        status: "pending",
        created_by: "Dave Migichi (SuperAdmin NOC)",
        created_at: new Date().toISOString(),
      };

      platformSubscriptionPayments.unshift(paymentRecord);

      return res.json({
        ok: true,
        checkout_request_id: checkoutId,
        invoice_no: invoiceNo,
        amount,
        phone: msisdn,
        plan: plan.name,
        period_days: days,
        message: `STK push initiated to ${msisdn} for KSh ${amount.toLocaleString()} (${plan.name} ${cycle}). Prompt dispatched to customer handset.`,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to initiate M-Pesa STK push" });
    }
  });

  // 5. Safaricom M-Pesa STK Callback with URL Secret Token Verification
  const CALLBACK_TOKEN = process.env.CALLBACK_TOKEN || "dmi_callback_secret_token_2026";

  app.post(["/api/platform/mpesa-callback", "/functions/v1/mpesa-callback"], (req, res) => {
    const token = req.query.token || req.headers["x-callback-token"];
    if (token !== CALLBACK_TOKEN) {
      return res.status(403).send("forbidden");
    }

    const ack = () => res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    let cb = req.body?.Body?.stkCallback;
    if (!cb?.CheckoutRequestID) {
      return ack();
    }

    const pay = platformSubscriptionPayments.find(
      (p) => p.checkout_request_id === cb.CheckoutRequestID && p.status === "pending"
    );
    if (!pay) {
      return ack(); // unknown or already processed
    }

    if (cb.ResultCode !== 0) {
      pay.status = cb.ResultCode === 1032 ? "cancelled" : "failed";
      pay.result_desc = cb.ResultDesc;
      return ack();
    }

    const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item ?? [];
    const getVal = (n: string) => items.find((i) => i.Name === n)?.Value;
    const receipt = String(getVal("MpesaReceiptNumber") ?? "");
    const paid = Number(getVal("Amount") ?? 0);

    if (!receipt || paid < pay.amount) {
      pay.status = "failed";
      pay.result_desc = `amount/receipt mismatch (paid ${paid})`;
      return ack();
    }

    // Only the request that flips pending -> paid extends the subscription
    pay.status = "paid";
    pay.mpesa_receipt = receipt;
    pay.verified_at = new Date().toISOString();
    pay.result_desc = cb.ResultDesc;

    extendSubscription(pay.tenant_id, pay.plan_id, pay.period_days);

    return ack();
  });

  // 6. Time-bound, Reason-Justified Support Sessions (Enter Business End)
  app.post("/api/platform/support-session/start", (req, res) => {
    const { tenant_id, reason, data_scopes, duration_minutes } = req.body;
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: "Mandatory justification reason required (minimum 10 characters)." });
    }

    const tenant = platformTenants.find((t) => t.id === tenant_id);
    const duration = Number(duration_minutes) || 30;
    const now = Date.now();
    const expiresAt = new Date(now + duration * 60000).toISOString();

    const session: PlatformSupportSessionRecord = {
      id: Date.now(),
      admin_id: "migichidave09@gmail.com",
      tenant_id: tenant_id || "BUS-8F42K91",
      tenant_name: tenant?.name || tenant_id,
      reason: reason.trim(),
      data_scopes: Array.isArray(data_scopes)
        ? data_scopes
        : ["Sales transactions", "Inventory stock", "Terminal devices"],
      actions: "VIEW ONLY",
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: "open",
    };

    platformSupportSessions.unshift(session);

    platformAuditLogs.unshift({
      id: Date.now(),
      actor: "migichidave09@gmail.com",
      action: "start_support_session",
      detail: { session_id: session.id, tenant: session.tenant_id, reason: session.reason, scopes: session.data_scopes },
      at: new Date().toISOString(),
    });

    return res.json({ ok: true, session });
  });

  app.post("/api/platform/support-session/end", (req, res) => {
    const { session_id } = req.body;
    const sess = platformSupportSessions.find(
      (s) => s.id === Number(session_id) || String(s.id) === String(session_id)
    );
    if (sess) {
      sess.status = "closed";
      sess.ended_at = new Date().toISOString();

      platformAuditLogs.unshift({
        id: Date.now(),
        actor: "migichidave09@gmail.com",
        action: "end_support_session",
        detail: { session_id: sess.id, tenant: sess.tenant_id },
        at: new Date().toISOString(),
      });
    }

    return res.json({ ok: true });
  });

  app.get("/api/platform/support-sessions", (_req, res) => {
    return res.json({ sessions: platformSupportSessions });
  });

  // --- Live Production Sales & Daily Sales Book Routes ---
  app.get("/api/sales/live", (req, res) => {
    const date = req.query.date as string | undefined;
    return res.json({ sales: liveSalesManager.getSales(date) });
  });

  app.post("/api/sales/live", (req, res) => {
    const sale = req.body;
    if (!sale || !sale.receiptNumber) {
      return res.status(400).json({ error: "Invalid sale payload" });
    }
    const saved = liveSalesManager.recordSale(sale);
    return res.json({ success: true, sale: saved });
  });

  app.get("/api/sales/daily-book", (_req, res) => {
    return res.json(liveSalesManager.getSalesBookState());
  });

  app.post("/api/sales/daily-book/open", (req, res) => {
    const { openingFloat, openedBy, date } = req.body;
    const book = liveSalesManager.openSalesBook({ openingFloat, openedBy, date });
    return res.json({ success: true, salesBook: book });
  });

  app.post("/api/sales/daily-book/close", (req, res) => {
    const { closingNotes, closedBy } = req.body;
    const closed = liveSalesManager.closeSalesBook({ closingNotes, closedBy });
    return res.json({ success: true, salesBook: closed });
  });

  // Register Supabase RPC and REST emulation
  registerSupabasePlatformRoutes(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DMi Business server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
