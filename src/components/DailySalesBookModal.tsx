import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Printer,
  Share2,
  X,
  History,
  AlertCircle,
  Sparkles,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { DailySalesBook } from '../types';

interface DailySalesBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'start' | 'close' | 'history';
}

export const DailySalesBookModal: React.FC<DailySalesBookModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'start',
}) => {
  const {
    currentSalesBook,
    salesBooksHistory,
    isSalesBookOpen,
    startTodaySales,
    closeTodaySales,
    metricsToday,
    totalCustomerDebt,
    totalStockCostValue,
    storeProfile,
    setActiveTab,
  } = useBusiness();

  const [mode, setMode] = useState<'start' | 'close' | 'history'>(
    initialMode || (isSalesBookOpen ? 'close' : 'start')
  );

  // Start Form State
  const [openingFloat, setOpeningFloat] = useState<number>(2500);
  const [cashierName, setCashierName] = useState<string>(
    storeProfile.cashierName || 'Store Cashier'
  );

  // Close Form State
  const [closingNotes, setClosingNotes] = useState<string>(
    'All cash balanced against M-Pesa till. Ready for evening lock-up.'
  );
  const [selectedHistoricalBook, setSelectedHistoricalBook] = useState<DailySalesBook | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const todayFormatted = new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleStartSalesBook = (e: React.FormEvent) => {
    e.preventDefault();
    startTodaySales(Number(openingFloat) || 0, cashierName);
    setActiveTab('pos');
    onClose();
  };

  const handleCloseSalesBook = (e: React.FormEvent) => {
    e.preventDefault();
    closeTodaySales(closingNotes, storeProfile.cashierName);
    onClose();
  };

  const handleCopyZReport = (book?: DailySalesBook | null) => {
    const b = book || currentSalesBook;
    const stats = b?.closingStats || {
      totalSales: metricsToday.sales,
      grossProfit: metricsToday.grossProfit,
      expenses: metricsToday.expenses,
      netProfit: metricsToday.netProfit,
      cashCollected: metricsToday.cashCollected,
      mpesaCollected: metricsToday.mpesaCollected,
      creditSales: metricsToday.debtGivenToday,
      outstandingCustomerDebt: totalCustomerDebt,
      stockValue: totalStockCostValue,
    };

    const text = `=============================
*${(storeProfile?.name || 'DMi Business Store').toUpperCase()}*
*DAILY SALES BOOK Z-REPORT*
=============================
Date: ${b?.date || todayFormatted}
Opened At: ${b?.openedAt ? new Date(b.openedAt).toLocaleTimeString() : 'Morning'}
Closed At: ${b?.closedAt ? new Date(b.closedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
Cashier: ${b?.closedBy || b?.openedBy || storeProfile?.cashierName || 'Cashier'}
Opening Cash Float: KSh ${(b?.openingCashFloat || 0).toLocaleString()}

--- BUSINESS INTELLIGENCE ---
Today's sales: KSh ${stats.totalSales.toLocaleString()}
Gross profit: KSh ${stats.grossProfit.toLocaleString()}
Expenses: KSh ${stats.expenses.toLocaleString()}
Estimated net: KSh ${stats.netProfit.toLocaleString()}
Outstanding customer debt: KSh ${stats.outstandingCustomerDebt.toLocaleString()}
Stock value: KSh ${stats.stockValue.toLocaleString()}

--- CASH DRAWER RECONCILIATION ---
Cash Collected: KSh ${stats.cashCollected.toLocaleString()}
Expected Cash in Till: KSh {((b?.openingCashFloat || 0) + stats.cashCollected).toLocaleString()}
M-Pesa Till: KSh ${stats.mpesaCollected.toLocaleString()}
Credit Given Today: KSh ${stats.creditSales.toLocaleString()}

Notes: ${b?.closingNotes || closingNotes || 'None'}
=============================
Generated via DMi Business OS`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleSendWhatsAppZReport = () => {
    handleCopyZReport();
    const stats = {
      totalSales: metricsToday.sales,
      grossProfit: metricsToday.grossProfit,
      expenses: metricsToday.expenses,
      netProfit: metricsToday.netProfit,
      outstandingCustomerDebt: totalCustomerDebt,
      stockValue: totalStockCostValue,
    };

    const msg = `*${storeProfile?.name || 'DMi Business Store'} - End-of-Day Sales Book Summary*
📅 ${todayFormatted}

*Business Intelligence:*
• Today's sales: KSh ${stats.totalSales.toLocaleString()}
• Gross profit: KSh ${stats.grossProfit.toLocaleString()}
• Expenses: KSh ${stats.expenses.toLocaleString()}
• Estimated net: KSh ${stats.netProfit.toLocaleString()}
• Outstanding customer debt: KSh ${stats.outstandingCustomerDebt.toLocaleString()}
• Stock value: KSh ${stats.stockValue.toLocaleString()}

*Cash Drawer:*
• Cash in till: KSh {((currentSalesBook?.openingCashFloat || 0) + metricsToday.cashCollected).toLocaleString()}
• M-Pesa: KSh ${metricsToday.mpesaCollected.toLocaleString()}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isSalesBookOpen
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}
            >
              {isSalesBookOpen ? <BookOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Daily Sales Book Manager
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isSalesBookOpen
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSalesBookOpen ? '● Book Open' : '○ Book Closed'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{todayFormatted}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-semibold">
          {!isSalesBookOpen ? (
            <button
              type="button"
              onClick={() => setMode('start')}
              className={`py-3 px-4 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                mode === 'start'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Start Today's Sales</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('close')}
              className={`py-3 px-4 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                mode === 'close'
                  ? 'border-rose-600 text-rose-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Close Today's Sales</span>
            </button>
          )}

          {isSalesBookOpen && (
            <button
              type="button"
              onClick={() => setMode('start')}
              className={`py-3 px-4 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                mode === 'start'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Reopen / New Book</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode('history')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              mode === 'history'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Closed Books Archive ({salesBooksHistory.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* 1. START TODAY'S SALES MODE */}
          {mode === 'start' && (
            <form onSubmit={handleStartSalesBook} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Open a Fresh Sales Book for Today
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Starting today's sales initializes the daily cash drawer, begins counting shift transactions, 
                  and connects your day's turnover to wholesale costs and operating expenses.
                </p>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Cashier on Shift
                </label>
                <input
                  type="text"
                  required
                  value={cashierName || ''}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="e.g. Maina (Store Cashier)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    Opening Cash Float in Drawer (KSh)
                  </label>
                  <span className="text-slate-400 text-[11px]">Change for morning customers</span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={openingFloat ?? 0}
                  onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                  placeholder="2500"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base font-mono font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[0, 1000, 2000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningFloat(preset)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                        openingFloat === preset
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      KSh {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Today's Sales Book</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. CLOSE TODAY'S SALES MODE */}
          {mode === 'close' && (
            <form onSubmit={handleCloseSalesBook} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Close Today's Sales Book & Z-Reading
                </h4>
                <p className="text-amber-800/90 text-xs leading-relaxed">
                  Reconcile all cash and M-Pesa receipts, calculate final net profit, and archive today's books.
                </p>
              </div>

              {/* Business Intelligence Snapshot */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-sans">
                  <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">
                    Today's Business Intelligence
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Opened at: {currentSalesBook?.openedAt ? new Date(currentSalesBook.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Morning'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-300">Today's sales:</span>
                    <span className="font-bold text-white">KSh {(metricsToday?.sales || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-slate-800/60 p-2 rounded">
                    <span className="text-emerald-300">Gross profit:</span>
                    <span className="font-bold text-emerald-400">KSh {(metricsToday?.grossProfit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-slate-800/60 p-2 rounded">
                    <span className="text-rose-300">Expenses:</span>
                    <span className="font-bold text-rose-400">KSh {(metricsToday?.expenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-blue-900/60 p-2 rounded border border-blue-500/40">
                    <span className="text-blue-200">Estimated net:</span>
                    <span className="font-bold text-blue-300">KSh {(metricsToday?.netProfit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-slate-800/60 p-2 rounded">
                    <span className="text-amber-300">Outstanding debt:</span>
                    <span className="font-bold text-amber-400">KSh {(totalCustomerDebt || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-slate-800/60 p-2 rounded">
                    <span className="text-cyan-300">Stock value:</span>
                    <span className="font-bold text-cyan-400">KSh {(totalStockCostValue || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Cash Reconciliation Summary */}
                <div className="pt-2 border-t border-slate-700/80 text-[11px] space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Opening Cash Float:</span>
                    <span className="text-slate-200 font-bold">KSh {(currentSalesBook?.openingCashFloat || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Sales Collected:</span>
                    <span className="text-emerald-300 font-bold">KSh {(metricsToday?.cashCollected || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-xs border-t border-slate-700 pt-1">
                    <span>Expected Cash in Drawer:</span>
                    <span className="text-emerald-400">
                      KSh {((currentSalesBook?.openingCashFloat || 0) + (metricsToday?.cashCollected || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>M-Pesa Till Total:</span>
                    <span className="text-slate-200">KSh {(metricsToday?.mpesaCollected || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Closing Notes / Shift Handover
                </label>
                <textarea
                  rows={2}
                  value={closingNotes || ''}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Till balanced, keys handed over to evening guard"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons: Copy / WhatsApp / Close */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyZReport()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Copied Z-Report!' : 'Copy Z-Report'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsAppZReport}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>WhatsApp Close</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Close Today's Sales</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 3. CLOSED BOOKS ARCHIVE MODE */}
          {mode === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Archived Daily Sales Books
                </h4>
                <span className="text-[11px] text-slate-500">
                  {salesBooksHistory.length} closed book records
                </span>
              </div>

              {salesBooksHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No historical closed books yet. Once you close today's sales, it will be safely archived here.
                </div>
              ) : (
                <div className="space-y-3">
                  {salesBooksHistory.map((book) => (
                    <div
                      key={book.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs font-mono">{book.date}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                            Cashier: {book.closedBy || book.openedBy}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          Closed
                        </span>
                      </div>

                      {book.closingStats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                          <div className="bg-slate-50 p-1.5 rounded">
                            <span className="text-slate-500 block text-[10px]">Sales:</span>
                            <span className="font-bold text-slate-900">KSh {(book.closingStats.totalSales || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-emerald-50/60 p-1.5 rounded">
                            <span className="text-emerald-600 block text-[10px]">Gross Profit:</span>
                            <span className="font-bold text-emerald-700">KSh {(book.closingStats.grossProfit || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-rose-50/60 p-1.5 rounded">
                            <span className="text-rose-600 block text-[10px]">Expenses:</span>
                            <span className="font-bold text-rose-700">KSh {(book.closingStats.expenses || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-blue-50/60 p-1.5 rounded">
                            <span className="text-blue-600 block text-[10px]">Net Profit:</span>
                            <span className="font-bold text-blue-700">KSh {(book.closingStats.netProfit || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded">
                            <span className="text-slate-500 block text-[10px]">Cash Drawer:</span>
                            <span className="font-bold text-slate-800">KSh {(book.closingStats.cashCollected || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded">
                            <span className="text-slate-500 block text-[10px]">M-Pesa:</span>
                            <span className="font-bold text-slate-800">KSh {(book.closingStats.mpesaCollected || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {book.closingNotes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                          "{book.closingNotes}"
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyZReport(book)}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Copy This Z-Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySalesBookModal;
