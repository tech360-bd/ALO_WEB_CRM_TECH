import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Department definitions ──────────────────────────────────────────────────

interface DeptDef {
  name: string
  code: string
  category: string
  description: string
}

const departments: DeptDef[] = [
  // OPERATIONS (20)
  { name: 'Lead Management', code: 'LEAD_MGMT', category: 'OPERATIONS', description: 'Manages lead lifecycle from capture to conversion' },
  { name: 'Student Support', code: 'STUDENT_SUPPORT', category: 'OPERATIONS', description: 'Provides end-to-end support for enrolled students' },
  { name: 'Application Processing', code: 'APP_PROCESSING', category: 'OPERATIONS', description: 'Handles university application submissions and tracking' },
  { name: 'Document Processing', code: 'DOC_PROCESSING', category: 'OPERATIONS', description: 'Processes student documents for applications and visas' },
  { name: 'Visa Support', code: 'VISA_SUPPORT', category: 'OPERATIONS', description: 'Assists students with visa applications and compliance' },
  { name: 'Offer Management', code: 'OFFER_MGMT', category: 'OPERATIONS', description: 'Manages university offer letters and conditions' },
  { name: 'CAS Management', code: 'CAS_MGMT', category: 'OPERATIONS', description: 'Handles CAS letter requests and issuance tracking' },
  { name: 'Enrollment', code: 'ENROLLMENT', category: 'OPERATIONS', description: 'Manages student enrollment and registration processes' },
  { name: 'Partner Management', code: 'PARTNER_MGMT', category: 'OPERATIONS', description: 'Manages recruitment partner relationships' },
  { name: 'Agent Management', code: 'AGENT_MGMT', category: 'OPERATIONS', description: 'Oversees sub-agent performance and allocation' },
  { name: 'Interview Scheduling', code: 'INTERVIEW_SCHED', category: 'OPERATIONS', description: 'Schedules and manages student interviews' },
  { name: 'University Relations', code: 'UNIV_RELATIONS', category: 'OPERATIONS', description: 'Maintains relationships with partner universities' },
  { name: 'Scholarship Management', code: 'SCHOLARSHIP_MGMT', category: 'OPERATIONS', description: 'Manages scholarship opportunities and applications' },
  { name: 'Course Management', code: 'COURSE_MGMT', category: 'OPERATIONS', description: 'Manages course catalog and availability' },
  { name: 'Country Operations', code: 'COUNTRY_OPS', category: 'OPERATIONS', description: 'Oversees operations across target countries' },
  { name: 'Compliance', code: 'COMPLIANCE', category: 'OPERATIONS', description: 'Ensures regulatory compliance across all operations' },
  { name: 'Quality Assurance', code: 'QA', category: 'OPERATIONS', description: 'Maintains quality standards across services' },
  { name: 'Operations Coordination', code: 'OPS_COORD', category: 'OPERATIONS', description: 'Coordinates cross-departmental operational activities' },
  { name: 'Workflow Management', code: 'WORKFLOW_MGMT', category: 'OPERATIONS', description: 'Designs and manages operational workflows' },
  { name: 'Process Optimization', code: 'PROCESS_OPT', category: 'OPERATIONS', description: 'Identifies and implements process improvements' },

  // SUPPORT (15)
  { name: 'Customer Support', code: 'CUSTOMER_SUPPORT', category: 'SUPPORT', description: 'Provides frontline customer assistance' },
  { name: 'Technical Support', code: 'TECH_SUPPORT', category: 'SUPPORT', description: 'Resolves technical issues for students and staff' },
  { name: 'FAQ Management', code: 'FAQ_MGMT', category: 'SUPPORT', description: 'Maintains and updates FAQ knowledge base' },
  { name: 'Onboarding', code: 'ONBOARDING', category: 'SUPPORT', description: 'Manages new student and partner onboarding' },
  { name: 'Appointment Scheduling', code: 'APPT_SCHED', category: 'SUPPORT', description: 'Schedules appointments for consultations' },
  { name: 'Document Guidance', code: 'DOC_GUIDANCE', category: 'SUPPORT', description: 'Guides students through document requirements' },
  { name: 'Application Tracking', code: 'APP_TRACKING', category: 'SUPPORT', description: 'Tracks and reports on application progress' },
  { name: 'Status Inquiries', code: 'STATUS_INQUIRY', category: 'SUPPORT', description: 'Handles student status inquiry requests' },
  { name: 'General Inquiries', code: 'GENERAL_INQ', category: 'SUPPORT', description: 'Addresses general student and partner inquiries' },
  { name: 'Complaint Handling', code: 'COMPLAINT', category: 'SUPPORT', description: 'Manages and resolves student complaints' },
  { name: 'Feedback Collection', code: 'FEEDBACK', category: 'SUPPORT', description: 'Collects and processes student feedback' },
  { name: 'Knowledge Base', code: 'KNOWLEDGE_BASE', category: 'SUPPORT', description: 'Maintains organizational knowledge base' },
  { name: 'Training Support', code: 'TRAINING_SUPPORT', category: 'SUPPORT', description: 'Provides training resources and support' },
  { name: 'Account Support', code: 'ACCOUNT_SUPPORT', category: 'SUPPORT', description: 'Assists with account-related issues' },
  { name: 'Multi-language Support', code: 'MULTI_LANG', category: 'SUPPORT', description: 'Provides support in multiple languages' },

  // CRM (10)
  { name: 'Lead Classification', code: 'LEAD_CLASSIFY', category: 'CRM', description: 'Classifies incoming leads by type and source' },
  { name: 'Lead Scoring', code: 'LEAD_SCORING', category: 'CRM', description: 'Scores leads based on conversion probability' },
  { name: 'Lead Tagging', code: 'LEAD_TAGGING', category: 'CRM', description: 'Applies relevant tags to leads for segmentation' },
  { name: 'Lead Routing', code: 'LEAD_ROUTING', category: 'CRM', description: 'Routes leads to appropriate counsellors' },
  { name: 'Follow-up Management', code: 'FOLLOWUP_MGMT', category: 'CRM', description: 'Manages lead follow-up schedules and actions' },
  { name: 'Pipeline Analysis', code: 'PIPELINE_ANALYSIS', category: 'CRM', description: 'Analyzes sales pipeline health and performance' },
  { name: 'Lead Enrichment', code: 'LEAD_ENRICHMENT', category: 'CRM', description: 'Enriches lead data with additional information' },
  { name: 'Conversation Classification', code: 'CONVO_CLASSIFY', category: 'CRM', description: 'Classifies customer conversations by intent' },
  { name: 'SLA Monitoring', code: 'SLA_MONITOR', category: 'CRM', description: 'Monitors SLA compliance for lead responses' },
  { name: 'Inactive Lead Detection', code: 'INACTIVE_DETECT', category: 'CRM', description: 'Detects and flags inactive leads for re-engagement' },

  // MARKETING (10)
  { name: 'Marketing Strategy', code: 'MKT_STRATEGY', category: 'MARKETING', description: 'Develops and executes marketing strategies' },
  { name: 'SEO Operations', code: 'SEO_OPS', category: 'MARKETING', description: 'Manages SEO optimization and keyword targeting' },
  { name: 'Content Production', code: 'CONTENT_PROD', category: 'MARKETING', description: 'Produces marketing content across channels' },
  { name: 'Social Media', code: 'SOCIAL_MEDIA', category: 'MARKETING', description: 'Manages social media presence and engagement' },
  { name: 'Email Marketing', code: 'EMAIL_MKT', category: 'MARKETING', description: 'Designs and executes email marketing campaigns' },
  { name: 'WhatsApp Marketing', code: 'WA_MKT', category: 'MARKETING', description: 'Manages WhatsApp-based marketing campaigns' },
  { name: 'Campaign Management', code: 'CAMPAIGN_MGMT', category: 'MARKETING', description: 'Plans and manages marketing campaigns' },
  { name: 'Analytics Reporting', code: 'ANALYTICS_RPT', category: 'MARKETING', description: 'Generates marketing analytics reports' },
  { name: 'Brand Management', code: 'BRAND_MGMT', category: 'MARKETING', description: 'Maintains and protects brand identity' },
  { name: 'Market Research', code: 'MARKET_RESEARCH', category: 'MARKETING', description: 'Conducts market research and competitive analysis' },

  // CONTENT (8)
  { name: 'Blog Writing', code: 'BLOG_WRITE', category: 'CONTENT', description: 'Writes blog articles for the education platform' },
  { name: 'Content Editing', code: 'CONTENT_EDIT', category: 'CONTENT', description: 'Edits and proofreads content for quality' },
  { name: 'Content SEO', code: 'CONTENT_SEO', category: 'CONTENT', description: 'Optimizes content for search engine rankings' },
  { name: 'Content Calendar', code: 'CONTENT_CAL', category: 'CONTENT', description: 'Manages content publishing schedule' },
  { name: 'Video Scripts', code: 'VIDEO_SCRIPTS', category: 'CONTENT', description: 'Creates scripts for video content' },
  { name: 'Infographic Design', code: 'INFOGRAPHIC', category: 'CONTENT', description: 'Designs infographics for educational content' },
  { name: 'Newsletter Production', code: 'NEWSLETTER', category: 'CONTENT', description: 'Produces newsletters for subscribers' },
  { name: 'Academic Content', code: 'ACADEMIC_CONTENT', category: 'CONTENT', description: 'Creates academic-focused content and guides' },

  // ANALYTICS (8)
  { name: 'Data Analytics', code: 'DATA_ANALYTICS', category: 'ANALYTICS', description: 'Performs data analysis across business domains' },
  { name: 'Business Intelligence', code: 'BI', category: 'ANALYTICS', description: 'Generates business intelligence insights' },
  { name: 'KPI Monitoring', code: 'KPI_MONITOR', category: 'ANALYTICS', description: 'Tracks and monitors key performance indicators' },
  { name: 'Anomaly Detection', code: 'ANOMALY_DET', category: 'ANALYTICS', description: 'Detects anomalies in business data' },
  { name: 'Performance Reporting', code: 'PERF_REPORT', category: 'ANALYTICS', description: 'Generates performance reports for stakeholders' },
  { name: 'Conversion Analytics', code: 'CONV_ANALYTICS', category: 'ANALYTICS', description: 'Analyzes conversion funnels and rates' },
  { name: 'Trend Analysis', code: 'TREND_ANALYSIS', category: 'ANALYTICS', description: 'Identifies and analyzes business trends' },
  { name: 'Predictive Analytics', code: 'PREDICTIVE', category: 'ANALYTICS', description: 'Uses predictive models for business forecasting' },

  // FINANCE (5)
  { name: 'Invoice Management', code: 'INVOICE_MGMT', category: 'FINANCE', description: 'Manages invoice creation and tracking' },
  { name: 'Payment Processing', code: 'PAYMENT_PROC', category: 'FINANCE', description: 'Processes student payments and refunds' },
  { name: 'Commission Tracking', code: 'COMMISSION_TRACK', category: 'FINANCE', description: 'Tracks agent and partner commissions' },
  { name: 'Refund Processing', code: 'REFUND_PROC', category: 'FINANCE', description: 'Handles refund requests and processing' },
  { name: 'Financial Reporting', code: 'FIN_REPORT', category: 'FINANCE', description: 'Generates financial reports and summaries' },

  // TECHNOLOGY (8)
  { name: 'Platform Development', code: 'PLATFORM_DEV', category: 'TECHNOLOGY', description: 'Develops and maintains the ALO platform' },
  { name: 'API Management', code: 'API_MGMT', category: 'TECHNOLOGY', description: 'Manages API endpoints and integrations' },
  { name: 'Database Operations', code: 'DB_OPS', category: 'TECHNOLOGY', description: 'Manages database health and operations' },
  { name: 'Security Operations', code: 'SEC_OPS', category: 'TECHNOLOGY', description: 'Monitors and enforces security policies' },
  { name: 'Infrastructure', code: 'INFRASTRUCTURE', category: 'TECHNOLOGY', description: 'Manages cloud and server infrastructure' },
  { name: 'Integration Management', code: 'INTEGRATION_MGMT', category: 'TECHNOLOGY', description: 'Manages third-party integrations' },
  { name: 'AI System Operations', code: 'AI_SYS_OPS', category: 'TECHNOLOGY', description: 'Operates and maintains AI systems' },
  { name: 'Monitoring & Alerting', code: 'MONITORING', category: 'TECHNOLOGY', description: 'Monitors systems and manages alerts' },

  // AI_OPS (6)
  { name: 'AI Model Management', code: 'AI_MODEL_MGMT', category: 'AI_OPS', description: 'Manages AI model lifecycle and versions' },
  { name: 'Prompt Engineering', code: 'PROMPT_ENG', category: 'AI_OPS', description: 'Designs and optimizes AI prompts' },
  { name: 'RAG Operations', code: 'RAG_OPS', category: 'AI_OPS', description: 'Manages retrieval-augmented generation pipelines' },
  { name: 'Agent Performance', code: 'AGENT_PERF', category: 'AI_OPS', description: 'Monitors and optimizes AI agent performance' },
  { name: 'AI Safety', code: 'AI_SAFETY', category: 'AI_OPS', description: 'Ensures AI safety and compliance' },
  { name: 'AI Audit', code: 'AI_AUDIT', category: 'AI_OPS', description: 'Conducts AI system audits and reviews' },

  // COMMUNICATION (6)
  { name: 'Email Operations', code: 'EMAIL_OPS', category: 'COMMUNICATION', description: 'Manages transactional and marketing emails' },
  { name: 'SMS Operations', code: 'SMS_OPS', category: 'COMMUNICATION', description: 'Manages SMS notifications and campaigns' },
  { name: 'WhatsApp Operations', code: 'WA_OPS', category: 'COMMUNICATION', description: 'Manages WhatsApp messaging operations' },
  { name: 'Notification Management', code: 'NOTIF_MGMT', category: 'COMMUNICATION', description: 'Manages multi-channel notifications' },
  { name: 'Communication Analytics', code: 'COMM_ANALYTICS', category: 'COMMUNICATION', description: 'Analyzes communication channel performance' },
  { name: 'Template Management', code: 'TEMPLATE_MGMT', category: 'COMMUNICATION', description: 'Manages communication message templates' },

  // HR (4)
  { name: 'Employee Onboarding', code: 'HR_ONBOARDING', category: 'HR', description: 'Manages new employee onboarding processes' },
  { name: 'Training', code: 'HR_TRAINING', category: 'HR', description: 'Manages employee training programs' },
  { name: 'Attendance', code: 'HR_ATTENDANCE', category: 'HR', description: 'Tracks employee attendance and schedules' },
  { name: 'Performance Review', code: 'HR_PERF_REVIEW', category: 'HR', description: 'Manages employee performance reviews' },
]

// ── Agent roles (cycle through for each department) ────────────────────────

const ROLES = [
  'CLASSIFIER', 'RESEARCHER', 'DRAFTER', 'ROUTER', 'MONITOR',
  'SUMMARIZER', 'CHECKER', 'COMMUNICATOR', 'ANALYZER', 'OPTIMIZER',
  'COORDINATOR', 'EXECUTOR', 'REVIEWER', 'REPORTER', 'NOTIFIER',
  'REMINDER', 'SCORER', 'ENRICHER', 'DETECTOR', 'RESOLVER',
] as const

type Role = (typeof ROLES)[number]

// ── Role → human-readable name mapping ──────────────────────────────────────

const ROLE_DISPLAY: Record<Role, string> = {
  CLASSIFIER: 'Classifier',
  RESEARCHER: 'Researcher',
  DRAFTER: 'Drafter',
  ROUTER: 'Router',
  MONITOR: 'Monitor',
  SUMMARIZER: 'Summarizer',
  CHECKER: 'Checker',
  COMMUNICATOR: 'Communicator',
  ANALYZER: 'Analyzer',
  OPTIMIZER: 'Optimizer',
  COORDINATOR: 'Coordinator',
  EXECUTOR: 'Executor',
  REVIEWER: 'Reviewer',
  REPORTER: 'Reporter',
  NOTIFIER: 'Notifier',
  REMINDER: 'Reminder',
  SCORER: 'Scorer',
  ENRICHER: 'Enricher',
  DETECTOR: 'Detector',
  RESOLVER: 'Resolver',
}

// ── Automation class by department category ─────────────────────────────────

function getAutomationClass(category: string): string {
  const autoCategories = ['OPERATIONS', 'SUPPORT', 'CRM', 'ANALYTICS', 'AI_OPS', 'TECHNOLOGY', 'COMMUNICATION']
  const assistedCategories = ['MARKETING', 'CONTENT']
  const approvalCategories = ['FINANCE', 'HR']

  if (autoCategories.includes(category)) return 'AI_AUTOMATABLE'
  if (assistedCategories.includes(category)) return 'AI_ASSISTED'
  if (approvalCategories.includes(category)) return 'AI_APPROVAL_REQUIRED'
  return 'AI_AUTOMATABLE'
}

// ── Approval policy by department category ──────────────────────────────────

function getApprovalPolicy(category: string, role: string): string {
  // High-risk categories need human approval for most roles
  if (['FINANCE', 'HR'].includes(category)) return 'HUMAN_APPROVAL'
  // EXECUTOR and REVIEWER roles always need some approval
  if (['EXECUTOR', 'REVIEWER'].includes(role)) return 'MANAGER_APPROVAL'
  // MARKETING and CONTENT need manager approval for exec/review
  if (['MARKETING', 'CONTENT'].includes(category) && ['DRAFTER', 'COMMUNICATOR', 'NOTIFIER'].includes(role)) {
    return 'MANAGER_APPROVAL'
  }
  return 'AUTO'
}

// ── Tool pool ───────────────────────────────────────────────────────────────

const ALL_TOOLS = [
  'searchCourses',
  'searchUniversities',
  'searchScholarships',
  'getStudent',
  'getLead',
  'createCrmNote',
  'createTask',
  'sendNotification',
  'getClassification',
  'summarizeText',
]

// ── Skill pools by category ─────────────────────────────────────────────────

const SKILL_POOLS: Record<string, string[][]> = {
  OPERATIONS: [
    ['lead qualification', 'data entry validation', 'compliance checking'],
    ['document verification', 'deadline tracking', 'status reporting'],
    ['university research', 'course matching', 'requirement analysis'],
    ['workflow automation', 'process monitoring', 'escalation handling'],
  ],
  SUPPORT: [
    ['customer empathy', 'problem diagnosis', 'solution recommendation'],
    ['multilingual communication', 'FAQ retrieval', 'ticket routing'],
    ['onboarding guidance', 'document assistance', 'appointment booking'],
  ],
  CRM: [
    ['lead scoring', 'segmentation analysis', 'pipeline management'],
    ['conversation analysis', 'SLA tracking', 'follow-up scheduling'],
    ['data enrichment', 'intent classification', 'engagement scoring'],
  ],
  MARKETING: [
    ['campaign planning', 'audience targeting', 'content strategy'],
    ['SEO optimization', 'social media management', 'analytics reporting'],
    ['A/B testing', 'brand messaging', 'market analysis'],
  ],
  CONTENT: [
    ['blog writing', 'copy editing', 'SEO writing'],
    ['content strategy', 'editorial planning', 'audience analysis'],
    ['video scripting', 'graphic design briefs', 'newsletter writing'],
  ],
  ANALYTICS: [
    ['data analysis', 'statistical modeling', 'report generation'],
    ['anomaly detection', 'trend identification', 'KPI tracking'],
    ['predictive modeling', 'business intelligence', 'data visualization'],
  ],
  FINANCE: [
    ['invoice processing', 'payment reconciliation', 'commission calculation'],
    ['financial reporting', 'refund processing', 'compliance auditing'],
  ],
  TECHNOLOGY: [
    ['system monitoring', 'API management', 'security scanning'],
    ['infrastructure management', 'database optimization', 'incident response'],
  ],
  AI_OPS: [
    ['prompt engineering', 'model evaluation', 'safety monitoring'],
    ['RAG pipeline management', 'agent orchestration', 'performance tuning'],
  ],
  COMMUNICATION: [
    ['template design', 'delivery optimization', 'engagement tracking'],
    ['multi-channel management', 'analytics reporting', 'audience segmentation'],
  ],
  HR: [
    ['employee onboarding', 'training coordination', 'attendance tracking'],
    ['performance evaluation', 'compliance checking', 'record management'],
  ],
}

// ── Tool selection by role ──────────────────────────────────────────────────

function pickTools(role: Role, category: string): string[] {
  // Determine relevant tools based on role
  let pool: string[] = []

  if (['CLASSIFIER', 'CONVO_CLASSIFY'].includes(role)) pool = ['getClassification', 'getLead', 'getStudent']
  else if (role === 'RESEARCHER') pool = ['searchCourses', 'searchUniversities', 'searchScholarships']
  else if (role === 'DRAFTER') pool = ['summarizeText', 'getStudent', 'getLead']
  else if (role === 'ROUTER') pool = ['getLead', 'createTask', 'sendNotification']
  else if (role === 'MONITOR') pool = ['getLead', 'getStudent', 'createTask']
  else if (role === 'SUMMARIZER') pool = ['summarizeText', 'getStudent', 'getLead']
  else if (role === 'CHECKER') pool = ['getStudent', 'getLead', 'searchUniversities']
  else if (role === 'COMMUNICATOR') pool = ['sendNotification', 'getStudent', 'getLead']
  else if (role === 'ANALYZER') pool = ['getLead', 'getStudent', 'getClassification']
  else if (role === 'OPTIMIZER') pool = ['getLead', 'createCrmNote', 'summarizeText']
  else if (role === 'COORDINATOR') pool = ['createTask', 'sendNotification', 'getLead']
  else if (role === 'EXECUTOR') pool = ['createTask', 'createCrmNote', 'sendNotification']
  else if (role === 'REVIEWER') pool = ['getStudent', 'getLead', 'summarizeText']
  else if (role === 'REPORTER') pool = ['summarizeText', 'getLead', 'getClassification']
  else if (role === 'NOTIFIER') pool = ['sendNotification', 'getStudent', 'getLead']
  else if (role === 'REMINDER') pool = ['sendNotification', 'createTask', 'getLead']
  else if (role === 'SCORER') pool = ['getLead', 'getClassification', 'createCrmNote']
  else if (role === 'ENRICHER') pool = ['searchUniversities', 'searchCourses', 'getLead']
  else if (role === 'DETECTOR') pool = ['getLead', 'getClassification', 'summarizeText']
  else if (role === 'RESOLVER') pool = ['getLead', 'getStudent', 'createCrmNote']
  else pool = ['getLead', 'getStudent']

  // Pick 2-3 tools
  const count = 2 + (role === 'RESEARCHER' || role === 'MONITOR' ? 1 : 0)
  return pool.slice(0, Math.min(count, pool.length))
}

// ── Skill selection by category and role ────────────────────────────────────

function pickSkills(category: string, _role: Role): string[] {
  const pools = SKILL_POOLS[category] || SKILL_POOLS['OPERATIONS']
  const pool = pools[Math.floor(Math.random() * pools.length)]
  // Pick 2-4 skills
  const count = 2 + Math.floor(Math.random() * 3)
  return pool.slice(0, Math.min(count, pool.length))
}

// ── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log('=== ALO Education AI Workforce Seed ===')
  console.log(`Seeding ${departments.length} departments...`)

  // 1. Upsert all departments
  let deptCount = 0
  for (let i = 0; i < departments.length; i++) {
    const d = departments[i]
    await prisma.aiDepartment.upsert({
      where: { code: d.code },
      update: {
        name: d.name,
        description: d.description,
        category: d.category,
        sortOrder: i,
      },
      create: {
        name: d.name,
        code: d.code,
        description: d.description,
        category: d.category,
        sortOrder: i,
        status: 'ACTIVE',
      },
    })
    deptCount++
    if (deptCount % 20 === 0) console.log(`  Departments: ${deptCount}/${departments.length}`)
  }
  console.log(`  Departments done: ${deptCount}`)

  // 2. Fetch all departments for agent linking
  const allDepts = await prisma.aiDepartment.findMany({ orderBy: { sortOrder: 'asc' } })
  const deptMap = new Map(allDepts.map(d => [d.code, d.id]))

  console.log(`\nSeeding ${departments.length * 20} agents...`)

  // Build all agent records first
  const agentRecords: Array<{
    name: string
    departmentId: string
    department: string
    role: string
    code: string
    model: string
    status: string
    approvalPolicy: string
    skills: string
    tools: string
    safetyMaxSteps: number
    safetyMaxRuntimeMs: number
    safetyMaxToolCalls: number
    safetyMaxRetries: number
    safetyMaxTokens: number
    memoryPolicy: string
    modelPolicy: string
  }> = []

  for (const dept of departments) {
    const departmentId = deptMap.get(dept.code)!

    for (let j = 0; j < 20; j++) {
      const role = ROLES[j]
      const agentCode = `${dept.code}_AGENT_${String(j + 1).padStart(3, '0')}`
      const agentName = `${dept.name} ${ROLE_DISPLAY[role]} Agent`
      const tools = pickTools(role, dept.category)
      const skills = pickSkills(dept.category, role)
      const approvalPolicy = getApprovalPolicy(dept.category, role)

      agentRecords.push({
        name: agentName,
        departmentId,
        department: dept.name,
        role,
        code: agentCode,
        model: 'llama-3.3-70b-versatile',
        status: 'IDLE',
        approvalPolicy,
        skills: JSON.stringify(skills),
        tools: JSON.stringify(tools),
        safetyMaxSteps: 10,
        safetyMaxRuntimeMs: 30000,
        safetyMaxToolCalls: 20,
        safetyMaxRetries: 3,
        safetyMaxTokens: 4096,
        memoryPolicy: 'CONVERSATION',
        modelPolicy: 'GROQ_DEFAULT',
      })
    }
  }

  // Delete existing agents and bulk insert (handles re-runs gracefully)
  const existingAgentCount = await prisma.aiAgent.count()
  if (existingAgentCount > 0) {
    console.log(`  Removing ${existingAgentCount} existing agents...`)
    await prisma.aiAgent.deleteMany({})
  }

  // Insert in batches of 100 (SQLite limit friendly)
  const BATCH_SIZE = 100
  for (let i = 0; i < agentRecords.length; i += BATCH_SIZE) {
    const batch = agentRecords.slice(i, i + BATCH_SIZE)
    await prisma.aiAgent.createMany({ data: batch })
    console.log(`  Agents: ${Math.min(i + BATCH_SIZE, agentRecords.length)}/${agentRecords.length}`)
  }
  console.log(`  Agents done: ${agentRecords.length}`)

  // 3. Upsert 3 AutomationWorkflows
  console.log('\nSeeding 3 automation workflows...')

  const workflows = [
    { name: 'new-lead-automation', trigger: 'MANUAL', status: 'ACTIVE' },
    { name: 'document-reminder', trigger: 'MANUAL', status: 'ACTIVE' },
    { name: 'inactive-lead-detection', trigger: 'MANUAL', status: 'ACTIVE' },
  ]

  for (const w of workflows) {
    await prisma.automationWorkflow.upsert({
      where: { name: w.name },
      update: { trigger: w.trigger, status: w.status },
      create: {
        name: w.name,
        trigger: w.trigger,
        actions: '[]',
        status: w.status,
      },
    })
    console.log(`  Workflow: ${w.name}`)
  }

  // 4. Upsert 1 AiWorkforceSnapshot for today
  const today = new Date().toISOString().slice(0, 10)
  console.log(`\nSeeding AiWorkforceSnapshot for ${today}...`)

  await prisma.aiWorkforceSnapshot.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      totalAgents: 0,
      activeAgents: 0,
      idleAgents: 0,
      busyAgents: 0,
      failedAgents: 0,
      totalTasks: 0,
      aiAutomated: 0,
      aiAssisted: 0,
      humanRequired: 0,
      approvalReq: 0,
      escalated: 0,
      automationRate: 0,
      humanRate: 0,
      targetRate: 70.0,
      groqRequests: 0,
      localAiRequests: 0,
      fallbackRequests: 0,
      queueDepth: 0,
      successRate: 0,
      failureRate: 0,
    },
  })
  console.log(`  Snapshot created for ${today}`)

  // 5. Print final counts
  console.log('\n=== Seed Complete — Final Counts ===')
  const deptFinal = await prisma.aiDepartment.count()
  const agentFinal = await prisma.aiAgent.count()
  const workflowFinal = await prisma.automationWorkflow.count()
  const snapshotFinal = await prisma.aiWorkforceSnapshot.count()

  console.log(`Departments: ${deptFinal}`)
  console.log(`Agents: ${agentFinal}`)
  console.log(`Workflows: ${workflowFinal}`)
  console.log(`Snapshots: ${snapshotFinal}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})
