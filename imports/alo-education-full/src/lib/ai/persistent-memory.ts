import { db } from '@/lib/db';
import type { MemoryContextType } from './types';

const KEY_PREFIX = 'ai_memory';

function compositeKey(contextType: MemoryContextType, contextId: string, key: string): string {
  return `${KEY_PREFIX}:${contextType}:${contextId}:${key}`;
}

class PersistentMemoryStore {
  async save(contextType: MemoryContextType, contextId: string, key: string, value: string): Promise<void> {
    try {
      const fullKey = compositeKey(contextType, contextId, key);
      console.log(`[PersistentMemory] Saving key: ${fullKey}`);

      await db.setting.upsert({
        where: { key: fullKey },
        update: { value, updatedAt: new Date() },
        create: { key: fullKey, value, type: 'AI_MEMORY' },
      });
    } catch (error) {
      console.error(`[PersistentMemory] Failed to save key for context ${contextType}:${contextId}:${key}`, error);
    }
  }

  async load(contextType: MemoryContextType, contextId: string, key: string): Promise<string | null> {
    try {
      const fullKey = compositeKey(contextType, contextId, key);
      const setting = await db.setting.findUnique({
        where: { key: fullKey },
      });
      return setting?.value ?? null;
    } catch (error) {
      console.error(`[PersistentMemory] Failed to load key for context ${contextType}:${contextId}:${key}`, error);
      return null;
    }
  }

  async loadAll(contextType: MemoryContextType, contextId: string): Promise<Map<string, string>> {
    try {
      const prefix = `${KEY_PREFIX}:${contextType}:${contextId}:`;
      const settings = await db.setting.findMany({
        where: {
          key: { startsWith: prefix },
        },
      });

      const result = new Map<string, string>();
      for (const setting of settings) {
        // Strip the prefix to get the original key
        const originalKey = setting.key.slice(prefix.length);
        result.set(originalKey, setting.value);
      }
      return result;
    } catch (error) {
      console.error(`[PersistentMemory] Failed to load all for context ${contextType}:${contextId}`, error);
      return new Map<string, string>();
    }
  }

  async delete(contextType: MemoryContextType, contextId: string, key: string): Promise<boolean> {
    try {
      const fullKey = compositeKey(contextType, contextId, key);
      console.log(`[PersistentMemory] Deleting key: ${fullKey}`);

      await db.setting.deleteMany({
        where: { key: fullKey },
      });
      return true;
    } catch (error) {
      console.error(`[PersistentMemory] Failed to delete key for context ${contextType}:${contextId}:${key}`, error);
      return false;
    }
  }

  async clearContext(contextType: MemoryContextType, contextId: string): Promise<number> {
    try {
      const prefix = `${KEY_PREFIX}:${contextType}:${contextId}:`;
      const result = await db.setting.deleteMany({
        where: {
          key: { startsWith: prefix },
        },
      });
      return result.count;
    } catch (error) {
      console.error(`[PersistentMemory] Failed to clear context ${contextType}:${contextId}`, error);
      return 0;
    }
  }

  async cleanupExpired(): Promise<number> {
    // TTL-based expiry is handled by the in-memory store.
    // This is a placeholder for any future DB-level cleanup logic.
    return 0;
  }
}

export const persistentMemory = new PersistentMemoryStore();
