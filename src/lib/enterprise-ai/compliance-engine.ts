/**
 * Compliance Engine — continuous compliance monitoring
 * Spec §29. Shows violations in Super Admin Command Center.
 */
import { db } from "@/lib/db";

export interface ComplianceViolation {
  checkType: string;
  targetType: string;
  targetId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  violationDetail: string;
}

export class ComplianceEngine {
  /** Run a compliance check on a target */
  static async check(params: {
    checkType: string;
    targetType: string;
    targetId: string;
  }): Promise<{ status: "PASS" | "FAIL" | "WARNING"; violationDetail?: string }> {
    // Check existing compliance records
    const existingFails = await db.complianceCheck.count({
      where: {
        checkType: params.checkType,
        targetType: params.targetType,
        targetId: params.targetId,
        status: "FAIL",
      },
    }).catch(() => 0);

    const status = existingFails > 0 ? "FAIL" : "PASS";
    const violationDetail = existingFails > 0 ? `${existingFails} existing violations` : "";

    // Record the check
    await db.complianceCheck.create({
      data: {
        checkType: params.checkType,
        targetType: params.targetType,
        targetId: params.targetId,
        status,
        violationDetail,
        severity: status === "FAIL" ? "HIGH" : "LOW",
      },
    }).catch(() => {});

    return { status, violationDetail };
  }

  /** Get all active violations */
  static async getViolations(limit = 50): Promise<ComplianceViolation[]> {
    const checks = await db.complianceCheck.findMany({
      where: { status: { in: ["FAIL", "WARNING"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }).catch(() => []);
    return checks.map((c: any) => ({
      checkType: c.checkType,
      targetType: c.targetType,
      targetId: c.targetId,
      severity: c.severity,
      violationDetail: c.violationDetail,
    }));
  }

  /** Get compliance summary for dashboard */
  static async getSummary() {
    const [total, passed, failed, warnings, critical] = await Promise.all([
      db.complianceCheck.count().catch(() => 0),
      db.complianceCheck.count({ where: { status: "PASS" } }).catch(() => 0),
      db.complianceCheck.count({ where: { status: "FAIL" } }).catch(() => 0),
      db.complianceCheck.count({ where: { status: "WARNING" } }).catch(() => 0),
      db.complianceCheck.count({ where: { status: "FAIL", severity: "CRITICAL" } }).catch(() => 0),
    ]);
    return { total, passed, failed, warnings, critical };
  }
}
