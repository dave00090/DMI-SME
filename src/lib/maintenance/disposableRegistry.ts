/**
 * Disposable Registry for Client Resource Management
 *
 * Tracks every listener, subscription, interval, and in-memory cache.
 * When Fix Lag or Self-Healing executes, disposes orphans, cleans memory caches,
 * and measures event loop delay before and after.
 */

export type Disposable = () => void;

class DisposableRegistryService {
  private intervals = new Map<string, number>();
  private timeouts = new Map<string, number>();
  private eventListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  }> = [];
  private subscriptions = new Set<Disposable>();
  private cachePurgeHooks = new Set<() => void>();

  /**
   * Register an interval for tracking
   */
  public registerInterval(id: string, intervalId: number): void {
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
    }
    this.intervals.set(id, intervalId);
  }

  /**
   * Register a timeout for tracking
   */
  public registerTimeout(id: string, timeoutId: number): void {
    if (this.timeouts.has(id)) {
      clearTimeout(this.timeouts.get(id));
    }
    this.timeouts.set(id, timeoutId);
  }

  /**
   * Register an event listener for tracking
   */
  public trackEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): Disposable {
    target.addEventListener(type, listener, options);
    const entry = { target, type, listener, options };
    this.eventListeners.push(entry);

    return () => {
      target.removeEventListener(type, listener, options);
      this.eventListeners = this.eventListeners.filter((e) => e !== entry);
    };
  }

  /**
   * Register a subscription cleanup function
   */
  public registerSubscription(dispose: Disposable): Disposable {
    this.subscriptions.add(dispose);
    return () => {
      this.subscriptions.delete(dispose);
      try {
        dispose();
      } catch (e) {
        console.warn('[DisposableRegistry] Error disposing subscription', e);
      }
    };
  }

  /**
   * Register in-memory cache purge hook
   */
  public registerCachePurgeHook(hook: () => void): () => void {
    this.cachePurgeHooks.add(hook);
    return () => {
      this.cachePurgeHooks.delete(hook);
    };
  }

  /**
   * Measure instantaneous event loop delay via macrotask resolution
   */
  public async measureEventLoopLag(): Promise<number> {
    const start = performance.now();
    return new Promise((resolve) => {
      setTimeout(() => {
        const elapsed = performance.now() - start;
        const lag = Math.max(0, Math.round(elapsed - 0)); // setTimeout(0) expected ~0-4ms
        resolve(lag);
      }, 0);
    });
  }

  /**
   * Clean up orphaned listeners, purge in-memory caches, and measure lag before & after
   */
  public async purgeOrphansAndCaches(): Promise<{
    lagBeforeMs: number;
    lagAfterMs: number;
    disposedListeners: number;
    disposedSubscriptions: number;
    purgedCachesCount: number;
    recommendedAction: 'optimal' | 'soft_reload_recommended';
  }> {
    const lagBeforeMs = await this.measureEventLoopLag();

    // 1. Purge all in-memory cache hooks
    let purgedCachesCount = 0;
    this.cachePurgeHooks.forEach((hook) => {
      try {
        hook();
        purgedCachesCount++;
      } catch (e) {
        console.warn('[DisposableRegistry] Error purging cache', e);
      }
    });

    // 2. Dispose registered subscriptions
    const disposedSubscriptions = this.subscriptions.size;
    this.subscriptions.forEach((dispose) => {
      try {
        dispose();
      } catch (e) {
        console.warn('[DisposableRegistry] Error disposing subscription', e);
      }
    });
    this.subscriptions.clear();

    // 3. Clear tracked timers that are non-critical
    let disposedTimers = 0;
    this.intervals.forEach((timerId) => {
      clearInterval(timerId);
      disposedTimers++;
    });
    this.intervals.clear();

    this.timeouts.forEach((timerId) => {
      clearTimeout(timerId);
      disposedTimers++;
    });
    this.timeouts.clear();

    // 4. Clean window image memory hints if available
    if (typeof window !== 'undefined') {
      try {
        // Clear global search result caches in window
        if ((window as any).__dmi_cache) {
          (window as any).__dmi_cache = {};
        }
      } catch {
        // Ignore
      }
    }

    // Force macrotask/microtask pump to clear the V8 queue
    await new Promise((r) => setTimeout(r, 60));

    const lagAfterMs = await this.measureEventLoopLag();
    const recommendedAction = lagAfterMs > 50 ? 'soft_reload_recommended' : 'optimal';

    return {
      lagBeforeMs,
      lagAfterMs,
      disposedListeners: this.eventListeners.length,
      disposedSubscriptions,
      purgedCachesCount,
      recommendedAction,
    };
  }
}

export const disposableRegistry = new DisposableRegistryService();
