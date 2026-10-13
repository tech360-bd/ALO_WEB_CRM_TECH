// ALO Education — Knowledge Center + AI Registry seed
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Seeding Knowledge Center + AI Agent Registry...");

  await db.knowledgeBookmark.deleteMany();
  await db.aiAgentRegistry.deleteMany();
  await db.trainingMaterial.deleteMany();
  await db.knowledgeNews.deleteMany();
  await db.knowledgeDocument.deleteMany();
  await db.knowledgeCategory.deleteMany();

  // ─── Knowledge Categories (Countries + Internal) ───
  const categories = [
    { name: "United Kingdom", slug: "uk", icon: "🇬🇧", sortOrder: 1 },
    { name: "Australia", slug: "australia", icon: "🇦🇺", sortOrder: 2 },
    { name: "Canada", slug: "canada", icon: "🇨🇦", sortOrder: 3 },
    { name: "USA", slug: "usa", icon: "🇺🇸", sortOrder: 4 },
    { name: "New Zealand", slug: "new-zealand", icon: "🇳🇿", sortOrder: 5 },
    { name: "Ireland", slug: "ireland", icon: "🇮🇪", sortOrder: 6 },
    { name: "Europe", slug: "europe", icon: "🇪🇺", sortOrder: 7 },
    { name: "Dubai / UAE", slug: "dubai", icon: "🇦🇪", sortOrder: 8 },
    { name: "Malaysia", slug: "malaysia", icon: "🇲🇾", sortOrder: 9 },
    { name: "Singapore", slug: "singapore", icon: "🇸🇬", sortOrder: 10 },
    { name: "Internal Policies", slug: "internal-policies", icon: "📋", sortOrder: 11 },
    { name: "Marketing Materials", slug: "marketing-materials", icon: "📢", sortOrder: 12 },
    { name: "Training Center", slug: "training-center", icon: "🎓", sortOrder: 13 },
  ];
  const catMap: Record<string, any> = {};
  for (const c of categories) {
    catMap[c.slug] = await db.knowledgeCategory.create({ data: c });
  }

  // ─── Subcategories (folders inside each country) ───
  const subcategories = [
    "Visa Documents", "Application Checklist", "Financial Documents", "Bank Statement Guide",
    "SOP Guide", "LOR Guide", "CV Samples", "CAS Guide", "Interview Guide",
    "Embassy Updates", "Immigration Updates", "University Updates", "Scholarship Updates",
    "Government Circulars", "Application Process", "Important Deadlines",
  ];
  for (const [slug, cat] of Object.entries(catMap)) {
    if (["internal-policies", "marketing-materials", "training-center"].includes(slug)) continue;
    for (let i = 0; i < subcategories.length; i++) {
      await db.knowledgeCategory.create({
        data: {
          name: subcategories[i],
          slug: `${slug}-${i}-${subcategories[i].toLowerCase().replace(/\s/g, "-")}`,
          parentId: cat.id,
          icon: "📁",
          sortOrder: i,
        },
      });
    }
  }

  // ─── Knowledge Documents ───
  const documents = [
    { cat: "uk", title: "UK Student Visa Document Checklist 2025", fileType: "PDF", tags: JSON.stringify(["visa", "checklist", "UK"]), visibility: "EMPLOYEE", isFeatured: true, aiSummary: "Complete checklist of documents required for UK student visa including passport, CAS, financial proof, TB test, and English proficiency.", aiTags: JSON.stringify(["UK", "visa", "checklist", "2025"]) },
    { cat: "uk", title: "UK Bank Statement Guide for Students", fileType: "PDF", tags: JSON.stringify(["finance", "bank", "UK"]), visibility: "EMPLOYEE", aiSummary: "Guide on minimum balance, 28-day rule, and acceptable bank statement format for UK visa.", aiTags: JSON.stringify(["UK", "finance", "bank"]) },
    { cat: "uk", title: "SOP Template — UK Universities", fileType: "DOCX", tags: JSON.stringify(["SOP", "template", "UK"]), visibility: "COUNSELOR", isFeatured: true, aiSummary: "Standard SOP template with sections for academic background, motivation, career goals, and university choice.", aiTags: JSON.stringify(["UK", "SOP", "template"]) },
    { cat: "canada", title: "Canada Study Permit Checklist", fileType: "PDF", tags: JSON.stringify(["visa", "checklist", "Canada"]), visibility: "EMPLOYEE", aiSummary: "Complete checklist for Canada study permit including LOA, financial proof, medical exam, and biometrics.", aiTags: JSON.stringify(["Canada", "visa", "checklist"]) },
    { cat: "canada", title: "Canada SDS vs Non-SDS Guide", fileType: "PDF", tags: JSON.stringify(["SDS", "Canada", "finance"]), visibility: "EMPLOYEE", aiSummary: "Comparison of Student Direct Stream vs regular study permit application — requirements, processing time, and financial proof differences.", aiTags: JSON.stringify(["Canada", "SDS", "finance"]) },
    { cat: "australia", title: "Australia GTE Statement Guide", fileType: "PDF", tags: JSON.stringify(["GTE", "Australia", "SOP"]), visibility: "COUNSELOR", aiSummary: "Guide for writing Genuine Temporary Entrant statement for Australian student visa.", aiTags: JSON.stringify(["Australia", "GTE"]) },
    { cat: "australia", title: "Australia COE Process Guide", fileType: "PDF", tags: JSON.stringify(["COE", "Australia", "process"]), visibility: "EMPLOYEE", aiSummary: "Step-by-step guide for Confirmation of Enrolment process in Australia.", aiTags: JSON.stringify(["Australia", "COE"]) },
    { cat: "usa", title: "USA F-1 Visa Interview Questions", fileType: "PDF", tags: JSON.stringify(["visa", "interview", "USA"]), visibility: "EMPLOYEE", isFeatured: true, aiSummary: "Common F-1 visa interview questions with suggested answer frameworks.", aiTags: JSON.stringify(["USA", "visa", "interview"]) },
    { cat: "usa", title: "USA I-20 Process Guide", fileType: "PDF", tags: JSON.stringify(["I-20", "USA", "process"]), visibility: "EMPLOYEE", aiSummary: "Guide for I-20 issuance, deposit payment, and SEVIS fee payment.", aiTags: JSON.stringify(["USA", "I-20"]) },
    { cat: "ireland", title: "Ireland Third Level Graduate Scheme Guide", fileType: "PDF", tags: JSON.stringify(["post-study", "Ireland", "work"]), visibility: "EMPLOYEE", aiSummary: "Guide on Ireland's post-study work visa — 1 year for Level 8, 2 years for Level 9+.", aiTags: JSON.stringify(["Ireland", "post-study"]) },
    { cat: "germany", title: "Germany APS Certificate Guide", fileType: "PDF", tags: JSON.stringify(["APS", "Germany", "process"]), visibility: "EMPLOYEE", aiSummary: "Complete guide for APS certificate application for Bangladeshi students applying to Germany.", aiTags: JSON.stringify(["Germany", "APS"]) },
    { cat: "dubai", title: "Dubai Student Visa Process", fileType: "PDF", tags: JSON.stringify(["visa", "Dubai", "UAE"]), visibility: "EMPLOYEE", aiSummary: "Student visa process for UAE including sponsor requirements and medical test.", aiTags: JSON.stringify(["Dubai", "visa"]) },
    { cat: "malaysia", title: "Malaysia Student Pass Guide", fileType: "PDF", tags: JSON.stringify(["visa", "Malaysia", "pass"]), visibility: "EMPLOYEE", aiSummary: "Guide for Malaysia Student Pass application via EMGS.", aiTags: JSON.stringify(["Malaysia", "visa"]) },
    { cat: "internal-policies", title: "ALO Education Employee Handbook 2025", fileType: "PDF", tags: JSON.stringify(["handbook", "policy", "HR"]), visibility: "EMPLOYEE", isFeatured: true, isPinned: true, aiSummary: "Complete employee handbook covering policies, code of conduct, leave policy, and HR procedures.", aiTags: JSON.stringify(["handbook", "HR", "2025"]) },
    { cat: "internal-policies", title: "ALO Education Office SOP", fileType: "DOCX", tags: JSON.stringify(["SOP", "office", "process"]), visibility: "EMPLOYEE", aiSummary: "Standard operating procedures for daily office operations including lead handling, counseling, and application processing.", aiTags: JSON.stringify(["SOP", "office"]) },
    { cat: "marketing-materials", title: "Facebook Post Templates — September Intake", fileType: "DOCX", tags: JSON.stringify(["marketing", "facebook", "templates"]), visibility: "MARKETING", aiSummary: "Ready-to-use Facebook post templates for September intake campaigns.", aiTags: JSON.stringify(["marketing", "facebook"]) },
    { cat: "marketing-materials", title: "Instagram Reel Scripts — Student Success", fileType: "DOCX", tags: JSON.stringify(["marketing", "instagram", "reels"]), visibility: "MARKETING", aiSummary: "Reel script templates featuring student success stories.", aiTags: JSON.stringify(["marketing", "instagram"]) },
    { cat: "training-center", title: "Counseling Training — Module 1: Lead Qualification", fileType: "VIDEO", tags: JSON.stringify(["training", "counseling", "leads"]), visibility: "EMPLOYEE", isFeatured: true, aiSummary: "Training video on how to qualify leads, assess student profiles, and recommend suitable courses.", aiTags: JSON.stringify(["training", "counseling"]) },
    { cat: "training-center", title: "Visa Training — UK Visa Refusal Analysis", fileType: "VIDEO", tags: JSON.stringify(["training", "visa", "UK", "refusal"]), visibility: "EMPLOYEE", aiSummary: "Training on analyzing UK visa refusal reasons and preparing reapplication strategy.", aiTags: JSON.stringify(["training", "visa"]) },
    { cat: "training-center", title: "CRM Training — Document Management", fileType: "VIDEO", tags: JSON.stringify(["training", "CRM", "documents"]), visibility: "EMPLOYEE", aiSummary: "Training on using the CRM document hub, uploading, reviewing, and approving documents.", aiTags: JSON.stringify(["training", "CRM"]) },
  ];
  for (const d of documents) {
    const cat = catMap[d.cat] || catMap["uk"];
    await db.knowledgeDocument.create({
      data: {
        categoryId: cat.id,
        title: d.title,
        fileType: d.fileType,
        filePath: `/private/knowledge/${d.cat}/${d.title.toLowerCase().replace(/\s/g, "-")}.${d.fileType.toLowerCase()}`,
        tags: d.tags,
        visibility: d.visibility,
        approvalStatus: "APPROVED",
        isFeatured: d.isFeatured || false,
        isPinned: d.isPinned || false,
        aiSummary: d.aiSummary,
        aiTags: d.aiTags,
        downloadCount: Math.floor(Math.random() * 100),
        authorId: "system",
      },
    });
  }

  // ─── Knowledge News ───
  const news = [
    { title: "UK September 2025 Intake Deadlines Announced", content: "UK universities have announced September 2025 intake deadlines. Key deadlines: University of Manchester — June 30, University of Edinburgh — July 15. Please ensure all applications are submitted at least 3 weeks before deadlines.", category: "UNIVERSITY_UPDATE", country: "UK", isPinned: true, isFeatured: true },
    { title: "Canada SDS Program Updates — New Financial Requirements", content: "IRCC has updated the financial requirements for the Student Direct Stream (SDS). The minimum proof of funds has been increased. Please update all Canada application checklists accordingly.", category: "IMMIGRATION_UPDATE", country: "Canada", isPinned: true },
    { title: "Australia GTE Changes — New Genuine Student Requirement", content: "Australia has replaced the GTE requirement with the Genuine Student (GS) test. Counselors must update SOP guidance for all Australian applications.", category: "IMMIGRATION_UPDATE", country: "Australia", isFeatured: true },
    { title: "New Partnership — University of Greenwich", content: "ALO Education has signed a new partnership with University of Greenwich. Updated commission structure and application process available in the Knowledge Center.", category: "UNIVERSITY_UPDATE", country: "UK" },
    { title: "Office Closed — Eid ul Adha", content: "ALO Education offices will be closed from June 16-18 for Eid ul Adha. Emergency WhatsApp support will be available. Please inform all students accordingly.", category: "OFFICE_ANNOUNCEMENT", isPinned: true },
    { title: "New SOP Templates Available", content: "Updated SOP templates for UK, Canada, and Australia are now available in the Knowledge Center. All counselors should use the latest versions.", category: "TRAINING_NEWS" },
    { title: "Visa Officer Training — Session Recording Available", content: "The visa officer training session on financial document verification is now available in the Training Center. All visa team members must complete it by Friday.", category: "TRAINING_NEWS" },
    { title: "Marketing Campaign — September Intake Launch", content: "Marketing team has launched the September intake campaign. All assets including Facebook posts, Instagram reels, and email templates are available in the Marketing Materials folder.", category: "MARKETING_NOTICE" },
    { title: "Updated: Germany APS Process for 2025", content: "APS Bangladesh has updated the application process for 2025. New document requirements and online appointment system. Check the Germany folder for details.", category: "IMMIGRATION_UPDATE", country: "Germany" },
    { title: "HR Policy Update — Leave Carry Forward", content: "HR has updated the leave carry forward policy. Employees can carry forward up to 10 days of annual leave to the next year. Check the Internal Policies folder for the full policy.", category: "HR_NOTICE", isPinned: true },
  ];
  for (const n of news) {
    await db.knowledgeNews.create({ data: n });
  }

  // ─── Training Materials ───
  const trainings = [
    { title: "Counseling Fundamentals — Lead to Enrollment", type: "RECORDED_TRAINING", duration: 45, enrolledCount: 15, completedCount: 12, certificateEnabled: true, tags: JSON.stringify(["counseling", "fundamentals"]) },
    { title: "UK Visa Process Training", type: "RECORDED_TRAINING", duration: 60, enrolledCount: 10, completedCount: 8, certificateEnabled: true, tags: JSON.stringify(["UK", "visa"]) },
    { title: "Canada Study Permit Training", type: "RECORDED_TRAINING", duration: 50, enrolledCount: 12, completedCount: 9, certificateEnabled: true, tags: JSON.stringify(["Canada", "visa"]) },
    { title: "SOP Writing Masterclass", type: "RECORDED_TRAINING", duration: 75, enrolledCount: 18, completedCount: 14, certificateEnabled: true, tags: JSON.stringify(["SOP", "writing"]) },
    { title: "CRM System Training", type: "RECORDED_TRAINING", duration: 40, enrolledCount: 20, completedCount: 18, certificateEnabled: false, tags: JSON.stringify(["CRM", "system"]) },
    { title: "AI Tools Training — Interview Practice", type: "RECORDED_TRAINING", duration: 30, enrolledCount: 8, completedCount: 5, certificateEnabled: true, tags: JSON.stringify(["AI", "interview"]) },
    { title: "Sales Training — Closing Techniques", type: "SALES_TRAINING", duration: 55, enrolledCount: 14, completedCount: 10, certificateEnabled: true, tags: JSON.stringify(["sales", "closing"]) },
    { title: "Visa Refusal Analysis Training", type: "VISA_TRAINING", duration: 65, enrolledCount: 6, completedCount: 4, certificateEnabled: true, tags: JSON.stringify(["visa", "refusal"]) },
    { title: "Employee Handbook Quiz", type: "QUIZ", duration: 15, enrolledCount: 20, completedCount: 17, passScore: 80, certificateEnabled: true, tags: JSON.stringify(["handbook", "quiz"]) },
    { title: "Marketing Training — Social Media Best Practices", type: "RECORDED_TRAINING", duration: 35, enrolledCount: 5, completedCount: 3, certificateEnabled: false, tags: JSON.stringify(["marketing", "social"]) },
  ];
  for (const t of trainings) {
    await db.trainingMaterial.create({ data: { ...t, description: `${t.title} — comprehensive training module for ALO Education staff.`, status: "ACTIVE" } });
  }

  // ─── AI Agent Registry (19 agents) ───
  const agents = [
    { agentCode: "AI-ADM-001", agentName: "Admissions Agent", agentType: "ADMISSIONS", description: "Handles admission queries, eligibility checks, and application guidance", promptTemplate: "You are the ALO Admissions Agent. Help with admission requirements, deadlines, and application processes.", dailyRequests: 45, monthlyRequests: 1350, totalRequests: 5400, successRate: 96.5, avgResponseTime: 1200 },
    { agentCode: "AI-VIS-002", agentName: "Visa Agent", agentType: "VISA", description: "Provides visa guidance, document checklists, and refusal analysis", promptTemplate: "You are the ALO Visa Agent. Provide accurate visa guidance based on official sources.", dailyRequests: 38, monthlyRequests: 1140, totalRequests: 4560, successRate: 94.2, avgResponseTime: 1500 },
    { agentCode: "AI-CRS-003", agentName: "Course Recommendation Agent", agentType: "COURSE_RECOMMENDATION", description: "Matches students with suitable courses based on profile", promptTemplate: "You are the ALO Course Recommendation Agent. Analyze student profile and recommend suitable courses.", dailyRequests: 62, monthlyRequests: 1860, totalRequests: 7440, successRate: 97.8, avgResponseTime: 900 },
    { agentCode: "AI-SCH-004", agentName: "Scholarship Agent", agentType: "SCHOLARSHIP", description: "Finds and matches scholarships for eligible students", promptTemplate: "You are the ALO Scholarship Agent. Find scholarships matching the student's profile.", dailyRequests: 25, monthlyRequests: 750, totalRequests: 3000, successRate: 95.0, avgResponseTime: 1100 },
    { agentCode: "AI-UNI-005", agentName: "University Matching Agent", agentType: "UNIVERSITY_MATCHING", description: "Matches students with universities based on academic profile and preferences", promptTemplate: "You are the ALO University Matching Agent. Match students with suitable universities.", dailyRequests: 40, monthlyRequests: 1200, totalRequests: 4800, successRate: 96.0, avgResponseTime: 1000 },
    { agentCode: "AI-LDQ-006", agentName: "Lead Qualification Agent", agentType: "LEAD_QUALIFICATION", description: "Qualifies leads based on profile, budget, and intent", promptTemplate: "You are the ALO Lead Qualification Agent. Score and qualify incoming leads.", dailyRequests: 55, monthlyRequests: 1650, totalRequests: 6600, successRate: 93.5, avgResponseTime: 800 },
    { agentCode: "AI-CRM-007", agentName: "CRM Assistant", agentType: "CRM_ASSISTANT", description: "Helps with CRM operations, student profiles, and timeline", promptTemplate: "You are the ALO CRM Assistant. Help with CRM data, student profiles, and application tracking.", dailyRequests: 70, monthlyRequests: 2100, totalRequests: 8400, successRate: 98.0, avgResponseTime: 600 },
    { agentCode: "AI-MKT-008", agentName: "Marketing Agent", agentType: "MARKETING", description: "Generates marketing content, captions, and campaign ideas", promptTemplate: "You are the ALO Marketing Agent. Generate marketing content following ALO brand guidelines.", dailyRequests: 30, monthlyRequests: 900, totalRequests: 3600, successRate: 95.5, avgResponseTime: 2000 },
    { agentCode: "AI-CNT-009", agentName: "Content Agent", agentType: "CONTENT", description: "Writes blog posts, articles, and website content", promptTemplate: "You are the ALO Content Agent. Write original, SEO-optimized content for the ALO website.", dailyRequests: 15, monthlyRequests: 450, totalRequests: 1800, successRate: 94.0, avgResponseTime: 3000 },
    { agentCode: "AI-SEO-010", agentName: "SEO Agent", agentType: "SEO", description: "Optimizes content for search engines and provides SEO recommendations", promptTemplate: "You are the ALO SEO Agent. Provide SEO optimization recommendations.", dailyRequests: 10, monthlyRequests: 300, totalRequests: 1200, successRate: 92.0, avgResponseTime: 1500 },
    { agentCode: "AI-TRN-011", agentName: "Translation Agent", agentType: "TRANSLATION", description: "Translates content between English and Bangla", promptTemplate: "You are the ALO Translation Agent. Translate between English and Bangla accurately.", dailyRequests: 20, monthlyRequests: 600, totalRequests: 2400, successRate: 97.0, avgResponseTime: 500 },
    { agentCode: "AI-OCR-012", agentName: "Document OCR Agent", agentType: "DOCUMENT_OCR", description: "Extracts text from documents, classifies type, and auto-fills profiles", promptTemplate: "You are the ALO Document OCR Agent. Extract data from documents and classify them.", dailyRequests: 35, monthlyRequests: 1050, totalRequests: 4200, successRate: 91.5, avgResponseTime: 2500 },
    { agentCode: "AI-EML-013", agentName: "Email Agent", agentType: "EMAIL", description: "Drafts and sends emails for various purposes", promptTemplate: "You are the ALO Email Agent. Draft professional emails for student communication.", dailyRequests: 28, monthlyRequests: 840, totalRequests: 3360, successRate: 96.0, avgResponseTime: 1000 },
    { agentCode: "AI-WHT-014", agentName: "WhatsApp Agent", agentType: "WHATSAPP", description: "Handles WhatsApp conversations, auto-replies, and lead capture", promptTemplate: "You are the ALO WhatsApp Agent. Handle WhatsApp messages professionally in English and Bangla.", dailyRequests: 85, monthlyRequests: 2550, totalRequests: 10200, successRate: 97.5, avgResponseTime: 700 },
    { agentCode: "AI-ANL-015", agentName: "Analytics Agent", agentType: "ANALYTICS", description: "Analyzes data and provides insights", promptTemplate: "You are the ALO Analytics Agent. Analyze CRM data and provide actionable insights.", dailyRequests: 12, monthlyRequests: 360, totalRequests: 1440, successRate: 93.0, avgResponseTime: 2000 },
    { agentCode: "AI-RPT-016", agentName: "Reporting Agent", agentType: "REPORTING", description: "Generates daily, weekly, and monthly reports", promptTemplate: "You are the ALO Reporting Agent. Generate comprehensive reports from CRM data.", dailyRequests: 8, monthlyRequests: 240, totalRequests: 960, successRate: 95.0, avgResponseTime: 1800 },
    { agentCode: "AI-INT-017", agentName: "Interview Coach", agentType: "INTERVIEW_COACH", description: "Conducts mock interviews and provides feedback", promptTemplate: "You are the ALO Interview Coach. Conduct realistic mock interviews and score performance.", dailyRequests: 18, monthlyRequests: 540, totalRequests: 2160, successRate: 96.5, avgResponseTime: 3000 },
    { agentCode: "AI-TRG-018", agentName: "Training Agent", agentType: "TRAINING", description: "Provides training content and quizzes for employees", promptTemplate: "You are the ALO Training Agent. Create training materials and quizzes for employees.", dailyRequests: 5, monthlyRequests: 150, totalRequests: 600, successRate: 94.0, avgResponseTime: 2200 },
    { agentCode: "AI-KNS-019", agentName: "Knowledge Search Agent", agentType: "KNOWLEDGE_SEARCH", description: "Searches Knowledge Center and provides answers with document links", promptTemplate: "You are the ALO Knowledge Search Agent. Search the Knowledge Center and provide accurate answers with source documents.", dailyRequests: 22, monthlyRequests: 660, totalRequests: 2640, successRate: 92.5, avgResponseTime: 1200 },
  ];
  for (const a of agents) {
    await db.aiAgentRegistry.create({
      data: {
        ...a,
        status: "ACTIVE",
        version: "1.0.0",
        apiUsed: "z-ai-web-dev-sdk",
        fallbackApi: "openai",
        config: JSON.stringify({ temperature: 0.7, maxTokens: 2000 }),
        lastExecutedAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
        executionLog: JSON.stringify([{ time: new Date().toISOString(), status: "SUCCESS", duration: a.avgResponseTime }]),
      },
    });
  }

  console.log("Knowledge Center + AI Registry seed complete!");
  console.log(`- Knowledge categories: ${await db.knowledgeCategory.count()}`);
  console.log(`- Knowledge documents: ${await db.knowledgeDocument.count()}`);
  console.log(`- Knowledge news: ${await db.knowledgeNews.count()}`);
  console.log(`- Training materials: ${await db.trainingMaterial.count()}`);
  console.log(`- AI agent registry: ${await db.aiAgentRegistry.count()}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
