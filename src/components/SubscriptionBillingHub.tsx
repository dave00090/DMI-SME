import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Smartphone,
  Check,
  ArrowRight,
  Download,
  FileText,
  HelpCircle,
  Zap,
  RotateCw,
  Building2,
  Sparkles,
  ExternalLink,
  Receipt,
  Layers,
  Lock,
} from 'lucide-react';
import { defaultSaaSPlans, calculateSubscriptionLifecycle } from '../data/saasData';
import { SaaSInvoice, SubscriptionTier } from '../types';

export const SubscriptionBillingHub: React.FC = () => {
  const {
    subscription,
    updateSubscriptionTier,
    businessIdentity,
    currentEmployee,
    employees,
    isOnline,
    addAuditLog,
  } = useBusiness();

  const isOwner = currentEmployee.role === 'owner';

  // Renewal form state
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(
    subscription.tier === 'Enterprise'
      ? 'enterprise'
      : subscription.tier === 'Pro'
      ? 'pro'
      : subscription.tier === 'Starter'
      ? 'starter'
      : 'business'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mpesaPhone, setMpesaPhone] = useState(businessIdentity?.ownerPhone || '0712345678');
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalSuccessMsg, setRenewalSuccessMsg] = useState<string | null>(null);
  const [renewalErrorMsg, setRenewalErrorMsg] = useState<string | null>(null);
  const [stkStatusMessage, setStkStatusMessage] = useState<string | null>(null);
  const [activeCheckoutRequestId, setActiveCheckoutRequestId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Invoices state
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([
    {
      id: 'inv-202609-001',
      invoiceNumber: 'DMI-INV-2026-0901',
      businessId: businessIdentity?.businessId || 'BIZ-MAIN',
      businessName: businessIdentity?.name || 'DMi Business Store',
      planCode: 'business',
      planName: 'DMi Business',
      amountKes: 2000,
      paymentMethod: 'mpesa_stk',
      transactionReference: 'SKH8924XM1',
      paymentDate: '2026-09-01T08:14:22Z',
      periodStart: '2026-09-01T00:00:00Z',
      periodEnd: '2026-10-01T00:00:00Z',
      status: 'paid',
      notes: `Verified M-Pesa renewal for ${businessIdentity?.name || 'DMi Business Store'}`,
    },
    {
      id: 'inv-202608-001',
      invoiceNumber: 'DMI-INV-2026-0801',
      businessId: businessIdentity?.businessId || 'BIZ-MAIN',
      businessName: businessIdentity?.name || 'DMi Business Store',
      planCode: 'business',
      planName: 'DMi Business',
      amountKes: 2000,
      paymentMethod: 'mpesa_stk',
      transactionReference: 'RJH1109PQ8',
      paymentDate: '2026-08-01T09:02:10Z',
      periodStart: '2026-08-01T00:00:00Z',
      periodEnd: '2026-09-01T00:00:00Z',
      status: 'paid',
      notes: 'Initial activation & deployment package',
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<SaaSInvoice | null>(null);

  // Calculate dynamic lifecycle status
  const lifecycle = calculateSubscriptionLifecycle(
    subscription.renewalDate || new Date(Date.now() + 15 * 86400000).toISOString(),
    subscription.gracePeriodDays || 3,
    7
  );

  // Selected plan calculation
  const currentPlanObj =
    defaultSaaSPlans.find((p) => p.code === selectedPlanCode) || defaultSaaSPlans[1];
  const payableAmount =
    billingCycle === 'annual'
      ? currentPlanObj.annualPriceKes
      : currentPlanObj.monthlyPriceKes;

  const handleMpesaRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenewalErrorMsg(null);
    setRenewalSuccessMsg(null);
    setStkStatusMessage(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
    setIsRenewing(true);

    try {
      // 1. Trigger Live STK Push via Daraja
      const res = await fetch('/api/saas/billing/mpesa-stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessIdentity?.businessId || 'BUS-8F42K91',
          businessName: businessIdentity?.name || 'DMi Business',
          phone: mpesaPhone,
          amount: payableAmount,
          planCode: selectedPlanCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch M-Pesa STK Push. Please verify Safaricom Daraja credentials.');
      }

      const reqId = data.checkoutRequestId;
      setActiveCheckoutRequestId(reqId);
      setStkStatusMessage(`Safaricom Daraja prompt dispatched to ${mpesaPhone}! Please enter your M-Pesa PIN on your phone.`);

      // 2. Poll live status from Daraja
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2.5s = 75s

      pollingRef.current = setInterval(async () => {
        attempts++;
        try {
          const queryRes = await fetch(
            `/api/saas/billing/stk-query?checkoutRequestId=${encodeURIComponent(reqId)}&businessId=${encodeURIComponent(
              businessIdentity?.businessId || 'BUS-8F42K91'
            )}&planCode=${encodeURIComponent(selectedPlanCode)}`
          );
          const queryData = await queryRes.json();

          if (queryData.success && (queryData.status === 'verified' || queryData.status === 'completed' || queryData.verified)) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRenewing(false);
            setActiveCheckoutRequestId(null);
            setStkStatusMessage(null);

            const receipt = queryData.receiptNumber || 'MPESA-RECEIPT';
            setRenewalSuccessMsg(
              `Live Payment Verified! M-Pesa Receipt: ${receipt}. Subscription renewed through ${new Date(
                queryData.newRenewalDate
              ).toLocaleDateString()}. Status is now ACTIVE.`
            );

            if (queryData.invoice) {
              setInvoices((prev) => [queryData.invoice, ...prev]);
            }
            updateSubscriptionTier(currentPlanObj?.tier || 'business');
            addAuditLog({
              userId: employees[0]?.id || 'emp-owner',
              userName: employees[0]?.name || 'Platform Owner',
              userRole: employees[0]?.role || 'owner',
              action: 'subscription_tier_change',
              targetDescription: `Business renewed subscription to ${currentPlanObj?.name || 'DMi Plan'} via Live M-Pesa STK Push (Receipt: ${receipt})`,
            });
          } else if (queryData.status === 'cancelled') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRenewing(false);
            setActiveCheckoutRequestId(null);
            setStkStatusMessage(null);
            setRenewalErrorMsg('Payment request was cancelled on the phone by the user (M-Pesa PIN prompt dismissed).');
          } else if (queryData.status === 'timeout') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRenewing(false);
            setActiveCheckoutRequestId(null);
            setStkStatusMessage(null);
            setRenewalErrorMsg('M-Pesa transaction prompt timed out. The customer did not enter their PIN in time.');
          } else if (attempts >= maxAttempts) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRenewing(false);
            setActiveCheckoutRequestId(null);
            setStkStatusMessage(null);
            setRenewalErrorMsg('Verification window closed. If you entered your PIN, the webhook will automatically record the renewal.');
          } else {
            setStkStatusMessage(`Awaiting PIN entry on ${mpesaPhone}... (Attempt ${attempts}/${maxAttempts})`);
          }
        } catch {
          // continue polling
        }
      }, 2500);
    } catch (err: any) {
      setIsRenewing(false);
      setStkStatusMessage(null);
      setActiveCheckoutRequestId(null);
      setRenewalErrorMsg(err.message || 'M-Pesa STK Push encountered an error.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner & Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                lifecycle.isSuspended
                  ? 'bg-rose-600'
                  : lifecycle.isInGracePeriod
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              }`}
            >
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Subscription & Billing Center
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    lifecycle.isSuspended
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : lifecycle.isInGracePeriod
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      lifecycle.isSuspended
                        ? 'bg-rose-600'
                        : lifecycle.isInGracePeriod
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                  />
                  <span>
                    {lifecycle.isSuspended
                      ? 'Suspended'
                      : lifecycle.isInGracePeriod
                      ? `Grace Period (${lifecycle.graceDaysRemaining}d left)`
                      : 'Active'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Account:{' '}
                <strong className="text-slate-700">{businessIdentity?.name || 'DMi Business Store'}</strong> (ID:{' '}
                <span className="font-mono text-blue-600 font-semibold">
                  {businessIdentity?.businessId || 'BIZ-MAIN'}
                </span>
                ) • Current Plan:{' '}
                <span className="font-semibold text-slate-800">
                  DMi {subscription?.tier || 'Business'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">
                Renewal Due Date
              </span>
              <span className="text-sm font-bold text-slate-800">
                {new Date(
                  subscription.renewalDate || '2027-01-15'
                ).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <a
              href="#renew-section"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Renew via M-Pesa</span>
            </a>
          </div>
        </div>

        {/* Dynamic Alert Banner for Grace Period or Suspended State */}
        {lifecycle.isInGracePeriod && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">
                Your DMi Business subscription has expired.
              </span>{' '}
              You have{' '}
              <strong className="underline">
                {lifecycle.graceDaysRemaining} day
                {lifecycle.graceDaysRemaining === 1 ? '' : 's'} remaining
              </strong>{' '}
              in your grace period. Normal POS and branch operations are temporarily
              permitted, but please renew to prevent automatic cloud suspension.
            </div>
          </div>
        )}

        {lifecycle.isSuspended && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <span className="font-bold">Subscription Access Paused:</span> Your
              subscription has expired and the grace period has ended. New sales
              recording and cloud synchronizations are paused. Your customer records,
              stock inventory, and historical data remain 100% safe and intact. Renew
              below to reactivate your system immediately.
            </div>
          </div>
        )}
      </div>

      {/* 2. Permanent Data Safety Guarantee Callout */}
      <div className="bg-linear-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>DMi Core Principle: Subscription controls access, never data retention</span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                Zero Data Erasure Policy
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If your subscription expires, your shop's database, customer madeni records,
              sales history, receipts, supplier books, and branches are <strong>never deleted or wiped</strong>.
              You can log in at any time, review your invoices, download reports, or renew
              via M-Pesa to restore full operational service.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Subscription Plans Comparison Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">DMi Business Subscription Plans</h2>
            <p className="text-xs text-slate-500">
              Choose the right operational tier for your store branches and fleet terminals
            </p>
          </div>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Annual (12 Mos)</span>
              <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultSaaSPlans.map((plan) => {
            const isSelected = selectedPlanCode === plan.code;
            const isCurrentActive =
              (subscription?.tier || 'Business').toLowerCase() === (plan?.tier || '').toLowerCase();
            const price =
              billingCycle === 'annual' ? plan.annualPriceKes : plan.monthlyPriceKes;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanCode(plan.code)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {plan.tier}
                    </span>
                    {isCurrentActive && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{plan.name}</h3>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      KES {price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">
                      /{billingCycle === 'annual' ? 'yr' : 'mo'}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Branches</span>
                      <span className="font-semibold text-slate-800">
                        {plan.maxBranches >= 999 ? 'Unlimited' : plan.maxBranches}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">POS Terminals</span>
                      <span className="font-semibold text-slate-800">
                        {plan.maxDevices >= 999 ? 'Unlimited' : plan.maxDevices}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Staff Accounts</span>
                      <span className="font-semibold text-slate-800">
                        {plan.maxUsers >= 999 ? 'Unlimited' : plan.maxUsers}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {plan.features.slice(0, 5).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Instant M-Pesa Renewal Card */}
      <div id="renew-section" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pay Subscription via Safaricom M-Pesa
              </h2>
              <p className="text-xs text-slate-500">
                Instant automated verification • STK push prompt sent directly to your phone
              </p>
            </div>
          </div>

          <form onSubmit={handleMpesaRenewal} className="mt-6 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Renewing Package</span>
                <span className="text-sm font-bold text-slate-800">
                  {currentPlanObj?.name || 'DMi Plan'} ({billingCycle === 'annual' ? '12 Months' : '1 Month'})
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Amount Due</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  KES {payableAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Safaricom Phone Number for M-Pesa STK Prompt
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="07XX XXX XXX or 2547XXXXXXXX"
                  required
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                The Safaricom PIN dialog will pop up on this phone to confirm payment of KES{' '}
                {payableAmount.toLocaleString()}.
              </span>
            </div>

            {stkStatusMessage && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 animate-pulse">
                <RotateCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                <div className="space-y-0.5">
                  <div className="font-bold">Live Safaricom Daraja STK Push Active</div>
                  <div>{stkStatusMessage}</div>
                  {activeCheckoutRequestId && (
                    <div className="font-mono text-[10px] text-blue-700">Checkout ID: {activeCheckoutRequestId}</div>
                  )}
                </div>
              </div>
            )}

            {renewalSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{renewalSuccessMsg}</span>
              </div>
            )}

            {renewalErrorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{renewalErrorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isRenewing}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isRenewing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Verifying M-Pesa STK Push...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Send STK Push & Renew (KES {payableAmount.toLocaleString()})</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Or Paybill: <strong>174379</strong></span>
                <span>•</span>
                <span>Account: <strong className="font-mono text-blue-600">{businessIdentity.businessId}</strong></span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 5. Invoices & Payment History Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Subscription Invoices & Receipts</h2>
            <p className="text-xs text-slate-500">
              Auditable records of all subscription payments made by {businessIdentity?.name || 'DMi Business Store'}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {invoices.length} recorded invoice{invoices.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Date Paid</th>
                <th className="py-3 px-4">Period Covered</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{inv.planName}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    KES {(inv.amountKes || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-800 font-semibold">
                      {inv.transactionReference}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {inv.paymentMethod.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(inv.paymentDate).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(inv.periodStart).toLocaleDateString()} –{' '}
                    {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      <Check className="w-3 h-3" />
                      <span>Paid</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Subscription Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Business Name</span>
                <span className="font-semibold text-slate-900">
                  {selectedInvoice.businessName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Business ID</span>
                <span className="font-mono text-blue-600 font-bold">
                  {selectedInvoice.businessId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subscription Tier</span>
                <span className="font-semibold text-slate-900">
                  {selectedInvoice.planName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">M-Pesa Reference</span>
                <span className="font-mono font-bold text-emerald-700">
                  {selectedInvoice.transactionReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Period Covered</span>
                <span>
                  {new Date(selectedInvoice.periodStart).toLocaleDateString()} to{' '}
                  {new Date(selectedInvoice.periodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-slate-500 font-bold">Total Paid</span>
                <span className="text-lg font-mono font-black text-slate-900">
                  KES {(selectedInvoice.amountKes || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
