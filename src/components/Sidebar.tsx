import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
  Truck,
  Wallet,
  FileText,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Store,
  Building2,
  Smartphone,
  MessageSquare,
  Shield,
  Eye,
  GraduationCap,
  Cloud,
  Send,
  Users,
  CreditCard,
  ShieldCheck,
  Terminal,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import StoreSettingsModal from './StoreSettingsModal';
import { DMiBusinessAcademyModal } from './DMiBusinessAcademyModal';
import DailySalesBookModal from './DailySalesBookModal';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    isOnline,
    syncStatus,
    lowStockProducts,
    debtorsList,
    currentEmployee,
    anomalies,
    connectedDevices,
    dispatchOrders,
    subscription,
    isMasterDeveloper,
    setIsDevConsoleOpen,
    isSalesBookOpen,
  } = useBusiness();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  const [isSalesBookModalOpen, setIsSalesBookModalOpen] = useState(false);

  // 24/7 Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const role = currentEmployee?.role || 'cashier';
  const permissions = currentEmployee?.permissions || ({} as typeof currentEmployee.permissions);
  const flaggedAnomalies = anomalies.filter((a) => a.status === 'flagged').length;

  const subTier = (subscription?.tier || 'Starter').toLowerCase();
  const isStarterPlan = subTier === 'starter';
  // Feature gating: 'Multi Branch', 'IBT', and 'Dispatch' are restricted from 'starter' plans
  const isMultiBranchAndDispatchAllowed =
    !isStarterPlan && (subTier === 'business' || subTier === 'pro' || subTier === 'enterprise');

  const canViewStock =
    role === 'owner' ||
    role === 'manager' ||
    role === 'storekeeper' ||
    Boolean(permissions?.canViewStock ?? permissions?.viewStock ?? true);

  const canCreateSale =
    role === 'owner' ||
    role === 'manager' ||
    role === 'cashier' ||
    Boolean(permissions?.canCreateSale ?? permissions?.createSale ?? true);

  const canViewCustomers =
    role === 'owner' ||
    role === 'manager' ||
    Boolean(permissions?.canViewCustomers ?? permissions?.viewCustomers ?? true);

  const canViewExpenses =
    role === 'owner' ||
    role === 'manager' ||
    Boolean(permissions?.canViewExpenses ?? permissions?.viewExpenses);

  const canTransferStock =
    role === 'owner' ||
    role === 'manager' ||
    role === 'storekeeper' ||
    Boolean(permissions?.canTransferStock ?? permissions?.transferStock);

  const canViewAuditLog =
    role === 'owner' ||
    role === 'manager' ||
    Boolean(permissions?.canViewAuditLog ?? permissions?.canViewAuditLogs ?? permissions?.viewAuditLogs);

  const canManageEmployees =
    role === 'owner' ||
    Boolean(permissions?.canManageEmployees ?? permissions?.manageEmployees);

  const canViewFinancialReports =
    role === 'owner' ||
    role === 'manager' ||
    Boolean(permissions?.canViewFinancialReports ?? permissions?.viewFinancialReports);

  const canAccessDispatch =
    role === 'owner' ||
    role === 'manager' ||
    role === 'storekeeper' ||
    Boolean(permissions?.canOrderDispatch || permissions?.canAuthorizeDispatch);

  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: null,
      visible: role === 'owner' || role === 'manager',
    },
    {
      id: 'pos',
      label: 'Sales',
      icon: <Receipt className="w-4 h-4" />,
      badge: null,
      visible: canCreateSale && isSalesBookOpen,
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: null,
      visible: true,
    },
    {
      id: 'inventory',
      label: 'Inventory Control',
      icon: <Package className="w-4 h-4" />,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : null,
      badgeColor: 'bg-amber-500 text-white',
      visible: canViewStock,
    },
    {
      id: 'debtors',
      label: 'Debt Manager',
      icon: <BookOpen className="w-4 h-4" />,
      badge: debtorsList.length > 0 ? `${debtorsList.length}` : null,
      badgeColor: 'bg-red-500 text-white',
      visible: canViewCustomers,
    },
    {
      id: 'suppliers',
      label: 'Supplier Ledger',
      icon: <Truck className="w-4 h-4" />,
      badge: null,
      visible: role === 'owner' || role === 'manager' || role === 'storekeeper',
    },
    {
      id: 'expenses',
      label: 'Expenses Tracker',
      icon: <Wallet className="w-4 h-4" />,
      badge: null,
      visible: canViewExpenses,
    },
    {
      id: 'branches',
      label: 'Multi Branch',
      icon: <Building2 className="w-4 h-4 text-sky-400" />,
      badge: 'v2',
      badgeColor: 'bg-sky-600 text-white',
      visible: canTransferStock && isMultiBranchAndDispatchAllowed && !isStarterPlan,
    },
    {
      id: 'ibt',
      label: 'IBT',
      icon: <ArrowRightLeft className="w-4 h-4 text-sky-400" />,
      badge: 'IBT',
      badgeColor: 'bg-sky-600 text-white',
      visible: canTransferStock && isMultiBranchAndDispatchAllowed && !isStarterPlan,
    },
    {
      id: 'dispatch',
      label: 'Dispatch',
      icon: <Send className="w-4 h-4 text-amber-400" />,
      badge:
        dispatchOrders.filter((d) => d.status === 'pending_approval' || d.status === 'dispatched').length > 0
          ? `${dispatchOrders.filter((d) => d.status === 'pending_approval' || d.status === 'dispatched').length}`
          : 'New',
      badgeColor: dispatchOrders.some((d) => d.status === 'pending_approval')
        ? 'bg-amber-600 text-white'
        : 'bg-blue-600 text-white',
      visible: canAccessDispatch && isMultiBranchAndDispatchAllowed && !isStarterPlan,
    },
    {
      id: 'devices',
      label: 'Cloud & Devices',
      icon: <Cloud className="w-4 h-4 text-cyan-400" />,
      badge: `${connectedDevices.length}`,
      badgeColor: 'bg-cyan-600 text-white',
      visible: true,
    },
    {
      id: 'audit-camera',
      label: 'Audit Camera',
      icon: <Eye className="w-4 h-4 text-rose-400" />,
      badge: flaggedAnomalies > 0 ? `${flaggedAnomalies}` : 'Active',
      badgeColor: flaggedAnomalies > 0 ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300',
      visible: canViewAuditLog,
    },
    {
      id: 'staff-security',
      label: 'Staff & Security',
      icon: <Shield className="w-4 h-4 text-indigo-400" />,
      badge: 'RBAC',
      badgeColor: 'bg-indigo-600 text-white',
      visible: canManageEmployees,
    },
    {
      id: 'mpesa-hub',
      label: 'M-Pesa Automation',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      badge: 'Live',
      badgeColor: 'bg-emerald-600 text-white',
      visible: true,
    },
    {
      id: 'whatsapp-hub',
      label: 'WhatsApp Engine',
      icon: <MessageSquare className="w-4 h-4 text-green-400" />,
      badge: 'wa.me',
      badgeColor: 'bg-green-600 text-white',
      visible: true,
    },
    {
      id: 'reports',
      label: 'Advanced Reports',
      icon: <FileText className="w-4 h-4" />,
      badge: null,
      visible: canViewFinancialReports,
    },
    {
      id: 'subscription-billing',
      label: 'Subscription & Billing',
      icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
      badge:
        subscription?.status === 'suspended'
          ? 'Suspended'
          : subscription?.status === 'grace_period'
          ? 'Grace'
          : 'Active',
      badgeColor:
        subscription?.status === 'suspended'
          ? 'bg-rose-600 text-white'
          : subscription?.status === 'grace_period'
          ? 'bg-amber-500 text-slate-900 font-bold animate-pulse'
          : 'bg-emerald-600 text-white',
      visible: role === 'owner',
    },
    {
      id: 'ai-advisor',
      label: 'AI Assistant',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />,
      badge: 'Gemini',
      badgeColor: 'bg-blue-600 text-white',
      visible: role === 'owner' || role === 'manager',
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.visible);

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar element matching Professional Polish Design HTML */}
      <aside
        className={`w-64 bg-slate-900 flex flex-col text-slate-300 shrink-0 border-r border-slate-800 z-50 fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-base">
                D
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">DMi Business</h1>
                <p className="text-[11px] text-slate-500">Retail & Hardware POS</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Prominent Open Sales Book Button (When Sales Book is closed for the day) */}
          {!isSalesBookOpen && canCreateSale && (
            <div className="mb-3 px-1">
              <button
                onClick={() => setIsSalesBookModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer animate-pulse"
                title="Open Daily Sales Book for Today to unlock Sales tab"
              >
                <BookOpen className="w-4 h-4 text-slate-950" />
                <span>Open Sales Book</span>
              </button>
            </div>
          )}
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-800 space-y-1">
            {/* Business Academy */}
            <button
              onClick={() => {
                setIsAcademyOpen(true);
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-semibold cursor-pointer text-left"
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Business Academy</span>
              </div>
              <span className="text-[10px] bg-amber-400/15 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                Guides
              </span>
            </button>

            {/* Store & Receipts - restricted to owner */}
            {role === 'owner' && (
              <>
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-semibold cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Store className="w-4 h-4 text-sky-400" />
                    <span>Store & Receipts</span>
                  </div>
                  <span className="text-[10px] bg-sky-400/15 text-sky-300 font-bold px-1.5 py-0.5 rounded">
                    Edit
                  </span>
                </button>
              </>
            )}

            {/* Master Developer & SuperAdmin Console - ONLY VISIBLE TO DAVID MIGICHI */}
            {isMasterDeveloper && (
              <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-amber-400/80 flex items-center justify-between">
                  <span>Architect NOC</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded font-mono">
                    SUPERADMIN
                  </span>
                </div>
                <button
                  id="sidebar-developer-console-btn"
                  onClick={() => {
                    setActiveTab('platform-admin');
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer text-left ${
                    activeTab === 'platform-admin'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-amber-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Developer & SuperAdmin</span>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                    Live
                  </span>
                </button>

                <button
                  id="sidebar-open-dev-tools-modal-btn"
                  onClick={() => {
                    setIsDevConsoleOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition text-xs font-medium cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>Internal Repair Suite</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Ctrl+Shift+D
                  </span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Section: Live Clock & Sync Status */}
        <div className="p-3.5 mt-auto border-t border-slate-800/80 bg-slate-950/40">
          {/* Live Clock at the bottom of the left tab (no "24/7") */}
          <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold tracking-wider text-slate-200">
                {currentTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans font-medium">Clock</span>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] uppercase font-bold text-slate-500">
            <span className="flex items-center gap-1">
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                  <span>Syncing...</span>
                </>
              ) : (
                <span>Sync: Just now</span>
              )}
            </span>
            <span
              className={`flex items-center gap-1 ${
                isOnline ? 'text-green-500' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-amber-400'
                }`}
              ></span>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {isSettingsOpen && (
        <StoreSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {isAcademyOpen && (
        <DMiBusinessAcademyModal isOpen={isAcademyOpen} onClose={() => setIsAcademyOpen(false)} />
      )}

      {isSalesBookModalOpen && (
        <DailySalesBookModal
          isOpen={isSalesBookModalOpen}
          onClose={() => setIsSalesBookModalOpen(false)}
          initialMode="start"
        />
      )}
    </>
  );
};

export default Sidebar;
