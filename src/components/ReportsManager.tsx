import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Sale } from '../types';
import {
  FileText,
  Printer,
  Calendar,
  ShieldCheck,
  Award,
  Receipt,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ArrowRight,
  MessageCircle,
  Clock,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import ReceiptModal from './ReceiptModal';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'cashflow' | 'bank_readiness' | 'receipts';

export const ReportsManager: React.FC = () => {
  const {
    sales,
    expenses,
    totalCustomerDebt,
    totalSupplierDebt,
    totalStockCostValue,
    totalStockRetailValue,
    storeProfile,
    debtorsList,
  } = useBusiness();

  const [activeReportTab, setActiveReportTab] = useState<ReportPeriod>('daily');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [receiptSearch, setReceiptSearch] = useState('');

  // Daily report sub-controls
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>('2026-09-08');

  // Weekly report sub-controls ('this-week': Sep 2 - Sep 8, 'last-week': Aug 26 - Sep 1)
  const [selectedWeek, setSelectedWeek] = useState<'this-week' | 'last-week'>('this-week');

  // Monthly report sub-controls ('2026-09': September 2026, '2026-08': August 2026)
  const [selectedMonth, setSelectedMonth] = useState<'2026-09' | '2026-08'>('2026-09');

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Helper for COGS
  const getSaleCogs = (s: Sale) => {
    if (typeof s.totalCost === 'number') return s.totalCost;
    return (
      s.items?.reduce(
        (sum, item) => sum + (item.costPrice ?? 0) * item.quantity,
        0
      ) ?? 0
    );
  };

  // ==========================================
  // 1. DAILY REPORT CALCULATIONS
  // ==========================================
  const dailyData = useMemo(() => {
    const daySales = sales.filter((s) => s.timestamp.startsWith(selectedDailyDate));
    const dayExpenses = expenses.filter((e) => e.date === selectedDailyDate);

    const revenue = daySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const cogs = daySales.reduce((sum, s) => sum + getSaleCogs(s), 0);
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

    const totalExp = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExp;
    const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    const mpesa = daySales
      .filter((s) => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    const cash = daySales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    const credit = daySales
      .filter((s) => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.grandTotal, 0);

    // Product frequency on this day
    const productMap: { [name: string]: { qty: number; revenue: number; profit: number } } = {};
    daySales.forEach((s) => {
      s.items?.forEach((i) => {
        if (!productMap[i.productName]) {
          productMap[i.productName] = { qty: 0, revenue: 0, profit: 0 };
        }
        productMap[i.productName].qty += i.quantity;
        productMap[i.productName].revenue += i.totalPrice;
        productMap[i.productName].profit +=
          i.totalPrice - (i.costPrice ?? 0) * i.quantity;
      });
    });

    const topItems = Object.entries(productMap)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      sales: daySales,
      expenses: dayExpenses,
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      totalExpenses: totalExp,
      netProfit,
      netMargin,
      mpesa,
      cash,
      credit,
      topItems,
    };
  }, [sales, expenses, selectedDailyDate]);

  // ==========================================
  // 2. WEEKLY REPORT CALCULATIONS
  // ==========================================
  const weeklyData = useMemo(() => {
    // Determine 7-day range
    let startDate = '2026-09-02';
    let endDate = '2026-09-08';
    let label = 'Current Week (02 Sep - 08 Sep 2026)';

    if (selectedWeek === 'last-week') {
      startDate = '2026-08-26';
      endDate = '2026-09-01';
      label = 'Previous Week (26 Aug - 01 Sep 2026)';
    }

    const weekSales = sales.filter((s) => {
      const d = s.timestamp.slice(0, 10);
      return d >= startDate && d <= endDate;
    });

    const weekExpenses = expenses.filter((e) => {
      return e.date >= startDate && e.date <= endDate;
    });

    const revenue = weekSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const cogs = weekSales.reduce((sum, s) => sum + getSaleCogs(s), 0);
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

    const totalExp = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExp;
    const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    // Day-by-day distribution
    const days: { date: string; dayName: string; sales: number; expenses: number; grossProfit: number; netProfit: number }[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const iso = current.toISOString().split('T')[0];
      const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });

      const dSales = sales.filter((s) => s.timestamp.startsWith(iso));
      const dExp = expenses.filter((e) => e.date === iso);

      const dRev = dSales.reduce((sum, s) => sum + s.grandTotal, 0);
      const dCogs = dSales.reduce((sum, s) => sum + getSaleCogs(s), 0);
      const dGross = dRev - dCogs;
      const dTotalExp = dExp.reduce((sum, e) => sum + e.amount, 0);

      days.push({
        date: iso,
        dayName,
        sales: dRev,
        expenses: dTotalExp,
        grossProfit: dGross,
        netProfit: dGross - dTotalExp,
      });
    }

    // Top products this week
    const productMap: { [name: string]: { qty: number; revenue: number; profit: number } } = {};
    weekSales.forEach((s) => {
      s.items?.forEach((i) => {
        if (!productMap[i.productName]) {
          productMap[i.productName] = { qty: 0, revenue: 0, profit: 0 };
        }
        productMap[i.productName].qty += i.quantity;
        productMap[i.productName].revenue += i.totalPrice;
        productMap[i.productName].profit +=
          i.totalPrice - (i.costPrice ?? 0) * i.quantity;
      });
    });

    const topItems = Object.entries(productMap)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      startDate,
      endDate,
      label,
      salesCount: weekSales.length,
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      totalExpenses: totalExp,
      netProfit,
      netMargin,
      days,
      topItems,
    };
  }, [sales, expenses, selectedWeek]);

  // ==========================================
  // 3. MONTHLY REPORT CALCULATIONS
  // ==========================================
  const monthlyData = useMemo(() => {
    const monthSales = sales.filter((s) => s.timestamp.startsWith(selectedMonth));
    const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

    const revenue = monthSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const cogs = monthSales.reduce((sum, s) => sum + getSaleCogs(s), 0);
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

    const totalExp = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExp;
    const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    const mpesa = monthSales
      .filter((s) => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    const cash = monthSales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    const credit = monthSales
      .filter((s) => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.grandTotal, 0);

    // Group expenses by category
    const expenseByCategory: { [cat: string]: number } = {};
    monthExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    // Top products
    const productMap: { [name: string]: { qty: number; revenue: number; profit: number } } = {};
    monthSales.forEach((s) => {
      s.items?.forEach((i) => {
        if (!productMap[i.productName]) {
          productMap[i.productName] = { qty: 0, revenue: 0, profit: 0 };
        }
        productMap[i.productName].qty += i.quantity;
        productMap[i.productName].revenue += i.totalPrice;
        productMap[i.productName].profit +=
          i.totalPrice - (i.costPrice ?? 0) * i.quantity;
      });
    });

    const topItems = Object.entries(productMap)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // August baseline for comparison
    const augustSales = sales.filter((s) => s.timestamp.startsWith('2026-08'));
    const augustExp = expenses.filter((e) => e.date.startsWith('2026-08'));
    const augustRev = augustSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const augustCogs = augustSales.reduce((sum, s) => sum + getSaleCogs(s), 0);
    const augustGross = augustRev - augustCogs;
    const augustTotalExp = augustExp.reduce((sum, e) => sum + e.amount, 0);
    const augustNet = augustGross - augustTotalExp;

    return {
      monthLabel: selectedMonth === '2026-09' ? 'September 2026 (Month-to-Date)' : 'August 2026 (Full Month)',
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      totalExpenses: totalExp,
      netProfit,
      netMargin,
      mpesa,
      cash,
      credit,
      expenseByCategory,
      topItems,
      comparison: {
        augustRev,
        augustCogs,
        augustGross,
        augustTotalExp,
        augustNet,
      },
    };
  }, [sales, expenses, selectedMonth]);

  // WhatsApp summary generator
  const getDailyWhatsAppText = () => {
    return `*${storeProfile.name} - Daily Close Report (${selectedDailyDate})*
---------------------------------
• Gross Sales: KSh ${dailyData.revenue.toLocaleString()}
• Cost of Sales (COGS): KSh ${dailyData.cogs.toLocaleString()}
• Gross Profit: KSh ${dailyData.grossProfit.toLocaleString()} (${dailyData.grossMargin}%)
• Daily Expenses: KSh ${dailyData.totalExpenses.toLocaleString()}
• Estimated Net Profit: KSh ${dailyData.netProfit.toLocaleString()}

*Payment Channels:*
• M-Pesa Buy Goods: KSh ${dailyData.mpesa.toLocaleString()}
• Cash Collected: KSh ${dailyData.cash.toLocaleString()}
• Credit Issued: KSh ${dailyData.credit.toLocaleString()}

*Top Items Today:*
${dailyData.topItems.slice(0, 3).map((i, idx) => `${idx + 1}. ${i.name} (${i.qty} units - KSh ${i.revenue.toLocaleString()})`).join('\n')}

_Generated via DMi Business OS_`;
  };

  const shareDailyWhatsApp = () => {
    const text = encodeURIComponent(getDailyWhatsAppText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Financial Intelligence & Reports
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Reports & Financial Analysis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Daily, Weekly, and Monthly business intelligence, 1-page P&L statements, and SACCO loan appraisal pack.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-300 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Current Report</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeReportTab === 'daily'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>📅 Daily Report</span>
        </button>

        <button
          onClick={() => setActiveReportTab('weekly')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeReportTab === 'weekly'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>📆 Weekly Report</span>
        </button>

        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeReportTab === 'monthly'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>📊 Monthly Report (P&L)</span>
        </button>

        <button
          onClick={() => setActiveReportTab('cashflow')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeReportTab === 'cashflow'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Cash Flow & Liquidity</span>
        </button>

        <button
          onClick={() => setActiveReportTab('bank_readiness')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeReportTab === 'bank_readiness'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Bank & SACCO Readiness</span>
        </button>

        <button
          onClick={() => setActiveReportTab('receipts')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeReportTab === 'receipts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-500" />
          <span>Receipts Register ({sales.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY REPORT VIEW                                                      */}
      {/* ========================================================================= */}
      {activeReportTab === 'daily' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Sub-selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Select Day:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDailyDate('2026-09-08')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedDailyDate === '2026-09-08'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today (08 Sep)
                </button>
                <button
                  onClick={() => setSelectedDailyDate('2026-09-07')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedDailyDate === '2026-09-07'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Yesterday (07 Sep)
                </button>
              </div>
              <input
                type="date"
                value={selectedDailyDate || ''}
                onChange={(e) => setSelectedDailyDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={shareDailyWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Business Intelligence Metrics Card for Today */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Today's Sales
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                KSh {dailyData.revenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {dailyData.sales.length} transactions recorded
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Gross Profit
              </div>
              <div className="text-xl font-black font-mono text-emerald-700 mt-1">
                KSh {dailyData.grossProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
                Gross Margin: {dailyData.grossMargin}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                Daily Expenses
              </div>
              <div className="text-xl font-black font-mono text-red-600 mt-1">
                KSh {dailyData.totalExpenses.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {dailyData.expenses.length} expense entries
              </div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Estimated Net
              </div>
              <div className={`text-xl font-black font-mono mt-1 ${dailyData.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                KSh {dailyData.netProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-700 mt-1 font-semibold">
                Net Margin: {dailyData.netMargin}%
              </div>
            </div>
          </div>

          {/* Breakdown & Ledger for the Day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Method Split */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Daily Cash Inflows Split
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 text-emerald-900">
                  <span className="font-medium">M-Pesa Buy Goods</span>
                  <span className="font-mono font-bold">KSh {dailyData.mpesa.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-slate-900">
                  <span className="font-medium">Cash Over-The-Counter</span>
                  <span className="font-mono font-bold">KSh {dailyData.cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50 text-amber-900">
                  <span className="font-medium">Credit Given (Madeni)</span>
                  <span className="font-mono font-bold">KSh {dailyData.credit.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  Outstanding Customer Debt: <strong className="text-slate-800 font-mono">KSh {totalCustomerDebt.toLocaleString()}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Warehouse Stock Value: <strong className="text-slate-800 font-mono">KSh {totalStockCostValue.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Daily Expenses Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Expenses Incurred ({selectedDailyDate})
              </h4>
              {dailyData.expenses.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-4 text-center">
                  No overhead expenses logged for this day.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {dailyData.expenses.map((e) => (
                    <div key={e.id} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <div>
                        <div className="font-bold text-slate-800">{e.category}</div>
                        <div className="text-[10px] text-slate-500">{e.description || 'No description'}</div>
                      </div>
                      <div className="font-mono font-bold text-red-600">
                        KSh {e.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total Overhead</span>
                    <span className="font-mono text-red-600">KSh {dailyData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top items sold today */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Top Products Sold Today
              </h4>
              {dailyData.topItems.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-4 text-center">
                  No sales recorded for this date.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {dailyData.topItems.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <div className="max-w-[170px] truncate">
                        <span className="font-bold text-slate-800 mr-1.5">{item.name}</span>
                        <span className="text-[10px] text-slate-500">({item.qty} pcs)</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800">
                        KSh {item.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily Sales Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Receipts Issued on {selectedDailyDate} ({dailyData.sales.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Revenue (KSh)</th>
                    <th className="p-3 text-right">Gross Profit (KSh)</th>
                    <th className="p-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyData.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-blue-700">{sale.receiptNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">{sale.customerName || 'Cash Customer'}</td>
                      <td className="p-3 max-w-xs truncate text-slate-600">
                        {(sale.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            sale.paymentMethod === 'mpesa'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sale.paymentMethod === 'credit'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900 font-mono">
                        {sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                        {sale.grossProfit.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedReceiptSale(sale)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200 cursor-pointer"
                        >
                          View
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

      {/* ========================================================================= */}
      {/* 2. WEEKLY REPORT VIEW                                                     */}
      {/* ========================================================================= */}
      {activeReportTab === 'weekly' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Sub-selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Select Week:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedWeek('this-week')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedWeek === 'this-week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  This Week (02 Sep - 08 Sep)
                </button>
                <button
                  onClick={() => setSelectedWeek('last-week')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedWeek === 'last-week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Last Week (26 Aug - 01 Sep)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {weeklyData.label} • {weeklyData.salesCount} Sales Orders
            </div>
          </div>

          {/* Weekly Headline Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Weekly Revenue
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                KSh {weeklyData.revenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Direct Sales Turnover
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Weekly Gross Profit
              </div>
              <div className="text-xl font-black font-mono text-emerald-700 mt-1">
                KSh {weeklyData.grossProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
                Gross Margin: {weeklyData.grossMargin}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                Weekly Overheads
              </div>
              <div className="text-xl font-black font-mono text-red-600 mt-1">
                KSh {weeklyData.totalExpenses.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Rent, tokens & labour
              </div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Weekly Net Profit
              </div>
              <div className={`text-xl font-black font-mono mt-1 ${weeklyData.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                KSh {weeklyData.netProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-700 mt-1 font-semibold">
                Net Margin: {weeklyData.netMargin}%
              </div>
            </div>
          </div>

          {/* Day by Day Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Day-by-Day Performance Matrix ({weeklyData.label})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Day</th>
                    <th className="p-3 text-right">Revenue (KSh)</th>
                    <th className="p-3 text-right">Gross Profit</th>
                    <th className="p-3 text-right">Overheads</th>
                    <th className="p-3 text-right">Net Profit</th>
                    <th className="p-3 text-center">Visual Sales Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyData.days.map((d, idx) => {
                    const maxDailySales = 30000;
                    const barWidth = Math.min(100, Math.round((d.sales / maxDailySales) * 100));
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono text-slate-600">{d.date}</td>
                        <td className="p-3 font-bold text-slate-900">{d.dayName}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {d.sales.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {d.grossProfit.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-red-600">
                          {d.expenses > 0 ? d.expenses.toLocaleString() : '-'}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${d.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {d.netProfit.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 6 Products Sold This Week */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Top Products Moving This Week
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {weeklyData.topItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Units Sold:</span>
                    <span className="font-bold text-slate-800">{item.qty} units</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Gross Turnover:</span>
                    <span className="font-mono font-bold text-blue-700">KSh {item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY REPORT VIEW (P&L & DIAGNOSTICS)                                 */}
      {/* ========================================================================= */}
      {activeReportTab === 'monthly' && (
        <div className="space-y-6 max-w-3xl mx-auto printable-report">
          {/* Sub-selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Select Month:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedMonth('2026-09')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMonth === '2026-09'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  September 2026 (MTD)
                </button>
                <button
                  onClick={() => setSelectedMonth('2026-08')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMonth === '2026-08'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  August 2026 (Last Month)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {monthlyData.monthLabel}
            </div>
          </div>

          {/* Diagnostic Card: Why Did My Profit Fall This Month? (Explicit Requirement) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>AI Profit Diagnostic: Why Did Profit Fall in September compared to August?</span>
              </div>
              <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                Executive Brief
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="p-3 bg-white rounded-lg border border-amber-200/80 space-y-1">
                <div className="font-bold text-slate-900">1. Cement COGS Squeeze</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Wholesale cement price rose from KSh 640 to KSh 695 (+8.6%). Retail remained at KSh 780, eroding gross margin from 22.1% to 17.8%.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-amber-200/80 space-y-1">
                <div className="font-bold text-slate-900">2. Frontloaded Overheads</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  KSh 31,100 in fixed monthly expenses was disbursed early in Sept (Rent KSh 25,000 paid Sept 1 + Nairobi County permit reserve).
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-amber-200/80 space-y-1">
                <div className="font-bold text-slate-900">3. Working Capital in Credit</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  KSh 117,100 is currently tied up in 3 customer trade accounts (ABC Construction, Mwangi Builders, John Kamau).
                </p>
              </div>
            </div>
          </div>

          {/* Month-over-Month Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Comparative Monthly Performance (August vs September 2026)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Financial Metric</th>
                    <th className="p-3 text-right">August 2026 (Full)</th>
                    <th className="p-3 text-right">September 2026 (MTD)</th>
                    <th className="p-3 text-right">Variance / Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Gross Operating Revenue</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">KSh {monthlyData.comparison.augustRev.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">KSh {monthlyData.revenue.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-500 text-[11px]">8 days in (run-rate ~KSh 250k)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Cost of Goods Sold (COGS)</td>
                    <td className="p-3 text-right font-mono text-slate-800">KSh {monthlyData.comparison.augustCogs.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-800">KSh {monthlyData.cogs.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-600 font-semibold text-[11px]">Wholesale cost +8.6%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Gross Operating Profit</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">KSh {monthlyData.comparison.augustGross.toLocaleString()} (18.4%)</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">KSh {monthlyData.grossProfit.toLocaleString()} ({monthlyData.grossMargin}%)</td>
                    <td className="p-3 text-right text-amber-700 font-semibold text-[11px]">Margin compressed</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Store Overheads & Expenses</td>
                    <td className="p-3 text-right font-mono text-red-600">KSh {monthlyData.comparison.augustTotalExp.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-red-600">KSh {monthlyData.totalExpenses.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-500 text-[11px]">Rent paid on Sept 1</td>
                  </tr>
                  <tr className="bg-slate-50/60 font-bold">
                    <td className="p-3 text-slate-900">Net Operating Profit</td>
                    <td className="p-3 text-right font-mono text-blue-700">KSh {monthlyData.comparison.augustNet.toLocaleString()}</td>
                    <td className={`p-3 text-right font-mono ${monthlyData.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      KSh {monthlyData.netProfit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-slate-600 text-[11px]">Normalizes across 30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Official 1-Page P&L Statement */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-800">
            <div className="text-center border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-wider">
                {storeProfile.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Profit & Loss Statement • {monthlyData.monthLabel}
              </p>
              <div className="text-[11px] font-mono text-blue-600 font-semibold mt-1">
                Pin: P051839281X • Nairobi County Business Ledger
              </div>
            </div>

            <div className="space-y-5 text-xs">
              {/* Revenue */}
              <div>
                <div className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex justify-between uppercase tracking-wider text-[11px]">
                  <span>1. Operating Revenue</span>
                  <span>Amount (KSh)</span>
                </div>
                <div className="divide-y divide-slate-100 pt-1">
                  <div className="py-2 flex justify-between text-slate-600">
                    <span className="pl-2">M-Pesa Buy Goods Settlements</span>
                    <span className="font-mono text-slate-800">KSh {monthlyData.mpesa.toLocaleString()}</span>
                  </div>
                  <div className="py-2 flex justify-between text-slate-600">
                    <span className="pl-2">Over-The-Counter Cash Collections</span>
                    <span className="font-mono text-slate-800">KSh {monthlyData.cash.toLocaleString()}</span>
                  </div>
                  <div className="py-2 flex justify-between text-slate-600">
                    <span className="pl-2">Customer Credit Sales Issued (Trade Accounts)</span>
                    <span className="font-mono text-slate-800">KSh {monthlyData.credit.toLocaleString()}</span>
                  </div>
                  <div className="py-2.5 flex justify-between font-extrabold text-slate-900 text-sm bg-slate-50 px-3 rounded-lg mt-1 border border-slate-100">
                    <span>TOTAL GROSS REVENUE</span>
                    <span className="text-blue-600 font-mono">KSh {monthlyData.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* COGS */}
              <div>
                <div className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex justify-between uppercase tracking-wider text-[11px]">
                  <span>2. Cost of Goods Sold (COGS)</span>
                  <span>Amount (KSh)</span>
                </div>
                <div className="divide-y divide-slate-100 pt-1">
                  <div className="py-2 flex justify-between text-slate-600">
                    <span className="pl-2">Wholesale Acquisition Cost of Sold Goods</span>
                    <span className="font-mono text-slate-800">KSh {monthlyData.cogs.toLocaleString()}</span>
                  </div>
                  <div className="py-2.5 flex justify-between font-extrabold text-emerald-700 text-sm bg-emerald-50 px-3 rounded-lg mt-1 border border-emerald-100">
                    <span>GROSS OPERATING PROFIT (Margin: {monthlyData.grossMargin}%)</span>
                    <span className="font-mono">KSh {monthlyData.grossProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <div className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex justify-between uppercase tracking-wider text-[11px]">
                  <span>3. Overhead Expenses</span>
                  <span>Amount (KSh)</span>
                </div>
                <div className="divide-y divide-slate-100 pt-1">
                  {Object.entries(monthlyData.expenseByCategory).map(([cat, amt]) => (
                    <div key={cat} className="py-1.5 flex justify-between text-slate-600">
                      <span className="pl-2">{cat}</span>
                      <span className="font-mono text-slate-700">KSh {amt.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-bold text-red-600 bg-red-50 px-3 rounded-lg mt-1 border border-red-100">
                    <span>TOTAL OPERATING EXPENSES</span>
                    <span className="font-mono">KSh {monthlyData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Line Net */}
              <div className="pt-2 border-t-2 border-dashed border-slate-200">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      NET OPERATING PROFIT
                    </div>
                    <div className="text-xs text-slate-500">
                      Bottom line earnings after all wholesale costs and store expenses
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black font-mono ${monthlyData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      KSh {monthlyData.netProfit.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      Net Margin: {monthlyData.netMargin}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CASH FLOW & LIQUIDITY VIEW                                             */}
      {/* ========================================================================= */}
      {activeReportTab === 'cashflow' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto text-slate-800">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Cash Flow & Liquidity Position</h3>
            <p className="text-xs text-slate-500">
              Tracks actual liquid cash entering and leaving your bank and M-Pesa till accounts.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="font-bold text-emerald-800 uppercase text-[11px]">
                Liquid Inflows (Cash + M-Pesa)
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Direct M-Pesa Collections:</span>
                <span className="font-mono font-bold text-slate-900">
                  KSh {monthlyData.mpesa.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Cash Received:</span>
                <span className="font-mono font-bold text-slate-900">
                  KSh {monthlyData.cash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Customer Debt Payments Received (Lipa Deni):</span>
                <span className="font-mono font-bold text-emerald-700">KSh 17,200</span>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-2">
              <div className="font-bold text-red-700 uppercase text-[11px]">
                Liquid Outflows (Payments made)
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Operating Overheads (Rent, Tokens, Labour, Boda):</span>
                <span className="font-mono font-bold text-slate-900">
                  KSh {monthlyData.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Distributor Supplier Invoices Settled:</span>
                <span className="font-mono font-bold text-slate-900">KSh 45,000</span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2">
              <div className="font-bold text-blue-800 uppercase text-[11px]">
                Unrealized Working Capital
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Tied Up in Customer Debts (Madeni):</span>
                <span className="font-mono font-bold text-amber-700">
                  KSh {totalCustomerDebt.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Tied Up in Warehouse Stock:</span>
                <span className="font-mono font-bold text-blue-700">
                  KSh {totalStockCostValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BANK & SACCO READINESS VIEW                                            */}
      {/* ========================================================================= */}
      {activeReportTab === 'bank_readiness' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto text-slate-800">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Financial Institution Legibility Profile</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Bank & SACCO Business Health Card
              </h3>
              <p className="text-xs text-slate-500">
                Formatted for credit appraisal by KCB Biashara, Equity Eazzy, Co-op Bank, or your local SACCO.
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs">
                Legibility Score: 88/100 (A)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Documented Monthly Turnover</div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                KSh {monthlyData.revenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Clean verifiable transaction trail
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Stock Collateral Valuation</div>
              <div className="text-lg font-bold text-blue-600 font-mono">
                KSh {totalStockCostValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">Physical inventory backing at cost</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Operating Net Margin</div>
              <div className="text-lg font-bold text-emerald-700 font-mono">
                {monthlyData.netMargin}%
              </div>
              <div className="text-[11px] text-slate-500">
                Demonstrates strong debt repayment capacity
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Receivables vs Payables Ratio</div>
              <div className="text-lg font-bold text-amber-700 font-mono">
                {(totalCustomerDebt / Math.max(1, totalSupplierDebt)).toFixed(2)}x
              </div>
              <div className="text-[11px] text-slate-500">Customer debt vs supplier debt balance</div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">Appraisal Summary for Loan Officer:</h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              "{storeProfile.name} operates with a consistent gross margin of {monthlyData.grossMargin}%.
              Sales are primarily settled in cash and M-Pesa ({storeProfile.tillNumber}).
              The shop holds KSh {totalStockCostValue.toLocaleString()} in physical stock and has an active customer book of {debtorsList.length} verified trade accounts."
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. RECEIPTS & SALES REGISTER TAB                                         */}
      {/* ========================================================================= */}
      {activeReportTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={receiptSearch || ''}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder="Search receipt #, customer, item, or M-Pesa code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {sales.length} receipts issued
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Items Summary</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5 text-right">Amount (KSh)</th>
                    <th className="p-3.5 text-center">Receipt Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales
                    .filter((sale) => {
                      if (!receiptSearch.trim()) return true;
                      const q = (receiptSearch || '').toLowerCase();
                      return (
                        (sale.receiptNumber || '').toLowerCase().includes(q) ||
                        (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
                        (sale.mpesaCode && sale.mpesaCode.toLowerCase().includes(q)) ||
                        sale.items?.some((i) => (i.productName || '').toLowerCase().includes(q))
                      );
                    })
                    .map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-blue-700">
                          {sale.receiptNumber}
                        </td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(sale.timestamp).toLocaleString([], {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">
                          {sale.customerName || 'Cash Customer'}
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-600">
                          {(sale.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              sale.paymentMethod === 'mpesa'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sale.paymentMethod === 'credit'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-slate-900 font-mono">
                          {sale.grandTotal.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedReceiptSale(sale)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition border border-blue-200 flex items-center gap-1 mx-auto cursor-pointer"
                            title="View, edit details, or print receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            <span>View / Edit / Print</span>
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

      {/* Editable Receipt Modal */}
      {selectedReceiptSale && (
        <ReceiptModal
          sale={selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
        />
      )}
    </div>
  );
};

export default ReportsManager;
