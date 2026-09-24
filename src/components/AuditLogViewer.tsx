import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Tag,
  Users,
  Building2,
  Lock,
  ArrowUpDown,
  Download,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  KeyRound,
  Check,
  X,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Layers,
  ListFilter,
  History,
  Sparkles,
  ArrowRight,
  GitCommit,
  FileSpreadsheet,
  HardDrive,
  Cloud,
  ShieldCheck,
  Shield,
  Package,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { AuditLogEntry, AuditActionType, AnomalyAlert } from '../types';

export const AuditLogViewer: React.FC = () => {
  const {
    auditLogs,
    anomalies,
    updateAnomalyStatus,
    employees,
    branches,
    currentEmployee,
    securityLimits,
    connectedDevices,
    currentDevice,
    supportAccessSessions,
  } = useBusiness();

  // Active View Tab: 'timeline' | 'table' | 'reconstruct' | 'support_access'
  const [activeTab, setActiveTab] = useState<'timeline' | 'table' | 'reconstruct' | 'support_access'>('timeline');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');

  // Transaction Reconstruction State
  const [reconstructTarget, setReconstructTarget] = useState<string>('INV-00452');
  const [customReconstructInput, setCustomReconstructInput] = useState<string>('');

  // Extract all unique devices from connectedDevices AND historical auditLogs
  const availableDevices = useMemo(() => {
    const map = new Map<string, { id: string; name: string; terminalNumber?: string; type?: string }>();
    
    // Add active connected devices
    connectedDevices.forEach((d) => {
      map.set(d.id, { id: d.id, name: d.name, terminalNumber: d.terminalNumber, type: d.type });
    });

    // Add devices recorded in audit logs
    auditLogs.forEach((log) => {
      if (log.deviceId && !map.has(log.deviceId)) {
        map.set(log.deviceId, {
          id: log.deviceId,
          name: log.deviceName || log.deviceId,
          terminalNumber: log.terminalNumber,
          type: 'desktop',
        });
      }
    });

    return Array.from(map.values());
  }, [connectedDevices, auditLogs]);

  // Filter anomalies
  const activeAnomalies = useMemo(() => {
    return anomalies.filter((a) => a.status === 'flagged');
  }, [anomalies]);

  // Filter logs based on Device, Branch, Employee, Action, and Search Query
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;
      if (selectedBranch !== 'all' && log.branchId !== selectedBranch) return false;
      if (selectedUser !== 'all' && log.userId !== selectedUser) return false;
      if (selectedDevice !== 'all' && log.deviceId !== selectedDevice) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = (log.targetDescription || '').toLowerCase().includes(query);
        const matchesUser = (log.userName || '').toLowerCase().includes(query);
        const matchesNotes = log.notes ? (log.notes || '').toLowerCase().includes(query) : false;
        const matchesApprover = log.approvedBy ? (log.approvedBy || '').toLowerCase().includes(query) : false;
        const matchesTerminal = log.terminalNumber ? (log.terminalNumber || '').toLowerCase().includes(query) : false;
        const matchesDevice = log.deviceName ? (log.deviceName || '').toLowerCase().includes(query) : false;
        const matchesRelated = log.relatedEntityId ? (log.relatedEntityId || '').toLowerCase().includes(query) : false;

        if (
          !matchesDesc &&
          !matchesUser &&
          !matchesNotes &&
          !matchesApprover &&
          !matchesTerminal &&
          !matchesDevice &&
          !matchesRelated
        ) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, selectedAction, selectedBranch, selectedUser, selectedDevice, searchQuery]);

  // Group filtered logs by date for Timeline View
  const groupedTimelineLogs = useMemo(() => {
    const groups: { [dateStr: string]: AuditLogEntry[] } = {};
    filteredLogs.forEach((log) => {
      const dateObj = new Date(log.timestamp);
      const today = new Date();
      const isToday =
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear();

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isYesterday =
        dateObj.getDate() === yesterday.getDate() &&
        dateObj.getMonth() === yesterday.getMonth() &&
        dateObj.getFullYear() === yesterday.getFullYear();

      let header = dateObj.toLocaleDateString('en-KE', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (isToday) header = `Today — ${header}`;
      else if (isYesterday) header = `Yesterday — ${header}`;

      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(log);
    });

    return Object.entries(groups);
  }, [filteredLogs]);

  // Action Badge Styles & Configuration
  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'void_sale':
        return {
          label: 'VOIDED SALE',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dotBg: 'bg-rose-500',
          icon: RotateCcw,
        };
      case 'discount_applied':
      case 'discount_override':
        return {
          label: 'DISCOUNT OVERRIDE',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dotBg: 'bg-amber-500',
          icon: Tag,
        };
      case 'price_change':
        return {
          label: 'PRICE EDIT',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          dotBg: 'bg-indigo-500',
          icon: ArrowUpDown,
        };
      case 'stock_adjustment':
        return {
          label: 'STOCK ADJUST',
          bg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          dotBg: 'bg-cyan-500',
          icon: FileText,
        };
      case 'transfer_approval':
      case 'transfer_request':
        return {
          label: 'STOCK TRANSFER',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dotBg: 'bg-blue-500',
          icon: Package,
        };
      case 'debt_payment':
        return {
          label: 'DEBT RECOVERY',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotBg: 'bg-emerald-500',
          icon: CreditCard,
        };
      case 'device_activated':
      case 'device_switch':
      case 'device_code_generated':
        return {
          label: 'DEVICE FLEET',
          bg: 'bg-sky-100 text-sky-800 border-sky-200',
          dotBg: 'bg-sky-500',
          icon: Monitor,
        };
      case 'device_revoked':
      case 'device_replaced':
        return {
          label: 'DEVICE REVOCATION',
          bg: 'bg-red-100 text-red-800 border-red-200',
          dotBg: 'bg-red-500',
          icon: Lock,
        };
      case 'sale_sync_reconciliation':
      case 'sync_completed':
        return {
          label: 'SYNC RECONCILE',
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          dotBg: 'bg-teal-500',
          icon: Cloud,
        };
      case 'backup_created':
      case 'disaster_recovery_restore':
        return {
          label: 'DISASTER BACKUP',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotBg: 'bg-emerald-500',
          icon: ShieldCheck,
        };
      case 'permission_change':
        return {
          label: 'SECURITY PERMISSION',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dotBg: 'bg-purple-500',
          icon: KeyRound,
        };
      case 'employee_status':
        return {
          label: 'STAFF STATUS',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dotBg: 'bg-blue-500',
          icon: Users,
        };
      case 'security_limit_change':
        return {
          label: 'SECURITY THRESHOLD',
          bg: 'bg-red-100 text-red-800 border-red-200',
          dotBg: 'bg-red-500',
          icon: Lock,
        };
      default:
        return {
          label: action.replace(/_/g, ' ').toUpperCase(),
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dotBg: 'bg-slate-400',
          icon: Eye,
        };
    }
  };

  // Helper for Device Hardware Icon
  const getDeviceIcon = (terminalNumber?: string, deviceName?: string) => {
    const lower = `${terminalNumber || ''} ${deviceName || ''}`.toLowerCase();
    if (lower.includes('tab') || lower.includes('tablet')) return Tablet;
    if (lower.includes('mob') || lower.includes('phone') || lower.includes('handset')) return Smartphone;
    if (lower.includes('laptop')) return Laptop;
    return Monitor;
  };

  // Export CSV Functionality
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Device/Terminal',
      'Branch',
      'User',
      'Role',
      'Action',
      'Target',
      'Old Value',
      'New Value',
      'Approved By',
      'Notes',
      'Related Entity',
    ];
    const rows = filteredLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.terminalNumber || log.deviceName || 'Primary'}"`,
      `"${log.branchName || 'Head Office'}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.action}"`,
      `"${log.targetDescription.replace(/"/g, '""')}"`,
      `"${(log.oldValue || '').replace(/"/g, '""')}"`,
      `"${(log.newValue || '').replace(/"/g, '""')}"`,
      `"${(log.approvedBy || '').replace(/"/g, '""')}"`,
      `"${(log.notes || '').replace(/"/g, '""')}"`,
      `"${log.relatedEntityId || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DMi_Audit_Timeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Launching Transaction History Reconstruction for a specific receipt or entity
  const triggerReconstruction = (entityId: string) => {
    setReconstructTarget(entityId);
    setActiveTab('reconstruct');
  };

  // Gather all events related to reconstructTarget
  const reconstructedEvents = useMemo(() => {
    if (!reconstructTarget) return [];
    const target = (reconstructTarget || '').toLowerCase();
    return auditLogs.filter((log) => {
      const related = (log.relatedEntityId || '').toLowerCase();
      const desc = (log.targetDescription || '').toLowerCase();
      const notes = (log.notes || '').toLowerCase();
      return related === target || desc.includes(target) || notes.includes(target);
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Chronological order
  }, [auditLogs, reconstructTarget]);

  // Has active filters?
  const hasActiveFilters =
    searchQuery !== '' ||
    selectedAction !== 'all' ||
    selectedBranch !== 'all' ||
    selectedUser !== 'all' ||
    selectedDevice !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAction('all');
    setSelectedBranch('all');
    setSelectedUser('all');
    setSelectedDevice('all');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: The Owner's Digital Security Camera */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Audit Camera & Transaction Timeline</h2>
              <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Immutable Event Stream
              </span>
            </div>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Every cashier price edit, manager discount override, hardware terminal event, inventory adjustment, and voided receipt is permanently tracked in chronological order with supervisor PIN verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Mode View Switcher: Visual Timeline vs Tabular Ledger vs Transaction Reconstruction */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Visual Timeline Stream</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
              {filteredLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tabular Ledger View</span>
          </button>

          <button
            onClick={() => setActiveTab('reconstruct')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reconstruct'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Reconstruct Transaction History</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <button
            onClick={() => setActiveTab('support_access')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'support_access'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>DMi Support Access Log</span>
            {supportAccessSessions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                {supportAccessSessions.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2">
          {hasActiveFilters ? (
            <span className="text-blue-600 font-semibold flex items-center gap-1.5">
              <span>Filtered ({filteredLogs.length} events)</span>
              <button
                onClick={resetFilters}
                className="underline hover:text-blue-800 cursor-pointer"
              >
                Clear all
              </button>
            </span>
          ) : (
            <span>Showing all {auditLogs.length} recorded events</span>
          )}
        </div>
      </div>

      {/* Anomaly Detection Alerts (Priority Security Attention) */}
      {activeAnomalies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                DMi Anomaly Detection System ({activeAnomalies.length} Flagged)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Autonomous pattern analyzer active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  anomaly.severity === 'high'
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-amber-50/70 border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        anomaly.severity === 'high'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {anomaly.severity.toUpperCase()} RISK • {anomaly.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{anomaly.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed mb-3">{anomaly.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-3 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {anomaly.branchName}
                    </span>
                    {anomaly.employeeName && (
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {anomaly.employeeName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => updateAnomalyStatus(anomaly.id, 'reviewed')}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark as Reviewed
                  </button>
                  <button
                    onClick={() => updateAnomalyStatus(anomaly.id, 'dismissed')}
                    className="py-1.5 px-3 rounded-lg hover:bg-rose-100 text-xs font-semibold text-slate-500 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Dimensional Filter & Search Bar: Device, Branch, Employee, Action */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timeline by receipt # (e.g. INV-00452), staff, note, SKU, terminal..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Device Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Devices ({availableDevices.length})</option>
                {availableDevices.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.terminalNumber ? `[${dev.terminalNumber}] ` : ''}
                    {dev?.name || 'Terminal'}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Branch Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Branches ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b?.name || 'Branch'}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Employee Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Staff ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp?.name || 'Staff'} ({(emp?.role || 'staff').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Action Type Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Action Types</option>
                <option value="void_sale">Voided Sales</option>
                <option value="discount_applied">Discounts & Overrides</option>
                <option value="price_change">Price Changes</option>
                <option value="stock_adjustment">Stock Adjustments</option>
                <option value="device_activated">Device Fleet & Security</option>
                <option value="sale_sync_reconciliation">Cloud Sync & Reconcile</option>
                <option value="debt_payment">Debt Collections</option>
                <option value="transfer_approval">Stock Transfers</option>
                <option value="permission_change">Permissions & PINs</option>
                <option value="backup_created">Disaster Recovery Snapshots</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Presets Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <ListFilter className="w-3 h-3" /> Quick Filter:
          </span>
          <button
            onClick={() => setSelectedAction('void_sale')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedAction === 'void_sale'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Voided Sales ({auditLogs.filter((l) => l.action === 'void_sale').length})
          </button>
          <button
            onClick={() => setSelectedAction('discount_applied')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedAction === 'discount_applied' || selectedAction === 'discount_override'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Discount Overrides ({auditLogs.filter((l) => l.action.includes('discount')).length})
          </button>
          <button
            onClick={() => setSelectedAction('price_change')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedAction === 'price_change'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Price Edits ({auditLogs.filter((l) => l.action === 'price_change').length})
          </button>
          <button
            onClick={() => setSelectedAction('stock_adjustment')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedAction === 'stock_adjustment'
                ? 'bg-cyan-600 text-white'
                : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            Stock Adjustments ({auditLogs.filter((l) => l.action === 'stock_adjustment').length})
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: VISUAL TIMELINE STREAM
          ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No timeline events match criteria</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Try adjusting your device, branch, employee, or action filters above to see more historical events.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            groupedTimelineLogs.map(([dateHeader, dayLogs]) => (
              <div key={dateHeader} className="space-y-4">
                {/* Date Milestone Header */}
                <div className="flex items-center gap-3 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm py-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dateHeader}</span>
                  </div>
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[11px] font-medium text-slate-400">
                    {dayLogs.length} {dayLogs.length === 1 ? 'event' : 'events'} recorded
                  </span>
                </div>

                {/* Timeline Node Stream */}
                <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {dayLogs.map((log) => {
                    const badge = getActionBadge(log.action);
                    const ActionIcon = badge.icon;
                    const DeviceIcon = getDeviceIcon(log.terminalNumber, log.deviceName);
                    const logDate = new Date(log.timestamp);
                    const timeStr = logDate.toLocaleTimeString('en-KE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline Node Pin */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white ${badge.dotBg} transition-transform group-hover:scale-110`}
                        >
                          <ActionIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>

                        {/* Event Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-4">
                          {/* Card Top Metadata: Time, Action, Device, Branch */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Time Tag */}
                              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {timeStr}
                              </span>

                              {/* Action Category Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                              >
                                <ActionIcon className="w-3 h-3" />
                                {badge.label}
                              </span>

                              {/* Device Badge */}
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                <DeviceIcon className="w-3 h-3 text-blue-500" />
                                <span className="font-bold text-slate-800">
                                  {log.terminalNumber || 'POS-01'}
                                </span>
                                <span className="hidden sm:inline text-slate-400">•</span>
                                <span className="hidden sm:inline text-slate-600">
                                  {log.deviceName || 'Local Terminal'}
                                </span>
                              </span>

                              {/* Branch Badge */}
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{log.branchName || 'Head Office'}</span>
                              </span>
                            </div>

                            {/* Reconstruct Lifecycle Button */}
                            {(log.relatedEntityId || log.action === 'void_sale' || log.action === 'discount_applied') && (
                              <button
                                onClick={() =>
                                  triggerReconstruction(
                                    log.relatedEntityId || log.targetDescription.match(/#?INV-\d+/i)?.[0] || log.id
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                                title="Reconstruct the complete step-by-step history of this transaction"
                              >
                                <Layers className="w-3 h-3 text-indigo-500" />
                                <span>Reconstruct Journey</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          {/* Event Summary / Target */}
                          <div className="pt-3">
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {log.targetDescription}
                            </h4>

                            {/* Before & After Diff Box (if values exist) */}
                            {(log.oldValue || log.newValue) && (
                              <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                                {log.oldValue && (
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                      Before:
                                    </span>
                                    <span className="font-mono line-through text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                      {log.oldValue}
                                    </span>
                                  </div>
                                )}

                                {log.oldValue && log.newValue && (
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                                )}

                                {log.newValue && (
                                  <div className="flex items-center gap-1.5 text-emerald-800">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">
                                      After:
                                    </span>
                                    <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 text-emerald-900">
                                      {log.newValue}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Notes / Reason */}
                            {log.notes && (
                              <div className="mt-2 text-xs text-slate-600 bg-amber-50/50 border-l-2 border-amber-400 pl-2.5 py-1 italic">
                                "{log.notes}"
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Operator Persona, Supervisor Approval PIN, Entity */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[11px]">Initiated by:</span>
                              <span className="font-bold text-slate-800 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                {log.userName}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {log.userRole}
                              </span>
                            </div>

                            {/* Supervisor Authorization Stamp */}
                            <div className="flex items-center gap-1.5">
                              {log.approvedBy ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Authorized: {log.approvedBy}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Standard Terminal Operation
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: TABULAR LEDGER VIEW
          ========================================================================= */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Device / Terminal</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Staff Persona</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Before / After</th>
                  <th className="py-3 px-4">Authorization</th>
                  <th className="py-3 px-4 text-right">Reconstruct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No audit records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badge = getActionBadge(log.action);
                    const Icon = badge.icon;
                    const DeviceIcon = getDeviceIcon(log.terminalNumber, log.deviceName);
                    const date = new Date(log.timestamp);
                    const formattedDate = date.toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = date.toLocaleTimeString('en-KE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Date & Time */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{formattedDate}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {formattedTime}
                          </div>
                        </td>

                        {/* Device / Terminal */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <DeviceIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-900 font-mono">
                                {log.terminalNumber || 'POS-01'}
                              </span>
                              <div className="text-[10px] text-slate-500">
                                {log.deviceName || 'Local Terminal'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>

                        {/* Staff */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{log.userName}</div>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
                            {log.userRole}
                          </span>
                        </td>

                        {/* Branch */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-slate-700 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {log.branchName || 'Head Office'}
                          </span>
                        </td>

                        {/* Event Details */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {log.targetDescription}
                          </div>
                          {log.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              "{log.notes}"
                            </div>
                          )}
                        </td>

                        {/* Before / After */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {log.oldValue || log.newValue ? (
                            <div className="flex flex-col gap-0.5 text-[11px]">
                              {log.oldValue && (
                                <span className="text-rose-600 line-through">
                                  Old: {log.oldValue}
                                </span>
                              )}
                              {log.newValue && (
                                <span className="text-emerald-700 font-semibold">
                                  New: {log.newValue}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Supervisor Approval */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {log.approvedBy ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {log.approvedBy}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Auto-logged</span>
                          )}
                        </td>

                        {/* Action Link */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() =>
                              triggerReconstruction(
                                log.relatedEntityId || log.targetDescription.match(/#?INV-\d+/i)?.[0] || log.id
                              )
                            }
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                            title="Inspect Transaction Reconstruction"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: TRANSACTION HISTORY RECONSTRUCTION FORENSIC VIEW
          ========================================================================= */}
      {activeTab === 'reconstruct' && (
        <div className="space-y-6">
          {/* Forensic Header */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold">Transaction History Reconstruction Engine</h3>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full uppercase">
                    Forensic Proof
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Reconstruct the complete chronological lifecycle of any sales receipt, invoice, stock movement, or price adjustment across physical terminals, cashiers, and supervisor authorizations.
                </p>
              </div>

              {/* Target Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customReconstructInput}
                  onChange={(e) => setCustomReconstructInput(e.target.value)}
                  placeholder="Enter Receipt # (e.g. INV-00452)..."
                  className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => {
                    if (customReconstructInput.trim()) {
                      setReconstructTarget(customReconstructInput.trim());
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Reconstruct
                </button>
              </div>
            </div>

            {/* Quick Presets for Demo Reconstruction */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Inspect Case Studies:</span>
              <button
                onClick={() => setReconstructTarget('INV-00452')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reconstructTarget === 'INV-00452'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sale #INV-00452 (Full Void & Reversal Lifecycle)
              </button>
              <button
                onClick={() => setReconstructTarget('INV-00455')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reconstructTarget === 'INV-00455'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sale #INV-00455 (15% Cashier Discount Override)
              </button>
              <button
                onClick={() => setReconstructTarget('prod-1')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reconstructTarget === 'prod-1'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                SKU: Bamburi Nguvu Cement (Price Change Audit)
              </button>
              <button
                onClick={() => setReconstructTarget('TR-00231')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reconstructTarget === 'TR-00231'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Transfer #TR-00231 (Inter-Branch Transit)
              </button>
            </div>
          </div>

          {/* Active Reconstruction Target Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Target Entity: {reconstructTarget}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Lifecycle Reconstruction Report ({reconstructedEvents.length} Recorded Steps)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized from hardware terminals, cloud event journals, and supervisor approval logs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tamper-Proof Audit Match</span>
                </span>
              </div>
            </div>

            {/* Step-by-Step Flowchart / Timeline of Reconstructed Transaction */}
            {reconstructedEvents.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  No event records found matching "{reconstructTarget}"
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Please pick one of the case studies above or enter an existing receipt number like INV-00452.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-4 before:top-4 before:bottom-4 before:w-1 before:bg-indigo-100">
                  {reconstructedEvents.map((step, idx) => {
                    const badge = getActionBadge(step.action);
                    const StepIcon = badge.icon;
                    const DeviceIcon = getDeviceIcon(step.terminalNumber, step.deviceName);
                    const stepTime = new Date(step.timestamp).toLocaleString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <div key={step.id} className="relative group">
                        {/* Step Marker Pin */}
                        <div className="absolute -left-8 top-3 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center font-bold text-xs text-white bg-indigo-600">
                          {idx + 1}
                        </div>

                        {/* Step Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-300 transition">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {stepTime}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                              >
                                <StepIcon className="w-3 h-3" />
                                {badge.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                                <DeviceIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-bold text-slate-800 font-mono">
                                  {step.terminalNumber || 'POS-01'}
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{step.branchName || 'Nairobi Main'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-2.5">
                            <p className="text-sm font-bold text-slate-900">
                              {step.targetDescription}
                            </p>

                            {(step.oldValue || step.newValue) && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200/80">
                                {step.oldValue && (
                                  <span className="text-slate-500">
                                    <strong className="text-slate-400">Previous:</strong>{' '}
                                    <span className="line-through text-rose-600">{step.oldValue}</span>
                                  </span>
                                )}
                                {step.oldValue && step.newValue && (
                                  <ArrowRight className="w-3 h-3 text-slate-400" />
                                )}
                                {step.newValue && (
                                  <span className="text-emerald-800 font-bold">
                                    <strong className="text-emerald-600">State:</strong> {step.newValue}
                                  </span>
                                )}
                              </div>
                            )}

                            {step.notes && (
                              <p className="text-xs text-slate-600 mt-1.5 italic bg-amber-50/70 p-2 rounded border border-amber-200/50">
                                "{step.notes}"
                              </p>
                            )}

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>Operator:</span>
                                <strong className="text-slate-800">{step.userName}</strong>
                                <span className="uppercase text-[9px] font-bold px-1 bg-slate-200 rounded">
                                  {step.userRole}
                                </span>
                              </span>

                              {step.approvedBy && (
                                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Supervisor Sign-Off: {step.approvedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Forensic Summary Footer */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3 mt-6">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-1">
                    <p className="font-bold">DMi Tamper-Proof Audit Seal</p>
                    <p className="text-emerald-800 leading-relaxed">
                      This transaction trail is reconstructed directly from cryptographic event deltas logged across hardware terminals. No manual deletions, adjustments, or overwrites are permitted. All supervisor authorizations have been validated against assigned manager PINs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DMi SUPPORT ACCESS LOG (CUSTOMER TRANSPARENCY) */}
      {activeTab === 'support_access' && (
        <div className="space-y-6">
          {/* Transparency Banner */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-amber-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight">Customer Data Sovereignty & Support Access Log</h2>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Tenant Isolation
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
                    DMi platform staff do not own or casually browse your business data. Whenever customer support or engineers access your account for technical troubleshooting, it is strictly recorded here with the exact reason and time limits.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-white">Default Isolation: Active</div>
                  <div className="text-[11px] text-slate-400">Sales & Profit ❌ Hidden from DMi Staff</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Requested Card Format & Live Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standard Example Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Audit Session Card Standard</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Format
                </span>
              </div>

              <div className="mt-4 font-mono text-xs space-y-1.5 text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-amber-400 font-bold text-sm mb-2">SUPPORT ACCESS</div>
                <div><span className="text-slate-500">Administrator:</span> <span className="text-white font-semibold">DMi Admin</span></div>
                <div><span className="text-slate-500">Business:</span> <span className="text-white font-semibold">ABC Hardware</span></div>
                <div><span className="text-slate-500">Reason:</span> <span className="text-white font-semibold">Investigating sales discrepancy</span></div>
                <div><span className="text-slate-500">Access started:</span> <span className="text-white font-semibold">14 Sept 2026 10:32</span></div>
                <div><span className="text-slate-500">Access ended:</span> <span className="text-white font-semibold">14 Sept 2026 10:47</span></div>
                <div><span className="text-slate-500">Data accessed:</span> <span className="text-white font-semibold">Sales report, Sales transactions</span></div>
                <div><span className="text-slate-500">Actions:</span> <span className="text-emerald-400 font-bold">VIEW ONLY</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-slate-400 font-bold">CLOSED</span></div>
              </div>
            </div>

            {/* Active & Recorded Sessions in Current Tenant */}
            <div className="space-y-4">
              {supportAccessSessions && supportAccessSessions.length > 0 ? (
                supportAccessSessions.map((session) => {
                  const isActive = session.status === 'active' || (!session.endedAt && session.expiresAt && new Date(session.expiresAt).getTime() > Date.now());
                  return (
                    <div
                      key={session.id}
                      className={`rounded-2xl p-5 border transition ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            SUPPORT ACCESS RECORD
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? 'ACTIVE NOW' : 'CLOSED'}
                        </span>
                      </div>

                      <div className="mt-3 font-mono text-xs space-y-1 text-slate-700">
                        <div>
                          <span className="text-slate-400">Administrator:</span>{' '}
                          <span className="font-bold text-slate-900">{session.adminName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Business:</span>{' '}
                          <span className="font-bold text-slate-900">{session.businessName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Reason:</span>{' '}
                          <span className="font-medium text-slate-900">{session.reason}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Access started:</span>{' '}
                          <span className="font-medium">{session.startedAt ? new Date(session.startedAt).toLocaleString() : '14 Sept 2026 10:32'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Access ended:</span>{' '}
                          <span className="font-medium">
                            {session.endedAt
                              ? new Date(session.endedAt).toLocaleString()
                              : isActive
                              ? `Active (Expires: ${session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : '30 min'})`
                              : '14 Sept 2026 10:47'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Data accessed:</span>{' '}
                          <span className="font-medium">{session.dataAccessed || 'Sales report, Sales transactions'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Actions:</span>{' '}
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {session.actions || 'VIEW ONLY'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-slate-800">No Support Access Recorded This Month</div>
                  <p className="max-w-sm mx-auto text-slate-500">
                    Your customer sales, debtor records, and margins remain strictly isolated within your private business partition.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
