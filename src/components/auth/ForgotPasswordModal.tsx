import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const { sendPasswordRecoveryOtp, resetPasswordWithOtp } = useBusiness();

  // Recovery flow steps: 1 = Identifier, 2 = Choose Channel & Enter OTP, 3 = New Password & PIN, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'email' | 'phone'>('phone');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async (selectedChannel: 'email' | 'phone') => {
    if (!identifier.trim()) {
      setError('Please enter your username, email, or Safaricom phone number.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = sendPasswordRecoveryOtp(identifier, selectedChannel);
      if (res.success && res.employeeId) {
        setEmployeeId(res.employeeId);
        setMaskedDestination(res.maskedDestination || '');
        setMockOtp(res.mockOtp || '');
        setChannel(selectedChannel);
        setStep(2);
      } else {
        setError(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!enteredOtp.trim() || enteredOtp.trim().length !== 6) {
      setError('Please enter the full 6-digit recovery code.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleResetCredentials = () => {
    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = resetPasswordWithOtp(employeeId, enteredOtp, newPassword, newPin);
      if (res.success) {
        setStep(4);
      } else {
        setError(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setIdentifier('');
    setEnteredOtp('');
    setNewPassword('');
    setNewPin('');
    setError('');
    setMockOtp('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Staff Account Recovery</h3>
              <p className="text-xs text-slate-300">Recover your Password or terminal PIN</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 text-center py-2 px-4 text-xs font-semibold text-slate-500">
          <span className={step >= 1 ? 'text-blue-600 font-bold' : ''}>1. Locate Account</span>
          <span className={step >= 2 ? 'text-blue-600 font-bold' : ''}>2. 6-Digit OTP</span>
          <span className={step >= 3 ? 'text-blue-600 font-bold' : ''}>3. New Password & PIN</span>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Identifier & Choose Channel */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Username, Registered Email, or Safaricom Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. john.kamau, john.k@dmibusiness.co.ke, or 0723 333 444"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    autoFocus
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Recovery OTP can be delivered via registered Safaricom SMS or your corporate email.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Choose Recovery Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSendOtp('phone')}
                    disabled={isSubmitting}
                    className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1 text-emerald-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-bold">Safaricom Phone</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Instant SMS OTP to your registered M-Pesa / Safaricom SIM
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendOtp('email')}
                    disabled={isSubmitting}
                    className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1 text-blue-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-bold">Registered Email</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Two-factor recovery code sent to your email inbox
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  {channel === 'email' ? <Mail className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </div>
                <h4 className="text-sm font-bold text-slate-900">Enter 6-Digit Recovery Code</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dispatched via {channel === 'email' ? 'Email' : 'Safaricom SMS'} to{' '}
                  <span className="font-semibold text-slate-800">{maskedDestination}</span>
                </p>
              </div>

              {/* Demo test helper banner */}
              {mockOtp && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="text-amber-800">
                    <span className="font-bold">Simulated Safaricom/Email Gateway OTP: </span>
                    <span className="font-mono font-bold tracking-widest text-amber-900 text-sm">
                      {mockOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(mockOtp)}
                    className="text-[11px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-1 rounded-lg transition"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.7em] font-mono text-xl py-3 rounded-xl border-2 border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold transition"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={enteredOtp.length !== 6}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                >
                  Verify Code <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Set New Password & Allocate PIN */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Set New Password & Choose PIN</h4>
                <p className="text-xs text-slate-500">
                  Update your credentials. You will use these to log into the terminal.
                </p>
              </div>

              {/* Password field with Eye symbol */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 4 characters)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4-digit PIN field with Eye symbol */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Fast Terminal PIN (4 Digits)
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Allocate 4-digit PIN of your choice (e.g. 4321)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for quick cashier till unlocks and shift handovers.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetCredentials}
                  disabled={isSubmitting || !newPassword || newPin.length !== 4}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save New Password & PIN
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Reset Success */}
          {step === 4 && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Credentials Updated Successfully</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your password and 4-digit terminal PIN have been updated and secured with audit logging.
                You can now log in immediately.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    resetAll();
                    if (onSuccessLogin) onSuccessLogin();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                >
                  Return to Login Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
