import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  Lock,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  ArrowRight,
  Sparkles,
  Users,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { supabaseAuth, SupabaseStaffUser, SupabaseSession } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({ isOpen, onClose }) => {
  const { employees, setCurrentEmployee } = useBusiness();
  const [authMode, setAuthMode] = useState<'phone_otp' | 'email_password' | 'pin_quick'>('phone_otp');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('0712 345 678');
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Email state
  const [email, setEmail] = useState('owner@dmi-hardware.co.ke');
  const [password, setPassword] = useState('password123');

  // PIN quick switch state
  const [cashierPin, setCashierPin] = useState('');

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeSession, setActiveSession] = useState<SupabaseSession | null>(supabaseAuth.getSession());
  const [activeStaff, setActiveStaff] = useState<SupabaseStaffUser | null>(supabaseAuth.getActiveStaff());

  useEffect(() => {
    const unsub = supabaseAuth.onAuthStateChange((s, st) => {
      setActiveSession(s);
      setActiveStaff(st);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setLoading(true);
    setMessage(null);
    const res = await supabaseAuth.sendPhoneOtp(phoneNumber);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
      setCountdown(45);
      setMessage({ type: 'success', text: res.message });
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage(null);
    const res = await supabaseAuth.verifyPhoneOtp(phoneNumber, otpToken);
    setLoading(false);
    if (res.success && res.staff) {
      setMessage({ type: 'success', text: res.message });
      // Sync with BusinessContext currentEmployee
      const foundEmp = employees.find((e) => e.role === res.staff?.role) || employees[0];
      if (foundEmp) setCurrentEmployee(foundEmp);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleEmailSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const res = await supabaseAuth.signInWithPassword(email, password);
    setLoading(false);
    if (res.success && res.staff) {
      setMessage({ type: 'success', text: res.message });
      const foundEmp = employees.find((e) => e.role === res.staff?.role) || employees[0];
      if (foundEmp) setCurrentEmployee(foundEmp);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handlePinQuickSwitch = () => {
    if (cashierPin.length !== 4) {
      setMessage({ type: 'error', text: 'Please enter a 4-digit PIN' });
      return;
    }
    const res = supabaseAuth.switchCashierByPin(
      cashierPin,
      employees.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        pin: e.pin,
        branchId: e.branchId,
      }))
    );
    if (res.success && res.staff) {
      const foundEmp = employees.find((e) => e.id === res.staff?.id);
      if (foundEmp) setCurrentEmployee(foundEmp);
      setMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setMessage({ type: 'error', text: res.message });
      setCashierPin('');
    }
  };

  const handleSignOut = () => {
    supabaseAuth.signOut();
    setMessage({ type: 'success', text: 'Signed out from Supabase cloud session.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Supabase Multi-Role Auth</h3>
              <p className="text-[11px] text-emerald-100 font-mono">
                Phone OTP • PIN Shift-Switch • RLS Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Session Status Bar */}
        {activeStaff ? (
          <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">
                Session Active: <strong>{activeStaff.full_name}</strong> (
                <span className="uppercase font-mono font-bold text-[10px]">{activeStaff.role}</span>)
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline shrink-0 cursor-pointer ml-2"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>No active Supabase session. Primary login required.</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setAuthMode('phone_otp');
              setMessage(null);
            }}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition ${
              authMode === 'phone_otp'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Phone OTP</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('email_password');
              setMessage(null);
            }}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition ${
              authMode === 'email_password'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Fallback</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('pin_quick');
              setMessage(null);
            }}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition ${
              authMode === 'pin_quick'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Quick PIN</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: PHONE OTP */}
          {authMode === 'phone_otp' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Safaricom Mobile Number (Kenya)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Primary login method. Uses Supabase Auth SMS provider for OTP verification.
                </p>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !phoneNumber}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                  <span>Send 6-Digit SMS OTP</span>
                </button>
              ) : (
                <div className="space-y-3 pt-1 border-t border-slate-100 animate-in fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Enter 6-Digit SMS Code</label>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Test PIN: 123456
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="• • • • • •"
                      className="w-full py-2.5 text-center tracking-widest text-lg font-mono font-black bg-white border border-emerald-300 rounded-xl text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpToken.length < 6}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Verify & Authenticate Session</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <button
                      type="button"
                      disabled={countdown > 0}
                      onClick={handleSendOtp}
                      className="text-emerald-700 hover:underline disabled:opacity-40 font-semibold"
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend SMS code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-500 hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL / PASSWORD */}
          {authMode === 'email_password' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Staff Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@dmi-hardware.co.ke"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used as a fallback if mobile SMS delivery is delayed.
                </p>
              </div>

              <button
                type="button"
                onClick={handleEmailSignIn}
                disabled={loading || !email || !password}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Sign In via Email Fallback</span>
              </button>
            </div>
          )}

          {/* TAB 3: PIN QUICK-LOGIN / SHIFT-SWITCH */}
          {authMode === 'pin_quick' && (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sub-Second Cashier Shift Switch</span>
                </span>
                <p className="text-[11px] text-indigo-800">
                  Shared counter terminals layer quick 4-digit PIN authentication on top of the established Supabase session. No SMS costs incurred!
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cashier 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cashierPin}
                  onChange={(e) => setCashierPin(e.target.value)}
                  placeholder="• • • •"
                  className="w-full py-2.5 text-center tracking-widest text-xl font-mono font-black bg-white border border-indigo-300 rounded-xl text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Owner PIN: <strong>1234</strong></span>
                  <span>Manager PIN: <strong>4321</strong></span>
                  <span>Cashier PIN: <strong>5555</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePinQuickSwitch}
                disabled={cashierPin.length !== 4}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Switch Shift Cashier Instantly</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
