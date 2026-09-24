import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Customer, Sale, Supplier, WhatsAppTemplate } from '../types';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  Receipt,
  Truck,
  Edit3,
  ExternalLink,
  Users,
  Search,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const WhatsAppAutomationHub: React.FC = () => {
  const {
    whatsAppTemplates,
    updateWhatsAppTemplate,
    customers,
    debtorsList,
    sales,
    suppliers,
    branches,
    activeBranch,
    storeProfile,
    generateSaleWhatsAppReceiptText,
    sendSaleWhatsAppReceipt,
    sendCustomerDebtWhatsApp,
    sendSupplierOrderWhatsApp,
    generateWhatsAppSummary,
  } = useBusiness();

  const [activeTab, setActiveTab] = useState<'debtors' | 'receipts' | 'suppliers' | 'templates' | 'daily_summary'>('debtors');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(whatsAppTemplates[0]?.id || 'wt-1');
  const [templateEditContent, setTemplateEditContent] = useState<string>(whatsAppTemplates[0]?.content || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Supplier PO Builder State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [selectedDeliveryBranchId, setSelectedDeliveryBranchId] = useState<string>(branches[0]?.id || '');
  const [poOrderItems, setPoOrderItems] = useState<string>('• 50 Bags Bamburi Tembo Cement (50kg)\n• 20 Pcs D12 TMT Deformed High-Yield Bars\n• 10 Rolls 16G Binding Wire');

  // Daily Summary State
  const [executiveSummaryText, setExecutiveSummaryText] = useState<string>(generateWhatsAppSummary());

  const activeTemplate = whatsAppTemplates.find((t) => t.id === selectedTemplateId) || whatsAppTemplates[0];

  const handleSelectTemplate = (t: WhatsAppTemplate) => {
    setSelectedTemplateId(t.id);
    setTemplateEditContent(t.content);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplateId) return;
    updateWhatsAppTemplate(selectedTemplateId, templateEditContent);
    setCopiedId('template-saved');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const q = (searchTerm || '').toLowerCase();
  const filteredDebtors = debtorsList.filter((c) =>
    (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(searchTerm || '')
  );

  const filteredSales = sales.filter((s) =>
    (s.receiptNumber || '').toLowerCase().includes(q) ||
    (s.customerName && (s.customerName || '').toLowerCase().includes(q))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Business Engine 2.0
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Zero API Cost • Direct One-Click wa.me Dispatch
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">WhatsApp Automation & Notification Hub</h1>
          <p className="text-sm text-slate-600">
            Dispatch digital receipts directly to customers, send scheduled friendly debt recovery reminders, and transmit distributor LPOs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              const text = generateWhatsAppSummary();
              setExecutiveSummaryText(text);
              const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
              window.open(url, '_blank');
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Daily Executive Report</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('debtors')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'debtors'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Debtor Recovery Broadcast ({debtorsList.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'receipts'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span>POS Digital E-Receipts</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'suppliers'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Supplier Purchase Orders (LPO)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            <span>Message Templates Editor</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('daily_summary')}
          className={`pb-3 px-4 text-sm font-medium transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'daily_summary'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Executive EOD Report</span>
          </div>
        </button>
      </div>

      {/* TAB 1: DEBTOR RECOVERY BROADCAST */}
      {activeTab === 'debtors' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search debtor name or phone..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="text-slate-500">
              Total Outstanding Madeni:{' '}
              <strong className="text-red-600 font-mono text-sm">
                KSh {debtorsList.reduce((sum, d) => sum + (d?.outstandingDebt || 0), 0).toLocaleString()}
              </strong>{' '}
              across {debtorsList.length} accounts
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Debtor Account</th>
                    <th className="py-3 px-4">Outstanding Balance</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Severity Tier</th>
                    <th className="py-3 px-4 text-right">Send WhatsApp Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDebtors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No debtors with outstanding balances.
                      </td>
                    </tr>
                  ) : (
                    filteredDebtors.map((customer) => {
                      const isOverdue =
                        customer.creditDueDate &&
                        new Date(customer.creditDueDate) < new Date();

                      return (
                        <tr key={customer.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{customer.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Limit: KSh {(customer.creditLimit || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-red-600 text-sm">
                            KSh {(customer.outstandingDebt || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {customer.creditDueDate ? (
                              <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                                {new Date(customer.creditDueDate).toLocaleDateString('en-GB')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not specified</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">{customer.phone}</td>
                          <td className="py-3 px-4">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <AlertTriangle className="w-3 h-3" /> Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" /> Active Credit
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => sendCustomerDebtWhatsApp(customer, 'friendly')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition cursor-pointer flex items-center gap-1.5"
                                title="Send friendly polite reminder"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Friendly Reminder</span>
                              </button>

                              <button
                                onClick={() => sendCustomerDebtWhatsApp(customer, 'urgent')}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-semibold transition cursor-pointer flex items-center gap-1.5"
                                title="Send urgent demand notice"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                <span>Urgent Notice</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POS DIGITAL RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search receipt # or customer..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <span className="text-slate-500">
              Showing recent sales available for instant WhatsApp e-receipt dispatch
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Customer & Phone</th>
                    <th className="py-3 px-4">Items Breakdown</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{sale.receiptNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {sale?.timestamp ? new Date(sale.timestamp).toLocaleString('en-KE') : 'Recently'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        KSh {(sale?.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {sale.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {sale.mpesaPhone || 'No phone recorded'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => sendSaleWhatsAppReceipt(sale)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp Receipt</span>
                          </button>
                          <button
                            onClick={() => {
                              const text = generateSaleWhatsAppReceiptText(sale);
                              copyToClipboard(text, sale.id);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Copy receipt text"
                          >
                            {copiedId === sale.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIER PURCHASE ORDERS (LPO) */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Direct WhatsApp Purchase Order (LPO)</h3>
              <p className="text-xs text-slate-500">
                Compose orders and send directly to your cement, steel, or paint distributor's sales team.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Supplier / Manufacturer *</label>
                <select
                  value={selectedSupplierId || ''}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson} - {s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deliver To Branch / Godown *</label>
                <select
                  value={selectedDeliveryBranchId || ''}
                  onChange={(e) => setSelectedDeliveryBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Required Materials & Quantities (Bulleted) *
                </label>
                <textarea
                  rows={5}
                  value={poOrderItems || ''}
                  onChange={(e) => setPoOrderItems(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <button
                onClick={() => {
                  const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
                  const branch = branches.find((b) => b.id === selectedDeliveryBranchId) || branches[0];
                  sendSupplierOrderWhatsApp(supplier, poOrderItems, branch?.name || 'Main Branch');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Official PO via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Preview mockup */}
          <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Live WhatsApp Message Preview</span>
              </div>

              <div className="mt-4 bg-[#075E54] p-4 rounded-xl text-xs space-y-2 text-white/90 font-mono leading-relaxed whitespace-pre-line shadow-inner">
                {`*OFFICIAL PURCHASE ORDER / REQUISITION*
From: ${storeProfile?.name || 'DMi Business Store'}
To: ${suppliers.find((s) => s.id === selectedSupplierId)?.name || 'Supplier'}
Attention: ${suppliers.find((s) => s.id === selectedSupplierId)?.contactPerson || 'Sales Team'}

Deliver To: ${branches.find((b) => b.id === selectedDeliveryBranchId)?.name || 'Main Branch'}
Location: ${branches.find((b) => b.id === selectedDeliveryBranchId)?.location || 'Nairobi'}

*Required Materials:*
${poOrderItems}

Payment Terms: ${suppliers.find((s) => s.id === selectedSupplierId)?.paymentTerms || '30 Days Net'}

Kindly confirm receipt, availability, and delivery dispatch schedule.`}
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200 pt-2">
                  <span>10:30 AM</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-4 text-center">
              Formatted using Safaricom & WhatsApp rich bold text syntax.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: TEMPLATES EDITOR */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Select Message Template
            </span>
            {whatsAppTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedTemplateId === t.id
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{t.title}</div>
                  <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                    Category: {t.category.replace('_', ' ')}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{activeTemplate.title}</h3>
                <p className="text-xs text-slate-500">
                  Edit the copy and dynamic tags below. Changes save instantly.
                </p>
              </div>

              {copiedId === 'template-saved' && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Template Saved!
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Message Content & Tags:
              </label>
              <textarea
                rows={10}
                value={templateEditContent || ''}
                onChange={(e) => setTemplateEditContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">Supported Dynamic Placeholders:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '{storeName}',
                  '{storeLocation}',
                  '{customerName}',
                  '{balance}',
                  '{dueDate}',
                  '{tillNumber}',
                  '{receiptNumber}',
                  '{grandTotal}',
                  '{itemsList}',
                  '{cashierName}',
                  '{footerMessage}',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTemplateEditContent((prev) => `${prev} ${tag}`)}
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-mono hover:bg-slate-100 transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveTemplate}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
              >
                Save Template Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EXECUTIVE EOD REPORT */}
      {activeTab === 'daily_summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Daily Executive Store Summary</h3>
              <p className="text-xs text-slate-500">
                Generated from today's real-time POS sales, gross margin calculations, expense registers, and debtor status.
              </p>
            </div>

            <div className="relative">
              <textarea
                rows={12}
                value={executiveSummaryText || ''}
                onChange={(e) => setExecutiveSummaryText(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(executiveSummaryText)}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch to Director's WhatsApp</span>
              </button>

              <button
                onClick={() => copyToClipboard(executiveSummaryText, 'exec-copy')}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'exec-copy' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'exec-copy' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#0b141a] rounded-2xl p-5 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Executive Director View</span>
              </div>

              <div className="mt-4 bg-[#005c4b] p-4 rounded-xl text-xs space-y-2 text-white/95 font-mono leading-relaxed whitespace-pre-line shadow-inner">
                {executiveSummaryText}
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200 pt-2">
                  <span>6:45 PM</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-4 text-center">
              Sent directly to business owners at close of day.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppAutomationHub;
