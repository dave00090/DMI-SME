/**
 * PowerSync Schema Definition for Local SQLite Cache
 * Synchronized bi-directionally with Supabase Postgres.
 *
 * Notice:
 * - Non-inventory tables use `updated_at` timestamps for Last-Write-Wins (LWW) conflict resolution.
 * - Inventory/stock counts use `inventory_stock_deltas` table (additive delta sync)
 *   to guarantee offline concurrent sales never overwrite absolute stock quantities.
 */

export interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL';
  indexed?: boolean;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

export const powerSyncTables: TableDefinition[] = [
  {
    name: 'staff',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'auth_user_id', type: 'TEXT', indexed: true },
      { name: 'full_name', type: 'TEXT' },
      { name: 'role', type: 'TEXT' }, // 'owner' | 'manager' | 'cashier' | 'storekeeper'
      { name: 'phone', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'pin_hash', type: 'TEXT' },
      { name: 'assigned_branch_id', type: 'TEXT' },
      { name: 'is_active', type: 'INTEGER' }, // 1 or 0
      { name: 'updated_at', type: 'TEXT', indexed: true },
    ],
  },
  {
    name: 'branches',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'name', type: 'TEXT' },
      { name: 'code', type: 'TEXT' },
      { name: 'location', type: 'TEXT' },
      { name: 'till_number', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'is_active', type: 'INTEGER' },
      { name: 'updated_at', type: 'TEXT' },
    ],
  },
  {
    name: 'products',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'name', type: 'TEXT', indexed: true },
      { name: 'category', type: 'TEXT', indexed: true },
      { name: 'sku', type: 'TEXT', indexed: true },
      { name: 'selling_price', type: 'REAL' },
      { name: 'cost_price', type: 'REAL' },
      { name: 'unit', type: 'TEXT' },
      { name: 'low_stock_threshold', type: 'REAL' },
      // Note: base_stock is calculated locally from deltas, or cached for offline read
      { name: 'cached_stock', type: 'REAL' },
      { name: 'updated_at', type: 'TEXT', indexed: true },
    ],
  },
  {
    name: 'inventory_stock_deltas',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'product_id', type: 'TEXT', indexed: true },
      { name: 'branch_id', type: 'TEXT', indexed: true },
      { name: 'delta_quantity', type: 'REAL' }, // e.g., -5 for sale, +50 for restock
      { name: 'reason', type: 'TEXT' }, // 'sale' | 'restock' | 'void_reverse' | 'damage'
      { name: 'sale_id', type: 'TEXT', indexed: true },
      { name: 'cashier_id', type: 'TEXT' },
      { name: 'device_id', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT', indexed: true },
    ],
  },
  {
    name: 'sales',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'branch_id', type: 'TEXT', indexed: true },
      { name: 'receipt_number', type: 'TEXT', indexed: true },
      { name: 'cashier_id', type: 'TEXT' },
      { name: 'customer_id', type: 'TEXT' },
      { name: 'subtotal', type: 'REAL' },
      { name: 'total_discount', type: 'REAL' },
      { name: 'grand_total', type: 'REAL' },
      { name: 'payment_method', type: 'TEXT' },
      { name: 'mpesa_code', type: 'TEXT' },
      { name: 'status', type: 'TEXT' }, // 'completed' | 'voided'
      { name: 'created_at', type: 'TEXT', indexed: true },
      { name: 'updated_at', type: 'TEXT' },
    ],
  },
  {
    name: 'sale_items',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'sale_id', type: 'TEXT', indexed: true },
      { name: 'product_id', type: 'TEXT', indexed: true },
      { name: 'quantity', type: 'REAL' },
      { name: 'selling_price', type: 'REAL' },
      { name: 'discount', type: 'REAL' },
      { name: 'total', type: 'REAL' },
    ],
  },
  {
    name: 'customers',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'name', type: 'TEXT', indexed: true },
      { name: 'phone', type: 'TEXT', indexed: true },
      { name: 'outstanding_debt', type: 'REAL' },
      { name: 'credit_limit', type: 'REAL' },
      { name: 'updated_at', type: 'TEXT' },
    ],
  },
  {
    name: 'offline_write_queue',
    columns: [
      { name: 'id', type: 'TEXT', indexed: true },
      { name: 'business_id', type: 'TEXT', indexed: true },
      { name: 'table_name', type: 'TEXT' },
      { name: 'operation', type: 'TEXT' }, // 'INSERT' | 'UPDATE' | 'DELETE' | 'DELTA_STOCK'
      { name: 'payload', type: 'TEXT' },
      { name: 'status', type: 'TEXT', indexed: true }, // 'pending' | 'syncing' | 'synced' | 'error'
      { name: 'attempts', type: 'INTEGER' },
      { name: 'last_attempt_at', type: 'TEXT' },
      { name: 'error_message', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT', indexed: true },
    ],
  },
];
