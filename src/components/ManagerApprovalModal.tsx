import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface ManagerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  thresholdNotice?: string;
  onApproved: (approverName: string, approverRole: string, reason?: string) => void;
}

export const ManagerApprovalModal: React.FC<ManagerApprovalModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  thresholdNotice,
  onApproved,
}) => {
  const { verifyManagerPin, employees } = useBusiness();
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [successManager, setSuccessManager] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleVerify = () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit manager PIN.');
      return;
    }

    const result = verifyManagerPin(pin);
    if (result.verified && result.managerName) {
      setSuccessManager(result.managerName);
      setError('');
      setTimeout(() => {
        onApproved(result.managerName!, result.role || 'manager', reason);
        setPin('');
        setReason('');
        setSuccessManager(null);
        onClose();
      }, 500);
    } else {
      setError('Invalid Manager or Owner PIN. Authorization denied.');
      setPin('');
    }
  };

  // Demo helpers for easy testing
  const managerList = employees.filter((e) => e.role === 'owner' || e.role === 'manager');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">{title}</h3>
              <p className="text-amber-100 text-xs font-medium">Supervisor Authorization Required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Action Details */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold text-amber-950 mb-0.5">{description}</p>
              {thresholdNotice && <p className="text-amber-800">{thresholdNotice}</p>}
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Justification <span className="text-slate-400 font-normal">(Optional for audit)</span>
            </label>
            <input
              type="text"
              value={reason || ''}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bulk purchase discount authorized by phone"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* PIN Input Display */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
              Enter Manager / Owner 4-Digit PIN
            </label>
            <div className="flex justify-center items-center gap-3 mb-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2 transition-all ${
                      filled
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {filled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 text-center animate-shake mt-1">{error}</p>
            )}

            {successManager && (
              <p className="text-xs font-semibold text-emerald-600 text-center flex items-center justify-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" /> Authorized by {successManager}
              </p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-12 text-lg font-semibold bg-slate-100 hover:bg-slate-200 active:bg-amber-100 active:text-amber-900 text-slate-800 rounded-xl transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 text-lg font-semibold bg-slate-100 hover:bg-slate-200 active:bg-amber-100 text-slate-800 rounded-xl"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
            >
              ⌫
            </button>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={pin.length !== 4}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Authorize
            </button>
          </div>

          {/* Demo helper buttons */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 text-center mb-1.5 font-medium">Quick Demo Test PINs:</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {managerList.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setPin(m.pin);
                    setError('');
                  }}
                  className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 rounded-md border border-slate-200 transition-colors"
                >
                  {m?.name || 'Manager'} ({(m?.role || 'manager').toUpperCase()} - {m?.pin || ''})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
