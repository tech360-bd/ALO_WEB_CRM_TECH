// ─── Cache Invalidation Manager ─────────────────────────────
// Manages cache versions in IndexedDB metadata and triggers
// React Query invalidation when available.

import { getById, put, clearStore } from './db';
import { ENTITY_STORES, type EntityStoreName } from './schema';

const METADATA_STORE = 'metadata' as const;

/**
 * Metadata entry shape in IndexedDB.
 */
interface MetadataEntry {
  key: string;
  value: unknown;
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Build the metadata key for a given entity's version.
 */
function versionKey(entity: string): string {
  return `version:${entity}`;
}

/**
 * Build the metadata key for an entity-specific item version.
 */
function itemVersionKey(entity: string, id: string): string {
  return `version:${entity}:${id}`;
}

/**
 * Safely trigger React Query invalidation if the queryClient is available.
 * This is a best-effort operation — if React Query is not loaded, it's a no-op.
 */
async function invalidateReactQuery(queryKey: string[]): Promise<void> {
  try {
    // Try to get the queryClient from the window-level cache
    // (The app should expose it via window.__REACT_QUERY_CLIENT__)
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).__REACT_QUERY_CLIENT__) {
      const queryClient = (window as Record<string, unknown>).__REACT_QUERY_CLIENT__ as {
        invalidateQueries: (key: unknown[]) => Promise<void>;
      };
      await queryClient.invalidateQueries(queryKey);
    }
  } catch {
    // React Query not available — this is fine
  }
}

// ─── CacheManager Class ─────────────────────────────────────

export class CacheManager {
  /**
   * Invalidate cache for an entity (optionally a specific item).
   */
  async invalidate(entity: string, id?: string): Promise<void> {
    const storeName = entity as EntityStoreName;

    if (id) {
      // Remove the specific item's version from metadata
      const key = itemVersionKey(entity, id);
      const db = await import('./schema').then((m) => m.openDB());
      const tx = db.transaction(METADATA_STORE, 'readwrite');
      tx.objectStore(METADATA_STORE).delete(key);
    } else {
      // Full entity invalidation
      if (ENTITY_STORES.includes(storeName as typeof ENTITY_STORES[number])) {
        await clearStore(storeName);
      }

      // Remove entity version from metadata
      const key = versionKey(entity);
      const db = await import('./schema').then((m) => m.openDB());
      const tx = db.transaction(METADATA_STORE, 'readwrite');
      tx.objectStore(METADATA_STORE).delete(key);
    }

    // Trigger React Query invalidation
    const queryKey = id ? [entity, id] : [entity];
    await invalidateReactQuery(queryKey);
  }

  /**
   * Invalidate all cached entities and their versions.
   */
  async invalidateAll(): Promise<void> {
    for (const store of ENTITY_STORES) {
      try {
        await clearStore(store);
      } catch {
        // Continue with other stores
      }
    }

    // Clear all version metadata
    try {
      await clearStore(METADATA_STORE);
    } catch {
      // Continue
    }

    // Broad invalidation
    await invalidateReactQuery(['all']);
  }

  /**
   * Get the last-known server version for an entity.
   */
  async getCachedVersion(entity: string): Promise<string | null> {
    const key = versionKey(entity);
    const entry = await getById<MetadataEntry>(METADATA_STORE, key);
    if (!entry) return null;
    return typeof entry.value === 'string' ? entry.value : null;
  }

  /**
   * Set the last-known server version for an entity.
   */
  async setCachedVersion(entity: string, version: string): Promise<void> {
    const key = versionKey(entity);
    const entry: MetadataEntry = { key, value: version };
    await put(METADATA_STORE, entry);
  }

  /**
   * Get the version of a specific item within an entity.
   */
  async getItemVersion(entity: string, id: string): Promise<string | null> {
    const key = itemVersionKey(entity, id);
    const entry = await getById<MetadataEntry>(METADATA_STORE, key);
    if (!entry) return null;
    return typeof entry.value === 'string' ? entry.value : null;
  }

  /**
   * Set the version of a specific item within an entity.
   */
  async setItemVersion(entity: string, id: string, version: string): Promise<void> {
    const key = itemVersionKey(entity, id);
    const entry: MetadataEntry = { key, value: version };
    await put(METADATA_STORE, entry);
  }
}

// ─── Singleton ───────────────────────────────────────────────

let cacheManagerInstance: CacheManager | null = null;

/**
 * Get or create the CacheManager singleton.
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}
