import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { ShieldAlert, Clock, LogOut, Building2, Eye, ChevronDown } from 'lucide-react';
import { tenantRegistry } from '../data/tenantData';

export const AuditedSupportBanner: React.FC = () => {
  const {
    activeSupportSession,
    businessIdentity,
    endAuditedSupportSession,
    switchBusinessTenant,
  } = useBusiness();

  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: 0, seconds: 0 });
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!activeSupportSession?.expiresAt) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const expires = new Date(activeSupportSession.expiresAt).getTime();
      const diff = Math.max(0, expires - now);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft({ minutes, seconds });

      if (diff <= 0) {
        // Auto-end session when expired
        endAuditedSupportSession(activeSupportSession.id);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeSupportSession, endAuditedSupportSession]);

  if (!activeSupportSession) return null;

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await endAuditedSupportSession(activeSupportSession.id);
    } finally {
      setIsEnding(false);
    }
  };

  const registeredTenantKeys = Object.keys(tenantRegistry);

  return (
    <div
      id="audited-support-session-banner"
      className="bg-slate-900 border-b-2 border-amber-500 text-slate-100 px-4 py-2.5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg z-50 shrink-0"
    >
      {/* Left: Identification & Reason */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono">
              Live Audited Support Session
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>{businessIdentity?.name || 'DMi Business Store'}</span>
              <span className="text-xs font-mono text-slate-400">({businessIdentity?.businessId || 'BIZ-MAIN'})</span>
            </span>
            <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>VIEW ONLY (Active Tenant-Isolated)</span>
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
            <span>
              Authorized by <strong className="text-white">{activeSupportSession.adminName}</strong>
            </span>
            <span>•</span>
            <span>
              Reason: &ldquo;<span className="text-amber-200">{activeSupportSession.reason}</span>&rdquo;
            </span>
            {activeSupportSession.dataAccessed && activeSupportSession.dataAccessed.length > 0 && (
              <>
                <span>•</span>
                <span className="text-slate-400 text-[11px]">
                  Scopes: {activeSupportSession.dataAccessed.join(', ')}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right: Timer, Tenant Quick-Switcher & Exit Action */}
      <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
        {/* Live Expiration Countdown */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} remaining
          </span>
        </div>

        {/* Tenant Quick Switcher if Super Admin wants to inspect other businesses */}
        <div className="relative inline-flex items-center">
          <select
            value={businessIdentity?.businessId || ''}
            onChange={(e) => switchBusinessTenant(e.target.value)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded-lg px-2.5 py-1.5 appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            title="Switch inspected business tenant"
          >
            {registeredTenantKeys.map((bId) => {
              const bName = tenantRegistry[bId]?.businessIdentity?.name || tenantRegistry[bId]?.storeProfile?.name || bId;
              return (
                <option key={bId} value={bId}>
                  🏢 {bName} ({bId})
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* End Support Session Action */}
        <button
          id="btn-end-support-session"
          type="button"
          disabled={isEnding}
          onClick={handleEndSession}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isEnding ? 'Closing Session...' : 'End Support & Return to Super Admin'}</span>
        </button>
      </div>
    </div>
  );
};
