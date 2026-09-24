import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Customer } from '../types';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  MessageCircle,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  Clock,
  Send,
  X,
  Smartphone,
  Banknote,
  Building,
} from 'lucide-react';

export const DebtorsManager: React.FC = () => {
  const {
    customers,
    totalCustomerDebt,
    debtorsList,
    recordDebtPayment,
    addCustomer,
    generateCustomerReminderText,
    storeProfile,
  } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'debtors' | 'overdue'>('debtors');

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCustForPayment, setSelectedCustForPayment] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank'>('mpesa');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedCustForStatement, setSelectedCustForStatement] = useState<Customer | null>(null);

  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '07',
    location: '',
    creditLimit: 20000,
    creditDueDate: '2026-09-30',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        (c?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c?.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c?.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()));

      if (filterStatus === 'debtors') {
        return matchSearch && c.outstandingDebt > 0;
      }
      if (filterStatus === 'overdue') {
        return matchSearch && c.status === 'overdue';
      }
      return matchSearch;
    });
  }, [customers, searchQuery, filterStatus]);

  const handleOpenPayment = (customer: Customer) => {
    setSelectedCustForPayment(customer);
    setPaymentAmount(customer.outstandingDebt);
    setPaymentMethod('mpesa');
    setPaymentRef('QGD' + Math.floor(1000000 + Math.random() * 9000000));
    setPaymentNotes('Lipa Deni settlement');
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPayment || paymentAmount <= 0) return;
    recordDebtPayment(
      selectedCustForPayment.id,
      paymentAmount,
      paymentMethod,
      paymentRef,
      paymentNotes
    );
    setIsPayModalOpen(false);
    setSelectedCustForPayment(null);
  };

  const handleSendReminder = (customer: Customer) => {
    const text = generateCustomerReminderText(customer);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;
    addCustomer({
      name: newCust.name,
      phone: newCust.phone,
      location: newCust.location,
      creditLimit: newCust.creditLimit,
      creditDueDate: newCust.creditDueDate,
    });
    setIsNewCustModalOpen(false);
    setNewCust({
      name: '',
      phone: '07',
      location: '',
      creditLimit: 20000,
      creditDueDate: '2026-09-30',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider">
              Kitabu cha Madeni
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Debtors & Customer Credit Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track outstanding customer balances, due dates, credit limits, and 1-click WhatsApp reminders.
          </p>
        </div>

        <button
          onClick={() => setIsNewCustModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Uncollected Debt (Madeni)
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono mt-1">
            KSh {totalCustomerDebt.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total money owed across all shop credit accounts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Debtors
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {debtorsList.length} Customers
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Customers with pending balances to follow up
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            M-Pesa Buy Goods Till
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {storeProfile.tillNumber}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Included in every automated WhatsApp reminder
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debtor name, phone, site..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setFilterStatus('debtors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'debtors'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Owing Only ({debtorsList.length})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'overdue'
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Overdue Accounts
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All Registered ({customers.length})
          </button>
        </div>
      </div>

      {/* Debtors Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-600 uppercase bg-slate-50 border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-4">Customer & Site</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4 text-right">Amount Owed</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCustomers.map((c) => {
                const isOverdue = c.status === 'overdue';
                const hasDebt = c.outstandingDebt > 0;
                const isSevere = c.outstandingDebt >= 20000;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <span className="text-[11px] text-slate-500">{c.location || 'Nairobi'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-right">
                      <span className={hasDebt ? 'text-red-600' : 'text-emerald-600'}>
                        KSh {c.outstandingDebt.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      KSh {c.creditLimit.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {c.creditDueDate ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{c.creditDueDate}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isSevere
                            ? 'bg-red-100 text-red-700'
                            : isOverdue
                            ? 'bg-orange-100 text-orange-700'
                            : hasDebt
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSevere ? 'Severe' : isOverdue ? 'Overdue' : hasDebt ? 'Active' : 'Clear'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasDebt && (
                          <button
                            onClick={() => handleSendReminder(c)}
                            title="Send polite WhatsApp debt reminder"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenPayment(c)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                        >
                          Lipa Deni
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCustForStatement(c);
                            setIsStatementModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer border border-slate-200"
                          title="View Statement & Payment Ledger"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Lipa Deni (Record Debt Payment) */}
      {isPayModalOpen && selectedCustForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Lipa Deni (Receive Payment)</h3>
                <p className="text-xs text-slate-500">
                  {selectedCustForPayment?.name || 'Customer'} • Total Debt: KSh{' '}
                  {(selectedCustForPayment?.outstandingDebt || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Amount Received (KSh) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustForPayment.outstandingDebt}
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Payment Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition ${
                      paymentMethod === 'mpesa'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>M-Pesa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition ${
                      paymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition ${
                      paymentMethod === 'bank'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Bank</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  M-Pesa Ref / Transaction Code
                </label>
                <input
                  type="text"
                  value={paymentRef || ''}
                  onChange={(e) => setPaymentRef(e.target.value.toUpperCase())}
                  placeholder="QGD9981LL4"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Payment Notes</label>
                <input
                  type="text"
                  value={paymentNotes || ''}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via Till after site delivery"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-mono">
                    KSh {selectedCustForPayment.outstandingDebt.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Remaining Balance:</span>
                  <span className="font-mono">
                    KSh{' '}
                    {Math.max(
                      0,
                      selectedCustForPayment.outstandingDebt - paymentAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Record Payment ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Customer Statement & History */}
      {isStatementModalOpen && selectedCustForStatement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Customer Statement</h3>
                <p className="text-xs text-slate-500">{selectedCustForStatement?.name || 'Customer'}</p>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Phone:</span>
                <span className="font-mono text-slate-900 font-medium">
                  {selectedCustForStatement.phone}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Location:</span>
                <span className="text-slate-900 font-medium">
                  {selectedCustForStatement.location || 'Nairobi'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Credit Limit:</span>
                <span className="font-mono text-slate-900 font-medium">
                  KSh {selectedCustForStatement.creditLimit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-slate-200">
                <span>Outstanding Debt:</span>
                <span className="text-sm font-mono">
                  KSh {selectedCustForStatement.outstandingDebt.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Past Payments & Settlements
              </h4>
              {(!selectedCustForStatement.paymentHistory || selectedCustForStatement.paymentHistory.length === 0) ? (
                <p className="text-xs text-slate-400 py-3 text-center">No payment records yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(selectedCustForStatement.paymentHistory || []).map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono text-[10px] text-slate-500">{p.date}</span>
                        <div className="text-[11px] text-slate-800 font-medium">
                          {p.method.toUpperCase()} {p.reference ? `(${p.reference})` : ''}
                        </div>
                        {p.notes && <div className="text-[10px] text-slate-500">{p.notes}</div>}
                      </div>
                      <span className="font-mono font-bold text-emerald-600">
                        +KSh {p.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Register New Customer */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Register New Customer</h3>
                <p className="text-xs text-slate-500">Add to debtor book & credit ledger</p>
              </div>
              <button
                onClick={() => setIsNewCustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCust.name || ''}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Kiprono Kiprop, Westlands Sites"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Phone Number (M-Pesa / WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={newCust.phone || ''}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="0712 345 678"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Site / Workshop Location
                </label>
                <input
                  type="text"
                  value={newCust.location || ''}
                  onChange={(e) => setNewCust({ ...newCust, location: e.target.value })}
                  placeholder="e.g. Kangemi Plot 4B, Kitisuru Site"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    Credit Limit (KSh)
                  </label>
                  <input
                    type="number"
                    value={newCust.creditLimit ?? 0}
                    onChange={(e) =>
                      setNewCust({ ...newCust, creditLimit: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Default Due Date</label>
                  <input
                    type="date"
                    value={newCust.creditDueDate || ''}
                    onChange={(e) => setNewCust({ ...newCust, creditDueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorsManager;
