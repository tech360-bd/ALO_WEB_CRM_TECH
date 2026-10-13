// ─── IndexedDB Schema Definition ────────────────────────────────
// Defines all object stores, indexes, and the database open function.

export const DB_NAME = 'alo-education-offline';

export const SCHEMA_VERSION = 1;

/**
 * All entity store names used for caching server data.
 * Each entity store uses 'id' as its keyPath.
 */
export const ENTITY_STORES = [
  'students',
  'leads',
  'applications',
  'tasks',
  'notes',
  'documents',
  'notifications',
  'courses',
  'universities',
  'countries',
] as const;

export type EntityStoreName = (typeof ENTITY_STORES)[number];

/**
 * System store names (non-entity).
 */
export const SYSTEM_STORES = ['sync_queue', 'metadata'] as const;

export type SystemStoreName = (typeof SYSTEM_STORES)[number];

/**
 * Union of all store names.
 */
export type StoreName = EntityStoreName | SystemStoreName;

/**
 * Index definitions per store.
 * Maps store name → array of { name, keyPath, options? }.
 */
interface IndexDef {
  name: string;
  keyPath: string;
  options?: IDBIndexParameters;
}

const STORE_INDEXES: Record<string, IndexDef[]> = {
  students: [
    { name: 'by_email', keyPath: 'email' },
    { name: 'by_fullName', keyPath: 'fullName' },
    { name: 'by_mobile', keyPath: 'mobile' },
  ],
  leads: [
    { name: 'by_email', keyPath: 'email' },
    { name: 'by_phone', keyPath: 'phone' },
    { name: 'by_status', keyPath: 'status' },
  ],
  applications: [
    { name: 'by_studentId', keyPath: 'studentId' },
    { name: 'by_stage', keyPath: 'stage' },
    { name: 'by_status', keyPath: 'status' },
  ],
  tasks: [
    { name: 'by_assigneeId', keyPath: 'assigneeId' },
    { name: 'by_status', keyPath: 'status' },
    { name: 'by_priority', keyPath: 'priority' },
    { name: 'by_dueDate', keyPath: 'dueDate' },
  ],
  notes: [
    { name: 'by_studentId', keyPath: 'studentId' },
    { name: 'by_authorId', keyPath: 'authorId' },
    { name: 'by_createdAt', keyPath: 'createdAt' },
  ],
  documents: [
    { name: 'by_studentId', keyPath: 'studentId' },
    { name: 'by_type', keyPath: 'type' },
    { name: 'by_status', keyPath: 'status' },
  ],
  notifications: [
    { name: 'by_userId', keyPath: 'userId' },
    { name: 'by_type', keyPath: 'type' },
    { name: 'by_read', keyPath: 'read' },
    { name: 'by_createdAt', keyPath: 'createdAt' },
  ],
  courses: [
    { name: 'by_universityId', keyPath: 'universityId' },
    { name: 'by_level', keyPath: 'level' },
    { name: 'by_country', keyPath: 'country' },
  ],
  universities: [
    { name: 'by_country', keyPath: 'country' },
    { name: 'by_name', keyPath: 'name' },
    { name: 'by_ranking', keyPath: 'ranking' },
  ],
  countries: [
    { name: 'by_code', keyPath: 'code' },
    { name: 'by_name', keyPath: 'name' },
    { name: 'by_region', keyPath: 'region' },
  ],
  sync_queue: [
    { name: 'by_status', keyPath: 'status' },
    { name: 'by_entity', keyPath: 'entity' },
    { name: 'by_createdAt', keyPath: 'createdAt' },
  ],
  metadata: [],
};

/**
 * Open (or create) the IndexedDB database with all stores and indexes.
 * Safe to call multiple times — returns the same connection promise.
 */
let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available in SSR'));
      return;
    }

    const request = indexedDB.open(DB_NAME, SCHEMA_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      for (const storeName of [...ENTITY_STORES, ...SYSTEM_STORES]) {
        if (!db.objectStoreNames.contains(storeName)) {
          const keyPath = storeName === 'metadata' ? 'key' : 'id';
          const store = db.createObjectStore(storeName, { keyPath });

          const indexes = STORE_INDEXES[storeName] || [];
          for (const idx of indexes) {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, idx.options);
            }
          }
        }
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null; // Allow retry
      reject(request.error);
    };
  });

  return dbPromise;
}
