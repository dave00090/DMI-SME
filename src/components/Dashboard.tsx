import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Smartphone,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Send,
  BookOpen,
  Lock,
  History,
  Clock,
  Building2,
  ArrowRightLeft,
  Store,
  Warehouse,
  Layers,
  MapPin,
  ChevronRight,
  Filter,
  Eye,
  Truck,
  Zap,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import WhatsAppSummaryModal from './WhatsAppSummaryModal';
import BusinessIntelligenceModel from './BusinessIntelligenceModel';
import DailySalesBookModal from './DailySalesBookModal';
import { Sale } from '../types';

export const Dashboard: React.FC = () => {
  const {
    metricsToday,
    totalCustomerDebt,
    totalStockCostValue,
    totalStockRetailValue,
    lowStockProducts,
    slowMovingProducts,
    debtorsList,
    setActiveTab,
    generateCustomerReminderText,
    storeProfile,
    products,
    currentSalesBook,
    isSalesBookOpen,
    branches,
    activeBranchId,
    setActiveBranchId,
    interBranchTransfers,
    receiveTransfer,
    simulateInterBranchTransfer,
    dispatchOrders,
    currentEmployee,
    sales,
    expenses,
    subscription,
  } = useBusiness();

  const subTier = (subscription?.tier || 'Starter').toLowerCase();
  const isMultiBranchAndDispatchAllowed =
    subTier === 'business' || subTier === 'pro' || subTier === 'enterprise';

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSalesBookModalOpen, setIsSalesBookModalOpen] = useState(false);
  const [salesBookModalMode, setSalesBookModalMode] = useState<'start' | 'close' | 'history'>('start');

  const openStartSalesBook = () => {
    setSalesBookModalMode('start');
    setIsSalesBookModalOpen(true);
  };

  const openCloseSalesBook = () => {
    setSalesBookModalMode('close');
    setIsSalesBookModalOpen(true);
  };

  const openHistorySalesBook = () => {
    setSalesBookModalMode('history');
    setIsSalesBookModalOpen(true);
  };

  // Current selected branch details
  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === activeBranchId);
  }, [branches, activeBranchId]);

  const isConsolidated = activeBranchId === 'all' || !currentBranch;

  // Check today's sales
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const isTodaySale = (s: Sale) => {
    return s.timestamp.startsWith(todayStr) || s.timestamp.startsWith('2026-09-08');
  };

  // Filtered sales today for active scope
  const filteredSalesToday = useMemo(() => {
    return sales.filter((s) => {
      const matchToday = isTodaySale(s);
      if (!matchToday) return false;
      if (isConsolidated) return true;
      return s.branchId === activeBranchId || (!s.branchId && activeBranchId === 'branch-1');
    });
  }, [sales, isConsolidated, activeBranchId, todayStr]);

  // Dynamic Metrics for selected scope (Consolidated vs Branch-level)
  const activeMetricsToday = useMemo(() => {
    if (isConsolidated) {
      return metricsToday;
    }

    const salesSum = filteredSalesToday.reduce((sum, s) => sum + s.grandTotal, 0);
    const grossProfitSum = filteredSalesToday.reduce((sum, s) => sum + s.grossProfit, 0);

    const cashSum = filteredSalesToday.reduce((sum, s) => {
      if (s.paymentMethod === 'cash') return sum + s.grandTotal;
      if (s.paymentMethod === 'split') return sum + (s.splitDetails?.cash || 0);
      return sum;
    }, 0);

    const mpesaSum = filteredSalesToday.reduce((sum, s) => {
      if (s.paymentMethod === 'mpesa') return sum + s.grandTotal;
      if (s.paymentMethod === 'split') return sum + (s.splitDetails?.mpesa || 0);
      return sum;
    }, 0);

    const debtSum = filteredSalesToday.reduce((sum, s) => {
      if (s.paymentMethod === 'credit') return sum + s.grandTotal;
      if (s.paymentMethod === 'split') return sum + (s.splitDetails?.credit || 0);
      return sum;
    }, 0);

    const branchExpensesToday = expenses.filter((e) => {
      const isToday = e.date === todayStr || e.date === '2026-09-08';
      if (!isToday) return false;
      return e.branchId === activeBranchId || (!e.branchId && activeBranchId === 'branch-1');
    });

    const expensesSum = branchExpensesToday.reduce((sum, e) => sum + e.amount, 0);

    return {
      sales: salesSum,
      grossProfit: grossProfitSum,
      expenses: expensesSum,
      netProfit: grossProfitSum - expensesSum,
      cashCollected: cashSum,
      mpesaCollected: mpesaSum,
      debtGivenToday: debtSum,
    };
  }, [isConsolidated, metricsToday, filteredSalesToday, expenses, activeBranchId, todayStr]);

  // Branch / Consolidated Stock Valuation
  const activeStockMetrics = useMemo(() => {
    if (isConsolidated) {
      return {
        costValue: totalStockCostValue,
        retailValue: totalStockRetailValue,
        itemCount: products.length,
      };
    }

    let costVal = 0;
    let retailVal = 0;
    let unitsCount = 0;

    products.forEach((p) => {
      const branchQty =
        p.branchStock?.[activeBranchId] ?? Math.floor(p.stockQuantity / (branches.length || 1));
      costVal += branchQty * p.costPrice;
      retailVal += branchQty * p.sellingPrice;
      unitsCount += branchQty;
    });

    return {
      costValue: costVal,
      retailValue: retailVal,
      itemCount: unitsCount,
    };
  }, [isConsolidated, totalStockCostValue, totalStockRetailValue, products, activeBranchId, branches.length]);

  // Branch-specific or Consolidated Low Stock List
  const activeLowStockProducts = useMemo(() => {
    if (isConsolidated) {
      return lowStockProducts;
    }

    return products
      .map((p) => {
        const branchQty =
          p.branchStock?.[activeBranchId] ?? Math.floor(p.stockQuantity / (branches.length || 1));
        const branchThreshold = Math.max(3, Math.ceil(p.lowStockThreshold / 2));
        return {
          ...p,
          branchQty,
          branchThreshold,
          isBranchLow: branchQty <= branchThreshold,
        };
      })
      .filter((p) => p.isBranchLow)
      .sort((a, b) => a.branchQty - b.branchQty);
  }, [isConsolidated, lowStockProducts, products, activeBranchId, branches.length]);

  // Comparative Branch Performance Matrix (for Business Owner Consolidated view)
  const branchPerformanceList = useMemo(() => {
    const totalSales = metricsToday.sales > 0 ? metricsToday.sales : 1;

    return branches.map((b) => {
      const bSalesToday = sales.filter((s) => {
        const matchToday = isTodaySale(s);
        return matchToday && (s.branchId === b.id || (!s.branchId && b.id === 'branch-1'));
      });

      const bSalesAmount = bSalesToday.reduce((sum, s) => sum + s.grandTotal, 0);
      const bGrossProfit = bSalesToday.reduce((sum, s) => sum + s.grossProfit, 0);

      const bExpenses = expenses
        .filter((e) => {
          const isToday = e.date === todayStr || e.date === '2026-09-08';
          return isToday && (e.branchId === b.id || (!e.branchId && b.id === 'branch-1'));
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const bNetProfit = bGrossProfit - bExpenses;
      const shareOfSales = Math.round((bSalesAmount / totalSales) * 100);

      // Stock valuation at this branch
      let bCostVal = 0;
      let bLowCount = 0;
      products.forEach((p) => {
        const bQty = p.branchStock?.[b.id] ?? Math.floor(p.stockQuantity / (branches.length || 1));
        bCostVal += bQty * p.costPrice;
        if (bQty <= Math.max(3, Math.ceil(p.lowStockThreshold / 2))) {
          bLowCount++;
        }
      });

      return {
        branch: b,
        salesAmount: bSalesAmount,
        grossProfit: bGrossProfit,
        expenses: bExpenses,
        netProfit: bNetProfit,
        shareOfSales,
        stockCostValue: bCostVal,
        lowStockCount: bLowCount,
        transactionCount: bSalesToday.length,
      };
    });
  }, [branches, sales, expenses, products, metricsToday.sales, todayStr]);

  // Active IBT transfers
  const activeTransfers = useMemo(() => {
    return interBranchTransfers.filter(
      (t) => t.status === 'pending' || t.status === 'dispatched'
    );
  }, [interBranchTransfers]);

  // Inbound Transfers (for active branch when receiving, or all when consolidated)
  const inboundTransfers = useMemo(() => {
    return activeTransfers.filter((t) => {
      if (isConsolidated) return true;
      return t.destBranchId === activeBranchId;
    });
  }, [activeTransfers, isConsolidated, activeBranchId]);

  // Outbound Transfers (for active branch when dispatching)
  const outboundTransfers = useMemo(() => {
    if (isConsolidated) return [];
    return activeTransfers.filter((t) => t.sourceBranchId === activeBranchId);
  }, [activeTransfers, isConsolidated, activeBranchId]);

  // Live Stock Dispatch Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [dispatchSourceId, setDispatchSourceId] = useState(branches[0]?.id || 'branch-1');
  const [dispatchDestId, setDispatchDestId] = useState(branches[1]?.id || 'branch-2');
  const [dispatchProductId, setDispatchProductId] = useState(products[0]?.id || '');
  const [dispatchQuantity, setDispatchQuantity] = useState(25);
  const [liveDispatchNotice, setLiveDispatchNotice] = useState<{
    transferNum: string;
    sourceId: string;
    sourceName: string;
    destId: string;
    destName: string;
    productName: string;
    qty: number;
  } | null>(null);

  const handleDispatchTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (dispatchSourceId === dispatchDestId) {
      alert('Source and destination branches cannot be the same.');
      return;
    }
    const transfer = simulateInterBranchTransfer(dispatchSourceId, dispatchDestId, dispatchProductId, dispatchQuantity);
    const prod = products.find((p) => p.id === dispatchProductId);
    const src = branches.find((b) => b.id === dispatchSourceId);
    const dst = branches.find((b) => b.id === dispatchDestId);

    setLiveDispatchNotice({
      transferNum: transfer.transferNumber,
      sourceId: dispatchSourceId,
      sourceName: src?.name || 'Origin Outlet',
      destId: dispatchDestId,
      destName: dst?.name || 'Destination Outlet',
      productName: prod?.name || 'Transferred Item',
      qty: dispatchQuantity,
    });
    setIsTransferModalOpen(false);
  };

  // Dead stock capital sum
  const deadStockCapital = slowMovingProducts.reduce(
    (sum, item) => sum + item.capitalTiedUp,
    0
  );

  // Send WhatsApp reminder to specific debtor
  const handleDebtorReminder = (debtor: any) => {
    const text = generateCustomerReminderText(debtor);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleSendAllReminders = () => {
    const topOverdue = debtorsList.filter((d) => d.outstandingDebt > 5000)[0] || debtorsList[0];
    if (topOverdue) {
      handleDebtorReminder(topOverdue);
    }
  };

  return (
    <div className="space-y-6">
      {/* 0. OPEN SALES BOOK PROMPT BANNER (When Daily Sales Book is closed) */}
      {!isSalesBookOpen && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-orange-500/20 border-2 border-amber-400 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow-2xs">
                  Action Required for Today
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Daily Sales Register Closed
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Open Sales Book to Unlock Cashier Checkout & Counter Operations
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                The Sales tab remains hidden until today's register is opened with the opening cash float. Click below to initialize today's books and make the Sales tab visible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openStartSalesBook}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer animate-pulse"
            >
              <BookOpen className="w-4 h-4 text-slate-950" />
              <span>Open Sales Book for Today</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. EXECUTIVE SCOPE SWITCHER: Consolidated Group vs Specific Branch */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                Multi-Branch Intelligence
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">
                {isConsolidated ? (
                  <span className="text-blue-700 font-semibold">Group Consolidated Overview (All {branches.length} Locations)</span>
                ) : (
                  <span>
                    Filtered to: <strong className="text-slate-900">{currentBranch?.name}</strong> ({currentBranch?.code})
                  </span>
                )}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {isConsolidated ? (
                <>
                  <span>Enterprise Business Dashboard</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    Consolidated View
                  </span>
                </>
              ) : (
                <>
                  <span>{currentBranch?.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    Branch Deep-Dive
                  </span>
                </>
              )}
            </h1>

            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isConsolidated
                ? `Consolidates revenue, inventory, profits, and customer debt across ${branches.length} store locations and wholesale storage depots. Switch below to drill down into any specific outlet.`
                : `Dedicated operational pulse for ${currentBranch?.name}. Showing local register sales, cashier float, branch stock holding, and store expenses.`}
            </p>
          </div>

          {/* Quick Actions Right */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            {!isConsolidated && (
              <button
                onClick={() => setActiveBranchId('all')}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>🌐 Return to Consolidated View</span>
              </button>
            )}

            {isMultiBranchAndDispatchAllowed && (
              <>
                <button
                  id="dashboard-live-dispatch-btn"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Initiate Live Inter-Branch Stock Dispatch"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Live Stock Dispatch</span>
                </button>

                <button
                  onClick={() => setActiveTab('dispatch')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Open Dispatch Hub"
                >
                  <Send className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dispatch Hub</span>
                </button>

                <button
                  onClick={() => setActiveTab('branches')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Open Branch & IBT Manager"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Outlets & IBT Hub</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp Daily Report</span>
            </button>
          </div>
        </div>

        {/* The Interactive Segmented Branch Switcher Bar (Business, Pro & Enterprise only) */}
        {isMultiBranchAndDispatchAllowed && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Scope:</span>
              </span>

              {/* Consolidated Pill */}
              <button
                onClick={() => setActiveBranchId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isConsolidated
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <span>🌐 All Branches (Consolidated)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isConsolidated ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {branches.length} Outlets
                </span>
              </button>

              {/* Individual Branch Pills */}
              {branches.map((b) => {
                const isSelected = activeBranchId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setActiveBranchId(b.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    {b.isWarehouse ? (
                      <Warehouse className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <Store className="w-3.5 h-3.5 opacity-80" />
                    )}
                    <span>{b.code} • {b?.name ? b.name.split(' ')[0] : (b?.code || 'Branch')}</span>
                    {b.isWarehouse && (
                      <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'}`}>
                        Yard
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Context status indicator */}
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px]">
                {isConsolidated
                  ? `Group Revenue: KSh ${(metricsToday?.sales || 0).toLocaleString()} (Combined)`
                  : `Branch Revenue: KSh ${(activeMetricsToday?.sales || 0).toLocaleString()} (${currentBranch?.code})`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. LIVE INTER-BRANCH TRANSFER & DISPATCH ALERTS */}
      {/* Live Movement Flash Notification Banner */}
      {liveDispatchNotice && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 border border-amber-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  Live Dispatch Active
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">{liveDispatchNotice.transferNum}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Inter-Branch Stock Movement En Route: {liveDispatchNotice.qty} units of {liveDispatchNotice.productName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Dispatched from <strong className="text-slate-900">{liveDispatchNotice.sourceName}</strong> and registered on the destination receiving terminal at <strong className="text-slate-900">{liveDispatchNotice.destName}</strong>. Live alerts have been raised on both dashboards below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveBranchId(liveDispatchNotice.destId)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Switch dashboard to see the receiving outlet alert"
            >
              <span>View Receiving Alert ({liveDispatchNotice.destName.split(' ')[0]})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveBranchId(liveDispatchNotice.sourceId)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Switch dashboard to see the dispatching outlet alert"
            >
              <span>View Dispatch Alert ({liveDispatchNotice.sourceName.split(' ')[0]})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLiveDispatchNotice(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inbound Stock Alert (Receiving Outlet has incoming shipments) */}
      {inboundTransfers.length > 0 && (
        <div className="bg-emerald-50/90 border-2 border-emerald-400/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Inbound Stock Alert
                  </span>
                  <span className="text-xs font-bold text-emerald-900">
                    {inboundTransfers.length} Incoming Shipment{inboundTransfers.length > 1 ? 's' : ''} Awaiting Receipt
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {isConsolidated
                    ? 'Cross-branch shipments in transit across the enterprise network.'
                    : `Stock has been dispatched and is arriving at ${currentBranch?.name}. Inspect and confirm to credit inventory.`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('dispatch')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto cursor-pointer"
            >
              Open Dispatch Manifests →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inboundTransfers.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{t.transferNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                      <span>En Route</span>
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-slate-900">
                      {t.quantity} {t.unit}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{t.productName}</span>
                  </div>

                  <div className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span>
                      From: <strong className="text-slate-800">{t.sourceBranchName}</strong>
                    </span>
                    <span>➔</span>
                    <span>
                      To: <strong className="text-emerald-800">{t.destBranchName}</strong>
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-1">
                    <span>
                      Carrier: <strong className="text-slate-800">{t.driverName || 'Designated Driver'}</strong>
                    </span>
                    <span className="font-mono text-slate-700">{t.vehicleReg || 'Logistics Van'}</span>
                  </div>
                </div>

                <button
                  onClick={() => receiveTransfer(t.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Accept Delivery Into Stock</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outbound Dispatch Alert (Dispatching Outlet has items currently in transit) */}
      {outboundTransfers.length > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Outbound Shipment Alert
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    {outboundTransfers.length} Active Dispatch{outboundTransfers.length > 1 ? 'es' : ''} Leaving {currentBranch?.name}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Items have been authorized, deducted from local stock, and are en route to destination outlets.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('dispatch')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline self-start sm:self-auto cursor-pointer"
            >
              View Dispatch Hub →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outboundTransfers.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{t.transferNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>On Road</span>
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-slate-900">
                      {t.quantity} {t.unit}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{t.productName}</span>
                  </div>

                  <div className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span>
                      Dispatched To: <strong className="text-blue-700">{t.destBranchName}</strong>
                    </span>
                    <span>•</span>
                    <span>Carrier: <strong className="text-slate-800">{t.driverName || 'Driver'}</strong></span>
                    <span className="font-mono text-slate-700">({t.vehicleReg || 'Vehicle'})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 italic">Awaiting destination receiving clerk</span>
                  <button
                    onClick={() => setActiveBranchId(t.destBranchId)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Check {t.destBranchName.split(' ')[0]}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SPECIFIC BRANCH HERO (Displayed ONLY when a single branch is selected) */}
      {!isConsolidated && currentBranch && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-800/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {currentBranch.isWarehouse ? 'Wholesale Depot & Holding Yard' : 'Active Retail Storefront'}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 font-mono font-bold">Code: {currentBranch.code}</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300">
                  Till / Paybill: <strong className="text-white font-mono">{currentBranch?.tillNumber || currentBranch?.paybillNumber || 'N/A'}</strong>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{currentBranch?.name || 'Assigned Branch'}</span>
                <span className="text-xs font-normal text-slate-300 font-sans hidden sm:inline">
                  ({currentBranch?.location || 'Store Location'})
                </span>
              </h2>

              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3 pt-1">
                <span>
                  Store Manager / Cashier: <strong className="text-white">{currentBranch?.cashierName || 'Branch Manager'}</strong>
                </span>
                <span>•</span>
                <span>
                  Contact: <strong className="text-white font-mono">{currentBranch?.phone || 'N/A'}</strong>
                </span>
                <span>•</span>
                <span>
                  Stock Valuation at this site: <strong className="text-emerald-300 font-mono">KSh {(activeStockMetrics?.costValue || 0).toLocaleString()}</strong>
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={() => setActiveTab('pos')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Launch POS for {currentBranch.code}</span>
              </button>

              <button
                onClick={() => setActiveTab('branches')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-300" />
                <span>Request IBT Restock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DAILY SALES REGISTER STATUS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isSalesBookOpen
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isSalesBookOpen ? <BookOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Daily Sales Register Book {isConsolidated ? '(Store Primary)' : `(${currentBranch?.name})`}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSalesBookOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isSalesBookOpen ? '● Book Open for Today' : '○ Book Closed'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isSalesBookOpen ? (
                <>
                  Active Shift Cashier:{' '}
                  <strong className="text-slate-700">
                    {!isConsolidated ? currentBranch?.cashierName : (currentSalesBook?.openedBy || storeProfile.cashierName)}
                  </strong>{' '}
                  • Opening Float:{' '}
                  <strong className="text-slate-700 font-mono">
                    KSh {(currentSalesBook?.openingCashFloat || 2500).toLocaleString()}
                  </strong>
                </>
              ) : (
                'Open a new sales book to start logging and balancing today\'s transactions.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {!isSalesBookOpen ? (
            <button
              onClick={openStartSalesBook}
              className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer animate-pulse"
            >
              <BookOpen className="w-4 h-4 text-slate-950" />
              <span>Open Sales Book</span>
            </button>
          ) : (
            <>
              <button
                onClick={openCloseSalesBook}
                className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Close Today's Sales</span>
              </button>
              <button
                onClick={openStartSalesBook}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Re-open or modify opening float"
              >
                <span>Edit Float</span>
              </button>
            </>
          )}

          <button
            onClick={openHistorySalesBook}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="View archive of past closed daily books"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Books History</span>
          </button>
        </div>
      </div>

      {/* 4. BUSINESS INTELLIGENCE MODEL (Dynamic: Consolidated vs Branch) */}
      <BusinessIntelligenceModel
        branchId={activeBranchId}
        branchName={currentBranch?.name}
        isConsolidated={isConsolidated}
        overrideMetrics={{
          sales: activeMetricsToday.sales,
          grossProfit: activeMetricsToday.grossProfit,
          expenses: activeMetricsToday.expenses,
          netProfit: activeMetricsToday.netProfit,
          totalCustomerDebt: totalCustomerDebt,
          totalStockCostValue: activeStockMetrics.costValue,
        }}
      />

      {/* 5. CONSOLIDATED ONLY: BRANCH PERFORMANCE MATRIX & LEADERBOARD */}
      {isConsolidated && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Branch Revenue & Performance Matrix
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  Live Multi-Store Comparison
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare today's sales turnover, operating expenses, estimated net contribution, and inventory holding across all outlets.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('branches')}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Manage Outlets & IBT Routing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Outlet / Yard</th>
                  <th className="px-4 py-3 text-right">Today's Sales</th>
                  <th className="px-4 py-3 text-center">Share of Revenue</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-right">Expenses</th>
                  <th className="px-4 py-3 text-right">Net Profit</th>
                  <th className="px-4 py-3 text-right">Stock Valuation</th>
                  <th className="px-4 py-3 text-center">Low Stock</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {branchPerformanceList.map((item) => {
                  const marginPct =
                    item.salesAmount > 0
                      ? Math.round((item.grossProfit / item.salesAmount) * 100)
                      : 0;

                  return (
                    <tr key={item.branch?.id || Math.random()} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              item.branch?.isWarehouse
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.branch?.code || 'BR'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{item.branch?.name || 'Branch'}</span>
                              {item.branch?.isWarehouse && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Yard
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Manager: {item.branch?.cashierName || 'Attendant'} • Till: {item.branch?.tillNumber || item.branch?.paybillNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        KSh {(item.salesAmount || 0).toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {item.transactionCount} transactions
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-700">{item.shareOfSales}%</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, item.shareOfSales)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                        KSh {(item.grossProfit || 0).toLocaleString()}
                        <div className="text-[10px] text-emerald-700 font-sans font-medium">
                          {marginPct}% margin
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-rose-600 font-medium">
                        KSh {(item.expenses || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                        KSh {(item.netProfit || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        KSh {(item.stockCostValue || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.lowStockCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {item.lowStockCount} items low
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Optimal
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => item.branch?.id && setActiveBranchId(item.branch.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer mx-auto"
                          title={`Drill down into ${item.branch?.name || 'Branch'}`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Branch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Cross-Branch Stock Movement (IBT) Notice */}
          {activeTransfers.length > 0 && (
            <div className="p-3 bg-amber-50/70 border-t border-amber-100 flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{activeTransfers.length} Inter-Branch Transfers (IBTs) active:</strong>{' '}
                  {activeTransfers[0]?.quantity} {activeTransfers[0]?.unit} {activeTransfers[0]?.productName} en-route from{' '}
                  {activeTransfers[0]?.sourceBranchName} to {activeTransfers[0]?.destBranchName}.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('branches')}
                className="font-bold text-amber-800 hover:underline cursor-pointer shrink-0"
              >
                Track in Logistics Hub →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. MAIN SECTION: Critical Debtors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
              Critical Debtors {isConsolidated ? '(All Branches)' : `(Accountable to ${currentBranch?.code})`}
            </h4>
            <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold border border-red-100">
              KSh {(totalCustomerDebt || 0).toLocaleString()} total
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSendAllReminders}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold cursor-pointer transition flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send All Reminders</span>
            </button>
            <button
              onClick={() => setActiveTab('debtors')}
              className="text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              View Full Book →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-600">Customer Name</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-right">Outstanding</th>
                <th className="px-4 py-3 font-bold text-slate-600">Site / Phone</th>
                <th className="px-4 py-3 font-bold text-slate-600">Status</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {debtorsList.slice(0, 5).map((customer) => {
                const isSevere = customer.outstandingDebt >= 20000;
                const isOverdue = customer.outstandingDebt >= 8000;
                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-semibold text-slate-900">{customer?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">
                        Limit: KSh {(customer?.creditLimit || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-mono text-slate-900">
                      KSh {(customer.outstandingDebt || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                      <div>{customer.phone}</div>
                      <div className="text-[11px] text-slate-400">{customer.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          isSevere
                            ? 'bg-red-100 text-red-700'
                            : isOverdue
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isSevere ? 'Severe' : isOverdue ? 'Overdue' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDebtorReminder(customer)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. PAYMENT DISTRIBUTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Payment Inflow Breakdown {isConsolidated ? '(Enterprise Group)' : `(${currentBranch?.name})`}
            </h3>
            <p className="text-xs text-slate-500">
              Live distribution across Safaricom Till, OTC Cash Drawer, and Customer Madeni
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            Total: KSh {(activeMetricsToday?.sales || 0).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>M-Pesa Buy Goods</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              KSh {(activeMetricsToday?.mpesaCollected || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {(activeMetricsToday?.sales || 0) > 0
                ? Math.round(((activeMetricsToday?.mpesaCollected || 0) / activeMetricsToday.sales) * 100)
                : 0}
              % of volume
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Over-the-Counter Cash</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              KSh {(activeMetricsToday?.cashCollected || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {(activeMetricsToday?.sales || 0) > 0
                ? Math.round(((activeMetricsToday?.cashCollected || 0) / activeMetricsToday.sales) * 100)
                : 0}
              % cash in drawer
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Credit Issued (Madeni)</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              KSh {(activeMetricsToday?.debtGivenToday || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Added to customer credit book
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-0.5">
            <div
              style={{
                width: `${
                  activeMetricsToday.sales > 0
                    ? (activeMetricsToday.mpesaCollected / activeMetricsToday.sales) * 100
                    : 50
                }%`,
              }}
              className="bg-emerald-500"
              title="M-Pesa"
            />
            <div
              style={{
                width: `${
                  activeMetricsToday.sales > 0
                    ? (activeMetricsToday.cashCollected / activeMetricsToday.sales) * 100
                    : 25
                }%`,
              }}
              className="bg-blue-500"
              title="Cash"
            />
            <div
              style={{
                width: `${
                  activeMetricsToday.sales > 0
                    ? (activeMetricsToday.debtGivenToday / activeMetricsToday.sales) * 100
                    : 25
                }%`,
              }}
              className="bg-amber-400"
              title="Credit"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> M-Pesa Till
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Cash Handed Over
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Credit Book (Madeni)
            </span>
          </div>
        </div>
      </div>

      {isSummaryModalOpen && (
        <WhatsAppSummaryModal onClose={() => setIsSummaryModalOpen(false)} />
      )}

      {isSalesBookModalOpen && (
        <DailySalesBookModal
          isOpen={isSalesBookModalOpen}
          onClose={() => setIsSalesBookModalOpen(false)}
          initialMode={salesBookModalMode}
        />
      )}

      {/* Live Stock Dispatch Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-amber-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Live Stock Transfer Pipeline
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Initiate Live Inter-Branch Transfer</h3>
                <p className="text-xs text-slate-500">
                  Dispatches stock from origin outlet and registers live inbound alerts on the receiving outlet.
                </p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dispatching Outlet (Origin Branch) *
                </label>
                <select
                  value={dispatchSourceId}
                  onChange={(e) => setDispatchSourceId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b?.name || 'Branch'} ({b?.code || ''}) {b?.isWarehouse ? '• Main Depot' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receiving Outlet (Destination Branch) *
                </label>
                <select
                  value={dispatchDestId}
                  onChange={(e) => setDispatchDestId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b?.name || 'Branch'} ({b?.code || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Item *</label>
                  <select
                    value={dispatchProductId}
                    onChange={(e) => setDispatchProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p?.name || 'Item'} ({p?.sku || ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={dispatchQuantity}
                    onChange={(e) => setDispatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                <strong>What happens on live dispatch:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
                  <li>Stock is deducted from origin branch immediately.</li>
                  <li>An <strong>Outbound Dispatch Alert</strong> appears on origin branch dashboard.</li>
                  <li>An <strong>Inbound Stock Alert</strong> appears on destination branch dashboard with a 1-click receiving action.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Stock Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
