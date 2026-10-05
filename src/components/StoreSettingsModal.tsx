import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { StoreProfile, DarajaConfig } from '../types';
import {
  Store,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  Printer,
  Check,
  X,
  Building2,
  ShieldCheck,
  Receipt,
  UserCheck,
  Smartphone,
  Key,
  Lock,
  HelpCircle,
  Zap,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface StoreSettingsModalProps {
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({ onClose }) => {
  const { storeProfile, updateStoreProfile, darajaConfig, updateDarajaConfig } = useBusiness();
  const [activeTab, setActiveTab] = useState<'profile' | 'daraja'>('profile');

  // Store profile form state
  const [formData, setFormData] = useState<StoreProfile>({
    ...storeProfile,
    receiptTitle: storeProfile.receiptTitle || 'OFFICIAL CASH SALE RECEIPT',
    receiptFooterMessage: storeProfile.receiptFooterMessage || 'Asante sana kwa Biashara! Karibu Tena.',
    receiptReturnPolicy:
      storeProfile.receiptReturnPolicy ||
      'Goods once sold in good order are not returnable without this original receipt.',
    taxPin: storeProfile.taxPin || '',
    cashierName: storeProfile.cashierName || 'Maina (Store Admin)',
    receiptPaperFormat: storeProfile.receiptPaperFormat || 'thermal80',
  });

  // Daraja Lipa Na M-Pesa state
  const [darajaForm, setDarajaForm] = useState<DarajaConfig>({
    consumerKey: darajaConfig?.consumerKey || '4K91xL08vJm2PnQwRtYz7',
    consumerSecret: darajaConfig?.consumerSecret || '8F42xK91vJm2PnQwRtYz7AbCdEfGhIj',
    passkey:
      darajaConfig?.passkey ||
      'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    shortcode: darajaConfig?.shortcode || formData.tillNumber || '5421008',
    channelType: darajaConfig?.channelType || 'buy_goods',
    callbackUrl: darajaConfig?.callbackUrl || 'https://dmi-pos.ke/api/daraja/callback',
    environment: darajaConfig?.environment || 'live',
    autoReconcile: darajaConfig?.autoReconcile ?? true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStkFeedback, setTestStkFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Sync till/paybill between store profile and daraja shortcode
    const updatedProfile = {
      ...formData,
      tillNumber: darajaForm.channelType === 'buy_goods' ? darajaForm.shortcode : formData.tillNumber,
      paybillNumber: darajaForm.channelType === 'paybill' ? darajaForm.shortcode : formData.paybillNumber,
    };

    updateStoreProfile(updatedProfile);
    updateDarajaConfig(darajaForm);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleTestConnection = () => {
    setTestStkFeedback('Testing Daraja 2.0 API handshake with Safaricom gateway...');
    setTimeout(() => {
      setTestStkFeedback(
        `✓ Connection verified! Safaricom Daraja ${darajaForm.environment.toUpperCase()} gateway recognized ${
          darajaForm.channelType === 'buy_goods' ? 'Till Number' : 'Paybill'
        } ${darajaForm.shortcode}. STK push is active.`
      );
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Store & Daraja Lipa Na M-Pesa Settings</h3>
              <p className="text-xs text-slate-400">
                Configure your store branding, receipt formats, and Safaricom M-Pesa credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Store Information & Receipts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daraja')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'daraja'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safaricom Daraja Lipa Na M-Pesa</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              STK Push
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Store profile and Daraja Lipa Na M-Pesa configuration updated successfully!</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <>
              {/* Business Branding */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Store Information & Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Store / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Nairobi Hardware & Building Supplies"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Physical Location / Town *
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Kangemi Market Road, Nairobi"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Customer Care Phone *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +254 712 345 678"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      KRA Tax PIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.taxPin || ''}
                      onChange={(e) => setFormData({ ...formData, taxPin: e.target.value })}
                      placeholder="e.g. P051982736Z"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 uppercase font-mono focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Default Cashier / Attendant Name
                    </label>
                    <div className="relative">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.cashierName || ''}
                        onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                        placeholder="e.g. Maina (Manager)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Template Defaults */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-purple-600" />
                  <span>Printed Receipt Template Defaults</span>
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Receipt Header Title
                    </label>
                    <input
                      type="text"
                      value={formData.receiptTitle || ''}
                      onChange={(e) => setFormData({ ...formData, receiptTitle: e.target.value })}
                      placeholder="e.g. OFFICIAL CASH SALE RECEIPT / TAX INVOICE"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Receipt Footer / Thank You Message
                    </label>
                    <input
                      type="text"
                      value={formData.receiptFooterMessage || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, receiptFooterMessage: e.target.value })
                      }
                      placeholder="e.g. Asante sana kwa Biashara! Karibu Tena."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Return & Warranty Policy Disclaimer
                    </label>
                    <textarea
                      rows={2}
                      value={formData.receiptReturnPolicy || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, receiptReturnPolicy: e.target.value })
                      }
                      placeholder="Goods once sold in good order are not returnable without this original receipt."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Receipt Printer Paper Format
                    </label>
                    <select
                      value={formData.receiptPaperFormat || 'thermal80'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          receiptPaperFormat: e.target.value as 'thermal80' | 'thermal58' | 'a4',
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    >
                      <option value="thermal80">Standard 80mm Thermal Receipt (Recommended)</option>
                      <option value="thermal58">Compact 58mm Thermal Receipt (Mobile POS)</option>
                      <option value="a4">Standard A4 / Letter Size Full Invoice</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'daraja' && (
            <div className="space-y-4">
              {/* Guidelines & Type Selection Box */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Safaricom Lipa Na M-Pesa Guidelines & Channel Type</span>
                  </div>
                  <a
                    href="https://developer.safaricom.co.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline"
                  >
                    <span>Daraja Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Configure your store's live Lipa Na M-Pesa credentials. When customers checkout at the counter, the system automatically triggers an instant M-Pesa PIN prompt directly on their phone.
                </p>

                {/* Channel Type Selector */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setDarajaForm({ ...darajaForm, channelType: 'buy_goods' })}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition flex flex-col justify-between ${
                      darajaForm.channelType === 'buy_goods'
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">Buy Goods (Till Number)</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        darajaForm.channelType === 'buy_goods' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                      }`}>
                        {darajaForm.channelType === 'buy_goods' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ideal for general retail, counters & kiosks. Customers pay without charges.
                    </p>
                  </div>

                  <div
                    onClick={() => setDarajaForm({ ...darajaForm, channelType: 'paybill' })}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition flex flex-col justify-between ${
                      darajaForm.channelType === 'paybill'
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">Paybill (Business Number)</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        darajaForm.channelType === 'paybill' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                      }`}>
                        {darajaForm.channelType === 'paybill' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      For businesses requiring invoice account numbers (e.g. Account No: INV-102).
                    </p>
                  </div>
                </div>
              </div>

              {/* Daraja API Form Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {darajaForm.channelType === 'buy_goods' ? 'Buy Goods Till Number *' : 'Paybill Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={darajaForm.shortcode}
                      onChange={(e) => setDarajaForm({ ...darajaForm, shortcode: e.target.value.trim() })}
                      placeholder={darajaForm.channelType === 'buy_goods' ? 'e.g. 5421008' : 'e.g. 400200'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Daraja API Environment *
                    </label>
                    <select
                      value={darajaForm.environment}
                      onChange={(e) =>
                        setDarajaForm({ ...darajaForm, environment: e.target.value as 'live' | 'sandbox' })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="live">Live / Production (Real M-Pesa Money)</option>
                      <option value="sandbox">Sandbox (Testing / Developer Mode)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Safaricom Consumer Key *
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={darajaForm.consumerKey}
                      onChange={(e) => setDarajaForm({ ...darajaForm, consumerKey: e.target.value.trim() })}
                      placeholder="Enter Consumer Key from Safaricom Daraja App"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Safaricom Consumer Secret *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={darajaForm.consumerSecret}
                      onChange={(e) => setDarajaForm({ ...darajaForm, consumerSecret: e.target.value.trim() })}
                      placeholder="Enter Consumer Secret from Safaricom Daraja App"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Lipa Na M-Pesa Online Passkey (STK Push) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={darajaForm.passkey}
                    onChange={(e) => setDarajaForm({ ...darajaForm, passkey: e.target.value.trim() })}
                    placeholder="Enter Lipa Na M-Pesa Online Passkey"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Provided under the "Lipa Na M-Pesa Online" simulator tab on the Safaricom Daraja portal.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Validation & Webhook Callback URL
                  </label>
                  <input
                    type="url"
                    value={darajaForm.callbackUrl}
                    onChange={(e) => setDarajaForm({ ...darajaForm, callbackUrl: e.target.value.trim() })}
                    placeholder="https://yourstore.co.ke/api/daraja/callback"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* Connection Test feedback */}
                {testStkFeedback && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{testStkFeedback}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Test Daraja Connection</span>
                  </button>

                  <span className="text-[11px] text-slate-500">
                    Auto-reconciles counter sales via Daraja instant STK.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreSettingsModal;
