/**
 * ALO Education — Memory System
 * Task ID: 7-ai-gateway
 *
 * Simple in-memory key-value store with optional TTL.
 * Supports: conversation, student, lead, agent, task contexts.
 *
 * Data minimization: this module never sends data to external models.
 * It only stores and retrieves data that the orchestrator explicitly
 * chooses to include in prompts.
 */

import type { MemoryContextType, MemoryEntry } from './types';

// ============================================================
// IN-MEMORY STORE
// ============================================================

/**
 * Composite key format: `{contextType}:{contextId}:{key}`
 * This allows easy lookup and cleanup by context type.
 */
function compositeKey(contextType: MemoryContextType, contextId: string, key: string): string {
  return `${contextType}:${contextId}:${key}`;
}

/**
 * Expiry defaults per context type (ms).
 * Agent memory: 1 hour, task memory: 30 min, student/lead: 1 hour,
 * conversation: 10 min.
 */
const DEFAULT_TTL_MS: Record<MemoryContextType, number> = {
  agent: 3_600_000,
  task: 1_800_000,
  student: 3_600_000,
  lead: 3_600_000,
  conversation: 600_000,
};

// ============================================================
// MEMORY STORE CLASS
// ============================================================

class MemoryStore {
  private store: Map<string, MemoryEntry>;
  /** Periodic cleanup interval handle */
  private cleanupTimer: ReturnType<typeof setInterval> | null;

  constructor() {
    this.store = new Map();
    // Run cleanup every 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 300_000);
    // Don't prevent process exit
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  // ----------------------------------------------------------
  // Generic access
  // ----------------------------------------------------------

  /**
   * Store a value.
   * @param ttlMs - time-to-live in ms. Pass 0 or undefined for the context-type default.
   */
  setMemory(
    contextType: MemoryContextType,
    contextId: string,
    key: string,
    value: string,
    ttlMs?: number
  ): void {
    const now = Date.now();
    const ttl = ttlMs ?? DEFAULT_TTL_MS[contextType];
    const entry: MemoryEntry = {
      key,
      value,
      contextType,
      contextId,
      createdAt: now,
      expiresAt: ttl > 0 ? now + ttl : null,
    };
    this.store.set(compositeKey(contextType, contextId, key), entry);
  }

  /**
   * Retrieve a value. Returns `null` if expired or not found.
   */
  getMemoryValue(
    contextType: MemoryContextType,
    contextId: string,
    key: string
  ): string | null {
    const entry = this.store.get(compositeKey(contextType, contextId, key));
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(compositeKey(contextType, contextId, key));
      return null;
    }
    return entry.value;
  }

  /**
   * Get all entries for a given context as a Map<key, value>.
   * Expired entries are pruned automatically.
   */
  getMemory(contextType: MemoryContextType, contextId: string): Map<string, string> {
    const prefix = `${contextType}:${contextId}:`;
    const result = new Map<string, string>();

    for (const [storeKey, entry] of this.store) {
      if (!storeKey.startsWith(prefix)) continue;
      if (this.isExpired(entry)) {
        this.store.delete(storeKey);
        continue;
      }
      result.set(entry.key, entry.value);
    }

    return result;
  }

  /**
   * Delete a specific key.
   */
  deleteMemory(contextType: MemoryContextType, contextId: string, key: string): boolean {
    return this.store.delete(compositeKey(contextType, contextId, key));
  }

  /**
   * Clear all entries for a given context (e.g. after a conversation ends).
   */
  clearContext(contextType: MemoryContextType, contextId: string): number {
    const prefix = `${contextType}:${contextId}:`;
    let count = 0;
    for (const storeKey of this.store.keys()) {
      if (storeKey.startsWith(prefix)) {
        this.store.delete(storeKey);
        count += 1;
      }
    }
    return count;
  }

  // ----------------------------------------------------------
  // Convenience methods per context type
  // ----------------------------------------------------------

  /** Get agent-specific memory */
  getAgentMemory(agentId: string): Map<string, string> {
    return this.getMemory('agent', agentId);
  }

  /** Set agent-specific memory */
  setAgentMemory(agentId: string, key: string, value: string, ttlMs?: number): void {
    this.setMemory('agent', agentId, key, value, ttlMs);
  }

  /** Get student-specific memory */
  getStudentMemory(studentId: string): Map<string, string> {
    return this.getMemory('student', studentId);
  }

  /** Set student-specific memory */
  setStudentMemory(studentId: string, key: string, value: string, ttlMs?: number): void {
    this.setMemory('student', studentId, key, value, ttlMs);
  }

  /** Get lead-specific memory */
  getLeadMemory(leadId: string): Map<string, string> {
    return this.getMemory('lead', leadId);
  }

  /** Set lead-specific memory */
  setLeadMemory(leadId: string, key: string, value: string, ttlMs?: number): void {
    this.setMemory('lead', leadId, key, value, ttlMs);
  }

  /** Get task-specific memory */
  getTaskMemory(taskId: string): Map<string, string> {
    return this.getMemory('task', taskId);
  }

  /** Set task-specific memory */
  setTaskMemory(taskId: string, key: string, value: string, ttlMs?: number): void {
    this.setMemory('task', taskId, key, value, ttlMs);
  }

  // ----------------------------------------------------------
  // Maintenance
  // ----------------------------------------------------------

  /** Remove all expired entries */
  cleanup(): number {
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
        removed += 1;
      }
    }
    if (removed > 0) {
      console.log(`[Memory] Cleaned up ${removed} expired entries. Store size: ${this.store.size}`);
    }
    return removed;
  }

  /** Total entries in memory */
  get size(): number {
    return this.store.size;
  }

  /** Clear everything */
  clear(): void {
    this.store.clear();
  }

  /** Destroy the store and stop cleanup timer */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  // ----------------------------------------------------------
  // Internal
  // ----------------------------------------------------------

  private isExpired(entry: MemoryEntry): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }
}

/** Singleton memory store instance */
export const memoryStore = new MemoryStore();
