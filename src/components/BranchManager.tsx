import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Branch, InterBranchTransfer } from '../types';
import {
  Building2,
  Plus,
  ArrowRightLeft,
  Truck,
  CheckCircle2,
  Clock,
  Warehouse,
  Store,
  MapPin,
  Phone,
  User,
  Hash,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface BranchManagerProps {
  initialSubTab?: 'branches' | 'transfers' | 'matrix';
}

export const BranchManager: React.FC<BranchManagerProps> = ({ initialSubTab = 'branches' }) => {
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    addBranch,
    updateBranch,
    interBranchTransfers,
    createTransfer,
    dispatchTransfer,
    receiveTransfer,
    cancelTransfer,
    products,
    sales,
  } = useBusiness();

  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'transfers' | 'matrix'>(initialSubTab);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [dispatchModalTransfer, setDispatchModalTransfer] = useState<InterBranchTransfer | null>(null);

  // New Branch Form
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    location: '',
    phone: '+254 ',
    tillNumber: '',
    paybillNumber: '400200',
    accountNumber: '',
    cashierName: '',
    isWarehouse: false,
    isActive: true,
    notes: '',
  });

  // New Transfer Form
  const [newTransfer, setNewTransfer] = useState({
    sourceBranchId: branches[0]?.id || '',
    destBranchId: branches[1]?.id || '',
    productId: products[0]?.id || '',
    quantity: 1,
    driverName: '',
    vehicleReg: '',
    notes: '',
    requestedBy: 'Store Supervisor',
  });

  // Dispatch Form
  const [driverNameInput, setDriverNameInput] = useState('');
  const [vehicleRegInput, setVehicleRegInput] = useState('');

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim() || !newBranch.code.trim()) return;

    addBranch({
      ...newBranch,
      accountNumber: newBranch.accountNumber || `NH-${newBranch.code.toUpperCase()}`,
    });

    setNewBranch({
      name: '',
      code: '',
      location: '',
      phone: '+254 ',
      tillNumber: '',
      paybillNumber: '400200',
      accountNumber: '',
      cashierName: '',
      isWarehouse: false,
      isActive: true,
      notes: '',
    });
    setIsAddBranchModalOpen(false);
  };

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransfer.sourceBranchId === newTransfer.destBranchId) {
      alert('Source and destination branches must be different.');
      return;
    }
    const product = products.find((p) => p.id === newTransfer.productId);
    const sourceBranch = branches.find((b) => b.id === newTransfer.sourceBranchId);
    const destBranch = branches.find((b) => b.id === newTransfer.destBranchId);

    if (!product || !sourceBranch || !destBranch) return;

    createTransfer({
      sourceBranchId: sourceBranch.id,
      sourceBranchName: sourceBranch.name,
      destBranchId: destBranch.id,
      destBranchName: destBranch.name,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: Number(newTransfer.quantity) || 1,
      unit: product.unit,
      driverName: newTransfer.driverName,
      vehicleReg: newTransfer.vehicleReg,
      notes: newTransfer.notes,
      requestedBy: newTransfer.requestedBy,
    });

    setIsTransferModalOpen(false);
    setNewTransfer({
      sourceBranchId: branches[0]?.id || '',
      destBranchId: branches[1]?.id || '',
      productId: products[0]?.id || '',
      quantity: 1,
      driverName: '',
      vehicleReg: '',
      notes: '',
      requestedBy: 'Store Supervisor',
    });
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalTransfer) return;
    dispatchTransfer(dispatchModalTransfer.id, driverNameInput, vehicleRegInput);
    setDispatchModalTransfer(null);
    setDriverNameInput('');
    setVehicleRegInput('');
  };

  // Branch stats calculation
  const getBranchSalesToday = (branchId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return sales
      .filter((s) => s.branchId === branchId && s.timestamp.startsWith(today))
      .reduce((sum, s) => sum + s.grandTotal, 0);
  };

  const getBranchSalesCount = (branchId: string) => {
    return sales.filter((s) => s.branchId === branchId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Version 2 • Multi-Branch OS
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {branches.length} Active Locations Connected
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Multi-Branch Management & Stock Routing</h1>
          <p className="text-sm text-slate-600">
            Monitor real-time sales per outlet, dispatch Inter-Branch Stock Transfers (IBTs), and balance inventories across warehouses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>New Inter-Branch Transfer</span>
          </button>

          <button
            onClick={() => setIsAddBranchModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Outlet</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 ${
            activeSubTab === 'branches'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Store Outlets & Yards ({branches.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 relative ${
            activeSubTab === 'transfers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Inter-Branch Transfers (IBTs)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {interBranchTransfers.filter((t) => t.status === 'pending' || t.status === 'dispatched').length} Active
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 ${
            activeSubTab === 'matrix'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Cross-Branch Stock Matrix</span>
          </div>
        </button>
      </div>

      {/* TAB 1: OUTLETS & YARDS */}
      {activeSubTab === 'branches' && (
        <div className="space-y-6">
          {/* Quick Active Branch Filter Bar */}
          <div className="bg-slate-100/80 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Currently Filtered Context:</span>
              <span className="px-2.5 py-1 rounded bg-white font-mono font-bold text-blue-700 border border-slate-200">
                {activeBranchId === 'all'
                  ? '🌐 ALL BRANCHES (Consolidated Group View)'
                  : branches.find((b) => b.id === activeBranchId)?.name || 'Default Branch'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveBranchId('all')}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  activeBranchId === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Branches
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBranchId(b.id)}
                  className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                    activeBranchId === b.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {b.code} - {b.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {branches.map((branch) => {
              const salesToday = getBranchSalesToday(branch.id);
              const totalSalesCount = getBranchSalesCount(branch.id);
              const isSelected = activeBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-xl border p-5 transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            branch.isWarehouse ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {branch.isWarehouse ? <Warehouse className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{branch.name}</h3>
                          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">
                            Code: {branch.code}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          branch.isWarehouse ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {branch.isWarehouse ? 'Wholesale Godown' : 'Retail Store'}
                      </span>
                    </div>

                    {/* Metadata lines */}
                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{branch.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Cashier / Lead: {branch.cashierName}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Buy Goods Till: <strong>{branch.tillNumber}</strong></span>
                      </div>
                    </div>

                    {/* Performance metrics */}
                    <div className="mt-4 bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Today's Sales</span>
                        <span className="text-sm font-bold text-emerald-600 font-mono">
                          KSh {salesToday.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Receipts</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          {totalSalesCount} recorded
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveBranchId(branch.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active Context' : 'Set as Active Outlet'}
                    </button>

                    <button
                      onClick={() => {
                        setNewTransfer((prev) => ({ ...prev, sourceBranchId: branch.id }));
                        setIsTransferModalOpen(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Transfer Out &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INTER-BRANCH TRANSFERS */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Inter-Branch Stock Movement Log</h3>
                <p className="text-xs text-slate-500">
                  Track goods in transit between godowns and retail storefronts with proof of receipt.
                </p>
              </div>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Transfer Request</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Transfer #</th>
                    <th className="py-3 px-4">Item & Quantity</th>
                    <th className="py-3 px-4">From &rarr; To Branch</th>
                    <th className="py-3 px-4">Date & Requester</th>
                    <th className="py-3 px-4">Driver / Vehicle</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interBranchTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No stock transfers recorded yet.
                      </td>
                    </tr>
                  ) : (
                    interBranchTransfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.transferNumber}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{t.productName}</span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {t.quantity} {t.unit} • SKU: {t.sku}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-700">{t.sourceBranchName.split(' ')[0]}</span>
                            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                            <span className="text-blue-700 font-semibold">{t.destBranchName.split(' ')[0]}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{t.requestDate}</div>
                          <div className="text-[10px] text-slate-400">By {t.requestedBy}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {t.driverName ? (
                            <div>
                              <div className="font-medium text-slate-700">{t.driverName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{t.vehicleReg}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not dispatched yet</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {t.status === 'received' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Received
                            </span>
                          )}
                          {t.status === 'dispatched' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Truck className="w-3 h-3 animate-pulse" /> In Transit
                            </span>
                          )}
                          {t.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Pending Pick
                            </span>
                          )}
                          {t.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setDispatchModalTransfer(t);
                                  setDriverNameInput('Maina (Delivery Truck)');
                                  setVehicleRegInput('KDA 482J');
                                }}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer"
                              >
                                Dispatch
                              </button>
                            )}

                            {t.status === 'dispatched' && (
                              <button
                                onClick={() => receiveTransfer(t.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Receive Stock</span>
                              </button>
                            )}

                            {t.status === 'pending' && (
                              <button
                                onClick={() => cancelTransfer(t.id, 'User request')}
                                className="px-2 py-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Cancel Transfer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CROSS-BRANCH STOCK MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60">
              <h3 className="font-bold text-slate-800 text-base">Multi-Branch Inventory Balance Matrix</h3>
              <p className="text-xs text-slate-500">
                View live stock levels distributed across each individual outlet and wholesale godown.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">SKU / Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center font-bold">Total Network Stock</th>
                    {branches.map((b) => (
                      <th key={b.id} className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-800 block">{b.name.split(' ')[0]}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">({b.code})</span>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const branchStock = p.branchStock || {};
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] font-mono text-slate-500">SKU: {p.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-900 text-sm">
                          {p.stockQuantity} {p.unit}
                        </td>
                        {branches.map((b) => {
                          const qty = branchStock[b.id] ?? Math.floor(p.stockQuantity / branches.length);
                          const isLow = qty <= p.lowStockThreshold;

                          return (
                            <td key={b.id} className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-mono font-semibold ${
                                  isLow ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'text-slate-800'
                                }`}
                              >
                                {qty} {p.unit}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setNewTransfer((prev) => ({
                                ...prev,
                                productId: p.id,
                                quantity: Math.min(5, Math.max(1, Math.floor(p.stockQuantity / 2))),
                              }));
                              setIsTransferModalOpen(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            Transfer Stock &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW BRANCH */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Add New Branch or Godown</h3>
              </div>
              <button
                onClick={() => setIsAddBranchModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Westlands Branch"
                    value={newBranch.name || ''}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Branch Code (3 Letters) *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. WST"
                    value={newBranch.code || ''}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Physical Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ring Road Junction, Westlands"
                  value={newBranch.location || ''}
                  onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">M-Pesa Buy Goods Till *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5429988"
                    value={newBranch.tillNumber || ''}
                    onChange={(e) => setNewBranch({ ...newBranch, tillNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Branch Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={newBranch.phone || ''}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Store Manager / Lead Cashier</label>
                <input
                  type="text"
                  placeholder="e.g. Kelvin Otieno"
                  value={newBranch.cashierName || ''}
                  onChange={(e) => setNewBranch({ ...newBranch, cashierName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isWarehouseCheckbox"
                  checked={newBranch.isWarehouse}
                  onChange={(e) => setNewBranch({ ...newBranch, isWarehouse: e.target.checked })}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="isWarehouseCheckbox" className="font-medium text-slate-700 cursor-pointer">
                  Is this a Central Godown / Bulk Holding Yard? (Non-retail)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  Register Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INTER-BRANCH TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Initiate Inter-Branch Transfer (IBT)</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransferSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Outlet (Origin) *</label>
                  <select
                    value={newTransfer.sourceBranchId || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, sourceBranchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Destination Outlet *</label>
                  <select
                    value={newTransfer.destBranchId || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, destBranchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.id === newTransfer.sourceBranchId}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product to Transfer *</label>
                <select
                  value={newTransfer.productId || ''}
                  onChange={(e) => setNewTransfer({ ...newTransfer, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (In stock: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newTransfer.quantity ?? 1}
                    onChange={(e) => setNewTransfer({ ...newTransfer, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Requested By</label>
                  <input
                    type="text"
                    value={newTransfer.requestedBy || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, requestedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Driver Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kariuki"
                    value={newTransfer.driverName || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, driverName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle Registration</label>
                  <input
                    type="text"
                    placeholder="e.g. KDA 482J"
                    value={newTransfer.vehicleReg || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, vehicleReg: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transfer Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Urgent contractor order support"
                  value={newTransfer.notes || ''}
                  onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  Create Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH CONFIRMATION */}
      {dispatchModalTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-blue-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Dispatch Stock Shipment</h3>
              </div>
              <button
                onClick={() => setDispatchModalTransfer(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">{dispatchModalTransfer.transferNumber}</div>
                <div className="text-slate-600 mt-1">
                  Item: <strong>{dispatchModalTransfer.productName}</strong> ({dispatchModalTransfer.quantity} {dispatchModalTransfer.unit})
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Routing: {dispatchModalTransfer.sourceBranchName} &rarr; {dispatchModalTransfer.destBranchName}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Driver Name *</label>
                <input
                  type="text"
                  required
                  value={driverNameInput || ''}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vehicle Plate / Registration *</label>
                <input
                  type="text"
                  required
                  value={vehicleRegInput || ''}
                  onChange={(e) => setVehicleRegInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalTransfer(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManager;
