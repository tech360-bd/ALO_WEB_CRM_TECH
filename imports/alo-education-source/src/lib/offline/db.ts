// ─── Generic IndexedDB CRUD Operations ────────────────────────
// All operations are wrapped in try/catch and return null on error.

import { openDB, type StoreName } from './schema';

/**
 * Get a transaction and object store for the given store name.
 */
async function getStore(
  storeName: StoreName,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

/**
 * Wrap an IDBRequest in a promise, resolving on success, null on error.
 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

/**
 * Get all records from a store.
 */
export async function getAll<T = Record<string, unknown>>(
  storeName: StoreName
): Promise<T[]> {
  try {
    const store = await getStore(storeName);
    const result = await promisifyRequest<T[]>(store.getAll());
    return result ?? [];
  } catch {
    return [];
  }
}

/**
 * Get a single record by ID.
 */
export async function getById<T = Record<string, unknown>>(
  storeName: StoreName,
  id: string
): Promise<T | null> {
  try {
    const store = await getStore(storeName);
    return promisifyRequest<T>(store.get(id));
  } catch {
    return null;
  }
}

/**
 * Put (insert or update) a single record.
 */
export async function put<T = Record<string, unknown>>(
  storeName: StoreName,
  data: T
): Promise<T | null> {
  try {
    const store = await getStore(storeName, 'readwrite');
    return promisifyRequest<T>(store.put(data));
  } catch {
    return null;
  }
}

/**
 * Put (insert or update) multiple records in a single transaction.
 */
export async function putMany<T = Record<string, unknown>>(
  storeName: StoreName,
  items: T[]
): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const item of items) {
      store.put(item);
    }

    return new Promise<boolean>((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Delete a record by ID.
 */
export async function deleteById(
  storeName: StoreName,
  id: string
): Promise<boolean> {
  try {
    const store = await getStore(storeName, 'readwrite');
    const result = await promisifyRequest(store.delete(id));
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Clear all records in a store.
 */
export async function clearStore(storeName: StoreName): Promise<boolean> {
  try {
    const store = await getStore(storeName, 'readwrite');
    const result = await promisifyRequest(store.clear());
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Count records in a store.
 */
export async function count(storeName: StoreName): Promise<number> {
  try {
    const store = await getStore(storeName);
    const result = await promisifyRequest(store.count());
    return result ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Query records by an index value.
 */
export async function query<T = Record<string, unknown>>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  try {
    const store = await getStore(storeName);
    const index = store.index(indexName);
    const result = await promisifyRequest<T[]>(index.getAll(value));
    return result ?? [];
  } catch {
    return [];
  }
}

/**
 * Search across multiple fields using case-insensitive partial match.
 * Falls back to full scan if any field check fails.
 */
export async function search<T = Record<string, unknown>>(
  storeName: StoreName,
  searchTerm: string,
  fields: string[]
): Promise<T[]> {
  try {
    const all = await getAll<T>(storeName);
    if (!searchTerm || fields.length === 0) return all;

    const term = searchTerm.toLowerCase();

    return all.filter((record) => {
      const rec = record as Record<string, unknown>;
      return fields.some((field) => {
        const val = rec[field];
        if (typeof val !== 'string') return false;
        return val.toLowerCase().includes(term);
      });
    });
  } catch {
    return [];
  }
}
