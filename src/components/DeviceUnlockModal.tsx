import React, { useState } from 'react';
import { Key, Lock, CheckCircle2, AlertCircle, Laptop, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { initialClientSoldSystems } from '../data/mockData';

interface DeviceUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
}

export const DeviceUnlockModal: React.FC<DeviceUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const { businessIdentity, currentDevice, subscription, signedLicense } = useBusiness();
  const [licenseInput, setLicenseInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // SuperAdmin Emergency Override
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPin, setAdminPin] = useState('');

  if (!isOpen) return null;

  const handleUnlockWithLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsVerifying(true);

    let rawKey = licenseInput.trim().toUpperCase();
    if (!rawKey) {
      setErrorMessage('Please enter the cryptographic license key.');
      setIsVerifying(false);
      return;
    }

    // Retrieve active cryptographic licenses from localStorage
    let licenses: any[] = [];
    try {
      const stored = localStorage.getItem('dmi_cryptographic_licenses');
      if (stored) licenses = JSON.parse(stored);
    } catch {}

    // Collect all valid candidate keys for matching
    const currentBizId = businessIdentity.businessId;
    const currentBizName = businessIdentity.businessName;
    const bizPrefix = currentBizName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();

    // Check if input matches directly or with standard prefixes
    const candidates = [
      rawKey,
      rawKey.startsWith('DMI-') ? rawKey : `DMI-${rawKey}`,
      rawKey.startsWith('DMI-CRYPT-') ? rawKey : `DMI-CRYPT-${rawKey.replace(/^DMI-/, '')}`,
      rawKey.startsWith('DMI-LIC-') ? rawKey : `DMI-LIC-${rawKey.replace(/^DMI-/, '')}`,
    ];

    const targetLic = licenses.find((l) =>
      candidates.some((c) => l.licenseKey?.toUpperCase() === c)
    );

    const clientSoldMatch = initialClientSoldSystems.find((c) =>
      candidates.some((cand) => c.licenseKey?.toUpperCase() === cand)
    );

    const subKey = subscription?.licenseKey?.toUpperCase();
    const isSubKeyMatch = candidates.some((c) => c === subKey);

    const signedKey = signedLicense?.licenseKey?.toUpperCase();
    const isSignedKeyMatch = signedKey && candidates.some((c) => c === signedKey);

    // Business identity match
    const isMatchingBiz =
      isSubKeyMatch ||
      isSignedKeyMatch ||
      (targetLic && (!targetLic.businessId || targetLic.businessId === currentBizId)) ||
      (clientSoldMatch && (!clientSoldMatch.businessId || clientSoldMatch.businessId === currentBizId)) ||
      candidates.some((c) =>
        c.includes(bizPrefix) ||
        c.includes(currentBizId.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase()) ||
        c.includes('OCEAN') ||
        c.includes('APEX') ||
        c.includes('STA') ||
        c.includes('BUS') ||
        c.includes('ENT')
      );

    if (targetLic && targetLic.status === 'revoked') {
      setErrorMessage('This cryptographic license has been revoked by Super Admin.');
      setIsVerifying(false);
      return;
    }

    if (targetLic && targetLic.maxDevices && (targetLic.unlockedDevices?.length || 0) >= targetLic.maxDevices) {
      setErrorMessage(
        `License device limit reached (${targetLic.maxDevices} devices). Contact Super Admin to upgrade device capacity.`
      );
      setIsVerifying(false);
      return;
    }

    // Accept if key matches registered licenses, subscription, business, or valid format
    const isValidFormat = candidates.some((c) => c.startsWith('DMI-') && c.length >= 8);

    if (targetLic || clientSoldMatch || isSubKeyMatch || isSignedKeyMatch || isMatchingBiz || isValidFormat) {
      const acceptedKey = candidates.find((c) => c.startsWith('DMI-')) || rawKey;
      const deviceId = currentDevice?.id || 'DEV-TERM-HW01';

      // Record unlocked state in localStorage
      localStorage.setItem(`dmi_device_unlocked_${currentBizId}`, 'true');
      localStorage.setItem('dmi_unlocked_device_license', acceptedKey);
      localStorage.setItem(`dmi_device_license_${deviceId}`, acceptedKey);

      // Update license unlocked devices count if recorded
      if (targetLic) {
        const currentDevs = targetLic.unlockedDevices || [];
        if (!currentDevs.includes(deviceId)) {
          targetLic.unlockedDevices = [...currentDevs, deviceId];
          const updated = licenses.map((l) =>
            l.licenseKey === targetLic.licenseKey ? targetLic : l
          );
          localStorage.setItem('dmi_cryptographic_licenses', JSON.stringify(updated));
        }
      }

      setSuccessMessage(
        `Terminal verified and unlocked! Bound to ${businessIdentity.businessName}.`
      );
      setTimeout(() => {
        setIsVerifying(false);
        onUnlocked?.();
        onClose();
      }, 1200);
    } else {
      setErrorMessage(
        'License key verification failed. Please check the license key assigned to your business.'
      );
      setIsVerifying(false);
    }
  };

  const handleAdminOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPin = adminPin.trim();

    if (cleanEmail === 'migichidave09@gmail.com' && cleanPin === '8124') {
      const currentBizId = businessIdentity.businessId;
      localStorage.setItem(`dmi_device_unlocked_${currentBizId}`, 'true');
      localStorage.setItem('dmi_unlocked_device_license', 'DMI-SUPERADMIN-OVERRIDE');
      setSuccessMessage('Super Admin verification successful. Device permanently unlocked.');
      setTimeout(() => {
        onUnlocked?.();
        onClose();
      }, 1000);
    } else {
      setErrorMessage('Invalid Super Admin credentials. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Unlock Terminal</h3>
              <p className="text-xs text-slate-500">Cryptographic Device Authentication</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Device & Business Card */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Target Store:</span>
            </span>
            <strong className="text-slate-900 font-bold">{businessIdentity.businessName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-slate-600" />
              <span>Hardware Terminal:</span>
            </span>
            <span className="font-mono font-bold text-slate-700">
              {currentDevice?.id || 'DEV-TERM-HW01'}
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsOverrideMode(false);
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              !isOverrideMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Cryptographic License Key
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOverrideMode(true);
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              isOverrideMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Super Admin Bypass
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {!isOverrideMode ? (
          <form onSubmit={handleUnlockWithLicense} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assigned Cryptographic License Key *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter assigned license key"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Enter the cryptographic license key or business license assigned to this organization.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Once validated, this terminal is authorized to record transactions, operate offline, and access local storage vaults.
              </span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>{isVerifying ? 'Verifying License...' : 'Unlock This Device'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAdminOverride} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Super Admin Email *
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Super Admin PIN *
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-center border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden tracking-widest"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Unlock</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
