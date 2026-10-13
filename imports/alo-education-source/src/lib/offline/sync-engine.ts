// ─── Main Synchronization Engine ─────────────────────────────
// Orchestrates offline-first sync: network detection, queue processing,
// caching, and auto-sync scheduling.

import { ENTITY_STORES, type EntityStoreName, openDB } from './schema';
import { put as idbPut, putMany, getAll, clearStore } from './db';
import {
  getPending,
  markSyncing,
  markSuccess,
  markFailed,
  pendingCount,
  type SyncQueueItem,
} from './sync-queue';
import { detectConflict, type ConflictRecord } from './conflict-manager';

// ─── Types ──────────────────────────────────────────────────

export type SyncStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';

type SyncEventCallback = (status: SyncStatus) => void;

// ─── Max retry delays (exponential backoff) ──────────────────

const MAX_RETRY_COUNT = 5;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s, 8s, 16s

/**
 * Calculate exponential backoff delay for a given retry count.
 */
function getBackoffDelay(retryCount: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
  return Math.min(delay, 16000); // Cap at 16 seconds
}

// ─── SyncEngine Class ───────────────────────────────────────

export class SyncEngine {
  private userId: string;
  private _isOnline: boolean;
  private _isSyncing: boolean;
  private _syncStatus: SyncStatus;
  private _lastSyncAt: Date | null;
  private autoSyncInterval: ReturnType<typeof setInterval> | null;
  private healthCheckInterval: ReturnType<typeof setInterval> | null;
  private listeners: SyncEventCallback[];

  constructor(userId: string) {
    this.userId = userId;
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this._isSyncing = false;
    this._syncStatus = this._isOnline ? 'ONLINE' : 'OFFLINE';
    this._lastSyncAt = null;
    this.autoSyncInterval = null;
    this.healthCheckInterval = null;
    this.listeners = [];
  }

  // ─── Getters ─────────────────────────────────────────────

  get isOnline(): boolean {
    return this._isOnline;
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  get syncStatus(): SyncStatus {
    return this._syncStatus;
  }

  get lastSyncAt(): Date | null {
    return this._lastSyncAt;
  }

  // ─── Event System ────────────────────────────────────────

  private emit(status: SyncStatus): void {
    this._syncStatus = status;
    for (const cb of this.listeners) {
      try {
        cb(status);
      } catch {
        // Listener errors should never break the engine
      }
    }
  }

  /**
   * Subscribe to status changes. Immediately invokes the callback
   * with the current status so the subscriber gets the initial state.
   */
  onStatusChange(callback: SyncEventCallback): () => void {
    this.listeners.push(callback);
    // Immediately fire with current status for initial state sync
    try {
      callback(this._syncStatus);
    } catch {
      // Listener errors should never break the engine
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // ─── Network Detection ──────────────────────────────────

  private handleOnline = (): void => {
    this._isOnline = true;
    this.emit('SYNCING');
    // Immediately sync when coming back online
    this.syncNow();
  };

  private handleOffline = (): void => {
    this._isOnline = false;
    this._isSyncing = false;
    this.emit('OFFLINE');
  };

  private async healthCheck(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      const wasOffline = !this._isOnline;
      this._isOnline = response.ok;

      if (wasOffline && this._isOnline) {
        this.emit('SYNCING');
        this.syncNow();
      } else if (!this._isOnline && this._syncStatus !== 'OFFLINE') {
        this.emit('OFFLINE');
      }
    } catch {
      if (this._isOnline) {
        this._isOnline = false;
        if (this._syncStatus !== 'OFFLINE') {
          this.emit('OFFLINE');
        }
      }
    }
  }

  // ─── Lifecycle ───────────────────────────────────────────

  /**
   * Start the sync engine: listen for network events and schedule auto-sync.
   */
  start(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Periodic health check every 60s as a fallback
    this.healthCheckInterval = setInterval(() => this.healthCheck(), 60_000);

    // Auto-sync every 30s while online
    this.autoSyncInterval = setInterval(() => {
      if (this._isOnline && !this._isSyncing) {
        this.syncNow();
      }
    }, 30_000);

    // Initial online check
    this.healthCheck();
  }

  /**
   * Stop the sync engine: clean up all listeners and intervals.
   */
  stop(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.listeners = [];
  }

  // ─── Sync Operations ─────────────────────────────────────

  /**
   * Trigger an immediate sync of all pending items.
   */
  async syncNow(): Promise<void> {
    if (this._isSyncing) return;
    this._isSyncing = true;
    this.emit('SYNCING');

    try {
      await this.processQueue();
      this._lastSyncAt = new Date();
      this.emit('SYNCED');
    } catch {
      this.emit('SYNC_ERROR');
    } finally {
      this._isSyncing = false;
      // Restore to ONLINE if still online after sync
      if (this._isOnline) {
        this.emit('ONLINE');
      }
    }
  }

  /**
   * Process the sync queue with exponential backoff for retries.
   */
  private async processQueue(): Promise<void> {
    const pendingItems = await getPending();

    for (const item of pendingItems) {
      await this.processItem(item);
    }
  }

  /**
   * Process a single sync queue item with backoff on failure.
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    // Apply backoff delay before retrying failed items
    if (item.retryCount > 0) {
      const delay = getBackoffDelay(item.retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await markSyncing(item.id);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          entity: item.entity,
          entityId: item.entityId,
          operation: item.operation,
          payload: item.payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as Record<string, unknown>).error ??
          `HTTP ${response.status}`;
        await markFailed(item.id, String(errorMessage));
        return;
      }

      const result = (await response.json()) as Record<string, unknown>;

      // Check for conflict
      const conflict = result.conflict as ConflictRecord | undefined;
      if (conflict) {
        // For conflicts, keep the local version and mark success
        // The conflict-manager will handle resolution later
        await markSuccess(item.id);
        return;
      }

      // Update local IndexedDB cache with server response
      const serverData = result.data as Record<string, unknown> | undefined;
      if (serverData && item.entity !== 'DELETE') {
        const storeName = item.entity as EntityStoreName;
        if (ENTITY_STORES.includes(storeName as typeof ENTITY_STORES[number])) {
          await idbPut(storeName, serverData);
        }
      } else if (item.operation === 'DELETE' && item.entityId) {
        // Remove deleted item from local cache
        const storeName = item.entity as EntityStoreName;
        if (ENTITY_STORES.includes(storeName as typeof ENTITY_STORES[number])) {
          const db = await openDB();
          const tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).delete(item.entityId);
        }
      }

      await markSuccess(item.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await markFailed(item.id, message);
    }
  }

  // ─── Cache Operations ────────────────────────────────────

  /**
   * Cache server data into IndexedDB for an entity type.
   */
  async cacheData(entity: string, data: Record<string, unknown>[]): Promise<void> {
    const storeName = entity as EntityStoreName;
    if (!ENTITY_STORES.includes(storeName as typeof ENTITY_STORES[number])) return;

    try {
      await clearStore(storeName);
      await putMany(storeName, data);
    } catch {
      // Cache writes should never crash the UI
    }
  }

  /**
   * Retrieve all cached data for an entity type.
   */
  async getCachedData<T = Record<string, unknown>>(entity: string): Promise<T[]> {
    const storeName = entity as EntityStoreName;
    if (!ENTITY_STORES.includes(storeName as typeof ENTITY_STORES[number])) return [];

    return getAll<T>(storeName);
  }
}

// ─── Singleton ───────────────────────────────────────────────

let engineInstance: SyncEngine | null = null;

/**
 * Get or create the SyncEngine singleton.
 */
export function getSyncEngine(userId: string): SyncEngine {
  if (!engineInstance) {
    engineInstance = new SyncEngine(userId);
  }
  return engineInstance;
}

/**
 * Destroy the SyncEngine singleton (for logout).
 */
export function destroySyncEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
    engineInstance = null;
  }
}
