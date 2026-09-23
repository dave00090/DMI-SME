import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  Store,
  Wifi,
  WifiOff,
  RefreshCw,
  MessageCircle,
  Share2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  PhoneCall,
  MapPin,
  Clock,
} from 'lucide-react';
import WhatsAppSummaryModal from './WhatsAppSummaryModal';

export const Navbar: React.FC = () => {
  const {
    storeProfile,
    activeTab,
    setActiveTab,
    isOnline,
    toggleNetwork,
    syncStatus,
    pendingSyncCount,
    triggerManualSync,
    lowStockProducts,
    debtorsList,
  } = useBusiness();

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', badge: null },
    { id: 'pos', label: 'POS & Sales', badge: null },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'debtors',
      label: 'Debtors (Madeni)',
      badge: debtorsList.length > 0 ? `${debtorsList.length}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'suppliers', label: 'Suppliers & Quotes', badge: null },
    { id: 'expenses', label: 'Expenses', badge: null },
    { id: 'reports', label: 'P&L & Financials', badge: null },
    { id: 'ai-advisor', label: 'AI Advisor', badge: 'Gemini', badgeColor: 'bg-emerald-600 text-white' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Top Banner / Store Info & Connectivity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium text-amber-400">
              <Store className="w-3.5 h-3.5" />
              <span>{storeProfile.name}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3" />
              <span>{storeProfile.location}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-800">
                Till: {storeProfile.tillNumber}
              </span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-800">
                Paybill: {storeProfile.paybillNumber}
              </span>
            </div>
          </div>

          {/* Network & Offline Status Handler */}
          <div className="flex items-center gap-3">
            {/* Sync Animation / Status */}
            {syncStatus === 'syncing' ? (
              <div className="flex items-center gap-1.5 text-amber-400 font-medium animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>SYNCING TRANSACTIONS...</span>
              </div>
            ) : syncStatus === 'synced' ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SYNC COMPLETE ✓</span>
              </div>
            ) : !isOnline ? (
              <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span>OFFLINE MODE ({pendingSyncCount} queued locally)</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span>Cloud Connected</span>
              </div>
            )}

            {/* Offline Test Toggle Button */}
            <button
              onClick={toggleNetwork}
              title="Simulate Safaricom/ISP connection outage & offline store operations"
              className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 border ${
                isOnline
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {isOnline ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Simulate Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-white" />
                  <span>Restore Connection & Sync</span>
                </>
              )}
            </button>

            {/* WhatsApp Daily Summary Button */}
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 shadow-sm text-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Daily Summary</span>
              <span className="sm:hidden">Summary</span>
            </button>
          </div>
        </div>

        {/* Main Nav Bar Tabs */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-1 shrink-0">
            <div className="mr-3 flex items-center gap-2">
              <span className="font-black tracking-tight text-lg text-white font-mono bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                DMi<span className="text-white text-sm font-sans font-bold ml-1">Business</span>
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono hidden md:inline">
                Kenya MSE v2.4
              </span>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto py-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 relative ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                          item.badgeColor || 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {isWhatsAppModalOpen && (
        <WhatsAppSummaryModal onClose={() => setIsWhatsAppModalOpen(false)} />
      )}
    </header>
  );
};

export default Navbar;
