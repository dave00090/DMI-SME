import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Layers,
  MapPin,
  Phone,
  Mail,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { INDUSTRY_TYPES, getIndustryDefinition } from '../../data/industryCategories';

interface GroundZeroSetupProps {
  onCancel?: () => void;
  canCancel?: boolean;
  onOpenResetModal?: () => void;
}

export const GroundZeroSetup: React.FC<GroundZeroSetupProps> = ({
  onCancel,
  canCancel = false,
  onOpenResetModal,
}) => {
  const { registerInitialBusiness } = useBusiness();

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Hardware & Building Supplies');
  const [branchName, setBranchName] = useState('Main Branch HQ');
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [taxPin, setTaxPin] = useState('');

  const [ownerName, setOwnerName] = useState('David Migichi');
  const [ownerPhone, setOwnerPhone] = useState('0712345678');
  const [ownerEmail, setOwnerEmail] = useState('migichidave09@gmail.com');
  const [username, setUsername] = useState('david');
  const [password, setPassword] = useState('admin123');
  const [pin, setPin] = useState('1234');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!businessName.trim()) {
      setError('Please provide a Business Name.');
      return;
    }
    if (!ownerName.trim()) {
      setError('Please provide the Owner / Administrator full name.');
      return;
    }
    if (!ownerPhone.trim()) {
      setError('Please enter an M-Pesa / Safaricom phone number.');
      return;
    }
    if (!username.trim()) {
      setError('Please choose an administrative username.');
      return;
    }
    if (!password.trim()) {
      setError('Please provide a password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerInitialBusiness({
        businessName,
        category,
        branchName,
        location,
        taxPin,
        ownerName,
        ownerPhone,
        ownerEmail,
        username,
        password,
        pin,
      });

      if (res && res.success) {
        setSuccess(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden text-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Ground Zero Setup
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Clean Slate
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Register your primary business & owner credentials to initialize the system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenResetModal && (
              <button
                type="button"
                onClick={onOpenResetModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
                title="Open Reset System Options"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Reset Options</span>
              </button>
            )}

            {canCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Section 1: Business Identity */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Layers className="w-3.5 h-3.5" />
            <span>1. Enterprise Business Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business / Enterprise Trading Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Migichi Hardware & General Supplies"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Business Industry & Store Specialization <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-blue-400 font-mono">
                  {INDUSTRY_TYPES.length} Specialized Industries
                </span>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                {INDUSTRY_TYPES.map((ind) => (
                  <option key={ind.id} value={ind?.name || ''}>
                    {ind?.name || 'General Retail'} ({ind?.shortLabel || ''})
                  </option>
                ))}
              </select>

              {/* Live Contextual Category Preview */}
              {(() => {
                const selectedDef = getIndustryDefinition(category);
                return (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      <span>Auto-Configured Inventory Categories for <strong>{selectedDef.shortLabel}</strong>:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDef.categories.map((catName) => (
                        <span
                          key={catName}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        >
                          {catName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Branch HQ Name
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Main Branch HQ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location / Town
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nairobi, Kenya"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                KRA eTIMS Tax PIN (Optional)
              </label>
              <input
                type="text"
                value={taxPin}
                onChange={(e) => setTaxPin(e.target.value)}
                placeholder="e.g. P051234567X"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Owner & Master Administrator */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <UserCheck className="w-3.5 h-3.5" />
            <span>2. Owner & Primary Administrator Account</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Owner Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. David Migichi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Safaricom / M-Pesa Phone <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Owner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="e.g. migichidave09@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Login Username <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. david"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Login Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4-Digit Quick PIN <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons & Actions */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Registering Business...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Initialize Business & Launch POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
