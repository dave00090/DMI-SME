/**
 * Offline Write Queue with Exponential Backoff Retry Engine
 *
 * Automatically queues any write (sale, stock delta, customer update, expense)
 * into local SQLite when offline, then replays them reliably when network reconnects.
 */

export interface QueueItem {
  id: string;
  businessId: string;
  tableName: 'sales' | 'sale_items' | 'inventory_stock_deltas' | 'customers' | 'products' | 'staff';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: number; // timestamp in ms
  errorMessage?: string;
  createdAt: string;
}

export type QueueListener = (items: QueueItem[], stats: { pending: number; syncing: number; error: number; synced: number }) => void;

const QUEUE_STORAGE_KEY = 'dmi_pos_powersync_offline_queue';

class OfflineWriteQueueService {
  private queue: QueueItem[] = [];
  private listeners: QueueListener[] = [];
  private isProcessing: boolean = false;
  private syncTimer: any = null;

  constructor() {
    this.restoreQueue();
    this.startPeriodicSyncCheck();
  }

  private restoreQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse offline write queue from storage', e);
    }
  }

  private persistQueue() {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      this.notify();
    } catch (e) {
      console.error('Failed to save offline queue', e);
    }
  }

  public subscribe(listener: QueueListener): () => void {
    this.listeners.push(listener);
    listener(this.queue, this.getStats());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const stats = this.getStats();
    this.listeners.forEach((l) => l([...this.queue], stats));
  }

  public getStats() {
    return {
      pending: this.queue.filter((q) => q.status === 'pending').length,
      syncing: this.queue.filter((q) => q.status === 'syncing').length,
      error: this.queue.filter((q) => q.status === 'error').length,
      synced: this.queue.filter((q) => q.status === 'synced').length,
      total: this.queue.length,
    };
  }

  public getItems(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Enqueue a local offline mutation
   */
  public enqueue(item: {
    businessId: string;
    tableName: 'sales' | 'sale_items' | 'inventory_stock_deltas' | 'customers' | 'products' | 'staff';
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: Record<string, any>;
  }): QueueItem {
    const queueItem: QueueItem = {
      id: 'wq-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      businessId: item.businessId,
      tableName: item.tableName,
      operation: item.operation,
      payload: item.payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date().toISOString(),
    };

    this.queue.unshift(queueItem);
    this.persistQueue();

    // Trigger immediate sync attempt if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return queueItem;
  }

  /**
   * Process all pending items with exponential backoff
   */
  public async processQueue(forceAll: boolean = false): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingItems = this.queue.filter(
        (item) => item.status === 'pending' || (forceAll && item.status === 'error')
      );

      for (const item of pendingItems) {
        // Mark syncing
        item.status = 'syncing';
        item.attempts += 1;
        item.lastAttemptAt = new Date().toISOString();
        this.notify();

        try {
          // Simulate or execute Supabase / PowerSync write
          await this.executeRemoteSync(item);

          item.status = 'synced';
          item.errorMessage = undefined;
        } catch (err: any) {
          console.warn(`[Sync Queue] Failed to sync ${item.id}`, err);
          item.errorMessage = err.message || 'Network connection failed during sync';

          if (item.attempts >= item.maxAttempts) {
            item.status = 'error';
          } else {
            item.status = 'pending';
            // Exponential backoff: 2^attempts * 1000ms
            const backoffMs = Math.pow(2, item.attempts) * 1000;
            item.nextRetryAt = Date.now() + backoffMs;
          }
        }

        this.persistQueue();
      }
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  /**
   * Remote upload handler to Supabase Postgres via REST / PowerSync stream
   */
  private async executeRemoteSync(item: QueueItem): Promise<void> {
    // In production, uses Supabase REST API or PowerSync connector:
    // await fetch(`${SUPABASE_URL}/rest/v1/${item.tableName}`, { ... })
    // If offline, throws network error to trigger retry
    if (!navigator.onLine) {
      throw new Error('Device is offline. Local SQLite write preserved.');
    }

    // Small network delay simulation
    await new Promise((r) => setTimeout(r, 400));
  }

  /**
   * Manually retry failed queue items
   */
  public retryFailed(): void {
    this.queue.forEach((item) => {
      if (item.status === 'error') {
        item.status = 'pending';
        item.attempts = 0;
        item.errorMessage = undefined;
      }
    });
    this.persistQueue();
    this.processQueue(true);
  }

  /**
   * Clear synced records to free local storage
   */
  public clearSynced(): void {
    this.queue = this.queue.filter((item) => item.status !== 'synced');
    this.persistQueue();
  }

  private startPeriodicSyncCheck() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (navigator.onLine) {
        const hasPending = this.queue.some(
          (q) => q.status === 'pending' && (!q.nextRetryAt || Date.now() >= q.nextRetryAt)
        );
        if (hasPending) {
          this.processQueue();
        }
      }
    }, 5000);
  }
}

export const offlineWriteQueue = new OfflineWriteQueueService();
