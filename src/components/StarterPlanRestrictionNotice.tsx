import React from 'react';
import { Building2, ShieldAlert, ArrowRight, Store, ArrowRightLeft, Send, Sparkles } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface StarterPlanRestrictionNoticeProps {
  featureName: 'Multi Branch v2' | 'IBT (Inter-Branch Transfers)' | 'Dispatch Manager' | string;
  onOpenUpgrade?: () => void;
}

export const StarterPlanRestrictionNotice: React.FC<StarterPlanRestrictionNoticeProps> = ({
  featureName,
  onOpenUpgrade,
}) => {
  const { setActiveTab, updateSubscriptionTier } = useBusiness();

  const handleUpgradeToBusiness = () => {
    updateSubscriptionTier('Business');
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
        {featureName.includes('IBT') ? (
          <ArrowRightLeft className="w-8 h-8" />
        ) : featureName.includes('Dispatch') ? (
          <Send className="w-8 h-8" />
        ) : (
          <Building2 className="w-8 h-8" />
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-3">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Multi-Shop Package Feature</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
        {featureName} is Restricted on Starter Package
      </h2>

      <p className="mt-3 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
        Most of our retail clients operate <strong>just one single shop</strong> and utilize the <strong>DMi Starter Package</strong>.
        Multi-Branch hubs, Inter-Branch Transfers (IBT), and Central Dispatch are multi-store logistics modules reserved for the <strong>Business</strong> and <strong>Enterprise</strong> tiers.
      </p>

      {/* Feature comparison mini card */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-white rounded-lg border border-slate-200">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Your Current Plan: Starter</span>
          </div>
          <div className="text-slate-500 space-y-1">
            <div>• 1 Single Outlet (HQ)</div>
            <div>• 2 POS Device Terminals</div>
            <div className="text-rose-500 font-medium">❌ Multi-Branch / IBT / Dispatch disabled</div>
          </div>
        </div>

        <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
          <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>DMi Business Plan (KES 2,000/mo)</span>
          </div>
          <div className="text-blue-700 space-y-1">
            <div>• Up to 3 Branches</div>
            <div>• Full Multi Branch v2 & IBT transfers</div>
            <div>• Central Dispatch logistics hub</div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setActiveTab('pos')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Store className="w-4 h-4 text-slate-600" />
          <span>Return to Sales POS</span>
        </button>

        <button
          onClick={onOpenUpgrade || handleUpgradeToBusiness}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Upgrade to Business Package (KES 2,000/mo)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
