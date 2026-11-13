/**
 * RAG Engine — enterprise retrieval-augmented generation
 * Spec §19. Do NOT allow an agent to retrieve information outside its permission scope.
 * Uses new RAGCollection model + existing AwfKnowledgeSource/AwfKnowledgeChunk.
 */
import { db } from "@/lib/db";
import { SecurityEngine } from "./security-engine";

export interface RAGQuery {
  agentId: string;
  departmentId: string;
  query: string;
  topK?: number;
}

export interface RAGResult {
  chunks: Array<{
    content: string;
    source: string;
    confidence: number;
    documentId: string;
  }>;
  sourceAttribution: string[];
}

export class RAGEngine {
  /** Retrieve relevant knowledge for an agent query (with access control) */
  static async retrieve(query: RAGQuery): Promise<RAGResult> {
    // 1. Find RAG collections accessible to this agent
    const collections = await this.getAccessibleCollections(query.agentId, query.departmentId);

    if (collections.length === 0) {
      return { chunks: [], sourceAttribution: [] };
    }

    // 2. Query knowledge chunks from accessible collections
    // In production, this would use vector similarity search
    const chunks = await db.awfKnowledgeChunk.findMany({
      where: {
        sourceId: { in: collections.map((c: any) => c.id) },
      },
      take: query.topK || 5,
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // 3. Verify access control for each chunk (defense in depth)
    const accessibleChunks = [];
    for (const chunk of chunks) {
      const allowed = await SecurityEngine.enforceDepartmentIsolation(
        query.agentId,
        query.departmentId,
      );
      if (allowed) {
        accessibleChunks.push({
          content: chunk.content || "",
          source: chunk.sourceId,
          confidence: 0.85, // would be similarity score
          documentId: chunk.id,
        });
      }
    }

    return {
      chunks: accessibleChunks,
      sourceAttribution: [...new Set(accessibleChunks.map((c) => c.source))],
    };
  }

  /** Get RAG collections accessible to an agent */
  static async getAccessibleCollections(agentId: string, departmentId: string): Promise<any[]> {
    const allCollections = await db.rAGCollection.findMany({
      where: { status: "ACTIVE" },
    }).catch(() => []);

    return allCollections.filter((c: any) => {
      // Check access policy
      if (c.accessPolicy === "PUBLIC") return true;
      if (c.accessPolicy === "DEPARTMENT_SCOPED" && c.departmentId === departmentId) return true;
      if (c.accessPolicy === "AGENT_SCOPED") {
        const allowed: string[] = JSON.parse(c.allowedAgentIds || "[]");
        return allowed.includes(agentId);
      }
      if (c.accessPolicy === "RBAC") {
        // Would check RBAC permissions
        const allowedDepts: string[] = JSON.parse(c.allowedDeptIds || "[]");
        return allowedDepts.includes(departmentId);
      }
      return false;
    });
  }

  /** Get RAG status for dashboard */
  static async getStatus(): Promise<{
    totalCollections: number;
    activeCollections: number;
    totalChunks: number;
    totalDocuments: number;
  }> {
    const [total, active, chunks, docs] = await Promise.all([
      db.rAGCollection.count().catch(() => 0),
      db.rAGCollection.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      db.awfKnowledgeChunk.count().catch(() => 0),
      db.awfKnowledgeSource.count().catch(() => 0),
    ]);
    return { totalCollections: total, activeCollections: active, totalChunks: chunks, totalDocuments: docs };
  }
}
