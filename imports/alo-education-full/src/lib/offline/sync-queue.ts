// ─── Offline Sync Queue ───────────────────────────────────────
// Manages a persistent queue of offline operations in IndexedDB.

import { put, getById, getAll, deleteById, clearStore, query } from './db';

// ─── Types ──────────────────────────────────────────────────

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export type SyncItemStatus = 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED';

export interface SyncQueueItem {
  id: string;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  status: SyncItemStatus;
  lastError?: string;
}

const SYNC_QUEUE_STORE = 'sync_queue' as const;

/**
 * Generate a unique ID for a sync queue item.
 */
function generateId(): string {
  return `sq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Enqueue a new sync operation.
 */
export async function enqueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'updatedAt' | 'retryCount' | 'status'>): Promise<SyncQueueItem> {
  const now = new Date().toISOString();
  const queueItem: SyncQueueItem = {
    ...item,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    status: 'PENDING',
  };

  const result = await put<SyncQueueItem>(SYNC_QUEUE_STORE, queueItem);
  return result ?? queueItem;
}

/**
 * Get all PENDING items ordered by createdAt.
 */
export async function getPending(): Promise<SyncQueueItem[]> {
  try {
    const items = await getAll<SyncQueueItem>(SYNC_QUEUE_STORE);
    return items
      .filter((item) => item.status === 'PENDING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
}

/**
 * Mark an item as SYNCING.
 */
export async function markSyncing(id: string): Promise<boolean> {
  try {
    const existing = await getById<SyncQueueItem>(SYNC_QUEUE_STORE, id);
    if (!existing) return false;

    const updated: SyncQueueItem = {
      ...existing,
      status: 'SYNCING',
      updatedAt: new Date().toISOString(),
    };

    const result = await put(SYNC_QUEUE_STORE, updated);
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Mark an item as SUCCESS.
 */
export async function markSuccess(id: string): Promise<boolean> {
  try {
    const existing = await getById<SyncQueueItem>(SYNC_QUEUE_STORE, id);
    if (!existing) return false;

    const updated: SyncQueueItem = {
      ...existing,
      status: 'SUCCESS',
      updatedAt: new Date().toISOString(),
    };

    const result = await put(SYNC_QUEUE_STORE, updated);
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Mark an item as FAILED with error details.
 */
export async function markFailed(id: string, error: string): Promise<boolean> {
  try {
    const existing = await getById<SyncQueueItem>(SYNC_QUEUE_STORE, id);
    if (!existing) return false;

    const updated: SyncQueueItem = {
      ...existing,
      status: 'FAILED',
      retryCount: existing.retryCount + 1,
      lastError: error,
      updatedAt: new Date().toISOString(),
    };

    const result = await put(SYNC_QUEUE_STORE, updated);
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Get all FAILED items.
 */
export async function getFailed(): Promise<SyncQueueItem[]> {
  try {
    const items = await getAll<SyncQueueItem>(SYNC_QUEUE_STORE);
    return items.filter((item) => item.status === 'FAILED');
  } catch {
    return [];
  }
}

/**
 * Remove an item from the queue (after successful sync).
 */
export async function remove(id: string): Promise<boolean> {
  return deleteById(SYNC_QUEUE_STORE, id);
}

/**
 * Clear all items from the sync queue.
 */
export async function clearAll(): Promise<boolean> {
  return clearStore(SYNC_QUEUE_STORE);
}

/**
 * Retry all FAILED items that haven't exceeded the retry limit (5).
 */
export async function retryAll(): Promise<number> {
  try {
    const failed = await getFailed();
    let retriedCount = 0;

    for (const item of failed) {
      if (item.retryCount < 5) {
        const updated: SyncQueueItem = {
          ...item,
          status: 'PENDING',
          updatedAt: new Date().toISOString(),
        };
        const result = await put(SYNC_QUEUE_STORE, updated);
        if (result !== null) {
          retriedCount++;
        }
      }
    }

    return retriedCount;
  } catch {
    return 0;
  }
}

/**
 * Count pending items.
 */
export async function pendingCount(): Promise<number> {
  try {
    const items = await query<SyncQueueItem>(SYNC_QUEUE_STORE, 'by_status', 'PENDING');
    return items.length;
  } catch {
    return 0;
  }
}
