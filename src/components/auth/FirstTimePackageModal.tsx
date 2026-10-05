import React, { useState } from 'react';
import {
  Building2,
  Check,
  Store,
  Sparkles,
  ArrowRight,
  Lock,
  Layers,
  Send,
  ArrowRightLeft,
  Shield,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { SubscriptionTier } from '../../types';

interface FirstTimePackageModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const FirstTimePackageModal: React.FC<FirstTimePackageModalProps> = ({
  isOpen,
  onClose,
  isMandatory = true,
}) => {
  const { subscription, updateSubscriptionTier, setActiveTab } = useBusiness();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(() => {
    return subscription?.tier || 'Starter';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPackage = () => {
    setIsSubmitting(true);
    updateSubscriptionTier(selectedTier);
    localStorage.setItem('dmi_initial_package_selected', 'true');

    if (selectedTier === 'Starter') {
      setActiveTab('pos');
    }

    setIsSubmitting(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden text-white my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Select Your Subscription Package
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    First-Time Setup
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Choose the operating tier that matches your business model. You can adjust this at any time in Billing.
                </p>
              </div>
            </div>

            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="self-end sm:self-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Single Shop Guidance Banner */}
          <div className="mt-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="text-xs leading-relaxed text-emerald-200">
              <strong className="text-emerald-300 font-bold">Most clients operate just one shop!</strong>{' '}
              If you run a single retail store, hardware outlet, agrovet, chemist, or wines & spirits, the{' '}
              <strong className="text-white font-bold underline decoration-emerald-400">Starter Package (1 Shop)</strong>{' '}
              is custom-built for you at KES 1,000/mo. To keep operations straightforward for single-store retailers, multi-branch routing, cross-depot IBT transfers, and dispatch hubs are disabled.
            </div>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 1. STARTER PLAN (RECOMMENDED FOR 1 SHOP) */}
            <div
              onClick={() => setSelectedTier('Starter')}
              className={`relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                selectedTier === 'Starter'
                  ? 'bg-slate-800/90 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                Most Clients (1 Shop)
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Single Store
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    selectedTier === 'Starter' ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-600'
                  }`}>
                    {selectedTier === 'Starter' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-lg font-black text-white">DMi Starter</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                  Engineered specifically for single-shop retailers wanting high-speed POS cashiering.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">KES 1,000</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Physical Outlets:</span>
                    <strong className="text-emerald-400 font-bold">1 Shop (Single Branch)</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Connected Terminals:</span>
                    <strong className="text-white">2 POS Devices</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Staff Accounts:</span>
                    <strong className="text-white">Up to 3 Users</strong>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time offline-first POS sales</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Safaricom M-Pesa STK Prompt & Till</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Stock inventory & reorder warnings</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Customer debt (Madeni) ledger</span>
                  </div>
                </div>

                {/* Gated Features Clearly Highlighted */}
                <div className="mt-4 p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-[11px] text-rose-300/90 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300">
                    <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>Disabled for Single-Shop Setup:</span>
                  </div>
                  <div className="flex items-center gap-1.5 line-through text-slate-400 text-[10px]">
                    <span>• Multi Branch v2 tab</span>
                  </div>
                  <div className="flex items-center gap-1.5 line-through text-slate-400 text-[10px]">
                    <span>• Inter-Branch Transfers (IBT)</span>
                  </div>
                  <div className="flex items-center gap-1.5 line-through text-slate-400 text-[10px]">
                    <span>• Central Dispatch Hub</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier('Starter');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedTier === 'Starter'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedTier === 'Starter' ? 'Selected Package' : 'Select Starter'}
                </button>
              </div>
            </div>

            {/* 2. BUSINESS PLAN (MULTI-SHOP) */}
            <div
              onClick={() => setSelectedTier('Business')}
              className={`relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                selectedTier === 'Business'
                  ? 'bg-slate-800/90 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-md">
                Multi-Branch Enabled
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    2 to 3 Stores
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    selectedTier === 'Business' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-600'
                  }`}>
                    {selectedTier === 'Business' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-lg font-black text-white">DMi Business</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                  For expanding businesses managing stock transfers and dispatch between multiple shops.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">KES 2,000</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Physical Outlets:</span>
                    <strong className="text-blue-400 font-bold">Up to 3 Branches</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Connected Terminals:</span>
                    <strong className="text-white">Up to 8 Devices</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Staff Accounts:</span>
                    <strong className="text-white">Up to 12 Users</strong>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Everything in Starter package</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Multi Branch v2 enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300 font-semibold">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Inter-Branch Stock Transfers (IBT)</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300 font-semibold">
                    <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Central Dispatch Hub & Orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>WhatsApp engine & debt reminders</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier('Business');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedTier === 'Business'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedTier === 'Business' ? 'Selected Package' : 'Select Business'}
                </button>
              </div>
            </div>

            {/* 3. ENTERPRISE PLAN (CHAINS & DEPOTS) */}
            <div
              onClick={() => setSelectedTier('Enterprise')}
              className={`relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                selectedTier === 'Enterprise'
                  ? 'bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-md">
                Unlimited Chain
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Chain & Wholesale
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    selectedTier === 'Enterprise' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-600'
                  }`}>
                    {selectedTier === 'Enterprise' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-lg font-black text-white">DMi Enterprise</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                  Full-scale ERP and multi-outlet supply chain for retail chains and distribution depots.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">KES 10,000</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Physical Outlets:</span>
                    <strong className="text-indigo-400 font-bold">Unlimited Outlets</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Connected Terminals:</span>
                    <strong className="text-white">Unlimited Fleet</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Staff Accounts:</span>
                    <strong className="text-white">Unlimited Users</strong>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Everything in Business package</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Unlimited branches & warehouses</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Cross-county stock allocation matrix</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Dedicated 24/7 technical manager</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier('Enterprise');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedTier === 'Enterprise'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedTier === 'Enterprise' ? 'Selected Package' : 'Select Enterprise'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Current Selection: <strong className="text-white font-bold">{selectedTier} Package</strong>{' '}
              {selectedTier === 'Starter'
                ? '(1 Shop • Multi Branch, IBT & Dispatch disabled)'
                : '(Multi Branch v2, IBT & Dispatch enabled)'}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isMandatory && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmPackage}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Confirm & Access App with {selectedTier}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
