import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Building2,
  Layers,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CreditCard,
  Ban,
  CheckCircle2,
  Smartphone,
  RotateCw,
  AlertCircle,
  HelpCircle,
  Phone,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { SubscriptionTier } from '../../types';

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const PackageSelectionModal: React.FC<PackageSelectionModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
}) => {
  const {
    subscription,
    updateSubscriptionTier,
    confirmSubscriptionPayment,
    setActiveTab,
    businessIdentity,
  } = useBusiness();

  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    subscription?.tier || 'Starter'
  );

  // M-Pesa payment state
  const [mpesaPhone, setMpesaPhone] = useState(
    businessIdentity?.ownerPhone || '0712345678'
  );
  const [mpesaCode, setMpesaCode] = useState('');
  const [isStkPending, setIsStkPending] = useState(false);
  const [stkCountdown, setStkCountdown] = useState(0);
  const [stkSent, setStkSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sseRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Cleanup SSE and polling on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const planAmount = selectedTier === 'Starter' ? 1000 : selectedTier === 'Business' ? 2000 : 10000;
  const planLabel = selectedTier === 'Starter' ? 'Starter (1 Shop)' : selectedTier === 'Business' ? 'Business (Multi-Shop)' : 'Enterprise (Chain)';

  // Send Live M-Pesa STK push via Till 5331774
  const handleSendStkPush = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = mpesaPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setErrorMsg('Please enter a valid Safaricom phone number (e.g. 0712345678).');
      return;
    }

    setIsStkPending(true);
    setStkSent(true);
    setStkCountdown(60);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setStkCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          setIsStkPending(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const res = await fetch('/api/saas/billing/mpesa-stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          amount: planAmount,
          planCode: selectedTier.toLowerCase(),
          businessId: businessIdentity?.businessId || 'BUS-8F42K91',
          businessName: businessIdentity?.name || 'DMi Business Store',
          accountReference: '5331774',
        }),
      });

      const data = await res.json();
      if (data.success && data.checkoutRequestId) {
        setSuccessMsg(data.customerMessage || `STK Prompt dispatched to ${cleanPhone}. Please enter your M-Pesa PIN on handset.`);

        // Listen for live Safaricom callback via SSE
        try {
          if (sseRef.current) sseRef.current.close();
          const sse = new EventSource(`/api/mpesa/stream?checkoutRequestId=${encodeURIComponent(data.checkoutRequestId)}`);
          sseRef.current = sse;
          sse.onmessage = (event) => {
            try {
              const eventData = JSON.parse(event.data);
              if (eventData.type === 'stk_callback') {
                if (eventData.resultCode === 0 && eventData.receiptNumber) {
                  setMpesaCode(eventData.receiptNumber);
                  setSuccessMsg(`✓ M-Pesa payment confirmed by Safaricom! Receipt: ${eventData.receiptNumber}. Unlocking app...`);
                  setIsStkPending(false);
                  sse.close();
                  const confirmRes = confirmSubscriptionPayment({
                    mpesaCode: eventData.receiptNumber,
                    amount: planAmount,
                    tier: selectedTier,
                    phone: cleanPhone,
                    notes: `Live Till 5331774 package activation (${planLabel})`,
                  });
                  if (confirmRes.success) {
                    if (selectedTier === 'Starter') setActiveTab('pos');
                    setTimeout(() => {
                      if (onClose) onClose();
                    }, 1200);
                  }
                } else if (eventData.resultCode !== undefined && eventData.resultCode !== 0) {
                  setErrorMsg(`Safaricom: ${eventData.resultDesc || 'Payment cancelled or timed out on phone.'}`);
                  setIsStkPending(false);
                  sse.close();
                }
              }
            } catch (err) {
              console.error('SSE parse error:', err);
            }
          };
        } catch (err) {
          console.error('SSE initialization error:', err);
        }

        // Also poll status fallback
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
          try {
            const qRes = await fetch(`/api/saas/billing/stk-query?checkoutRequestId=${encodeURIComponent(data.checkoutRequestId)}`);
            if (qRes.ok) {
              const qData = await qRes.json();
              const rcpt = qData.mpesaReceipt || qData.receiptNumber;
              if (qData.success && (qData.status === 'completed' || rcpt)) {
                if (rcpt) {
                  setMpesaCode(rcpt);
                  clearInterval(pollTimerRef.current);
                  if (sseRef.current) sseRef.current.close();
                  setIsStkPending(false);
                  confirmSubscriptionPayment({
                    mpesaCode: rcpt,
                    amount: planAmount,
                    tier: selectedTier,
                    phone: cleanPhone,
                    notes: `Live Till 5331774 package activation (${planLabel})`,
                  });
                  setSuccessMsg(`✓ M-Pesa confirmed! Receipt: ${rcpt}. Unlocking app...`);
                  if (selectedTier === 'Starter') setActiveTab('pos');
                  setTimeout(() => {
                    if (onClose) onClose();
                  }, 1200);
                }
              }
            }
          } catch (e) {
            // ignore
          }
        }, 3500);
      } else {
        setErrorMsg(data.error || 'Failed to dispatch Safaricom STK Push to Till 5331774.');
        setIsStkPending(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error triggering STK Push.');
      setIsStkPending(false);
    }
  };

  // Verify and complete payment
  const handleVerifyPayment = () => {
    setErrorMsg(null);
    const code = mpesaCode.trim().toUpperCase();

    if (!code || code.length < 8) {
      setErrorMsg('Please enter your 10-character M-Pesa transaction confirmation code (e.g. SKH8924XM1).');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      const res = confirmSubscriptionPayment({
        mpesaCode: code,
        amount: planAmount,
        tier: selectedTier,
        phone: mpesaPhone,
        notes: `First-time device package activation via Till 5331774 (${planLabel})`,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        if (selectedTier === 'Starter') {
          setActiveTab('pos');
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMsg('Payment verification failed. Please check the transaction code and retry.');
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60">
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {step === 'select' ? <Store className="w-6 h-6" /> : <CreditCard className="w-6 h-6 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {step === 'select'
                    ? 'Select Your Operating Package'
                    : `Confirm & Pay via M-Pesa Till 5331774`}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {step === 'select' ? 'Step 1 of 2: Package' : 'Step 2 of 2: Activation Payment'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-400 font-medium mt-0.5">
                {step === 'select'
                  ? '💡 Most clients will have just 1 shop. Choose the Starter package to begin.'
                  : `Pay KES ${planAmount.toLocaleString()} via Safaricom Lipa Na M-Pesa Buy Goods Till 5331774 to unlock your app.`}
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: PACKAGE CHOICES GRID */}
        {step === 'select' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. STARTER PACKAGE */}
              <div
                onClick={() => setSelectedTier('Starter')}
                className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'Starter'
                    ? 'bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      1 Shop (Recommended)
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        selectedTier === 'Starter'
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedTier === 'Starter' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">DMi Starter</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Single-store retailers, shops, hardware, chemists & kiosks.
                  </p>

                  <div className="mt-3 text-lg font-black text-white font-mono">
                    KES 1,000 <span className="text-xs text-slate-400 font-normal">/month</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>1 Store Outlet (HQ)</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>2 Connected POS Terminals</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Fast Offline-first POS Engine</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>M-Pesa STK & Daily Sales Book</span>
                    </div>

                    {/* Explicit Restriction Notice */}
                    <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                      <div className="font-semibold flex items-center gap-1 text-rose-400 mb-0.5">
                        <Ban className="w-3 h-3 shrink-0" />
                        <span>Single Shop Only</span>
                      </div>
                      No access to <strong>Multi Branch v2</strong>, <strong>IBT</strong>, or <strong>Dispatch</strong> tabs.
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. BUSINESS PACKAGE */}
              <div
                onClick={() => setSelectedTier('Business')}
                className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'Business'
                    ? 'bg-blue-950/20 border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-950/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Multi-Shop
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        selectedTier === 'Business'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedTier === 'Business' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">DMi Business</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Expanding businesses operating 2 or 3 shop locations.
                  </p>

                  <div className="mt-3 text-lg font-black text-white font-mono">
                    KES 2,000 <span className="text-xs text-slate-400 font-normal">/month</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span><strong>Up to 3 Branches</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Up to 8 POS Terminals</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Full Multi-Branch v2 Tab</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Inter-Branch Transfers (IBT)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Central Dispatch Manager</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ENTERPRISE PACKAGE */}
              <div
                onClick={() => setSelectedTier('Enterprise')}
                className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'Enterprise'
                    ? 'bg-indigo-950/20 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-950/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Enterprise Chain
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        selectedTier === 'Enterprise'
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedTier === 'Enterprise' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">DMi Enterprise</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Large chains, wholesale depots, and logistics fleets.
                  </p>

                  <div className="mt-3 text-lg font-black text-white font-mono">
                    KES 10,000 <span className="text-xs text-slate-400 font-normal">/month</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span><strong>Unlimited Branches & Stores</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Unlimited POS Fleet</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Complete Logistics Matrix</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Comparison Summary Bar */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Selected Plan: <strong className="text-white">DMi {selectedTier}</strong> (
                  {selectedTier === 'Starter'
                    ? '1 Shop • KES 1,000/mo • Multi-Branch, IBT & Dispatch disabled'
                    : selectedTier === 'Business'
                    ? 'Multi-Shop (Up to 3 branches) • KES 2,000/mo'
                    : 'Enterprise Chain • KES 10,000/mo'}
                  )
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Payment via Till 5331774 unlocks full app access.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: M-PESA PAYMENT SCREEN VIA TILL 5331774 */}
        {step === 'payment' && (
          <div className="p-4 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Payment Summary Box */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Lipa Na M-Pesa Buy Goods Till
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-2">
                  <span>Till: 5331774</span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Business Name: <strong>DMi Technologies</strong>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs text-slate-400">Subscription Amount:</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  KES {planAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {planLabel} (30 Days Active Access)
                </div>
              </div>
            </div>

            {/* STK Push Trigger Card */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  M-Pesa Safaricom Phone Number for STK Push Prompt *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendStkPush}
                  disabled={isStkPending}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isStkPending ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Prompt ({stkCountdown}s)...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Send STK Push Prompt (KES {planAmount.toLocaleString()} to Till 5331774)</span>
                    </>
                  )}
                </button>

                {stkSent && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Prompt dispatched! Check your phone and enter M-Pesa PIN.</span>
                  </span>
                )}
              </div>
            </div>

            {/* Confirmation & Transaction Code Entry */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                M-Pesa Transaction Confirmation Code *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SKH8924XM1"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono uppercase font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={isVerifying || !mpesaCode.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isVerifying ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Verify & Unlock App</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Enter the 10-character code received via SMS from MPESA after paying to Till <strong>5331774</strong>.
                The app will instantly verify the confirmation code and unlock access.
              </p>
            </div>

            {/* Manual Payment Instructions */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Manual M-Pesa Step-by-Step Instructions:</div>
              <div>1. Open M-Pesa on your phone → Lipa na M-Pesa → <strong>Buy Goods and Services</strong></div>
              <div>2. Enter Till Number: <strong className="text-white font-mono">5331774</strong> (DMi Technologies)</div>
              <div>3. Enter Amount: <strong className="text-emerald-300 font-mono">KES {planAmount.toLocaleString()}</strong></div>
              <div>4. Enter your secret M-Pesa PIN and press send. Copy the confirmation code above.</div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {step === 'select' ? (
            <>
              <div className="text-xs text-slate-400">
                {selectedTier === 'Starter' ? (
                  <span className="text-emerald-400 font-medium">
                    ✓ Perfect for single-shop retailers without multi-branch overhead.
                  </span>
                ) : (
                  <span className="text-blue-400 font-medium">
                    ✓ Multi-Branch v2, IBT Transfers, and Dispatch Hub will be enabled.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('payment')}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition cursor-pointer flex items-center gap-2"
              >
                <span>Continue to M-Pesa STK Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Package</span>
              </button>

              <div className="text-xs text-slate-400">
                App unlocks automatically upon confirmation of payment.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
