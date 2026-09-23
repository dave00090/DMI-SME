import { SaaSPlan, SaaSInvoice, SupportAccessAuditLog, PlatformGlobalSettings, SubscriptionAccessStatus } from '../types';

export const defaultSaaSPlans: SaaSPlan[] = [
  {
    id: 'plan-starter',
    code: 'starter',
    name: 'DMi Starter',
    tier: 'Starter',
    monthlyPriceKes: 1000,
    annualPriceKes: 10000,
    maxBranches: 1,
    maxDevices: 2,
    maxUsers: 3,
    maxProducts: 1000,
    features: [
      'Single branch operation',
      '2 connected POS counters',
      'Real-time offline-first sales engine',
      'M-Pesa STK push & till prompt',
      'Daily sales book & basic reports',
      'Standard cloud event backup',
    ],
    isActive: true,
    supportLevel: 'standard',
  },
  {
    id: 'plan-business',
    code: 'business',
    name: 'DMi Business',
    tier: 'Business',
    monthlyPriceKes: 2000,
    annualPriceKes: 20000,
    maxBranches: 3,
    maxDevices: 8,
    maxUsers: 12,
    maxProducts: 10000,
    isPopular: true,
    features: [
      'Multi-branch inventory transfers (IBT)',
      'Up to 8 registered POS/tablet devices',
      'Granular staff permissions & audit trail',
      'Safaricom Daraja 2.0 automated reconciliation',
      'WhatsApp digital receipts & debt reminders',
      'Dispatch hub with driver PIN validation',
      'Automated daily cloud snapshots & vault',
      'AI business advisor & stock velocity forecast',
    ],
    isActive: true,
    supportLevel: 'priority_phone',
  },
  {
    id: 'plan-pro',
    code: 'pro',
    name: 'DMi Pro Fleet',
    tier: 'Pro',
    monthlyPriceKes: 4000,
    annualPriceKes: 40000,
    maxBranches: 8,
    maxDevices: 20,
    maxUsers: 30,
    maxProducts: 50000,
    features: [
      '8 retail branches & central warehouse',
      'Fleet of 20 concurrent active terminals',
      'Sub-second event-sourced ledger sync',
      'Custom security & loss prevention camera',
      'Live supplier order procurement portal',
      'Full API & accounting export',
      'Priority telephone & on-site field support',
    ],
    isActive: true,
    supportLevel: 'priority_phone',
  },
  {
    id: 'plan-enterprise',
    code: 'enterprise',
    name: 'DMi Enterprise',
    tier: 'Enterprise',
    monthlyPriceKes: 10000,
    annualPriceKes: 100000,
    maxBranches: 999,
    maxDevices: 999,
    maxUsers: 999,
    maxProducts: 999999,
    features: [
      'Unlimited branches, outlets & distribution depots',
      'Unlimited fleet terminals & mobile sales reps',
      'Dedicated cloud tenant with custom SLA',
      'Custom ERP/SAP & KRA eTIMS server integration',
      'Direct WhatsApp Cloud API integration',
      'Dedicated technical account manager 24/7',
    ],
    isActive: true,
    supportLevel: 'dedicated_24_7',
  },
];

export const defaultPlatformSettings: PlatformGlobalSettings = {
  trialDurationDays: 30,
  gracePeriodDays: 3,
  warningNoticeDays: 7,
  mrrTargetKes: 250000,
  requireDarajaForRenewal: true,
  allowManualVouchers: true,
  maintenanceMode: false,
};

export const initialSaaSInvoices: SaaSInvoice[] = [];

export const initialSupportAuditLogs: SupportAccessAuditLog[] = [];

/**
 * Calculates current subscription access state, remaining days, and grace countdown.
 */
export function calculateSubscriptionLifecycle(
  renewalDateStr: string,
  gracePeriodDays: number = 3,
  warningDays: number = 7
): {
  status: SubscriptionAccessStatus;
  daysRemaining: number;
  graceDaysRemaining: number;
  isOperable: boolean;
  isInGracePeriod: boolean;
  isSuspended: boolean;
  humanMessage: string;
} {
  const now = Date.now();
  const renewalTime = new Date(renewalDateStr).getTime();
  const msPerDay = 86400000;
  const diffMs = renewalTime - now;
  const daysRemaining = Math.ceil(diffMs / msPerDay);

  if (diffMs > warningDays * msPerDay) {
    return {
      status: 'active',
      daysRemaining,
      graceDaysRemaining: gracePeriodDays,
      isOperable: true,
      isInGracePeriod: false,
      isSuspended: false,
      humanMessage: `Active — Renews in ${daysRemaining} days`,
    };
  }

  if (diffMs > 0) {
    return {
      status: 'expiring_soon',
      daysRemaining,
      graceDaysRemaining: gracePeriodDays,
      isOperable: true,
      isInGracePeriod: false,
      isSuspended: false,
      humanMessage: daysRemaining === 1 ? 'Subscription renews tomorrow' : `Subscription renews in ${daysRemaining} days`,
    };
  }

  // Renewal date has passed. Check grace period
  const gracePeriodEnd = renewalTime + gracePeriodDays * msPerDay;
  const graceDiffMs = gracePeriodEnd - now;
  const graceDaysRemaining = Math.max(0, Math.ceil(graceDiffMs / msPerDay));

  if (graceDiffMs > 0) {
    return {
      status: 'grace_period',
      daysRemaining: 0,
      graceDaysRemaining,
      isOperable: true,
      isInGracePeriod: true,
      isSuspended: false,
      humanMessage: `Grace Period: ${graceDaysRemaining} day${graceDaysRemaining === 1 ? '' : 's'} remaining. Renew now to avoid interruption.`,
    };
  }

  // Grace period expired: Suspended
  return {
    status: 'suspended',
    daysRemaining: 0,
    graceDaysRemaining: 0,
    isOperable: false,
    isInGracePeriod: false,
    isSuspended: true,
    humanMessage: 'Subscription Suspended. Please renew via M-Pesa to restore cloud operations.',
  };
}
