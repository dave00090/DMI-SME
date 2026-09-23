import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface BusinessIntelligenceModelProps {
  branchId?: string;
  branchName?: string;
  isConsolidated?: boolean;
  overrideMetrics?: {
    sales: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    totalCustomerDebt?: number;
    totalStockCostValue?: number;
  };
}

export const BusinessIntelligenceModel: React.FC<BusinessIntelligenceModelProps> = ({
  branchId,
  branchName,
  isConsolidated = true,
  overrideMetrics,
}) => {
  const {
    metricsToday: defaultMetricsToday,
    totalCustomerDebt: defaultCustomerDebt,
    totalStockCostValue: defaultStockCostValue,
    debtorsList,
    products,
    setActiveTab,
  } = useBusiness();

  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const metricsToday = {
    sales: overrideMetrics ? overrideMetrics.sales : defaultMetricsToday.sales,
    grossProfit: overrideMetrics ? overrideMetrics.grossProfit : defaultMetricsToday.grossProfit,
    expenses: overrideMetrics ? overrideMetrics.expenses : defaultMetricsToday.expenses,
    netProfit: overrideMetrics ? overrideMetrics.netProfit : defaultMetricsToday.netProfit,
  };

  const totalCustomerDebt = overrideMetrics?.totalCustomerDebt !== undefined
    ? overrideMetrics.totalCustomerDebt
    : defaultCustomerDebt;

  const totalStockCostValue = overrideMetrics?.totalStockCostValue !== undefined
    ? overrideMetrics.totalStockCostValue
    : defaultStockCostValue;

  const grossMarginPercent =
    metricsToday.sales > 0
      ? Math.round((metricsToday.grossProfit / metricsToday.sales) * 100)
      : 0;

  const netMarginPercent =
    metricsToday.sales > 0
      ? Math.round((metricsToday.netProfit / metricsToday.sales) * 100)
      : 0;

  const totalCapitalTiedUp = totalCustomerDebt + totalStockCostValue;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Top Banner: Concept & Executive Differentiation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {isConsolidated ? 'Consolidated Business Intelligence' : `Branch Intelligence: ${branchName || 'Single Outlet'}`}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs font-medium hidden sm:inline">
                {isConsolidated ? 'Combined Multi-Branch Profitability & Working Capital' : `Real-Time P&L for ${branchName || 'Selected Outlet'}`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{isConsolidated ? 'Group Financial Pulse & Bottom Line' : `${branchName || 'Branch'} Financial Pulse`}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isConsolidated
                ? 'Consolidated intelligence aggregates turnover, gross margins, operating expenses, and working capital across all 3 retail branches and storage yards into one clear view of business health.'
                : `Dedicated financial pulse for ${branchName || 'this branch'} — tracking daily turnover, cashier float, retail profit margins, local store expenses, and branch stock valuation.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/15 flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
              <span>{showFormulaDetails ? 'Hide Model Comparison' : 'Compare vs Basic POS'}</span>
            </button>
          </div>
        </div>

        {/* Comparison Drawer: Basic POS vs Business Intelligence */}
        {showFormulaDetails && (
          <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fadeIn">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                <span className="text-red-400">✕</span> Typical Basic POS
              </div>
              <p className="text-slate-300 font-mono text-sm font-bold">
                Today's sales: KSh {metricsToday.sales.toLocaleString()}
              </p>
              <p className="text-slate-400 text-[11px] mt-1 leading-normal">
                Only shows total cash & M-Pesa collected. The owner remains blind to whether they made money, what loaders & electricity ate away, or how much capital is trapped outside.
              </p>
            </div>

            <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-700/50">
              <div className="text-blue-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Business Intelligence Model
              </div>
              <div className="space-y-0.5 font-mono text-[11px] text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-300">Today's sales:</span>
                  <span className="font-bold">KSh {metricsToday.sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300">Gross profit:</span>
                  <span className="font-bold text-emerald-400">KSh {metricsToday.grossProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-300">Expenses:</span>
                  <span className="font-bold text-rose-400">KSh {metricsToday.expenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-blue-800/60 pt-0.5">
                  <span className="text-blue-200 font-bold">Estimated net:</span>
                  <span className="font-bold text-blue-300">KSh {metricsToday.netProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-300">Outstanding customer debt:</span>
                  <span className="font-bold text-amber-400">KSh {totalCustomerDebt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Stock value:</span>
                  <span className="font-bold text-cyan-400">KSh {totalStockCostValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The 6 Core Pillars of Business Intelligence */}
      <div className="p-4 sm:p-5 bg-slate-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Today's Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Today's sales
                </p>
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1">
                KSh {metricsToday.sales.toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gross Turnover</span>
              <span className="font-semibold text-emerald-600">Active Register</span>
            </div>
          </div>

          {/* 2. Gross Profit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Gross profit
                </p>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono mt-1">
                KSh {metricsToday.grossProfit.toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gross Margin</span>
              <span className="font-bold text-emerald-700">{grossMarginPercent}%</span>
            </div>
          </div>

          {/* 3. Expenses */}
          <div 
            onClick={() => setActiveTab('expenses')}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-rose-600 transition">
                  Expenses
                </p>
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-rose-600 font-mono mt-1">
                KSh {metricsToday.expenses.toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>KPLC, Loaders, Transport</span>
              <span className="text-rose-600 font-medium group-hover:underline">View & Log →</span>
            </div>
          </div>

          {/* 4. Estimated Net */}
          <div className="bg-white p-4 rounded-xl border-2 border-blue-500/40 bg-blue-50/20 shadow-xs hover:border-blue-500 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  Estimated net
                </p>
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-700 font-mono mt-1">
                KSh {metricsToday.netProfit.toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-800">
              <span>Pocket Profit</span>
              <span className="font-bold">{netMarginPercent}% Net</span>
            </div>
          </div>

          {/* 5. Outstanding Customer Debt */}
          <div 
            onClick={() => setActiveTab('debtors')}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition">
                  Outstanding debt
                </p>
                <Users className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-600 font-mono mt-1">
                KSh {totalCustomerDebt.toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{debtorsList.length} Customer Madeni</span>
              <span className="text-amber-700 font-medium group-hover:underline">Collect →</span>
            </div>
          </div>

          {/* 6. Stock Value */}
          <div 
            onClick={() => setActiveTab('inventory')}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300 transition flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-cyan-700 transition">
                  Stock value
                </p>
                <Package className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1">
                KSh {totalStockCostValue.toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Cost Value</span>
              <span className="text-cyan-700 font-medium group-hover:underline">{products.length} items →</span>
            </div>
          </div>
        </div>

        {/* Real-time Business Equation Bar */}
        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="font-semibold text-slate-800">Gross Profit (KSh {metricsToday.grossProfit.toLocaleString()})</span>
            <span className="text-slate-400 font-bold">−</span>
            <span className="font-semibold text-rose-600">Expenses (KSh {metricsToday.expenses.toLocaleString()})</span>
            <span className="text-slate-400 font-bold">=</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Estimated Net: KSh {metricsToday.netProfit.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>
              Total Working Capital Tied Up: <strong className="text-slate-800 font-mono">KSh {totalCapitalTiedUp.toLocaleString()}</strong> (Inventory + Madeni)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligenceModel;
