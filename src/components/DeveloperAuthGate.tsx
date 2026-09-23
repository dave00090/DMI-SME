import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'password' | 'totp' | 'enroll';

export const DeveloperAuthGate: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in with MFA, pass straight through
  useEffect(() => {
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.currentLevel === 'aal2') onSuccess();
    });
  }, [onSuccess]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);

    // Check MFA factors
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === 'verified');
    if (verified) {
      setFactorId(verified.id);
      setStep('totp');
    } else {
      // First time: enroll in TOTP
      setLoading(true);
      const { data: enroll, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'DMi Control Center',
        friendlyName: email,
      });
      setLoading(false);
      if (enrollErr || !enroll) return setErr(enrollErr?.message ?? 'MFA setup failed');
      setFactorId(enroll.id);
      setQrUri(enroll.totp.qr_code);
      setTotpSecret(enroll.totp.secret);
      setStep('enroll');
    }
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setErr(null);
    setLoading(true);

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setLoading(false);
      return setErr(cErr?.message ?? 'Challenge failed');
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: totpCode.trim(),
    });
    setLoading(false);
    if (vErr) return setErr(vErr.message);

    // Re-check AAL2 and check platform_admin table
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== 'aal2') {
      return setErr('MFA verification incomplete; session is not AAL2.');
    }
    const { data: isAdmin, error: aErr } = await supabase.rpc('is_platform_admin');
    if (aErr || !isAdmin) {
      await supabase.auth.signOut();
      return setErr('Account is MFA-verified but not in platform_admins.');
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold">Platform Admin Gateway</h2>
            <p className="text-xs text-slate-400">Hardware MFA required (AAL2 enforcement)</p>
          </div>
        </div>

        {err && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handlePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@dmisystems.co.ke"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-rose-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 'enroll' && (
          <form onSubmit={handleVerifyTotp} className="space-y-4 text-xs">
            <p className="text-slate-300">
              Scan this QR code in Google Authenticator or 1Password, then enter the 6-digit code.
            </p>
            {qrUri ? (
              <div className="flex justify-center p-3 bg-white rounded-lg">
                <img src={qrUri} alt="TOTP QR" className="w-44 h-44" />
              </div>
            ) : totpSecret ? (
              <p className="font-mono text-center p-2 bg-slate-800 rounded">{totpSecret}</p>
            ) : null}
            <input
              type="text"
              required
              autoFocus
              pattern="[0-9]{6}"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="000000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center tracking-widest font-mono text-lg font-bold focus:border-rose-500 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Activate MFA
              </button>
            </div>
          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleVerifyTotp} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Authenticator 6-digit Code
              </label>
              <input
                type="text"
                required
                autoFocus
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center tracking-widest font-mono text-lg font-bold focus:border-rose-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Verify & Enter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
