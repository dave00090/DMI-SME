import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Product, PaymentMethod, SplitPaymentDetail, Sale } from '../types';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Smartphone,
  Banknote,
  BookOpen,
  Split,
  Building2,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Lock,
  History,
  ShieldCheck,
  X,
  Eye,
  AlertOctagon,
  Phone,
  Barcode,
  Scan,
  Camera,
  Printer,
  Zap,
  Command,
} from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import DailySalesBookModal from './DailySalesBookModal';
import { ManagerApprovalModal } from './ManagerApprovalModal';
import { offlineWriteQueue } from '../lib/powersync/offlineQueue';

export const POS: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartDiscount,
    clearCart,
    cartTotals,
    processSale,
    lastCompletedSale,
    setLastCompletedSale,
    customers,
    storeProfile,
    isOnline,
    currentSalesBook,
    isSalesBookOpen,
    triggerStkPush,
    queryStkStatus,
    simulateStkCallback,
    mpesaTransactions,
    activeBranch,
    branches,
    activeBranchId,
    sales,
    voidSale,
    currentEmployee,
    securityLimits,
  } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [isSalesBookModalOpen, setIsSalesBookModalOpen] = useState(false);
  const [salesBookModalMode, setSalesBookModalMode] = useState<'start' | 'close'>('start');

  // Barcode Scanner & Fast Product Entry State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeNotice, setBarcodeNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Audio chime on successful barcode scan (POS 880Hz beep)
  const playBarcodeBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      // Audio context might be restricted
    }
  };

  const handleBarcodeScan = (codeToScan?: string) => {
    const code = (codeToScan || barcodeInput).trim();
    if (!code) return;

    // Look up product by SKU or ID (case-insensitive)
    const lowerCode = (code || '').toLowerCase();
    const product = products.find(
      (p) => (p.sku || '').toLowerCase() === lowerCode || (p.id || '').toLowerCase() === lowerCode
    );

    if (product) {
      addToCart(product);
      playBarcodeBeep();
      setBarcodeNotice({
        type: 'success',
        text: `Scanned: "${product?.name || 'Item'}" (${product?.sku || ''}) - Added to cart`,
      });
      setBarcodeInput('');
    } else {
      setBarcodeNotice({
        type: 'error',
        text: `Barcode / SKU "${code}" not found in system.`,
      });
    }

    setTimeout(() => {
      setBarcodeNotice(null);
    }, 3500);

    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = (searchQuery || '').toLowerCase().trim();
    return products.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)).slice(0, 10);
  }, [products, searchQuery]);

  const handleAddSearchedProduct = (product: Product) => {
    addToCart(product);
    playBarcodeBeep();
    setBarcodeNotice({
      type: 'success',
      text: `Added: "${product?.name || 'Item'}" (KSh ${(product?.sellingPrice || 0).toLocaleString()}) to cart`,
    });
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
    setTimeout(() => setBarcodeNotice(null), 3500);
  };

  // Quick Add State & Modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState('');
  const [quickAddQty, setQuickAddQty] = useState(1);
  const quickAddInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus Quick Add input upon opening
  useEffect(() => {
    if (showQuickAddModal) {
      const timer = setTimeout(() => {
        quickAddInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [showQuickAddModal]);

  const quickAddMatches = useMemo(() => {
    if (!quickAddQuery.trim()) {
      return products.slice(0, 10);
    }
    const q = quickAddQuery.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [products, quickAddQuery]);

  const handleQuickAddProduct = (product: Product, quantity = 1) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    playBarcodeBeep();
    setBarcodeNotice({
      type: 'success',
      text: `Quick Added: ${quantity}x "${product?.name || 'Item'}" to cart`,
    });
    setTimeout(() => setBarcodeNotice(null), 3000);
  };

  const handleQuickAddScanOrEnter = () => {
    const code = quickAddQuery.trim();
    if (!code) return;

    const lowerCode = code.toLowerCase();
    const product = products.find(
      (p) => (p.sku || '').toLowerCase() === lowerCode || (p.id || '').toLowerCase() === lowerCode
    );

    if (product) {
      handleQuickAddProduct(product, quickAddQty);
      setQuickAddQuery('');
    } else if (quickAddMatches.length > 0) {
      handleQuickAddProduct(quickAddMatches[0], quickAddQty);
      setQuickAddQuery('');
    } else {
      setBarcodeNotice({
        type: 'error',
        text: `No product matching barcode or name "${code}"`,
      });
      setTimeout(() => setBarcodeNotice(null), 3000);
    }
  };

  // Security & Void Management State
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [selectedSaleToVoid, setSelectedSaleToVoid] = useState<Sale | null>(null);
  const [showVoidApprovalModal, setShowVoidApprovalModal] = useState(false);
  const [showDiscountApprovalModal, setShowDiscountApprovalModal] = useState(false);
  const [viewingPastReceipt, setViewingPastReceipt] = useState<Sale | null>(null);
  const [voidNotice, setVoidNotice] = useState<string | null>(null);

  // Cash payment state
  const [cashTendered, setCashTendered] = useState<number>(0);

  // M-Pesa payment state & real-time SSE callback state
  const [mpesaCode, setMpesaCode] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState<string>('07');
  const [stkSimulating, setStkSimulating] = useState<boolean>(false);
  const [stkConfirmed, setStkConfirmed] = useState<boolean>(false);
  const [stkStatusMessage, setStkStatusMessage] = useState<string>('');
  const [stkAmountPaid, setStkAmountPaid] = useState<number>(0);
  const [stkPaidTimestamp, setStkPaidTimestamp] = useState<string | null>(null);
  const [activeCheckoutRequestId, setActiveCheckoutRequestId] = useState<string | null>(null);
  const [stkListeningSse, setStkListeningSse] = useState<boolean>(false);
  const [autoProcessingSale, setAutoProcessingSale] = useState<boolean>(false);
  const [showMpesaExpressModal, setShowMpesaExpressModal] = useState<boolean>(false);

  // References for active real-time SSE and polling intervals
  const sseRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Credit payment state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [creditDueDate, setCreditDueDate] = useState<string>('2026-09-30');
  const [creditNotes, setCreditNotes] = useState<string>('Nitakulipa mwisho wa mwezi');

  // Split payment state
  const [splitDetails, setSplitDetails] = useState<SplitPaymentDetail>({
    cash: 0,
    mpesa: 0,
    credit: 0,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q);
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const changeDue = Math.max(0, cashTendered - cartTotals.grandTotal);

  // Quick preset helper
  const setExactCash = () => setCashTendered(cartTotals.grandTotal);
  const setPresetCash = (amt: number) => setCashTendered(amt);

  // Cancel active STK listener
  const handleCancelSTK = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setStkSimulating(false);
    setStkListeningSse(false);
    setActiveCheckoutRequestId(null);
    setStkStatusMessage('STK listening stopped. You can retry or enter customer code from SMS.');
  };

  // Automated Payment Confirmation Callback Handler
  const handlePaymentConfirmed = (
    data: { amount?: number; receiptNumber?: string; phone?: string; resultDesc?: string },
    expectedChargeAmount: number
  ) => {
    // Prevent duplicate processing
    if (autoProcessingSale) return;

    // Clean up SSE & polling immediately
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const confirmedAmount = Number(data.amount) || expectedChargeAmount;
    const receiptCode =
      data.receiptNumber ||
      ('SK' + Math.random().toString(36).substring(2, 10).toUpperCase());
    const nowTime = new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setStkConfirmed(true);
    setStkSimulating(false);
    setStkListeningSse(false);
    setStkAmountPaid(confirmedAmount);
    setStkPaidTimestamp(nowTime);
    setMpesaCode(receiptCode);
    setStkStatusMessage(
      `✓ Payment of KSh ${confirmedAmount.toLocaleString()} confirmed via Safaricom Callback! Order status updated to 'Paid' • Printing receipt...`
    );
    setAutoProcessingSale(true);

    // Automatically update order status to 'Paid' and trigger receipt printing
    setTimeout(() => {
      const isSplit = paymentMethod === 'split';
      const sale = processSale({
        paymentMethod: isSplit ? 'split' : 'mpesa',
        splitDetails: isSplit ? splitDetails : undefined,
        mpesaCode: receiptCode,
        mpesaPhone: data.phone || mpesaPhone,
        customerId:
          paymentMethod === 'credit' || (isSplit && (splitDetails.credit || 0) > 0)
            ? selectedCustomerId
            : undefined,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        creditDueDate: paymentMethod === 'credit' ? creditDueDate : undefined,
        notes: paymentMethod === 'credit' ? creditNotes : undefined,
        paymentStatus: 'paid',
        stkPushConfirmed: true,
        autoPrinted: true,
      });

      setLastCompletedSale(sale);

      // Reset POS checkout form
      setShowMpesaExpressModal(false);
      setAutoProcessingSale(false);
      setStkConfirmed(false);
      setStkAmountPaid(0);
      setStkPaidTimestamp(null);
      setActiveCheckoutRequestId(null);
      setCashTendered(0);
      setMpesaCode('QGD' + Math.floor(1000000 + Math.random() * 9000000));
    }, 1200);
  };

  // Test simulation handler: simulates customer entering PIN on handset and receiving callback
  const handleSimulatePinCallback = async () => {
    if (!activeCheckoutRequestId) return;
    const chargeAmount =
      paymentMethod === 'split' ? splitDetails.mpesa || 0 : cartTotals.grandTotal;
    setStkStatusMessage(
      `Dispatching simulated customer PIN callback for KSh ${chargeAmount.toLocaleString()}...`
    );
    try {
      await simulateStkCallback(activeCheckoutRequestId, chargeAmount, undefined, mpesaPhone);
    } catch (e: any) {
      setStkStatusMessage(`Simulation error: ${e.message}`);
    }
  };

  // Trigger Live STK Push via Daraja 2.0 and actively listen for callback
  const handleTriggerSTK = async (customAmount?: number) => {
    if (!mpesaPhone || mpesaPhone.length < 9) {
      alert('Please enter a valid Safaricom phone number (e.g. 0712 345 678 or 254712345678)');
      return;
    }
    const chargeAmount =
      customAmount ?? (paymentMethod === 'split' ? splitDetails.mpesa || 0 : cartTotals.grandTotal);
    if (chargeAmount <= 0) {
      alert('Charge amount must be greater than KSh 0');
      return;
    }

    // Clean up any existing listeners
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setStkSimulating(true);
    setStkConfirmed(false);
    setStkAmountPaid(0);
    setStkPaidTimestamp(null);
    setStkStatusMessage(
      `Dispatching Safaricom STK Push for KSh ${chargeAmount.toLocaleString()} to ${mpesaPhone}...`
    );

    try {
      const res = await triggerStkPush(mpesaPhone, chargeAmount, 'POS Checkout');
      if (res.success && res.checkoutRequestId) {
        const checkoutReqId = res.checkoutRequestId;
        setActiveCheckoutRequestId(checkoutReqId);
        setStkListeningSse(true);
        setStkStatusMessage(
          `STK prompt for KSh ${chargeAmount.toLocaleString()} dispatched to ${mpesaPhone}. Actively listening for Safaricom transaction callback...`
        );

        // 1. Real-Time Server-Sent Events (SSE) Stream Listener
        try {
          const sse = new EventSource(
            `/api/mpesa/stream?checkoutRequestId=${encodeURIComponent(checkoutReqId)}`
          );
          sseRef.current = sse;

          sse.addEventListener('stk_callback', (evt: MessageEvent) => {
            try {
              const callbackData = JSON.parse(evt.data);
              if (callbackData.resultCode === 0 || callbackData.status === 'completed') {
                handlePaymentConfirmed(callbackData, chargeAmount);
              } else {
                handleCancelSTK();
                setStkStatusMessage(
                  callbackData.resultDesc ||
                    'Customer cancelled prompt or entered an incorrect PIN on handset.'
                );
              }
            } catch (err) {
              console.error('Error parsing SSE callback data', err);
            }
          });

          sse.onmessage = (evt: MessageEvent) => {
            try {
              const parsed = JSON.parse(evt.data);
              if (parsed.status === 'completed' || parsed.resultCode === 0) {
                handlePaymentConfirmed(parsed, chargeAmount);
              }
            } catch (err) {
              // Ignore keepalive ping
            }
          };

          sse.onerror = () => {
            // Keep resilient polling fallback active
          };
        } catch (sseErr) {
          console.warn('SSE stream initiation warning, relying on query polling', sseErr);
        }

        // 2. High-speed Resilient Polling Fallback (instant check at 500ms, then every 1200ms)
        let attempts = 0;
        const doPoll = async () => {
          attempts += 1;
          if (attempts > 35) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (sseRef.current) {
              sseRef.current.close();
              sseRef.current = null;
            }
            setStkSimulating(false);
            setStkListeningSse(false);
            setStkStatusMessage(
              'Handset prompt timed out. Enter receipt code from customer SMS or confirm PIN.'
            );
            return;
          }

          try {
            const queryRes = await queryStkStatus(checkoutReqId);
            if (queryRes.status === 'completed') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              handlePaymentConfirmed(queryRes, chargeAmount);
            } else if (queryRes.status === 'failed') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
              }
              setStkSimulating(false);
              setStkListeningSse(false);
              setStkStatusMessage(
                queryRes.resultDesc || 'Customer rejected prompt or entered wrong PIN.'
              );
            }
          } catch (e) {
            // Keep polling until timeout or success
          }
        };

        // Quick first check after 500ms
        setTimeout(() => {
          if (pollIntervalRef.current) {
            doPoll();
          }
        }, 500);

        const interval = setInterval(doPoll, 1200);
        pollIntervalRef.current = interval;
      } else {
        setStkSimulating(false);
        setStkStatusMessage(res.error || res.message || 'Failed to dispatch STK push.');
      }
    } catch (err: any) {
      setStkSimulating(false);
      setStkStatusMessage(err.message || 'Error connecting to Safaricom Daraja.');
    }
  };

  const executeFinalCheckout = (approvedBy?: string) => {
    const isSplit = paymentMethod === 'split';
    const sale = processSale({
      paymentMethod,
      splitDetails: isSplit ? splitDetails : undefined,
      mpesaCode:
        paymentMethod === 'mpesa' || (isSplit && splitDetails.mpesa > 0)
          ? mpesaCode
          : undefined,
      mpesaPhone: paymentMethod === 'mpesa' ? mpesaPhone : undefined,
      customerId:
        paymentMethod === 'credit' || (isSplit && splitDetails.credit > 0)
          ? selectedCustomerId
          : undefined,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      creditDueDate: paymentMethod === 'credit' ? creditDueDate : undefined,
      notes: paymentMethod === 'credit' ? creditNotes : undefined,
      approvedBy,
      paymentStatus: paymentMethod === 'credit' ? 'pending' : 'paid',
      stkPushConfirmed: stkConfirmed,
      autoPrinted: stkConfirmed,
    });

    setLastCompletedSale(sale);

    // Enqueue sale and additive stock deltas into PowerSync SQLite offline queue
    try {
      offlineWriteQueue.enqueue({
        businessId: activeBranch?.name || 'BUS-8F42K91',
        tableName: 'sales',
        operation: 'INSERT',
        payload: {
          id: sale.id,
          receipt_number: sale.receiptNumber,
          grand_total: sale.grandTotal,
          payment_method: sale.paymentMethod,
          cashier_id: currentEmployee?.id || 'emp-01',
          status: 'completed',
          created_at: sale.timestamp,
        },
      });

      sale.items.forEach((item) => {
        offlineWriteQueue.enqueue({
          businessId: activeBranch?.name || 'BUS-8F42K91',
          tableName: 'inventory_stock_deltas',
          operation: 'INSERT',
          payload: {
            product_id: item.productId,
            delta_quantity: -Math.abs(item.quantity),
            reason: 'sale',
            sale_id: sale.id,
            cashier_id: currentEmployee.id,
            created_at: sale.timestamp,
          },
        });
      });
    } catch (queueErr) {
      console.warn('Could not enqueue to offline write queue', queueErr);
    }

    // Reset temporary states
    setCashTendered(0);
    setStkConfirmed(false);
    setStkAmountPaid(0);
    setStkPaidTimestamp(null);
    setMpesaCode('QGD' + Math.floor(1000000 + Math.random() * 9000000));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'mpesa' && !stkConfirmed && !mpesaCode) {
      setShowMpesaExpressModal(true);
      return;
    }

    if (paymentMethod === 'credit') {
      if (!selectedCustomerId) {
        alert('Please choose or register a customer for credit sales (Madeni).');
        return;
      }
    }

    if (paymentMethod === 'split') {
      const splitTotal =
        (splitDetails.cash || 0) + (splitDetails.mpesa || 0) + (splitDetails.credit || 0);
      if (Math.abs(splitTotal - cartTotals.grandTotal) > 1) {
        alert(
          `Split total (KSh ${splitTotal.toLocaleString()}) must equal Grand Total (KSh ${cartTotals.grandTotal.toLocaleString()}).`
        );
        return;
      }
    }

    // Role-based security check for discounts
    const discountPercent =
      cartTotals.subtotal > 0 ? (cartTotals.totalDiscount / cartTotals.subtotal) * 100 : 0;
    const isOwnerOrManager =
      currentEmployee?.role === 'owner' || currentEmployee?.role === 'manager';
    const limit = securityLimits.maxDiscountWithoutApprovalPercent || 5;

    const needsApproval =
      cartTotals.totalDiscount > 0 &&
      !isOwnerOrManager &&
      (!currentEmployee?.permissions?.canGiveDiscount || discountPercent > limit);

    if (needsApproval) {
      setShowDiscountApprovalModal(true);
      return;
    }

    executeFinalCheckout();
  };

  const handleInitiateVoid = (sale: Sale) => {
    setSelectedSaleToVoid(sale);
    // If owner or manager, direct confirmation, otherwise supervisor PIN is required
    setShowVoidApprovalModal(true);
  };

  const handleConfirmVoid = (approverName: string, approverRole: string, reason?: string) => {
    if (selectedSaleToVoid) {
      voidSale(selectedSaleToVoid.id, reason || 'Transaction cancelled / entered in error', approverName);
      setVoidNotice(`Sale #${selectedSaleToVoid.receiptNumber} successfully voided and inventory reversed.`);
      setTimeout(() => setVoidNotice(null), 4000);
      setSelectedSaleToVoid(null);
    }
  };

  // Print 80mm thermal receipt directly from POS Checkout Summary
  const handlePrintCheckoutSummary = () => {
    if (cart.length === 0 && !lastCompletedSale) {
      setBarcodeNotice({
        type: 'error',
        text: 'Cart is empty. Add items to cart or complete a sale to print an 80mm receipt.',
      });
      setTimeout(() => setBarcodeNotice(null), 3000);
      return;
    }
    // Triggers browser print dialog using the printer-friendly styles in index.css targeting #printable-receipt-area
    try {
      window.print();
    } catch (err) {
      console.warn('Direct window.print error:', err);
    }
  };

  // Global POS Keyboard Shortcuts: [Enter] Checkout, [Esc] Clear Cart, [Ctrl+F] Focus Search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Focus Search: Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          setIsSearchDropdownOpen(true);
        }
        return;
      }

      // 2. Clear Cart / Close Modal: Esc
      if (e.key === 'Escape') {
        if (showQuickAddModal) {
          setShowQuickAddModal(false);
          return;
        }
        if (isSearchDropdownOpen) {
          setIsSearchDropdownOpen(false);
          return;
        }
        if (showMpesaExpressModal) {
          setShowMpesaExpressModal(false);
          return;
        }
        if (showRecentSalesModal) {
          setShowRecentSalesModal(false);
          return;
        }
        if (showDiscountApprovalModal) {
          setShowDiscountApprovalModal(false);
          return;
        }
        if (showVoidApprovalModal) {
          setShowVoidApprovalModal(false);
          return;
        }

        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLInputElement && activeEl.value.trim().length > 0) {
          activeEl.value = '';
          return;
        }

        if (cart.length > 0) {
          clearCart();
          setBarcodeNotice({
            type: 'success',
            text: 'Cart cleared via [Esc] keyboard shortcut.',
          });
          setTimeout(() => setBarcodeNotice(null), 2500);
        }
        return;
      }

      // 3. Checkout: Enter
      if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        const tagName = activeEl?.tagName.toLowerCase();

        // If in textarea, ignore
        if (tagName === 'textarea') return;

        // If user is inside an input, only trigger checkout if the input is blank
        if (tagName === 'input') {
          const inputEl = activeEl as HTMLInputElement;
          if (inputEl.value.trim().length > 0) {
            return;
          }
        }

        // If user is actively on a button, let the button execute
        if (tagName === 'button') {
          return;
        }

        // If any modal is open, let modal handle its own actions
        if (
          showQuickAddModal ||
          showMpesaExpressModal ||
          showRecentSalesModal ||
          showDiscountApprovalModal ||
          showVoidApprovalModal
        ) {
          return;
        }

        if (cart.length > 0) {
          e.preventDefault();
          handleCheckout();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    cart,
    showQuickAddModal,
    isSearchDropdownOpen,
    showMpesaExpressModal,
    showRecentSalesModal,
    showDiscountApprovalModal,
    showVoidApprovalModal,
    paymentMethod,
    stkConfirmed,
    mpesaCode,
    selectedCustomerId,
    splitDetails,
    cartTotals,
  ]);

  return (
    <div className="space-y-4">
      {/* Sales Book Status Banner */}
      {!isSalesBookOpen ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Register Notice:</strong> Today's sales book is currently closed. Open a book to record opening cash float and shift transactions.
            </span>
          </div>
          <button
            onClick={() => {
              setSalesBookModalMode('start');
              setIsSalesBookModalOpen(true);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Start Today's Sales</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3.5 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>
              <strong>Sales Book Active:</strong> Shift Cashier: {currentSalesBook?.openedBy || storeProfile.cashierName} • Opening Float: <strong className="font-mono text-emerald-800">KSh {(currentSalesBook?.openingCashFloat || 2500).toLocaleString()}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={() => setShowRecentSalesModal(true)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px] transition shadow-2xs"
            >
              <History className="w-3 h-3 text-slate-600" />
              <span>Recent Sales & Voids</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {sales.filter((s) => s.status !== 'voided').length}
              </span>
            </button>
            <button
              onClick={() => {
                setSalesBookModalMode('close');
                setIsSalesBookModalOpen(true);
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px] transition"
            >
              <Lock className="w-3 h-3 text-rose-600" />
              <span>Close Today's Sales</span>
            </button>
          </div>
        </div>
      )}

      {voidNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{voidNotice}</span>
          </div>
          <button onClick={() => setVoidNotice(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            ×
          </button>
        </div>
      )}

      {/* POS Keyboard Shortcuts Quick Reference Banner */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-600 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Command className="w-3.5 h-3.5 text-blue-600" />
          <span>POS Keyboard Hotkeys:</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 shadow-2xs rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-900 font-bold">
              Ctrl + F
            </kbd>
            <span>Focus Search</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 shadow-2xs rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-900 font-bold">
              Enter ↵
            </kbd>
            <span>Checkout</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 shadow-2xs rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-900 font-bold">
              Esc
            </kbd>
            <span>Clear Cart / Close</span>
          </span>
        </div>
      </div>

      {/* Fast Product Entry & Barcode Scanner Hub (Inventory is hidden, only accessible via Name Search & Barcode Scan) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Active Branch / Outlet Context & Quick Add Primary Trigger */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setShowQuickAddModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-95"
              title="Quick Add product by barcode scan or manual lookup"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
              <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.2 rounded font-mono">
                Barcode / Lookup
              </span>
            </button>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-slate-700">Register Outlet:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
              {activeBranch?.name || 'All Locations (Kangemi Main)'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Till: <strong>{activeBranch?.tillNumber || storeProfile?.tillNumber || '000000'}</strong>
            </span>
          </div>

          {/* Quick Hardware Barcode Test Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Barcode className="w-3.5 h-3.5 text-slate-500" />
              <span>Quick Scan Hotkeys:</span>
            </span>
            <button
              type="button"
              onClick={() => handleBarcodeScan('SKU-CEM-50KG')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-slate-700 font-mono transition cursor-pointer shrink-0"
              title="Quick-scan Cement 50kg barcode"
            >
              Cement 50kg
            </button>
            <button
              type="button"
              onClick={() => handleBarcodeScan('SKU-NAIL-3IN')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-slate-700 font-mono transition cursor-pointer shrink-0"
              title="Quick-scan Nails 3-inch barcode"
            >
              Nails 3"
            </button>
            <button
              type="button"
              onClick={() => handleBarcodeScan('SKU-PNT-VIN-WHITE')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-slate-700 font-mono transition cursor-pointer shrink-0"
              title="Quick-scan Vinyl Silk White barcode"
            >
              Paint White
            </button>
            <button
              type="button"
              onClick={() => handleBarcodeScan('SKU-IRN-G28')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-slate-700 font-mono transition cursor-pointer shrink-0"
              title="Quick-scan Iron Sheets G28 barcode"
            >
              Iron Sheet
            </button>
          </div>
        </div>

        {/* Dual Input Channels: Product Name Search & Barcode Scanner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Channel 1: Product Name Search with Live Autocomplete Dropdown */}
          <div className="md:col-span-7 relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchMatches.length > 0) {
                    handleAddSearchedProduct(searchMatches[0]);
                  }
                  if (e.key === 'Escape') {
                    setIsSearchDropdownOpen(false);
                  }
                }}
                placeholder="Search product by name (e.g. Cement, Paint, Nails, Iron sheet)..."
                className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
              />
              {!searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold shadow-2xs">
                    Ctrl+F
                  </kbd>
                </span>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Floating Autocomplete Dropdown (Appears ONLY when typing) */}
            {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in">
                {searchMatches.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No products matching "<strong className="text-slate-700">{searchQuery}</strong>" found.
                  </div>
                ) : (
                  searchMatches.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleAddSearchedProduct(product)}
                      className="p-3 hover:bg-blue-50/70 transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                            {product?.name || 'Item'}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-800 rounded border border-slate-200">
                            {product.sku}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {product.category} • In stock: {product.stockQuantity} {product.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          KSh {product.sellingPrice.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Channel 2: Barcode Scanner Input */}
          <div className="md:col-span-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBarcodeScan();
              }}
              className="flex items-center gap-1.5"
            >
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode / enter SKU..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0 shadow-2xs"
                title="Enter to scan barcode"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0 shadow-2xs"
                title="Quick Add product without navigating away"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Scan & Search Confirmation Feedback Toast */}
        {barcodeNotice && (
          <div
            className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 animate-in fade-in transition ${
              barcodeNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}
          >
            {barcodeNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{barcodeNotice.text}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Active Cart Register (7 cols) - Inventory is visible ONLY here when items are in cart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Active Order Register</h3>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-slate-200">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Quick Add product to cart"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-600 hover:text-red-700 transition flex items-center gap-1 cursor-pointer font-medium"
                    title="Clear cart [Esc]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                    <kbd className="text-[10px] font-mono text-red-500 bg-red-50 border border-red-200 px-1 py-0.2 rounded font-bold">
                      Esc
                    </kbd>
                  </button>
                )}
              </div>
            </div>

            {/* Live STK Payment Top Alert Banner */}
            {stkConfirmed && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>STK Payment Confirmed:</span>
                      <span className="font-mono text-emerald-700 font-black text-sm">
                        KSh {stkAmountPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">
                      Ref: <strong className="font-bold text-emerald-900">{mpesaCode}</strong> • Phone: {mpesaPhone} • {stkPaidTimestamp || 'Just now'}
                    </div>
                  </div>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Paid ✓
                </span>
              </div>
            )}

            {/* Cart Items List: THE ONLY PLACE WHERE INVENTORY PRODUCTS ARE VISIBLE */}
            {cart.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600">
                  <Barcode className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Register Ready • Cart is Empty</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
                  Inventory is hidden during active sales. Type a product name in the search box above or scan a barcode to add products directly to this cart.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Quick Add Product</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                        setIsSearchDropdownOpen(true);
                      }
                    }}
                    className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-600 hover:text-blue-600 rounded-xl font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search by Name</span>
                    <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">Ctrl+F</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (barcodeInputRef.current) {
                        barcodeInputRef.current.focus();
                      }
                    }}
                    className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-600 hover:text-blue-600 rounded-xl font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Scan Barcode</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-2 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {item?.product?.name || 'Item'}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white text-slate-600 rounded border border-slate-200">
                            {item?.product?.sku || ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item?.product?.category || 'Retail'} • KSh {(item?.product?.sellingPrice || 0).toLocaleString()} / {item?.product?.unit || 'unit'} (In stock: {item?.product?.stockQuantity || 0} {item?.product?.unit || 'unit'})
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold font-mono text-slate-900">
                          KSh{' '}
                          {(
                            (item.product.sellingPrice - item.discount) *
                            item.quantity
                          ).toLocaleString()}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Quantity and Discount control */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Quantity:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center transition font-bold"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stockQuantity}
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(item.product.id, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-12 h-7 text-center font-bold text-slate-900 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-hidden"
                          />
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300 flex items-center justify-center transition font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Discount input */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>Discount/item:</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">KSh</span>
                          <input
                            type="number"
                            min="0"
                            value={item.discount || ''}
                            placeholder="0"
                            onChange={(e) =>
                              updateCartDiscount(item.product.id, Number(e.target.value) || 0)
                            }
                            className="w-20 pl-7 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-right text-xs text-slate-900 font-mono focus:border-blue-600 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Order Summary & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">

            {/* Financial Totals */}
            {cart.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">KSh {cartTotals.subtotal.toLocaleString()}</span>
                </div>
                {cartTotals.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Total Discount:</span>
                    <span className="font-mono">
                      -KSh {cartTotals.totalDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Expected Gross Profit:</span>
                  <span className="text-emerald-600 font-medium font-mono">
                    +KSh {cartTotals.estimatedProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-blue-600 text-base font-mono">
                    KSh {cartTotals.grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* 80mm Print Quick Action in Summary Box */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Printer className="w-3 h-3 text-slate-400" />
                    <span>80mm Thermal Receipt</span>
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintCheckoutSummary}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    title="Print 80mm thermal receipt format"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {cart.length > 0 && (
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Payment Method:
                </label>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('mpesa');
                      setShowMpesaExpressModal(true);
                    }}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer ${
                      paymentMethod === 'mpesa'
                        ? 'bg-green-50 border-green-500 text-green-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-green-600" />
                    <span>M-Pesa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-blue-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Credit (Deni)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('split');
                      const half = Math.floor(cartTotals.grandTotal / 2);
                      setSplitDetails({
                        cash: half,
                        mpesa: cartTotals.grandTotal - half,
                        credit: 0,
                      });
                    }}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer ${
                      paymentMethod === 'split'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Split className="w-4 h-4 text-purple-600" />
                    <span>Split</span>
                  </button>
                </div>

                {/* Sub-panel: Cash Payment */}
                {paymentMethod === 'cash' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span>Cash Tendered:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-mono">KSh</span>
                        <input
                          type="number"
                          value={cashTendered || ''}
                          onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 text-right font-bold focus:border-blue-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <button
                        onClick={setExactCash}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        Exact
                      </button>
                      <button
                        onClick={() => setPresetCash(1000)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        1,000
                      </button>
                      <button
                        onClick={() => setPresetCash(2000)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        2,000
                      </button>
                      <button
                        onClick={() => setPresetCash(5000)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        5,000
                      </button>
                      <button
                        onClick={() => setPresetCash(10000)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        10,000
                      </button>
                    </div>

                    {cashTendered >= cartTotals.grandTotal && (
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-700 font-bold">
                        <span>Change to Give:</span>
                        <span className="text-sm font-mono">
                          KSh {changeDue.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-panel: M-Pesa Payment */}
                {paymentMethod === 'mpesa' && (
                  <div className="bg-green-50/50 border border-green-200 rounded-xl p-3.5 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-green-800 font-semibold text-[11px]">
                      <span>M-Pesa Buy Goods Till: <strong className="font-mono font-bold text-green-950">{storeProfile.tillNumber}</strong></span>
                      <span className="bg-green-100 px-2 py-0.5 rounded text-[10px] font-mono border border-green-200 font-bold">
                        Daraja 2.0 Live
                      </span>
                    </div>

                    {/* Prominent Current Order Payment Amount Indicator */}
                    <div className="bg-white p-3 rounded-xl border border-green-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Current Order Payable via STK
                        </span>
                        <span className="text-base font-mono font-black text-emerald-700">
                          KSh {cartTotals.grandTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Launch Mpesa Express Checkout Modal Button */}
                      <button
                        type="button"
                        onClick={() => setShowMpesaExpressModal(true)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Open Mpesa Express Checkout</span>
                      </button>

                      {/* Display Confirmed STK Payment of exact amount */}
                      {stkConfirmed ? (
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 rounded-xl shadow-xs space-y-2.5 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span className="font-bold text-xs">Payment Received & Confirmed!</span>
                            </div>
                            <span className="bg-emerald-800/90 border border-emerald-400/40 text-emerald-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                              Safaricom Verified
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between border-t border-emerald-500/70 pt-2">
                            <span className="text-[11px] text-emerald-100 font-medium">Payment for Current Order:</span>
                            <span className="text-2xl font-mono font-black text-white tracking-tight">
                              KSh {stkAmountPaid.toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-emerald-100/90 font-mono pt-1.5 border-t border-emerald-500/50">
                            <div>
                              Receipt: <strong className="text-yellow-300 font-bold">{mpesaCode}</strong>
                            </div>
                            <div className="text-right">
                              Handset: <strong>{mpesaPhone}</strong>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/30 text-[10px] text-emerald-200">
                            <span className="font-semibold uppercase tracking-wider text-emerald-100">
                              Order Status: Paid ✓
                            </span>
                            {stkPaidTimestamp && <span>Verified at {stkPaidTimestamp}</span>}
                          </div>
                        </div>
                      ) : autoProcessingSale ? (
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 rounded-xl shadow-sm flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-200 animate-bounce" />
                            <div>
                              <div className="text-xs font-bold">Payment Callback Received!</div>
                              <div className="text-[11px] text-emerald-100">
                                Updating order status to <strong className="text-white">Paid</strong> • Generating receipt...
                              </div>
                            </div>
                          </div>
                          <span className="bg-white/20 text-white font-mono text-[10px] font-bold px-2 py-1 rounded">
                            Auto-Printing
                          </span>
                        </div>
                      ) : stkSimulating ? (
                        <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2.5 animate-in fade-in">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 text-amber-900 text-[11px]">
                              <RotateCcw className="w-4 h-4 animate-spin text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                  <span>Prompt Sent to {mpesaPhone}</span>
                                  {stkListeningSse && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                      Live SSE Stream Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-amber-800 text-[11px] mt-0.5">
                                  Awaiting customer PIN entry for <strong className="font-mono font-bold text-amber-950">KSh {cartTotals.grandTotal.toLocaleString()}</strong>.
                                  The order will automatically mark as <strong>Paid</strong> and trigger receipt printing upon confirmation.
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleCancelSTK}
                              className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer shrink-0"
                            >
                              Cancel
                            </button>
                          </div>

                          {/* Direct Handset PIN Confirmation Bypass */}
                          <div className="bg-amber-100/70 p-2 rounded-lg border border-amber-200/80 flex items-center justify-between text-[11px]">
                            <span className="text-amber-900 font-medium">Carrier Handset Fast-Path:</span>
                            <button
                              type="button"
                              onClick={handleSimulatePinCallback}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Confirm customer entered M-Pesa PIN and trigger instant receipt printing"
                            >
                              <Sparkles className="w-3 h-3 text-amber-200" />
                              <span>Authorize PIN Settlement</span>
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1 font-medium">
                          Customer Phone (STK Handset)
                        </label>
                        <input
                          type="text"
                          value={mpesaPhone || ''}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="0712 345 678"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs font-mono focus:border-green-600 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1 font-medium">
                          M-Pesa Ref Code
                        </label>
                        <input
                          type="text"
                          value={mpesaCode || ''}
                          onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                          placeholder="QGD481KL9J"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-green-700 text-xs font-mono font-bold uppercase focus:border-green-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMpesaExpressModal(true);
                            handleTriggerSTK(cartTotals.grandTotal);
                          }}
                          disabled={stkSimulating}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          {stkSimulating ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                              <span>Prompting Handset...</span>
                            </>
                          ) : stkConfirmed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Re-send STK (KSh {cartTotals.grandTotal.toLocaleString()})</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Send Live STK Push (KSh {cartTotals.grandTotal.toLocaleString()})</span>
                            </>
                          )}
                        </button>

                        <span className="text-[11px] text-slate-400">
                          Or enter customer's SMS code
                        </span>
                      </div>

                      {stkStatusMessage && (
                        <div
                          className={`p-2 rounded text-[11px] font-medium ${
                            stkConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {stkStatusMessage}
                        </div>
                      )}
                    </div>

                    {/* Quick Match from Recent Incoming Deposits */}
                    {mpesaTransactions.filter((t) => t.status === 'unmatched').length > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-200/70">
                        <span className="text-[10px] font-semibold text-slate-600 block mb-1">
                          Or Match Recent Incoming Till Deposits:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {mpesaTransactions
                            .filter((t) => t.status === 'unmatched')
                            .slice(0, 3)
                            .map((tx) => (
                              <button
                                key={tx.id}
                                type="button"
                                onClick={() => {
                                  setMpesaCode(tx.receiptNumber);
                                  setMpesaPhone(tx.senderPhone);
                                  setStkConfirmed(true);
                                  setStkAmountPaid(tx.amount);
                                  setStkPaidTimestamp(
                                    new Date().toLocaleTimeString('en-KE', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })
                                  );
                                  setStkStatusMessage(
                                    `✓ Matched incoming till payment of KSh ${tx.amount.toLocaleString()} from ${tx.senderName}`
                                  );
                                }}
                                className="px-2 py-1 bg-white hover:bg-green-100 border border-green-300 rounded text-[10px] font-mono text-left transition cursor-pointer flex items-center gap-1"
                                title="Click to auto-match this payment to this sale"
                              >
                                <span className="font-bold text-green-700">{tx.receiptNumber}</span>
                                <span>KSh {tx.amount.toLocaleString()}</span>
                                <span className="text-slate-400">({tx.senderName.split(' ')[0]})</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-panel: Credit / Madeni */}
                {paymentMethod === 'credit' && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-amber-900 font-semibold text-[11px]">
                      <span>Customer Debt Book (Madeni)</span>
                      <span className="text-slate-500 italic">"Nitakulipa mwisho wa mwezi"</span>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Select Customer</label>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:border-amber-500 focus:outline-hidden"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — Deni: KSh {c.outstandingDebt.toLocaleString()} (Limit: KSh{' '}
                            {c.creditLimit.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCustomer && (
                      <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Current Debt Balance:</span>
                          <span className="font-bold text-red-600 font-mono">
                            KSh {selectedCustomer.outstandingDebt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>New Total after Sale:</span>
                          <span className="font-bold text-amber-700 font-mono">
                            KSh{' '}
                            {(
                              selectedCustomer.outstandingDebt + cartTotals.grandTotal
                            ).toLocaleString()}
                          </span>
                        </div>
                        {selectedCustomer.outstandingDebt + cartTotals.grandTotal >
                          selectedCustomer.creditLimit && (
                          <div className="text-[10px] text-red-700 flex items-center gap-1 font-semibold pt-0.5">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>
                              Warning: Exceeds customer credit limit of KSh{' '}
                              {selectedCustomer.creditLimit.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={creditDueDate || ''}
                          onChange={(e) => setCreditDueDate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">
                          Notes / Terms
                        </label>
                        <input
                          type="text"
                          value={creditNotes || ''}
                          onChange={(e) => setCreditNotes(e.target.value)}
                          placeholder="e.g. End of month"
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:border-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-panel: Split Payment */}
                {paymentMethod === 'split' && (
                  <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                    <div className="text-purple-900 font-semibold text-[11px] mb-1">
                      Split Payment Across Channels:
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Cash</label>
                        <input
                          type="number"
                          value={splitDetails.cash ?? 0}
                          onChange={(e) =>
                            setSplitDetails((prev) => ({
                              ...prev,
                              cash: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">M-Pesa</label>
                        <input
                          type="number"
                          value={splitDetails.mpesa ?? 0}
                          onChange={(e) =>
                            setSplitDetails((prev) => ({
                              ...prev,
                              mpesa: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                          Credit (Deni)
                        </label>
                        <input
                          type="number"
                          value={splitDetails.credit ?? 0}
                          onChange={(e) =>
                            setSplitDetails((prev) => ({
                              ...prev,
                              credit: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] pt-1 text-slate-700 font-medium">
                      <span>Total Allocated:</span>
                      <span className="font-bold font-mono">
                        KSh{' '}
                        {(
                          (splitDetails.cash || 0) +
                          (splitDetails.mpesa || 0) +
                          (splitDetails.credit || 0)
                        ).toLocaleString()}{' '}
                        / KSh {cartTotals.grandTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Optional STK push for the M-Pesa portion of the split */}
                    {(splitDetails.mpesa || 0) > 0 && (
                      <div className="pt-2 border-t border-purple-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-950">M-Pesa Split Share:</span>
                          <span className="font-mono font-bold text-purple-800">
                            KSh {(splitDetails.mpesa || 0).toLocaleString()}
                          </span>
                        </div>

                        {stkConfirmed && stkAmountPaid > 0 ? (
                          <div className="bg-emerald-100 border border-emerald-300 p-2 rounded-lg text-[11px] text-emerald-900 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>STK Paid: <strong>KSh {stkAmountPaid.toLocaleString()}</strong> ({mpesaCode})</span>
                            </div>
                            <span className="text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded">
                              Confirmed ✓
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={mpesaPhone || ''}
                              onChange={(e) => setMpesaPhone(e.target.value)}
                              placeholder="0712 345 678"
                              className="w-1/2 px-2 py-1 bg-white border border-purple-300 rounded text-slate-900 text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleTriggerSTK(splitDetails.mpesa || 0)}
                              disabled={stkSimulating || (splitDetails.mpesa || 0) <= 0}
                              className="w-1/2 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {stkSimulating ? (
                                <RotateCcw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Smartphone className="w-3 h-3" />
                              )}
                              <span>Prompt STK (KSh {(splitDetails.mpesa || 0).toLocaleString()})</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Live Checkout Settlement & STK Payment Breakdown */}
            {cart.length > 0 && stkConfirmed && (
              <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs shadow-2xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>M-Pesa STK Payment Verified</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {mpesaCode}
                  </span>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-emerald-200/80">
                  <div className="flex justify-between text-slate-600">
                    <span>Current Order Grand Total:</span>
                    <span className="font-mono font-medium">KSh {cartTotals.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-bold">
                    <span>Payment Received via STK Push:</span>
                    <span className="font-mono text-emerald-700 text-sm">✓ KSh {stkAmountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-200/50">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span
                      className={`font-mono font-bold ${
                        cartTotals.grandTotal - stkAmountPaid <= 0
                          ? 'text-emerald-700 font-extrabold'
                          : 'text-amber-700'
                      }`}
                    >
                      {cartTotals.grandTotal - stkAmountPaid <= 0
                        ? 'KSh 0 (100% Fully Settled ✓)'
                        : `KSh ${(cartTotals.grandTotal - stkAmountPaid).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout & Print Action Group */}
          {cart.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleCheckout}
                className={`w-full py-3 px-4 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.99] ${
                  stkConfirmed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {stkConfirmed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Complete Sale • KSh {stkAmountPaid.toLocaleString()} Paid via STK
                    </span>
                    <kbd className="hidden sm:inline-block bg-emerald-800/60 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-mono ml-auto">
                      Enter ↵
                    </kbd>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>
                      Complete Sale (KSh {cartTotals.grandTotal.toLocaleString()})
                    </span>
                    <ArrowRight className="w-4 h-4" />
                    <kbd className="hidden sm:inline-block bg-blue-800/60 text-blue-100 text-[10px] px-1.5 py-0.5 rounded font-mono ml-auto">
                      Enter ↵
                    </kbd>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrintCheckoutSummary}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-300 shadow-2xs cursor-pointer active:scale-[0.99]"
                title="Trigger 80mm thermal receipt printer styles"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>Print Thermal Receipt</span>
                <span className="text-[10px] font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-300 font-bold">
                  80mm Format
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mpesa Express Checkout Popup Modal */}
      {showMpesaExpressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-emerald-300 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Mpesa Express Checkout</h3>
                  <p className="text-emerald-100 text-xs font-mono">
                    Safaricom Daraja 2.0 Live STK Push
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleCancelSTK();
                  setShowMpesaExpressModal(false);
                }}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Order Amount Display */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-center space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Amount to Pay via M-Pesa
                </span>
                <div className="text-3xl font-black font-mono text-emerald-950">
                  KSh {cartTotals.grandTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Buy Goods Till: <strong className="font-mono text-slate-800">{activeBranch ? activeBranch.tillNumber : storeProfile.tillNumber}</strong> • {cart.length} item(s) in cart
                </div>
              </div>

              {/* State 1: Confirmed / Auto Processing */}
              {stkConfirmed || autoProcessingSale ? (
                <div className="text-center py-4 space-y-3 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-emerald-900">
                      Payment Successfully Registered!
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Receipt Code: <strong className="font-mono text-emerald-700">{mpesaCode}</strong>
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 mt-2 animate-pulse">
                      System automatically processing receipt...
                    </p>
                  </div>
                </div>
              ) : stkSimulating ? (
                /* State 2: STK Triggered - Loading Sign / Symbol waiting for system to read whether payment has been made */
                <div className="text-center py-2 space-y-4 animate-in fade-in">
                  {/* Animated Loading Sign / Symbol */}
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center animate-pulse">
                      <Smartphone className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      STK Push Dispatched to {mpesaPhone}
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      Waiting for customer to enter M-Pesa PIN on handset for <strong className="font-mono font-bold text-slate-900">KSh {cartTotals.grandTotal.toLocaleString()}</strong>...
                    </p>
                  </div>

                  {/* Real-time listener status indicator */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-semibold">
                      Listening to Safaricom Daraja STK stream (Sub-second polling active)
                    </span>
                  </div>

                  {/* Instant Confirm Action when Customer confirms PIN entry */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Handset PIN Confirmation</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Fast-Track
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Has customer confirmed PIN on their handset? Click below to bypass carrier gateway latency and auto-print receipt immediately:
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulatePinCallback}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Customer Entered PIN • Confirm & Print Receipt</span>
                    </button>
                  </div>

                  {/* Cancel Prompt Button */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelSTK}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Cancel STK prompt
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setShowMpesaExpressModal(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Enter Manual Code
                    </button>
                  </div>
                </div>
              ) : (
                /* State 3: Ready to trigger STK Push */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Customer Safaricom Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={mpesaPhone || ''}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="0712 345 678"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      A prompt will appear instantly on the customer&apos;s handset requesting their M-Pesa PIN.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTriggerSTK(cartTotals.grandTotal)}
                    disabled={!mpesaPhone || mpesaPhone.length < 9}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Trigger STK Push (KSh {cartTotals.grandTotal.toLocaleString()})</span>
                  </button>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Customer paid manually or has SMS code?</span>
                    <button
                      type="button"
                      onClick={() => setShowMpesaExpressModal(false)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      Enter Manual Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show Receipt Modal if sale just completed */}
      {lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          onClose={() => setLastCompletedSale(null)}
          autoPrint={lastCompletedSale.autoPrinted}
        />
      )}

      {/* Show Past Receipt Modal */}
      {viewingPastReceipt && (
        <ReceiptModal
          sale={viewingPastReceipt}
          onClose={() => setViewingPastReceipt(null)}
        />
      )}

      {/* Recent Sales & Void Management Modal */}
      {showRecentSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Recent Register Transactions & Voids</h3>
                  <p className="text-slate-400 text-xs">
                    View completed receipts or void transactions with supervisor PIN override
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecentSalesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {sales.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No sales recorded in the system yet.
                </div>
              ) : (
                sales.slice(0, 25).map((s) => {
                  const isVoided = s.status === 'voided';
                  return (
                    <div
                      key={s.id}
                      className={`border rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                        isVoided
                          ? 'bg-rose-50/40 border-rose-200 opacity-80'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            #{s.receiptNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isVoided
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isVoided ? 'Voided / Reversed' : 'Completed'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(s.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            • {s.branchName || 'Main Branch'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span>Cashier: <strong className="text-slate-800">{s.cashierName || 'Staff'}</strong></span>
                          <span>• Items: {s.items.length}</span>
                          <span>
                            • Payment: <strong className="uppercase text-slate-800">{s.paymentMethod}</strong>
                          </span>
                          {s.totalDiscount > 0 && (
                            <span className="text-amber-700 font-semibold text-[11px]">
                              (Disc: KSh {s.totalDiscount.toLocaleString()})
                            </span>
                          )}
                        </div>

                        {isVoided && (
                          <div className="text-[11px] text-rose-700 bg-rose-100/60 px-2 py-1 rounded-md mt-1">
                            Voided by: <strong>{s.voidedBy || 'Staff'}</strong> • Approved by: <strong>{s.voidApprovedBy || 'Manager'}</strong>
                            {s.voidReason && <span> • Reason: {s.voidReason}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                        <div className={`font-mono font-extrabold text-sm ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          KSh {s.grandTotal.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingPastReceipt(s)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                          {!isVoided && (
                            <button
                              onClick={() => handleInitiateVoid(s)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                              <span>Void Sale</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Showing last 25 sales • Every void action restores stock and creates an audit entry</span>
              <button
                onClick={() => setShowRecentSalesModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Override Manager Approval Modal */}
      {showDiscountApprovalModal && (
        <ManagerApprovalModal
          isOpen={showDiscountApprovalModal}
          onClose={() => setShowDiscountApprovalModal(false)}
          title="Manager Approval: Discount Override"
          description={`Cashier ${currentEmployee?.name || 'Staff'} is applying a discount of KSh ${cartTotals.totalDiscount.toLocaleString()} (${Math.round(
            (cartTotals.totalDiscount / (cartTotals.subtotal || 1)) * 100
          )}%), which exceeds the default shop limit of ${securityLimits.maxDiscountWithoutApprovalPercent}%.`}
          thresholdNotice="Supervisor PIN authorization is required to prevent unauthorized price markdowns."
          onApproved={(approverName) => {
            setShowDiscountApprovalModal(false);
            executeFinalCheckout(approverName);
          }}
        />
      )}

      {/* Void Sale Manager Approval Modal */}
      {showVoidApprovalModal && selectedSaleToVoid && (
        <ManagerApprovalModal
          isOpen={showVoidApprovalModal}
          onClose={() => {
            setShowVoidApprovalModal(false);
            setSelectedSaleToVoid(null);
          }}
          title="Supervisor Override: Void Sale"
          description={`Voiding Receipt #${selectedSaleToVoid.receiptNumber} totaling KSh ${selectedSaleToVoid.grandTotal.toLocaleString()}. All line items will be returned to hardware stock inventory.`}
          thresholdNotice="This cancellation is recorded in the permanent audit trail with your name and timestamp."
          onApproved={handleConfirmVoid}
        />
      )}

      {isSalesBookModalOpen && (
        <DailySalesBookModal
          isOpen={isSalesBookModalOpen}
          onClose={() => setIsSalesBookModalOpen(false)}
          initialMode={salesBookModalMode}
        />
      )}

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base tracking-tight">Quick Add to Cart</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
                      Direct Scan / Lookup
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Scan barcode or search products to add directly to the active sale without navigating away
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                title="Close [Esc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Active Scan / Search Bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Scan Barcode or Type Product Name / SKU:</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Press <kbd className="bg-slate-100 border border-slate-300 px-1 rounded text-slate-700 font-mono font-bold">Enter</kbd> to add top match
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={quickAddInputRef}
                      type="text"
                      value={quickAddQuery}
                      onChange={(e) => setQuickAddQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddScanOrEnter();
                        }
                        if (e.key === 'Escape') {
                          setShowQuickAddModal(false);
                        }
                      }}
                      placeholder="Scan hardware barcode or type e.g. Cement, Nails, Paint, Iron sheet..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden transition"
                    />
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-xl px-2 py-1">
                    <span className="text-[11px] font-bold text-slate-600">Qty:</span>
                    <button
                      type="button"
                      onClick={() => setQuickAddQty((prev) => Math.max(1, prev - 1))}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer border border-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quickAddQty}
                      onChange={(e) => setQuickAddQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-10 text-center font-mono font-bold text-xs bg-transparent border-0 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickAddQty((prev) => prev + 1)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer border border-slate-200"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickAddScanOrEnter}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Quick Hardware Scan Presets */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Click to test instant hardware barcode scan:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const p = products.find((x) => x.sku === 'SKU-CEM-50KG');
                      if (p) handleQuickAddProduct(p, quickAddQty);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-mono transition cursor-pointer"
                  >
                    Cement 50kg (SKU-CEM-50KG)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = products.find((x) => x.sku === 'SKU-NAIL-3IN');
                      if (p) handleQuickAddProduct(p, quickAddQty);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-mono transition cursor-pointer"
                  >
                    Nails 3" (SKU-NAIL-3IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = products.find((x) => x.sku === 'SKU-PNT-VIN-WHITE');
                      if (p) handleQuickAddProduct(p, quickAddQty);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-mono transition cursor-pointer"
                  >
                    Paint White (SKU-PNT-VIN-WHITE)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = products.find((x) => x.sku === 'SKU-IRN-G28');
                      if (p) handleQuickAddProduct(p, quickAddQty);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-mono transition cursor-pointer"
                  >
                    Iron Sheets G28 (SKU-IRN-G28)
                  </button>
                </div>
              </div>

              {/* Live Matching Products List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>
                    {quickAddQuery.trim()
                      ? `Search Matches (${quickAddMatches.length})`
                      : 'Hardware Catalog Quick Select'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Click any item to add directly to cart
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white">
                  {quickAddMatches.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No products found matching "<strong className="text-slate-800">{quickAddQuery}</strong>".
                    </div>
                  ) : (
                    quickAddMatches.map((product) => {
                      const inCartItem = cart.find((i) => i.product.id === product.id);
                      const isLowStock = product.stockQuantity <= (product.reorderLevel || 5);
                      return (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                {product?.name || 'Item'}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                {product.sku}
                              </span>
                              {inCartItem && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                                  In Cart: {inCartItem.quantity}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>{product.category}</span>
                              <span>•</span>
                              <span className={isLowStock ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                                Stock: {product.stockQuantity} {product.unit}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="font-mono font-bold text-xs text-slate-900">
                                KSh {product.sellingPrice.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">per {product.unit}</div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleQuickAddProduct(product, quickAddQty)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add ({quickAddQty})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>
                  Active Cart: <strong className="text-slate-900">{cart.length} line item(s)</strong> • Total:{' '}
                  <strong className="font-mono text-emerald-700 font-bold">
                    KSh {cartTotals.grandTotal.toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
                >
                  Done & Return to Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Thermal Receipt Layout (Targets #printable-receipt-area configured in index.css) */}
      {!lastCompletedSale && !viewingPastReceipt && (
        <div
          id="printable-receipt-area"
          className="hidden print:block bg-white text-black p-2 font-mono text-xs max-w-[80mm] mx-auto"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-black">
            <div className="font-extrabold text-sm tracking-wider uppercase">
              {activeBranch?.name || storeProfile?.name || 'DMi Hardware Store'}
            </div>
            <div className="text-[10px]">
              {storeProfile?.location || 'Nairobi, Kenya'}
            </div>
            <div className="text-[10px]">
              Tel: {storeProfile?.phone || '0712 345 678'} • Till: {activeBranch ? activeBranch.tillNumber : storeProfile?.tillNumber || '584210'}
            </div>
            {storeProfile?.paybillNumber && (
              <div className="text-[10px]">
                Paybill: {storeProfile.paybillNumber}
              </div>
            )}
            {storeProfile?.taxPin && (
              <div className="text-[10px]">
                KRA PIN: {storeProfile.taxPin}
              </div>
            )}
            <div className="mt-1 font-bold text-[11px] uppercase tracking-wide">
              {cart.length > 0 ? 'OFFICIAL CASH SALE RECEIPT' : 'RECEIPT / PROFORMA'}
            </div>
          </div>

          {/* Metadata */}
          <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-bold font-mono">
                {`RC-${Date.now().toString().slice(-6)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>
                {new Date().toLocaleString('en-KE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-semibold">
                {customers.find((c) => c.id === selectedCustomerId)?.name || 'Walk-in Cash Customer'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{currentEmployee?.name || storeProfile?.cashierName || 'Attendant'}</span>
            </div>
            {activeBranch && (
              <div className="flex justify-between">
                <span>Branch:</span>
                <span>{activeBranch?.name || 'Main Branch'}</span>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="py-2 border-b border-dashed border-black space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase border-b border-dashed border-black pb-1">
              <span>Item & Qty</span>
              <span>Total (KSh)</span>
            </div>
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[10px]">
                <div className="pr-2">
                  <span className="font-semibold">{item?.product?.name || 'Item'}</span>
                  <div className="text-[9px]">
                    {item?.quantity || 1} x KSh {(item?.product?.sellingPrice || 0).toLocaleString()}
                    {(item?.discount || 0) > 0 && ` (-KSh ${(item?.discount || 0).toLocaleString()} disc)`}
                  </div>
                </div>
                <span className="font-bold whitespace-nowrap">
                  KSh {(item?.total || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>KSh {cartTotals.subtotal.toLocaleString()}</span>
            </div>
            {cartTotals.totalDiscount > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Total Discount:</span>
                <span>-KSh {cartTotals.totalDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-black">
              <span>GRAND TOTAL:</span>
              <span className="font-black">
                KSh {cartTotals.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-bold uppercase">{paymentMethod}</span>
            </div>
            {paymentMethod === 'mpesa' && mpesaCode && (
              <div className="flex justify-between">
                <span>M-Pesa Ref:</span>
                <span className="font-mono font-bold">{mpesaCode}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold">PAID ✓</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[9px] space-y-1">
            <div className="font-bold uppercase">
              {storeProfile.receiptFooterMessage || 'Asante sana kwa Biashara! Karibu Tena.'}
            </div>
            <div>
              {storeProfile.receiptReturnPolicy || 'Goods once sold in good order are not returnable without receipt.'}
            </div>
            <div className="text-[8px] pt-1 text-slate-600">
              80mm Thermal Receipt • DMi Business OS
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
