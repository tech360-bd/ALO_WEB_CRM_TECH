/**
 * Reflection Engine — post-task evaluation + improvement recommendations
 * Spec §22. After important tasks: evaluate output, identify mistakes,
 * check SOP/rule compliance, generate improvement recommendations.
 */
import { db } from "@/lib/db";

export interface ReflectionResult {
  outputQuality: number; // 0-1
  sopCompliance: number; // 0-1
  ruleCompliance: number; // 0-1
  kpiAchieved: number; // 0-1
  mistakesIdentified: string[];
  improvements: string[];
  escalatedToHuman: boolean;
}

export class ReflectionEngine {
  /** Run reflection on a completed task */
  static async reflect(params: {
    agentId: string;
    taskId: string;
    planId?: string;
    output: string;
    expectedKpi?: number;
  }): Promise<ReflectionResult> {
    // Evaluate output quality (placeholder — would use AI evaluation in production)
    const outputQuality = Math.min(1, params.output.length / 500);
    const sopCompliance = 0.9; // would check against SOP steps
    const ruleCompliance = 0.95; // would check against constitutional rules
    const kpiAchieved = params.expectedKpi || 0.85;

    const mistakesIdentified: string[] = [];
    const improvements: string[] = [];

    if (outputQuality < 0.7) {
      mistakesIdentified.push("Output quality below threshold — insufficient detail");
      improvements.push("Increase output detail and structure");
    }
    if (sopCompliance < 0.95) {
      mistakesIdentified.push("SOP compliance below 95% threshold");
      improvements.push("Review SOP adherence and retrain on missed steps");
    }
    if (kpiAchieved < 0.9) {
      mistakesIdentified.push(`KPI achievement ${Math.round(kpiAchieved * 100)}% below 90% target`);
      improvements.push("Adjust agent parameters or reassign task type");
    }

    const escalatedToHuman = mistakesIdentified.length >= 2;

    // Persist reflection record
    await db.reflection.create({
      data: {
        agentId: params.agentId,
        taskId: params.taskId,
        planId: params.planId || "",
        outputQuality,
        sopCompliance,
        ruleCompliance,
        kpiAchieved,
        mistakesIdentified: JSON.stringify(mistakesIdentified),
        improvements: JSON.stringify(improvements),
        escalatedToHuman,
      },
    }).catch(() => {});

    return { outputQuality, sopCompliance, ruleCompliance, kpiAchieved, mistakesIdentified, improvements, escalatedToHuman };
  }

  /** Get recent reflections for an agent */
  static async getAgentReflections(agentId: string, limit = 20): Promise<any[]> {
    return db.reflection.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }).catch(() => []);
  }
}
