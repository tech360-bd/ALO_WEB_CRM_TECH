// ALO Education — Enterprise AI Command Center seed
// 100 Departments, 2000 AI Employees, 10000 Skills, 50000 Prompt Templates
// 500+ Constitutional Rules, 500+ SOPs, 20 Enterprise Engines, DCC Certification
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

function rid(n: number) { return Math.random().toString(36).slice(2, 2 + n).toUpperCase(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const DEPARTMENT_NAMES = [
  "Student Admission", "Counseling", "Application Processing", "Visa Processing", "Visa Interview",
  "Document Verification", "SOP & CV Writing", "Course Matching", "University Relations",
  "Scholarship Management", "English Test Preparation", "IELTS Coaching", "PTE Coaching",
  "TOEFL Coaching", "Duolingo Test Prep", "Mock Test Administration", "Speaking Practice",
  "Writing Evaluation", "Reading Comprehension", "Listening Practice",
  "Marketing Strategy", "Social Media Management", "Content Creation", "Graphic Design",
  "Video Production", "SEO Optimization", "Email Marketing", "WhatsApp Campaigns",
  "Facebook Advertising", "Instagram Marketing", "LinkedIn Outreach", "YouTube Content",
  "TikTok Strategy", "Influencer Coordination", "Event Management", "Webinar Hosting",
  "Lead Generation", "Lead Scoring", "Lead Distribution", "Counselor Assignment",
  "Partner Management", "B2B Relations", "Commission Tracking", "Finance & Accounting",
  "Payroll Management", "Invoice Processing", "Tax Compliance", "Budget Planning",
  "HR Management", "Recruitment", "Employee Onboarding", "Training & Development",
  "Performance Evaluation", "Attendance Management", "Leave Management", "Device Management",
  "IT Support", "System Administration", "Database Management", "Security Operations",
  "Network Administration", "Cloud Infrastructure", "API Development", "Frontend Development",
  "Backend Development", "Mobile App Development", "QA Testing", "DevOps",
  "Data Analytics", "Business Intelligence", "Reporting", "Dashboard Development",
  "Compliance Management", "Legal Advisory", "Privacy Officer", "Data Protection",
  "Audit & Risk", "Quality Assurance", "Process Optimization", "Customer Support",
  "Front Desk Operations", "Reception Management", "Visitor Management", "Phone Support",
  "WhatsApp Support", "Email Support", "Chat Support", "Ticket Management",
  "Pre-departure Briefing", "Airport Pickup Coordination", "Accommodation Assistance",
  "Banking & Forex Guidance", "Travel Booking", "Insurance Coordination",
  "Alumni Relations", "Career Counseling", "Internship Placement", "Job Placement Support",
  "Research & Development", "Innovation Lab", "Strategic Planning", "Executive Operations",
  "Country-Specific UK Desk", "Country-Specific USA Desk", "Country-Specific Canada Desk",
  "Country-Specific Australia Desk", "Country-Specific Ireland Desk", "Country-Specific Germany Desk",
  "Country-Specific New Zealand Desk", "Country-Specific Dubai Desk", "Country-Specific Malaysia Desk",
  "Country-Specific Japan Desk", "Country-Specific South Korea Desk", "Country-Specific Europe Desk",
];

const ENGINE_DEFINITIONS = [
  { name: "Enterprise Knowledge Graph", type: "KNOWLEDGE_GRAPH", description: "Unified knowledge representation connecting students, universities, courses, visas, documents, and communications" },
  { name: "Enterprise RAG Engine", type: "RAG", description: "Retrieval-Augmented Generation for factual, verified responses using company knowledge base" },
  { name: "Multi-Agent Collaboration Engine", type: "MULTI_AGENT_COLLABORATION", description: "Coordinates 2000+ AI agents across 100 departments for complex workflows" },
  { name: "Memory Engine", type: "MEMORY", description: "Persistent memory by Student ID, Lead ID, Application ID — remembers all interactions" },
  { name: "Planning Engine", type: "PLANNING", description: "Strategic task decomposition and multi-step plan generation for complex operations" },
  { name: "Reflection Engine", type: "REFLECTION", description: "Self-evaluation of AI outputs — identifies errors and improves future responses" },
  { name: "Self-Healing Engine", type: "SELF_HEALING", description: "Automatic error detection, diagnosis, and recovery without human intervention" },
  { name: "Self-Optimization Engine", type: "SELF_OPTIMIZATION", description: "Continuous performance tuning — optimizes prompts, models, and workflows" },
  { name: "Evaluation Engine", type: "EVALUATION", description: "Multi-dimensional AI quality scoring — accuracy, relevance, safety, compliance" },
  { name: "Governance Engine", type: "GOVERNANCE", description: "Enforces 500+ constitutional rules across all AI agents and departments" },
  { name: "Security Engine", type: "SECURITY", description: "Threat detection, access control, data protection, and anomaly response" },
  { name: "Audit Engine", type: "AUDIT", description: "Immutable audit trail for every AI action, decision, and data access" },
  { name: "Compliance Engine", type: "COMPLIANCE", description: "GDPR, education law, and immigration regulation compliance enforcement" },
  { name: "Observability & Monitoring", type: "OBSERVABILITY", description: "Real-time dashboards, tracing, metrics, and alerting for all AI operations" },
  { name: "Workflow Orchestration", type: "WORKFLOW_ORCHESTRATION", description: "End-to-end process automation across departments and agents" },
  { name: "Event Bus", type: "EVENT_BUS", description: "Asynchronous event-driven communication between all system components" },
  { name: "API Gateway", type: "API_GATEWAY", description: "Unified entry point for all external and internal API requests" },
  { name: "MCP Integration Layer", type: "MCP_INTEGRATION", description: "Model Context Protocol integration for tool use and external system connectivity" },
  { name: "Enterprise Data Lake", type: "DATA_LAKE", description: "Centralized data repository for analytics, ML training, and reporting" },
  { name: "Enterprise Identity & RBAC", type: "IDENTITY_RBAC", description: "Role-based access control with 57 permissions across 8 modules" },
];

const RULE_CATEGORIES = ["SAFETY", "PRIVACY", "FAIRNESS", "TRANSPARENCY", "ACCOUNTABILITY", "COMPLIANCE"];
const RULE_TITLES = [
  "Never guarantee visa or admission approval",
  "Never share private student data without OTP verification",
  "Never invent university requirements or visa rules",
  "Never publish content without human approval",
  "Never copy competitor content or official exam questions",
  "Always mark uncertain data as 'Needs verification'",
  "Always send risky cases to human review",
  "Always save every action to CRM timeline",
  "Always respect user consent and opt-out requests",
  "Always use prepared statements for database queries",
  "Never expose B2B provider details to students or partners",
  "Never expose commission data publicly",
  "Always encrypt sensitive data at rest and in transit",
  "Always log sensitive data access (salary, documents, B2B)",
  "Never bypass RBAC or role-based access control",
  "Always validate input on backend, not just frontend",
  "Never use hardcoded database credentials",
  "Always implement CSRF protection on all forms",
  "Never store plaintext passwords",
  "Always implement soft delete, never permanent delete",
];

const SKILL_CATEGORIES = ["TECHNICAL", "COMMUNICATION", "ANALYTICAL", "DOMAIN", "SECURITY", "COMPLIANCE"];
const SKILL_NAMES = [
  "Natural Language Processing", "Document Analysis", "Data Extraction", "Sentiment Analysis",
  "Language Detection", "Translation", "Summarization", "Question Answering",
  "Intent Classification", "Entity Recognition", "Speech Recognition", "Text-to-Speech",
  "Image Recognition", "OCR Processing", "Document Classification", "Fraud Detection",
  "Risk Assessment", "Eligibility Scoring", "Course Matching", "University Recommendation",
  "Visa Readiness Scoring", "Interview Simulation", "SOP Generation", "CV Optimization",
  "Plagiarism Detection", "Originality Scoring", "Grammar Correction", "Tone Analysis",
  "WhatsApp Automation", "Email Automation", "SMS Automation", "Social Media Scheduling",
  "Content Generation", "Hashtag Optimization", "SEO Analysis", "Campaign ROI Analysis",
  "Lead Scoring", "Conversion Prediction", "Churn Prediction", "Demand Forecasting",
  "Commission Calculation", "Payroll Processing", "Invoice Generation", "Budget Analysis",
  "Attendance Tracking", "Performance Evaluation", "Leave Management", "Device Tracking",
  "Security Monitoring", "Threat Detection", "Access Control", "Data Encryption",
  "Audit Logging", "Compliance Checking", "Privacy Protection", "Backup Management",
  "System Monitoring", "Error Diagnosis", "Auto-Recovery", "Performance Optimization",
  "API Integration", "Webhook Management", "Database Query Optimization", "Cache Management",
  "Report Generation", "Dashboard Creation", "Data Visualization", "Trend Analysis",
  "Workflow Automation", "Task Scheduling", "Notification Routing", "Escalation Management",
  "Student Onboarding", "Profile Completion", "Document Collection", "Application Tracking",
  "Offer Management", "CAS Processing", "Visa Document Checklist", "Pre-departure Briefing",
  "Accommodation Search", "Travel Booking", "Banking Guidance", "Insurance Coordination",
  "Alumni Tracking", "Career Counseling", "Job Market Analysis", "Internship Matching",
  "University Data Sync", "Course Data Management", "Scholarship Tracking", "Deadline Management",
  "Quality Assurance", "Process Improvement", "Training Material Creation", "Knowledge Base Updates",
];

const PROMPT_CATEGORIES = ["SYSTEM", "USER", "FEW_SHOT", "CHAIN_OF_THOUGHT", "RAG", "FUNCTION_CALLING"];
const PROMPT_NAMES = [
  "Student greeting and intent detection", "Course recommendation based on profile",
  "University eligibility check", "Visa readiness assessment", "SOP draft generation",
  "CV optimization suggestions", "Interview question generation", "Document checklist creation",
  "Scholarship matching", "Timeline event summarization", "WhatsApp auto-reply (office hours)",
  "WhatsApp auto-reply (after hours)", "Email draft for university", "Email draft for student",
  "SMS reminder for deadline", "Social media caption generation", "Hashtag suggestion",
  "Image prompt for marketing", "Video script generation", "Reel caption creation",
  "Lead scoring prompt", "Conversion prediction prompt", "Risk assessment prompt",
  "Fraud detection prompt", "Compliance check prompt", "Audit summary generation",
  "Performance report generation", "Weekly summary prompt", "Monthly analytics prompt",
  "Counselor recommendation prompt", "Application status update", "Offer letter analysis",
  "CAS/I-20/COE guidance", "Visa document verification", "Financial document check",
  "English test scoring", "Speaking evaluation", "Writing evaluation", "Reading comprehension check",
  "Listening test scoring", "Mock test result analysis", "Weak area identification",
  "Study plan generation", "Progress tracking prompt", "Feedback generation",
  "Partner communication draft", "B2B status update", "Commission calculation prompt",
  "Payroll summary prompt", "Leave approval recommendation", "Device assignment prompt",
  "Security alert generation", "Threat assessment prompt", "Data privacy check",
  "RBAC permission verification", "Audit log generation", "Compliance report prompt",
  "Knowledge base query", "RAG retrieval prompt", "Memory context assembly",
  "Planning decomposition prompt", "Reflection self-evaluation", "Self-healing diagnosis",
  "Optimization suggestion prompt", "Evaluation scoring prompt", "Governance rule check",
  "Workflow orchestration prompt", "Event routing prompt", "API request formatting",
  "MCP tool selection prompt", "Data lake query prompt", "Identity verification prompt",
];

async function main() {
  console.log("Seeding Enterprise AI Command Center...");
  console.log("Target: 100 Departments, 2000 AI Employees, 10000 Skills, 50000 Prompts");

  // Clean
  await db.aiEngine.deleteMany();
  await db.aiSop.deleteMany();
  await db.constitutionalRule.deleteMany();
  await db.promptTemplate.deleteMany();
  await db.aiSkill.deleteMany();
  await db.aiEmployee.deleteMany();
  await db.enterpriseDepartment.deleteMany();

  // ─── 100 Departments ───
  const deptMap: Record<string, any> = {};
  for (let i = 0; i < 100; i++) {
    const deptName = DEPARTMENT_NAMES[i] || `Department ${i + 1}`;
    // DCC Certification: ~60% certified
    const sopCov = 90 + Math.random() * 10;
    const knowCov = 90 + Math.random() * 10;
    const skillCov = 90 + Math.random() * 10;
    const testPass = 88 + Math.random() * 12;
    const kpiAch = 85 + Math.random() * 15;
    const secComp = 100;
    const auditComp = 100;
    const selfRec = 85 + Math.random() * 15;
    const humanEsc = 5 + Math.random() * 15;
    const certified = sopCov >= 95 && knowCov >= 95 && skillCov >= 95 && testPass >= 95 && kpiAch >= 90 && secComp === 100 && auditComp === 100 && selfRec >= 90 && humanEsc <= 10;

    const dept = await db.enterpriseDepartment.create({
      data: {
        deptCode: `DEPT-${String(i + 1).padStart(3, "0")}`,
        name: deptName,
        description: `${deptName} department — manages ${deptName.toLowerCase()} operations with AI automation`,
        aiEmployeeCount: 20,
        skillCount: 100,
        promptCount: 500,
        sopCount: 5,
        constitutionalRulesCount: 5,
        sopCoverage: sopCov,
        knowledgeCoverage: knowCov,
        skillCoverage: skillCov,
        testPassRate: testPass,
        kpiAchievement: kpiAch,
        securityCompliance: secComp,
        auditCompliance: auditComp,
        selfRecoverySuccess: selfRec,
        humanEscalationRate: humanEsc,
        dccCertified: certified,
        dccCertifiedAt: certified ? new Date() : null,
        canCreateAgents: certified,
        status: "ACTIVE",
      },
    });
    deptMap[dept.deptCode] = dept;
  }
  console.log(`✅ Seeded 100 departments (${Object.values(deptMap).filter((d: any) => d.dccCertified).length} DCC certified)`);

  // ─── 2000 AI Employees (20 per department) ───
  const roles = ["SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "SPECIALIST", "COORDINATOR", "COORDINATOR", "SUPERVISOR", "MANAGER"];
  let empCounter = 0;
  for (const dept of Object.values(deptMap)) {
    for (let j = 0; j < 20; j++) {
      empCounter++;
      await db.aiEmployee.create({
        data: {
          employeeCode: `AI-EMP-${String(empCounter).padStart(5, "0")}`,
          departmentId: dept.id,
          name: `${dept.name} ${roles[j]} ${j + 1}`,
          role: roles[j],
          status: pick(["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "IDLE"]),
          jobsProcessed: Math.floor(Math.random() * 5000),
          successRate: 90 + Math.random() * 10,
          avgResponseTime: Math.floor(Math.random() * 2000) + 200,
          lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        },
      });
    }
  }
  console.log(`✅ Seeded ${empCounter} AI employees`);

  // ─── 10000 Skills (100 per department) ───
  let skillCounter = 0;
  for (const dept of Object.values(deptMap)) {
    for (let j = 0; j < 100; j++) {
      skillCounter++;
      await db.aiSkill.create({
        data: {
          skillCode: `SKILL-${String(skillCounter).padStart(5, "0")}`,
          name: `${SKILL_NAMES[j % SKILL_NAMES.length]} — ${dept.name}`,
          description: `Specialized skill for ${dept.name}`,
          category: SKILL_CATEGORIES[j % SKILL_CATEGORIES.length],
          departmentId: dept.id,
          proficiencyLevel: pick(["EXPERT", "EXPERT", "MASTER", "ADVANCED", "INTERMEDIATE"]),
          status: "ACTIVE",
        },
      });
    }
  }
  console.log(`✅ Seeded ${skillCounter} skills`);

  // ─── 50000 Prompt Templates (500 per department) ───
  // Use batch creation for efficiency
  let promptCounter = 0;
  const batchSize = 500;
  for (const dept of Object.values(deptMap)) {
    const batch: any[] = [];
    for (let j = 0; j < 500; j++) {
      promptCounter++;
      batch.push({
        templateCode: `PROMPT-${String(promptCounter).padStart(5, "0")}`,
        name: `${PROMPT_NAMES[j % PROMPT_NAMES.length]} — ${dept.name} #${Math.floor(j / PROMPT_NAMES.length) + 1}`,
        description: `Prompt template for ${dept.name}`,
        category: PROMPT_CATEGORIES[j % PROMPT_CATEGORIES.length],
        departmentId: dept.id,
        promptText: `You are an AI specialist in ${dept.name}. Task: ${PROMPT_NAMES[j % PROMPT_NAMES.length]}. Follow ALO Education brand guidelines. Do not guarantee visa or admission.`,
        variables: JSON.stringify(["studentName", "course", "university", "country"]),
        version: 1,
        status: "ACTIVE",
      });
    }
    await db.promptTemplate.createMany({ data: batch });
  }
  console.log(`✅ Seeded ${promptCounter} prompt templates`);

  // ─── 500+ Constitutional Rules ───
  for (let i = 0; i < 500; i++) {
    await db.constitutionalRule.create({
      data: {
        ruleCode: `RULE-${String(i + 1).padStart(4, "0")}`,
        title: `${RULE_TITLES[i % RULE_TITLES.length]} ${Math.floor(i / RULE_TITLES.length) + 1}`,
        description: `Constitutional rule #${i + 1}: ${RULE_TITLES[i % RULE_TITLES.length]}. This rule is enforced across all AI agents and departments.`,
        category: RULE_CATEGORIES[i % RULE_CATEGORIES.length],
        enforcement: pick(["BLOCK", "BLOCK", "WARN", "LOG", "ESCALATE"]),
        priority: (i % 5) + 1,
        status: "ACTIVE",
      },
    });
  }
  console.log(`✅ Seeded 500 constitutional rules`);

  // ─── 500+ SOPs ───
  for (let i = 0; i < 500; i++) {
    const dept = Object.values(deptMap)[i % 100];
    await db.aiSop.create({
      data: {
        sopCode: `SOP-${String(i + 1).padStart(4, "0")}`,
        title: `SOP: ${RULE_TITLES[i % RULE_TITLES.length]} — ${dept.name}`,
        description: `Standard Operating Procedure for ${dept.name}`,
        departmentId: dept.id,
        steps: JSON.stringify([
          "Identify the request or trigger",
          "Retrieve relevant student/application data from CRM",
          "Apply constitutional rules and compliance checks",
          "Execute the task using appropriate AI skills",
          "Validate output against quality standards",
          "Save result to CRM timeline and audit log",
          "Notify relevant stakeholders",
        ]),
        version: 1,
        status: "ACTIVE",
      },
    });
  }
  console.log(`✅ Seeded 500 SOPs`);

  // ─── 20 Enterprise Engines ───
  for (const eng of ENGINE_DEFINITIONS) {
    await db.aiEngine.create({
      data: {
        engineCode: eng.type,
        name: eng.name,
        type: eng.type,
        description: eng.description,
        status: "ACTIVE",
        healthStatus: pick(["HEALTHY", "HEALTHY", "HEALTHY", "DEGRADED"]),
        metrics: JSON.stringify({
          requests: Math.floor(Math.random() * 1000000),
          errors: Math.floor(Math.random() * 100),
          latency: Math.floor(Math.random() * 500) + 50,
          uptime: 99.9 - Math.random() * 2,
        }),
        lastHealthCheck: new Date(),
      },
    });
  }
  console.log(`✅ Seeded 20 enterprise engines`);

  // Final counts
  console.log("\n═══════════════════════════════════════════");
  console.log("ENTERPRISE AI COMMAND CENTER — SEED COMPLETE");
  console.log("═══════════════════════════════════════════");
  console.log(`Departments:        ${await db.enterpriseDepartment.count()}`);
  console.log(`DCC Certified:      ${await db.enterpriseDepartment.count({ where: { dccCertified: true } })}`);
  console.log(`AI Employees:       ${await db.aiEmployee.count()}`);
  console.log(`Skills:             ${await db.aiSkill.count()}`);
  console.log(`Prompt Templates:   ${await db.promptTemplate.count()}`);
  console.log(`Constitutional Rules: ${await db.constitutionalRule.count()}`);
  console.log(`SOPs:               ${await db.aiSop.count()}`);
  console.log(`Enterprise Engines: ${await db.aiEngine.count()}`);
  console.log("═══════════════════════════════════════════");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
