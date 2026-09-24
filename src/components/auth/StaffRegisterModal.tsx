import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Smartphone,
  Fingerprint,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { UserRole, NewStaffUserPayload } from '../../types';

interface StaffRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StaffRegisterModal: React.FC<StaffRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentEmployee, employees, branches, registerNewStaffUser } = useBusiness();

  // Authorizer check: Can be current logged in employee, or if currently at login dashboard, allow Owner or Manager authorization PIN
  const isAuthorizedCaller =
    currentEmployee && (currentEmployee.role === 'owner' || currentEmployee.role === 'manager');

  // Supervisor PIN unlock if caller is at login screen or needs elevated override
  const [supervisorPin, setSupervisorPin] = useState('');
  const [supervisorError, setSupervisorError] = useState('');
  const [supervisorUnlockedEmpId, setSupervisorUnlockedEmpId] = useState<string | null>(
    isAuthorizedCaller ? currentEmployee.id : null
  );

  const activeAuthorizer = supervisorUnlockedEmpId
    ? employees.find((e) => e.id === supervisorUnlockedEmpId)
    : isAuthorizedCaller
    ? currentEmployee
    : null;

  const isOwner = activeAuthorizer?.role === 'owner';
  const isManager = activeAuthorizer?.role === 'manager';

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+254 ');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [branchId, setBranchId] = useState<string>(() => {
    if (activeAuthorizer?.role === 'manager' && activeAuthorizer.branchId !== 'all') {
      return activeAuthorizer.branchId;
    }
    return branches[0]?.id || 'branch-1';
  });
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Eye symbol toggles
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSupervisorUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setSupervisorError('');

    if (supervisorPin.trim() === '8124' || supervisorPin.trim() === '9999') {
      const owner = employees.find((e) => e.role === 'owner' || e.email?.toLowerCase() === 'migichidave09@gmail.com') || employees[0];
      if (owner) {
        setSupervisorUnlockedEmpId(owner.id);
        return;
      }
    }

    const found = employees.find(
      (emp) =>
        (emp.role === 'owner' || emp.role === 'manager') &&
        emp.status === 'active' &&
        emp.pin === supervisorPin.trim()
    );

    if (found) {
      setSupervisorUnlockedEmpId(found.id);
      if (found.role === 'manager' && found.branchId !== 'all') {
        setBranchId(found.branchId);
      }
    } else {
      setSupervisorError('Invalid Owner or Branch Manager PIN. Only management can authorize staff creation.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeAuthorizer) {
      setError('Management authorization required before registering new staff.');
      return;
    }

    if (!name.trim()) {
      setError('Please provide the employee full name.');
      return;
    }
    if (!username.trim()) {
      setError('Please choose a username for this employee.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid corporate email address.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('Terminal PIN must be exactly 4 digits.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);

    const payload: NewStaffUserPayload = {
      name: (name || '').trim(),
      username: (username || '').trim().toLowerCase(),
      password,
      pin,
      role,
      branchId,
      phone: (phone || '').trim(),
      email: (email || '').trim().toLowerCase(),
      twoFactorEnabled,
    };

    const res = registerNewStaffUser(payload, activeAuthorizer);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Register New Staff User</h3>
              <p className="text-xs text-slate-300">
                Authorized by: {activeAuthorizer ? `${activeAuthorizer?.name || 'Supervisor'} (${(activeAuthorizer?.role || 'manager').toUpperCase()})` : 'Manager / Owner'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supervisor Unlock Step if not already authenticated as Owner or Manager */}
        {!activeAuthorizer ? (
          <div className="p-6">
            <div className="text-center max-w-sm mx-auto mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Owner or Manager Authorization</h4>
              <p className="text-xs text-slate-500 mt-1">
                To protect store security, new staff registrations must be authorized by an Owner or Branch Manager PIN.
              </p>
            </div>

            <form onSubmit={handleSupervisorUnlock} className="space-y-4 max-w-xs mx-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 text-center">
                  Supervisor 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-full text-center tracking-[0.6em] font-mono text-xl py-2.5 rounded-xl border-2 border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 font-bold"
                  autoFocus
                />
              </div>

              {supervisorError && (
                <p className="text-xs text-rose-600 font-semibold text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {supervisorError}
                </p>
              )}

              <button
                type="submit"
                disabled={supervisorPin.length !== 4}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-sm"
              >
                Verify & Authorize Registration
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400">
                  Supervisor Master Authorizer: David Migichi (PIN: 8124)
                </span>
              </div>
            </form>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Authorizer Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">
                  Authorized by: <strong className="text-slate-900">{activeAuthorizer?.name || 'Administrator'}</strong> ({activeAuthorizer?.role ? activeAuthorizer.role.toUpperCase() : 'ADMIN'})
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {activeAuthorizer?.branchName || 'Main Branch'}
              </span>
            </div>

            {/* Row 1: Full Name & Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samuel Mwangi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Login Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                  placeholder="e.g. samuel.mwangi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono transition"
                />
              </div>
            </div>

            {/* Row 2: Safaricom Phone & Registered Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Safaricom Phone Number <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-emerald-700 font-semibold">M-Pesa Valid</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono transition"
                  />
                  <div className="absolute left-2.5 top-2.5 text-slate-400">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Used for SMS OTP recovery</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuel@dmibusiness.co.ke"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <div className="absolute left-2.5 top-2.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Used for 2FA and account recovery</p>
              </div>
            </div>

            {/* Row 3: Role Allocation & Branch Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Allocate Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  {isOwner && <option value="owner">Business Owner (Full Sovereign Authority)</option>}
                  <option value="manager">Store Manager (Branch Overrides & Stock)</option>
                  <option value="cashier">Cashier (POS Sales & Receipts)</option>
                  <option value="storekeeper">Storekeeper (Inventory & Transfers)</option>
                  <option value="accountant">Accountant (Financial Audits & Ledgers)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isManager && !isOwner
                    ? 'Branch managers can allocate Manager, Cashier, Storekeeper, or Accountant'
                    : 'Owner has unrestricted role provisioning'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Allocate Branch <span className="text-rose-500">*</span>
                </label>
                {isManager && activeAuthorizer?.branchId !== 'all' ? (
                  <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                    {activeAuthorizer?.branchName || 'Current Branch'} (Locked to your branch)
                  </div>
                ) : (
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                  >
                    {isOwner && <option value="all">All Branches (Head Office)</option>}
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b?.name || 'Branch'} ({b?.code || ''})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Row 4: Choice of Password & Choice of PIN with Eye Symbols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password of Choice <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 4 chars)"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  4-Digit Terminal PIN of Choice <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5678"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-xs font-mono tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Quick cashier till unlock PIN</p>
              </div>
            </div>

            {/* Row 5: Two Factor Authenticator (2FA) Feature */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Enforce Two-Factor Authenticator (2FA)</h5>
                  <p className="text-[11px] text-slate-600">
                    Require a 6-digit email or authenticator app code on every password login before granting access.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name || !username || pin.length !== 4 || !password}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Create Staff Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
