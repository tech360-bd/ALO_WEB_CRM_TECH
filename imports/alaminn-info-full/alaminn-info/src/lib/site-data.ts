// Central content model for Alaminn.info
// All copy follows the truth/evidence governance: qualitative, no fabricated metrics.

export const PROFILE = {
  name: "Al Aminn",
  platform: "Alaminn.info",
  positioning:
    "Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder",
  headline: "Transforming Strategy Into Scalable Operations, Growth and Intelligent Systems",
  altHeadline: "Building the Systems Behind Sustainable Growth",
  promise:
    "Turn complicated goals, disconnected workflows and growth challenges into structured, measurable, secure and scalable systems.",
  supporting:
    "Al Aminn works across operations, sales, international education, university partnerships, AI automation, CRM and digital transformation to turn ambitious goals into working systems.",
  trustLine:
    "Based in Bangladesh. Working across education, technology, partnerships and business growth.",
  location: "Dhaka, Bangladesh",
  languages: ["English", "Bengali"],
};

// ────────────────────────────────────────────────────────────────────────────
// SOCIAL LINKS — verified accounts
// ────────────────────────────────────────────────────────────────────────────
// Facebook is the primary verified hub (real share URL provided by Al Aminn).
// All other platforms route through the Facebook profile as the central hub so
// visitors never hit a dead/broken link — every icon leads to a real, working
// destination where Al Aminn's presence can be reached.
export const FACEBOOK_URL =
  "https://www.facebook.com/share/1axbZeACyf/?mibextid=wwXIfr";

/**
 * Official WhatsApp number for Al Aminn (used across the whole site).
 * Local format: 01716609554 · International format: 8801716609554
 * Used by every WhatsApp CTA, the floating button, the footer, and the
 * Social Media Hub. Single source of truth — never hard-code elsewhere.
 */
export const WHATSAPP_NUMBER = "01716609554";
export const WHATSAPP_INTERNATIONAL = "8801716609554";

/** Build a wa.me link with an optional pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_INTERNATIONAL}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type SocialLink = {
  label: string;
  href: string;
  handle: string;
  /** lucide-react icon name; resolved in the component to avoid circular imports */
  icon:
    | "facebook"
    | "linkedin"
    | "instagram"
    | "twitter"
    | "youtube"
    | "tiktok"
    | "whatsapp"
    | "mail"
    | "globe";
  /** brand color used on hover */
  brandColor: string;
  /** is this the primary/verified hub? */
  primary?: boolean;
  /** Short tagline shown in the Social Hub */
  tagline: string;
};

/**
 * SOCIAL LINKS — verified accounts only.
 *
 * Truth & evidence governance: Facebook and WhatsApp are the only verified
 * real accounts. LinkedIn, Instagram, X, YouTube and TikTok currently route
 * through the Facebook profile so no visitor ever hits a dead/broken link.
 * When a real account is provided for any platform, update its `href` here
 * and it propagates everywhere (footer, social hub, mobile drawer).
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Facebook",
    href: FACEBOOK_URL,
    handle: "Al Aminn",
    icon: "facebook",
    brandColor: "#1877F2",
    primary: true,
    tagline: "Primary verified hub — daily updates and posts",
  },
  {
    label: "WhatsApp",
    href: whatsappLink(
      "Hi Al Aminn, I'd like to explore working together.",
    ),
    handle: WHATSAPP_NUMBER,
    icon: "whatsapp",
    brandColor: "#25D366",
    primary: true,
    tagline: "Chat directly — fastest response",
  },
  {
    label: "LinkedIn",
    href: FACEBOOK_URL,
    handle: "Find via Facebook",
    icon: "linkedin",
    brandColor: "#0A66C2",
    tagline: "Professional network — reach via Facebook",
  },
  {
    label: "Instagram",
    href: FACEBOOK_URL,
    handle: "Find via Facebook",
    icon: "instagram",
    brandColor: "#E4405F",
    tagline: "Behind-the-scenes — reach via Facebook",
  },
  {
    label: "X (Twitter)",
    href: FACEBOOK_URL,
    handle: "Find via Facebook",
    icon: "twitter",
    brandColor: "#000000",
    tagline: "Short-form thoughts — reach via Facebook",
  },
  {
    label: "YouTube",
    href: FACEBOOK_URL,
    handle: "Find via Facebook",
    icon: "youtube",
    brandColor: "#FF0000",
    tagline: "Long-form content — reach via Facebook",
  },
  {
    label: "TikTok",
    href: FACEBOOK_URL,
    handle: "Find via Facebook",
    icon: "tiktok",
    brandColor: "#010101",
    tagline: "Quick insights — reach via Facebook",
  },
  {
    label: "Email",
    href: "mailto:hello@alaminn.info",
    handle: "hello@alaminn.info",
    icon: "mail",
    brandColor: "#F26113",
    tagline: "For detailed enquiries and proposals",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// PHOTO GALLERY — real, user-provided photos only
// ────────────────────────────────────────────────────────────────────────────
// Every image below is a real photo provided by Al Aminn. No fabricated or
// AI-generated photos of people, offices or events are used. Captions are
// descriptive (what the photo shows) — not invented achievements.
export type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  category: "Portrait" | "Workspace" | "Project" | "Event";
  span?: "wide" | "tall" | "default";
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/gallery/professional-portrait.jpg",
    alt: "Al Aminn — professional portrait",
    caption: "Professional portrait",
    category: "Portrait",
    span: "tall",
  },
  {
    src: "/gallery/workspace-meeting.jpg",
    alt: "Workspace — planning and meetings",
    caption: "Workspace — planning and strategy sessions",
    category: "Workspace",
    span: "wide",
  },
  {
    src: "/gallery/workspace-desk.jpg",
    alt: "Workspace — desk setup",
    caption: "Daily workspace — operations and execution",
    category: "Workspace",
    span: "default",
  },
  {
    src: "/gallery/event-photo.jpg",
    alt: "Event and community photo",
    caption: "Community and event participation",
    category: "Event",
    span: "default",
  },
  {
    src: "/gallery/dashboard.png",
    alt: "Project dashboard screenshot",
    caption: "Project dashboard — systems in action",
    category: "Project",
    span: "wide",
  },
  {
    src: "/gallery/professional-lifestyle.jpg",
    alt: "Al Aminn — lifestyle portrait",
    caption: "Lifestyle portrait — working across contexts",
    category: "Portrait",
    span: "default",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// LATEST UPDATES — professional posts (sourced from the seeded Article table
// at runtime; this is the fallback/static set used by the LatestUpdates
// section when DB rows are unavailable).
// ────────────────────────────────────────────────────────────────────────────
export type LatestUpdate = {
  id: string;
  title: string;
  excerpt: string;
  category: "Operations" | "AI" | "Education" | "Growth" | "Partnerships";
  date: string;
  readTime: string;
};

export const LATEST_UPDATES_FALLBACK: LatestUpdate[] = [
  {
    id: "operating-systems",
    title: "Why Operating Systems Beat Operating Hours",
    excerpt:
      "Sustainable growth comes from systems, not heroics. A look at how structured operating systems create repeatable outcomes across operations, sales and education.",
    category: "Operations",
    date: "2026-07-28",
    readTime: "6 min read",
  },
  {
    id: "governed-ai",
    title: "Governed AI: Adoption Without Exposure",
    excerpt:
      "How approval routing, sensitivity tagging and audit logs make AI safe for operations, CRM and student-services workflows.",
    category: "AI",
    date: "2026-07-20",
    readTime: "8 min read",
  },
  {
    id: "student-journey",
    title: "Structuring the Student Journey End-to-End",
    excerpt:
      "From first enquiry to admissions — the stages, ownership and checkpoints that turn manual student services into a compliant pipeline.",
    category: "Education",
    date: "2026-07-12",
    readTime: "5 min read",
  },
  {
    id: "partnership-pipeline",
    title: "Building a University Partnership Pipeline",
    excerpt:
      "Outreach, due-diligence and collaboration stages for institutional partnerships — with approval gates at every step.",
    category: "Partnerships",
    date: "2026-07-04",
    readTime: "7 min read",
  },
  {
    id: "sales-pipeline",
    title: "From Leads to Revenue: Stage-Based Sales",
    excerpt:
      "Qualification, SLAs and forecasting — the discipline that turns captured leads into consistent conversion.",
    category: "Growth",
    date: "2026-06-26",
    readTime: "6 min read",
  },
  {
    id: "bangladesh-market",
    title: "Bangladesh Market Insight for Universities",
    excerpt:
      "What international universities need to understand about the Bangladesh student market — demand, readiness and partnership models.",
    category: "Education",
    date: "2026-06-18",
    readTime: "9 min read",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// MY WORK — engagement highlights (qualitative, no fabricated metrics)
// ────────────────────────────────────────────────────────────────────────────
export type WorkHighlight = {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  icon: "Workflow" | "GraduationCap" | "Sparkles" | "Database" | "Rocket" | "Handshake";
  tag: string;
};

export const MY_WORK_HIGHLIGHTS: WorkHighlight[] = [
  {
    id: "operations",
    title: "Operations & Business Systems",
    description:
      "Designed operating systems with stage gates, clear ownership and reporting cadence for service businesses.",
    outcomes: [
      "Stage-based operating models",
      "Accountability matrices and reporting cadence",
      "Workflow diagnosis and redesign",
    ],
    icon: "Workflow",
    tag: "Operations",
  },
  {
    id: "education",
    title: "International Education Operations",
    description:
      "Structured counselling, application and admissions workflows for student-services organisations.",
    outcomes: [
      "Compliant student journeys",
      "Application pipeline with SLAs",
      "University partnership pipelines",
    ],
    icon: "GraduationCap",
    tag: "Education",
  },
  {
    id: "ai",
    title: "Governed AI Automation",
    description:
      "Built AI agent workflows with approval routing, sensitivity tagging and full audit trails.",
    outcomes: [
      "Approval-gated AI publishing",
      "Sensitivity-tagged data handling",
      "Auditable agent workflows",
    ],
    icon: "Sparkles",
    tag: "AI",
  },
  {
    id: "crm",
    title: "CRM & Digital Transformation",
    description:
      "Built relationship infrastructure with source attribution and 14-stage opportunity pipelines.",
    outcomes: [
      "Single source of truth for relationships",
      "Source-attributed lead capture",
      "Pipeline and forecast visibility",
    ],
    icon: "Database",
    tag: "CRM",
  },
  {
    id: "growth",
    title: "Sales Strategy & Revenue Growth",
    description:
      "Built stage-based sales pipelines with qualification frameworks and forecasting discipline.",
    outcomes: [
      "Qualification frameworks",
      "Conversion SLAs",
      "Forecasting cadence",
    ],
    icon: "Rocket",
    tag: "Growth",
  },
  {
    id: "partnerships",
    title: "Institutional Partnerships",
    description:
      "Ran partnership pipelines with due-diligence and approval stages for universities and institutions.",
    outcomes: [
      "Due-diligence frameworks",
      "Approval-gated collaboration stages",
      "Institutional outreach playbooks",
    ],
    icon: "Handshake",
    tag: "Partnerships",
  },
];

/**
 * Simplified premium navigation — 6 meaningful destinations + 1 CTA.
 * No "Home" item (the logo links to "/"). About + Expertise merged,
 * Insights + Resources + Updates merged, Work With Me + Contact merged.
 */
export const NAV_LINKS = [
  { label: "About & Expertise", href: "/about", page: true },
  { label: "Impact", href: "/impact", page: true },
  { label: "Projects", href: "/projects", page: true },
  { label: "Insights", href: "/insights", page: true },
  { label: "Higher Study", href: "/higher-study", page: true },
  { label: "Work With Me", href: "/work-with-me", page: true },
];

export const EXPERTISE_MEGA = {
  business: {
    title: "Business",
    items: [
      { label: "Operations & Business Systems", href: "#expertise", tag: "operations" },
      { label: "Sales & Revenue Growth", href: "#expertise", tag: "sales" },
      { label: "Team Performance", href: "#expertise", tag: "team" },
      { label: "Market Development", href: "#expertise", tag: "market" },
    ],
  },
  education: {
    title: "Education",
    items: [
      { label: "International Education Strategy", href: "#expertise", tag: "education-strategy" },
      { label: "Student Recruitment Operations", href: "#expertise", tag: "recruitment" },
      { label: "University Partnerships", href: "#expertise", tag: "partnerships" },
      { label: "Bangladesh Market Insight", href: "#expertise", tag: "bangladesh" },
    ],
  },
  technology: {
    title: "Technology",
    items: [
      { label: "AI Automation", href: "#expertise", tag: "ai" },
      { label: "CRM & Workflow Systems", href: "#expertise", tag: "crm" },
      { label: "Digital Transformation", href: "#expertise", tag: "digital" },
      { label: "Web Platforms", href: "#expertise", tag: "web" },
    ],
  },
};

export const PROJECTS_MENU = [
  "ALO Education",
  "ALO Labs Agent Hub",
  "English AI",
  "ICLA Global Academy",
  "TECH360",
  "Selected Systems",
  "Client Projects",
];

export const CREDIBILITY_SIGNALS = [
  "Operations Leadership",
  "Sales Strategy",
  "International Education",
  "University Partnerships",
  "AI Automation",
  "CRM Systems",
  "Digital Transformation",
  "Bangladesh Market Insight",
];

export type ExpertiseModule = {
  id: string;
  icon: string;
  title: string;
  challenge: string;
  solution: string;
  tags: string[];
  relatedProject: string;
};

export const EXPERTISE_MODULES: ExpertiseModule[] = [
  {
    id: "operations",
    icon: "Workflow",
    title: "Operations & Business Systems",
    challenge: "Workflows are disconnected and accountability is unclear.",
    solution: "Design operating systems with stage gates, ownership and reporting.",
    tags: ["Process", "Accountability", "Reporting"],
    relatedProject: "TECH360",
  },
  {
    id: "sales",
    icon: "TrendingUp",
    title: "Sales Strategy & Revenue Growth",
    challenge: "Leads are captured but not consistently converted.",
    solution: "Build stage-based pipelines with qualification and SLAs.",
    tags: ["Pipeline", "Conversion", "Forecasting"],
    relatedProject: "Alaminn.info",
  },
  {
    id: "education",
    icon: "GraduationCap",
    title: "International Education Operations",
    challenge: "Student journeys are manual and inconsistent.",
    solution: "Structure counselling, applications and admissions workflows.",
    tags: ["Counselling", "Admissions", "Compliance"],
    relatedProject: "ALO Education",
  },
  {
    id: "partnerships",
    icon: "Handshake",
    title: "University & Institutional Partnerships",
    challenge: "Institutional outreach lacks structure and follow-through.",
    solution: "Run a partnership pipeline with due-diligence and approval stages.",
    tags: ["Outreach", "Due Diligence", "Collaboration"],
    relatedProject: "ALO Education",
  },
  {
    id: "ai",
    icon: "Sparkles",
    title: "AI Automation & Agentic Workflows",
    challenge: "AI use is uncontrolled and risks exposing sensitive data.",
    solution: "Govern AI with approval routing, sensitivity tagging and audit logs.",
    tags: ["Governance", "Approval", "Audit"],
    relatedProject: "ALO Labs Agent Hub",
  },
  {
    id: "crm",
    icon: "Database",
    title: "CRM & Digital Transformation",
    challenge: "No single source of truth for relationships and opportunities.",
    solution: "Build relationship infrastructure with source attribution.",
    tags: ["CRM", "Attribution", "Pipeline"],
    relatedProject: "TECH360",
  },
  {
    id: "marketing",
    icon: "Megaphone",
    title: "Marketing & Authority Growth",
    challenge: "Activity is high but authority and positioning are unclear.",
    solution: "Structure content clusters, authority platforms and cadence.",
    tags: ["Authority", "Content", "Positioning"],
    relatedProject: "Alaminn.info",
  },
  {
    id: "team",
    icon: "Users",
    title: "Team Leadership & Performance",
    challenge: "Ownership is unclear and reporting is inconsistent.",
    solution: "Introduce accountability matrices and performance cadences.",
    tags: ["Ownership", "Cadence", "Performance"],
    relatedProject: "TECH360",
  },
];

export type WorkStage = {
  id: string;
  title: string;
  objective: string;
  output: string;
  decision: string;
  role: string;
  checkpoint: string;
};

export const WORK_STAGES: WorkStage[] = [
  { id: "understand", title: "Understand", objective: "Capture the real context and ambition.", output: "Context brief", decision: "Scope confirmed", role: "Lead + Sponsor", checkpoint: "Brief signed off" },
  { id: "diagnose", title: "Diagnose", objective: "Identify bottlenecks and root causes.", output: "Diagnosis map", decision: "Priorities set", role: "Operations Lead", checkpoint: "Diagnosis reviewed" },
  { id: "structure", title: "Structure", objective: "Design the operating system.", output: "System blueprint", decision: "Architecture approved", role: "Architect", checkpoint: "Blueprint approved" },
  { id: "build", title: "Build", objective: "Build workflows, CRM and automation.", output: "Working system", decision: "Build validated", role: "Delivery Lead", checkpoint: "UAT passed" },
  { id: "execute", title: "Execute", objective: "Roll out with the team.", output: "Live operations", decision: "Go-live approved", role: "Team Lead", checkpoint: "Go-live signed" },
  { id: "measure", title: "Measure", objective: "Track leading and lagging metrics.", output: "Dashboard", decision: "Metrics ratified", role: "Analyst", checkpoint: "Dashboard live" },
  { id: "improve", title: "Improve", objective: "Refine based on evidence.", output: "Improvement log", decision: "Changes approved", role: "Continuous Improvement", checkpoint: "Review held" },
  { id: "scale", title: "Scale", objective: "Expand what works.", output: "Scale plan", decision: "Scale authorised", role: "Growth Lead", checkpoint: "Scale kicked off" },
];

export const GROWTH_FLOW = [
  { label: "Vision", desc: "Ambition, direction and constraints." },
  { label: "Strategy", desc: "Choices that turn vision into a path." },
  { label: "People + Process + Technology", desc: "The operating system." },
  { label: "Execution", desc: "Disciplined, accountable delivery." },
  { label: "Measurement", desc: "Evidence over opinion." },
  { label: "Improvement", desc: "Continuous, structured refinement." },
  { label: "Growth", desc: "Repeatable, scalable outcomes." },
];

export const ECOSYSTEM = [
  { name: "Al Aminn", role: "Center", category: "Personal Authority", problem: "Connect strategy, ecosystem and collaboration.", status: "active", relation: "Owner", featured: true },
  { name: "ALO Education", role: "Student Services", category: "Education", problem: "Structured, compliant student journeys.", status: "active", relation: "Operations & growth leadership", featured: true },
  { name: "ALO Labs", role: "AI Command Center", category: "AI", problem: "Governed, centralised AI capability.", status: "planned", relation: "Architecture & governance", featured: true },
  { name: "English AI", role: "Language Learning", category: "AI", problem: "Adaptive English proficiency for global study.", status: "planned", relation: "Strategy & direction", featured: false },
  { name: "ICLA Global Academy", role: "Curriculum", category: "Education", problem: "Structured international curriculum.", status: "planned", relation: "Advisory & collaboration", featured: false },
  { name: "TECH360", role: "Technology Delivery", category: "Software", problem: "Reliable digital systems for service businesses.", status: "active", relation: "Delivery leadership", featured: true },
  { name: "Alaminn.info", role: "Executive Platform", category: "Professional Brand", problem: "Credible single hub for work and ecosystem.", status: "active", relation: "Owner & architect", featured: true },
];

export const AUDIENCE_PATHWAYS = [
  {
    id: "universities",
    title: "Universities & Education Providers",
    desc: "Understand Bangladesh market collaboration, recruitment operations and local partnership strategy.",
    cta: "Discuss Bangladesh Market Collaboration",
    icon: "Building2",
  },
  {
    id: "education-businesses",
    title: "Education Businesses",
    desc: "Review operations, counselling workflows, sales systems, CRM and growth strategy.",
    cta: "Review Your Operating System",
    icon: "GraduationCap",
  },
  {
    id: "founders",
    title: "Businesses & Founders",
    desc: "Structure operations, sales, CRM, automation, AI and digital systems for growth.",
    cta: "Explore Growth and Automation",
    icon: "Rocket",
  },
  {
    id: "tech",
    title: "Technology & AI Partners",
    desc: "Collaborate on systems, automation, workflow architecture and AI integration.",
    cta: "Discuss Systems Collaboration",
    icon: "Cpu",
  },
];

export const INQUIRY_TYPES = [
  { id: "university-partnership", label: "University Partnership" },
  { id: "institutional-collaboration", label: "Institutional Collaboration" },
  { id: "business-consultation", label: "Business Consultation" },
  { id: "operations-review", label: "Operations Review" },
  { id: "sales-strategy", label: "Sales Strategy" },
  { id: "education-advisory", label: "Education-Business Advisory" },
  { id: "ai-automation", label: "AI Automation" },
  { id: "crm-digital", label: "CRM or Digital System" },
  { id: "tech-collaboration", label: "Technology Collaboration" },
  { id: "personal-branding", label: "Personal Branding" },
  { id: "speaking", label: "Speaking" },
  { id: "media", label: "Media" },
  { id: "student-referral", label: "Student Referral" },
  { id: "other", label: "Other" },
];

export const LEADERSHIP_PRINCIPLES = [
  "Clarity before complexity",
  "Execution before decoration",
  "Systems before dependency",
  "Measurable accountability",
  "People supported by technology",
  "Evidence before claims",
  "Ethical student service",
  "Controlled AI adoption",
  "Continuous improvement",
];

export const AI_WORKFLOW_STEPS = [
  "Alaminn.info Request",
  "Secure Company Authentication",
  "ALO Labs Command Router",
  "Approved Agent Team",
  "Knowledge & Tool Execution",
  "Safety & Quality Review",
  "Human Approval",
  "Publish or Deliver",
];

export const AI_AGENT_STATUSES = [
  { name: "Executive Content Agent", status: "planned", desc: "Drafts posts and articles" },
  { name: "Research Agent", status: "planned", desc: "University & market briefs" },
  { name: "Operations Audit Agent", status: "planned", desc: "Workflow diagnostics" },
  { name: "CRM Summary Agent", status: "planned", desc: "Pipeline summaries" },
  { name: "Newsletter Agent", status: "planned", desc: "Monthly authority report" },
  { name: "Partnership Brief Agent", status: "planned", desc: "Institutional research" },
];

// ────────────────────────────────────────────────────────────────────────────
// CLAIM REGISTRY — Verification & Evidence
// ────────────────────────────────────────────────────────────────────────────
// Every public statistic or claim on Alaminn.info is tracked here so the site
// never publishes a fabricated metric. Each entry records the exact claim, the
// section where it appears, the evidence backing it, who reviewed it, when, and
// a status that distinguishes hard-verified counts from contextual targets
// (e.g. response-time SLAs) and anecdotal observations.
//
// STATUS MEANINGS
//   verified   — countable or factually checkable from the codebase / database
//   pending    — claim is published but evidence review is still in progress
//   contextual — accurate, but depends on context (a target/SLA, not a guarantee)
//   anecdotal  — based on observation, no formal measurement backing
//
// The registry is rendered by the public Verification section
// (`src/components/site/sections/verification.tsx`) so visitors can audit the
// numbers they see on the site.
export type ClaimStatus = "verified" | "pending" | "contextual" | "anecdotal";

export type ClaimEntry = {
  /** stable slug used for anchor ids + JSON-LD `url` */
  id: string;
  /** the public statement being claimed */
  claim: string;
  /** where on the site the claim appears */
  source: { label: string; anchor: string };
  /** what backs the claim up */
  evidence: string;
  /** ISO date the claim was last reviewed (YYYY-MM-DD) */
  dateVerified: string;
  /** who performed the review */
  reviewer: string;
  /** verification status */
  status: ClaimStatus;
};

export const CLAIM_REGISTRY: ClaimEntry[] = [
  {
    id: "expertise-modules",
    claim: "8 expertise modules",
    source: { label: "Credibility Signal Bar", anchor: "#home" },
    evidence:
      "EXPERTISE_MODULES in src/lib/site-data.ts contains exactly 8 modules (operations, sales, education, partnerships, ai, crm, marketing, team). The Credibility Signal Bar renders 8 capability labels and the Expertise Command Grid renders 8 module cards.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "operating-system-stages",
    claim: "7-stage operating system",
    source: { label: "Executive Introduction", anchor: "#about" },
    evidence:
      "GROWTH_FLOW in src/lib/site-data.ts contains exactly 7 stages: Vision → Strategy → People+Process+Technology → Execution → Measurement → Improvement → Growth. Rendered as the 7-step flow visual in executive-intro.tsx.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "ecosystem-platforms",
    claim: "6 ecosystem platforms",
    source: { label: "Ecosystem Map", anchor: "#projects" },
    evidence:
      "ECOSYSTEM in src/lib/site-data.ts lists 6 platforms surrounding Al Aminn: ALO Education, ALO Labs, English AI, ICLA Global Academy, TECH360, Alaminn.info. The radial ecosystem map renders these 6 platforms around the center node.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "case-studies",
    claim: "3 case studies",
    source: { label: "Featured Case Studies", anchor: "#case-studies" },
    evidence:
      "page.tsx queries db.caseStudy.findMany with `take: 3` and `where: { featured: true }`. The Featured Case Studies section renders exactly 3 cards from the seeded CaseStudy table.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "impact-records",
    claim: "6 impact records",
    source: { label: "Selected Impact", anchor: "#impact" },
    evidence:
      "page.tsx queries db.impactRecord.findMany with `take: 6`. The Selected Impact section renders up to 6 evidence-controlled outcome cards from the seeded ImpactRecord table.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "resources",
    claim: "8 resources",
    source: { label: "Resources", anchor: "#resources" },
    evidence:
      "page.tsx queries db.resource.findMany with `take: 8`. The Resources section renders up to 8 resource cards (guides, templates, checklists, reports, videos) from the seeded Resource table.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "bi-weekly-brief",
    claim: "Bi-weekly brief",
    source: { label: "Newsletter", anchor: "#newsletter" },
    evidence:
      "The Newsletter section advertises a bi-weekly cadence. This is a planned editorial target, not a guaranteed delivery schedule — the actual publishing frequency depends on operational capacity and editorial review. Past editions shown in the newsletter section are illustrative of the format.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "contextual",
  },
  {
    id: "evidence-controlled-ai-gated",
    claim: "Evidence-controlled · AI approval-gated",
    source: { label: "Footer / Governance", anchor: "#contact" },
    evidence:
      "Enforced in code: (1) Impact records carry an evidenceStatus field; (2) AI tasks in the AiTask table require an AiApproval record before any output is published; (3) requirePermission() in src/lib/auth.ts gates approval decisions behind ai_approvals.decide permission; (4) every approval decision is audit-logged. Documented in docs/CLAIM_REGISTER.md and the ALO Labs governance section.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
  {
    id: "response-time",
    claim: "Response within 24 hours",
    source: { label: "Contact / Footer", anchor: "#contact" },
    evidence:
      "Stated as a target SLA in the contact-finale.tsx section ('We respond within 1 business day') and reinforced by the auto-created follow-up Task for every inquiry. This is an internal target, not a contractual guarantee — actual response time depends on timezone, volume and the nature of the inquiry.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "contextual",
  },
  {
    id: "timezones-utc6",
    claim: "Working across time zones (UTC+6)",
    source: { label: "Footer", anchor: "#contact" },
    evidence:
      "Based in Dhaka, Bangladesh (Asia/Dhaka, UTC+6 year-round, no DST). Stated in the footer and on the Profile section. The Bangladesh timezone is the operating base; remote-first engagements are scheduled across the client's timezone.",
    dateVerified: "2026-07-12",
    reviewer: "Al Aminn (Owner)",
    status: "verified",
  },
];
