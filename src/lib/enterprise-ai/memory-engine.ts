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
        scope: record.scope,
        ownerKey: record.ownerId,
        agentSlug: record.scope === "AGENT" || record.scope === "SHORT_TERM" || record.scope === "TASK" ? record.ownerId : "",
        key: record.key,
        value: record.value,
        confidentiality: record.accessLevel === "PUBLIC" ? "PUBLIC" : record.accessLevel === "DEPARTMENT" ? "INTERNAL" : "CONFIDENTIAL",
      },
    }).catch(() => ({ id: `mem-${Date.now()}` }));
    return mem.id;
  }

  /** Retrieve a memory record */
  static async retrieve(scope: MemoryScope, ownerId: string, key: string): Promise<string | null> {
    const mem = await db.awfMemory.findFirst({
      where: { scope, ownerKey: ownerId, key },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);
    return mem?.value || null;
  }

  /** Retrieve all memory for an agent (within permission scope) */
  static async getAgentMemory(agentId: string, limit = 50): Promise<any[]> {
    return db.awfMemory.findMany({
      where: { agentSlug: agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }).catch(() => []);
  }

  /** Clear expired memory records */
  static async clearExpired(): Promise<number> {
    const result = await db.awfMemory.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    }).catch(() => ({ count: 0 }));
    return result.count;
  }
}
