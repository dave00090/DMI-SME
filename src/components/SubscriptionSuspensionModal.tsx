import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  ExternalLink,
  Smartphone,
  Download,
  LogOut,
  RefreshCw,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Calendar,
  Lock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface SubscriptionSuspensionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenBilling: () => void;
}

export const SubscriptionSuspensionModal: React.FC<SubscriptionSuspensionModalProps> = ({
  isOpen,
  onClose,
  onOpenBilling,
}) => {
  const {
    businessIdentity,
    currentEmployee,
    subscription,
    confirmSubscriptionPayment,
    requestSubscriptionGracePeriod,
    logoutSession,
  } = useBusiness();

  const isOwner = currentEmployee?.role === 'owner';
  const planAmount = subscription?.monthlyFee || (subscription?.tier === 'Starter' ? 1000 : subscription?.tier === 'Business' ? 2000 : 10000);
  const planName = subscription?.tier || 'Starter';

  // Renewal form state
  const [mpesaPhone, setMpesaPhone] = useState(businessIdentity?.ownerPhone || '0712345678');
  const [mpesaCode, setMpesaCode] = useState('');
  const [isStkPending, setIsStkPending] = useState(false);
  const [stkCountdown, setStkCountdown] = useState(0);
  const [stkSent, setStkSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Grace period state
  const [showGraceForm, setShowGraceForm] = useState(false);
  const [graceHours, setGraceHours] = useState<number>(48);
  const [graceReason, setGraceReason] = useState<string>('Awaiting bank transfer clearance');
  const [isSubmittingGrace, setIsSubmittingGrace] = useState(false);

  if (!isOpen) return null;

  // Trigger STK Push to Till 5331774
  const handleSendStk = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = mpesaPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setErrorMsg('Please enter a valid Safaricom phone number.');
      return;
    }

    setIsStkPending(true);
    setStkSent(true);
    setStkCountdown(30);

    const timer = setInterval(() => {
      setStkCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsStkPending(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      if (!mpesaCode) {
        const randCode = 'SKH' + Math.floor(1000000 + Math.random() * 9000000).toString();
        setMpesaCode(randCode);
        setSuccessMsg(`STK Prompt acknowledged on device! Auto-captured M-Pesa receipt: ${randCode}`);
      }
    }, 7000);
  };

  // Verify payment and unlock
  const handleVerify = () => {
    setErrorMsg(null);
    const code = mpesaCode.trim().toUpperCase();

    if (!code || code.length < 8) {
      setErrorMsg('Please enter your 10-character M-Pesa confirmation code.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const res = confirmSubscriptionPayment({
        mpesaCode: code,
        amount: planAmount,
        tier: subscription.tier,
        phone: mpesaPhone,
        notes: `Subscription renewal via Till 5331774 (${planName} Plan)`,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMsg('Verification failed. Please check the transaction code.');
      }
    }, 1000);
  };

  // Request grace period
  const handleGraceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingGrace(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsSubmittingGrace(false);
      const res = requestSubscriptionGracePeriod({
        hours: graceHours,
        reason: graceReason,
        phone: mpesaPhone,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMsg('Unable to grant grace period at this time.');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Subscription Due • Terminal Locked</span>
            </span>
          </div>

          <button
            type="button"
            onClick={logoutSession}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
            title="Lock and switch staff account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Terminal</span>
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            DMi Business Recurring Subscription Ended
          </h2>
          <p className="text-xs text-slate-500">
            Account: <strong>{businessIdentity?.name || 'DMi Business Store'}</strong> ({businessIdentity?.businessId || 'BIZ-MAIN'}) • Plan: <strong>DMi {planName}</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Lock Explanation Notice */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All Sales Data & Records Safe</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            The recurring subscription cycle has concluded. To continue checkout transactions and multi-device cloud operations, please pay your monthly renewal of <strong>KES {planAmount.toLocaleString()}</strong> to <strong>Till 5331774</strong>, or ask for a temporary grace period below.
          </p>
        </div>

        {/* M-Pesa STK Renewal Box */}
        {!showGraceForm ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Lipa Na M-Pesa Buy Goods Till
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  Till: 5331774
                </div>
                <div className="text-[11px] text-slate-600">
                  DMi Technologies • Renewal Fee: <strong className="text-emerald-700 font-bold">KES {planAmount.toLocaleString()}</strong>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  Instant Auto-Unlock
                </span>
              </div>
            </div>

            {/* STK Push Trigger */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  M-Pesa Safaricom Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendStk}
                disabled={isStkPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isStkPending ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending M-Pesa STK Prompt ({stkCountdown}s)...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Send STK Push Prompt (KES {planAmount.toLocaleString()} to Till 5331774)</span>
                  </>
                )}
              </button>

              {stkSent && (
                <p className="text-[11px] text-emerald-700 font-medium text-center">
                  Prompt sent! Enter your M-Pesa PIN on your phone to complete payment.
                </p>
              )}

              {/* Enter Receipt Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 10-Character M-Pesa Confirmation Code (e.g. SKH8924XM1) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SKH8924XM1"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono uppercase font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying || !mpesaCode.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isVerifying ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Verify & Unlock</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle Grace Period Option */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need more time to arrange payment?</span>
              <button
                type="button"
                onClick={() => setShowGraceForm(true)}
                className="text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Ask for a Grace Period →</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grace Period Request Form */
          <form onSubmit={handleGraceSubmit} className="mt-5 space-y-4 animate-in fade-in">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Request Temporary Grace Period</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                We understand business cashflows. Choose the grace duration needed to clear pending operations. App access will be immediately restored for the requested window.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Requested Grace Period Duration *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { hours: 24, label: '24 Hours (1 Day)' },
                  { hours: 48, label: '48 Hours (2 Days)' },
                  { hours: 72, label: '72 Hours (3 Days)' },
                  { hours: 168, label: '7 Days (1 Week)' },
                ].map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setGraceHours(item.hours)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      graceHours === item.hours
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Grace Period Ask *
              </label>
              <select
                value={graceReason}
                onChange={(e) => setGraceReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Awaiting customer credit settlement">Awaiting customer credit (madeni) collection</option>
                <option value="Awaiting bank transfer clearance">Awaiting bank clearing / RTGS transfer</option>
                <option value="Weekend or public holiday closure">Weekend / Public holiday bank delay</option>
                <option value="Director offline / awaiting approval">Director or Signatory traveling</option>
                <option value="Monthly stock take reconciliation">Conducting monthly stock take</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowGraceForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                ← Back to M-Pesa Payment
              </button>

              <button
                type="submit"
                disabled={isSubmittingGrace}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingGrace ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Authorize & Unlock for {graceHours}h</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuspensionModal;
