import React, { useState, useEffect } from 'react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import InventoryManager from './components/InventoryManager';
import DebtorsManager from './components/DebtorsManager';
import SuppliersManager from './components/SuppliersManager';
import ExpensesManager from './components/ExpensesManager';
import ReportsManager from './components/ReportsManager';
import AiAssistant from './components/AiAssistant';
import BranchManager from './components/BranchManager';
import DispatchManager from './components/DispatchManager';
import MpesaAutomationHub from './components/MpesaAutomationHub';
import WhatsAppAutomationHub from './components/WhatsAppAutomationHub';
import { AuditLogViewer } from './components/AuditLogViewer';
import { EmployeeSecurityManager } from './components/EmployeeSecurityManager';
import { DeviceCloudManager } from './components/DeviceCloudManager';
import ContactsManager from './components/ContactsManager';
import { LoginDashboard } from './components/auth/LoginDashboard';
import { DeveloperConsoleModal } from './components/DeveloperConsoleModal';
import { SubscriptionBillingHub } from './components/SubscriptionBillingHub';
import { PlatformAdminDashboard } from './components/PlatformAdminDashboard';
import { SubscriptionSuspensionModal } from './components/SubscriptionSuspensionModal';
import { AuditedSupportBanner } from './components/AuditedSupportBanner';
import { ResetSystemModal } from './components/ResetSystemModal';
import { FloatingSalesBookControl } from './components/FloatingSalesBookControl';
import { PackageSelectionModal } from './components/auth/PackageSelectionModal';
import { StarterPlanRestrictionNotice } from './components/StarterPlanRestrictionNotice';
import { RotateCcw, ShieldCheck, Terminal, Clock } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    resetToSampleData,
    isSessionAuthenticated,
    isDevConsoleOpen,
    setIsDevConsoleOpen,
    isMasterDeveloper,
    subscription,
    switchBusinessTenant,
  } = useBusiness();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isManualSuspensionOpen, setIsManualSuspensionOpen] = useState(false);

  // Check if first-time package selection is required
  const isFirstTimePackageRequired = !subscription?.packageSelected && !localStorage.getItem('dmi_initial_package_selected');

  // Grace Period Check
  const isGraceActive = Boolean(
    subscription?.status === 'grace_period' &&
    subscription?.gracePeriodEndsAt &&
    new Date(subscription.gracePeriodEndsAt).getTime() > Date.now()
  );

  // Expiry & Locking Check:
  // App locks if suspended, past_due, or renewal date has arrived (unless active grace period)
  const isSubscriptionLocked = Boolean(
    subscription?.status === 'suspended' ||
    subscription?.status === 'past_due' ||
    (subscription?.renewalDate && new Date(subscription.renewalDate).getTime() < Date.now() && !isGraceActive) ||
    (subscription?.status === 'grace_period' && subscription?.gracePeriodEndsAt && new Date(subscription.gracePeriodEndsAt).getTime() <= Date.now())
  );

  // Plan level check: Starter package clients have only 1 shop and NO access to Multi Branch, IBT, or Dispatch
  const subTier = (subscription?.tier || 'Starter').toLowerCase();
  const isStarterPlan = subTier === 'starter';

  // Security guard: If a non-master user somehow lands on platform-admin, redirect to POS
  useEffect(() => {
    if (activeTab === 'platform-admin' && !isMasterDeveloper) {
      setActiveTab('pos');
    }
  }, [activeTab, isMasterDeveloper, setActiveTab]);

  // Starter Plan Guard: If client is on Starter package and attempts to access branches, ibt, or dispatch, redirect to POS
  useEffect(() => {
    if (isStarterPlan && (activeTab === 'branches' || activeTab === 'ibt' || activeTab === 'dispatch')) {
      setActiveTab('pos');
    }
  }, [activeTab, isStarterPlan, setActiveTab]);

  // Global developer keyboard shortcut: Ctrl+Shift+D or Alt+D to open Master Developer Console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key ? e.key.toLowerCase() : '';
      if ((e.ctrlKey && e.shiftKey && k === 'd') || (e.altKey && k === 'd')) {
        // Strictly only allow trigger if Master Developer is authenticated
        if (isMasterDeveloper) {
          e.preventDefault();
          setIsDevConsoleOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsDevConsoleOpen, isMasterDeveloper]);

  // If not authenticated, present the Login Dashboard
  if (!isSessionAuthenticated) {
    return (
      <>
        <LoginDashboard />
        {isMasterDeveloper && (
          <DeveloperConsoleModal
            isOpen={isDevConsoleOpen}
            onClose={() => setIsDevConsoleOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div
      className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-800"
      style={{ backgroundColor: '#f8fafc' }}
    >
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <AuditedSupportBanner />
        <TopHeader onMenuClick={() => setMobileOpen(true)} />

        {/* Active Grace Period Banner */}
        {isGraceActive && subscription?.gracePeriodEndsAt && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-xs border-b border-amber-600/40">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-950 animate-pulse shrink-0" />
              <span>
                ⏰ Temporary Grace Period Active: Access granted until{' '}
                {new Date(subscription.gracePeriodEndsAt).toLocaleDateString()}{' '}
                {new Date(subscription.gracePeriodEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Please pay monthly fee to Lipa Na M-Pesa Buy Goods Till <strong>5331774</strong> to prevent locking.
              </span>
            </div>
            <button
              onClick={() => setIsManualSuspensionOpen(true)}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0 shadow-xs"
            >
              Pay Till 5331774 Now
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col justify-between space-y-6">
            <div className="flex-1">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'pos' && <POS />}
              {activeTab === 'contacts' && <ContactsManager />}
              {activeTab === 'inventory' && <InventoryManager />}
              {activeTab === 'debtors' && <DebtorsManager />}
              {activeTab === 'suppliers' && <SuppliersManager />}
              {activeTab === 'expenses' && <ExpensesManager />}
              {activeTab === 'branches' && (
                isStarterPlan ? (
                  <StarterPlanRestrictionNotice
                    featureName="Multi Branch v2"
                    onOpenUpgrade={() => setIsPackageModalOpen(true)}
                  />
                ) : (
                  <BranchManager initialSubTab="branches" />
                )
              )}
              {activeTab === 'ibt' && (
                isStarterPlan ? (
                  <StarterPlanRestrictionNotice
                    featureName="IBT (Inter-Branch Transfers)"
                    onOpenUpgrade={() => setIsPackageModalOpen(true)}
                  />
                ) : (
                  <BranchManager initialSubTab="transfers" />
                )
              )}
              {activeTab === 'dispatch' && (
                isStarterPlan ? (
                  <StarterPlanRestrictionNotice
                    featureName="Dispatch Manager"
                    onOpenUpgrade={() => setIsPackageModalOpen(true)}
                  />
                ) : (
                  <DispatchManager />
                )
              )}
              {activeTab === 'devices' && <DeviceCloudManager />}
              {activeTab === 'audit-camera' && <AuditLogViewer />}
              {activeTab === 'staff-security' && <EmployeeSecurityManager />}
              {activeTab === 'mpesa-hub' && <MpesaAutomationHub />}
              {activeTab === 'whatsapp-hub' && <WhatsAppAutomationHub />}
              {activeTab === 'reports' && <ReportsManager />}
              {activeTab === 'subscription-billing' && <SubscriptionBillingHub />}
              {activeTab === 'platform-admin' && isMasterDeveloper && (
                <PlatformAdminDashboard
                  onExitToBusiness={() => setActiveTab('pos')}
                  onSelectBusinessTenant={(bizId) => {
                    switchBusinessTenant(bizId);
                    setActiveTab('dashboard');
                  }}
                />
              )}
              {activeTab === 'ai-advisor' && <AiAssistant />}
            </div>

            {/* Clean bottom bar */}
            <footer className="pt-6 pb-2 text-xs text-slate-400 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">DMi Business</span>
                <span>• Professional Polish Theme • Hardware & General Retail Edition</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Offline-First Safe</span>
                </span>

                {/* Always-accessible Reset Data control */}
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer font-medium"
                  title="Reset or configure system data (Ground Zero / Demo Data)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>Reset Data</span>
                </button>

                {/* Developer controls */}
                {isMasterDeveloper && (
                  <button
                    onClick={() => setIsDevConsoleOpen(true)}
                    className="text-amber-500 hover:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-semibold transition cursor-pointer"
                    title="Software Architect Developer Portal (Ctrl+Shift+D)"
                  >
                    <Terminal className="w-3 h-3 text-amber-500" />
                    <span>Architect Console</span>
                  </button>
                )}
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Reset System Modal */}
      <ResetSystemModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Subscription Suspension & Lock Screen (STK push to Till 5331774 or Grace Period Request) */}
      <SubscriptionSuspensionModal
        isOpen={(isSubscriptionLocked || isManualSuspensionOpen) && activeTab !== 'platform-admin'}
        onClose={() => setIsManualSuspensionOpen(false)}
        onOpenBilling={() => {
          setIsManualSuspensionOpen(false);
          setActiveTab('subscription-billing');
        }}
      />

      {/* Global Developer Console Modal */}
      <DeveloperConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
      />

      {/* First-Time Access & On-Demand Package Selection Modal */}
      <PackageSelectionModal
        isOpen={isPackageModalOpen || isFirstTimePackageRequired}
        onClose={() => setIsPackageModalOpen(false)}
        canDismiss={!isFirstTimePackageRequired}
      />

      {/* Floating Action Button: Book Open */}
      <FloatingSalesBookControl />
    </div>
  );
};

export default function App() {
  return (
    <BusinessProvider>
      <MainContent />
    </BusinessProvider>
  );
}
