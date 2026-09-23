import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  Cloud,
  Server,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Key,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Archive,
  Download,
  Upload,
  Zap,
  Activity,
  UserCheck,
  Sliders,
  History,
  FileCheck,
  Share2,
  HardDrive,
  Copy,
  ExternalLink,
  Wifi,
} from 'lucide-react';
import {
  DeviceHardwareType,
  DeviceStatus,
  UserRole,
  ConnectedDevice,
  SubscriptionTier,
} from '../types';
import { DeveloperConsoleModal } from './DeveloperConsoleModal';

export const DeviceCloudManager: React.FC = () => {
  const {
    businessIdentity,
    updateBusinessIdentity,
    subscription,
    updateSubscriptionTier,
    connectedDevices,
    currentDevice,
    switchDeviceView,
    deviceSessions,
    activationCodes,
    generateActivationCode,
    connectDeviceWithCode,
    connectDeviceWithOwnerLogin,
    revokeDeviceAccess,
    replaceDevice,
    terminateDeviceSession,
    isCurrentDeviceRevoked,
    isOnline,
    toggleNetwork,
    syncStatus,
    pendingSyncCount,
    triggerManualSync,
    syncEvents,
    pendingOfflineEvents,
    simulateConcurrentOfflineSale,
    reconstructStockAuditTrail,
    isRecoveredFromCrash,
    dismissCrashRecoveryNotice,
    simulateComputerCrash,
    softDeletedRecords,
    restoreRecordFromVault,
    cloudBackups,
    createCloudBackupSnapshot,
    restoreCloudBackupSnapshot,
    simulateServerFailureAndDisasterRecovery,
    exportDisasterRecoveryBundle,
    importDisasterRecoveryBundle,
    branches,
    products,
    currentEmployee,
    employees,
    addAuditLog,
    redeemLicenseVoucher,
    signedLicense,
    verifyOfflineLicense,
    isDeveloperAuthenticated,
    isDevConsoleOpen,
    setIsDevConsoleOpen,
  } = useBusiness();

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'terminals' | 'pairing' | 'sessions' | 'sync-engine' | 'soft-delete' | 'disaster-recovery'
  >('overview');

  // Pairing Modal state
  const [pairingMethod, setPairingMethod] = useState<'code' | 'owner'>('code');
  const [inputCode, setInputCode] = useState('');
  const [inputBizId, setInputBizId] = useState(businessIdentity.businessId);
  const [inputOwnerPin, setInputOwnerPin] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<DeviceHardwareType>('desktop_pc');
  const [newDeviceBranch, setNewDeviceBranch] = useState(branches[0]?.id || 'branch-1');
  const [newDeviceRole, setNewDeviceRole] = useState<UserRole>('cashier');
  const [pairingMessage, setPairingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate code state
  const [selectedBranchForCode, setSelectedBranchForCode] = useState(branches[0]?.id || 'branch-1');
  const [selectedRoleForCode, setSelectedRoleForCode] = useState<UserRole>('cashier');
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);

  // Replace device modal state
  const [replacingDeviceId, setReplacingDeviceId] = useState<string | null>(null);
  const [replacementName, setReplacementName] = useState('');
  const [replacementType, setReplacementType] = useState<DeviceHardwareType>('laptop');

  // Conflict / Delta demo state
  const [demoSelectedProduct, setDemoSelectedProduct] = useState(products[0]?.id || 'prod-1');
  const [demoSelectedTerminal, setDemoSelectedTerminal] = useState(connectedDevices[1]?.id || connectedDevices[0]?.id || 'dev-pos-02');
  const [demoQuantity, setDemoQuantity] = useState(5);
  const [conflictSuccessMessage, setConflictSuccessMessage] = useState<string | null>(null);

  // Disaster recovery simulation state
  const [isSimulatingDisaster, setIsSimulatingDisaster] = useState(false);
  const [disasterDrillSteps, setDisasterDrillSteps] = useState<string[]>([]);
  const [disasterDrillDone, setDisasterDrillDone] = useState(false);

  // Backup snapshot label
  const [manualSnapshotLabel, setManualSnapshotLabel] = useState('');

  // Selected product audit trail
  const [inspectProductId, setInspectProductId] = useState(products[0]?.id || 'prod-1');

  // License voucher redemption state
  const [voucherInput, setVoucherInput] = useState('');
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);
  const [voucherStatusMessage, setVoucherStatusMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [offlineVerificationResult, setOfflineVerificationResult] = useState<{
    tested: boolean;
    valid: boolean;
    details?: string;
  } | null>(null);

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setIsRedeemingVoucher(true);
    setVoucherStatusMessage(null);
    try {
      const result = await redeemLicenseVoucher(voucherInput.trim());
      setVoucherStatusMessage({ success: result.success, text: result.message });
      if (result.success) {
        setVoucherInput('');
        setOfflineVerificationResult({
          tested: true,
          valid: true,
          details: `Digital signature validated. Terminal authorized until ${new Date(
            result.signedLicense?.validUntil || Date.now() + 30 * 86400000
          ).toLocaleDateString()}. Zero-internet offline validation active.`,
        });
      }
    } catch (err: any) {
      setVoucherStatusMessage({ success: false, text: err.message || 'Error communicating with voucher authority.' });
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  const handleTestOfflineVerification = () => {
    const isValid = verifyOfflineLicense();
    if (isValid) {
      setOfflineVerificationResult({
        tested: true,
        valid: true,
        details: `Authority Public Key Fingerprint verified successfully. Cryptographic signature and base64 payload validated for tenant ${businessIdentity.businessId}. Offline POS operational.`,
      });
    } else {
      setOfflineVerificationResult({
        tested: true,
        valid: false,
        details: `Signature verification failed or license expired. Connect to server or redeem a fresh developer voucher.`,
      });
    }
  };

  // Hardware icons helper
  const getDeviceIcon = (type: DeviceHardwareType) => {
    switch (type) {
      case 'desktop_pc':
        return <Monitor className="w-5 h-5 text-blue-600" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-indigo-600" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-emerald-600" />;
      case 'phone':
        return <Smartphone className="w-5 h-5 text-amber-600" />;
      default:
        return <Monitor className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleGenerateCode = () => {
    const generated = generateActivationCode(selectedBranchForCode, selectedRoleForCode);
    setLastGeneratedCode(generated.code);
  };

  const handleConnectWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setPairingMessage({ type: 'error', text: 'Please enter an 8-character activation code.' });
      return;
    }

    const res = connectDeviceWithCode(inputCode, {
      name: newDeviceName || `Terminal POS-0${connectedDevices.length + 1}`,
      type: newDeviceType,
      os: 'Windows 11 / Linux',
      branchId: newDeviceBranch,
      role: newDeviceRole,
    });

    if (res.success) {
      setPairingMessage({ type: 'success', text: res.message });
      setInputCode('');
      setNewDeviceName('');
    } else {
      setPairingMessage({ type: 'error', text: res.message });
    }
  };

  const handleConnectWithOwner = (e: React.FormEvent) => {
    e.preventDefault();
    const res = connectDeviceWithOwnerLogin(inputBizId, inputOwnerPin, {
      name: newDeviceName || `Executive Station (${newDeviceType})`,
      type: newDeviceType,
      os: 'Windows 11 / macOS',
      branchId: newDeviceBranch,
      role: newDeviceRole,
    });

    if (res.success) {
      setPairingMessage({ type: 'success', text: res.message });
      setInputOwnerPin('');
      setNewDeviceName('');
    } else {
      setPairingMessage({ type: 'error', text: res.message });
    }
  };

  const handleExecuteReplace = () => {
    if (!replacingDeviceId) return;
    const res = replaceDevice(replacingDeviceId, {
      name: replacementName || 'New Hardware Terminal',
      type: replacementType,
      os: 'Windows 11 POS Edition',
    });
    if (res.success) {
      setReplacingDeviceId(null);
      setReplacementName('');
    }
  };

  const handleRunConflictDemo = () => {
    simulateConcurrentOfflineSale(demoSelectedTerminal, demoSelectedProduct, demoQuantity);
    const prod = products.find((p) => p.id === demoSelectedProduct);
    const dev = connectedDevices.find((d) => d.id === demoSelectedTerminal);
    setConflictSuccessMessage(
      `Event delta recorded: Terminal "${dev?.name}" processed -${demoQuantity} units of "${prod?.name}". Reconciled automatically without overriding other terminal sales!`
    );
    setTimeout(() => setConflictSuccessMessage(null), 6000);
  };

  const handleRunDisasterRecovery = async () => {
    setIsSimulatingDisaster(true);
    setDisasterDrillSteps([]);
    setDisasterDrillDone(false);

    const result = await simulateServerFailureAndDisasterRecovery();
    setDisasterDrillSteps(result.steps);
    setDisasterDrillDone(true);
    setIsSimulatingDisaster(false);
  };

  const handleCreateSnapshot = () => {
    createCloudBackupSnapshot(manualSnapshotLabel || undefined, 'manual');
    setManualSnapshotLabel('');
  };

  const handleExportBackup = () => {
    const json = exportDisasterRecoveryBundle();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DMi_Backup_${businessIdentity.businessId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeDeviceCount = connectedDevices.filter((d) => d.status === 'active').length;
  const auditStockHistory = reconstructStockAuditTrail(inspectProductId);
  const inspectingProduct = products.find((p) => p.id === inspectProductId) || products[0];

  return (
    <div className="space-y-6">
      {/* Crash Recovery Alert Banner if active */}
      {isRecoveredFromCrash && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-white" />
            <div>
              <p className="font-bold text-sm">Local Crash Recovery Verified</p>
              <p className="text-xs text-emerald-100">
                Hardware terminal restarted. All local inventory, sales transactions, and cart state have been safely restored with 0 data loss from local storage!
              </p>
            </div>
          </div>
          <button
            onClick={dismissCrashRecoveryNotice}
            className="px-3 py-1 bg-white text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-50 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Revocation notice if current terminal was revoked */}
      {isCurrentDeviceRevoked && (
        <div className="bg-rose-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0 text-white" />
            <div>
              <p className="font-bold text-sm">TERMINAL ACCESS REVOKED REMOTELY</p>
              <p className="text-xs text-rose-100">
                This physical device ({currentDevice.name}) has been blacklisted by the business owner. Local business database is locked.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchDeviceView(connectedDevices.find((d) => d.status === 'active')?.id || 'dev-pos-01')}
            className="px-3 py-1.5 bg-white text-rose-800 text-xs font-bold rounded-lg hover:bg-rose-50 transition cursor-pointer"
          >
            Switch to Authorized Terminal
          </button>
        </div>
      )}

      {/* Top Architecture Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Cloud className="w-3.5 h-3.5" />
              <span>DMi Central Database Architecture • One Business, Many Devices</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Data Persistence & Device Fleet Management
            </h1>

            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Never tie your business to a single physical machine. Devices (laptops, phones, POS tablets) are just hardware windows that pair into your central cloud master database.
            </p>
          </div>

          {/* Business Master Identity Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">
                Central Cloud Master
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-amber-300">
                  {businessIdentity.businessId}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  {subscription.tier.toUpperCase()} TIER
                </span>
              </div>
              <p className="text-xs text-slate-300">{businessIdentity.name}</p>
            </div>

            <div className="h-10 w-px bg-white/20 hidden sm:block" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-300">Active Fleet:</span>
                <span className="font-bold text-white">
                  {activeDeviceCount} / {subscription.maxDevices} Terminals
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-300">Cloud Status:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Synced & Healthy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Device Switcher Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">Operating As Active Terminal:</span>
            <div className="flex flex-wrap items-center gap-2">
              {connectedDevices.map((dev) => (
                <button
                  key={dev.id}
                  onClick={() => switchDeviceView(dev.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    currentDevice.id === dev.id
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : dev.status === 'revoked'
                      ? 'bg-rose-950/60 text-rose-400 line-through border border-rose-800/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={`Switch active hardware context to ${dev.name} (${dev.terminalNumber})`}
                >
                  {getDeviceIcon(dev.type)}
                  <span>{dev.name}</span>
                  {dev.status === 'revoked' && <span className="text-[10px] text-rose-400 font-bold">(REVOKED)</span>}
                  {currentDevice.id === dev.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={simulateComputerCrash}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 transition flex items-center gap-1.5 cursor-pointer"
              title="Execute emergency power cutoff drill to verify zero data loss"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Execute Emergency Crash Drill</span>
            </button>

            <button
              onClick={triggerManualSync}
              disabled={syncStatus === 'syncing'}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'syncing' ? 'Reconciling...' : 'Sync Cloud Master'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm flex flex-wrap gap-1.5">
        {[
          { id: 'overview', label: '1. Architecture & Model', icon: <Layers className="w-4 h-4" /> },
          { id: 'terminals', label: `2. Device Fleet (${connectedDevices.length})`, icon: <Monitor className="w-4 h-4" /> },
          { id: 'pairing', label: '3. Pair New Device', icon: <Plus className="w-4 h-4" /> },
          { id: 'sessions', label: `4. Active Sessions (${deviceSessions.filter((s) => s.status === 'active').length})`, icon: <Activity className="w-4 h-4" /> },
          { id: 'sync-engine', label: '5. Event Delta & Conflicts', icon: <History className="w-4 h-4" /> },
          { id: 'soft-delete', label: `6. Soft-Delete Vault (${softDeletedRecords.length})`, icon: <Archive className="w-4 h-4" /> },
          { id: 'disaster-recovery', label: '7. Multi-Level Backups', icon: <HardDrive className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: ARCHITECTURE & MODEL EXPLANATION */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Active & Live Business Subscription & Fleet Limits */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            {/* Header with License Key and Developer Authorization Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-extrabold text-lg text-slate-800">
                    Business Subscription & Fleet Limits
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      subscription.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : subscription.status === 'past_due'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    STATUS: {subscription.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time package limits enforced across all paired terminals and shop branches.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Cryptographic License
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {subscription.licenseKey || `DMI-LIC-${subscription.tier.slice(0, 3).toUpperCase()}-8F42K91`}
                  </span>
                </div>

                <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-0.5">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase block">
                    Authorized Tier
                  </span>
                  <span className="font-bold text-indigo-700 text-xs">
                    {(subscription?.tier || 'Business').toUpperCase()} (KSh {(subscription?.monthlyFee ?? (subscription?.tier === 'Starter' ? 2500 : subscription?.tier === 'Enterprise' ? 25000 : 7500)).toLocaleString()}/mo)
                  </span>
                </div>

                {/* Developer Doorway Trigger */}
                <button
                  onClick={() => setIsDevConsoleOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow cursor-pointer"
                  title="Software Developer Telemetry & Remote Maintenance Console"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Developer Console</span>
                </button>
              </div>
            </div>

            {/* Live Fleet Capacity Meters (Adherence to Package Guidelines) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Terminal Fleet Meter */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Hardware Fleet Limit</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeDeviceCount} / {subscription.maxDevices} Terminals
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeDeviceCount >= subscription.maxDevices
                        ? 'bg-rose-500'
                        : activeDeviceCount >= subscription.maxDevices * 0.8
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (activeDeviceCount / subscription.maxDevices) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {activeDeviceCount >= subscription.maxDevices ? (
                    <span className="text-rose-600 font-semibold">
                      Max hardware limit reached for {subscription.tier}!
                    </span>
                  ) : (
                    `${subscription.maxDevices - activeDeviceCount} terminal slot(s) available to pair.`
                  )}
                </p>
              </div>

              {/* Physical Branches Meter */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Physical Branch Limit</span>
                  <span className="font-mono font-bold text-slate-900">
                    {branches.length} / {subscription.maxBranches} Branches
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      branches.length >= subscription.maxBranches ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (branches.length / subscription.maxBranches) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {branches.length >= subscription.maxBranches ? (
                    <span className="text-amber-700 font-semibold">
                      Branch capacity reached for {subscription.tier}.
                    </span>
                  ) : (
                    `${subscription.maxBranches - branches.length} branch slot(s) available.`
                  )}
                </p>
              </div>

              {/* Staff Accounts Meter */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Staff User Quota</span>
                  <span className="font-mono font-bold text-slate-900">
                    {employees.length} / {subscription.maxUsers} Users
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      employees.length >= subscription.maxUsers ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (employees.length / subscription.maxUsers) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {employees.length >= subscription.maxUsers ? (
                    <span className="text-rose-600 font-semibold">
                      Account quota filled for {subscription.tier}.
                    </span>
                  ) : (
                    `${subscription.maxUsers - employees.length} user slot(s) remaining.`
                  )}
                </p>
              </div>
            </div>

            {/* Package Specifications & Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(['Starter', 'Business', 'Enterprise'] as SubscriptionTier[]).map((tier) => {
                const isCurrent = subscription.tier === tier;
                const specs = {
                  Starter: {
                    branches: 1,
                    devices: 2,
                    users: 3,
                    price: 'KSh 2,500/mo',
                    features: [
                      'Single-branch POS Terminal',
                      'Max 2 Active Hardware Terminals',
                      'Max 3 Staff User Accounts',
                      'End-of-day Z-Reports',
                      'Local SQLite / IndexedDB sync',
                    ],
                  },
                  Business: {
                    branches: 5,
                    devices: 15,
                    users: 25,
                    price: 'KSh 7,500/mo',
                    features: [
                      'Up to 5 Multi-Branch Locations',
                      'Max 15 Active Hardware Terminals',
                      'Max 25 Staff Accounts & Roles',
                      'Automated M-Pesa STK Push',
                      'WhatsApp Cloud Receipts',
                      'Soft-Delete Recovery Vault',
                    ],
                  },
                  Enterprise: {
                    branches: 50,
                    devices: 200,
                    users: 500,
                    price: 'KSh 25,000/mo',
                    features: [
                      'Unlimited Fleet & 50 Branches',
                      'Max 200 Hardware Terminals',
                      'Inter-Branch Inventory Dispatch',
                      'Disaster Cloud Snapshots',
                      '24/7 Dedicated Developer SLA',
                    ],
                  },
                }[tier];

                return (
                  <div
                    key={tier}
                    className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/30 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-sm">
                        CURRENT ACTIVE PACKAGE
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className="font-extrabold text-slate-900 text-base">{tier} Package</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">{specs.price}</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-white/70 p-3 rounded-xl border border-slate-200/80">
                        <p className="flex justify-between">
                          <span>Max Branches:</span>
                          <strong className="text-slate-800">{specs.branches}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Max Terminals:</span>
                          <strong className="text-slate-800">{specs.devices}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Max Staff:</span>
                          <strong className="text-slate-800">{specs.users}</strong>
                        </p>
                      </div>

                      <ul className="text-xs text-slate-600 space-y-1.5 mb-5">
                        {specs.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      {isCurrent ? (
                        <div className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold text-center shadow-sm">
                          Active & Authorized
                        </div>
                      ) : (
                        <div className="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold text-center border border-slate-200">
                          Requires Developer Authorization
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WiFi-Style Monetization License Voucher Redemption & Offline Verification */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi className="w-4 h-4 text-amber-400" />
                    <h5 className="font-bold text-sm text-white">
                      Redeem Developer License Voucher / Token (WiFi Monetization Model)
                    </h5>
                  </div>
                  <p className="text-xs text-slate-300">
                    Enter the prepaid activation code provided by your software developer (Dave Migichi) to instantly unlock server-backed capacity. Clock starts at redemption.
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Developer Contact:</span>
                  <span className="text-xs text-amber-300 font-semibold font-mono">
                    migichidave09@gmail.com
                  </span>
                </div>
              </div>

              <form onSubmit={handleRedeemVoucher} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter Voucher Code (e.g. DMI-BIZ-7K9A-WM3X-8P4T)"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  disabled={isRedeemingVoucher}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono uppercase tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isRedeemingVoucher || !voucherInput.trim()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow"
                >
                  {isRedeemingVoucher ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>{isRedeemingVoucher ? 'Verifying...' : 'Activate Token'}</span>
                </button>
              </form>

              {voucherStatusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    voucherStatusMessage.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {voucherStatusMessage.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{voucherStatusMessage.text}</span>
                </div>
              )}

              {/* Cryptographic Offline Verification Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      Client-Side Offline License Verification
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Zero Internet Required
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestOfflineVerification}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verify Offline Signature</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">Public Authority Fingerprint:</span>
                    <div className="font-mono text-[11px] text-amber-400/90 break-all bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {signedLicense?.fingerprint || 'DMI-ED25519-AUTH-9F4B-883A'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">Signed Expiry Horizon:</span>
                    <div className="font-mono text-[11px] text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {signedLicense?.validUntil
                        ? new Date(signedLicense.validUntil).toLocaleDateString()
                        : 'Active Perpetual License'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">Cryptographic Seal:</span>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      <span>{signedLicense?.verifiedOffline !== false ? 'Signed & Validated' : 'Pending Verification'}</span>
                    </div>
                  </div>
                </div>

                {offlineVerificationResult && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                      offlineVerificationResult.valid
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {offlineVerificationResult.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span>{offlineVerificationResult.details}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONNECTED DEVICE FLEET */}
      {activeSubTab === 'terminals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Authorized Terminal Fleet</h3>
              <p className="text-xs text-slate-500">
                Track every computer, tablet, and mobile handset paired with business {businessIdentity.businessId}.
              </p>
            </div>

            <button
              onClick={() => setActiveSubTab('pairing')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pair New Terminal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {connectedDevices.map((device) => {
              const isCurrent = currentDevice.id === device.id;
              const isRevoked = device.status === 'revoked';
              const isRetired = device.status === 'retired';

              return (
                <div
                  key={device.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition relative ${
                    isCurrent
                      ? 'border-blue-500 ring-2 ring-blue-400/20'
                      : isRevoked
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      THIS PHYSICAL MACHINE
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-slate-100">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{device.name}</h4>
                        <span className="text-[11px] font-mono text-slate-500">{device.terminalNumber}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        device.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : device.status === 'revoked'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 py-3 border-y border-slate-100 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Branch:</span>
                      <span className="font-semibold text-slate-700">{device.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Role:</span>
                      <span className="font-semibold text-slate-700 capitalize">{device.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Operator:</span>
                      <span className="font-semibold text-slate-700">{device.currentStaffName || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address:</span>
                      <span className="font-mono text-slate-600">{device.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Synced:</span>
                      <span className="text-slate-600">{new Date(device.lastSyncAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Device Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!isCurrent && !isRevoked && (
                      <button
                        onClick={() => switchDeviceView(device.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Switch To This
                      </button>
                    )}

                    {!isRevoked && !isRetired ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => {
                            setReplacingDeviceId(device.id);
                            setReplacementName(`${device.name} Replacement`);
                          }}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          title="Retire damaged hardware and bring up replacement laptop with zero data loss"
                        >
                          Replace
                        </button>

                        <button
                          onClick={() => revokeDeviceAccess(device.id, 'Lost/stolen device revoked remotely')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                          title="Sever access immediately from DMi Cloud"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-rose-600 italic">
                        Access permanently blocked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Replacement Modal */}
          {replacingDeviceId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                  <Laptop className="w-5 h-5" />
                  <span>Replace Damaged Hardware Terminal</span>
                </div>
                <p className="text-xs text-slate-500">
                  This will retire the old machine and initialize a replacement device connected to business {businessIdentity.businessId}. All inventory, customers, and records will download automatically!
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Terminal Name</label>
                    <input
                      type="text"
                      value={replacementName}
                      onChange={(e) => setReplacementName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="e.g. Counter 1 Replacement Laptop"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hardware Type</label>
                    <select
                      value={replacementType}
                      onChange={(e) => setReplacementType(e.target.value as DeviceHardwareType)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="desktop_pc">Desktop PC</option>
                      <option value="laptop">Laptop Computer</option>
                      <option value="tablet">Touch POS Tablet</option>
                      <option value="phone">Mobile Phone</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setReplacingDeviceId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteReplace}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow"
                  >
                    Authorize Replacement
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PAIR NEW DEVICE WIZARD */}
      {activeSubTab === 'pairing' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Connect a New Device to this Business</h3>
            <p className="text-xs text-slate-500 mb-6">
              When you purchase a new laptop or phone, connect it using one of two secure methods.
            </p>

            {/* Method switch tabs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setPairingMethod('code')}
                className={`flex-1 p-4 rounded-xl border text-left transition cursor-pointer ${
                  pairingMethod === 'code'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Method 1: 8-Digit Activation Code</span>
                </div>
                <p className="text-xs text-slate-500">
                  Best for cashiers. Owner generates temporary code; cashier inputs it on the new terminal without needing owner credentials.
                </p>
              </button>

              <button
                onClick={() => setPairingMethod('owner')}
                className={`flex-1 p-4 rounded-xl border text-left transition cursor-pointer ${
                  pairingMethod === 'owner'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Method 2: Owner Direct Login</span>
                </div>
                <p className="text-xs text-slate-500">
                  Best for the business owner setting up their personal laptop or mobile executive dashboard.
                </p>
              </button>
            </div>

            {/* Pairing feedback banner */}
            {pairingMessage && (
              <div
                className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-xs font-medium ${
                  pairingMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {pairingMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{pairingMessage.text}</span>
              </div>
            )}

            {/* FORM 1: ACTIVATION CODE */}
            {pairingMethod === 'code' && (
              <div className="space-y-6">
                {/* Step A: Owner Generate Code Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    Step A (Owner): Generate Temporary Activation Code
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Intended Branch</label>
                      <select
                        value={selectedBranchForCode}
                        onChange={(e) => setSelectedBranchForCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Terminal Role</label>
                      <select
                        value={selectedRoleForCode}
                        onChange={(e) => setSelectedRoleForCode(e.target.value as UserRole)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="cashier">Cashier POS Terminal</option>
                        <option value="storekeeper">Warehouse & Inventory Tablet</option>
                        <option value="manager">Branch Manager Station</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleGenerateCode}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Generate Code
                      </button>
                    </div>
                  </div>

                  {lastGeneratedCode && (
                    <div className="p-3 bg-blue-100/70 border border-blue-300 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-xs text-blue-700 block">Give this code to your cashier (Valid 24h):</span>
                        <span className="font-mono text-xl font-extrabold text-blue-900 tracking-widest">
                          {lastGeneratedCode}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(lastGeneratedCode);
                          setInputCode(lastGeneratedCode);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
                      >
                        Auto-Fill Into Below
                      </button>
                    </div>
                  )}
                </div>

                {/* Step B: Input Code to Pair Form */}
                <form onSubmit={handleConnectWithCode} className="space-y-4">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
                    Step B (New Device): Enter Code on the New Hardware
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        8-Digit Activation Code *
                      </label>
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="e.g. 4K9X-88YT"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg font-mono text-base tracking-widest text-slate-800 uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Terminal Name / Identifier
                      </label>
                      <input
                        type="text"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        placeholder="e.g. Front Counter POS-03"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hardware Type</label>
                      <select
                        value={newDeviceType}
                        onChange={(e) => setNewDeviceType(e.target.value as DeviceHardwareType)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="desktop_pc">Desktop PC</option>
                        <option value="laptop">Laptop Computer</option>
                        <option value="tablet">Touch POS Tablet</option>
                        <option value="phone">Smartphone</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Branch</label>
                      <select
                        value={newDeviceBranch}
                        onChange={(e) => setNewDeviceBranch(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
                  >
                    Download Database & Authorize Terminal
                  </button>
                </form>
              </div>
            )}

            {/* FORM 2: OWNER DIRECT LOGIN */}
            {pairingMethod === 'owner' && (
              <form onSubmit={handleConnectWithOwner} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Business ID *</label>
                    <input
                      type="text"
                      value={inputBizId}
                      onChange={(e) => setInputBizId(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg font-mono text-sm uppercase"
                      required
                    />
                    <span className="text-[11px] text-slate-400">Default: {businessIdentity.businessId}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Master PIN *</label>
                    <input
                      type="password"
                      value={inputOwnerPin}
                      onChange={(e) => setInputOwnerPin(e.target.value)}
                      placeholder="Owner PIN (e.g. 1234)"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Device Label</label>
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      placeholder="e.g. Owner MacBook Pro M3"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hardware Type</label>
                    <select
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value as DeviceHardwareType)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="laptop">Laptop</option>
                      <option value="phone">Mobile Phone</option>
                      <option value="desktop_pc">Office Desktop</option>
                      <option value="tablet">iPad / Tablet</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  Authorize Owner Device & Download Full Cloud State
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ACTIVE SESSIONS & AUDIT TRACE */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Active Terminal Sessions & Operator Traceability</h3>
                <p className="text-xs text-slate-500">
                  Every action traces: Sale &rarr; Created on Terminal &rarr; Cashier &rarr; Branch &rarr; Synced to Cloud.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {deviceSessions.filter((s) => s.status === 'active').length} Active Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Terminal</th>
                    <th className="py-3 px-4">Logged-In Operator</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Session Started</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deviceSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {session.deviceName}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {session.employeeName} ({session.role})
                      </td>
                      <td className="py-3 px-4 text-slate-600">{session.branchName}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(session.startedAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{session.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            session.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {session.status === 'active' && (
                          <button
                            onClick={() => terminateDeviceSession(session.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold transition"
                          >
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: EVENT-SOURCED SYNCHRONIZATION ENGINE & CONFLICT RESOLUTION */}
      {activeSubTab === 'sync-engine' && (
        <div className="space-y-6">
          {/* Conflict resolution demonstration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Event-Sourced Delta Synchronization & Conflict Resolution
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Unlike primitive systems that overwrite totals (e.g. setting final stock = 90), DMi synchronizes mathematical deltas (e.g. <code>stock = initial (100) - Sale_A (10) - Sale_B (5) = 85</code>).
            </p>

            {conflictSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{conflictSuccessMessage}</span>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <span className="text-xs uppercase font-bold text-slate-600 tracking-wider">
                Execute Concurrent Offline Sale From Remote Physical Terminal
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Remote Terminal Device</label>
                  <select
                    value={demoSelectedTerminal}
                    onChange={(e) => setDemoSelectedTerminal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {connectedDevices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.terminalNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product Sold</label>
                  <select
                    value={demoSelectedProduct}
                    onChange={(e) => setDemoSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (Cur: {p.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity Sold Offline</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={demoQuantity}
                    onChange={(e) => setDemoQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleRunConflictDemo}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
                  >
                    Reconcile Delta
                  </button>
                </div>
              </div>
            </div>

            {/* Product Stock Reconstructed Ledger */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-800">
                    Reconstructed Event Ledger for: {inspectingProduct.name}
                  </h4>
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                    Current Stock: {inspectingProduct.stockQuantity}
                  </span>
                </div>

                <select
                  value={inspectProductId}
                  onChange={(e) => setInspectProductId(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Terminal Origin</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Event Delta</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditStockHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400">
                          No event deltas recorded for this SKU yet.
                        </td>
                      </tr>
                    ) : (
                      auditStockHistory.map((item) => (
                        <tr key={item.eventId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700">{item.deviceName}</td>
                          <td className="py-2 px-3 font-mono text-indigo-600 text-[11px] font-bold">
                            {item.type}
                          </td>
                          <td className="py-2 px-3 font-bold font-mono">
                            <span className={item.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {item.delta > 0 ? `+${item.delta}` : item.delta}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{item.note}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: SOFT-DELETE RECORDS VAULT */}
      {activeSubTab === 'soft-delete' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Non-Destructive Soft-Delete Vault</h3>
                <p className="text-xs text-slate-500">
                  In DMi, deleting a record never executes a destructive <code>DELETE FROM</code>. Records are archived with who, when, why, and can be restored anytime.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                {softDeletedRecords.length} Protected Records
              </span>
            </div>

            {softDeletedRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Vault is empty. No archived records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">Item Name / ID</th>
                      <th className="py-3 px-4">Deleted By</th>
                      <th className="py-3 px-4">Archived Reason</th>
                      <th className="py-3 px-4">Archived Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {softDeletedRecords.map((vaultItem) => (
                      <tr key={vaultItem.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-indigo-600 capitalize">
                          {vaultItem.entityType}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {vaultItem.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{vaultItem.deletedByName}</td>
                        <td className="py-3 px-4 text-slate-600 italic">"{vaultItem.reason}"</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(vaultItem.deletedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => restoreRecordFromVault(vaultItem.id)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-xs transition cursor-pointer"
                          >
                            Restore to Active
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: MULTI-LEVEL BACKUPS & DISASTER RECOVERY */}
      {activeSubTab === 'disaster-recovery' && (
        <div className="space-y-6">
          {/* Section 19: The 3 Levels of Disaster Recovery */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              The 3-Level Disaster Recovery Architecture
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Even if a server data center burns down or physical terminals are stolen, DMi guarantees zero data loss:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Level 1: Device Database</span>
                </div>
                <p className="text-xs text-slate-600">
                  Local offline cache on every terminal. Even without internet, sales and inventory changes continue uninterrupted.
                </p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>Level 2: Cloud Database</span>
                </div>
                <p className="text-xs text-indigo-700">
                  Centralized DMi Cloud Master cluster. Reconciles events across all branches in real-time.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>Level 3: Automated Snapshots</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Continuous encrypted cloud backups with SHA-256 integrity checksums for complete disaster recovery.
                </p>
              </div>
            </div>

            {/* Disaster Recovery Drill Simulation Action */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">Cloud Server Failure & Disaster Recovery Drill</h4>
                  <p className="text-xs text-slate-300">
                    Test container failover and database reconstruction from snapshots and local offline queues.
                  </p>
                </div>

                <button
                  onClick={handleRunDisasterRecovery}
                  disabled={isSimulatingDisaster}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {isSimulatingDisaster ? 'Executing Failover...' : 'Execute Recovery Drill'}
                </button>
              </div>

              {disasterDrillSteps.length > 0 && (
                <div className="bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-xs space-y-2">
                  {disasterDrillSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                  {disasterDrillDone && (
                    <p className="text-amber-300 font-bold mt-2 pt-2 border-t border-white/10">
                      DRILL VERIFIED: 100% data consistency restored under Business ID {businessIdentity.businessId}. Zero sales or inventory lost!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cloud Snapshots List & Manual Backup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-slate-800">Cloud Backup Snapshots</h4>
                <p className="text-xs text-slate-500">
                  Verified snapshots stored in DMi Cloud. Can be restored or exported off-site.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualSnapshotLabel}
                  onChange={(e) => setManualSnapshotLabel(e.target.value)}
                  placeholder="Snapshot label..."
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Create Snapshot
                </button>
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Snapshot Label</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Records Captured</th>
                    <th className="py-3 px-4">SHA-256 Checksum</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cloudBackups.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">{snap.label}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-600">{snap.type}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {snap?.timestamp ? new Date(snap.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {snap.recordsCount.products} prods, {snap.recordsCount.sales} sales, {snap.recordsCount.devices} devices
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {snap.checksum.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => restoreCloudBackupSnapshot(snap.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs transition cursor-pointer"
                        >
                          Restore State
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Developer Master Console Modal (Decoupled & Key-Protected) */}
      <DeveloperConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
      />
    </div>
  );
};

export default DeviceCloudManager;
