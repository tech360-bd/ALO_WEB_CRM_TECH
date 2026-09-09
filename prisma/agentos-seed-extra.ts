/**
 * ALO AgentOS Supplemental Seed — Adds 10 more departments to reach 100
 * Run after agentos-seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXTRA_DEPARTMENTS = [
  { slug: "student-admission", name: "Student Admission", category: "Student Services", description: "Lead qualification, duplicate detection, profile building, counselor assignment, and student onboarding automation", icon: "🎓", color: "#F37021" },
  { slug: "counseling", name: "Academic Counseling", category: "Student Services", description: "Student counseling workflows, course guidance, university matching, and consultancy session management", icon: "🧑‍🏫", color: "#0066CC" },
  { slug: "application-processing", name: "Application Processing", category: "Student Services", description: "University application submission, document collection, status tracking, and offer letter management", icon: "📋", color: "#6366F1" },
  { slug: "pre-departure", name: "Pre-Departure Services", category: "Student Services", description: "Pre-departure orientation, travel preparation, banking, insurance, accommodation, and arrival support", icon: "✈️", color: "#059669" },
  { slug: "alumni-engagement", name: "Alumni & Success Stories", category: "Student Services", description: "Alumni network management, success story collection, referral activation, and community building", icon: "🌟", color: "#D97706" },
  { slug: "student-support", name: "Student Support Center", category: "Student Services", description: "24/7 student support, FAQ answering, complaint handling, and welfare coordination", icon: "🆘", color: "#DC2626" },
  { slug: "event-management", name: "Events & Webinars", category: "Student Services", description: "Education fair management, webinar hosting, campus visit coordination, and event promotion", icon: "🎪", color: "#7C3AED" },
  { slug: "sms-automation", name: "SMS Automation", category: "Student Services", description: "Bulk SMS campaigns, transactional SMS, OTP delivery, and SMS marketing analytics", icon: "📱", color: "#374151" },
  { slug: "referral-tracking", name: "Referral & Loyalty", category: "Student Services", description: "Student referral program management, loyalty point tracking, reward distribution, and referral analytics", icon: "🔗", color: "#B45309" },
  { slug: "visa-processing", name: "Visa Processing", category: "Student Services", description: "Student visa application support, document preparation, appointment booking, and outcome tracking", icon: "🛂", color: "#0057B8" },
];

async function buildAgentRoles(deptName: string, deptSlug: string) {
  const clean = deptName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const engines = await prisma.agentEngineType.findMany({ select: { id: true, slug: true } });
  const engineMap = new Map(engines.map(e => [e.slug, e.id]));
  const getEngine = (slug: string) => engineMap.get(slug) ?? engineMap.get("text-fast")!;

  return [
    { role: "Manager Agent", engineSlug: "tool-calling", requiresApproval: true, permissionScope: "department", description: `Orchestrates all ${clean} workflows and monitors KPIs` },
    { role: "Planner Agent", engineSlug: "text-reasoning", requiresApproval: false, permissionScope: "department", description: `Creates execution plans for ${clean} objectives` },
    { role: "Research Agent", engineSlug: "web-search", requiresApproval: false, permissionScope: "read_only", description: `Gathers intelligence relevant to ${clean}` },
    { role: "Content Creator Agent", engineSlug: "creative-writing", requiresApproval: false, permissionScope: "department", description: `Produces content for ${clean} initiatives` },
    { role: "Data Analyst Agent", engineSlug: "sql-agent", requiresApproval: false, permissionScope: "read_only", description: `Processes ${clean} data and generates reports` },
    { role: "Automation Agent", engineSlug: "tool-calling", requiresApproval: false, permissionScope: "department", description: `Executes repetitive ${clean} workflows` },
    { role: "Quality Assurance Agent", engineSlug: "evaluation", requiresApproval: true, permissionScope: "department", description: `Validates ${clean} outputs for accuracy` },
    { role: "Communication Agent", engineSlug: "chat-agent", requiresApproval: false, permissionScope: "department", description: `Handles communications for ${clean}` },
    { role: "Document Processor Agent", engineSlug: "document-analysis", requiresApproval: false, permissionScope: "department", description: `Processes and routes ${clean} documents` },
    { role: "Classifier Agent", engineSlug: "classification", requiresApproval: false, permissionScope: "read_only", description: `Categorizes inputs in the ${clean} pipeline` },
    { role: "Monitor Agent", engineSlug: "text-fast", requiresApproval: false, permissionScope: "read_only", description: `Monitors ${clean} health metrics` },
    { role: "Optimizer Agent", engineSlug: "text-reasoning", requiresApproval: true, permissionScope: "department", description: `Identifies bottlenecks in ${clean} processes` },
    { role: "Translator Agent", engineSlug: "translation", requiresApproval: false, permissionScope: "read_only", description: `Provides translation support for ${clean}` },
    { role: "Embedding & Search Agent", engineSlug: "embedding", requiresApproval: false, permissionScope: "read_only", description: `Indexes ${clean} knowledge base content` },
    { role: "Extractor Agent", engineSlug: "data-extraction", requiresApproval: false, permissionScope: "read_only", description: `Extracts structured data from ${clean} inputs` },
    { role: "Evaluator Agent", engineSlug: "evaluation", requiresApproval: true, permissionScope: "department", description: `Scores and evaluates ${clean} outputs` },
    { role: "Escalation Agent", engineSlug: "text-fast", requiresApproval: true, permissionScope: "department", description: `Routes ${clean} issues to human staff` },
    { role: "Audit & Compliance Agent", engineSlug: "text-fast", requiresApproval: false, permissionScope: "read_only", description: `Maintains audit records for ${clean} actions` },
    { role: "Recovery Agent", engineSlug: "tool-calling", requiresApproval: false, permissionScope: "department", description: `Recovers from ${clean} workflow failures` },
    { role: "Reporting Agent", engineSlug: "text-reasoning", requiresApproval: false, permissionScope: "read_only", description: `Generates ${clean} reports for management` },
  ].map(r => ({ ...r, engineId: getEngine(r.engineSlug) }));
}

async function main() {
  console.log("🌱 ALO AgentOS Supplemental Seed (10 more departments)...");

  const currentCount = await prisma.agentDepartment.count();
  const agentStartCount = await prisma.agentDefinition.count();
  console.log(`📊 Current: ${currentCount} departments, ${agentStartCount} agents`);

  for (let dIndex = 0; dIndex < EXTRA_DEPARTMENTS.length; dIndex++) {
    const dept = EXTRA_DEPARTMENTS[dIndex];
    const sortOrder = currentCount + dIndex + 1;

    const deptRecord = await prisma.agentDepartment.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name, category: dept.category, description: dept.description, icon: dept.icon, color: dept.color, sortOrder, isActive: true, agentCount: 20 },
      create: { slug: dept.slug, name: dept.name, category: dept.category, description: dept.description, icon: dept.icon, color: dept.color, sortOrder, isActive: true, agentCount: 20 },
    });

    const roles = await buildAgentRoles(dept.name, dept.slug);

    for (let aIndex = 0; aIndex < roles.length; aIndex++) {
      const role = roles[aIndex];
      const agentNum = String(agentStartCount + dIndex * 20 + aIndex + 1).padStart(4, "0");
      const agentCode = `AGT-${agentNum}`;

      await prisma.agentDefinition.upsert({
        where: { agentCode },
        update: {
          name: `${dept.name} — ${role.role}`,
          departmentId: deptRecord.id,
          engineTypeId: role.engineId,
          description: role.description,
          systemPrompt: `You are the ${role.role} for ${dept.name} at ALO Education. ${role.description}. Follow constitutional rules, maintain audit trails, and escalate uncertain situations.`,
          capabilities: JSON.stringify([]),
          toolsAllowed: JSON.stringify([]),
          permissionScope: role.permissionScope,
          requiresApproval: role.requiresApproval,
          approvalThreshold: role.requiresApproval ? "always" : "high_risk",
          status: "active",
          version: "1.0.0",
          tags: JSON.stringify([dept.slug, role.role.toLowerCase().replace(/ /g, "-")]),
          metadata: JSON.stringify({ department: dept.slug, category: dept.category }),
          isSystem: true,
        },
        create: {
          agentCode,
          name: `${dept.name} — ${role.role}`,
          departmentId: deptRecord.id,
          engineTypeId: role.engineId,
          description: role.description,
          systemPrompt: `You are the ${role.role} for ${dept.name} at ALO Education. ${role.description}. Follow constitutional rules, maintain audit trails, and escalate uncertain situations.`,
          capabilities: JSON.stringify([]),
          toolsAllowed: JSON.stringify([]),
          permissionScope: role.permissionScope,
          requiresApproval: role.requiresApproval,
          approvalThreshold: role.requiresApproval ? "always" : "high_risk",
          status: "active",
          version: "1.0.0",
          tags: JSON.stringify([dept.slug, role.role.toLowerCase().replace(/ /g, "-")]),
          metadata: JSON.stringify({ department: dept.slug, category: dept.category }),
          isSystem: true,
        },
      });
    }
    console.log(`   ✅ Seeded: ${dept.name}`);
  }

  const finalDepts = await prisma.agentDepartment.count();
  const finalAgents = await prisma.agentDefinition.count();
  console.log(`\n✅ Done! Total: ${finalDepts} departments, ${finalAgents} agents`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
