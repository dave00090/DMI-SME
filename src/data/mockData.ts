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
import { defaultSaaSPlans, defaultPlatformSettings } from './saasData';

// Blank until the owner completes setup. No demo store details.
export const initialStoreProfile: StoreProfile = {
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

// All clean live empty state - no hardcoded demo products, customers, suppliers, expenses, or sales
export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialExpenses: Expense[] = [];

export const initialSales: Sale[] = [];

export const initialSupplierQuotes: SupplierQuote[] = [];

// Every business needs one HQ branch to hang data on; its details are filled in during setup.
export const initialBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Main Branch',
    code: 'MAIN',
    location: '',
    phone: '',
    tillNumber: '',
    paybillNumber: '',
    accountNumber: '',
    cashierName: '',
    isWarehouse: false,
    isActive: true,
    notes: '',
  },
];

export const initialTransfers: InterBranchTransfer[] = [];

export const initialDispatchOrders: DispatchOrder[] = [];

export const initialMpesaTransactions: MpesaTransaction[] = [];

// Daraja credentials are entered by the owner in Store Settings (and should be stored server-side).
export const initialDarajaConfig: DarajaConfig = {
  consumerKey: '',
  consumerSecret: '',
  passkey: '',
  shortcode: '',
  channelType: 'buy_goods',
  callbackUrl: '',
  environment: 'live',
  autoReconcile: false,
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

// No seeded accounts. The first owner account is created through the onboarding / sign-up flow
// (Supabase Auth), never from source code.
export const initialEmployees: Employee[] = [];

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
  businessType: '',
  branchesCount: '1 Branch',
  employeesCount: '1-5 Employees',
  primaryCategories: [],
};

export const emptyStoreProfile: StoreProfile = { ...initialStoreProfile };

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

// Filled in during onboarding / sign-up. Never pre-seed a real business here.
export const initialBusinessIdentity: BusinessIdentity = { ...emptyBusinessIdentity };

// New tenants start on the Starter plan with a trial window taken from platform settings.
// No license key or payment is pre-filled: those come from a redeemed voucher or a real M-Pesa renewal.
const starterPlan = defaultSaaSPlans.find((p) => p.code === 'starter')!;

export const initialSubscription: BusinessSubscription = {
  tier: starterPlan.tier,
  status: 'active',
  renewalDate: new Date(Date.now() + defaultPlatformSettings.trialDurationDays * 86400000).toISOString(),
  maxBranches: starterPlan.maxBranches,
  maxDevices: starterPlan.maxDevices,
  maxUsers: starterPlan.maxUsers,
  licenseKey: '',
  authorizedBy: '',
  monthlyFee: starterPlan.monthlyPriceKes,
  lastPaymentDate: '',
  gracePeriodDays: defaultPlatformSettings.gracePeriodDays,
  planCode: starterPlan.code,
  features: starterPlan.features,
};

export const initialConnectedDevices: ConnectedDevice[] = [];
export const initialDeviceSessions: DeviceSession[] = [];
export const initialActivationCodes: DeviceActivationCode[] = [];
export const initialSyncEvents: SyncEvent[] = [];
export const initialSoftDeletedRecords: SoftDeletedRecord[] = [];
export const initialCloudBackups: CloudBackupSnapshot[] = [];

// Telemetry starts at zero; real values are collected live by the device agent.
export const initialOutskirtsTelemetry: OutskirtsTelemetry = {
  eventLoopLagMs: 0,
  memoryUsageMb: 0,
  memoryStatus: 'optimal',
  storageUsageMb: 0,
  storageFragmentationPct: 0,
  pendingSyncQueue: 0,
  networkLatencyMs: 0,
  crashesCount: 0,
  lastSeenTimestamp: new Date().toISOString(),
  systemUptimeHours: 0,
  fpsStatus: 0,
};

export const initialClientSoldSystems: ClientSoldSystem[] = [];
export const initialDeveloperVouchers: DeveloperLicenseVoucher[] = [];
export const initialDeveloperMaintenanceLogs: DeveloperMaintenanceAction[] = [];
