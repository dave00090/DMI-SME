import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { BookOpen, Sparkles, CheckCircle2, ChevronRight, X, ArrowRight, DollarSign } from 'lucide-react';

interface FloatingSalesBookControlProps {
  onNavigateToSales?: () => void;
}

export const FloatingSalesBookControl: React.FC<FloatingSalesBookControlProps> = ({
  onNavigateToSales,
}) => {
  const {
    isSalesBookOpen,
    currentSalesBook,
    startTodaySales,
    currentEmployee,
    setActiveTab,
    metricsToday,
  } = useBusiness();

  const [isOpenPromptModal, setIsOpenPromptModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<number>(2500);
  const [showActivePopover, setShowActivePopover] = useState(false);
  const [justOpenedToast, setJustOpenedToast] = useState(false);

  const handleQuickOpen = () => {
    startTodaySales(openingFloat, currentEmployee?.name || 'Attendant');
    setActiveTab('pos');
    if (onNavigateToSales) onNavigateToSales();
    setIsOpenPromptModal(false);
    setJustOpenedToast(true);
    setTimeout(() => setJustOpenedToast(false), 4000);
  };

  return (
    <>
      {/* Toast Notification when opened */}
      {justOpenedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Sales Book is Now OPEN!</p>
            <p className="text-[11px] text-emerald-200">
              'Sales' tab is now unlocked and revealed in your navigation bar.
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {/* Active Popover summary when open */}
        {isSalesBookOpen && showActivePopover && (
          <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-4 shadow-2xl w-72 text-xs space-y-3 backdrop-blur-md mb-1 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300">Sales Book is OPEN</span>
              </div>
              <button
                onClick={() => setShowActivePopover(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close popover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Opened By:</span>
                <strong className="text-white">{currentSalesBook?.openedBy || currentEmployee?.name || 'Attendant'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Opening Float:</span>
                <span className="font-mono text-emerald-300">
                  KSh {Number(currentSalesBook?.openingCashFloat || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Today's Sales:</span>
                <span className="font-mono text-white font-bold">
                  KSh {Number(metricsToday?.sales || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('pos');
                  setShowActivePopover(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded-xl text-center text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Go to Sales POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!isSalesBookOpen ? (
          <button
            id="fab-book-open"
            onClick={() => setIsOpenPromptModal(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl border-2 border-amber-300 cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse"
            title="Click to Open Sales Book for Today and reveal Sales POS in navigation"
            aria-label="Open Sales Book"
          >
            <div className="w-6 h-6 rounded-full bg-slate-950/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-slate-950" />
            </div>
            <span className="tracking-wide">Book Open</span>
            <span className="hidden md:inline text-[11px] font-medium bg-slate-950/15 px-2 py-0.5 rounded-full">
              Unlock Sales
            </span>
          </button>
        ) : (
          <button
            id="fab-book-active"
            onClick={() => setShowActivePopover(!showActivePopover)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg border border-emerald-400 cursor-pointer transition transform hover:scale-105"
            title="Sales Book is active and open today. Click for quick actions"
            aria-label="Sales Book Open Active"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <BookOpen className="w-4 h-4 text-white" />
            <span>Book Open</span>
            <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded-md font-mono">
              Active
            </span>
          </button>
        )}
      </div>

      {/* Quick Confirmation Modal to open Sales Book with float */}
      {isOpenPromptModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Open Today's Sales Book</h3>
                  <p className="text-xs text-slate-500">Unlocks Sales POS in navigation bar</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenPromptModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Cash Register Opening Routine
              </p>
              <p className="text-blue-700">
                Opening the Sales Book records your till opening time, cash float, and immediately reveals the <strong>Sales</strong> item in the sidebar navigation.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Cashier on Duty
                </label>
                <input
                  type="text"
                  disabled
                  value={currentEmployee?.name || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Morning Cash Float (Change in Till) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                    KSh
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsOpenPromptModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickOpen}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Mark Book Open</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
