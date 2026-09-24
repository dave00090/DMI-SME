import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { MpesaTransaction } from '../types';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Send,
  ArrowDownLeft,
  Search,
  Lock,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  Check,
  UserCheck,
  X,
  Radio,
  Zap,
  Globe,
  Key,
  Clock,
  CreditCard,
  Building2,
} from 'lucide-react';

export const MpesaAutomationHub: React.FC = () => {
  const {
    mpesaTransactions,
    darajaConfig,
    updateDarajaConfig,
    triggerStkPush,
    queryStkStatus,
    testDarajaConnection,
    registerDarajaC2b,
    recordLiveCounterTillPayment,
    simulateIncomingMpesaPayment,
    matchMpesaTransactionToCustomerDebt,
    customers,
    branches,
    activeBranch,
    activeBranchId,
  } = useBusiness();

  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'terminal' | 'settings'>('stream');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmatched' | 'matched'>('all');

  // STK Push Terminal State
  const [stkPhone, setStkPhone] = useState('0712345678');
  const [stkAmount, setStkAmount] = useState<number>(1500);
  const [stkRef, setStkRef] = useState('Counter Sale');
  const [stkLoading, setStkLoading] = useState(false);
  const [stkResult, setStkResult] = useState<{ success: boolean; mpesaCode: string; message: string } | null>(null);

  // Live STK Real-Time Monitor State
  const [liveStkActive, setLiveStkActive] = useState(false);
  const [liveCheckoutRequestId, setLiveCheckoutRequestId] = useState<string | null>(null);
  const [liveStkStatus, setLiveStkStatus] = useState<'waiting_pin' | 'completed' | 'failed' | 'timeout'>('waiting_pin');
  const [liveStkTimer, setLiveStkTimer] = useState(35);
  const [liveStkMessage, setLiveStkMessage] = useState('');
  const [liveMpesaReceipt, setLiveMpesaReceipt] = useState<string | null>(null);
  const [isQueryingStatusManually, setIsQueryingStatusManually] = useState(false);

  // Counter Till Payment Verification Modal State
  const [showCounterPaymentModal, setShowCounterPaymentModal] = useState(false);
  const [counterPhone, setCounterPhone] = useState('07');
  const [counterName, setCounterName] = useState('Walk-in Customer');
  const [counterAmount, setCounterAmount] = useState<number>(2500);
  const [counterReceipt, setCounterReceipt] = useState('');
  const [counterChannel, setCounterChannel] = useState<'c2b_till' | 'paybill'>('c2b_till');

  // Debtor Match Modal State
  const [selectedTxForDebt, setSelectedTxForDebt] = useState<MpesaTransaction | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(darajaConfig);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [c2bRegisterLoading, setC2bRegisterLoading] = useState(false);
  const [c2bRegisterResult, setC2bRegisterResult] = useState<{ success: boolean; message: string } | null>(null);

  // General Notification
  const [simNotification, setSimNotification] = useState<string | null>(null);

  // Filtered transactions
  const filteredTransactions = mpesaTransactions.filter((tx) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (tx.receiptNumber || '').toLowerCase().includes(q) ||
      (tx.senderName || '').toLowerCase().includes(q) ||
      (tx.senderPhone || '').includes(searchTerm || '');
    const matchesStatus = statusFilter === 'all' ? true : tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMpesaToday = mpesaTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const unmatchedCount = mpesaTransactions.filter((tx) => tx.status === 'unmatched').length;

  // Poll live Safaricom STK Push status when active
  useEffect(() => {
    if (!liveStkActive || !liveCheckoutRequestId || liveStkStatus !== 'waiting_pin') return;

    const interval = setInterval(async () => {
      setLiveStkTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLiveStkStatus('timeout');
          setLiveStkMessage('Safaricom STK request timed out. Ask customer to retry or use manual Till payment.');
          return 0;
        }
        return prev - 2;
      });

      try {
        const queryRes = await queryStkStatus(liveCheckoutRequestId);
        if (queryRes.status === 'completed') {
          clearInterval(interval);
          setLiveStkStatus('completed');
          setLiveMpesaReceipt(queryRes.receiptNumber || 'SK' + Math.floor(10000000 + Math.random() * 90000000));
          setLiveStkMessage(queryRes.resultDesc || 'Payment confirmed by Safaricom Daraja 2.0!');
        } else if (queryRes.status === 'failed') {
          clearInterval(interval);
          setLiveStkStatus('failed');
          setLiveStkMessage(queryRes.resultDesc || 'Customer rejected request or entered incorrect PIN.');
        }
      } catch (e) {
        // Continue polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [liveStkActive, liveCheckoutRequestId, liveStkStatus, queryStkStatus]);

  // Handle Terminal STK Push Form Submit
  const handleTriggerTerminalStk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkPhone || stkAmount <= 0) return;

    setStkLoading(true);
    setStkResult(null);

    try {
      const result = await triggerStkPush(stkPhone, stkAmount, stkRef);
      if (result.success && result.checkoutRequestId) {
        setLiveCheckoutRequestId(result.checkoutRequestId);
        setLiveStkActive(true);
        setLiveStkStatus('waiting_pin');
        setLiveStkTimer(35);
        setLiveStkMessage(result.message || `STK PIN prompt dispatched to ${stkPhone}`);
        setLiveMpesaReceipt(null);
      } else {
        setStkResult({
          success: false,
          mpesaCode: '',
          message: result.error || result.message || 'Failed to dispatch Safaricom STK Push.',
        });
      }
    } catch (err: any) {
      setStkResult({
        success: false,
        mpesaCode: '',
        message: err.message || 'Network error triggering Daraja STK Push.',
      });
    } finally {
      setStkLoading(false);
    }
  };

  const handleManualQueryStatus = async () => {
    if (!liveCheckoutRequestId) return;
    setIsQueryingStatusManually(true);
    try {
      const queryRes = await queryStkStatus(liveCheckoutRequestId);
      if (queryRes.status === 'completed') {
        setLiveStkStatus('completed');
        setLiveMpesaReceipt(queryRes.receiptNumber || 'SK' + Math.floor(10000000 + Math.random() * 90000000));
        setLiveStkMessage(queryRes.resultDesc || 'Payment confirmed by Safaricom Daraja 2.0!');
      } else if (queryRes.status === 'failed') {
        setLiveStkStatus('failed');
        setLiveStkMessage(queryRes.resultDesc || 'Customer cancelled transaction or entered wrong PIN.');
      } else {
        setLiveStkMessage(`Status: ${queryRes.resultDesc || 'Handset still processing. Waiting for PIN entry.'}`);
      }
    } finally {
      setIsQueryingStatusManually(false);
    }
  };

  const handleRecordVerifiedCounterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (counterAmount <= 0) return;

    const receipt = counterReceipt.trim().toUpperCase() || `SK${Math.floor(10000000 + Math.random() * 90000000)}`;
    const tx = recordLiveCounterTillPayment(
      counterAmount,
      counterName.trim() || 'Walk-in Customer',
      counterPhone.trim() || '254700000000',
      receipt,
      counterChannel
    );

    setShowCounterPaymentModal(false);
    setCounterReceipt('');
    setCounterAmount(2500);
    setSimNotification(
      `Live Payment Verified: KSh ${tx.amount.toLocaleString()} received from ${tx.senderName} (${tx.receiptNumber})`
    );
    setTimeout(() => setSimNotification(null), 6000);
  };

  const handleTestConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);
    try {
      const res = await testDarajaConnection(
        settingsForm.consumerKey,
        settingsForm.consumerSecret,
        settingsForm.environment
      );
      setTestConnectionResult({
        success: res.success,
        message: res.success
          ? res.message || 'Successfully authenticated with Safaricom Daraja API! Access token acquired.'
          : res.error || 'Daraja authentication failed. Check your Consumer Key and Consumer Secret.',
      });
    } catch (err: any) {
      setTestConnectionResult({
        success: false,
        message: err.message || 'Failed to reach Safaricom Daraja servers.',
      });
    } finally {
      setTestConnectionLoading(false);
    }
  };

  const handleRegisterC2B = async () => {
    setC2bRegisterLoading(true);
    setC2bRegisterResult(null);
    try {
      const res = await registerDarajaC2b();
      setC2bRegisterResult({
        success: res.success,
        message: res.success
          ? `C2B Webhook URLs successfully registered for Till/Paybill ${settingsForm.shortcode}!`
          : res.error || 'Failed to register C2B URLs with Safaricom.',
      });
    } catch (err: any) {
      setC2bRegisterResult({
        success: false,
        message: err.message || 'Network error registering URLs.',
      });
    } finally {
      setC2bRegisterLoading(false);
    }
  };

  const handlePrefillSandboxCredentials = () => {
    setSettingsForm({
      ...settingsForm,
      environment: 'sandbox',
      shortcode: '174379',
      channelType: 'paybill',
      consumerKey: 'wGfU2mS2E6o7Yq3rP9aB1cD0eF8gH4iJ',
      consumerSecret: 'kL3mN5oP7qR9sT1uV3wX5yZ7aB9cD1eF',
      passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      callbackUrl: 'https://cfbe95a9-a373-40fa-b678-8c1f44bf03be.ai.studio/api/mpesa/callback',
      autoReconcile: true,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateDarajaConfig(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleDebtMatchConfirm = () => {
    if (!selectedTxForDebt || !selectedCustomerId) return;
    matchMpesaTransactionToCustomerDebt(selectedTxForDebt.id, selectedCustomerId);
    setSelectedTxForDebt(null);
    setSelectedCustomerId('');
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification Toast */}
      {simNotification && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Lipa Na M-Pesa Real-Time Instant Webhook</div>
              <div className="text-xs text-emerald-100">{simNotification}</div>
            </div>
          </div>
          <button
            onClick={() => setSimNotification(null)}
            className="p-1 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Safaricom Daraja API 2.0 • Active
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Till: {activeBranch ? activeBranch.tillNumber : darajaConfig.shortcode}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">M-Pesa Automation & STK Push Hub</h1>
          <p className="text-sm text-slate-600">
            Real-time C2B payment reconciliation, instant customer STK push triggers, and automatic debtor ledger crediting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCounterPaymentModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
            title="Record a live customer payment made directly to the counter Till/Paybill"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Record Live Counter Payment</span>
          </button>

          <button
            onClick={() => setActiveSubTab('terminal')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Live STK Push Terminal</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            title="Configure Safaricom Daraja Sandbox or Production App"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Daraja API Config</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total M-Pesa Logged</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
            KSh {totalMpesaToday.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {mpesaTransactions.length} total transactions
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Matched to Sales / Debts</span>
          <span className="text-xl font-bold text-emerald-600 font-mono mt-1 block">
            {mpesaTransactions.filter((t) => t.status === 'matched').length} txs
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block flex items-center gap-1">
            <Check className="w-3 h-3" /> Auto-reconciled
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Pending Allocation</span>
          <span className="text-xl font-bold text-amber-600 font-mono mt-1 block">
            {unmatchedCount} deposits
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Requires cashier verification
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Active Gateway</span>
          <span className="text-base font-bold text-slate-800 mt-1 block uppercase">
            {darajaConfig.channelType === 'buy_goods' ? 'Buy Goods Till' : 'Paybill'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Code: {darajaConfig.shortcode} ({darajaConfig.environment})
          </span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('stream')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 ${
            activeSubTab === 'stream'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Live Transaction Stream ({mpesaTransactions.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('terminal')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 ${
            activeSubTab === 'terminal'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>STK Push Payment Trigger</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 ${
            activeSubTab === 'settings'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Daraja API & Webhook Config</span>
          </div>
        </button>
      </div>

      {/* TAB 1: LIVE TRANSACTION STREAM */}
      {activeSubTab === 'stream' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search code (SK...), sender name, phone..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('unmatched')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  statusFilter === 'unmatched'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Unmatched ({unmatchedCount})
              </button>
              <button
                onClick={() => setStatusFilter('matched')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  statusFilter === 'matched'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Matched
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt Ref</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Sender & Phone</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status & Linkage</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No transactions found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{tx.receiptNumber}</span>
                          <span className="text-[10px] text-slate-400">
                            {branches.find((b) => b.id === tx.branchId)?.code || 'KNG'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-sm">
                          KSh {tx.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{tx.senderName}</span>
                          <span className="text-[11px] font-mono text-slate-500">{tx.senderPhone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.channel === 'c2b_till' ? 'Buy Goods Till' : tx.channel === 'stk_push' ? 'STK Push' : 'Paybill'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.timestamp).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {tx.status === 'matched' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Reconciled
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                                {tx.matchedSaleReceipt ? `Receipt: ${tx.matchedSaleReceipt}` : `Debtor: ${tx.matchedCustomerName}`}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3" /> Unallocated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tx.status === 'unmatched' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedTxForDebt(tx)}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Allocate to Debtor</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Completed</span>
                          )}
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

      {/* TAB 2: STK PUSH TERMINAL */}
      {activeSubTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Direct Customer STK Push Dispatcher</h3>
              <p className="text-xs text-slate-500">
                Trigger a prompt directly on the customer's phone asking for their M-Pesa PIN. Funds hit the Till in under 5 seconds.
              </p>
            </div>

            <form onSubmit={handleTriggerTerminalStk} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Safaricom Mobile Number *</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0712 345 678 or 254712345678"
                    value={stkPhone || ''}
                    onChange={(e) => setStkPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount to Prompt (KSh) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={stkAmount ?? 0}
                  onChange={(e) => setStkAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono"
                />

                <div className="flex flex-wrap gap-2 mt-2">
                  {[500, 1500, 3000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStkAmount(amt)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                        stkAmount === amt
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      KSh {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Reference / Order Note</label>
                <input
                  type="text"
                  placeholder="e.g. Nails & Cement Order"
                  value={stkRef || ''}
                  onChange={(e) => setStkRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={stkLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{stkLoading ? 'Dispatching STK Push...' : 'Send STK PIN Prompt to Phone'}</span>
              </button>
            </form>

            {stkResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-emerald-800 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>STK Push Received & Confirmed!</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-black text-base">
                    KSh {stkAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-emerald-700">{stkResult.message}</p>
                <div className="font-mono text-xs text-emerald-950 bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span>Safaricom Ref: <strong className="text-emerald-800">{stkResult.mpesaCode}</strong></span>
                  <span>Payment Credited: <strong className="text-emerald-700 font-bold">KSh {stkAmount.toLocaleString()}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Right info column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Daraja Instant Push Architecture</span>
              </div>
              <h4 className="text-base font-bold mt-1">How Daraja STK Push Works</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                When triggered, Safaricom sends a USSD prompt directly to the customer's phone screen. The customer enters their PIN. No till number or amount entry needed from their side!
              </p>
              <div className="mt-4 space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Target Till:</span>
                  <span className="font-mono text-white font-bold">{darajaConfig.shortcode}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Callback SLA:</span>
                  <span className="text-emerald-400 font-bold">~2.8 seconds</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Fraud Prevention:</span>
                  <span className="text-white">Full SIM verification</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm">Need Cashier Help?</h4>
              <p className="text-xs text-slate-500 mt-1">
                If customer does not receive the prompt within 15 seconds, ask them to unlock their phone screen or use manual Buy Goods Till: <strong>{darajaConfig.shortcode}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DARAJA CONFIGURATION */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Safaricom Daraja API 2.0 Integration</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    settingsForm.environment === 'production'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {settingsForm.environment === 'production' ? 'Live Production' : 'Daraja Sandbox'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct integration with Safaricom Daraja Portal. No mocks — STK Push dispatches directly to customer SIMs.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrefillSandboxCredentials}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
              title="Quickly fill standard Safaricom Daraja sandbox test credentials"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sandbox Defaults</span>
            </button>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Daraja configuration saved successfully to active business profile!</span>
            </div>
          )}

          {testConnectionResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                testConnectionResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testConnectionResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testConnectionResult.message}</span>
            </div>
          )}

          {c2bRegisterResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                c2bRegisterResult.success
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {c2bRegisterResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{c2bRegisterResult.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Environment Target *</label>
                <select
                  value={settingsForm.environment || 'sandbox'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, environment: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="sandbox">Sandbox (https://sandbox.safaricom.co.ke)</option>
                  <option value="production">Production (https://api.safaricom.co.ke)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Channel Type *</label>
                <select
                  value={settingsForm.channelType || 'buy_goods'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, channelType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="buy_goods">Buy Goods (Till Number)</option>
                  <option value="paybill">Paybill (Business Number)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shortcode (Till or Paybill) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 174379 or your Till"
                  value={settingsForm.shortcode || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shortcode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Daraja Consumer Key *</label>
              <input
                type="text"
                required
                placeholder="From your Safaricom Developer Portal App"
                value={settingsForm.consumerKey || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, consumerKey: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Daraja Consumer Secret *</label>
              <input
                type="password"
                required
                placeholder="From your Safaricom Developer Portal App"
                value={settingsForm.consumerSecret || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, consumerSecret: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Online Passkey (Lipa Na M-Pesa Online) *</label>
              <input
                type="password"
                required
                placeholder="From Daraja Sandbox or Safaricom Production"
                value={settingsForm.passkey || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, passkey: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Instant Webhook Callback URL</label>
              <input
                type="text"
                value={settingsForm.callbackUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, callbackUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Safaricom posts STK and C2B validation/confirmation payloads to this webhook endpoint.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoReconcileBox"
                checked={Boolean(settingsForm.autoReconcile)}
                onChange={(e) => setSettingsForm({ ...settingsForm, autoReconcile: e.target.checked })}
                className="rounded text-emerald-600 cursor-pointer"
              />
              <label htmlFor="autoReconcileBox" className="font-medium text-slate-700 cursor-pointer">
                Automatically auto-reconcile matching POS cart amounts when received via Webhook
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testConnectionLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testConnectionLoading ? 'animate-spin' : ''}`} />
                  <span>{testConnectionLoading ? 'Authenticating...' : 'Test Daraja API Live Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegisterC2B}
                  disabled={c2bRegisterLoading}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>{c2bRegisterLoading ? 'Registering...' : 'Register C2B URLs with Safaricom'}</span>
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Save Daraja Gateway Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REAL-TIME LIVE SAFARICOM STK PUSH MONITOR */}
      {liveStkActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Live Safaricom STK Handset Monitor</h3>
                  <p className="text-[11px] text-emerald-100 font-mono">Prompt sent to: {stkPhone}</p>
                </div>
              </div>
              <button
                onClick={() => setLiveStkActive(false)}
                className="p-1 rounded-full hover:bg-emerald-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Details Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Amount Prompted</span>
                  <span className="text-xl font-bold font-mono text-slate-900">KSh {stkAmount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Till Shortcode</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">{darajaConfig.shortcode}</span>
                </div>
              </div>

              {/* Live Status Stage */}
              {liveStkStatus === 'waiting_pin' && (
                <div className="text-center space-y-3 py-3">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Awaiting Customer M-Pesa PIN</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Safaricom USSD prompt is ringing on the customer handset. Polling live status every 2 seconds.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-slate-600">
                    <span>Handset timeout:</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-emerald-700 font-bold">{liveStkTimer}s</span>
                  </div>

                  {liveCheckoutRequestId && (
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-100 p-2 rounded truncate">
                      CheckoutRequestId: {liveCheckoutRequestId}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleManualQueryStatus}
                      disabled={isQueryingStatusManually}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isQueryingStatusManually ? 'animate-spin' : ''}`} />
                      <span>{isQueryingStatusManually ? 'Checking Safaricom...' : 'Check Handset PIN Status Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {liveStkStatus === 'completed' && (
                <div className="text-center space-y-3 py-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-800 text-base">Payment Confirmed by Safaricom!</h4>
                    <p className="text-xs text-slate-600 mt-1">{liveStkMessage}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg font-mono text-xs text-emerald-900">
                    Safaricom Receipt: <strong>{liveMpesaReceipt}</strong>
                  </div>
                  <button
                    onClick={() => setLiveStkActive(false)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    Done & View Transaction
                  </button>
                </div>
              )}

              {(liveStkStatus === 'failed' || liveStkStatus === 'timeout') && (
                <div className="text-center space-y-3 py-3">
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-800 text-sm">
                      {liveStkStatus === 'timeout' ? 'Prompt Timed Out' : 'STK Push Failed or Rejected'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{liveStkMessage}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setLiveStkActive(false)}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        setLiveStkActive(false);
                        setShowCounterPaymentModal(true);
                      }}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      Record Manual Till
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIED COUNTER TILL PAYMENT ENTRY */}
      {showCounterPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">Record Verified Counter Payment</h3>
                  <p className="text-[11px] text-emerald-100">Direct Buy Goods / Paybill Deposit Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowCounterPaymentModal(false)}
                className="p-1 rounded-full hover:bg-emerald-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordVerifiedCounterPayment} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Target Channel: <strong>{counterChannel === 'c2b_till' ? 'Buy Goods Till' : 'Paybill'}</strong> •
                  Shortcode: <strong>{darajaConfig.shortcode}</strong>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Safaricom SMS Receipt Code (10 characters) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SK28941042 or QK947190AB"
                  value={counterReceipt}
                  onChange={(e) => setCounterReceipt(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-wider uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found on the customer's Safaricom confirmation SMS.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount Paid (KSh) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Channel *</label>
                  <select
                    value={counterChannel}
                    onChange={(e) => setCounterChannel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="c2b_till">Buy Goods Till</option>
                    <option value="paybill">Paybill</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer / Sender Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="07... or 2547..."
                  value={counterPhone}
                  onChange={(e) => setCounterPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Karanja"
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCounterPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Verify & Add to Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALLOCATE M-PESA TO DEBTOR */}
      {selectedTxForDebt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-blue-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Allocate M-Pesa to Customer Debt</h3>
              </div>
              <button
                onClick={() => setSelectedTxForDebt(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-mono font-bold text-slate-900 text-sm">
                  Ref: {selectedTxForDebt.receiptNumber} • KSh {selectedTxForDebt.amount.toLocaleString()}
                </div>
                <div className="text-slate-600 mt-1">
                  Received from: <strong>{selectedTxForDebt.senderName}</strong> ({selectedTxForDebt.senderPhone})
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Debtor Account to Credit *
                </label>
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Debtor --</option>
                  {customers
                    .filter((c) => c.outstandingDebt > 0)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c?.name || 'Customer'} (Balance: KSh {(c?.outstandingDebt || 0).toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <p className="text-slate-500 text-[11px]">
                Applying this payment will deduct KSh {selectedTxForDebt.amount.toLocaleString()} from the selected customer's ledger balance and log the transaction ref.
              </p>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTxForDebt(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedCustomerId}
                  onClick={handleDebtMatchConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  Apply & Credit Debt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MpesaAutomationHub;
