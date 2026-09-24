import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  Menu,
  Smartphone,
  Wifi,
  WifiOff,
  Store,
  MapPin,
  RefreshCw,
  Plus,
  Edit3,
  Sliders,
  BookOpen,
  Lock,
  Building2,
  MessageSquare,
  ChevronDown,
  Users,
  GraduationCap,
  Sparkles,
  Shield,
  Eye,
  Cloud,
  Package,
  LogOut,
  UserPlus,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Clock,
  Key,
} from 'lucide-react';
import WhatsAppSummaryModal from './WhatsAppSummaryModal';
import StoreSettingsModal from './StoreSettingsModal';
import DailySalesBookModal from './DailySalesBookModal';
import { UserSwitchModal } from './UserSwitchModal';
import { DMiBusinessAcademyModal } from './DMiBusinessAcademyModal';
import { GuidedSetupModal } from './GuidedSetupModal';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { SupabaseAuthModal } from './SupabaseAuthModal';
import { StaffRegisterModal } from './auth/StaffRegisterModal';
import { ResetSystemModal } from './ResetSystemModal';
import { DeviceUnlockModal } from './DeviceUnlockModal';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const {
    storeProfile,
    isOnline,
    toggleNetwork,
    syncStatus,
    pendingSyncCount,
    setActiveTab,
    isSalesBookOpen,
    branches,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    mpesaTransactions,
    currentEmployee,
    anomalies,
    currentDevice,
    products,
    lowStockProducts,
    logoutSession,
    subscription,
    isHeadManagerOrOwner,
    activeSupportAccessForBusiness,
  } = useBusiness();

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSalesBookModalOpen, setIsSalesBookModalOpen] = useState(false);
  const [salesBookModalMode, setSalesBookModalMode] = useState<'start' | 'close'>('start');
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
  const [isRegisterStaffOpen, setIsRegisterStaffOpen] = useState(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  const [isGuidedSetupOpen, setIsGuidedSetupOpen] = useState(false);
  const [isSupabaseAuthOpen, setIsSupabaseAuthOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Date formatting for top bar
  const formattedDate = new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleSalesBookClick = () => {
    setSalesBookModalMode(isSalesBookOpen ? 'close' : 'start');
    setIsSalesBookModalOpen(true);
  };

  const isOwner = currentEmployee.role === 'owner';
  const isHeadManager = currentEmployee.isHeadManager === true;
  // User mandate: Each branch manager and all other employees is limited to inventory, staff etc to their branch information apart from the Head manager for the business
  const canSwitchBranches = isOwner || isHeadManager;

  return (
    <header className="min-h-16 h-auto py-2 sm:py-0 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 shrink-0 z-30 gap-2 sm:gap-4 max-w-full overflow-hidden">
      {/* Left: Mobile Menu Trigger & Store Title / Outlets */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 sm:flex-initial">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap gap-y-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[180px] sm:max-w-none">
              {storeProfile?.name || 'DMi Business Store'}
            </h2>
            {isOwner && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
                title="Edit Store Name & Receipt Branding"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Version 2 Multi-Branch Switcher with Strict Branch Access Control */}
            <div className="relative inline-flex items-center shrink-0">
              {canSwitchBranches ? (
                <>
                  <select
                    value={activeBranchId || 'all'}
                    onChange={(e) => setActiveBranchId(e.target.value)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-lg px-2.5 py-1 appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                    title={isHeadManager ? "Head Manager Cross-Branch Navigator" : "Owner Cross-Branch Switcher"}
                  >
                    <option value="all">🌐 All Outlets (Consolidated)</option>
                    {(branches || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        📍 {b?.name || 'Branch'} ({b?.code || ''})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-blue-600 absolute right-2 pointer-events-none" />
                </>
              ) : (
                <div
                  className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 flex items-center gap-1.5"
                  title="Branch access is restricted to your assigned branch. Only the Head Manager and Business Owner can navigate multiple branches."
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>📍 {activeBranch?.name || 'Assigned Branch'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-1 rounded">Locked</span>
                </div>
              )}
            </div>

            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0 whitespace-nowrap">
              Till: {activeBranch?.tillNumber || storeProfile?.tillNumber || 'N/A'}
            </span>

            {/* Live Support Session Badge for Transparency */}
            {activeSupportAccessForBusiness && (
              <span
                className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse shrink-0"
                title={`DMi Support Session active by ${activeSupportAccessForBusiness.adminName}: "${activeSupportAccessForBusiness.reason}". Access is strictly VIEW ONLY.`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>DMi Support Active (View Only)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
            <span>Outlet: <strong className="text-slate-700">{activeBranch?.name || 'All Locations'}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <span>Logged In: </span>
              <strong className="text-slate-800 font-semibold">{currentEmployee?.name || 'Staff'}</strong>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                currentEmployee?.role === 'owner'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : currentEmployee?.role === 'manager'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {currentEmployee?.role || 'staff'}
              </span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium whitespace-nowrap">{formattedDate}</span>
          </p>
        </div>
      </div>

      {/* Right Actions: Clean, uncluttered layout fitting all controls */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Daily Sales Book Action Button */}
        {!isSalesBookOpen ? (
          <button
            id="header-btn-book-open"
            onClick={handleSalesBookClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md border border-amber-300 transition cursor-pointer animate-pulse whitespace-nowrap"
            title="Book Open: Click to open today's Sales Book and reveal the Sales menu in the navigation bar"
          >
            <BookOpen className="w-4 h-4 text-slate-950" />
            <span>Book Open</span>
            <span className="hidden sm:inline text-[10px] bg-amber-600/30 px-1.5 py-0.5 rounded font-mono">
              Start Sales
            </span>
          </button>
        ) : (
          <button
            id="header-btn-book-open"
            onClick={handleSalesBookClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition cursor-pointer whitespace-nowrap shadow-xs"
            title="Sales Book is OPEN. Click to view day status or close book at end of day"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold">Book Open</span>
            <span className="hidden sm:inline text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
              Active
            </span>
          </button>
        )}

        {/* PowerSync & Supabase Offline Write Queue Status Indicator */}
        <SyncStatusIndicator onOpenAuthModal={() => setIsSupabaseAuthOpen(true)} />

        {/* Register Staff Button - For Owner and Managers */}
        {(isOwner || currentEmployee.role === 'manager') && (
          <button
            onClick={() => setIsRegisterStaffOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer whitespace-nowrap"
            title="Register New Staff Account (Owner / Branch Manager Authorization)"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Register Staff</span>
          </button>
        )}

        {/* Cryptographic Machine License Button */}
        <button
          onClick={() => setIsUnlockModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer whitespace-nowrap"
          title="Cryptographic Hardware License Key: Unlock or verify machine license"
        >
          <Key className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">License Key</span>
        </button>

        {/* Reset System Data Button */}
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 transition cursor-pointer whitespace-nowrap"
          title="Reset System Data (Ground Zero / Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Reset Data</span>
        </button>

        {/* Lock Terminal / Log Out Button */}
        <button
          onClick={logoutSession}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 transition cursor-pointer whitespace-nowrap"
          title="Lock Terminal & Return to Login Dashboard"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>

      <ResetSystemModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {isWhatsAppModalOpen && (
        <WhatsAppSummaryModal onClose={() => setIsWhatsAppModalOpen(false)} />
      )}

      {isSettingsOpen && (
        <StoreSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {isSalesBookModalOpen && (
        <DailySalesBookModal
          isOpen={isSalesBookModalOpen}
          onClose={() => setIsSalesBookModalOpen(false)}
          initialMode={salesBookModalMode}
        />
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
        <DeviceUnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
        />
      )}
    </header>
  );
};

export default TopHeader;
