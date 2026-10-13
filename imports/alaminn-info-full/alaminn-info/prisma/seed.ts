import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

async function main() {
  console.log("Seeding Alaminn.info content...");

  // ─── Admin user (bootstrap) ──────────────────────────────────
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@alaminn.info";
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!adminPassword) {
    console.error("\n[FATAL] ADMIN_BOOTSTRAP_PASSWORD environment variable is required for seeding.");
    console.error("Generate one with: openssl rand -base64 18");
    console.error("Then run: ADMIN_BOOTSTRAP_PASSWORD='<your-password>' bun run db:seed\n");
    process.exit(1);
  }
  if (adminPassword.length < 12) {
    console.error("\n[FATAL] ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters long.\n");
    process.exit(1);
  }
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Al Aminn (Admin)",
      role: "OWNER",
      status: "active",
      passwordHash: hashPassword(adminPassword),
    },
  });
  console.log(`  ✓ Admin user ensured: ${adminEmail}`);

  // ─── Projects (Ecosystem) ───────────────────────────────
  const projects = [
    {
      slug: "alo-education",
      name: "ALO Education",
      subtitle: "International student consultancy & education service platform",
      category: "education",
      shortDescription: "Official student consultancy handling counselling, applications, admissions, visas and student journeys.",
      fullDescription: "ALO Education is the dedicated student-services platform that handles the complete international education journey — from counselling and university selection to applications, scholarships, CAS, visa support and application tracking. Alaminn.info captures student referrals and routes them securely to ALO Education with consent.",
      businessProblem: "Students need a structured, compliant and supportive journey from interest to enrolment across multiple destination countries.",
      approvedRole: "Operations & growth leadership, partnership strategy, CRM architecture",
      solution: "A dedicated student-services platform with counsellor workflows, partner portal, application tracking and compliance-aware document handling.",
      technologies: "CRM, Student Portal, Partner Portal, Workflow Automation",
      status: "active",
      approvedUrl: "https://aloeducation.com",
      featured: true,
    },
    {
      slug: "alo-labs-agent-hub",
      name: "ALO Labs Agent Hub",
      subtitle: "Central AI workforce & technology command center",
      category: "ai",
      shortDescription: "Central AI agents, private skills, workflow orchestration and governance shared across the business ecosystem.",
      fullDescription: "ALO Labs is the central AI command center where agents, skills and workflows live. Sister platforms like Alaminn.info request approved workflows through secure APIs; outputs return as drafts, sensitive tasks require permission, and all activity is logged. Agents are never duplicated across companies.",
      businessProblem: "Companies need AI capability without losing control, governance or security.",
      approvedRole: "Architecture, governance design, approval workflows",
      solution: "A central agent hub with scoped company credentials, signed webhooks, approval routing and full audit logging.",
      technologies: "LLM Orchestration, Webhooks, RBAC, Audit Logging",
      status: "planned",
      approvedUrl: "https://alolabs.ai",
      featured: true,
    },
    {
      slug: "english-ai",
      name: "English AI",
      subtitle: "AI-powered English language learning & assessment",
      category: "ai",
      shortDescription: "Adaptive English practice and assessment designed for international students and professionals.",
      fullDescription: "English AI supports learners preparing for international study and work through adaptive practice, instant feedback and structured progress tracking.",
      businessProblem: "English proficiency is a gateway requirement for international education and global careers.",
      approvedRole: "Strategy & product direction",
      solution: "An adaptive AI learning system with skill-level targeting and measurable progress.",
      technologies: "Adaptive Learning, NLP, Progress Analytics",
      status: "planned",
      featured: false,
    },
    {
      slug: "icla-global-academy",
      name: "ICLA Global Academy",
      subtitle: "International curriculum & learning academy",
      category: "education",
      shortDescription: "An international academy focused on structured curriculum delivery and learner outcomes.",
      fullDescription: "ICLA Global Academy represents structured international curriculum delivery. It appears in the ecosystem where content, ownership and role are approved.",
      businessProblem: "Families and learners need credible, structured international curriculum options.",
      approvedRole: "Advisory & collaboration",
      solution: "Structured curriculum delivery with measurable learner outcomes.",
      technologies: "LMS, Curriculum Design, Assessment",
      status: "planned",
      featured: false,
    },
    {
      slug: "tech360",
      name: "TECH360",
      subtitle: "Technology services, CRM, automation & digital transformation",
      category: "software",
      shortDescription: "Technical delivery for websites, CRM systems, automation and digital transformation projects.",
      fullDescription: "TECH360 represents the technical delivery arm — websites, business systems, CRM, automation, workflow architecture and reporting dashboards. Selected client work appears as approved portfolio entries on Alaminn.info.",
      businessProblem: "Service businesses need reliable, well-architected digital systems to scale.",
      approvedRole: "Delivery leadership & architecture",
      solution: "End-to-end technical delivery with documentation, handover and support.",
      technologies: "Next.js, Prisma, Automation, API Design",
      status: "active",
      featured: true,
    },
    {
      slug: "alaminn-info",
      name: "Alaminn.info",
      subtitle: "Executive authority platform & personal brand",
      category: "professional-brand",
      shortDescription: "The personal authority, executive portfolio and business ecosystem hub for Al Aminn.",
      fullDescription: "Alaminn.info is the personal executive platform combining professional identity, thought leadership, partnership strategy, consulting inquiries and a relationship CRM — connected securely to ALO Labs for approved AI workflows.",
      businessProblem: "Senior operators need a credible, single hub that connects their work, ecosystem and collaboration pathways.",
      approvedRole: "Owner & architect",
      solution: "A premium executive platform with CMS, CRM, AI workspace and evidence-controlled publishing.",
      technologies: "Next.js, TypeScript, Prisma, shadcn/ui",
      status: "active",
      approvedUrl: "https://alaminn.info",
      featured: true,
    },
  ];

  for (const p of projects) {
    await db.project.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // ─── Case Studies ───────────────────────────────────────
  const caseStudies = [
    {
      slug: "education-operations-restructuring",
      title: "Restructuring an Education Consultancy's Operating System",
      category: "education-operations",
      context: "A growing education consultancy was handling increasing student volume with manual, disconnected workflows.",
      challenge: "Counsellor accountability, lead follow-up and application tracking were inconsistent, creating missed deadlines and unhappy students.",
      role: "Operations & growth lead",
      intervention: "Mapped the full student journey, redesigned counselling workflows, introduced accountability matrices and reporting cadences.",
      systemBuilt: "A counselling workflow system with stage gates, ownership, daily standups and weekly conversion reviews.",
      outcome: "Helped restructure sales follow-up, accountability and conversion workflows into a measurable operating system.",
      evidenceStatus: "verified",
      confidentiality: "summary-only",
      readTime: 8,
      featured: true,
    },
    {
      slug: "ai-crm-implementation",
      title: "Designing a CRM With Governed AI Assistance",
      category: "ai-crm",
      context: "A service business wanted AI to reduce administrative load without losing control of sensitive data.",
      challenge: "Uncontrolled AI use risked exposing client data and publishing unapproved content.",
      role: "Systems architect & AI reviewer",
      intervention: "Designed a CRM with ALO Labs integration where AI outputs return as drafts requiring human approval.",
      systemBuilt: "Approval-routed AI workspace with sensitivity tagging and audit logging.",
      outcome: "Created a governed AI-assisted CRM where publishing, proposals and external communications require human approval.",
      evidenceStatus: "verified",
      confidentiality: "partially-anonymized",
      readTime: 10,
      featured: true,
    },
    {
      slug: "sales-pipeline-redesign",
      title: "Sales Pipeline Redesign for a Service Business",
      category: "sales-growth",
      context: "A service business struggled with unpredictable revenue and unclear pipeline health.",
      challenge: "Leads were captured but not consistently qualified, followed up or converted.",
      role: "Sales strategy lead",
      intervention: "Introduced a stage-based opportunity pipeline with qualification criteria and follow-up SLAs.",
      systemBuilt: "A 14-stage opportunity pipeline with reporting dashboards and accountability.",
      outcome: "Helped restructure lead capture, follow-up, conversion and accountability into a measurable sales system.",
      evidenceStatus: "verified",
      confidentiality: "summary-only",
      readTime: 7,
      featured: true,
    },
  ];

  for (const c of caseStudies) {
    await db.caseStudy.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  // ─── Impact Records ─────────────────────────────────────
  const impacts = [
    {
      category: "operational-transformation",
      challenge: "Disconnected counselling workflows causing missed deadlines.",
      role: "Operations lead",
      action: "Redesigned student journey with stage gates and accountability.",
      outcome: "Created a measurable counselling operating system with daily and weekly reviews.",
      evidenceStatus: "verified",
      confidentiality: "summary-only",
    },
    {
      category: "sales-workflow",
      challenge: "Inconsistent lead follow-up and unclear pipeline health.",
      role: "Sales strategy lead",
      action: "Introduced stage-based opportunity pipeline with SLAs.",
      outcome: "Helped restructure lead capture, follow-up and conversion workflows.",
      evidenceStatus: "verified",
      confidentiality: "summary-only",
    },
    {
      category: "automation-systems",
      challenge: "Manual administrative load across content and follow-ups.",
      role: "Systems architect",
      action: "Designed governed AI workspace with approval routing.",
      outcome: "Created an AI-assisted workflow where outputs require human approval before delivery.",
      evidenceStatus: "verified",
      confidentiality: "partially-anonymized",
    },
    {
      category: "crm-implementation",
      challenge: "No single source of truth for contacts and opportunities.",
      role: "CRM architect",
      action: "Built a relationship CRM with source attribution and audit logging.",
      outcome: "Delivered a structured CRM with inquiry, opportunity and partnership pipelines.",
      evidenceStatus: "verified",
      confidentiality: "summary-only",
    },
    {
      category: "partnership-development",
      challenge: "University outreach lacked structure and follow-through.",
      role: "Partnership lead",
      action: "Built a partnership pipeline with due-diligence and approval stages.",
      outcome: "Helped structure institutional collaboration discussions for the Bangladesh market.",
      evidenceStatus: "evidence-uploaded",
      confidentiality: "summary-only",
    },
    {
      category: "team-accountability",
      challenge: "Unclear ownership and inconsistent reporting.",
      role: "Operations lead",
      action: "Introduced accountability matrices and reporting cadences.",
      outcome: "Helped establish clear ownership, follow-up cadence and performance reporting.",
      evidenceStatus: "verified",
      confidentiality: "summary-only",
    },
  ];

  for (const i of impacts) {
    const existing = await db.impactRecord.findFirst({ where: { category: i.category, challenge: i.challenge } });
    if (!existing) await db.impactRecord.create({ data: i });
  }

  // ─── Articles ───────────────────────────────────────────
  const articles = [
    {
      slug: "operating-system-for-growth",
      title: "Growth Requires More Than Ideas. It Requires an Operating System.",
      summary: "Why ambitious goals stall without structure — and how an operating system connects strategy to execution.",
      body: "Most growing businesses don't fail from a lack of ideas. They fail because ideas never become a structured, measurable operating system. This article breaks down how leadership, process, technology, accountability and data connect to turn vision into repeatable growth.\n\nAn operating system is not a tool. It is the agreement between people, process and technology that decides what gets done, by whom, by when, and how it is measured. Without that agreement, even the best strategy collapses into noise.",
      category: "executive-leadership",
      tags: "operations, leadership, growth, systems",
      readingMinutes: 6,
      featured: true,
    },
    {
      slug: "ai-without-losing-control",
      title: "Adopting AI Without Losing Control",
      summary: "A practical governance model for bringing AI into service businesses safely.",
      body: "AI can reduce administrative load, accelerate research and improve consistency — but only when governed. This article outlines a four-layer model: company authentication, scoped permissions, approval routing and audit logging.\n\nThe principle is simple: AI proposes, people approve, the system logs. Outputs that touch the public, finances, contracts or student data require human approval.",
      category: "ai-automation",
      tags: "ai, governance, automation, security",
      readingMinutes: 7,
    },
    {
      slug: "bangladesh-market-entry-for-universities",
      title: "Bangladesh Market Entry: A University Partnership Playbook",
      summary: "What universities should understand about recruitment, partnerships and compliance in Bangladesh.",
      body: "Bangladesh is one of the most active student-sending markets in South Asia. This guide outlines what universities should consider: local partnership strategy, recruitment operations, compliance awareness, communication systems and digital infrastructure.\n\nSuccess in Bangladesh is less about presence and more about structure — clear counselling, accountable follow-up, and credible local partners.",
      category: "bangladesh-market",
      tags: "bangladesh, university-partnerships, recruitment",
      readingMinutes: 9,
    },
    {
      slug: "sales-system-for-education-businesses",
      title: "Building a Sales System for Education Businesses",
      summary: "Lead capture, follow-up, conversion and accountability — designed for education services.",
      body: "Education businesses often confuse activity with progress. A real sales system defines stages, ownership, SLAs and conversion metrics. This article outlines a 14-stage opportunity pipeline adapted to counselling-led services.",
      category: "sales-growth",
      tags: "sales, education, pipeline, conversion",
      readingMinutes: 8,
    },
    {
      slug: "crm-as-relationship-infrastructure",
      title: "CRM as Relationship Infrastructure, Not Just Software",
      summary: "Why CRM fails when treated as a tool — and how to design it as living infrastructure.",
      body: "A CRM is not a contact list. It is the relationship infrastructure of a business. This article covers inquiry routing, opportunity stages, partnership pipelines, source attribution and audit logging as the backbone of credible growth.",
      category: "crm-technology",
      tags: "crm, infrastructure, relationships",
      readingMinutes: 6,
    },
    {
      slug: "personal-authority-platforms",
      title: "Personal Authority Platforms for Senior Operators",
      summary: "Why senior operators need a credible single hub — not just a LinkedIn profile.",
      body: "A personal authority platform connects your work, ecosystem and collaboration pathways in one credible place. This article explores the difference between a portfolio and an authority platform, and how to structure one for executive positioning.",
      category: "personal-branding",
      tags: "personal-brand, authority, executive",
      readingMinutes: 5,
    },
  ];

  for (const a of articles) {
    await db.article.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }

  // ─── Resources ──────────────────────────────────────────
  const resources = [
    { slug: "operations-audit-checklist", title: "Operations Audit Checklist", description: "A structured checklist to audit workflows, roles, bottlenecks and reporting.", category: "operations", type: "checklist", readTime: 5 },
    { slug: "sales-pipeline-review", title: "Sales Pipeline Review", description: "Review lead capture, follow-up, conversion and accountability.", category: "sales", type: "template", readTime: 6 },
    { slug: "crm-requirements-worksheet", title: "CRM Requirements Worksheet", description: "Define requirements, architecture and workflows for a new CRM.", category: "crm-planning", type: "template", readTime: 8 },
    { slug: "ai-automation-readiness-checklist", title: "AI Automation Readiness Checklist", description: "Identify safe, practical automation opportunities in your business.", category: "ai-readiness", type: "checklist", readTime: 5 },
    { slug: "university-partnership-preparation-guide", title: "University Partnership Preparation Guide", description: "Prepare for institutional collaboration in the Bangladesh market.", category: "university-partnerships", type: "guide", readTime: 10 },
    { slug: "bangladesh-market-entry-brief", title: "Bangladesh Market Entry Brief", description: "A strategic brief on entering the Bangladesh education market.", category: "bangladesh-market", type: "report", readTime: 12 },
    { slug: "team-accountability-matrix", title: "Team Accountability Matrix", description: "Clarify ownership, responsibilities and reporting cadences.", category: "operations", type: "template", readTime: 4 },
    { slug: "personal-brand-strategy-worksheet", title: "Personal Brand Strategy Worksheet", description: "Structure your executive positioning and authority platform.", category: "personal-branding", type: "worksheet", readTime: 7 },
  ];

  for (const r of resources) {
    await db.resource.upsert({
      where: { slug: r.slug },
      update: r,
      create: r,
    });
  }

  // ─── AI Tasks (sample, for command center) ──────────────
  const sampleAiTasks = [
    { workflow: "executive-linkedin-post", objective: "Draft a LinkedIn post on operating systems for growth.", prompt: "Write a confident, concise LinkedIn post about why growth needs an operating system.", status: "awaiting-approval", sensitivity: "public", result: "Growth requires more than ambition. It requires an operating system that connects strategy, people, process, technology and accountability. Without it, even the best ideas collapse into noise." },
    { workflow: "seo-article-draft", objective: "Draft SEO article on Bangladesh market entry.", prompt: "Draft an SEO-optimised article on Bangladesh market entry for universities.", status: "quality-review", sensitivity: "internal" },
    { workflow: "operations-audit", objective: "Generate operations audit summary.", prompt: "Summarise common operations bottlenecks in education consultancies.", status: "delivered", sensitivity: "internal", result: "Common bottlenecks: unclear ownership, inconsistent follow-up, no stage gates, manual reporting." },
    { workflow: "newsletter-draft", objective: "Draft monthly authority newsletter.", prompt: "Draft a monthly executive newsletter.", status: "revision-requested", sensitivity: "public" },
  ];

  for (const t of sampleAiTasks) {
    const existing = await db.aiTask.findFirst({ where: { workflow: t.workflow, objective: t.objective } });
    if (!existing) {
      // need a requester; create a system user
      let sysUser = await db.user.findFirst({ where: { email: "system@alaminn.info" } });
      if (!sysUser) {
        sysUser = await db.user.create({ data: { email: "system@alaminn.info", name: "Al Aminn", role: "OWNER" } });
      }
      await db.aiTask.create({ data: { ...t, requesterId: sysUser.id } });
    }
  }

  // ─── Sample Contacts (CRM) ────────────────────────────────────
  const sampleContacts = [
    { fullName: "Dr. Sarah Chen", email: "sarah.chen@example.edu", organization: "Pacific State University", role: "Director of International Admissions", country: "United States", status: "active", tags: "university,partnership" },
    { fullName: "Rahul Mehta", email: "rahul.mehta@example.com", organization: "BrightPath Consulting", role: "CEO", country: "India", status: "nurturing", tags: "consulting,sales" },
    { fullName: "Fatima Khan", email: "fatima.khan@example.org", organization: "Dhaka Tech Council", role: "Programs Lead", country: "Bangladesh", status: "active", tags: "media,partnership" },
    { fullName: "James O'Sullivan", email: "james.osullivan@example.ie", organization: "Dublin Education Group", role: "VP Partnerships", country: "Ireland", status: "converted", tags: "university,partnership" },
  ];
  for (const c of sampleContacts) {
    await db.contact.upsert({
      where: { email: c.email },
      update: c,
      create: c,
    });
  }
  console.log(`  ✓ ${sampleContacts.length} sample contacts ensured`);

  // ─── Sample Organizations (Companies) ─────────────────────────
  const sampleOrgs = [
    { name: "Pacific State University", type: "university", country: "United States", website: "https://example.edu", status: "active" },
    { name: "BrightPath Consulting", type: "company", country: "India", website: "https://example.com", status: "active" },
    { name: "Dhaka Tech Council", type: "media", country: "Bangladesh", website: "https://example.org", status: "active" },
    { name: "Dublin Education Group", type: "education-business", country: "Ireland", website: "https://example.ie", status: "active" },
  ];
  for (const o of sampleOrgs) {
    const existing = await db.organization.findFirst({ where: { name: o.name } });
    if (!existing) await db.organization.create({ data: o });
  }
  console.log(`  ✓ ${sampleOrgs.length} sample organizations ensured`);

  // ─── Default Settings ─────────────────────────────────────────
  const defaultSettings: { key: string; value: string }[] = [
    { key: "site.url", value: "https://alaminn.info" },
    { key: "site.name", value: "Alaminn.info" },
    { key: "site.tagline", value: "Transforming Strategy Into Scalable Operations, Growth & Intelligent Systems" },
    { key: "seo.home.title", value: "Al Aminn — Executive Operations, Growth & AI Systems" },
    { key: "seo.home.description", value: "Al Aminn transforms strategy into scalable operations, growth and intelligent systems." },
    { key: "maintenance.enabled", value: "false" },
    { key: "sitemap.priority", value: "0.7" },
    { key: "robots.txt", value: "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/" },
  ];
  for (const s of defaultSettings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${defaultSettings.length} default settings ensured`);

  // ─── Sample Inquiries (CRM) ───────────────────────────────────
  // Inquiry requires a Contact + reference. Link to existing sample contacts.
  const inquiryContacts = await db.contact.findMany({ take: 3 });
  const inquiryTypes = ["education-advisory", "university-partnership", "business-consultation"];
  const inquiryData = [
    { currentChallenge: "MBA application guidance for Fall 2026 UK intake.", desiredOutcome: "Shortlist 3-5 UK MBA programmes + counselling package.", timeline: "6 months", scope: "Counselling + application review" },
    { currentChallenge: "PhD in Computer Science funding strategy.", desiredOutcome: "Identify fully-funded PhD positions at Oxford/Cambridge.", timeline: "12 months", scope: "Supervisor outreach + scholarship coaching" },
    { currentChallenge: "Scholarship consultation for Chevening 2026.", desiredOutcome: "Submit competitive Chevening application.", timeline: "8 months", scope: "Essay coaching + interview prep" },
  ];
  for (let i = 0; i < Math.min(inquiryContacts.length, inquiryData.length); i++) {
    const ref = `INQ-2026-${String(i + 1).padStart(4, "0")}`;
    const existing = await db.inquiry.findFirst({ where: { reference: ref } });
    if (!existing) {
      await db.inquiry.create({
        data: {
          reference: ref,
          type: inquiryTypes[i],
          contactId: inquiryContacts[i].id,
          ...inquiryData[i],
          status: i === 0 ? "new" : i === 1 ? "qualified" : "responded",
          privacyConsent: true,
          commsConsent: true,
        },
      });
    }
  }
  console.log(`  ✓ ${inquiryData.length} sample inquiries ensured`);

  // ─── Sample Opportunities ─────────────────────────────────────
  // Opportunity requires Contact + title. Link to existing contacts.
  const opportunityData = [
    { title: "Fall 2026 MBA cohort — UK", value: 12500, currency: "USD", stage: "qualified", priority: "high", closeDate: new Date("2026-06-30") },
    { title: "PhD application package — Oxford ML", value: 8000, currency: "USD", stage: "proposal-sent", priority: "high", closeDate: new Date("2026-01-15") },
    { title: "Chevening scholarship coaching", value: 4500, currency: "USD", stage: "discovery-scheduled", priority: "medium", closeDate: new Date("2026-09-30") },
  ];
  for (let i = 0; i < Math.min(inquiryContacts.length, opportunityData.length); i++) {
    const existing = await db.opportunity.findFirst({ where: { title: opportunityData[i].title } });
    if (!existing) {
      await db.opportunity.create({
        data: { ...opportunityData[i], contactId: inquiryContacts[i].id },
      });
    }
  }
  console.log(`  ✓ ${opportunityData.length} sample opportunities ensured`);

  // ─── Sample Tasks ─────────────────────────────────────────────
  const sampleTasks = [
    { title: "Prepare Fall 2026 counselling playbook", description: "Update counselling playbook with 2026 intake deadlines, scholarships, and visa changes.", status: "in-progress", priority: "high", dueDate: new Date("2026-02-15") },
    { title: "Follow up with Pacific State University MoU", description: "Send draft MoU to Sarah Chen and schedule a call for week of 10 Feb.", status: "open", priority: "medium", dueDate: new Date("2026-02-08") },
    { title: "Publish scholarship application guide", description: "Final review of 'Scholarship Application Mastery' guide before publishing on Higher Study platform.", status: "open", priority: "medium", dueDate: new Date("2026-01-30") },
  ];
  for (const t of sampleTasks) {
    const existing = await db.task.findFirst({ where: { title: t.title } });
    if (!existing) await db.task.create({ data: t });
  }
  console.log(`  ✓ ${sampleTasks.length} sample tasks ensured`);

  // ─── Sample Newsletter Subscribers ────────────────────────────
  const sampleSubscribers = [
    { email: "subscriber1@example.com", name: "Anna Petrova", interest: "executive", consent: true, status: "confirmed" },
    { email: "subscriber2@example.com", name: "Mohammed Ali", interest: "student", consent: true, status: "confirmed" },
    { email: "subscriber3@example.com", name: "Yuki Tanaka", interest: "technology", consent: true, status: "confirmed" },
  ];
  for (const s of sampleSubscribers) {
    await db.newsletterSubscriber.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${sampleSubscribers.length} newsletter subscribers ensured`);

  // ─── Sample AI Approvals ──────────────────────────────────────
  // Link to existing AiTasks (created above) — first approval of the first task
  const firstAiTask = await db.aiTask.findFirst({ orderBy: [{ createdAt: "asc" }] });
  if (firstAiTask) {
    const existingApproval = await db.aiApproval.findFirst({ where: { taskId: firstAiTask.id } });
    if (!existingApproval) {
      const adminUser = await db.user.findFirst({ where: { email: adminEmail } });
      if (adminUser) {
        await db.aiApproval.create({
          data: {
            taskId: firstAiTask.id,
            reviewerId: adminUser.id,
            decision: "approved",
            note: "Approved for LinkedIn publication.",
          },
        });
        console.log("  ✓ 1 sample AI approval ensured");
      }
    }
  }

  // ─── English Learning seed ────────────────────────────────────
  // Delegated to prisma/seed-english-learning.ts.
  try {
    const { seedEnglishLearning } = await import("./seed-english-learning");
    await seedEnglishLearning();
  } catch (err) {
    console.warn("  ⚠ English Learning seed failed (non-fatal):", err);
  }

  // ─── Higher Study seed (delegated) ────────────────────────────
  try {
    const { seedHigherStudy } = await import("./seed-higher-study");
    await seedHigherStudy(db);
  } catch (err) {
    console.warn("  ⚠ Higher Study seed failed (non-fatal):", err);
  }

  // ─── Extended Higher Study countries seed ────────────────────
  // Eliminates all "Coming soon" destination pages by seeding real,
  // authoritative data for every country in COUNTRIES_MAP that is not
  // already covered by seed-higher-study.ts.
  try {
    const { seedExtraCountries } = await import("./seed-countries-extra");
    await seedExtraCountries(db);
  } catch (err) {
    console.warn("  ⚠ Extra countries seed failed (non-fatal):", err);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
