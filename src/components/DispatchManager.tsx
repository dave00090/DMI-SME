import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { DispatchOrder, DispatchOrderItem, UserRole } from '../types';
import {
  Truck,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  AlertCircle,
  Building2,
  Plus,
  Trash2,
  Package,
  FileText,
  User,
  Phone,
  Hash,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Zap,
  Check,
  X,
  Printer,
  ChevronRight,
} from 'lucide-react';

export const DispatchManager: React.FC = () => {
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    products,
    dispatchOrders,
    orderDispatch,
    grantDispatchGoAhead,
    receiveDispatchOrder,
    cancelDispatchOrder,
    simulateInterBranchTransfer,
    employees,
    currentEmployee,
    setCurrentEmployee,
    interBranchTransfers,
    setActiveTab,
  } = useBusiness();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'dispatched' | 'received'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAuthorizeModalOpen, setIsAuthorizeModalOpen] = useState(false);
  const [isWaybillModalOpen, setIsWaybillModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  const [lockedOrderTarget, setLockedOrderTarget] = useState<DispatchOrder | null>(null);

  const [selectedOrderForAction, setSelectedOrderForAction] = useState<DispatchOrder | null>(null);

  // Authorization Form State
  const [authDriverName, setAuthDriverName] = useState('Juma Kamau (Canter Logistics)');
  const [authDriverPhone, setAuthDriverPhone] = useState('+254 722 889 900');
  const [authVehicleReg, setAuthVehicleReg] = useState('KDA 482J');
  const [authSecuritySeal, setAuthSecuritySeal] = useState(`SL-${Math.floor(10000 + Math.random() * 90000)}`);
  const [authDepartureNotes, setAuthDepartureNotes] = useState('Security seal inspected. Gate pass issued.');

  // Simulation Form State
  const [simSourceId, setSimSourceId] = useState(branches[0]?.id || 'branch-1');
  const [simDestId, setSimDestId] = useState(branches[1]?.id || 'branch-2');
  const [simProductId, setSimProductId] = useState(products[0]?.id || '');
  const [simQuantity, setSimQuantity] = useState(25);
  const [simulationSuccessNotice, setSimulationSuccessNotice] = useState<{
    transferNum: string;
    sourceName: string;
    destName: string;
    productName: string;
    qty: number;
    destId: string;
    isAuthorized?: boolean;
  } | null>(null);

  // Order Dispatch Form State
  const [orderSourceBranchId, setOrderSourceBranchId] = useState(branches[0]?.id || '');
  const [orderDestBranchId, setOrderDestBranchId] = useState(branches[1]?.id || '');
  const [orderUrgency, setOrderUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    Array<{
      productId: string;
      orderedQuantity: number;
      notes: string;
    }>
  >([
    {
      productId: products[0]?.id || '',
      orderedQuantity: 10,
      notes: '',
    },
  ]);

  // Permissions validation
  const userPermissions = currentEmployee?.permissions || ({} as typeof currentEmployee.permissions);
  const canOrder = Boolean(
    currentEmployee?.role === 'owner' ||
    currentEmployee?.role === 'manager' ||
    currentEmployee?.role === 'storekeeper' ||
    userPermissions.canOrderDispatch
  );

  // STRICT REQUIREMENT: Only one role has access to grant the go ahead of dispatch
  // David Migichi (Owner) is the designated authority with canAuthorizeDispatch: true
  const canAuthorize = Boolean(
    (currentEmployee?.role === 'owner' || userPermissions.canAuthorizeDispatch) &&
    currentEmployee.id === 'emp-owner' // Ensuring designated single-point authority
  );

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return dispatchOrders.filter((order) => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Branch filter
      if (selectedBranchFilter !== 'all') {
        if (order.sourceBranchId !== selectedBranchFilter && order.destBranchId !== selectedBranchFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = order.dispatchNumber.toLowerCase().includes(query);
        const matchesSource = order.sourceBranchName.toLowerCase().includes(query);
        const matchesDest = order.destBranchName.toLowerCase().includes(query);
        const matchesDriver = order.driverName?.toLowerCase().includes(query);
        const matchesVehicle = order.vehicleReg?.toLowerCase().includes(query);
        const matchesItem = order.items.some((i) => i.productName.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query));

        if (!matchesNumber && !matchesSource && !matchesDest && !matchesDriver && !matchesVehicle && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [dispatchOrders, statusFilter, selectedBranchFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const pending = dispatchOrders.filter((d) => d.status === 'pending_approval').length;
    const inTransit = dispatchOrders.filter((d) => d.status === 'dispatched').length;
    const received = dispatchOrders.filter((d) => d.status === 'received').length;
    const totalItems = dispatchOrders.reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.orderedQuantity, 0), 0);

    return { pending, inTransit, received, totalOrders: dispatchOrders.length, totalItems };
  }, [dispatchOrders]);

  // Handler: Add Item row to order
  const handleAddItemRow = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || '',
        orderedQuantity: 5,
        notes: '',
      },
    ]);
  };

  // Handler: Remove Item row
  const handleRemoveItemRow = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler: Update Item row
  const handleUpdateItemRow = (index: number, field: string, value: any) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Handler: Submit Dispatch Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOrder) {
      alert('Access Denied: You do not have permission to place dispatch orders.');
      return;
    }

    if (orderSourceBranchId === orderDestBranchId) {
      alert('Source and destination branches cannot be the same.');
      return;
    }

    const sourceBranch = branches.find((b) => b.id === orderSourceBranchId);
    const destBranch = branches.find((b) => b.id === orderDestBranchId);

    if (!sourceBranch || !destBranch) return;

    const validatedItems: DispatchOrderItem[] = orderItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Product',
        sku: prod?.sku || 'SKU',
        unit: prod?.unit || 'items',
        orderedQuantity: Number(item.orderedQuantity) || 1,
        approvedQuantity: Number(item.orderedQuantity) || 1,
        notes: item.notes,
      };
    });

    orderDispatch({
      sourceBranchId: sourceBranch.id,
      sourceBranchName: sourceBranch.name,
      destBranchId: destBranch.id,
      destBranchName: destBranch.name,
      items: validatedItems,
      urgency: orderUrgency,
      orderedBy: currentEmployee.name,
      orderedById: currentEmployee.id,
      orderedByRole: currentEmployee.role,
      notes: orderNotes,
    });

    setIsOrderModalOpen(false);
    setOrderNotes('');
    setOrderItems([{ productId: products[0]?.id || '', orderedQuantity: 10, notes: '' }]);
  };

  // Handler: Open Go-Ahead Modal
  const handleOpenGoAheadModal = (order: DispatchOrder) => {
    if (!canAuthorize) {
      setLockedOrderTarget(order);
      setIsRestrictionModalOpen(true);
      return;
    }
    setSelectedOrderForAction(order);
    setAuthSecuritySeal(`SL-${Math.floor(10000 + Math.random() * 90000)}`);
    setIsAuthorizeModalOpen(true);
  };

  const handleBlockedGoAhead = (order: DispatchOrder) => {
    setLockedOrderTarget(order);
    setIsRestrictionModalOpen(true);
  };

  // Handler: Confirm Go-Ahead Authorization
  const handleConfirmGoAhead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAction) return;

    grantDispatchGoAhead(selectedOrderForAction.id, currentEmployee.id, {
      driverName: authDriverName,
      driverPhone: authDriverPhone,
      vehicleReg: authVehicleReg,
      securitySealNumber: authSecuritySeal,
      departureNotes: authDepartureNotes,
    });

    setIsAuthorizeModalOpen(false);
    setSelectedOrderForAction(null);
  };

  // Handler: Receive Delivery
  const handleReceiveOrder = (order: DispatchOrder) => {
    receiveDispatchOrder(order.id, currentEmployee.name);
  };

  // Handler: Trigger Live Transfer Dispatch
  const handleRunSimulation = () => {
    const transfer = simulateInterBranchTransfer(simSourceId, simDestId, simProductId, simQuantity);
    const prod = products.find((p) => p.id === simProductId);
    const dst = branches.find((b) => b.id === simDestId);
    const src = branches.find((b) => b.id === simSourceId);

    setSimulationSuccessNotice({
      transferNum: transfer.transferNumber,
      sourceName: src?.name || 'Main Depot',
      destName: dst?.name || 'Nairobi CBD',
      productName: prod?.name || 'Item',
      qty: simQuantity,
      destId: dst?.id || 'branch-2',
      isAuthorized: canAuthorize,
    });

    setIsSimulateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP PERSONA TESTER & DUAL-CONTROL ACCESS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                Logistics Dual-Control Security
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">
                Multi-User Ordering & Single-Point Go-Ahead Authority
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Dispatch & Cross-Branch Fulfillment Hub</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                Live Gate Pass & Manifest
              </span>
            </h1>

            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Enforces strict segregation of duties: Different team members can order products for dispatch, while{' '}
              <strong className="text-slate-900">only one designated authority (David Migichi - Owner)</strong> can
              grant the final go-ahead to seal vehicle manifests and release stock for inter-branch transport.
            </p>
          </div>

          {/* Quick Simulation & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <button
              id="simulate-dispatch-transfer-btn"
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Live Inter-Branch Transfer</span>
            </button>

            {canOrder && (
              <button
                id="create-dispatch-order-btn"
                onClick={() => setIsOrderModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Order Dispatch</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Interactive Staff Persona Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Current Operator:</span>
            </span>

            {/* Persona Switch Buttons */}
            {employees.map((emp) => {
              const isCurrent = currentEmployee.id === emp.id;
              const hasOrder = Boolean(
                emp.role === 'owner' || emp.role === 'manager' || emp.role === 'storekeeper' || emp.permissions?.canOrderDispatch
              );
              const hasAuth = Boolean(emp.id === 'emp-owner');

              return (
                <button
                  key={emp.id}
                  onClick={() => setCurrentEmployee(emp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                  title={`${emp.name} (${emp.role})`}
                >
                  <span className="font-semibold">{emp.name.split(' ')[0]}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {hasAuth ? '👑 Go-Ahead Authority' : hasOrder ? '📦 Can Order' : '🔒 Read-Only'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Active Permissions Snapshot */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1 ${
                canOrder
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {canOrder ? <Check className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3" />}
              <span>Ordering: {canOrder ? 'Authorized' : 'Restricted'}</span>
            </span>

            <span
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1 ${
                canAuthorize
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {canAuthorize ? (
                <ShieldCheck className="w-3 h-3 text-purple-600" />
              ) : (
                <Lock className="w-3 h-3 text-rose-600" />
              )}
              <span>Go-Ahead: {canAuthorize ? 'Sole Authority (Granted)' : 'Locked (Owner Only)'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Live Transfer Feedback Banner if just triggered */}
      {simulationSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                {simulationSuccessNotice.isAuthorized
                  ? `Transfer ${simulationSuccessNotice.transferNum} Successfully Dispatched & Released!`
                  : `Dispatch Request ${simulationSuccessNotice.transferNum} Logged & Awaiting Go-Ahead!`}
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                {simulationSuccessNotice.isAuthorized ? (
                  <>
                    {simulationSuccessNotice.qty} units of {simulationSuccessNotice.productName} dispatched from{' '}
                    <strong>{simulationSuccessNotice.sourceName}</strong> and registered as incoming stock on{' '}
                    <strong>{simulationSuccessNotice.destName}</strong>. Live alerts are active on the Dashboard for both outlets.
                  </>
                ) : (
                  <>
                    {simulationSuccessNotice.qty} units of {simulationSuccessNotice.productName} requested by {currentEmployee.name}. Per dual-control rules, stock cannot be released until David Migichi (Owner) grants the Go-Ahead.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveBranchId(simulationSuccessNotice.destId);
                setActiveTab('dashboard');
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>View Receiving Dashboard Alert</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setSimulationSuccessNotice(null)}
              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. SUMMARY KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Go-Ahead */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Go-Ahead</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.pending}</span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Requires Authorizer
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Orders awaiting departure clearance</p>
        </div>

        {/* Card 2: Dispatched & In-Transit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched (In-Transit)</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.inTransit}</span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              On Road
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">En route to receiving outlets</p>
        </div>

        {/* Card 3: Successfully Received */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered & Stocked</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.received}</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Verified Inbound
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cross-branch stock verified</p>
        </div>

        {/* Card 4: Total Units Handled */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Handled</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalItems.toLocaleString()}</span>
            <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {stats.totalOrders} Orders
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all {branches.length} branches</p>
        </div>
      </div>

      {/* 3. DISPATCH LISTING & PIPELINE TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Dispatches ({dispatchOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending_approval'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Go-Ahead ({stats.pending})</span>
            </button>
            <button
              onClick={() => setStatusFilter('dispatched')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'dispatched'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>In Transit ({stats.inTransit})</span>
            </button>
            <button
              onClick={() => setStatusFilter('received')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'received'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Delivered ({stats.received})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Filter */}
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dispatch #, driver, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Dispatch Reference</th>
                <th className="py-3 px-4">Origin & Destination</th>
                <th className="py-3 px-4">Ordered Items</th>
                <th className="py-3 px-4">Ordered By</th>
                <th className="py-3 px-4">Go-Ahead Status</th>
                <th className="py-3 px-4">Transport & Driver</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Send className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-medium text-sm text-slate-600">No dispatch orders matching criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Use "Order Dispatch" or "Live Inter-Branch Transfer" above.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalUnits = order.items.reduce((s, i) => s + i.orderedQuantity, 0);
                  const isPending = order.status === 'pending_approval';
                  const isDispatched = order.status === 'dispatched';
                  const isReceived = order.status === 'received';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition group">
                      {/* Dispatch Reference */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-mono font-bold text-slate-900">{order.dispatchNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.orderedAt).toLocaleString('en-KE', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              order.urgency === 'urgent'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : order.urgency === 'high'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {order.urgency}
                          </span>
                        </div>
                      </td>

                      {/* Origin & Destination */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{order.sourceBranchName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-blue-700">{order.destBranchName}</span>
                        </div>
                        {order.securitySealNumber && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-indigo-500" />
                            <span>Seal: {order.securitySealNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Ordered Items */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {order.items.length === 1
                            ? `${order.items[0].orderedQuantity} ${order.items[0].unit} of ${order.items[0].productName}`
                            : `${totalUnits} units (${order.items.length} different items)`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {order.items.map((i) => `${i.productName} (x${i.orderedQuantity})`).join(', ')}
                        </div>
                      </td>

                      {/* Ordered By */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-slate-800">{order.orderedBy}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{order.orderedByRole}</div>
                      </td>

                      {/* Go-Ahead Status */}
                      <td className="py-3 px-4 align-top">
                        {isPending && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting Go-Ahead</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Requires David Migichi
                            </div>
                          </div>
                        )}

                        {isDispatched && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <Truck className="w-3 h-3 animate-pulse" />
                              <span>Go-Ahead Granted</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Auth by: <span className="font-semibold text-slate-700">{order.authorizedBy}</span>
                            </div>
                          </div>
                        )}

                        {isReceived && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered & Stocked</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Received by: {order.receivedBy}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Transport & Driver */}
                      <td className="py-3 px-4 align-top">
                        {order.driverName ? (
                          <div>
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-slate-400" />
                              <span>{order.driverName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {order.vehicleReg} • {order.driverPhone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned (pending auth)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right space-x-1 whitespace-nowrap">
                        {/* 1. Go-Ahead Button (Only for Designated Authorizer) */}
                        {isPending && (
                          <>
                            {canAuthorize ? (
                              <button
                                onClick={() => handleOpenGoAheadModal(order)}
                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                title="Grant Dispatch Go-Ahead (Authorizer Access)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Grant Go-Ahead</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockedGoAhead(order)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition"
                                title="Click to view why Go-Ahead is restricted under dual-control policy"
                              >
                                <Lock className="w-3 h-3 text-rose-500" />
                                <span>Go-Ahead Locked</span>
                              </button>
                            )}

                            <button
                              onClick={() => cancelDispatchOrder(order.id, 'Cancelled by operator')}
                              className="px-2 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* 2. Receive Stock In Button (When in transit) */}
                        {isDispatched && (
                          <button
                            onClick={() => handleReceiveOrder(order)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Accept Delivery & Verify Stock In"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Receipt</span>
                          </button>
                        )}

                        {/* 3. Waybill preview */}
                        <button
                          onClick={() => {
                            setSelectedOrderForAction(order);
                            setIsWaybillModalOpen(true);
                          }}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 cursor-pointer"
                          title="View Manifest Waybill"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Waybill</span>
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

      {/* 4. MODAL: ORDER DISPATCH (Multi-user ordering form) */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Step 1: Place Order
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Create Cross-Branch Dispatch Order</h3>
                <p className="text-xs text-slate-500">
                  Ordered by: <strong className="text-slate-800">{currentEmployee.name}</strong> ({currentEmployee.role}).
                  Will be queued for Go-Ahead authorization.
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Origin & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Branch (Departing From) *
                  </label>
                  <select
                    value={orderSourceBranchId}
                    onChange={(e) => setOrderSourceBranchId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) {b.isWarehouse ? '• Main Yard' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Branch (Receiving Outlet) *
                  </label>
                  <select
                    value={orderDestBranchId}
                    onChange={(e) => setOrderDestBranchId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'high', 'urgent'] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setOrderUrgency(urg)}
                      className={`py-2 text-xs font-bold rounded-xl capitalize transition cursor-pointer ${
                        orderUrgency === urg
                          ? urg === 'urgent'
                            ? 'bg-red-600 text-white shadow-xs'
                            : urg === 'high'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Line Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Dispatch Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Product</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {orderItems.map((item, index) => {
                    const selectedProd = products.find((p) => p.id === item.productId);
                    const sourceStock =
                      selectedProd?.branchStock?.[orderSourceBranchId] ??
                      Math.floor((selectedProd?.stockQuantity || 0) / 2);

                    return (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs"
                      >
                        <div className="flex-1 min-w-44">
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
                            required
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Avail at source: <strong className="text-slate-800">{sourceStock} {selectedProd?.unit}</strong>
                          </span>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            max={sourceStock || 9999}
                            value={item.orderedQuantity}
                            onChange={(e) => handleUpdateItemRow(index, 'orderedQuantity', e.target.value)}
                            placeholder="Qty"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                            required
                          />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleUpdateItemRow(index, 'notes', e.target.value)}
                            placeholder="Pack notes e.g. 2 bags, 1 crate"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                          />
                        </div>

                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  General Logistics / Destination Instructions
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special unloading directions or urgency rationale..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Dispatch Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: GRANT DISPATCH GO-AHEAD (Designated Authority Only) */}
      {isAuthorizeModalOpen && selectedOrderForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-purple-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Sole Authority Authorization Gate
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Grant Go-Ahead: {selectedOrderForAction.dispatchNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Authorized by: <strong className="text-purple-900">{currentEmployee.name}</strong> ({currentEmployee.role})
                </p>
              </div>
              <button
                onClick={() => setIsAuthorizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Manifest Summary */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Route:</span>
                <strong className="text-slate-900">
                  {selectedOrderForAction.sourceBranchName} ➔ {selectedOrderForAction.destBranchName}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ordered By:</span>
                <span className="text-slate-800">
                  {selectedOrderForAction.orderedBy} ({selectedOrderForAction.orderedByRole})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manifest:</span>
                <span className="font-mono text-slate-800">
                  {selectedOrderForAction.items
                    .map((i) => `${i.orderedQuantity} ${i.unit} ${i.productName}`)
                    .join(', ')}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmGoAhead} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transport Driver Name *
                  </label>
                  <input
                    type="text"
                    value={authDriverName}
                    onChange={(e) => setAuthDriverName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driver Phone Number
                  </label>
                  <input
                    type="text"
                    value={authDriverPhone}
                    onChange={(e) => setAuthDriverPhone(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Registration / Plate *
                  </label>
                  <input
                    type="text"
                    value={authVehicleReg}
                    onChange={(e) => setAuthVehicleReg(e.target.value)}
                    placeholder="e.g. KDA 482J"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Seal Number *
                  </label>
                  <input
                    type="text"
                    value={authSecuritySeal}
                    onChange={(e) => setAuthSecuritySeal(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departure Gate Notes
                </label>
                <input
                  type="text"
                  value={authDepartureNotes}
                  onChange={(e) => setAuthDepartureNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Authorizing the Go-Ahead will immediately deduct inventory from{' '}
                  <strong>{selectedOrderForAction.sourceBranchName}</strong>, mark the items in transit, and register
                  active alerts on both the dispatching outlet and the receiving outlet.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAuthorizeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorize Go-Ahead & Release</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: LIVE INTER-BRANCH STOCK DISPATCH */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Live Stock Transfer Pipeline
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Initiate Live Inter-Branch Transfer</h3>
                <p className="text-xs text-slate-500">
                  Registers transit immediately on both the dispatching and receiving outlets.
                </p>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Outlet (Dispatching)</label>
                <select
                  value={simSourceId}
                  onChange={(e) => setSimSourceId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Outlet (Receiving)</label>
                <select
                  value={simDestId}
                  onChange={(e) => setSimDestId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product to Transfer</label>
                  <select
                    value={simProductId}
                    onChange={(e) => setSimProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={simQuantity}
                    onChange={(e) => setSimQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
              </div>

              {canAuthorize ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900">
                  <strong>Authorized Operator Clearance:</strong>
                  <p className="mt-1 text-purple-800">
                    You are signed in as <strong>David Migichi (Owner)</strong>. This transfer will be released immediately, stock deducted from source, and live en route alerts posted on both dashboards.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  <strong>Dual-Control Authorization Required:</strong>
                  <p className="mt-1 text-amber-800">
                    You are signed in as <strong>{currentEmployee.name}</strong> ({currentEmployee.role}). This order will be queued as <strong>Pending Approval</strong> until David Migichi (Owner) grants the Go-Ahead.
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                <strong>Live System Real-Time Synchronization:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
                  <li>Registers transfer and generates Outbound Shipment Alert for dispatching branch.</li>
                  <li>Generates a live Inbound Stock Alert for receiving branch with 1-click receiving action.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Live Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6B. MODAL: DUAL-CONTROL RESTRICTION EXPLANATION */}
      {isRestrictionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Segregation of Duties Enforced</h3>
                  <p className="text-[11px] text-slate-500">Dual-Control Logistics Policy</p>
                </div>
              </div>
              <button
                onClick={() => setIsRestrictionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500">Currently Active Operator:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {currentEmployee.name} <span className="text-xs text-slate-500 font-normal">({currentEmployee.role})</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Branch: <span className="font-semibold text-slate-700">{branches.find((b) => b.id === currentEmployee.branchId)?.name || 'Main Branch'}</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Under DMi Business Enterprises logistics guidelines, multiple team members (storekeepers, cashiers, supervisors) can create and queue orders for dispatch. However, <strong className="text-slate-900">only one designated authority (David Migichi - Owner)</strong> possesses the security clearance to inspect gate passes, verify vehicle seals, and grant the final release go-ahead.
              </p>

              {lockedOrderTarget && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  <span className="font-bold">Target Order: {lockedOrderTarget.dispatchNumber}</span>
                  <div className="text-amber-800 mt-0.5">
                    Destination: {lockedOrderTarget.destBranchName} • Ordered by: {lockedOrderTarget.orderedBy}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const ownerEmp = employees.find((e) => e.id === 'emp-owner');
                    if (ownerEmp) {
                      setCurrentEmployee(ownerEmp);
                      setIsRestrictionModalOpen(false);
                      if (lockedOrderTarget) {
                        setSelectedOrderForAction(lockedOrderTarget);
                        setAuthSecuritySeal(`SL-${Math.floor(10000 + Math.random() * 90000)}`);
                        setIsAuthorizeModalOpen(true);
                      }
                    }
                  }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Switch to David Migichi (Owner) & Authorize</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: OFFICIAL KENYAN DISPATCH WAYBILL PREVIEW */}
      {isWaybillModalOpen && selectedOrderForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Inter-Branch Consignment Note & Waybill</h3>
              </div>
              <button
                onClick={() => setIsWaybillModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Consignment Sheet */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-4 text-xs font-mono bg-slate-50/50">
              <div className="flex justify-between border-b border-slate-300 pb-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">DMi BUSINESS ENTERPRISES</div>
                  <div className="text-[10px] text-slate-500">Official Inter-Branch Logistics Waybill</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{selectedOrderForAction.dispatchNumber}</div>
                  <div className="text-[10px] text-slate-500">
                    Status: {selectedOrderForAction.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Consignor (Origin):</div>
                  <div className="font-bold text-slate-800">{selectedOrderForAction.sourceBranchName}</div>
                  <div className="text-slate-600">Ordered by: {selectedOrderForAction.orderedBy}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Consignee (Destination):</div>
                  <div className="font-bold text-slate-800">{selectedOrderForAction.destBranchName}</div>
                  <div className="text-slate-600">Urgency: {selectedOrderForAction.urgency.toUpperCase()}</div>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase">
                      <th>Item Description</th>
                      <th>SKU</th>
                      <th className="text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrderForAction.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 font-bold text-slate-800">{it.productName}</td>
                        <td className="py-1 text-slate-500">{it.sku}</td>
                        <td className="py-1 text-right font-bold text-slate-900">
                          {it.orderedQuantity} {it.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Carrier & Vehicle:</div>
                  <div className="font-bold text-slate-800">
                    {selectedOrderForAction.driverName || 'Awaiting Carrier Assignment'}
                  </div>
                  <div className="text-slate-600">Plate: {selectedOrderForAction.vehicleReg || 'N/A'}</div>
                  <div className="text-slate-600">Seal #: {selectedOrderForAction.securitySealNumber || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Go-Ahead Authorization:</div>
                  <div className="font-bold text-purple-900">
                    {selectedOrderForAction.authorizedBy || 'Pending Owner Authorization'}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {selectedOrderForAction.authorizedAt
                      ? new Date(selectedOrderForAction.authorizedAt).toLocaleString('en-KE')
                      : 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Waybill</span>
              </button>
              <button
                onClick={() => setIsWaybillModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchManager;
