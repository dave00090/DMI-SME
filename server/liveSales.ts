export interface LiveSaleRecord {
  id: string;
  receiptNumber: string;
  timestamp: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    discount?: number;
    total: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: string;
  splitDetails?: { cash?: number; mpesa?: number; credit?: number };
  mpesaCode?: string;
  mpesaPhone?: string;
  customerId?: string;
  customerName?: string;
  branchId: string;
  branchName: string;
  cashierId: string;
  cashierName: string;
  status: string;
}

export interface LiveDailySalesBook {
  id: string;
  date: string;
  openedAt: string;
  openedBy: string;
  openingCashFloat: number;
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  closingNotes?: string;
  closingStats?: {
    totalSales: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    cashCollected: number;
    mpesaCollected: number;
    creditSales: number;
    outstandingCustomerDebt: number;
    stockValue: number;
    transactionCount: number;
  };
}

class LiveSalesManager {
  private sales: LiveSaleRecord[] = [];
  private currentSalesBook: LiveDailySalesBook | null = null;
  private salesBooksHistory: LiveDailySalesBook[] = [];

  constructor() {
    // Initialize with today's book if not open
    const today = new Date().toISOString().split('T')[0];
    this.currentSalesBook = {
      id: `book-${today}-prod`,
      date: today,
      openedAt: new Date().toISOString(),
      openedBy: 'Store Cashier',
      openingCashFloat: 2500,
      status: 'open',
    };
  }

  public recordSale(sale: LiveSaleRecord): LiveSaleRecord {
    const existingIdx = this.sales.findIndex((s) => s.id === sale.id || s.receiptNumber === sale.receiptNumber);
    if (existingIdx >= 0) {
      this.sales[existingIdx] = sale;
    } else {
      this.sales.unshift(sale);
    }
    return sale;
  }

  public getSales(date?: string): LiveSaleRecord[] {
    if (!date) return this.sales;
    return this.sales.filter((s) => s.timestamp.startsWith(date));
  }

  public getSalesBookState() {
    return {
      currentSalesBook: this.currentSalesBook,
      salesBooksHistory: this.salesBooksHistory,
    };
  }

  public openSalesBook(data: { openingFloat: number; openedBy: string; date?: string }): LiveDailySalesBook {
    const today = data.date || new Date().toISOString().split('T')[0];
    const newBook: LiveDailySalesBook = {
      id: `book-${today}-${Date.now()}`,
      date: today,
      openedAt: new Date().toISOString(),
      openedBy: data.openedBy || 'Store Cashier',
      openingCashFloat: Number(data.openingFloat) || 0,
      status: 'open',
    };
    this.currentSalesBook = newBook;
    return newBook;
  }

  public closeSalesBook(data: { closingNotes?: string; closedBy?: string }): LiveDailySalesBook {
    const today = new Date().toISOString().split('T')[0];
    const openTime = this.currentSalesBook?.openedAt || today;

    // Filter live sales that occurred during this session
    const sessionSales = this.sales.filter(
      (s) => s.timestamp >= openTime || s.timestamp.startsWith(today)
    );

    let totalSales = 0;
    let grossProfit = 0;
    let cashCollected = 0;
    let mpesaCollected = 0;
    let creditSales = 0;

    for (const s of sessionSales) {
      totalSales += Number(s.grandTotal) || 0;
      grossProfit += Number(s.grossProfit) || 0;

      if (s.paymentMethod === 'cash') cashCollected += s.grandTotal;
      else if (s.paymentMethod === 'mpesa') mpesaCollected += s.grandTotal;
      else if (s.paymentMethod === 'credit') creditSales += s.grandTotal;
      else if (s.paymentMethod === 'split' && s.splitDetails) {
        cashCollected += s.splitDetails.cash || 0;
        mpesaCollected += s.splitDetails.mpesa || 0;
        creditSales += s.splitDetails.credit || 0;
      }
    }

    const expenses = 0;
    const netProfit = grossProfit - expenses;

    const bookToClose: LiveDailySalesBook = {
      ...(this.currentSalesBook || {
        id: `book-${today}`,
        date: today,
        openedAt: new Date().toISOString(),
        openedBy: data.closedBy || 'Store Cashier',
        openingCashFloat: 2500,
      }),
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedBy: data.closedBy || this.currentSalesBook?.openedBy || 'Store Cashier',
      closingNotes: data.closingNotes || 'Daily shift reconciled and balanced.',
      closingStats: {
        totalSales,
        grossProfit,
        expenses,
        netProfit,
        cashCollected,
        mpesaCollected,
        creditSales,
        outstandingCustomerDebt: 0,
        stockValue: 0,
        transactionCount: sessionSales.length,
      },
    };

    this.currentSalesBook = bookToClose;
    this.salesBooksHistory.unshift(bookToClose);
    return bookToClose;
  }
}

export const liveSalesManager = new LiveSalesManager();
