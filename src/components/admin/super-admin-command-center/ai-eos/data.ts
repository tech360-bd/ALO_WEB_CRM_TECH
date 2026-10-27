/**
 * ALO Labs AI-EOS Master Blueprint — catalog data.
 *
 * Port of the "ALO Labs AI-EOS Master Blueprint" blueprint
 * (ai-eos-master-blueprint.html): 4 execution streams, a 52-week roadmap,
 * 10 deliverables, 15 strategic recommendations, 4 mobile apps and the
 * 100-department / 2,000-agent deployment plan.
 */

export type Phase = "A" | "B" | "C" | "D";

export interface EosDepartment {
  id: string;
  name: string;
  phase: Phase;
  agents: number;
  roles: string;
  week: string;
  features: string[];
}

export const EOS_DEPARTMENTS: EosDepartment[] = [
  { id: "DEPT-001", name: "Customer Success", phase: "A", agents: 25, roles: "1 Director, 3 Managers, 5 Sr. Specialists, 8 Specialists, 8 Support Agents", week: "1-4", features: ["24/7 support", "Bengali+English", "CRM integration", "WhatsApp", "Escalation protocols"] },
  { id: "DEPT-002", name: "WhatsApp Communication", phase: "A", agents: 30, roles: "1 Director, 3 Managers, 6 Specialists, 20 Chat Agents", week: "1-4", features: ["WhatsApp Business API", "Multi-language", "Sales+Support", "Human-like", "Auto-escalation"] },
  { id: "DEPT-003", name: "Web Hosting Operations", phase: "A", agents: 25, roles: "1 Director, 2 Managers, 4 SysAdmins, 8 Monitoring Agents, 10 Support Agents", week: "1-4", features: ["Server monitoring", "Domain management", "SSL/DNS", "Backups", "Security monitoring"] },
  { id: "DEPT-004", name: "Sales & Business Dev", phase: "A", agents: 20, roles: "1 Director, 2 Managers, 4 Sales Specialists, 8 Lead Agents, 5 Follow-up Agents", week: "1-4", features: ["Lead qualification", "Quote generation", "Follow-up sequences", "Deal closing", "Upsell/Cross-sell"] },
  { id: "DEPT-005", name: "Technical Support", phase: "A", agents: 30, roles: "1 Director, 2 Managers, 6 L1 Agents, 8 L2 Agents, 6 L3 Agents, 7 KB Agents", week: "1-4", features: ["L1/L2/L3 support", "Ticket management", "Knowledge base", "24/7 coverage", "Multi-language"] },
  { id: "DEPT-006", name: "Marketing & Content", phase: "B", agents: 20, roles: "", week: "5-16", features: ["Content creation", "SEO", "Social media"] },
  { id: "DEPT-007", name: "Ecommerce Operations", phase: "B", agents: 20, roles: "", week: "5-16", features: ["Store management", "Order processing", "Inventory"] },
  { id: "DEPT-008", name: "Billing & Finance", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Invoicing", "Payments", "Financial reports"] },
  { id: "DEPT-009", name: "Multi-Language Localization", phase: "B", agents: 20, roles: "", week: "5-16", features: ["BN/EN/HI/AR translation", "Localization QA"] },
  { id: "DEPT-010", name: "Mobile App Support", phase: "B", agents: 15, roles: "", week: "5-16", features: ["App support", "Bug triage", "User feedback"] },
  { id: "DEPT-011", name: "Reseller Management", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Reseller onboarding", "Commission tracking"] },
  { id: "DEPT-012", name: "AI Services Delivery", phase: "B", agents: 20, roles: "", week: "5-16", features: ["Ask AI support", "Custom AI delivery"] },
  { id: "DEPT-013", name: "Domain Services", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Registration", "Transfers", "DNS management"] },
  { id: "DEPT-014", name: "Email Marketing", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Campaign management", "Personalization", "Analytics"] },
  { id: "DEPT-015", name: "Social Media Management", phase: "B", agents: 15, roles: "", week: "5-16", features: ["FB/IG/LinkedIn", "Content scheduling", "Engagement"] },
  { id: "DEPT-016", name: "SEO & Analytics", phase: "B", agents: 15, roles: "", week: "5-16", features: ["SEO optimization", "Analytics dashboards", "Reporting"] },
  { id: "DEPT-017", name: "Content Creation", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Blog", "Video scripts", "Marketing copy"] },
  { id: "DEPT-018", name: "Video Production", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Tutorial videos", "Promo videos", "Editing"] },
  { id: "DEPT-019", name: "Graphic Design", phase: "B", agents: 15, roles: "", week: "5-16", features: ["Brand assets", "Social graphics", "UI design"] },
  { id: "DEPT-020", name: "Website Development", phase: "B", agents: 20, roles: "", week: "5-16", features: ["Frontend", "Backend", "Maintenance"] },
];

export interface Deliverable {
  num: number;
  name: string;
  icon: string;
  description: string;
}

export const DELIVERABLES: Deliverable[] = [
  { num: 1, name: "Executive Summary", icon: "📋", description: "One-page vision, ROI, timeline, investment, risk assessment, success metrics" },
  { num: 2, name: "Master Architecture Diagram", icon: "🏗️", description: "Complete system architecture: mobile, AI agents, integration, data, security layers" },
  { num: 3, name: "52-Week Master Roadmap", icon: "📅", description: "Week-by-week deliverables, milestones, resources, dependencies, risk mitigation" },
  { num: 4, name: "Mobile App Specifications", icon: "📱", description: "4 apps: feature lists, wireframes, user flows, tech architecture, dev plans" },
  { num: 5, name: "First 5 Departments Complete", icon: "🏢", description: "DEPT-001 to 005: full specs, AI rosters, SOPs, skills, prompts, integrations" },
  { num: 6, name: "AI Agent Factory Blueprint", icon: "🤖", description: "Standard agent creation process, templates, testing, deployment, monitoring" },
  { num: 7, name: "Integration Playbook", icon: "🔌", description: "System connections, API specs, data migration, testing, rollback procedures" },
  { num: 8, name: "Technology Stack Recommendation", icon: "⚙️", description: "Tech choices with rationale, cost estimates, vendor comparisons, build vs buy" },
  { num: 9, name: "Team & Resources Plan", icon: "👥", description: "Human team, roles, hiring plan, training, consultants/vendors needed" },
  { num: 10, name: "Business Model Evolution", icon: "💰", description: "Revenue streams, pricing strategy, market expansion, competitive positioning" },
];

export interface Strategy {
  num: number;
  title: string;
  icon: string;
  description: string;
  color: "blue" | "cyan" | "green" | "orange" | "purple" | "pink" | "red" | "gold";
}

export const STRATEGIES: Strategy[] = [
  { num: 1, title: "Start Small, Scale Fast", icon: "🚀", description: "5 departments in 30 days → 15 in 3 months → 40 in 6 months → 100 in 12 months. Prove ROI before scaling.", color: "blue" },
  { num: 2, title: "Mobile-First Approach", icon: "📱", description: "90%+ BD users on mobile. Flutter single codebase. Customer App → Admin → Agent → Reseller.", color: "cyan" },
  { num: 3, title: "Language Strategy", icon: "🌐", description: "Bengali (300M+ speakers, underserved AI market) → English → Hindi → Arabic → Spanish → Urdu.", color: "green" },
  { num: 4, title: "Payment Integration Priority", icon: "💳", description: "bKash + Nagad (must-have) + Rocket + Cards + SSLCommerz. Stripe/PayPal for international.", color: "orange" },
  { num: 5, title: "AI Model Strategy", icon: "🤖", description: "Hybrid: Claude/GPT-4/Gemini for complex, fine-tuned smaller models for volume, local models for privacy.", color: "purple" },
  { num: 6, title: "Data Strategy", icon: "📊", description: "Collect every interaction. Build Knowledge Graph, Customer 360°, predictive models. Own your data moat.", color: "pink" },
  { num: 7, title: "Security is Non-Negotiable", icon: "🛡️", description: "E2E encryption, MFA, pen testing. SOC 2, ISO 27001, PCI-DSS targets. 10-15% of tech budget.", color: "red" },
  { num: 8, title: "Team Structure", icon: "👥", description: "5-8 core (Months 1-6) → 8-12 (Months 7-12) → 15-20 (Year 2). Bangladesh dev talent = cost-effective.", color: "blue" },
  { num: 9, title: "Revenue Strategy", icon: "💰", description: "Enhance existing + add 7 new AI revenue streams. Freemium + subscription + usage-based + enterprise. Target 5-10x in 12 months.", color: "green" },
  { num: 10, title: "Cost Management", icon: "📉", description: "AI API costs (40%), Infrastructure (25%), Team (20%), Security (10%), Misc (5%). Break-even Month 6-9.", color: "orange" },
  { num: 11, title: "Marketing & Growth", icon: "📈", description: "WhatsApp Marketing, Facebook Ads, YouTube Bengali, SEO, Referral, Reseller network. 'First AI-native hosting in Bangladesh'.", color: "purple" },
  { num: 12, title: "Competitive Positioning", icon: "🎯", description: "vs GoDaddy: AI-first, Bengali, local payments. vs Local: AI, global infra, enterprise. vs AI startups: existing business, local knowledge.", color: "cyan" },
  { num: 13, title: "Risk Management", icon: "⚠️", description: "10 top risks: API costs, security breach, competition, regulation, team scaling, tech debt, customer concentration, AI reliability, data loss, founder burnout.", color: "red" },
  { num: 14, title: "Quality Assurance Framework", icon: "✅", description: "100+ test scenarios per agent. 24/7 monitoring. Weekly reviews. Monthly audits. Quarterly certification. 99.9% uptime target.", color: "blue" },
  { num: 15, title: "Long-Term Vision", icon: "🌟", description: "Y1: $500K-$1M ARR. Y2: $2M-$5M. Y3: $10M-$20M. Y5: $50M+ ARR. 'Power 1M businesses globally with AI-native infrastructure.'", color: "gold" },
];

export interface EosApp {
  key: string;
  name: string;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
  platforms: string;
  purpose: string;
  screens: string[];
  features: string[];
  sprint: string;
  apiCount: string;
}

export const EOS_APPS: EosApp[] = [
  {
    key: "customer",
    name: "ALO Customer App",
    icon: "📱",
    color: "blue",
    platforms: "iOS + Android (Flutter)",
    purpose: "Customer self-service + AI assistance",
    screens: ["Splash & Onboarding", "Login/Signup (phone/email/social)", "Dashboard (services overview)", "AI Chat Assistant (BN/EN)", "Domain Search & Registration", "Domain Transfer", "Hosting Plans & Purchase", "Hosting Control Panel", "Ecommerce Storefront", "Shopping Cart & Checkout", "Order History & Tracking", "Invoice & Billing", "Payment Methods (bKash/Nagad/Card)", "Support Ticket List", "New Support Ticket", "WhatsApp-style Chat with AI", "Voice Command Interface", "Notifications Center", "Profile & Settings", "Language Settings (BN/EN/HI/AR)", "Referral Program", "AI Recommendations", "Video Tutorials Library", "Live Chat with Human", "FAQ & Knowledge Base", "Service Status Dashboard", "SSL Certificate Management", "Email Forwarding Setup", "2FA / Biometric Setup", "Account Closure"],
    features: ["Login/Signup", "Dashboard", "AI Chat (24/7 BN/EN)", "Domain Management", "Hosting Management", "Ecommerce Store", "WhatsApp Chat", "Voice Commands", "Payment (bKash/Nagad/Cards)", "Order Tracking", "Push Notifications", "Biometric Auth", "Multi-language", "Referral Program", "AI Recommendations", "Video Tutorials", "Live Chat"],
    sprint: "8 weeks",
    apiCount: "100+",
  },
  {
    key: "admin",
    name: "ALO Admin App",
    icon: "🔐",
    color: "green",
    platforms: "iOS + Android (Flutter)",
    purpose: "Monitor and control entire AI-EOS from mobile",
    screens: ["Admin Login (hardened)", "Executive Dashboard", "Department Status Grid", "Department Detail", "AI Agent Monitoring (real-time)", "Agent Detail View", "Revenue Dashboard (live)", "Customer Insights", "AI Performance Metrics", "DCC Certification Status", "Approval Queue", "Approval Detail", "Voice Command Center", "Emergency Controls", "Multi-Department Chat", "Critical Alerts Panel", "Report Generator", "AI Strategic Advisor", "Competitor Monitoring", "Financial Reports", "Team Performance", "Meeting Scheduler", "Audit Log Viewer", "Settings & Config", "Security Center"],
    features: ["Executive Dashboard", "100 Dept Status", "AI Agent Monitoring", "Revenue Dashboard", "DCC Status", "Approve/Reject", "Voice Commands", "Emergency Controls", "Multi-dept Chat", "Report Generation", "AI Strategic Advisor", "Competitor Monitoring", "Financial Reports", "Team Performance", "Meeting Scheduler"],
    sprint: "6 weeks",
    apiCount: "80+",
  },
  {
    key: "agent",
    name: "ALO Agent Management App",
    icon: "🤖",
    color: "purple",
    platforms: "iOS + Android (Flutter)",
    purpose: "Manage 2,000 AI agents from mobile",
    screens: ["Agent Management Login", "Agent Directory (2,000)", "Agent Detail Profile", "Agent Health Monitor", "Performance Analytics per Agent", "Skill Management", "Prompt Library Browser", "Training Center", "New Agent Creation Wizard", "DCC Compliance Tracker", "Team Formation Builder", "Task Assignment Board", "Communication Logs", "Escalation Management", "Agent Retirement Flow", "Agent Upgrade Flow", "Cost per Agent Analytics", "Learning Progress Tracker", "Bulk Operations", "Settings"],
    features: ["Agent Directory (2K)", "Health Monitoring", "Performance Analytics", "Skill Management", "Prompt Library", "Training", "DCC Compliance", "Team Formation", "Task Assignment", "Communication Logs", "Escalation Management", "Agent Retirement/Upgrade", "Cost Analytics", "Learning Progress"],
    sprint: "6 weeks",
    apiCount: "60+",
  },
  {
    key: "reseller",
    name: "ALO Reseller/Partner App",
    icon: "💼",
    color: "orange",
    platforms: "iOS + Android (Flutter)",
    purpose: "Grow business through resellers with AI support",
    screens: ["Reseller Login/Signup", "Reseller Dashboard", "White-label Customer List", "Customer Detail", "Commission Tracking", "AI Sales Tools", "Custom Pricing Setup", "Marketing Materials Library", "Training Modules", "Support Ticket", "Payment/Withdrawal", "Growth Analytics", "Referral Tree", "Settings", "Profile"],
    features: ["Reseller Dashboard", "White-label Management", "Commission Tracking", "AI Sales Tools", "Custom Pricing", "Marketing Materials", "Training Modules", "Support Tickets", "Payment/Withdrawal", "Growth Analytics"],
    sprint: "4 weeks",
    apiCount: "40+",
  },
];

export interface RoadmapWeek {
  week: number;
  phase: Phase;
  color: string;
  stream2: string;
  milestone?: string;
}

export function buildRoadmap(): RoadmapWeek[] {
  const weeks: RoadmapWeek[] = [];
  for (let w = 1; w <= 52; w++) {
    let phase: Phase = "A";
    let color = "green";
    let stream2 = "";
    let milestone: string | undefined;
    if (w <= 4) {
      phase = "A"; color = "green"; stream2 = `DEPT-${String(w).padStart(3, "0")} deployment`;
      if (w === 4) milestone = "Foundation complete: 5 depts, 130 agents";
    } else if (w <= 16) {
      phase = "B"; color = "blue"; stream2 = `DEPT-${String(Math.min(w + 2, 20)).padStart(3, "0")} deployment`;
      if (w === 8) milestone = "All 4 mobile apps launched";
      if (w === 16) milestone = "Growth complete: 20 depts, 500+ agents";
    } else if (w <= 32) {
      phase = "C"; color = "purple"; stream2 = `DEPT-${String(Math.min(w + 8, 60)).padStart(3, "0")} deployment`;
      if (w === 20) milestone = "First AI revenue stream active";
      if (w === 32) milestone = "Expansion complete: 60 depts, 1,200+ agents";
    } else {
      phase = "D"; color = "orange"; stream2 = `DEPT-${String(Math.min(w + 20, 100)).padStart(3, "0")} deployment`;
      if (w === 40) milestone = "Regional expansion started";
      if (w === 52) milestone = "FULL SCALE: 100 depts, 2,000 agents";
    }
    weeks.push({ week: w, phase, color, stream2, milestone });
  }
  return weeks;
}

export const PHASE_COLOR: Record<Phase, string> = { A: "green", B: "blue", C: "purple", D: "orange" };

export const PHASE_LABEL: Record<Phase, string> = {
  A: "Foundation",
  B: "Growth",
  C: "Expansion",
  D: "Full Scale",
};

export const PHASE_WEEKS: Record<Phase, string> = { A: "Weeks 1-4", B: "Weeks 5-16", C: "Weeks 17-32", D: "Weeks 33-52" };

export interface RevenueRow {
  label: string;
  value: number;
  tone: string;
}

export const REVENUE_EXISTING = ["Web hosting subscriptions", "Domain registration", "Ecommerce platform fees", "AI service subscriptions"].map((s) => ({ label: s, value: "Enhanced", tone: "green" }));
export const REVENUE_NEW = ["AI-as-a-Service (custom agents)", "WhatsApp AI for businesses", "Multi-language chatbot service", "AI content creation service", "AI customer support outsourcing", "White-label AI solutions", "AI marketplace (agents/skills/prompts)"].map((s) => ({ label: s, value: "New", tone: "blue" }));

export const REVENUE_PROJECTION = [
  { year: "Year 1", value: "$500K-$1M", tone: "green" },
  { year: "Year 2", value: "$2M-$5M", tone: "blue" },
  { year: "Year 3", value: "$10M-$20M", tone: "purple" },
  { year: "Year 5", value: "$50M+", tone: "orange" },
  { year: "Target", value: "5-10x", tone: "gold" },
];

export const BUDGET_TIERS = [
  { label: "Months 1-3", value: "$2K-5K", tone: "green" },
  { label: "Months 4-6", value: "$5K-15K", tone: "blue" },
  { label: "Months 7-12", value: "$15K-50K", tone: "orange" },
];

export const COST_BREAKDOWN = [
  { label: "AI API costs (biggest variable)", pct: 40, tone: "orange" },
  { label: "Infrastructure (cloud, servers)", pct: 25, tone: "blue" },
  { label: "Development team", pct: 20, tone: "green" },
  { label: "Security (10-15% of tech budget)", pct: 10, tone: "red" },
  { label: "Miscellaneous", pct: 5, tone: "purple" },
];

export const ROI_TARGETS = [
  { label: "Revenue should generate", value: "3-5x cost" },
  { label: "Break-even target", value: "Month 6-9" },
  { label: "Year 1 ARR target", value: "$500K-$1M" },
  { label: "Year 5 ARR target", value: "$50M+" },
];

export const TEAM_ROLES = [
  { icon: "👑", name: "Founder / CEO", desc: "Vision + AI strategy" },
  { icon: "💻", name: "CTO / Lead Developer", desc: "Full stack + AI" },
  { icon: "📱", name: "Mobile Developer", desc: "Flutter / React Native" },
  { icon: "🤖", name: "AI Engineer", desc: "Prompt engineering + integrations" },
  { icon: "🎨", name: "UI/UX Designer", desc: "Mobile-first design" },
  { icon: "💬", name: "Customer Success Lead", desc: "Human touch" },
  { icon: "🌐", name: "Content/Language Specialist", desc: "Bengali + English" },
  { icon: "⚙️", name: "Operations Manager", desc: "Coordination" },
];

export const API_INTEGRATIONS = [
  "ALO Labs website", "CRM", "WhatsApp Business API", "bKash / Nagad / SSLCommerz",
  "Email (SMTP/IMAP)", "Facebook / Instagram / LinkedIn", "cPanel / Plesk (hosting)",
  "Domain registrar APIs", "Google Workspace / MS 365", "Cloud (AWS / GCP / Azure)",
];

export const SECURITY_INFRA = [
  "Zero-trust architecture", "End-to-end encryption", "MFA everywhere",
  "Audit logging (100%)", "SIEM + WAF + DDoS protection", "Targets: SOC 2, ISO 27001, PCI-DSS, GDPR",
];

export const AGENT_ROLE_DISTRIBUTION = [
  { label: "Directors", value: 100, color: "#fbbf24" },
  { label: "Managers", value: 300, color: "#3b82f6" },
  { label: "Supervisors", value: 400, color: "#8b5cf6" },
  { label: "Sr. Specialists", value: 400, color: "#10b981" },
  { label: "Specialists", value: 400, color: "#06b6d4" },
  { label: "Workers", value: 300, color: "#f59e0b" },
  { label: "Assistants", value: 100, color: "#ef4444" },
];

export const STREAM_DETAILS: Record<string, { title: string; tone: string; items: string[]; footer: string }> = {
  stream1: {
    title: "📱 STREAM 1: Mobile Applications",
    tone: "blue",
    items: [
      "Customer App — 30+ screens, 8 weeks",
      "Admin App — 25+ screens, 6 weeks",
      "Agent Management — 20+ screens, 6 weeks",
      "Reseller App — 15+ screens, 4 weeks",
    ],
    footer: "Tech: Flutter, Node.js, PostgreSQL, Redis, Firebase, Stripe+bKash/Nagad",
  },
  stream2: {
    title: "🤖 STREAM 2: AI Agent Army",
    tone: "green",
    items: [
      "Phase A (Wk 1-4): 5 depts, 130 agents",
      "Phase B (Wk 5-16): 15 depts, 370 agents",
      "Phase C (Wk 17-32): 40 depts, 700 agents",
      "Phase D (Wk 33-52): 40 depts, 800 agents",
    ],
    footer: "Total: 100 departments, 2,000 AI agents, 10K+ skills, 50K+ prompts",
  },
  stream3: {
    title: "⚙️ STREAM 3: Infrastructure",
    tone: "orange",
    items: [
      "AI Orchestration (LangChain + Vector DB)",
      "API Integration (15+ systems)",
      "Data Infrastructure (KG + Warehouse)",
      "AI/ML Stack (Multi-model)",
      "Security (Zero-trust, E2E, MFA)",
    ],
    footer: "Timeline: Weeks 1-12 for core infrastructure",
  },
  stream4: {
    title: "🛡️ STREAM 4: Governance",
    tone: "purple",
    items: [
      "500+ Constitutional Rules (Day 1)",
      "DCC Certification (9 criteria, continuous)",
      "Audit System (100% logged)",
      "Human Oversight (Founder authority)",
    ],
    footer: "Continuous throughout entire 52-week deployment",
  },
};
