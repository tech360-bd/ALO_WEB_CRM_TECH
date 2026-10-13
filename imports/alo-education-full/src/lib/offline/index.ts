// ─── Offline Module — Barrel Exports ─────────────────────
// Re-exports everything from all submodules.

// Schema
export {
  DB_NAME,
  SCHEMA_VERSION,
  ENTITY_STORES,
  SYSTEM_STORES,
  openDB,
  type EntityStoreName,
  type SystemStoreName,
  type StoreName,
} from './schema';

// Generic CRUD
export {
  getAll,
  getById,
  put,
  putMany,
  deleteById,
  clearStore,
  count,
  query,
  search,
} from './db';

// Sync Queue
export {
  enqueue,
  getPending,
  markSyncing,
  markSuccess,
  markFailed,
  getFailed,
  remove,
  clearAll,
  retryAll,
  pendingCount,
  type SyncOperation,
  type SyncItemStatus,
  type SyncQueueItem,
} from './sync-queue';

// Sync Engine
export {
  SyncEngine,
  getSyncEngine,
  destroySyncEngine,
  type SyncStatus,
} from './sync-engine';

// Conflict Manager
export {
  detectConflict,
  resolveConflict,
  type ConflictResolution,
  type ConflictRecord,
} from './conflict-manager';

// Network Status Hook
export {
  useNetworkStatus,
  type NetworkStatusState,
} from './network-status';

// Cache Manager
export {
  CacheManager,
  getCacheManager,
} from './cache-manager';
