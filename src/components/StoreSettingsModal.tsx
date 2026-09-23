import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { StoreProfile } from '../types';
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
} from 'lucide-react';

interface StoreSettingsModalProps {
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({ onClose }) => {
  const { storeProfile, updateStoreProfile } = useBusiness();
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

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Store & Receipt Settings</h3>
              <p className="text-xs text-slate-400">
                Configure your hardware store branding and printed receipt details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Settings and receipt branding updated successfully!</span>
            </div>
          )}

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
                  Physical Location / Address *
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
                  Phone Number (Customer Care) *
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

          {/* M-Pesa & Payment Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>M-Pesa & Payment Credentials</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Buy Goods Till No. *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tillNumber || ''}
                  onChange={(e) => setFormData({ ...formData, tillNumber: e.target.value })}
                  placeholder="e.g. 5421008"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-bold focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Paybill Number
                </label>
                <input
                  type="text"
                  value={formData.paybillNumber || ''}
                  onChange={(e) => setFormData({ ...formData, paybillNumber: e.target.value })}
                  placeholder="e.g. 400200"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. NH092"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
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
                  placeholder="e.g. Goods once sold in good order are not returnable without this original receipt."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Print Paper Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                      formData.receiptPaperFormat === 'thermal80'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paperFormat"
                      value="thermal80"
                      checked={formData.receiptPaperFormat === 'thermal80'}
                      onChange={() => setFormData({ ...formData, receiptPaperFormat: 'thermal80' })}
                      className="sr-only"
                    />
                    <Printer className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Thermal 80mm Roll</div>
                      <div className="text-[10px] text-slate-500 font-normal">Standard POS Slip</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                      formData.receiptPaperFormat === 'a4'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paperFormat"
                      value="a4"
                      checked={formData.receiptPaperFormat === 'a4'}
                      onChange={() => setFormData({ ...formData, receiptPaperFormat: 'a4' })}
                      className="sr-only"
                    />
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <div>A4 Full Page Invoice</div>
                      <div className="text-[10px] text-slate-500 font-normal">Desktop Office Printer</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreSettingsModal;
