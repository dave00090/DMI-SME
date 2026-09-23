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
import { RotateCcw, ShieldCheck, Terminal } from 'lucide-react';

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
  const [isSuspensionDismissed, setIsSuspensionDismissed] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Security guard: If a non-master user somehow lands on platform-admin, redirect to POS
  useEffect(() => {
    if (activeTab === 'platform-admin' && !isMasterDeveloper) {
      setActiveTab('pos');
    }
  }, [activeTab, isMasterDeveloper, setActiveTab]);

  // Global developer keyboard shortcut: Ctrl+Shift+D or Alt+D to open Master Developer Console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key ? e.key.toLowerCase() : '';
      if ((e.ctrlKey && e.shiftKey && k === 'd') || (e.altKey && k === 'd')) {
        // Only allow trigger if Master Developer is authenticated or on pre-login screen
        if (isMasterDeveloper || !isSessionAuthenticated) {
          e.preventDefault();
          setIsDevConsoleOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsDevConsoleOpen, isMasterDeveloper, isSessionAuthenticated]);

  // If not authenticated, present the Login Dashboard
  if (!isSessionAuthenticated) {
    return (
      <>
        <LoginDashboard />
        <DeveloperConsoleModal
          isOpen={isDevConsoleOpen}
          onClose={() => setIsDevConsoleOpen(false)}
        />
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
              {activeTab === 'branches' && <BranchManager initialSubTab="branches" />}
              {activeTab === 'ibt' && <BranchManager initialSubTab="transfers" />}
              {activeTab === 'dispatch' && <DispatchManager />}
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

      {/* Subscription Suspension Modal (Non-punitive; offers M-Pesa renewal and billing access) */}
      <SubscriptionSuspensionModal
        isOpen={subscription?.status === 'suspended' && !isSuspensionDismissed && activeTab !== 'subscription-billing' && activeTab !== 'platform-admin'}
        onClose={() => setIsSuspensionDismissed(true)}
        onOpenBilling={() => {
          setIsSuspensionDismissed(true);
          setActiveTab('subscription-billing');
        }}
      />

      {/* Global Developer Console Modal */}
      <DeveloperConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
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
