/**
 * PowerSync Conflict Resolution Engine
 *
 * Implements two distinct synchronization strategies:
 *
 * 1. Last-Write-Wins (LWW) by `updated_at`:
 *    - Used for: `customers`, `products` metadata (name, selling_price, sku, unit), `branches`, `staff`.
 *    - Logic: If two terminals edit a customer's phone number or product price while offline,
 *      the mutation with the later ISO `updated_at` timestamp is accepted by Postgres.
 *
 * 2. Additive Delta-Based Sync for Inventory Stock:
 *    - Used for: `inventory_stock_deltas` and stock count tracking.
 *    - CRITICAL RULE: Never overwrite absolute stock quantities!
 *      Example failure with LWW:
 *        Initial stock = 50 bags cement.
 *        Terminal 1 (offline at POS counter) sells 5 bags -> writes `stock_quantity = 45`.
 *        Terminal 2 (offline in yard) sells 10 bags -> writes `stock_quantity = 40`.
 *        If LWW runs, stock becomes either 45 or 40. Physical reality is 35 (50 - 5 - 10).
 *        The business lost record of 5 or 10 sold bags!
 *      Additive Delta solution:
 *        Terminal 1 appends delta: `-5`.
 *        Terminal 2 appends delta: `-10`.
 *        Both deltas sync into Postgres & SQLite: `Current Stock = Base Stock + SUM(deltas) = 35`.
 *        Deltas are commutative and idempotent with UUID primary keys!
 */

export interface StockDeltaRecord {
  id: string;
  businessId: string;
  productId: string;
  branchId: string;
  deltaQuantity: number; // Signed number (-5 for sales/damage, +20 for restocks/void reversals)
  reason: 'sale' | 'restock' | 'void_reverse' | 'damage' | 'transfer_out' | 'transfer_in';
  saleId?: string;
  cashierId: string;
  deviceId?: string;
  createdAt: string;
}

export interface ConflictResolutionResult<T> {
  resolvedData: T;
  strategy: 'LWW_ACCEPTED' | 'LWW_REJECTED' | 'DELTA_COMMUTATIVE_APPLIED';
  reason: string;
}

export class ConflictResolutionEngine {
  /**
   * Last-Write-Wins (LWW) evaluator
   * Compares incoming offline mutation with current local or cloud state
   */
  public static resolveLWW<T extends { updated_at?: string; updatedAt?: string }>(
    localRecord: T,
    incomingRecord: T
  ): ConflictResolutionResult<T> {
    const localTime = new Date(localRecord.updated_at || localRecord.updatedAt || 0).getTime();
    const incomingTime = new Date(incomingRecord.updated_at || incomingRecord.updatedAt || 0).getTime();

    if (incomingTime >= localTime) {
      return {
        resolvedData: incomingRecord,
        strategy: 'LWW_ACCEPTED',
        reason: `Incoming mutation timestamp (${incomingTime}) is newer or equal to current (${localTime}). Accepted.`,
      };
    } else {
      return {
        resolvedData: localRecord,
        strategy: 'LWW_REJECTED',
        reason: `Local mutation timestamp (${localTime}) is newer than incoming (${incomingTime}). Kept local.`,
      };
    }
  }

  /**
   * Computes effective stock from base stock + list of deltas
   * Can be executed in SQLite locally or in Supabase Postgres
   */
  public static computeEffectiveStock(
    baseStock: number,
    deltas: StockDeltaRecord[]
  ): { currentStock: number; totalDeducted: number; totalAdded: number } {
    let totalDeducted = 0;
    let totalAdded = 0;

    for (const d of deltas) {
      if (d.deltaQuantity < 0) {
        totalDeducted += Math.abs(d.deltaQuantity);
      } else {
        totalAdded += d.deltaQuantity;
      }
    }

    const currentStock = baseStock + totalAdded - totalDeducted;
    return { currentStock, totalDeducted, totalAdded };
  }

  /**
   * Generates an immutable stock delta for a sale or restock event
   */
  public static createStockDelta(params: {
    businessId: string;
    productId: string;
    branchId: string;
    quantity: number;
    isDeduction: boolean;
    reason: 'sale' | 'restock' | 'void_reverse' | 'damage';
    saleId?: string;
    cashierId: string;
    deviceId?: string;
  }): StockDeltaRecord {
    const deltaQuantity = params.isDeduction ? -Math.abs(params.quantity) : Math.abs(params.quantity);
    return {
      id: 'delta-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now(),
      businessId: params.businessId,
      productId: params.productId,
      branchId: params.branchId,
      deltaQuantity,
      reason: params.reason,
      saleId: params.saleId,
      cashierId: params.cashierId,
      deviceId: params.deviceId,
      createdAt: new Date().toISOString(),
    };
  }
}
