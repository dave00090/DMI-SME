import React, { useEffect, useRef, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  Menu,
  Store,
  Edit3,
  ChevronDown,
  Users,
  LogOut,
  UserPlus,
  RotateCcw,
  RefreshCw,
  Key,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react';
import WhatsAppSummaryModal from './WhatsAppSummaryModal';
import StoreSettingsModal from './StoreSettingsModal';
import { UserSwitchModal } from './UserSwitchModal';
import { DMiBusinessAcademyModal } from './DMiBusinessAcademyModal';
import { GuidedSetupModal } from './GuidedSetupModal';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { SupabaseAuthModal } from './SupabaseAuthModal';
import { StaffRegisterModal } from './auth/StaffRegisterModal';
import { ResetSystemModal } from './ResetSystemModal';
import { DeviceUnlockModal } from './DeviceUnlockModal';
import { PackageSelectionModal } from './auth/PackageSelectionModal';

interface TopHeaderProps {
  onMenuClick: () => void;
}

// Shared look for the header's icon buttons
const iconBtn =
  'inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap cursor-pointer shrink-0';

const hideScrollbar = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const {
    storeProfile,
    branches,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    currentEmployee,
    logoutSession,
    subscription,
    activeSupportAccessForBusiness,
  } = useBusiness();

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'daraja'>('daraja');
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
  const [isRegisterStaffOpen, setIsRegisterStaffOpen] = useState(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  const [isGuidedSetupOpen, setIsGuidedSetupOpen] = useState(false);
  const [isSupabaseAuthOpen, setIsSupabaseAuthOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close the overflow menu on outside click / Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

  const isStarterPlan = (subscription?.tier || 'Starter').toLowerCase() === 'starter';

  const formattedDate = new Intl.DateTimeFormat('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const isOwner = currentEmployee?.role === 'owner';
  const isManager = currentEmployee?.role === 'manager';
  const isHeadManager = currentEmployee?.isHeadManager === true;
  const canSwitchBranches = isOwner || isHeadManager;
  const canRegisterStaff = isOwner || isManager;

  const roleClass =
    currentEmployee?.role === 'owner'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : currentEmployee?.role === 'manager'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  const openMpesaSettings = () => {
    setSettingsInitialTab('daraja');
    setIsSettingsOpen(true);
  };

  // Context chips (M-Pesa, branch, plan, till, support). Rendered inline on xl+
  // and as a horizontally-scrolling strip below the main bar on smaller screens.
  const contextChips = (
    <>
      {isOwner && (
        <button
          onClick={openMpesaSettings}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shrink-0 whitespace-nowrap"
          title="Configure Store Branding & Safaricom Daraja Lipa Na M-Pesa (Till / Paybill, Shortcode, Passkey, Keys)"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Store &amp; M-Pesa
        </button>
      )}

      {!isStarterPlan && canSwitchBranches && (
        <div className="relative inline-flex items-center shrink-0">
          <select
            value={activeBranchId || 'all'}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="h-7 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-full pl-2.5 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition max-w-[180px] truncate"
            title={isHeadManager ? 'Head Manager Cross-Branch Navigator' : 'Owner Cross-Branch Switcher'}
          >
            <option value="all">🌐 All Branches</option>
            {(branches || []).map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b?.name || 'Branch'} ({b?.code || ''})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
        </div>
      )}

      <button
        onClick={() => setIsPackageModalOpen(true)}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition shrink-0 whitespace-nowrap"
        title="View or switch your DMi Operating Package"
      >
        <Store className="w-3.5 h-3.5 text-emerald-600" />
        {subscription?.tier || 'Starter'} Plan
      </button>

      <span className="inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 shrink-0 whitespace-nowrap">
        Till: {activeBranch?.tillNumber || storeProfile?.tillNumber || '5331774'}
      </span>

      {activeSupportAccessForBusiness && (
        <span
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse shrink-0 whitespace-nowrap"
          title={`DMi Support Session active by ${activeSupportAccessForBusiness.adminName}: "${activeSupportAccessForBusiness.reason}". Access is strictly VIEW ONLY.`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          DMi Support (View Only)
        </span>
      )}
    </>
  );

  // Overflow menu items. `inlineOnDesktop` items are already shown as buttons on lg+,
  // so they only appear in the menu on smaller screens.
  const menuItems = [
    canRegisterStaff && {
      key: 'staff',
      label: 'Register Staff',
      icon: <UserPlus className="w-4 h-4 text-blue-600" />,
      onClick: () => setIsRegisterStaffOpen(true),
      inlineOnDesktop: true,
    },
    {
      key: 'switch',
      label: 'Switch User',
      icon: <Users className="w-4 h-4 text-indigo-600" />,
      onClick: () => setIsUserSwitchOpen(true),
      inlineOnDesktop: true,
    },
    {
      key: 'license',
      label: 'License',
      icon: <Key className="w-4 h-4 text-amber-600" />,
      onClick: () => setIsUnlockModalOpen(true),
      inlineOnDesktop: true,
    },
    {
      key: 'refresh',
      label: 'Refresh & Re-sync',
      icon: <RefreshCw className="w-4 h-4 text-slate-600" />,
      onClick: () => window.location.reload(),
      inlineOnDesktop: true,
    },
    {
      key: 'reset',
      label: 'Reset System Data',
      icon: <RotateCcw className="w-4 h-4 text-rose-500" />,
      onClick: () => setIsResetModalOpen(true),
      inlineOnDesktop: false,
      danger: true,
    },
    {
      key: 'lock',
      label: 'Lock Terminal',
      icon: <LogOut className="w-4 h-4 text-slate-500" />,
      onClick: logoutSession,
      inlineOnDesktop: true,
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    inlineOnDesktop: boolean;
    danger?: boolean;
  }>;

  return (
    <header className="relative shrink-0 z-30 w-full max-w-full bg-white/95 backdrop-blur border-b border-slate-200">
      {/* ───────── Main bar ───────── */}
      <div className="flex items-center gap-2 sm:gap-3 h-14 lg:h-16 px-3 sm:px-5 lg:px-6">
        {/* Mobile sidebar trigger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Identity: store name + user (takes remaining space, truncates safely) */}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate leading-tight">
            {storeProfile?.name || 'DMi Business Store'}
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 min-w-0">
            <strong className="text-slate-800 font-semibold truncate">
              {currentEmployee?.name || 'Staff'}
            </strong>
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 rounded uppercase tracking-wider border ${roleClass}`}
            >
              {currentEmployee?.role || 'staff'}
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-slate-600 font-medium whitespace-nowrap">
              {formattedDate}
            </span>
          </p>
        </div>

        {/* Context chips inline on very wide screens */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">{contextChips}</div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <SyncStatusIndicator onOpenAuthModal={() => setIsSupabaseAuthOpen(true)} />

          {/* Inline desktop actions (lg+) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {canRegisterStaff && (
              <button
                onClick={() => setIsRegisterStaffOpen(true)}
                className={`${iconBtn} bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200`}
                title="Register New Staff Account"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden 2xl:inline">Register Staff</span>
              </button>
            )}
            <button
              onClick={() => setIsUserSwitchOpen(true)}
              className={`${iconBtn} bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200`}
              title="Switch User"
            >
              <Users className="w-4 h-4" />
              <span className="hidden 2xl:inline">Switch User</span>
            </button>
            <button
              onClick={() => setIsUnlockModalOpen(true)}
              className={`${iconBtn} bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200`}
              title="Hardware License Key"
            >
              <Key className="w-4 h-4" />
              <span className="hidden 2xl:inline">License</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className={`${iconBtn} bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200`}
              title="Refresh Application Data & Re-sync"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logoutSession}
              className={`${iconBtn} bg-slate-900 hover:bg-slate-800 text-white border-slate-900`}
              title="Lock Terminal & Return to Login"
            >
              <LogOut className="w-4 h-4" />
              <span>Lock</span>
            </button>
          </div>

          {/* Overflow menu: everything on mobile, just "Reset" on desktop */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className={`${iconBtn} w-9 px-0 bg-white hover:bg-slate-100 text-slate-700 border-slate-200`}
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50"
              >
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      item.onClick();
                    }}
                    className={`${item.inlineOnDesktop ? 'lg:hidden' : ''} w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-left transition ${
                      item.danger
                        ? 'text-rose-700 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────── Context strip (below xl): scrolls sideways instead of overlapping ───────── */}
      <div
        className={`xl:hidden flex items-center gap-2 px-3 sm:px-5 lg:px-6 pb-2.5 overflow-x-auto ${hideScrollbar}`}
      >
        {contextChips}
      </div>

      {/* ───────── Modals ───────── */}
      <ResetSystemModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />

      {isWhatsAppModalOpen && <WhatsAppSummaryModal onClose={() => setIsWhatsAppModalOpen(false)} />}

      {isSettingsOpen && (
        <StoreSettingsModal initialTab={settingsInitialTab} onClose={() => setIsSettingsOpen(false)} />
      )}

      {isUserSwitchOpen && (
        <UserSwitchModal isOpen={isUserSwitchOpen} onClose={() => setIsUserSwitchOpen(false)} />
      )}

      {isRegisterStaffOpen && (
        <StaffRegisterModal isOpen={isRegisterStaffOpen} onClose={() => setIsRegisterStaffOpen(false)} />
      )}

      {isAcademyOpen && (
        <DMiBusinessAcademyModal isOpen={isAcademyOpen} onClose={() => setIsAcademyOpen(false)} />
      )}

      {isGuidedSetupOpen && (
        <GuidedSetupModal isOpen={isGuidedSetupOpen} onClose={() => setIsGuidedSetupOpen(false)} />
      )}

      {isSupabaseAuthOpen && (
        <SupabaseAuthModal isOpen={isSupabaseAuthOpen} onClose={() => setIsSupabaseAuthOpen(false)} />
      )}

      {isUnlockModalOpen && (
        <DeviceUnlockModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} />
      )}

      {isPackageModalOpen && (
        <PackageSelectionModal
          isOpen={isPackageModalOpen}
          onClose={() => setIsPackageModalOpen(false)}
          canDismiss={true}
        />
      )}
    </header>
  );
};

export default TopHeader;
