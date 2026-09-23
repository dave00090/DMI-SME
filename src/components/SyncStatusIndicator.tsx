import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Database,
  ArrowRight,
  Shield,
  Key,
  X,
  FileCode,
  Smartphone,
  Cpu,
} from 'lucide-react';
import { offlineWriteQueue, QueueItem } from '../lib/powersync/offlineQueue';
import { supabaseAuth } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';

interface SyncStatusIndicatorProps {
  onOpenAuthModal?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ onOpenAuthModal }) => {
  const { isOnline, toggleNetwork } = useBusiness();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({ pending: 0, syncing: 0, error: 0, synced: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'deltas' | 'schema' | 'auth'>('queue');
  const [isManuallySyncing, setIsManuallySyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineWriteQueue.subscribe((items, currentStats) => {
      setQueueItems(items);
      setStats(currentStats);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsManuallySyncing(true);
    await offlineWriteQueue.processQueue(true);
    setTimeout(() => setIsManuallySyncing(false), 600);
  };

  const handleRetryFailed = () => {
    offlineWriteQueue.retryFailed();
  };

  const currentStaff = supabaseAuth.getActiveStaff();
  const session = supabaseAuth.getSession();

  return (
    <>
      {/* Clickable Header Status Badge */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-2xs ${
          !isOnline
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            : stats.error > 0
            ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            : stats.pending > 0 || stats.syncing > 0
            ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
        }`}
        title="View PowerSync & Supabase Offline Write Queue"
      >
        {!isOnline ? (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">Offline (SQLite)</span>
            {stats.pending > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                {stats.pending}
              </span>
            )}
          </>
        ) : stats.error > 0 ? (
          <>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Sync Error ({stats.error})</span>
          </>
        ) : stats.syncing > 0 || stats.pending > 0 ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span className="hidden sm:inline">Pending ({stats.pending + stats.syncing})</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Synced</span>
          </>
        )}
      </button>

      {/* Sync & Queue Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">PowerSync + Supabase Sync Monitor</h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Local SQLite Source of Truth • Additive Delta Sync
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Overview Cards */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Network Engine</span>
                <div className="flex items-center gap-1.5 mt-1 font-bold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <span>{isOnline ? 'Cloud Online' : 'Local SQLite'}</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Pending Writes</span>
                <div className="font-mono font-bold text-sm text-blue-700 mt-0.5">
                  {stats.pending} items
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Sync Errors</span>
                <div className="font-mono font-bold text-sm text-rose-600 mt-0.5">
                  {stats.error} items
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Supabase Session</span>
                <div className="font-bold text-slate-800 truncate mt-0.5">
                  {currentStaff ? currentStaff.full_name.split(' ')[0] : 'Guest Cashier'}
                </div>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('queue')}
                className={`py-2.5 px-3 border-b-2 transition ${
                  activeTab === 'queue'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Offline Queue ({queueItems.length})
              </button>
              <button
                onClick={() => setActiveTab('deltas')}
                className={`py-2.5 px-3 border-b-2 transition ${
                  activeTab === 'deltas'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Stock Delta Engine
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`py-2.5 px-3 border-b-2 transition ${
                  activeTab === 'schema'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                RLS & Sync Rules
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'queue' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleManualSync}
                        disabled={isManuallySyncing}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isManuallySyncing ? 'animate-spin' : ''}`} />
                        <span>Sync Queue Now</span>
                      </button>
                      {stats.error > 0 && (
                        <button
                          onClick={handleRetryFailed}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Retry Failed ({stats.error})</span>
                        </button>
                      )}
                      <button
                        onClick={() => offlineWriteQueue.clearSynced()}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                      >
                        Clear Synced
                      </button>
                    </div>

                    <button
                      onClick={toggleNetwork}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                        isOnline
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isOnline ? 'Simulate Disconnect' : 'Reconnect Cloud'}
                    </button>
                  </div>

                  {queueItems.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Offline Write Queue is Clear</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        All local SQLite transactions are fully synced with Supabase Postgres.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queueItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                  item.status === 'synced'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'error'
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.status === 'syncing'
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="font-bold text-slate-800">{item.tableName}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600 font-semibold">{item.operation}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 font-mono truncate">
                            {JSON.stringify(item.payload)}
                          </div>

                          {item.errorMessage && (
                            <p className="text-[10px] text-rose-600 font-medium">
                              ⚠️ {item.errorMessage} (Attempt {item.attempts}/{item.maxAttempts})
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'deltas' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-indigo-900 space-y-1.5">
                    <h4 className="font-bold text-xs flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      <span>Why Additive Deltas Never Overwrite Stock</span>
                    </h4>
                    <p className="text-[11px] leading-relaxed text-indigo-800">
                      Standard Last-Write-Wins (LWW) will corrupt physical inventory if multiple offline counter
                      terminals record sales for the same SKU simultaneously. With PowerSync, every sale emits an
                      immutable signed delta (<code className="font-bold">-5</code>, <code className="font-bold">-10</code>) rather than writing absolute quantities.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="font-bold text-slate-700 block">Delta Sync Formula</span>
                    <pre className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto">
{`-- Supabase Postgres Aggregate Trigger
SELECT 
  p.name,
  p.cost_price,
  p.selling_price,
  -- Real-time stock across all offline terminals:
  coalesce(sum(d.delta_quantity), 0) as current_stock
FROM products p
LEFT JOIN inventory_stock_deltas d ON d.product_id = p.id
WHERE p.business_id = 'BUS-8F42K91'
GROUP BY p.id;`}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'schema' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-slate-600" />
                        <span>Supabase Row-Level Security (RLS) Policy</span>
                      </span>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                        business_id isolation
                      </span>
                    </div>
                    <pre className="p-2.5 bg-slate-900 text-blue-300 font-mono text-[11px] rounded-lg overflow-x-auto">
{`-- Enforces that no cashier or terminal can ever see another shop's data
CREATE POLICY "Products isolated by business"
ON public.products FOR ALL
USING (business_id = (SELECT business_id FROM staff WHERE auth_user_id = auth.uid()));`}
                    </pre>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="font-bold text-slate-800">PowerSync Sync-Rules YAML Spec</span>
                    <pre className="p-2.5 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-lg overflow-x-auto">
{`bucket_definitions:
  business_data:
    parameters:
      - select id as business_id from businesses where id = request.jwt ->> 'business_id'
    data:
      - select * from staff where business_id = bucket.business_id
      - select * from products where business_id = bucket.business_id
      - select * from inventory_stock_deltas where business_id = bucket.business_id`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                Platform: <strong>React/Electron + Capacitor SQLite</strong>
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
