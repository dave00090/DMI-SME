export type PaymentMethod = 'cash' | 'mpesa' | 'bank' | 'credit' | 'split';

export interface SplitPaymentDetail {
  cash: number;
  mpesa: number;
  credit: number;
  bank?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  costPrice: number;    // buying price from supplier (KSh)
  sellingPrice: number; // retail selling price (KSh)
  stockQuantity: number;
  unit: string;         // e.g. "bag", "bucket", "kg", "piece", "meter", "packet"
  lowStockThreshold: number;
  lastRestockedDate: string;
  lastSoldDate: string; // to track slow-moving/dead stock
  branchStock?: Record<string, number>; // branchId -> quantity breakdown
  supplierId?: string;
  notes?: string;
  isService?: boolean; // true for services (e.g. Haircut, Massage, Repairs)
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // in KSh per unit
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  timestamp: string; // ISO date
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPaymentDetail;
  mpesaCode?: string;
  mpesaPhone?: string;
  customerId?: string;
  customerName?: string;
  creditDueDate?: string;
  notes?: string;
  synced: boolean;
  branchId?: string;
  branchName?: string;
  // Security & Audit fields
  cashierId?: string;
  status?: 'completed' | 'paid' | 'voided';
  paymentStatus?: 'paid' | 'pending' | 'partially_paid';
  stkPushConfirmed?: boolean;
  autoPrinted?: boolean;
  approvedBy?: string; // manager override when discount > limit
  voidedBy?: string;
  voidApprovedBy?: string;
  voidReason?: string;
  voidedAt?: string;
  // Customizable receipt metadata (edited by store owner)
  storeName?: string;
  storeLocation?: string;
  storePhone?: string;
  storeTill?: string;
  storePaybill?: string;
  storeAccount?: string;
  taxPin?: string;
  cashierName?: string;
  receiptTitle?: string;
  receiptFooterMessage?: string;
  receiptReturnPolicy?: string;
  customHeaderNote?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  location?: string;
  outstandingDebt: number; // Madeni owed to shop
  creditLimit: number;
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: 'cash' | 'mpesa' | 'bank';
    reference?: string;
    notes?: string;
  }[];
  lastPurchaseDate?: string;
  creditDueDate?: string;
  status: 'good' | 'warning' | 'overdue';
}

export interface SupplierItemPrice {
  productId: string;
  productName: string;
  price: number;
  unit: string;
  minOrderQuantity?: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  contactPerson: string;
  location: string;
  category?: string;
  balanceOwed: number; // money shop owes to supplier
  paymentTerms: string; // e.g. "30 Days", "Cash on Delivery", "14 Days"
  nextPaymentDue?: string;
  catalog: SupplierItemPrice[];
  purchases: {
    id: string;
    date: string;
    invoiceNo: string;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    itemsSummary: string;
  }[];
}

export interface SupplierQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  unitPrice: number;
  minimumOrderQuantity: number;
  deliveryIncluded: boolean;
  validUntil: string;
}

export type ExpenseCategory = string;

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number; // KSh
  paymentMethod: 'cash' | 'mpesa' | 'bank';
  receiptRef?: string;
  branchId?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  date: string;
  quantityChange: number; // negative for damage/expiry, positive for correction
  reason: 'damaged' | 'expired' | 'theft_loss' | 'audit_correction' | 'sample';
  notes?: string;
  branchId?: string;
}

export interface StoreProfile {
  name: string;
  industry?: 'hardware' | 'agrovet' | 'retail' | 'chemist' | 'salon' | 'general' | 'electronics' | 'supermarket' | 'restaurant' | string;
  tillNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  phone: string;
  email?: string;
  location: string;
  currency: string;
  taxPin?: string;
  cashierName?: string;
  receiptTitle?: string;
  receiptFooterMessage?: string;
  receiptReturnPolicy?: string;
  receiptPaperFormat?: 'thermal80' | 'thermal58' | 'a4';
  vatRate?: number;
  enableVat?: boolean;
}

export interface DailySalesBook {
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

// === VERSION 2: MULTI-BRANCH ===
export interface Branch {
  id: string;
  name: string;
  code: string; // e.g. "NBO", "THK", "HOD"
  location: string;
  phone: string;
  tillNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  cashierName?: string;
  isWarehouse?: boolean;
  isHQ?: boolean;
  isActive?: boolean;
  status?: 'active' | 'disabled' | 'inactive';
  notes?: string;
}

// === ENTERPRISE SECURITY & PERMISSIONS ARCHITECTURE ===
export type UserRole = 'owner' | 'manager' | 'cashier' | 'storekeeper' | 'accountant';

export interface EmployeePermissions {
  // Sales
  canCreateSale: boolean;
  canIssueReceipt: boolean;
  canProcessReturns: boolean;
  canGiveDiscount: boolean;
  canCancelSale: boolean;
  // Inventory
  canViewStock: boolean;
  canAdjustStock: boolean;
  canDeleteProduct: boolean;
  canTransferStock: boolean;
  // Customers
  canViewCustomers: boolean;
  canRecordPayment: boolean;
  canDeleteCustomer: boolean;
  // Reports
  canViewDailySales: boolean;
  canViewProfit: boolean;
  canViewExpenses: boolean;
  canViewFinancialReports: boolean;
  // Management & Security
  canManageEmployees: boolean;
  canApproveTransfers: boolean;
  canViewAuditLog: boolean;
  canViewAuditLogs?: boolean;
  canConfigureSettings: boolean;
  // Dispatch & Logistics Role Permissions
  canOrderDispatch?: boolean; // Any authorized staff (cashier, storekeeper, manager) can order products into dispatch
  canAuthorizeDispatch?: boolean; // Sole go-ahead authority (e.g., Head Office Dispatch Controller or Owner)

  // Optional aliases for backward and quick syntax compatibility
  createSale?: boolean;
  issueReceipt?: boolean;
  processReturns?: boolean;
  giveDiscount?: boolean;
  cancelSale?: boolean;
  viewStock?: boolean;
  adjustStock?: boolean;
  deleteProduct?: boolean;
  transferStock?: boolean;
  viewCustomers?: boolean;
  recordPayment?: boolean;
  deleteCustomer?: boolean;
  viewDailySales?: boolean;
  viewProfit?: boolean;
  viewExpenses?: boolean;
  viewFinancialReports?: boolean;
  manageEmployees?: boolean;
  viewAuditLogs?: boolean;
  approveTransfers?: boolean;
  manageSettings?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  username?: string;
  password?: string;
  role: UserRole;
  branchId: string; // 'all' for owner or Head Manager, or specific branch id
  branchName: string;
  isHeadManager?: boolean; // True for General / Head Operations Manager with cross-branch visibility
  pin?: string; // 4-digit PIN for fast terminal authentication
  phone: string; // Valid Safaricom phone number for SMS OTP & recovery
  email?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  biometricRegistered?: boolean;
  biometricCredentialId?: string;
  status: 'active' | 'disabled' | 'inactive';
  avatarInitials?: string;
  permissions?: EmployeePermissions;
  loginHistory?: { timestamp: string; ipOrDevice: string }[];
  averageDiscountsDaily?: number;
  createdAt?: string;
  canVoidSales?: boolean;
  canApplyCustomDiscount?: boolean;
  canAuthorizeDispatch?: boolean;
  canAccessReports?: boolean;
  canManageStaff?: boolean;
  canModifyLedgers?: boolean;
}

export interface NewStaffUserPayload {
  name: string;
  username: string;
  password: string;
  pin: string;
  role: UserRole;
  branchId: string;
  phone: string; // Safaricom number
  email: string;
  twoFactorEnabled?: boolean;
}

export interface TransactionSecurityLimits {
  maxDiscountWithoutApprovalPercent: number; // e.g. 5%
  refundSmallLimit: number; // e.g. 2,000 KSh (cashier allowed)
  refundMediumLimit: number; // e.g. 20,000 KSh (manager approval)
  maxRefundWithoutApprovalAmount?: number;
  maxRefundManagerApprovalAmount?: number;
  requireApprovalForPriceChange?: boolean;
  requireApprovalForStockAdjustment?: boolean;
}

export type AuditActionType =
  | 'price_change'
  | 'void_sale'
  | 'stock_adjustment'
  | 'discount_override'
  | 'discount_applied'
  | 'debt_payment'
  | 'transfer_request'
  | 'transfer_approval'
  | 'permission_change'
  | 'employee_status'
  | 'refund_approval'
  | 'security_limit_change'
  | 'sync_completed'
  | 'business_profile_update'
  | 'subscription_upgrade'
  | 'device_switch'
  | 'device_code_generated'
  | 'device_activated'
  | 'device_revoked'
  | 'device_replaced'
  | 'sale_sync_reconciliation'
  | 'crash_recovery'
  | 'soft_delete_vault'
  | 'vault_restore'
  | 'backup_created'
  | 'disaster_recovery_restore'
  | 'disaster_recovery_simulation'
  | 'disaster_recovery_import';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: UserRole;
  branchId?: string;
  branchName?: string;
  deviceId?: string;
  deviceName?: string;
  terminalNumber?: string;
  action: AuditActionType;
  targetDescription: string;
  oldValue?: string;
  newValue?: string;
  approvedBy?: string;
  notes?: string;
  relatedEntityId?: string;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  type: 'unusual_discount' | 'excessive_voids' | 'stock_adjustment_spike' | 'off_hours_sale';
  employeeName: string;
  employeeId?: string;
  branchName: string;
  message?: string;
  title?: string;
  description?: string;
  statComparison?: string; // e.g. "14 discounts today vs average of 3"
  status: 'flagged' | 'reviewed' | 'dismissed';
}

export interface GuidedSetupConfig {
  isCompleted?: boolean;
  completed?: boolean;
  businessType: string;
  branchesCount: string;
  employeesCount: string;
  primaryCategories?: string[];
  modulesEnabled?: string[];
}

export interface InterBranchTransfer {
  id: string;
  transferNumber: string; // e.g. "IBT-2026-001"
  sourceBranchId: string;
  sourceBranchName: string;
  destBranchId: string;
  destBranchName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'dispatched' | 'received' | 'cancelled';
  requestDate: string;
  dispatchedDate?: string;
  receivedDate?: string;
  driverName?: string;
  vehicleReg?: string;
  notes?: string;
  requestedBy: string;
  approvedBy?: string; // Owner / Manager who approved
  approvedDate?: string;
}

// === INTER-BRANCH DISPATCH FULFILLMENT & AUTHORIZATION SYSTEM ===
export interface DispatchOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  orderedQuantity: number;
  approvedQuantity?: number;
  notes?: string;
}

export interface DispatchOrder {
  id: string;
  dispatchNumber: string; // e.g. "DSP-2026-081"
  sourceBranchId: string;
  sourceBranchName: string;
  destBranchId: string;
  destBranchName: string;
  items: DispatchOrderItem[];
  status: 'pending_approval' | 'dispatched' | 'received' | 'cancelled' | 'rejected';
  urgency: 'normal' | 'urgent' | 'emergency';
  orderedBy: string; // Employee Name
  orderedById: string; // Employee ID
  orderedByRole: string;
  orderedAt: string;
  notes?: string;
  // Sole Go-Ahead Authorization
  authorizedBy?: string; // Authorized Go-Ahead Controller
  authorizedById?: string;
  authorizedAt?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleReg?: string;
  securitySealNumber?: string;
  departureNotes?: string;
  // Receiving verification
  receivedBy?: string;
  receivedAt?: string;
  transferId?: string; // Linked InterBranchTransfer ID
}

// === VERSION 2: M-PESA AUTOMATION ===
export interface MpesaTransaction {
  id: string;
  receiptNumber: string; // e.g. "SK82H9ZX1M"
  amount: number;
  senderPhone: string;
  senderName: string;
  timestamp: string;
  status: 'matched' | 'unmatched';
  channel: 'c2b_till' | 'stk_push' | 'paybill';
  branchId: string;
  matchedSaleReceipt?: string;
  matchedCustomerName?: string;
  notes?: string;
}

export interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string; // Till or Paybill
  channelType: 'buy_goods' | 'paybill';
  callbackUrl: string;
  environment: 'sandbox' | 'live';
  autoReconcile: boolean;
}

// === VERSION 2: WHATSAPP AUTOMATION ===
export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'receipt' | 'debt_friendly' | 'debt_urgent' | 'supplier_po' | 'daily_summary';
  content: string;
}

// === DATA PERSISTENCE & DEVICE MANAGEMENT ARCHITECTURE ===

export interface BusinessIdentity {
  businessId: string; // e.g. "BUS-8F42K91" - permanent source of truth
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  hqBranchId: string;
  registeredAt: string;
  taxPin: string;
  currency: string;
}

export type SubscriptionTier = 'Starter' | 'Business' | 'Pro' | 'Enterprise';
export type SubscriptionAccessStatus = 'active' | 'trial' | 'expiring_soon' | 'grace_period' | 'past_due' | 'suspended' | 'cancelled';

export interface SaaSPlan {
  id: string;
  code: 'starter' | 'business' | 'pro' | 'enterprise';
  name: string;
  tier: SubscriptionTier;
  monthlyPriceKes: number;
  annualPriceKes: number;
  maxBranches: number;
  maxDevices: number;
  maxUsers: number;
  maxProducts: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  supportLevel: 'community' | 'standard' | 'priority_phone' | 'dedicated_24_7';
}

export interface SaaSInvoice {
  id: string;
  invoiceNumber: string;
  businessId: string;
  businessName: string;
  planCode: string;
  planName: string;
  amountKes: number;
  paymentMethod: 'mpesa_stk' | 'mpesa_paybill' | 'bank_transfer' | 'voucher';
  transactionReference: string;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  notes?: string;
  receiptUrl?: string;
}

export interface SupportAccessAuditLog {
  id: string;
  adminName: string;
  adminEmail: string;
  businessId: string;
  businessName: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
  expiresAt?: string;
  dataAccessed?: string[]; // e.g. ['Sales report', 'Sales transactions', 'Customer debt ledger']
  actions?: 'VIEW ONLY' | 'AUTHORIZED CORRECTION';
  status?: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  actionsPerformed: string[];
  ipAddress?: string;
}

export interface PlatformHealthMetrics {
  totalBusinesses: number;
  activeCount: number;
  trialCount: number;
  gracePeriodCount: number;
  suspendedCount: number;
  mrrKes: number;
  monthlyCollectionsKes: number;
  failedPaymentsCount: number;
  totalActiveDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  apiResponseTimeMs: number;
  databaseHealth: 'healthy' | 'degraded' | 'recovering';
  storageUsageGb: number;
  syncFailures: number;
  errorRatePct: number;
  queueStatus: 'idle' | 'processing' | 'backlogged';
  securityEventsCount: number;
}

export interface PlatformGlobalSettings {
  trialDurationDays: number;
  gracePeriodDays: number;
  warningNoticeDays: number;
  mrrTargetKes: number;
  requireDarajaForRenewal: boolean;
  allowManualVouchers: boolean;
  maintenanceMode: boolean;
}

export interface BusinessSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'trial' | 'past_due' | 'suspended' | 'grace_period' | 'expiring_soon';
  renewalDate: string;
  maxBranches: number;
  maxDevices: number;
  maxUsers: number;
  features: string[];
  licenseKey?: string;
  authorizedBy?: string;
  monthlyFee?: number;
  lastPaymentDate?: string;
  gracePeriodDays?: number;
  gracePeriodEndsAt?: string;
  planCode?: string;
}

export type DeviceHardwareType = 'desktop_pc' | 'laptop' | 'tablet' | 'mobile' | 'phone';
export type DeviceStatus = 'active' | 'offline' | 'revoked' | 'retired';

export interface ConnectedDevice {
  id: string; // e.g. "dev-pos-01"
  name: string; // e.g. "POS-01 (Main Counter)"
  type: DeviceHardwareType;
  os: string; // e.g. "Windows 11 Pro", "Android POS", "iPadOS"
  role: UserRole; // 'cashier' | 'manager' | 'storekeeper' | 'owner'
  branchId: string;
  branchName: string;
  status: DeviceStatus;
  lastSyncAt: string; // ISO string
  ipAddress: string;
  registeredAt: string;
  activationCode?: string;
  isCurrentDevice?: boolean;
  currentStaffName?: string;
  terminalNumber?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  branchId: string;
  branchName: string;
  startedAt: string;
  lastActiveAt: string;
  status: 'active' | 'terminated';
  ipAddress?: string;
}

export interface DeviceActivationCode {
  code: string; // e.g. "7K9P-42XM"
  createdAt: string;
  expiresAt: string;
  intendedBranchId: string;
  intendedBranchName: string;
  intendedRole: UserRole;
  status: 'pending' | 'used' | 'expired';
  usedByDeviceId?: string;
  generatedBy: string;
}

export type SyncEventType =
  | 'SALE_CREATED'
  | 'SALE_VOIDED'
  | 'STOCK_RESTOCK'
  | 'STOCK_ADJUSTED'
  | 'BRANCH_TRANSFER'
  | 'DEBT_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'EXPENSE_RECORDED'
  | 'SOFT_DELETE'
  | 'RECORD_ARCHIVED'
  | 'RECORD_RESTORED'
  | 'PRODUCT_CREATED';

export interface SyncEvent {
  id: string;
  businessId: string;
  deviceId: string;
  deviceName: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  timestamp: string;
  eventType: SyncEventType;
  entityType: 'sale' | 'product' | 'customer' | 'stock' | 'transfer' | 'payment' | 'expense' | 'supplier';
  entityId: string;
  description: string;
  deltaPayload: Record<string, any>;
  status: 'pending' | 'synced' | 'conflict_resolved';
  syncedAt?: string;
}

export interface SoftDeletedRecord {
  id: string;
  entityType: 'product' | 'customer' | 'supplier' | 'sale';
  entityId: string;
  name: string;
  deletedAt: string;
  deletedBy: string;
  deletedByName: string;
  reason: string;
  previousData: any;
}

export interface CloudBackupSnapshot {
  id: string;
  businessId: string;
  timestamp: string;
  label: string;
  type: 'automated' | 'manual' | 'pre_update';
  sizeKb: number;
  recordsCount: {
    products: number;
    sales: number;
    customers: number;
    branches: number;
    devices: number;
    employees: number;
  };
  checksum: string;
  status: 'healthy' | 'archived';
  dataPayload?: string;
}

// === DEVELOPER FLEET, OUTSKIRTS TELEMETRY & MONETIZATION ARCHITECTURE ===

export interface OutskirtsTelemetry {
  eventLoopLagMs: number;         // e.g. 14ms (healthy < 40ms)
  memoryUsageMb: number;          // e.g. 42MB
  memoryStatus: 'optimal' | 'elevated' | 'lag_warning';
  storageUsageMb: number;         // e.g. 18.4MB (IndexedDB + cache)
  storageFragmentationPct: number; // e.g. 4%
  pendingSyncQueue: number;       // background sync events pending
  networkLatencyMs: number;       // ping in ms
  crashesCount: number;           // total crash & recovery events logged
  lastCrashTimestamp?: string;
  lastCrashReason?: string;
  lastSeenTimestamp: string;
  systemUptimeHours: number;
  fpsStatus: number;              // target 60fps
}

export interface ClientSoldSystem {
  id: string;                    // e.g. "CLI-001"
  businessId: string;            // e.g. "BUS-8F42K91"
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  location: string;
  package: SubscriptionTier;
  monthlyFee: number;            // in KSh
  status: 'active' | 'trial' | 'past_due' | 'grace' | 'suspended';
  licenseKey: string;
  soldDate: string;
  renewalDate: string;
  lastPaymentDate: string;
  activeBranches: number;
  activeDevices: number;
  activeUsers: number;
  outskirtsTelemetry: OutskirtsTelemetry;
  systemNotes?: string;
}

export interface DeveloperLicenseVoucher {
  id?: string;
  code: string;                  // e.g. "DMI-BIZ-7K9A-WM3X-8P4T" (shown once) or masked "DMI-BIZ-7K9A-****-****"
  masked_prefix?: string;
  token_hash?: string;
  tier: SubscriptionTier;
  durationDays: number;          // e.g. 7, 30, 90, 365
  monthlyFee: number;            // Authoritative plan price in KES
  price_kes?: number;
  generatedAt: string;
  expiresAt?: string;
  status: 'available' | 'redeemed' | 'revoked' | 'expired';
  mpesa_receipt?: string;
  redeemedByBusinessId?: string;
  redeemedAt?: string;
  etims_invoice_number?: string;
}

export interface AuthoritativePlan {
  id: string;
  tier: SubscriptionTier;
  duration_days: number;
  price_kes: number;
  name: string;
  limits: {
    max_branches: number;
    max_devices: number;
    max_products: number;
    offline_grace_days: number;
    features: string[];
  };
  is_active: boolean;
}

export interface SignedLicenseRecord {
  licenseKey: string;
  validUntil: string;
  tier: SubscriptionTier;
  durationDays: number;
  fingerprint: string;
  verifiedOffline: boolean;
  issuedAt: string;
}

export type DeveloperMaintenanceActionType =
  | 'lag_fix'
  | 'vacuum_db'
  | 'release_sync_lock'
  | 'restore_snapshot'
  | 'safe_reboot'
  | 'reindex_ledgers'
  | 'repair_license_keys'
  | 'full_diagnostic_repair';

export interface DeveloperMaintenanceAction {
  id: string;
  timestamp: string;
  actionType: DeveloperMaintenanceActionType;
  targetBusinessId: string;
  status: 'completed' | 'in_progress' | 'failed';
  details: string;
}



