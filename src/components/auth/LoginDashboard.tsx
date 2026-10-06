import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Users,
  UserPlus,
  HelpCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  BadgeAlert,
  Clock,
  RotateCcw,
  Mail,
  Phone,
  Send,
  Store,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Employee, UserRole } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { StaffRegisterModal } from './StaffRegisterModal';
import { GroundZeroSetup } from './GroundZeroSetup';
import { ResetSystemModal } from '../ResetSystemModal';
import { PackageSelectionModal } from './PackageSelectionModal';

export const LoginDashboard: React.FC = () => {
  const {
    employees,
    currentEmployee,
    branches,
    activeBranch,
    loginWithCredentials,
    verifyTwoFactorCode,
    sendTwoFactorOtp,
    loginWithBiometrics,
    switchEmployeeByPin,
    storeProfile,
    businessIdentity,
    subscription,
    resetToSampleData,
    setActiveTab,
    setIsDevConsoleOpen,
  } = useBusiness();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [showGroundZeroRegister, setShowGroundZeroRegister] = useState(false);
  const hasBusinesses = employees.length > 0 && !!businessIdentity?.businessId;
  const isFirstTimePackageRequired = !subscription?.packageSelected && !localStorage.getItem('dmi_initial_package_selected');

  // 24/7 Live Clock
  const [liveClock, setLiveClock] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Route Scope: 'business' (/login) vs 'platform' (/admin/login)
  const [loginScope, setLoginScope] = useState<'business' | 'platform'>('business');

  // Auth Modes: ONLY 'credentials' | 'biometrics' (and 'superadmin' on platform route)
  const [authMode, setAuthMode] = useState<'credentials' | 'biometrics' | 'superadmin'>('credentials');
  const [superAdminEmail, setSuperAdminEmail] = useState('migichidave09@gmail.com');
  const [superAdminPin, setSuperAdminPin] = useState('8124');

  // Credentials form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state - Direct dispatch to Phone or Email
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorChannel, setTwoFactorChannel] = useState<'phone' | 'email'>('phone');
  const [twoFactorDestination, setTwoFactorDestination] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Biometrics scanning state
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  // General feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Handle Username & Password Login
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!identifier.trim()) {
      setError('Please enter your username, registered email, or Safaricom phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password or 4-digit PIN.');
      return;
    }

    setIsSubmitting(true);
    const result = loginWithCredentials(identifier, password);
    setIsSubmitting(false);

    if (result.success) {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPassOrPin = password.trim();
      if (cleanId === 'migichidave09@gmail.com' && cleanPassOrPin === '8124') {
        sessionStorage.setItem('dmi_superadmin_auth', 'true');
        setActiveTab('platform-admin');
      } else {
        sessionStorage.removeItem('dmi_superadmin_auth');
      }
      if (result.requires2FA && result.employeeId) {
        setRequires2FA(true);
        setPendingEmployeeId(result.employeeId);
        const emp = employees.find((e) => e.id === result.employeeId);
        const preferredChannel: 'phone' | 'email' = emp?.phone ? 'phone' : 'email';
        setTwoFactorChannel(preferredChannel);
        const otpRes = sendTwoFactorOtp(result.employeeId, preferredChannel);
        if (otpRes.success) {
          setTwoFactorDestination(otpRes.maskedDestination || '');
          setResendCountdown(45);
          setSuccess(otpRes.message);
        } else {
          setSuccess(result.message);
        }
      } else {
        setSuccess(result.message);
      }
    } else {
      setError(result.message);
    }
  };

  // Direct 2FA dispatch to Phone or Email
  const handleSend2FAChannel = (channel: 'phone' | 'email') => {
    if (!pendingEmployeeId) return;
    setError(null);
    setTwoFactorChannel(channel);
    const otpRes = sendTwoFactorOtp(pendingEmployeeId, channel);
    if (otpRes.success) {
      setTwoFactorDestination(otpRes.maskedDestination || '');
      setResendCountdown(45);
      setSuccess(otpRes.message);
    } else {
      setError(otpRes.message);
    }
  };

  // Handle Dedicated SuperAdmin Executive Login
  const handleSuperAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = superAdminEmail.trim().toLowerCase();
    const cleanPin = superAdminPin.trim();

    if (
      (cleanEmail === 'migichidave09@gmail.com' || cleanEmail === 'david.migichi' || cleanEmail === 'david migichi') &&
      (cleanPin === '8124' || cleanPin === '9999' || cleanPin === 'Mozambique09')
    ) {
      setIsSubmitting(true);
      const res = loginWithCredentials('migichidave09@gmail.com', cleanPin);
      setIsSubmitting(false);

      if (res.success) {
        sessionStorage.setItem('dmi_superadmin_auth', 'true');
        setActiveTab('platform-admin');
        setSuccess('SuperAdmin Access Granted: Welcome, David Migichi.');
      } else {
        setError(res.message);
      }
    } else {
      setError('Access denied. SuperAdmin email (migichidave09@gmail.com) and security PIN (8124) required.');
    }
  };

  // Handle 2FA Verification
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmployeeId) return;

    if (twoFactorCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    const result = verifyTwoFactorCode(pendingEmployeeId, twoFactorCode);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(result.message);
      setRequires2FA(false);
      setPendingEmployeeId(null);
      const cleanId = identifier.trim().toLowerCase();
      if (
        cleanId === 'migichidave09@gmail.com' ||
        cleanId === 'david.migichi' ||
        cleanId === 'david migichi'
      ) {
        setActiveTab('platform-admin');
      }
    } else {
      setError(result.message);
    }
  };

  // Handle Device Biometrics (Live WebAuthn Hardware Integration)
  const handleBiometricLogin = async () => {
    setError(null);
    setIsScanningBiometrics(true);
    setBiometricFeedback('Calling hardware sensor (Touch ID / Face ID / Windows Hello / Android Biometrics)...');

    try {
      const res = await loginWithBiometrics();
      if (res.success) {
        setBiometricFeedback(res.message);
        setSuccess(res.message);
      } else {
        setError(res.message);
        setBiometricFeedback(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Biometric authentication failed. Please enter your username and password.');
      setBiometricFeedback(null);
    } finally {
      setIsScanningBiometrics(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Ambience / Structural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Bar: Terminal Identity & System Status */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black tracking-tighter text-lg shadow-lg shadow-blue-500/20">
            DMi
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{storeProfile?.name || 'DMi Enterprise Hardware & Building Supplies'}</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                POS Terminal v2.4
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>{activeBranch?.name || 'Nairobi Main Branch'}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Offline SQLite & Daraja Live
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPackageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-white border border-emerald-500/30 transition cursor-pointer"
            title="Select Operating Package (Starter 1 Shop / Business / Enterprise)"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Package: {subscription?.tier || 'Starter'} ({subscription?.tier === 'Starter' ? '1 Shop' : 'Multi-Shop'})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white border border-rose-500/30 transition cursor-pointer"
            title="Reset System Data (Ground Zero / Clean Slate)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Data</span>
          </button>

          {hasBusinesses && (
            <button
              type="button"
              onClick={() => setShowGroundZeroRegister(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80 transition cursor-pointer shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>New Business</span>
            </button>
          )}

          {hasBusinesses && (
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80 transition cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Register Staff</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </button>
        </div>
      </header>

      {/* Main Login Dashboard Canvas */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
        {!hasBusinesses || showGroundZeroRegister ? (
          <GroundZeroSetup
            canCancel={hasBusinesses}
            onCancel={() => setShowGroundZeroRegister(false)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          />
        ) : (
          <div className="w-full max-w-xl bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">
          {/* Card Header & Navigation Tabs */}
          <div className="p-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Terminal Authentication</h2>
                <p className="text-xs text-slate-400">Select your preferred login method (User Credentials or Live Biometrics)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Choose Package & Pay via Till 5331774"
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subscription Packages</span>
              </button>
            </div>

            {/* Mode Tabs: STRICTLY User Credentials and Live Biometrics */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('credentials');
                  setError(null);
                  setSuccess(null);
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  authMode === 'credentials'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>User Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('biometrics');
                  setError(null);
                  setSuccess(null);
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  authMode === 'biometrics'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Fingerprint className="w-4 h-4 shrink-0" />
                <span>Biometric Auth</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: USERNAME & PASSWORD LOGIN */}
          {authMode === 'credentials' && (
            <div className="p-6">
              {!requires2FA ? (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Username, Corporate Email, or Safaricom Phone
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="abc@email.com, username"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        autoFocus
                      />
                      <div className="absolute right-3 top-3 text-slate-500">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Password or PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Forgot Password/PIN?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password or 4-digit PIN"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !identifier || !password}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* 2FA Challenge Screen: Direct Send to Phone Number or Email */
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="text-center py-1">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Two-Factor Authenticator Required</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      A 6-digit verification code has been dispatched directly to your {twoFactorChannel === 'phone' ? 'phone number' : 'email'}
                    </p>
                  </div>

                  {/* Channel Selector: Send to Phone (SMS) vs Send to Email */}
                  <div className="p-1 bg-slate-950/80 rounded-xl border border-slate-800 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleSend2FAChannel('phone')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        twoFactorChannel === 'phone'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Send to Phone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend2FAChannel('email')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        twoFactorChannel === 'email'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send to Email</span>
                    </button>
                  </div>

                  {/* Direct Dispatch Feedback Banner */}
                  <div className="p-3.5 bg-blue-950/70 border border-blue-800/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-blue-200">
                      <span className="flex items-center gap-1.5 font-medium">
                        {twoFactorChannel === 'phone' ? (
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>Dispatched to: <strong className="text-white font-mono">{twoFactorDestination || (twoFactorChannel === 'phone' ? '+254 712 *** 678' : 'user@domain.com')}</strong></span>
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-500/30 font-semibold">
                        DIRECT OTP
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 text-center">
                      Enter 6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.7em] font-mono text-xl py-3 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-blue-500 focus:outline-hidden text-white font-bold"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <button
                      type="button"
                      disabled={resendCountdown > 0}
                      onClick={() => handleSend2FAChannel(twoFactorChannel)}
                      className="text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:hover:text-blue-400 transition font-medium cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCountdown > 0 ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCountdown > 0
                          ? `Resend available in ${resendCountdown}s`
                          : `Resend code to ${twoFactorChannel === 'phone' ? 'phone' : 'email'}`}
                      </span>
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTwoFactorCode('');
                      }}
                      className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || twoFactorCode.length !== 6}
                      className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Access</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: DEVICE BIOMETRICS (TOUCH ID / FINGERPRINT) */}
          {authMode === 'biometrics' && (
            <div className="p-8 text-center space-y-5">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {/* Scanning radar pulses */}
                <div
                  className={`absolute inset-0 rounded-full border-2 border-blue-500/40 ${
                    isScanningBiometrics ? 'animate-ping' : ''
                  }`}
                />
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-linear-to-b from-blue-600/20 to-blue-900/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <Fingerprint className={`w-10 h-10 ${isScanningBiometrics ? 'animate-pulse text-blue-300' : ''}`} />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Device Biometric Authentication</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Unlock this terminal via Touch ID, Face ID, or your Android/Electron device fingerprint reader.
                </p>
              </div>

              {biometricFeedback && (
                <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-blue-300 animate-pulse">
                  {biometricFeedback}
                </div>
              )}

              <div className="pt-2 max-w-xs mx-auto space-y-2">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isScanningBiometrics}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{isScanningBiometrics ? 'Reading Fingerprint...' : 'Scan Device Biometrics'}</span>
                </button>

                <p className="text-[11px] text-slate-500">
                  Enrolled staff: {(employees || []).map((e) => `${e?.name || 'Staff'} (${e?.role || 'user'})`).join(', ') || 'None enrolled'}
                </p>
              </div>
            </div>
          )}

        </div>
        )}
      </main>

      {/* Footer: Legal & Security Details */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span>© 2026 DMi Enterprise Solutions</span>
          <span>•</span>
          <span>Safaricom M-Pesa Authorized Till 829104</span>
          <span>•</span>
          <span>KRA eTIMS Validated</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
            title="Reset system data or load demo template"
          >
            <RotateCcw className="w-3 h-3 text-rose-500" />
            <span>Reset Data</span>
          </button>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span>256-Bit Encrypted Offline-First Architecture</span>
          </span>
        </div>
      </footer>

      {/* Modals */}
      <ResetSystemModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={() => setIsForgotPasswordOpen(false)}
      />

      <StaffRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => setIsRegisterModalOpen(false)}
      />

      {/* Package Selection Modal - Triggered when user clicks the Subscription & Packages button */}
      <PackageSelectionModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        canDismiss={true}
      />
    </div>
  );
};
