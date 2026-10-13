import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST — Run DCC certification check for a department
export async function POST(req: NextRequest) {
  const { departmentId } = await req.json();

  const dept = await db.enterpriseDepartment.findUnique({ where: { id: departmentId } });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  // Check DCC criteria
  const checks = [
    { name: "SOP Coverage", value: dept.sopCoverage, threshold: 95, passed: dept.sopCoverage >= 95 },
    { name: "Knowledge Coverage", value: dept.knowledgeCoverage, threshold: 95, passed: dept.knowledgeCoverage >= 95 },
    { name: "Skill Coverage", value: dept.skillCoverage, threshold: 95, passed: dept.skillCoverage >= 95 },
    { name: "Test Pass Rate", value: dept.testPassRate, threshold: 95, passed: dept.testPassRate >= 95 },
    { name: "KPI Achievement", value: dept.kpiAchievement, threshold: 90, passed: dept.kpiAchievement >= 90 },
    { name: "Security Compliance", value: dept.securityCompliance, threshold: 100, passed: dept.securityCompliance === 100 },
    { name: "Audit Compliance", value: dept.auditCompliance, threshold: 100, passed: dept.auditCompliance === 100 },
    { name: "Self-Recovery Success", value: dept.selfRecoverySuccess, threshold: 90, passed: dept.selfRecoverySuccess >= 90 },
    { name: "Human Escalation Rate", value: dept.humanEscalationRate, threshold: 10, passed: dept.humanEscalationRate <= 10 },
  ];

  const allPassed = checks.every((c) => c.passed);

  const updated = await db.enterpriseDepartment.update({
    where: { id: departmentId },
    data: {
      dccCertified: allPassed,
      dccCertifiedAt: allPassed ? new Date() : null,
      canCreateAgents: allPassed,
    },
  });

  await db.auditLog.create({
    data: { action: "AI_ACTION", resource: "EnterpriseDepartment", resourceId: departmentId, details: JSON.stringify({ dccCheck: allPassed, checks }) },
  });

  return NextResponse.json({
    department: updated,
    checks,
    allPassed,
    message: allPassed
      ? `Department "${dept.name}" is now DCC Certified! It can create, train, manage, and improve AI agents.`
      : `Department "${dept.name}" did not pass DCC certification. ${checks.filter((c) => !c.passed).length} criteria not met.`,
  });
}
