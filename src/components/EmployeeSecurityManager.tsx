import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Plus,
  Sliders,
  Check,
  X,
  UserCheck,
  UserX,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Employee, EmployeePermissions, UserRole, TransactionSecurityLimits } from '../types';
import { StaffRegisterModal } from './auth/StaffRegisterModal';
import { getRoleDefaultPermissions } from '../data/mockData';

export const EmployeeSecurityManager: React.FC = () => {
  const {
    employees,
    currentEmployee,
    updateEmployee,
    addEmployee,
    toggleEmployeeStatus,
    updateEmployeePermissions,
    securityLimits,
    updateSecurityLimits,
    branches,
  } = useBusiness();

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'limits'>('employees');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Security Limits State
  const [tempLimits, setTempLimits] = useState<TransactionSecurityLimits>(() => ({
    maxDiscountWithoutApprovalPercent: securityLimits?.maxDiscountWithoutApprovalPercent ?? 5,
    refundSmallLimit: securityLimits?.refundSmallLimit ?? 2000,
    refundMediumLimit: securityLimits?.refundMediumLimit ?? 20000,
    maxRefundWithoutApprovalAmount:
      securityLimits?.maxRefundWithoutApprovalAmount ?? securityLimits?.refundSmallLimit ?? 2000,
    maxRefundManagerApprovalAmount:
      securityLimits?.maxRefundManagerApprovalAmount ?? securityLimits?.refundMediumLimit ?? 20000,
    requireApprovalForPriceChange: securityLimits?.requireApprovalForPriceChange ?? true,
    requireApprovalForStockAdjustment: securityLimits?.requireApprovalForStockAdjustment ?? true,
  }));
  const [limitsSaved, setLimitsSaved] = useState(false);

  // Sync tempLimits if securityLimits changes in context
  useEffect(() => {
    setTempLimits({
      maxDiscountWithoutApprovalPercent: securityLimits?.maxDiscountWithoutApprovalPercent ?? 5,
      refundSmallLimit: securityLimits?.refundSmallLimit ?? 2000,
      refundMediumLimit: securityLimits?.refundMediumLimit ?? 20000,
      maxRefundWithoutApprovalAmount:
        securityLimits?.maxRefundWithoutApprovalAmount ?? securityLimits?.refundSmallLimit ?? 2000,
      maxRefundManagerApprovalAmount:
        securityLimits?.maxRefundManagerApprovalAmount ?? securityLimits?.refundMediumLimit ?? 20000,
      requireApprovalForPriceChange: securityLimits?.requireApprovalForPriceChange ?? true,
      requireApprovalForStockAdjustment: securityLimits?.requireApprovalForStockAdjustment ?? true,
    });
  }, [securityLimits]);

  const isOwner = currentEmployee.role === 'owner';
  const isManager = currentEmployee.role === 'manager';

  const handleSavePermissions = () => {
    if (editingEmployee) {
      updateEmployeePermissions(editingEmployee.id, editingEmployee.permissions);
      setEditingEmployee(null);
    }
  };

  const getPermission = (key: keyof EmployeePermissions): boolean => {
    if (!key || typeof key !== 'string' || !editingEmployee || !editingEmployee.permissions) return false;
    const canonicalKey = key.startsWith('can')
      ? key
      : (('can' + key.slice(0, 1).toUpperCase() + key.slice(1)) as keyof EmployeePermissions);
    const shortKey = key.startsWith('can')
      ? ((key.slice(3, 4).toLowerCase() + key.slice(4)) as keyof EmployeePermissions)
      : key;
    return Boolean(
      editingEmployee.permissions[canonicalKey] ??
      (editingEmployee.permissions as any)[shortKey] ??
      false
    );
  };

  const handlePermissionToggle = (key: keyof EmployeePermissions) => {
    if (editingEmployee && key && typeof key === 'string') {
      const canonicalKey = key.startsWith('can')
        ? key
        : (('can' + key.slice(0, 1).toUpperCase() + key.slice(1)) as keyof EmployeePermissions);
      const shortKey = key.startsWith('can')
        ? ((key.slice(3, 4).toLowerCase() + key.slice(4)) as keyof EmployeePermissions)
        : key;

      const currentVal = !getPermission(canonicalKey);
      const basePerms = editingEmployee.permissions || createRolePermissions(editingEmployee.role);
      const newPerms: EmployeePermissions = {
        ...basePerms,
        [canonicalKey]: currentVal,
        [shortKey]: currentVal,
      };

      setEditingEmployee({
        ...editingEmployee,
        permissions: newPerms,
      });
    }
  };

  const createRolePermissions = (role: UserRole): EmployeePermissions => {
    return getRoleDefaultPermissions(role);
  };

  const handleSaveLimits = () => {
    updateSecurityLimits(tempLimits);
    setLimitsSaved(true);
    setTimeout(() => setLimitsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Employee Control & Access Security</h2>
              <span className="text-[11px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                5-Layer RBAC
              </span>
            </div>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              "The owner should see everything, managers see what they need, and employees see only what they need to do their job."
              Empower your team with fast checkout while protecting company profit, customer lists, and financial reports.
            </p>
          </div>
        </div>

        {(isOwner || isManager) && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Staff
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'employees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Directory & Roles ({employees.length})
        </button>
        <button
          onClick={() => setActiveSubTab('limits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'limits'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Transaction Security Thresholds
        </button>
      </div>

      {/* Tab 1: Staff Directory by Branch Hierarchy */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          {/* Visual Business Tree Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Business Organization & Branch Staffing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {branches.map((b) => {
                const branchStaff = employees.filter((e) => e.branchId === b.id);
                return (
                  <div key={b.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" /> {b.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {branchStaff.length} Staff
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{b.location}</p>
                    <div className="flex flex-wrap gap-1">
                      {branchStaff.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-700"
                        >
                          {s.name} ({s.role})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
              const isOwnerUser = emp.role === 'owner';
              const isActive = emp.status === 'active';

              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                    !isActive ? 'opacity-50 border-slate-200 bg-slate-50' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{emp.name}</h4>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              emp.role === 'owner'
                                ? 'bg-purple-100 text-purple-800'
                                : emp.role === 'manager'
                                ? 'bg-blue-100 text-blue-800'
                                : emp.role === 'storekeeper'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {emp.role}
                          </span>
                        </div>
                      </div>

                      {/* Status toggle */}
                      {!isOwnerUser && isOwner && (
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id)}
                          title={isActive ? 'Deactivate account' : 'Activate account'}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isActive
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                          }`}
                        >
                          {isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-100 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Assigned Branch:</span>
                        <span className="font-semibold text-slate-800">{emp.branchName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Terminal PIN:</span>
                        <span className="font-mono font-bold text-slate-800">{emp.pin}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-medium text-slate-700">{emp.phone}</span>
                      </div>
                    </div>

                    {/* Active Permissions Summary */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Permission Highlights:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(emp.permissions?.canCreateSale ?? emp.permissions?.createSale) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            POS Sales
                          </span>
                        )}
                        {(emp.permissions?.canGiveDiscount ?? emp.permissions?.giveDiscount) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Discount
                          </span>
                        )}
                        {(emp.permissions?.canViewProfit ?? emp.permissions?.viewProfit) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            View Profit
                          </span>
                        )}
                        {(emp.permissions?.canAdjustStock ?? emp.permissions?.adjustStock) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                            Stock Adjust
                          </span>
                        )}
                        {(emp.permissions?.canApproveTransfers ?? emp.permissions?.approveTransfers) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            IBT Transfer
                          </span>
                        )}
                        {(emp.permissions?.canViewFinancialReports ?? emp.permissions?.viewFinancialReports) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Financial P&L
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit permissions button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isActive ? 'Active on POS' : 'Suspended'}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() =>
                          setEditingEmployee({
                            ...emp,
                            permissions: {
                              ...createRolePermissions(emp.role || 'cashier'),
                              ...(emp.permissions || {}),
                            },
                          })
                        }
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Security Thresholds & Approval Rules */}
      {activeSubTab === 'limits' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transaction Security Limits</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set automated boundaries to prevent unauthorized cash leakage, deep cashier discounts, and unrecorded refunds.
            </p>
          </div>

          <div className="space-y-4">
            {/* Limit 1: Max discount without approval */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Maximum Discount Allowed Without Supervisor PIN</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Any cashier discount higher than this percentage triggers the Manager PIN Approval modal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempLimits.maxDiscountWithoutApprovalPercent ?? 5}
                  onChange={(e) =>
                    setTempLimits({
                      ...tempLimits,
                      maxDiscountWithoutApprovalPercent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-20 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg text-center"
                />
                <span className="text-xs font-semibold text-slate-700">%</span>
              </div>
            </div>

            {/* Limit 2: Cashier Refund Limit */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Small Refund Auto-Approval Threshold</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refunds/returns under this amount can be processed by a cashier directly.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">KSh</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={tempLimits.maxRefundWithoutApprovalAmount ?? 2000}
                  onChange={(e) =>
                    setTempLimits({
                      ...tempLimits,
                      maxRefundWithoutApprovalAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-28 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg text-right"
                />
              </div>
            </div>

            {/* Limit 3: Owner Refund Threshold */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Large Refund Owner Approval Threshold</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refunds above this threshold require the Business Owner PIN (Managers cannot approve alone).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">KSh</span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={tempLimits.maxRefundManagerApprovalAmount ?? 20000}
                  onChange={(e) =>
                    setTempLimits({
                      ...tempLimits,
                      maxRefundManagerApprovalAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-28 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg text-right"
                />
              </div>
            </div>

            {/* Limit 4: Price change manager approval */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Require Supervisor PIN for Catalog Price Edits</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prevents staff from reducing selling prices at checkout or in catalog without authorization.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(tempLimits.requireApprovalForPriceChange)}
                onChange={(e) =>
                  setTempLimits({
                    ...tempLimits,
                    requireApprovalForPriceChange: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Limit 5: Stock adjustment manager approval */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Require Supervisor PIN for Stock Adjustments</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ensures all inventory shrinkage, breakages, and manual deductions are approved by management.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(tempLimits.requireApprovalForStockAdjustment)}
                onChange={(e) =>
                  setTempLimits({
                    ...tempLimits,
                    requireApprovalForStockAdjustment: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {limitsSaved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Security thresholds updated and logged!
              </span>
            ) : (
              <span className="text-xs text-slate-500">Changes take effect immediately across all terminals</span>
            )}
            <button
              onClick={handleSaveLimits}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              Save Security Limits
            </button>
          </div>
        </div>
      )}

      {/* Modal: Edit Granular Permissions */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Permissions for {editingEmployee.name}</h3>
                <p className="text-xs text-slate-400">
                  Role: {editingEmployee.role.toUpperCase()} • Branch: {editingEmployee.branchName}
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Layer 1: POS & Sales */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px] text-blue-700">
                  1. POS & Sales Operations
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Create Sales & Process Checkout</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canCreateSale')}
                      onChange={() => handlePermissionToggle('canCreateSale')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Print & Send WhatsApp Receipts</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canIssueReceipt')}
                      onChange={() => handlePermissionToggle('canIssueReceipt')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Give Custom Discounts at Register</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canGiveDiscount')}
                      onChange={() => handlePermissionToggle('canGiveDiscount')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Void / Cancel Completed Sales</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canCancelSale')}
                      onChange={() => handlePermissionToggle('canCancelSale')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Layer 2: Inventory */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px] text-indigo-700">
                  2. Inventory & Stock Control
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">View Stock Levels & Quantities</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canViewStock')}
                      onChange={() => handlePermissionToggle('canViewStock')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Adjust Physical Stock (Shrinkage / Damage)</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canAdjustStock')}
                      onChange={() => handlePermissionToggle('canAdjustStock')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Initiate Inter-Branch Transfers (IBT)</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canTransferStock')}
                      onChange={() => handlePermissionToggle('canTransferStock')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800 text-rose-700 font-bold">Delete Products from Catalog</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canDeleteProduct')}
                      onChange={() => handlePermissionToggle('canDeleteProduct')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Layer 3: Reports & Financial Privacy */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px] text-emerald-700">
                  3. Reports & Financial Privacy
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">View Cashier Daily Sales Book</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canViewDailySales')}
                      onChange={() => handlePermissionToggle('canViewDailySales')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">View Gross Profit & Product Cost Margins</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canViewProfit')}
                      onChange={() => handlePermissionToggle('canViewProfit')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">View Store Expenses & Outflows</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canViewExpenses')}
                      onChange={() => handlePermissionToggle('canViewExpenses')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800 font-bold text-purple-800">
                      View Consolidated P&L & Financial Reports
                    </span>
                    <input
                      type="checkbox"
                      checked={getPermission('canViewFinancialReports')}
                      onChange={() => handlePermissionToggle('canViewFinancialReports')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Layer 4: System Administration & Camera */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px] text-purple-700">
                  4. Governance & Audit Camera
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Inspect Security Audit Camera</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canViewAuditLogs')}
                      onChange={() => handlePermissionToggle('canViewAuditLogs')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Approve & Receive Inter-Branch Transfers</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canApproveTransfers')}
                      onChange={() => handlePermissionToggle('canApproveTransfers')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">Manage Other Employees & PINs</span>
                    <input
                      type="checkbox"
                      checked={getPermission('canManageEmployees')}
                      onChange={() => handlePermissionToggle('canManageEmployees')}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Employee / Staff Register */}
      {showAddModal && (
        <StaffRegisterModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
