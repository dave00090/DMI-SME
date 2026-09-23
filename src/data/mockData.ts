import {
  Customer,
  Expense,
  Product,
  StoreProfile,
  Supplier,
  Sale,
  SupplierQuote,
  Branch,
  InterBranchTransfer,
  DispatchOrder,
  MpesaTransaction,
  DarajaConfig,
  WhatsAppTemplate,
  Employee,
  TransactionSecurityLimits,
  AuditLogEntry,
  AnomalyAlert,
  GuidedSetupConfig,
  UserRole,
  EmployeePermissions,
  BusinessIdentity,
  BusinessSubscription,
  ConnectedDevice,
  DeviceSession,
  DeviceActivationCode,
  SyncEvent,
  SoftDeletedRecord,
  CloudBackupSnapshot,
  ClientSoldSystem,
  DeveloperLicenseVoucher,
  OutskirtsTelemetry,
  DeveloperMaintenanceAction,
} from '../types';

export const initialStoreProfile: StoreProfile = {
  name: 'DMi Business Store',
  industry: 'hardware',
  tillNumber: '5421008',
  paybillNumber: '400200',
  accountNumber: 'NH092',
  phone: '+254 712 345 678',
  location: 'Nairobi, Kenya',
  currency: 'KSh',
  taxPin: 'P051982736Z',
  cashierName: 'David Migichi (Owner)',
  receiptTitle: 'OFFICIAL CASH SALE RECEIPT',
  receiptFooterMessage: 'Asante sana kwa Biashara! Karibu Tena.',
  receiptReturnPolicy: 'Goods once sold in good order are not returnable without this original receipt.',
  receiptPaperFormat: 'thermal80',
};

// All clean live empty state - no hardcoded demo products, customers, suppliers, expenses, or sales
export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialExpenses: Expense[] = [];

export const initialSales: Sale[] = [];

export const initialSupplierQuotes: SupplierQuote[] = [];

// Multi-Branch Initial Setup (Single initial Main Branch)
export const initialBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Main Branch',
    code: 'MAIN',
    location: 'Nairobi Main',
    phone: '+254 712 345 678',
    tillNumber: '5421008',
    paybillNumber: '400200',
    accountNumber: 'MAIN-01',
    cashierName: 'David Migichi (Owner)',
    isWarehouse: false,
    isActive: true,
    notes: 'Main Store & Operations Counter',
  },
];

export const initialTransfers: InterBranchTransfer[] = [];

export const initialDispatchOrders: DispatchOrder[] = [];

export const initialMpesaTransactions: MpesaTransaction[] = [];

export const initialDarajaConfig: DarajaConfig = {
  consumerKey: 'dmi_daraja_prod_key_77a9b',
  consumerSecret: 'dmi_sec_99182aa45',
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  shortcode: '5421008',
  channelType: 'buy_goods',
  callbackUrl: 'https://ais-dev-tdaarb5ss6tltodxb45vs2-430844239449.europe-west2.run.app/api/mpesa/callback',
  environment: 'live',
  autoReconcile: true,
};

export const initialWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: 'tpl-receipt',
    title: 'Itemized Digital Receipt',
    category: 'receipt',
    content: `🧾 *{storeName}*
📍 {storeLocation} | 📞 {storePhone}
M-Pesa Till: *{tillNumber}*
Receipt: *#{receiptNumber}*
Date: {dateTime}
Cashier: {cashierName}

---------------------------------
{itemsList}
---------------------------------
Subtotal: KSh {subtotal}
Discount: KSh {discount}
*TOTAL PAID: KSh {grandTotal}*
Payment Method: *{paymentMethod}*
Ref Code: *{mpesaCode}*

{footerMessage}
_Goods once sold in good order are not returnable without this receipt._`,
  },
  {
    id: 'tpl-debt-friendly',
    title: 'Friendly Debt Reminder (Tier 1)',
    category: 'debt_friendly',
    content: `Habari *{customerName}*,

Ujumbe kutoka *{storeName}* ({storeLocation}).
Tungependa kukukumbusha kuhusu salio lako la *KSh {balance}* linalotarajiwa tarehe *{dueDate}*.

Unaweza kulipa kupitia M-Pesa Buy Goods Till: *{tillNumber}*.
Asante kwa ushirikiano wako na ujenzi mwema! 🤝`,
  },
  {
    id: 'tpl-debt-urgent',
    title: 'Overdue Account Demand (Tier 2)',
    category: 'debt_urgent',
    content: `Jambo *{customerName}*,

ILANI YA SALIO LILILOCHELEWA - *{storeName}*.
Salio lako la *KSh {balance}* lilipita tarehe ya malipo ({dueDate}) na limechelewa kwa siku kadhaa.

Tafadhali kamilisha malipo haya mara moja ili akaunti yako ya vifaa ibaki wazi kwa miradi ijayo.
Lipa kupitia Till: *{tillNumber}*.
Baada ya kulipa tafadhali tutumie ujumbe wa M-Pesa. Asante.`,
  },
  {
    id: 'tpl-supplier-po',
    title: 'Supplier Local Purchase Order (LPO)',
    category: 'supplier_po',
    content: `Dear *{supplierName}* (Attn: {contactPerson}),

*LOCAL PURCHASE ORDER (LPO)* from *{storeName}*.
Branch Delivery: *{deliveryBranch}* ({deliveryLocation}).

Tafadhali tuandalie agizo lifuatalo:
{orderItems}

Terms: {paymentTerms}
Delivery Contact: {branchPhone}
Tafadhali thibitisha upatikanaji wa gari la usafirishaji. Asante!`,
  },
  {
    id: 'tpl-daily-summary',
    title: 'Daily Executive Performance Broadcast',
    category: 'daily_summary',
    content: `📊 *DMi Business - Ripoti ya Mauzo ya Leo*
Tarehe: {date}
Store / Group: *{storeName}*

💰 *MAPATO NA FAIDA*
• Jumla ya Mauzo: *KSh {totalSales}* ({transactionCount} risiti)
• Faida Ghafi (Gross Profit): *KSh {grossProfit}* ({marginPercent}%)
• Gharama za Leo (Expenses): KSh {expenses}
• *Faida Halisi (Net Profit): KSh {netProfit}*

📱 *MGANYIKO WA MALIPO*
• M-Pesa Till: KSh {mpesaTotal}
• Cash Droo: KSh {cashTotal}
• Madeni Mapya: KSh {creditTotal}

⚠️ *HALI YA MADENI NA BIDHAA*
• Madeni Yasiyolipwa: KSh {outstandingDebt} ({debtorCount} wateja)
• Bidhaa Zinazoisha (Low Stock): {lowStockCount} lines

_DMi Business Intelligence • Generated automatically_`,
  },
];

// Master Owner Account — David Migichi (migichidave09@gmail.com, PIN: 8124)
export const initialEmployees: Employee[] = [
  {
    id: 'emp-owner',
    name: 'David Migichi',
    username: 'david.migichi',
    password: 'Mozambique09',
    role: 'owner',
    branchId: 'all',
    branchName: 'All Branches (Head Office)',
    pin: '8124',
    phone: '+254 712 345 678',
    email: 'migichidave09@gmail.com',
    twoFactorEnabled: false,
    biometricRegistered: false,
    status: 'active',
    avatarInitials: 'DM',
    permissions: {
      canCreateSale: true,
      canIssueReceipt: true,
      canProcessReturns: true,
      canGiveDiscount: true,
      canCancelSale: true,
      canViewStock: true,
      canAdjustStock: true,
      canDeleteProduct: true,
      canTransferStock: true,
      canViewCustomers: true,
      canRecordPayment: true,
      canDeleteCustomer: true,
      canViewDailySales: true,
      canViewProfit: true,
      canViewExpenses: true,
      canViewFinancialReports: true,
      canManageEmployees: true,
      canApproveTransfers: true,
      canViewAuditLog: true,
      canConfigureSettings: true,
      canOrderDispatch: true,
      canAuthorizeDispatch: true,
    },
  },
];

export const initialSecurityLimits: TransactionSecurityLimits = {
  maxDiscountWithoutApprovalPercent: 5,
  refundSmallLimit: 2000,
  refundMediumLimit: 20000,
  maxRefundWithoutApprovalAmount: 2000,
  maxRefundManagerApprovalAmount: 20000,
  requireApprovalForPriceChange: true,
  requireApprovalForStockAdjustment: true,
};

export const initialAuditLogs: AuditLogEntry[] = [];

export const initialAnomalies: AnomalyAlert[] = [];

export const initialGuidedSetup: GuidedSetupConfig = {
  isCompleted: false,
  businessType: 'Hardware & Building Supplies',
  branchesCount: '1 Branch',
  employeesCount: '1-5 Employees',
  primaryCategories: ['General'],
};

export const emptyStoreProfile: StoreProfile = {
  name: '',
  industry: 'general',
  tillNumber: '',
  paybillNumber: '',
  accountNumber: '',
  phone: '',
  location: '',
  currency: 'KSh',
  taxPin: '',
  cashierName: '',
  receiptTitle: 'CASH SALE RECEIPT',
  receiptFooterMessage: 'Thank you for your business!',
  receiptReturnPolicy: 'Goods once sold are not returnable without original receipt.',
  receiptPaperFormat: 'thermal80',
};

export const getRoleDefaultPermissions = (role: UserRole | string = 'cashier'): EmployeePermissions => {
  if (role === 'owner') {
    return {
      canCreateSale: true,
      canIssueReceipt: true,
      canProcessReturns: true,
      canGiveDiscount: true,
      canCancelSale: true,
      canViewStock: true,
      canAdjustStock: true,
      canDeleteProduct: true,
      canTransferStock: true,
      canViewCustomers: true,
      canRecordPayment: true,
      canDeleteCustomer: true,
      canViewDailySales: true,
      canViewProfit: true,
      canViewExpenses: true,
      canViewFinancialReports: true,
      canManageEmployees: true,
      canApproveTransfers: true,
      canViewAuditLog: true,
      canViewAuditLogs: true,
      canConfigureSettings: true,
      canOrderDispatch: true,
      canAuthorizeDispatch: true,
      createSale: true,
      issueReceipt: true,
      processReturns: true,
      giveDiscount: true,
      cancelSale: true,
      viewStock: true,
      adjustStock: true,
      deleteProduct: true,
      transferStock: true,
      viewCustomers: true,
      recordPayment: true,
      deleteCustomer: true,
      viewDailySales: true,
      viewProfit: true,
      viewExpenses: true,
      viewFinancialReports: true,
      manageEmployees: true,
      viewAuditLogs: true,
      approveTransfers: true,
      manageSettings: true,
    };
  }

  if (role === 'manager') {
    return {
      canCreateSale: true,
      canIssueReceipt: true,
      canProcessReturns: true,
      canGiveDiscount: true,
      canCancelSale: true,
      canViewStock: true,
      canAdjustStock: true,
      canDeleteProduct: false,
      canTransferStock: true,
      canViewCustomers: true,
      canRecordPayment: true,
      canDeleteCustomer: false,
      canViewDailySales: true,
      canViewProfit: true,
      canViewExpenses: true,
      canViewFinancialReports: false,
      canManageEmployees: false,
      canApproveTransfers: true,
      canViewAuditLog: true,
      canViewAuditLogs: true,
      canConfigureSettings: false,
      canOrderDispatch: true,
      canAuthorizeDispatch: false,
      createSale: true,
      issueReceipt: true,
      processReturns: true,
      giveDiscount: true,
      cancelSale: true,
      viewStock: true,
      adjustStock: true,
      deleteProduct: false,
      transferStock: true,
      viewCustomers: true,
      recordPayment: true,
      deleteCustomer: false,
      viewDailySales: true,
      viewProfit: true,
      viewExpenses: true,
      viewFinancialReports: false,
      manageEmployees: false,
      viewAuditLogs: true,
      approveTransfers: true,
      manageSettings: false,
    };
  }

  if (role === 'accountant') {
    return {
      canCreateSale: false,
      canIssueReceipt: false,
      canProcessReturns: false,
      canGiveDiscount: false,
      canCancelSale: false,
      canViewStock: true,
      canAdjustStock: false,
      canDeleteProduct: false,
      canTransferStock: false,
      canViewCustomers: true,
      canRecordPayment: false,
      canDeleteCustomer: false,
      canViewDailySales: true,
      canViewProfit: true,
      canViewExpenses: true,
      canViewFinancialReports: true,
      canManageEmployees: false,
      canApproveTransfers: false,
      canViewAuditLog: true,
      canViewAuditLogs: true,
      canConfigureSettings: false,
      canOrderDispatch: false,
      canAuthorizeDispatch: false,
      createSale: false,
      issueReceipt: false,
      processReturns: false,
      giveDiscount: false,
      cancelSale: false,
      viewStock: true,
      adjustStock: false,
      deleteProduct: false,
      transferStock: false,
      viewCustomers: true,
      recordPayment: false,
      deleteCustomer: false,
      viewDailySales: true,
      viewProfit: true,
      viewExpenses: true,
      viewFinancialReports: true,
      manageEmployees: false,
      viewAuditLogs: true,
      approveTransfers: false,
      manageSettings: false,
    };
  }

  if (role === 'storekeeper') {
    return {
      canCreateSale: false,
      canIssueReceipt: false,
      canProcessReturns: false,
      canGiveDiscount: false,
      canCancelSale: false,
      canViewStock: true,
      canAdjustStock: true,
      canDeleteProduct: false,
      canTransferStock: true,
      canViewCustomers: false,
      canRecordPayment: false,
      canDeleteCustomer: false,
      canViewDailySales: false,
      canViewProfit: false,
      canViewExpenses: false,
      canViewFinancialReports: false,
      canManageEmployees: false,
      canApproveTransfers: true,
      canViewAuditLog: false,
      canViewAuditLogs: false,
      canConfigureSettings: false,
      canOrderDispatch: true,
      canAuthorizeDispatch: false,
      createSale: false,
      issueReceipt: false,
      processReturns: false,
      giveDiscount: false,
      cancelSale: false,
      viewStock: true,
      adjustStock: true,
      deleteProduct: false,
      transferStock: true,
      viewCustomers: false,
      recordPayment: false,
      deleteCustomer: false,
      viewDailySales: false,
      viewProfit: false,
      viewExpenses: false,
      viewFinancialReports: false,
      manageEmployees: false,
      viewAuditLogs: false,
      approveTransfers: true,
      manageSettings: false,
    };
  }

  // Default: Cashier
  return {
    canCreateSale: true,
    canIssueReceipt: true,
    canProcessReturns: false,
    canGiveDiscount: false,
    canCancelSale: false,
    canViewStock: true,
    canAdjustStock: false,
    canDeleteProduct: false,
    canTransferStock: false,
    canViewCustomers: true,
    canRecordPayment: true,
    canDeleteCustomer: false,
    canViewDailySales: true,
    canViewProfit: false,
    canViewExpenses: false,
    canViewFinancialReports: false,
    canManageEmployees: false,
    canApproveTransfers: false,
    canViewAuditLog: false,
    canViewAuditLogs: false,
    canConfigureSettings: false,
    canOrderDispatch: true,
    canAuthorizeDispatch: false,
    createSale: true,
    issueReceipt: true,
    processReturns: false,
    giveDiscount: false,
    cancelSale: false,
    viewStock: true,
    adjustStock: false,
    deleteProduct: false,
    transferStock: false,
    viewCustomers: true,
    recordPayment: true,
    deleteCustomer: false,
    viewDailySales: true,
    viewProfit: false,
    viewExpenses: false,
    viewFinancialReports: false,
    manageEmployees: false,
    viewAuditLogs: false,
    approveTransfers: false,
    manageSettings: false,
  };
};

export const emptyEmployee: Employee = {
  id: '',
  name: '',
  username: '',
  role: 'cashier',
  branchId: '',
  branchName: '',
  pin: '',
  phone: '',
  email: '',
  twoFactorEnabled: false,
  biometricRegistered: false,
  status: 'active',
  avatarInitials: '',
  permissions: {
    canCreateSale: true,
    canIssueReceipt: true,
    canProcessReturns: false,
    canGiveDiscount: false,
    canCancelSale: false,
    canViewStock: true,
    canAdjustStock: false,
    canDeleteProduct: false,
    canTransferStock: false,
    canViewCustomers: true,
    canRecordPayment: false,
    canDeleteCustomer: false,
    canViewDailySales: false,
    canViewProfit: false,
    canViewExpenses: false,
    canViewFinancialReports: false,
    canManageEmployees: false,
    canApproveTransfers: false,
    canViewAuditLog: false,
    canConfigureSettings: false,
  },
};

export const emptyBusinessIdentity: BusinessIdentity = {
  businessId: '',
  name: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  hqBranchId: '',
  registeredAt: '',
  taxPin: '',
  currency: 'KSh',
};

export const initialBusinessIdentity: BusinessIdentity = {
  businessId: 'BUS-8F42K91',
  name: 'DMi Business Store',
  ownerName: 'David Migichi (Owner)',
  ownerEmail: 'migichidave09@gmail.com',
  ownerPhone: '+254 712 345 678',
  hqBranchId: 'branch-1',
  registeredAt: new Date().toISOString(),
  taxPin: 'P051982736Z',
  currency: 'KSh',
};

export const initialSubscription: BusinessSubscription = {
  tier: 'Business',
  status: 'active',
  renewalDate: new Date(Date.now() + 365 * 86400000).toISOString(),
  maxBranches: 5,
  maxDevices: 15,
  maxUsers: 25,
  licenseKey: 'DMI-LIC-BZ-8F42-9901-K91E',
  authorizedBy: 'David Migichi (Platform Director)',
  monthlyFee: 7500,
  lastPaymentDate: new Date().toISOString(),
  gracePeriodDays: 5,
  planCode: 'BIZ-ENTERPRISE-v2',
  features: [
    'Multi-device real-time sync',
    'Event-sourced inventory ledger',
    'Offline transaction queue',
    'Remote hardware access control',
    'Automated cloud snapshot backups',
    'M-Pesa STK push & C2B reconciliation',
    'WhatsApp business receipts',
    'Audit camera & soft-delete vault',
  ],
};

export const initialConnectedDevices: ConnectedDevice[] = [];
export const initialDeviceSessions: DeviceSession[] = [];
export const initialActivationCodes: DeviceActivationCode[] = [];
export const initialSyncEvents: SyncEvent[] = [];
export const initialSoftDeletedRecords: SoftDeletedRecord[] = [];
export const initialCloudBackups: CloudBackupSnapshot[] = [];

export const initialOutskirtsTelemetry: OutskirtsTelemetry = {
  eventLoopLagMs: 14,
  memoryUsageMb: 42,
  memoryStatus: 'optimal',
  storageUsageMb: 12.4,
  storageFragmentationPct: 2,
  pendingSyncQueue: 0,
  networkLatencyMs: 28,
  crashesCount: 0,
  lastSeenTimestamp: new Date().toISOString(),
  systemUptimeHours: 184.2,
  fpsStatus: 60,
};

export const initialClientSoldSystems: ClientSoldSystem[] = [
  {
    id: 'CLI-001',
    businessId: 'BUS-OCEAN-LIQ',
    businessName: 'Ocean Liquor',
    ownerName: 'James Kariuki',
    ownerPhone: '0791895709',
    ownerEmail: 'oceanliquor@gmail.com',
    location: 'Mombasa Road, Nairobi',
    package: 'Starter',
    monthlyFee: 2500,
    status: 'active',
    licenseKey: 'DMI-CRYPT-OCEAN-STA-4829-91X2',
    soldDate: '2025-11-10',
    renewalDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    lastPaymentDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    activeBranches: 1,
    activeDevices: 2,
    activeUsers: 3,
    outskirtsTelemetry: initialOutskirtsTelemetry,
    systemNotes: 'Ocean Liquor distribution & retail counter terminal.',
  },
  {
    id: 'CLI-002',
    businessId: 'BUS-8F42K91',
    businessName: 'Apex Wholesale Hardware Ltd',
    ownerName: 'Samuel Gitau',
    ownerPhone: '254722894120',
    ownerEmail: 'apex.hardware@gmail.com',
    location: 'Kamiti Road, Nairobi',
    package: 'Business',
    monthlyFee: 7500,
    status: 'active',
    licenseKey: 'DMI-CRYPT-APEX-BUS-9912-74K1',
    soldDate: '2025-08-14',
    renewalDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    lastPaymentDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    activeBranches: 2,
    activeDevices: 6,
    activeUsers: 8,
    outskirtsTelemetry: initialOutskirtsTelemetry,
    systemNotes: 'Main branch + warehouse inventory sync active.',
  },
];
export const demoClientSoldSystems: ClientSoldSystem[] = [];
export const initialDeveloperVouchers: DeveloperLicenseVoucher[] = [];
export const initialDeveloperMaintenanceLogs: DeveloperMaintenanceAction[] = [];
