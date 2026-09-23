import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Building2,
  Trash2,
  CheckCircle2,
  X,
  ShieldAlert,
  Database,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess?: () => void;
}

export const ResetSystemModal: React.FC<ResetSystemModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
}) => {
  const { resetToGroundZero, employees, businessIdentity } = useBusiness();
  const [confirmMode, setConfirmMode] = useState<'none' | 'ground_zero'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteGroundZero = async () => {
    setIsProcessing(true);
    setStatusMessage('Executing Factory Reset: Deleting all businesses, products, staff, and database records...');
    try {
      await resetToGroundZero();
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      setStatusMessage('Factory Reset Complete! All system data wiped. Rebooting clean terminal...');
      setTimeout(() => {
        setIsProcessing(false);
        setConfirmMode('none');
        onClose();
        if (onResetSuccess) onResetSuccess();
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setStatusMessage('An error occurred during factory reset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Reset System Data</h2>
              <p className="text-xs text-slate-500">
                Wipe all records and return this device to a pristine Ground Zero clean slate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Current State Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Current Business: </span>
              <span>{businessIdentity?.name || 'None (Ground Zero)'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Staff Count: </span>
              <span className="font-mono font-bold text-slate-800">{employees?.length || 0}</span>
            </div>
          </div>

          {confirmMode === 'none' && (
            <div className="space-y-3">
              {/* Option 1: Ground Zero Clean Slate */}
              <div className="p-4 rounded-xl border-2 border-rose-100 hover:border-rose-300 bg-rose-50/30 transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Factory Reset System (Delete Everything)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Complete Factory Wipe
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Resets and permanently deletes everything in the system like a hardware factory reset button.
                        Removes all registered businesses, branches, staff credentials, inventory records, sales, licenses, and cached local storage so the system can be configured fresh.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-rose-100/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmMode('ground_zero')}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Execute Factory Reset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Ground Zero Dialog */}
          {confirmMode === 'ground_zero' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-start gap-2.5 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                    Confirm Factory Reset (Delete Everything)
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    Are you sure you want to perform a factory reset? All registered businesses, staff accounts, licenses, products, and sales transactions will be permanently deleted and the device will restart from a clean factory slate.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200">
                <button
                  type="button"
                  onClick={() => setConfirmMode('none')}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteGroundZero}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isProcessing ? 'Factory Resetting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>DMi POS • Ground Zero & Tenant Control</span>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
