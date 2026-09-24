import React, { useState, useMemo } from 'react';
import { Sale, SaleItem } from '../types';
import { useBusiness } from '../context/BusinessContext';
import {
  Printer,
  Share2,
  Check,
  X,
  Store,
  ArrowRight,
  MessageCircle,
  Copy,
  Edit3,
  Plus,
  Trash2,
  Save,
  Download,
  Building2,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { executePrintReceipt, downloadReceiptHtml, PrintReceiptData } from '../utils/printReceipt';

interface Props {
  sale: Sale;
  onClose: () => void;
  autoPrint?: boolean;
}

export const ReceiptModal: React.FC<Props> = ({ sale: initialSale, onClose, autoPrint }) => {
  const { storeProfile, updateStoreProfile, updateSale, customers } = useBusiness();
  
  // Current active sale state (can be edited by store owner)
  const [currentSale, setCurrentSale] = useState<Sale>(initialSale);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);
  const [paperFormat, setPaperFormat] = useState<'thermal80' | 'a4'>(
    storeProfile?.receiptPaperFormat || 'thermal80'
  );
  
  // Editable fields draft state
  const [editStoreName, setEditStoreName] = useState(
    currentSale.storeName || storeProfile?.name || ''
  );
  const [editStoreLocation, setEditStoreLocation] = useState(
    currentSale.storeLocation || storeProfile?.location || ''
  );
  const [editStorePhone, setEditStorePhone] = useState(
    currentSale.storePhone || storeProfile?.phone || ''
  );
  const [editStoreTill, setEditStoreTill] = useState(
    currentSale.storeTill || storeProfile?.tillNumber || ''
  );
  const [editStorePaybill, setEditStorePaybill] = useState(
    currentSale.storePaybill || storeProfile?.paybillNumber || ''
  );
  const [editTaxPin, setEditTaxPin] = useState(
    currentSale.taxPin || storeProfile.taxPin || ''
  );
  const [editCashierName, setEditCashierName] = useState(
    currentSale.cashierName || storeProfile.cashierName || 'Maina'
  );
  const [editReceiptTitle, setEditReceiptTitle] = useState(
    currentSale.receiptTitle || storeProfile.receiptTitle || 'OFFICIAL CASH SALE RECEIPT'
  );
  const [editCustomerName, setEditCustomerName] = useState(
    currentSale.customerName || 'Cash Customer'
  );
  const [editNotes, setEditNotes] = useState(currentSale.notes || '');
  const [editPaymentMethod, setEditPaymentMethod] = useState(currentSale.paymentMethod || 'mpesa');
  const [editMpesaCode, setEditMpesaCode] = useState(currentSale.mpesaCode || '');
  const [editFooterMessage, setEditFooterMessage] = useState(
    currentSale.receiptFooterMessage ||
      storeProfile.receiptFooterMessage ||
      'Asante sana kwa Biashara! Karibu Tena.'
  );
  const [editReturnPolicy, setEditReturnPolicy] = useState(
    currentSale.receiptReturnPolicy ||
      storeProfile.receiptReturnPolicy ||
      'Goods once sold in good order are not returnable without this original receipt.'
  );
  const [editItems, setEditItems] = useState<SaleItem[]>(currentSale.items || []);
  const [saveToDefaults, setSaveToDefaults] = useState(true);
  const [editNotice, setEditNotice] = useState('');

  const customerObj = customers.find((c) => c.id === currentSale.customerId);

  // Computed totals for edited items
  const editTotals = useMemo(() => {
    let sub = 0;
    let disc = 0;
    editItems.forEach((item) => {
      sub += (item.sellingPrice || 0) * (item.quantity || 0);
      disc += (item.discount || 0) * (item.quantity || 0);
    });
    const grand = Math.max(0, sub - disc);
    return { subtotal: sub, totalDiscount: disc, grandTotal: grand };
  }, [editItems]);

  // Plain-text formatted receipt for WhatsApp & clipboard
  const receiptText = useMemo(() => {
    const sName = currentSale.storeName || storeProfile?.name || 'DMi Business Store';
    const sLoc = currentSale.storeLocation || storeProfile?.location || '';
    const sPhone = currentSale.storePhone || storeProfile?.phone || '';
    const sTill = currentSale.storeTill || storeProfile?.tillNumber || '';
    const sPaybill = currentSale.storePaybill || storeProfile?.paybillNumber || '';
    const rTitle = currentSale.receiptTitle || 'OFFICIAL RECEIPT';

    return `*${sName.toUpperCase()}*
${rTitle}
${sLoc}
Tel: ${sPhone}
Till: ${sTill} | Paybill: ${sPaybill}
----------------------------------------
RECEIPT: ${currentSale.receiptNumber}
DATE: ${new Date(currentSale.timestamp).toLocaleString()}
CUSTOMER: ${currentSale.customerName || 'Cash Customer'}
${currentSale.cashierName ? `SERVED BY: ${currentSale.cashierName}\n` : ''}----------------------------------------
ITEMS:
${(currentSale.items || [])
  .map(
    (item) =>
      `${item.quantity}x ${item.productName} @ KSh ${item.sellingPrice.toLocaleString()} = KSh ${item.total.toLocaleString()}${
        item.discount ? ` (Disc: -KSh ${item.discount})` : ''
      }`
  )
  .join('\n')}
----------------------------------------
SUBTOTAL: KSh ${currentSale.subtotal.toLocaleString()}
${currentSale.totalDiscount > 0 ? `DISCOUNT: -KSh ${currentSale.totalDiscount.toLocaleString()}\n` : ''}TOTAL: KSh ${currentSale.grandTotal.toLocaleString()}
PAID VIA: ${currentSale.paymentMethod.toUpperCase()}
${currentSale.mpesaCode ? `M-PESA REF: ${currentSale.mpesaCode}\n` : ''}${
      currentSale.paymentMethod === 'credit'
        ? `CREDIT DUE: ${currentSale.creditDueDate || 'Mwisho wa Mwezi'}\nCUSTOMER DEBT: KSh ${(
            customerObj?.outstandingDebt || currentSale.grandTotal
          ).toLocaleString()}\n`
        : ''
    }${
      currentSale.paymentMethod === 'split' && currentSale.splitDetails
        ? `SPLIT: Cash KSh ${currentSale.splitDetails.cash.toLocaleString()} | M-Pesa KSh ${currentSale.splitDetails.mpesa.toLocaleString()} | Credit KSh ${currentSale.splitDetails.credit.toLocaleString()}\n`
        : ''
    }${currentSale.notes ? `NOTE: ${currentSale.notes}\n` : ''}----------------------------------------
${currentSale.receiptFooterMessage || 'Asante sana kwa Biashara! Karibu Tena.'}
${currentSale.receiptReturnPolicy || 'Goods once sold in good order are not returnable without receipt.'}
Powered by DMi Business OS`;
  }, [currentSale, storeProfile, customerObj]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(receiptText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Fixed and robust printing handler triggering 80mm thermal receipt styles
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      window.print();
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);
    } catch {
      const dateFormatted = new Date(currentSale.timestamp).toLocaleString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const printData: PrintReceiptData = {
        storeName: currentSale.storeName || storeProfile?.name || 'DMi Business Store',
        storeLocation: currentSale.storeLocation || storeProfile?.location || '',
        storePhone: currentSale.storePhone || storeProfile?.phone || '',
        storeTill: currentSale.storeTill || storeProfile?.tillNumber || '',
        storePaybill: currentSale.storePaybill || storeProfile?.paybillNumber || '',
        storeAccount: currentSale.storeAccount || storeProfile?.accountNumber || '',
        taxPin: currentSale.taxPin || storeProfile?.taxPin || '',
        cashierName: currentSale.cashierName || storeProfile?.cashierName || 'Cashier',
        receiptTitle: currentSale.receiptTitle || 'OFFICIAL CASH SALE RECEIPT',
        receiptNumber: currentSale.receiptNumber,
        dateStr: dateFormatted,
        customerName: currentSale.customerName || 'Cash Customer',
        items: currentSale.items || [],
        subtotal: currentSale.subtotal,
        totalDiscount: currentSale.totalDiscount,
        grandTotal: currentSale.grandTotal,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus || 'PAID',
        autoPrinted: currentSale.autoPrinted,
        mpesaCode: currentSale.mpesaCode,
        creditDueDate: currentSale.creditDueDate,
        notes: currentSale.notes,
        receiptFooterMessage: currentSale.receiptFooterMessage || storeProfile?.receiptFooterMessage || '',
        receiptReturnPolicy: currentSale.receiptReturnPolicy || storeProfile?.receiptReturnPolicy || '',
        format: paperFormat,
      };

      await executePrintReceipt(printData);
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);
    } finally {
      setIsPrinting(false);
    }
  };

  // Receipt automatically processed from M-Pesa STK push callback
  React.useEffect(() => {
    if (autoPrint || initialSale.autoPrinted) {
      setAutoPrintTriggered(true);
      // Receipt is processed and presented on screen; printing remains optional
    }
  }, [autoPrint, initialSale.autoPrinted]);

  const handleDownload = () => {
    const dateFormatted = new Date(currentSale.timestamp).toLocaleString();
    const printData: PrintReceiptData = {
      storeName: currentSale.storeName || storeProfile?.name || 'DMi Business Store',
      storeLocation: currentSale.storeLocation || storeProfile?.location || '',
      storePhone: currentSale.storePhone || storeProfile?.phone || '',
      storeTill: currentSale.storeTill || storeProfile?.tillNumber || '',
      storePaybill: currentSale.storePaybill || storeProfile?.paybillNumber || '',
      storeAccount: currentSale.storeAccount || storeProfile?.accountNumber || '',
      taxPin: currentSale.taxPin || storeProfile?.taxPin || '',
      cashierName: currentSale.cashierName || storeProfile?.cashierName || 'Cashier',
      receiptTitle: currentSale.receiptTitle || 'OFFICIAL CASH SALE RECEIPT',
      receiptNumber: currentSale.receiptNumber,
      dateStr: dateFormatted,
      customerName: currentSale.customerName || 'Cash Customer',
      items: currentSale.items || [],
      subtotal: currentSale.subtotal,
      totalDiscount: currentSale.totalDiscount,
      grandTotal: currentSale.grandTotal,
      paymentMethod: currentSale.paymentMethod,
      paymentStatus: currentSale.paymentStatus || 'PAID',
      autoPrinted: currentSale.autoPrinted,
      mpesaCode: currentSale.mpesaCode,
      creditDueDate: currentSale.creditDueDate,
      notes: currentSale.notes,
      receiptFooterMessage: currentSale.receiptFooterMessage || storeProfile.receiptFooterMessage,
      receiptReturnPolicy: currentSale.receiptReturnPolicy || storeProfile.receiptReturnPolicy,
      format: paperFormat,
    };
    downloadReceiptHtml(printData);
  };

  // Item editing handlers
  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    setEditItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };
      const q = Number(target.quantity) || 0;
      const p = Number(target.sellingPrice) || 0;
      const d = Number(target.discount) || 0;
      target.total = Math.max(0, (p - d) * q);
      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (editItems.length <= 1) {
      alert('Receipt must have at least one line item.');
      return;
    }
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewItem = () => {
    const newItem: SaleItem = {
      productId: `custom-${Date.now()}`,
      productName: 'Custom Item / Hardware Supply',
      quantity: 1,
      costPrice: 0,
      sellingPrice: 500,
      discount: 0,
      total: 500,
    };
    setEditItems((prev) => [...prev, newItem]);
  };

  // Save changes made by store owner
  const handleSaveReceiptEdits = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Sale = {
      ...currentSale,
      storeName: editStoreName,
      storeLocation: editStoreLocation,
      storePhone: editStorePhone,
      storeTill: editStoreTill,
      storePaybill: editStorePaybill,
      taxPin: editTaxPin,
      cashierName: editCashierName,
      receiptTitle: editReceiptTitle,
      customerName: editCustomerName,
      notes: editNotes,
      paymentMethod: editPaymentMethod,
      mpesaCode: editMpesaCode,
      receiptFooterMessage: editFooterMessage,
      receiptReturnPolicy: editReturnPolicy,
      items: editItems,
      subtotal: editTotals.subtotal,
      totalDiscount: editTotals.totalDiscount,
      grandTotal: editTotals.grandTotal,
    };

    // Save to context / localStorage
    updateSale(updated);
    setCurrentSale(updated);

    // If owner opted to update default store profile as well
    if (saveToDefaults) {
      updateStoreProfile({
        name: editStoreName,
        location: editStoreLocation,
        phone: editStorePhone,
        tillNumber: editStoreTill,
        paybillNumber: editStorePaybill,
        taxPin: editTaxPin,
        cashierName: editCashierName,
        receiptTitle: editReceiptTitle,
        receiptFooterMessage: editFooterMessage,
        receiptReturnPolicy: editReturnPolicy,
      });
    }

    setEditNotice('Receipt updated successfully by store owner!');
    setTimeout(() => setEditNotice(''), 3000);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-800 p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <span className="text-white font-bold text-sm block">
                {isEditing ? 'Edit Receipt & Store Name' : 'Sale Receipt'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>{currentSale.receiptNumber}</span>
                {currentSale.paymentStatus === 'paid' && (
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                    Paid ✓
                  </span>
                )}
                {currentSale.autoPrinted && (
                  <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[9px] font-medium">
                    Auto-Printed
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                isEditing
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
              }`}
              title="Edit the store name and what's in the receipt"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'View Receipt' : 'Edit Receipt'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {autoPrintTriggered && (
          <div className="bg-blue-900/40 border-b border-blue-500/30 px-4 py-2 text-blue-200 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>STK Payment Confirmed — Automatic receipt printing triggered!</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-500/40">
              Order Paid ✓
            </span>
          </div>
        )}

        {editNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{editNotice}</span>
          </div>
        )}

        {/* Scrollable Center Section */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* ================= MODE 1: EDIT RECEIPT (STORE OWNER CONTROLS) ================= */}
          {isEditing ? (
            <form onSubmit={handleSaveReceiptEdits} className="space-y-4 text-slate-200">
              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-200 flex items-start gap-2">
                <Store className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Store Owner Edit Controls:</span>
                  You can edit the business name, contact info, customer name, items, prices,
                  quantities, and footer notes printed on this receipt.
                </div>
              </div>

              {/* 1. Store Details */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Store Name & Contact Details</span>
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Store / Hardware Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreName || ''}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    placeholder="e.g. Nairobi Hardware & Building Supplies"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Location / Road
                    </label>
                    <input
                      type="text"
                      value={editStoreLocation || ''}
                      onChange={(e) => setEditStoreLocation(e.target.value)}
                      placeholder="e.g. Kangemi Market Road, Nairobi"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editStorePhone || ''}
                      onChange={(e) => setEditStorePhone(e.target.value)}
                      placeholder="e.g. +254 712 345 678"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Buy Goods Till
                    </label>
                    <input
                      type="text"
                      value={editStoreTill || ''}
                      onChange={(e) => setEditStoreTill(e.target.value)}
                      placeholder="5421008"
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Paybill No.
                    </label>
                    <input
                      type="text"
                      value={editStorePaybill || ''}
                      onChange={(e) => setEditStorePaybill(e.target.value)}
                      placeholder="400200"
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      KRA Tax PIN
                    </label>
                    <input
                      type="text"
                      value={editTaxPin || ''}
                      onChange={(e) => setEditTaxPin(e.target.value)}
                      placeholder="P051982736Z"
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-mono uppercase focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToDefaults}
                    onChange={(e) => setSaveToDefaults(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-600"
                  />
                  <span>Save this Store Name & details as default store profile</span>
                </label>
              </div>

              {/* 2. Receipt Header & Customer */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Receipt Title & Customer Info</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Receipt Title
                    </label>
                    <input
                      type="text"
                      value={editReceiptTitle || ''}
                      onChange={(e) => setEditReceiptTitle(e.target.value)}
                      placeholder="OFFICIAL CASH SALE RECEIPT"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-bold uppercase focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={editCustomerName || ''}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="e.g. Cash Customer / Fundi John"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Served By / Cashier Name
                  </label>
                  <input
                    type="text"
                    value={editCashierName || ''}
                    onChange={(e) => setEditCashierName(e.target.value)}
                    placeholder="e.g. Maina (Manager)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 3. What's in the Receipt: Line Items */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Receipt Items & Quantities</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => (
                    <div
                      key={item.productId || idx}
                      className="p-2.5 bg-slate-900 rounded-lg border border-slate-700 space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={item.productName || ''}
                          onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                          placeholder="Item Name"
                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Quantity</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity ?? 1}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', Number(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white font-mono focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block">Price (KSh)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.sellingPrice ?? 0}
                            onChange={(e) =>
                              handleItemChange(idx, 'sellingPrice', Number(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white font-mono focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block">Total (KSh)</label>
                          <div className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs font-bold text-amber-400 font-mono">
                            {item.total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Totals Summary */}
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Items: {editItems.length}</span>
                  <span className="font-extrabold text-white text-sm font-mono">
                    Grand Total: KSh {editTotals.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 4. Payment & Notes */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Payment Mode & Remarks
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={editPaymentMethod || 'mpesa'}
                      onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="cash">Cash</option>
                      <option value="credit">Credit (Deni)</option>
                      <option value="split">Split Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      M-Pesa Reference / Confirmation
                    </label>
                    <input
                      type="text"
                      value={editMpesaCode || ''}
                      onChange={(e) => setEditMpesaCode(e.target.value)}
                      placeholder="e.g. QGD7842918"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-mono uppercase focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Special Notes / Delivery Remarks
                  </label>
                  <input
                    type="text"
                    value={editNotes || ''}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Goods offloaded at Site Ruiru Plot 45"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 5. Footer & Return Policy */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Receipt Footer & Return Disclaimer
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Thank You Message
                  </label>
                  <input
                    type="text"
                    value={editFooterMessage || ''}
                    onChange={(e) => setEditFooterMessage(e.target.value)}
                    placeholder="Asante sana kwa Biashara! Karibu Tena."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Return Policy & Warranty
                  </label>
                  <input
                    type="text"
                    value={editReturnPolicy || ''}
                    onChange={(e) => setEditReturnPolicy(e.target.value)}
                    placeholder="Goods once sold in good order are not returnable without this original receipt."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Save or Cancel Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Apply to Receipt</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= MODE 2: VISUAL RECEIPT PREVIEW ================= */
            <div className="space-y-3">
              {/* Paper Format & Edit Quick Switch */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Paper Format:</span>
                  <button
                    onClick={() => setPaperFormat('thermal80')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                      paperFormat === 'thermal80'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    80mm Thermal Slip
                  </button>
                  <button
                    onClick={() => setPaperFormat('a4')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                      paperFormat === 'a4'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    A4 Full Page
                  </button>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Contents</span>
                </button>
              </div>

              {/* Printable Area Container */}
              <div
                id="printable-receipt-area"
                className="bg-white text-slate-900 p-6 rounded-xl font-mono text-xs shadow-inner border border-slate-200"
              >
                {/* Store Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <div className="font-extrabold text-sm tracking-wider uppercase">
                    {currentSale.storeName || storeProfile?.name || 'DMi Business Store'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {currentSale.storeLocation || storeProfile?.location || ''}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Tel: {currentSale.storePhone || storeProfile?.phone || ''}
                  </div>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1.5 text-[10px] font-bold text-slate-700">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      Till: {currentSale.storeTill || storeProfile?.tillNumber || ''}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      Paybill: {currentSale.storePaybill || storeProfile.paybillNumber}
                    </span>
                    {(currentSale.taxPin || storeProfile.taxPin) && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        PIN: {currentSale.taxPin || storeProfile.taxPin}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-bold text-[11px] text-slate-800 tracking-wide">
                    {currentSale.receiptTitle || 'OFFICIAL CASH SALE RECEIPT'}
                  </div>
                </div>

                {/* Metadata */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt No:</span>
                    <span className="font-bold">{currentSale.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date/Time:</span>
                    <span>
                      {new Date(currentSale.timestamp).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      •{' '}
                      {new Date(currentSale.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold">
                      {currentSale.customerName || 'Cash Customer'}
                    </span>
                  </div>
                  {(currentSale.cashierName || storeProfile.cashierName) && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Served By:</span>
                      <span>{currentSale.cashierName || storeProfile.cashierName}</span>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Item & Qty</span>
                    <span>Total (KSh)</span>
                  </div>
                  {(currentSale.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px]">
                      <div className="pr-2">
                        <span className="font-semibold">{item.productName}</span>
                        <div className="text-[10px] text-slate-500">
                          {item.quantity} x KSh {item.sellingPrice.toLocaleString()}
                          {item.discount > 0 && ` (-KSh ${item.discount} disc)`}
                        </div>
                      </div>
                      <span className="font-bold whitespace-nowrap">
                        KSh {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>KSh {currentSale.subtotal.toLocaleString()}</span>
                  </div>
                  {currentSale.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount:</span>
                      <span>-KSh {currentSale.totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200">
                    <span>GRAND TOTAL:</span>
                    <span className="text-slate-950 font-black">
                      KSh {currentSale.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Order Status:</span>
                    <span className="font-extrabold uppercase px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {currentSale.paymentStatus ? currentSale.paymentStatus.toUpperCase() : 'PAID'} ✓
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold uppercase text-emerald-700">
                      {currentSale.paymentMethod}
                    </span>
                  </div>

                  {currentSale.mpesaCode && (
                    <div className="flex justify-between bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-900 font-mono">
                      <span>M-Pesa Ref:</span>
                      <span className="font-bold">{currentSale.mpesaCode}</span>
                    </div>
                  )}

                  {currentSale.paymentMethod === 'credit' && (
                    <div className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-950 space-y-0.5 mt-1">
                      <div className="flex justify-between font-bold">
                        <span>Credit Sale:</span>
                        <span>Due: {currentSale.creditDueDate || 'End of Month'}</span>
                      </div>
                      {customerObj && (
                        <div className="flex justify-between text-[10px] text-amber-800">
                          <span>Total Balance Owed:</span>
                          <span className="font-bold">
                            KSh {customerObj.outstandingDebt.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {currentSale.notes && (
                    <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded mt-1 border border-slate-200">
                      <span className="font-bold text-slate-700">Remarks: </span>
                      {currentSale.notes}
                    </div>
                  )}
                </div>

                {/* Footer Disclaimers */}
                <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
                  <div className="font-bold uppercase tracking-wider text-slate-700">
                    {currentSale.receiptFooterMessage ||
                      storeProfile.receiptFooterMessage ||
                      'Asante sana kwa Biashara! Karibu Tena.'}
                  </div>
                  <div>
                    {currentSale.receiptReturnPolicy ||
                      storeProfile.receiptReturnPolicy ||
                      'Goods once sold in good order are not returnable without receipt.'}
                  </div>
                  <div className="text-[9px] text-slate-400 pt-0.5">
                    Digital Record Generated • DMi Business OS
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="bg-slate-800/95 p-3.5 sm:p-4 border-t border-slate-700 shrink-0 space-y-2.5">
          <div className="grid grid-cols-4 gap-2">
            {/* 1. PRINT BUTTON (Fixed with direct printable iframe engine) */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border ${
                printSuccess
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
              } ${isPrinting ? 'opacity-70 cursor-wait' : ''}`}
              title="Print receipt directly to thermal or desktop printer"
            >
              {printSuccess ? (
                <Check className="w-4 h-4 text-emerald-200" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isPrinting ? 'Opening...' : printSuccess ? 'Printed!' : 'Print'}</span>
            </button>

            {/* 2. DOWNLOAD HTML / PDF BACKUP */}
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-600 cursor-pointer"
              title="Download receipt file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            {/* 3. COPY TEXT */}
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-600 cursor-pointer"
              title="Copy receipt text to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* 4. WHATSAPP */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow cursor-pointer"
              title="Send receipt to customer on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span>Done / Next Customer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
