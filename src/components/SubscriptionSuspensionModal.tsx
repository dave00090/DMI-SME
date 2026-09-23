import React from 'react';
import { ShieldCheck, AlertTriangle, CreditCard, ExternalLink, Smartphone, Download, LogOut, RefreshCw } from 'lucide-react';
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
  const { businessIdentity, currentEmployee, logoutEmployee } = useBusiness();
  const isOwner = currentEmployee.role === 'owner';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Top Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Subscription Suspended</span>
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            DMi Business Service Temporarily Paused
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Account: <strong>{businessIdentity.name}</strong> ({businessIdentity.businessId})
          </p>
        </div>

        {/* Core Data Safety Promise */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your Business Data Is 100% Preserved</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Subscription status controls active terminal access; it <strong>never deletes customer data</strong>.
            Your shop's inventory, debt records (madeni), past receipts, and branch configurations are safely preserved in the cloud ledger.
          </p>
        </div>

        {/* Message for Owner vs Staff */}
        <div className="mt-4 text-xs text-slate-600 text-center leading-relaxed">
          {isOwner ? (
            <p>
              Your subscription grace period has elapsed. New POS sales entry and cloud inventory sync are paused until renewal. You can renew immediately via Safaricom M-Pesa to restore instant multi-device operations.
            </p>
          ) : (
            <p>
              Terminal access for cashier accounts is paused because the business subscription requires renewal. Please inform the store owner (<strong>{businessIdentity.ownerName}</strong> at <strong>{businessIdentity.ownerPhone}</strong>) to renew via M-Pesa.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenBilling();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Renew Subscription via M-Pesa STK Push</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenBilling();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span>View Invoices & Billing History</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-medium transition cursor-pointer"
                >
                  Dismiss notice (Read-Only Mode)
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={logoutEmployee}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Cashier Session</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
