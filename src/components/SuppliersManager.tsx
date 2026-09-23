import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Supplier, SupplierQuote } from '../types';
import {
  Truck,
  Plus,
  DollarSign,
  Phone,
  Calendar,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Building2,
  X,
  ArrowRight,
  Receipt,
  Scale,
  Pencil,
  Trash2,
} from 'lucide-react';

export const SuppliersManager: React.FC = () => {
  const {
    suppliers,
    totalSupplierDebt,
    supplierQuotes,
    addSupplierQuote,
    recordSupplierPayment,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useBusiness();

  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'comparison'>('comparison');
  const [selectedProductForComparison, setSelectedProductForComparison] =
    useState<string>('Cement 50kg');

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSupForPay, setSelectedSupForPay] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payRef, setPayRef] = useState<string>('');

  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({
    supplierId: suppliers[0]?.id || '',
    productName: 'Cement 50kg',
    unitPrice: 690,
    minimumOrderQuantity: 50,
    deliveryIncluded: true,
  });

  const [isNewSupModalOpen, setIsNewSupModalOpen] = useState(false);
  const [newSup, setNewSup] = useState({
    name: '',
    contactPerson: '',
    phone: '07',
    category: 'Cement & Building Materials',
    balanceOwed: 0,
    paymentTerms: '30 days invoice',
    nextPaymentDue: '2026-09-30',
  });

  // Edit & Delete Supplier State
  const [isEditSupModalOpen, setIsEditSupModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<{
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    category: string;
    balanceOwed: number;
    paymentTerms: string;
    nextPaymentDue: string;
  } | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Unique product comparison list
  const safeSupplierQuotes = supplierQuotes || [];
  const quoteProducts = Array.from(new Set(safeSupplierQuotes.map((q) => q.productName)));

  // Quotes filtered for currently selected product
  const currentQuotes = safeSupplierQuotes
    .filter((q) => (q.productName || '').toLowerCase() === (selectedProductForComparison || '').toLowerCase())
    .sort((a, b) => a.unitPrice - b.unitPrice);

  const cheapestQuote = currentQuotes[0];
  const mostExpensiveQuote = currentQuotes[currentQuotes.length - 1];
  const potentialSavingsPer100 =
    cheapestQuote && mostExpensiveQuote
      ? (mostExpensiveQuote.unitPrice - cheapestQuote.unitPrice) * 100
      : 0;

  const handleOpenPay = (sup: Supplier) => {
    setSelectedSupForPay(sup);
    setPayAmount(sup.balanceOwed);
    setPayRef('EFT-' + Math.floor(100000 + Math.random() * 900000));
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupForPay || payAmount <= 0) return;
    recordSupplierPayment(selectedSupForPay.id, payAmount, payRef);
    setIsPayModalOpen(false);
    setSelectedSupForPay(null);
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === newQuote.supplierId);
    if (!sup) return;

    addSupplierQuote({
      supplierId: sup.id,
      supplierName: sup.name,
      productName: newQuote.productName,
      unitPrice: Number(newQuote.unitPrice),
      minimumOrderQuantity: Number(newQuote.minimumOrderQuantity),
      deliveryIncluded: newQuote.deliveryIncluded,
      validUntil: '2026-10-31',
    });
    setIsNewQuoteModalOpen(false);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSup.name || !newSup.phone) return;
    addSupplier({
      name: newSup.name,
      contactPerson: newSup.contactPerson,
      phone: newSup.phone,
      category: newSup.category,
      balanceOwed: Number(newSup.balanceOwed) || 0,
      paymentTerms: newSup.paymentTerms,
      nextPaymentDue: newSup.nextPaymentDue,
    });
    setIsNewSupModalOpen(false);
    setNewSup({
      name: '',
      contactPerson: '',
      phone: '07',
      category: 'Cement & Building Materials',
      balanceOwed: 0,
      paymentTerms: '30 days invoice',
      nextPaymentDue: '2026-09-30',
    });
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSup({
      id: sup.id,
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      category: sup.category || 'Cement & Building Materials',
      balanceOwed: sup.balanceOwed || 0,
      paymentTerms: sup.paymentTerms || '30 days invoice',
      nextPaymentDue: sup.nextPaymentDue || '2026-09-30',
    });
    setIsEditSupModalOpen(true);
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSup || !editingSup.name || !editingSup.phone) return;
    updateSupplier(editingSup.id, {
      name: editingSup.name,
      contactPerson: editingSup.contactPerson,
      phone: editingSup.phone,
      category: editingSup.category,
      balanceOwed: Number(editingSup.balanceOwed) || 0,
      paymentTerms: editingSup.paymentTerms,
      nextPaymentDue: editingSup.nextPaymentDue,
    });
    setIsEditSupModalOpen(false);
    setEditingSup(null);
  };

  const handleConfirmDeleteSupplier = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    setSupplierToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Suppliers & Price Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare vendor wholesale prices, track supplier invoices, and optimize purchase margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Supplier Quote</span>
          </button>

          <button
            onClick={() => setIsNewSupModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Supplier Debt Owed
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono mt-1">
            KSh {totalSupplierDebt.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pending invoices you owe to distributors
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registered Distributors
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {suppliers.length} Companies
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cement, Paint, Steel & Timber sources
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Price Optimization Potential
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            Save KSh {potentialSavingsPer100.toLocaleString()} / 100 units
          </div>
          <div className="text-xs text-slate-500 mt-1">
            By ordering {selectedProductForComparison} from cheapest source
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'comparison'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Supplier Price Comparison Engine</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'directory'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Distributors Directory & Debt ({suppliers.length})</span>
        </button>
      </div>

      {activeSubTab === 'comparison' ? (
        /* Price Comparison Feature (Prompt requirement #6) */
        <div className="space-y-6">
          {/* CBK Insight Showcase Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>CBK MSE Tracker Finding: "Over 50% of Kenyan MSEs compare suppliers for price"</span>
            </div>
            <p className="text-blue-800 leading-relaxed text-xs">
              Every 20 shillings saved per bag of cement or bucket of paint directly increases your monthly profit margin.
              Use this tool to track quotes from Industrial Area, Athi River, and local depots before confirming purchase orders.
            </p>
          </div>

          {/* Product Selector for Comparison */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Compare Product:</span>
            {quoteProducts.map((pName) => (
              <button
                key={pName}
                onClick={() => setSelectedProductForComparison(pName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedProductForComparison === pName
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pName}
              </button>
            ))}
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {currentQuotes.map((quote, idx) => {
              const isCheapest = idx === 0;
              const priceDiff =
                cheapestQuote && quote.unitPrice > cheapestQuote.unitPrice
                  ? quote.unitPrice - cheapestQuote.unitPrice
                  : 0;

              return (
                <div
                  key={quote.id}
                  className={`bg-white border rounded-xl p-5 relative overflow-hidden transition shadow-sm ${
                    isCheapest
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isCheapest && (
                    <div className="bg-emerald-600 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full absolute top-3 right-3 flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Best Market Price</span>
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    Supplier {String.fromCharCode(65 + idx)}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{quote.supplierName}</h3>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                    <div className="text-2xl font-bold font-mono text-slate-900">
                      KSh {quote.unitPrice.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> / unit</span>
                    </div>

                    {isCheapest ? (
                      <div className="text-xs text-emerald-700 font-semibold">
                        Cheapest source available
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 font-medium">
                        +KSh {priceDiff} higher per unit
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-500">
                    <div className="flex justify-between">
                      <span>Min Order Qty:</span>
                      <span className="text-slate-900 font-mono font-medium">
                        {quote.minimumOrderQuantity} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Delivery:</span>
                      <span
                        className={
                          quote.deliveryIncluded ? 'text-emerald-700 font-medium' : 'text-slate-500'
                        }
                      >
                        {quote.deliveryIncluded ? 'Included to store' : 'Owner collects'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valid Until:</span>
                      <span className="text-slate-700 font-mono">{quote.validUntil}</span>
                    </div>
                  </div>

                  {/* Savings calculation */}
                  {isCheapest && mostExpensiveQuote && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                      <span className="font-bold block mb-0.5">Estimated Margin Gain:</span>
                      <span>
                        Ordering 100 bags from {quote.supplierName} saves{' '}
                        <strong>KSh {potentialSavingsPer100.toLocaleString()}</strong> compared to{' '}
                        {mostExpensiveQuote.supplierName}!
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Suppliers Directory & Debt */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-600 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Distributor / Supplier</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Phone & Contact</th>
                  <th className="py-3.5 px-4">Balance Owed (Payable)</th>
                  <th className="py-3.5 px-4">Payment Terms</th>
                  <th className="py-3.5 px-4">Next Payment Due</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{sup.name}</div>
                          <span className="text-[11px] text-slate-500">{sup.contactPerson || 'Direct Contact'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSupplier(sup)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title={`Edit ${sup.name}`}
                            aria-label={`Edit ${sup.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(sup)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title={`Delete ${sup.name}`}
                            aria-label={`Delete ${sup.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{sup.category}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.phone}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <span className={sup.balanceOwed > 0 ? 'text-red-600' : 'text-emerald-700'}>
                        KSh {sup.balanceOwed.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{sup.paymentTerms}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {sup.nextPaymentDue || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sup.balanceOwed > 0 && (
                          <button
                            onClick={() => handleOpenPay(sup)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditSupplier(sup)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer border border-slate-200 flex items-center gap-1"
                          title={`Edit ${sup.name}`}
                        >
                          <Pencil className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setSupplierToDelete(sup)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-red-200"
                          title={`Delete ${sup.name}`}
                          aria-label={`Delete ${sup.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Record Payment to Supplier */}
      {isPayModalOpen && selectedSupForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Supplier Payment</h3>
                <p className="text-xs text-slate-500">{selectedSupForPay.name}</p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Amount Paid (KSh) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedSupForPay.balanceOwed}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Bank Reference / Cheque No / Paybill Ref
                </label>
                <input
                  type="text"
                  value={payRef || ''}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. KCB EFT-772910"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600 focus:outline-hidden"
                />
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Log Supplier Quote */}
      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Log Supplier Price Quote</h3>
                <p className="text-xs text-slate-500">Add to price comparison tracker</p>
              </div>
              <button
                onClick={() => setIsNewQuoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">Select Supplier</label>
                <select
                  value={newQuote.supplierId || ''}
                  onChange={(e) => setNewQuote({ ...newQuote, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newQuote.productName || ''}
                  onChange={(e) => setNewQuote({ ...newQuote, productName: e.target.value })}
                  placeholder="e.g. Cement 50kg, Wire Nails 3-inch"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    Unit Wholesale Price (KSh) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newQuote.unitPrice || ''}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Min Order Qty</label>
                  <input
                    type="number"
                    value={newQuote.minimumOrderQuantity ?? 1}
                    onChange={(e) =>
                      setNewQuote({
                        ...newQuote,
                        minimumOrderQuantity: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deliv"
                  checked={newQuote.deliveryIncluded}
                  onChange={(e) =>
                    setNewQuote({ ...newQuote, deliveryIncluded: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="deliv" className="text-slate-700 cursor-pointer">
                  Delivery to store is included in this quote
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewQuoteModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Supplier */}
      {isNewSupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Supplier / Distributor</h3>
              </div>
              <button
                onClick={() => setIsNewSupModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Company / Depot Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSup.name || ''}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                  placeholder="e.g. Athi River Steel Ltd"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Contact Person</label>
                <input
                  type="text"
                  value={newSup.contactPerson || ''}
                  onChange={(e) => setNewSup({ ...newSup, contactPerson: e.target.value })}
                  placeholder="e.g. Sales Rep Dennis"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newSup.phone || ''}
                    onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    Opening Balance Owed (KSh)
                  </label>
                  <input
                    type="number"
                    value={newSup.balanceOwed ?? 0}
                    onChange={(e) =>
                      setNewSup({ ...newSup, balanceOwed: Number(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Supplier */}
      {isEditSupModalOpen && editingSup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Distributor / Supplier</h3>
                <p className="text-xs text-slate-500">Update company details, phone contact, or terms</p>
              </div>
              <button
                onClick={() => {
                  setIsEditSupModalOpen(false);
                  setEditingSup(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Company / Depot Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingSup.name || ''}
                  onChange={(e) => setEditingSup({ ...editingSup, name: e.target.value })}
                  placeholder="e.g. Athi River Steel Ltd"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Contact Person</label>
                <input
                  type="text"
                  value={editingSup.contactPerson || ''}
                  onChange={(e) => setEditingSup({ ...editingSup, contactPerson: e.target.value })}
                  placeholder="e.g. Sales Rep Dennis"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editingSup.phone || ''}
                    onChange={(e) => setEditingSup({ ...editingSup, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Category</label>
                  <input
                    type="text"
                    value={editingSup.category || ''}
                    onChange={(e) => setEditingSup({ ...editingSup, category: e.target.value })}
                    placeholder="Cement, Steel, Paint"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    Balance Owed (KSh)
                  </label>
                  <input
                    type="number"
                    value={editingSup.balanceOwed ?? 0}
                    onChange={(e) =>
                      setEditingSup({ ...editingSup, balanceOwed: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Payment Terms</label>
                  <input
                    type="text"
                    value={editingSup.paymentTerms || ''}
                    onChange={(e) => setEditingSup({ ...editingSup, paymentTerms: e.target.value })}
                    placeholder="30 days invoice"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Next Payment Due Date</label>
                <input
                  type="date"
                  value={editingSup.nextPaymentDue || ''}
                  onChange={(e) => setEditingSup({ ...editingSup, nextPaymentDue: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSupModalOpen(false);
                    setEditingSup(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Update Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Supplier */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Delete Supplier</h3>
                <p className="text-xs text-slate-500">Are you sure you want to remove this vendor?</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">{supplierToDelete.name}</div>
              <div className="text-slate-500 text-[11px]">
                {supplierToDelete.category} • {supplierToDelete.phone}
              </div>
              {supplierToDelete.balanceOwed > 0 && (
                <div className="text-red-600 font-bold text-[11px] pt-1">
                  ⚠️ Outstanding Balance: KSh {supplierToDelete.balanceOwed.toLocaleString()}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              This will remove the distributor from your directory and delete any corresponding recorded wholesale quotes.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSupplier}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Supplier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersManager;
