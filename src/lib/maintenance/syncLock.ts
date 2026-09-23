/**
 * Lease-Based Sync Mutex Lock with Heartbeat
 *
 * Prevents dual-writer replication conflicts across tabs / workers.
 * Features:
 * - Lease-based lock with active heartbeat (TTL 20 seconds)
 * - Safe release: only releases if holder is dead or lease expired
 * - Idempotency generator: assigns client-generated UUID to all mutations to prevent replay duplicates
 */

export interface SyncLeaseLock {
  holderId: string;
  terminalId: string;
  acquiredAt: number;
  heartbeatAt: number;
  ttlMs: number;
}

const SYNC_LOCK_STORAGE_KEY = 'dmi_pos_sync_lease_lock';
const DEFAULT_TTL_MS = 20000; // 20s TTL

class SyncLockService {
  private currentHolderId: string | null = null;
  private heartbeatTimer: any = null;

  /**
   * Check current lock status
   */
  public getLock(): SyncLeaseLock | null {
    try {
      const data = localStorage.getItem(SYNC_LOCK_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Attempt to acquire sync lease lock
   */
  public acquire(terminalId: string, ttlMs: number = DEFAULT_TTL_MS): { acquired: boolean; holderId: string; lock: SyncLeaseLock } {
    const existing = this.getLock();
    const now = Date.now();

    // If existing lock is still alive and held by another instance
    if (existing && now - existing.heartbeatAt < existing.ttlMs) {
      if (this.currentHolderId === existing.holderId) {
        // We already own the lock, refresh heartbeat
        this.heartbeat(this.currentHolderId);
        return { acquired: true, holderId: existing.holderId, lock: existing };
      }
      return { acquired: false, holderId: existing.holderId, lock: existing };
    }

    // Existing is dead or no lock exists - acquire lease
    const newHolderId = `lock-holder-${Math.random().toString(36).substring(2, 9)}-${now}`;
    const newLock: SyncLeaseLock = {
      holderId: newHolderId,
      terminalId,
      acquiredAt: now,
      heartbeatAt: now,
      ttlMs,
    };

    try {
      localStorage.setItem(SYNC_LOCK_STORAGE_KEY, JSON.stringify(newLock));
      this.currentHolderId = newHolderId;
      this.startHeartbeat(newHolderId);
      return { acquired: true, holderId: newHolderId, lock: newLock };
    } catch {
      return { acquired: false, holderId: '', lock: newLock };
    }
  }

  /**
   * Heartbeat to keep lease alive
   */
  public heartbeat(holderId: string): boolean {
    const lock = this.getLock();
    if (!lock || lock.holderId !== holderId) return false;

    lock.heartbeatAt = Date.now();
    try {
      localStorage.setItem(SYNC_LOCK_STORAGE_KEY, JSON.stringify(lock));
      return true;
    } catch {
      return false;
    }
  }

  private startHeartbeat(holderId: string) {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentHolderId === holderId) {
        this.heartbeat(holderId);
      } else {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }, 5000);
  }

  /**
   * Release lock normally
   */
  public release(holderId: string): boolean {
    const lock = this.getLock();
    if (!lock || lock.holderId !== holderId) return false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.currentHolderId = null;
    try {
      localStorage.removeItem(SYNC_LOCK_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Force release if lease has expired or holder is dead
   */
  public forceReleaseIfStale(): {
    released: boolean;
    wasStale: boolean;
    previousHolder?: string;
    details: string;
  } {
    const lock = this.getLock();
    const now = Date.now();

    if (!lock) {
      return {
        released: true,
        wasStale: false,
        details: 'No sync lock was active. Mutex channel is already clear.',
      };
    }

    const elapsedSinceHeartbeat = now - lock.heartbeatAt;
    const isStale = elapsedSinceHeartbeat > lock.ttlMs;

    if (isStale) {
      try {
        localStorage.removeItem(SYNC_LOCK_STORAGE_KEY);
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        this.currentHolderId = null;
        return {
          released: true,
          wasStale: true,
          previousHolder: lock.holderId,
          details: `Stale lock held by ${lock.terminalId} (inactive for ${Math.round(elapsedSinceHeartbeat / 1000)}s) was successfully purged.`,
        };
      } catch (err: any) {
        return {
          released: false,
          wasStale: true,
          details: `Failed to remove stale lock: ${err.message}`,
        };
      }
    }

    // Holder is still alive and actively heartbeating
    return {
      released: false,
      wasStale: false,
      previousHolder: lock.holderId,
      details: `Active lock held by ${lock.terminalId}. Heartbeat is fresh (${Math.round(elapsedSinceHeartbeat / 1000)}s ago). Release aborted to prevent sync race conditions.`,
    };
  }

  /**
   * Client-generated UUID ensuring every mutation replay is idempotent
   */
  public generateIdempotentUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'mut-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
  }
}

export const syncLock = new SyncLockService();
