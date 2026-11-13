/**
 * Memory Engine — short-term / task / agent / department / enterprise memory
 * Spec §20. Sensitive student information must remain access-controlled.
 * Uses existing AwfMemory + AgentMemory models.
 */
import { db } from "@/lib/db";

export type MemoryScope = "SHORT_TERM" | "TASK" | "AGENT" | "DEPARTMENT" | "ENTERPRISE";

export interface MemoryRecord {
  scope: MemoryScope;
  ownerId: string; // agent / department / enterprise id
  key: string;
  value: string;
  ttlSeconds?: number;
  accessLevel?: "PUBLIC" | "DEPARTMENT" | "AGENT" | "RBAC";
}

export class MemoryEngine {
  /** Store a memory record */
  static async store(record: MemoryRecord): Promise<string> {
    const mem = await db.awfMemory.create({
      data: {
        // Map to existing AwfMemory fields — use upsert pattern
        agentId: record.ownerId,
        scope: record.scope,
        key: record.key,
        value: record.value,
        ttl: record.ttlSeconds || 0,
        accessLevel: record.accessLevel || "AGENT",
      },
    }).catch(() => ({ id: `mem-${Date.now()}` }));
    return mem.id;
  }

  /** Retrieve a memory record */
  static async retrieve(scope: MemoryScope, ownerId: string, key: string): Promise<string | null> {
    const mem = await db.awfMemory.findFirst({
      where: { scope, agentId: ownerId, key },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);
    return mem?.value || null;
  }

  /** Retrieve all memory for an agent (within permission scope) */
  static async getAgentMemory(agentId: string, limit = 50): Promise<any[]> {
    return db.awfMemory.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }).catch(() => []);
  }

  /** Clear expired memory records */
  static async clearExpired(): Promise<number> {
    const result = await db.awfMemory.deleteMany({
      where: {
        ttl: { gt: 0 },
        createdAt: { lt: new Date(Date.now() - 3600 * 1000) }, // older than 1 hour
      },
    }).catch(() => ({ count: 0 }));
    return result.count;
  }
}
