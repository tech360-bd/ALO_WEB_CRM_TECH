import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — Enterprise AI Command Center dashboard
export async function GET(req: NextRequest) {
  const [departments, employees, skills, prompts, rules, sops, engines] = await Promise.all([
    db.enterpriseDepartment.findMany({ orderBy: { deptCode: "asc" } }),
    db.aiEmployee.count(),
    db.aiSkill.count(),
    db.promptTemplate.count(),
    db.constitutionalRule.count(),
    db.aiSop.count(),
    db.aiEngine.findMany({ orderBy: { type: "asc" } }),
  ]);

  const dccCertified = departments.filter((d) => d.dccCertified);
  const canCreateAgents = departments.filter((d) => d.canCreateAgents);

  // Department DCC summary
  const dccSummary = departments.map((d) => ({
    id: d.id,
    deptCode: d.deptCode,
    name: d.name,
    description: d.description,
    sopCoverage: d.sopCoverage,
    knowledgeCoverage: d.knowledgeCoverage,
    skillCoverage: d.skillCoverage,
    testPassRate: d.testPassRate,
    kpiAchievement: d.kpiAchievement,
    securityCompliance: d.securityCompliance,
    auditCompliance: d.auditCompliance,
    selfRecoverySuccess: d.selfRecoverySuccess,
    humanEscalationRate: d.humanEscalationRate,
    dccCertified: d.dccCertified,
    dccCertifiedAt: d.dccCertifiedAt,
    canCreateAgents: d.canCreateAgents,
    aiEmployeeCount: d.aiEmployeeCount,
    skillCount: d.skillCount,
    promptCount: d.promptCount,
  }));

  return NextResponse.json({
    summary: {
      totalDepartments: departments.length,
      dccCertified: dccCertified.length,
      canCreateAgents: canCreateAgents.length,
      totalEmployees: employees,
      totalSkills: skills,
      totalPrompts: prompts,
      totalRules: rules,
      totalSops: sops,
      totalEngines: engines.length,
      activeEngines: engines.filter((e) => e.status === "ACTIVE").length,
      healthyEngines: engines.filter((e) => e.healthStatus === "HEALTHY").length,
    },
    departments: dccSummary,
    engines: engines.map((e) => ({
      ...e,
      metrics: e.metrics ? JSON.parse(e.metrics) : null,
    })),
    dccCriteria: {
      sopCoverage: "≥ 95%",
      knowledgeCoverage: "≥ 95%",
      skillCoverage: "≥ 95%",
      testPassRate: "≥ 95%",
      kpiAchievement: "≥ 90%",
      securityCompliance: "= 100%",
      auditCompliance: "= 100%",
      selfRecoverySuccess: "≥ 90%",
      humanEscalationRate: "≤ 10%",
    },
  });
}
