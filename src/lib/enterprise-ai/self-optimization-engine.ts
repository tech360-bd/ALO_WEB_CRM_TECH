/**
 * Self-Optimization Engine — monitor metrics → suggest improvements
 * Spec §24. Production changes require policy/approval.
 */
import { db } from "@/lib/db";

export interface OptimizationSuggestion {
  agentId: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  suggestion: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export class SelfOptimizationEngine {
  /** Analyze agent performance and generate optimization suggestions */
  static async analyze(agentId?: string): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Query agent metrics from audit events
    const agents = agentId
      ? [{ agentId }]
      : await this.getActiveAgents();

    for (const { agentId: aid } of agents.slice(0, 100)) {
      // Check latency (from audit events)
      const recentEvents = await db.auditEvent.findMany({
        where: { agentId: aid, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { result: true, createdAt: true },
        take: 50,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);

      if (recentEvents.length > 0) {
        const failureRate = recentEvents.filter((e: any) => e.result === "FAILURE").length / recentEvents.length;
        if (failureRate > 0.1) {
          suggestions.push({
            agentId: aid,
            metric: "failure_rate",
            currentValue: failureRate,
            targetValue: 0.05,
            suggestion: `Failure rate ${Math.round(failureRate * 100)}% exceeds 5% target — review prompt template and skill coverage`,
            priority: failureRate > 0.3 ? "HIGH" : "MEDIUM",
          });
        }

        // Check escalation rate
        const escalationRate = recentEvents.filter((e: any) => e.result === "ESCALATED").length / recentEvents.length;
        if (escalationRate > 0.1) {
          suggestions.push({
            agentId: aid,
            metric: "escalation_rate",
            currentValue: escalationRate,
            targetValue: 0.1,
            suggestion: `Human escalation rate ${Math.round(escalationRate * 100)}% exceeds 10% threshold — improve agent autonomy or retrain`,
            priority: escalationRate > 0.2 ? "HIGH" : "MEDIUM",
          });
        }
      }
    }

    return suggestions;
  }

  /** Get active agents list */
  private static async getActiveAgents(): Promise<{ agentId: string }[]> {
    // Use existing AiAgent model — field is 'id' (cuid), 'agentName', 'department'
    const agents = await db.aiAgent.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      take: 200,
    }).catch(() => []);
    return agents.map((a: any) => ({ agentId: a.id }));
  }

  /** Get optimization events count */
  static async getOptimizationEventCount(): Promise<number> {
    return db.auditEvent.count({
      where: { action: { startsWith: "SELF_OPTIMIZATION_" } },
    }).catch(() => 0);
  }
}
