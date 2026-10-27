/**
 * Catalog data for the ALO Enterprise Command Center.
 *
 * Port of the "ALO Enterprise Command Center — Super Admin Dashboard"
 * blueprint (command-center.html). The 100 departments, 28 enterprise
 * engines and DCC scores below are the canonical blueprint catalog; the
 * shell tries to hydrate live counts from the AI-workforce APIs on mount
 * (see SuperAdminCommandCenter) and falls back to these values when the
 * database is empty, so the dashboard is never blank.
 */

export type DccLevel = "Platinum" | "Gold" | "Silver" | "Bronze" | "Pending";

export interface DccScores {
  sop: number;
  know: number;
  skill: number;
  test: number;
  kpi: number;
  sec: number;
  audit: number;
  recov: number;
  esc: number;
  level: DccLevel;
}

export interface Department {
  id: string;
  name: string;
  category: string;
  description: string;
  agents: number;
  skills: number;
  prompts: number;
  sops: number;
  dcc: DccScores;
}

export interface Engine {
  id: string;
  name: string;
  category: string;
  status: "operational" | "degraded" | "offline";
  health: number;
  description: string;
  version: string;
  metrics: Record<string, string>;
}

/** [id, name, category, agents, skills, prompts, sops, sop, know, skill, test, kpi, sec, audit, recov, esc, level] */
type Raw = [string, string, string, number, number, number, number, number, number, number, number, number, number, number, number, number, DccLevel];

const RAW: Raw[] = [
  ["DEPT-001", "Command Center & Governance", "Core Operations", 20, 120, 520, 5, 98, 97, 98, 96, 93, 100, 100, 94, 6, "Platinum"],
  ["DEPT-002", "AI Engineering", "Core Operations", 20, 115, 480, 5, 97, 96, 97, 95, 92, 100, 100, 93, 7, "Platinum"],
  ["DEPT-003", "Memory & Knowledge Core", "Core Operations", 20, 100, 450, 5, 96, 98, 96, 94, 91, 100, 100, 92, 8, "Gold"],
  ["DEPT-004", "CRM & Automation", "Core Operations", 20, 110, 530, 5, 95, 95, 95, 95, 90, 100, 100, 91, 9, "Gold"],
  ["DEPT-005", "WhatsApp Business", "Core Operations", 20, 95, 460, 5, 94, 93, 92, 90, 88, 100, 100, 89, 11, "Silver"],
  ["DEPT-006", "API Gateway", "Core Operations", 20, 90, 440, 5, 96, 95, 94, 93, 90, 100, 100, 90, 9, "Gold"],
  ["DEPT-007", "Event Bus", "Core Operations", 20, 85, 420, 5, 95, 94, 93, 92, 89, 100, 100, 91, 8, "Gold"],
  ["DEPT-008", "MCP Integration Layer", "Core Operations", 20, 88, 430, 5, 93, 92, 91, 90, 87, 100, 100, 88, 12, "Silver"],
  ["DEPT-009", "Workflow Orchestration", "Core Operations", 20, 105, 490, 5, 97, 96, 96, 95, 92, 100, 100, 93, 7, "Platinum"],
  ["DEPT-010", "Enterprise Data Lake", "Core Operations", 20, 92, 450, 5, 95, 94, 93, 92, 89, 100, 100, 90, 9, "Gold"],
  ["DEPT-011", "Digital Marketing", "Marketing & Sales", 20, 100, 550, 5, 96, 95, 94, 93, 90, 100, 100, 90, 8, "Gold"],
  ["DEPT-012", "Social Media", "Marketing & Sales", 20, 85, 480, 5, 94, 93, 92, 91, 88, 100, 100, 89, 10, "Silver"],
  ["DEPT-013", "Paid Ads", "Marketing & Sales", 20, 80, 440, 5, 92, 91, 90, 89, 86, 100, 100, 87, 13, "Silver"],
  ["DEPT-014", "Content Writing", "Marketing & Sales", 20, 95, 520, 5, 95, 94, 93, 92, 89, 100, 100, 90, 9, "Gold"],
  ["DEPT-015", "SEO", "Marketing & Sales", 20, 78, 400, 5, 93, 92, 91, 90, 87, 100, 100, 88, 11, "Silver"],
  ["DEPT-016", "Email Marketing", "Marketing & Sales", 20, 72, 380, 5, 91, 90, 89, 88, 85, 100, 100, 86, 14, "Silver"],
  ["DEPT-017", "Brand Strategy", "Marketing & Sales", 20, 70, 360, 5, 90, 89, 88, 87, 84, 100, 100, 85, 15, "Bronze"],
  ["DEPT-018", "Lead Generation", "Marketing & Sales", 20, 82, 430, 5, 93, 92, 91, 90, 88, 100, 100, 89, 10, "Silver"],
  ["DEPT-019", "Sales Operations", "Marketing & Sales", 20, 88, 460, 5, 95, 94, 93, 92, 90, 100, 100, 91, 8, "Gold"],
  ["DEPT-020", "Customer Success", "Marketing & Sales", 20, 84, 420, 5, 94, 93, 92, 91, 88, 100, 100, 89, 9, "Silver"],
  ["DEPT-021", "Website Design", "Web & Tech", 20, 90, 450, 5, 95, 94, 93, 92, 89, 100, 100, 90, 8, "Gold"],
  ["DEPT-022", "Website Development", "Web & Tech", 20, 110, 500, 5, 97, 96, 97, 95, 92, 100, 100, 93, 6, "Platinum"],
  ["DEPT-023", "Software Development", "Web & Tech", 20, 105, 490, 5, 96, 95, 96, 94, 91, 100, 100, 92, 7, "Gold"],
  ["DEPT-024", "DevOps & Security", "Web & Tech", 20, 98, 470, 5, 97, 96, 95, 94, 91, 100, 100, 93, 6, "Platinum"],
  ["DEPT-025", "Data & Analytics", "Web & Tech", 20, 95, 480, 5, 95, 95, 94, 93, 90, 100, 100, 91, 8, "Gold"],
  ["DEPT-026", "Mobile App Development", "Web & Tech", 20, 92, 460, 5, 94, 93, 92, 91, 88, 100, 100, 89, 9, "Silver"],
  ["DEPT-027", "API Development", "Web & Tech", 20, 88, 440, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-028", "Cloud Infrastructure", "Web & Tech", 20, 85, 420, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-029", "Database Engineering", "Web & Tech", 20, 82, 410, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-030", "QA & Testing", "Web & Tech", 20, 78, 390, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-031", "Avatar Video", "Creative Studios", 20, 75, 380, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-032", "Design & Creative", "Creative Studios", 20, 88, 440, 5, 94, 93, 92, 91, 88, 100, 100, 89, 9, "Silver"],
  ["DEPT-033", "Image AI", "Creative Studios", 20, 82, 420, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-034", "Video Production", "Creative Studios", 20, 80, 400, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-035", "Song & Music", "Creative Studios", 20, 65, 340, 5, 89, 88, 87, 86, 83, 100, 100, 84, 14, "Bronze"],
  ["DEPT-036", "Human Avatar & Voice", "Creative Studios", 20, 70, 360, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-037", "3D Modeling", "Creative Studios", 20, 60, 320, 5, 88, 87, 86, 85, 82, 100, 100, 83, 15, "Bronze"],
  ["DEPT-038", "Animation Studio", "Creative Studios", 20, 62, 330, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-039", "Photography AI", "Creative Studios", 20, 68, 350, 5, 89, 88, 87, 86, 83, 100, 100, 84, 14, "Bronze"],
  ["DEPT-040", "Creative Writing", "Creative Studios", 20, 72, 370, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-041", "Study & Academic AI", "Education", 20, 95, 480, 5, 96, 95, 94, 93, 90, 100, 100, 91, 7, "Gold"],
  ["DEPT-042", "Education Agency", "Education", 20, 100, 510, 5, 97, 96, 95, 94, 91, 100, 100, 92, 6, "Platinum"],
  ["DEPT-043", "Student Visa Consultancy", "Education", 20, 88, 450, 5, 95, 94, 93, 92, 89, 100, 100, 90, 8, "Gold"],
  ["DEPT-044", "University Research", "Education", 20, 82, 420, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-045", "LMS & Course", "Education", 20, 90, 460, 5, 94, 93, 92, 91, 88, 100, 100, 89, 9, "Silver"],
  ["DEPT-046", "Exam & Assessment", "Education", 20, 85, 430, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-047", "Curriculum Design", "Education", 20, 78, 400, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-048", "Tutoring AI", "Education", 20, 72, 380, 5, 89, 88, 87, 86, 83, 100, 100, 84, 14, "Bronze"],
  ["DEPT-049", "Academic Research", "Education", 20, 80, 410, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-050", "Student Analytics", "Education", 20, 75, 390, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-051", "HR & Recruitment", "Business Operations", 20, 85, 440, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-052", "Employee Productivity", "Business Operations", 20, 80, 420, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-053", "Finance & Accounting", "Business Operations", 20, 88, 450, 5, 95, 94, 93, 92, 90, 100, 100, 91, 8, "Gold"],
  ["DEPT-054", "Business Strategy", "Business Operations", 20, 75, 390, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-055", "Sales & Leads", "Business Operations", 20, 82, 430, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-056", "Proposals & Contracts", "Business Operations", 20, 78, 410, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-057", "Project Management", "Business Operations", 20, 85, 440, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-058", "Operations", "Business Operations", 20, 80, 420, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-059", "Legal & Compliance", "Business Operations", 20, 90, 460, 5, 95, 94, 93, 92, 90, 100, 100, 91, 7, "Gold"],
  ["DEPT-060", "Procurement", "Business Operations", 20, 65, 340, 5, 88, 87, 86, 85, 82, 100, 100, 83, 15, "Bronze"],
  ["DEPT-061", "Asset Management", "Business Operations", 20, 62, 330, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-062", "Inventory Control", "Business Operations", 20, 60, 320, 5, 86, 85, 84, 83, 80, 100, 100, 81, 17, "Bronze"],
  ["DEPT-063", "Supply Chain", "Business Operations", 20, 68, 350, 5, 89, 88, 87, 86, 83, 100, 100, 84, 14, "Bronze"],
  ["DEPT-064", "Vendor Management", "Business Operations", 20, 64, 335, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-065", "Corporate Communications", "Business Operations", 20, 70, 360, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-066", "Real Estate", "Specialized Services", 20, 72, 370, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-067", "Travel & Immigration", "Specialized Services", 20, 75, 380, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-068", "Local Business", "Specialized Services", 20, 68, 350, 5, 89, 88, 87, 86, 83, 100, 100, 84, 14, "Bronze"],
  ["DEPT-069", "Agency Delivery", "Specialized Services", 20, 80, 410, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-070", "AI Training", "Specialized Services", 20, 92, 460, 5, 95, 94, 93, 92, 89, 100, 100, 90, 8, "Gold"],
  ["DEPT-071", "Healthcare AI", "Specialized Services", 20, 78, 400, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-072", "Legal AI", "Specialized Services", 20, 82, 420, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-073", "Financial Advisory", "Specialized Services", 20, 76, 390, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-074", "Insurance AI", "Specialized Services", 20, 70, 360, 5, 88, 87, 86, 85, 82, 100, 100, 83, 15, "Bronze"],
  ["DEPT-075", "E-commerce AI", "Specialized Services", 20, 84, 430, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-076", "Logistics AI", "Specialized Services", 20, 72, 370, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-077", "Hospitality AI", "Specialized Services", 20, 66, 340, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-078", "Manufacturing AI", "Specialized Services", 20, 74, 380, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-079", "Agriculture AI", "Specialized Services", 20, 60, 310, 5, 85, 84, 83, 82, 79, 100, 100, 80, 18, "Pending"],
  ["DEPT-080", "Energy & Utilities AI", "Specialized Services", 20, 64, 330, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-081", "Security Monitoring", "Infrastructure", 20, 95, 480, 5, 97, 96, 97, 95, 92, 100, 100, 94, 5, "Platinum"],
  ["DEPT-082", "Server Automation", "Infrastructure", 20, 88, 440, 5, 95, 94, 93, 92, 89, 100, 100, 91, 8, "Gold"],
  ["DEPT-083", "Product Management", "Infrastructure", 20, 82, 420, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-084", "Quality Assurance", "Infrastructure", 20, 80, 410, 5, 92, 91, 90, 89, 86, 100, 100, 87, 11, "Silver"],
  ["DEPT-085", "CEO Control", "Infrastructure", 20, 90, 460, 5, 96, 95, 95, 94, 91, 100, 100, 92, 7, "Platinum"],
  ["DEPT-086", "AI Website Builder", "Infrastructure", 20, 85, 430, 5, 94, 93, 92, 91, 88, 100, 100, 89, 9, "Silver"],
  ["DEPT-087", "Network Operations", "Infrastructure", 20, 78, 400, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-088", "Backup & Recovery", "Infrastructure", 20, 72, 370, 5, 89, 88, 87, 86, 83, 100, 100, 88, 12, "Silver"],
  ["DEPT-089", "Identity & Access Management", "Infrastructure", 20, 84, 430, 5, 93, 92, 91, 90, 87, 100, 100, 88, 10, "Silver"],
  ["DEPT-090", "Monitoring & Alerting", "Infrastructure", 20, 80, 410, 5, 91, 90, 89, 88, 85, 100, 100, 86, 12, "Silver"],
  ["DEPT-091", "AI Research Lab", "Innovation & R&D", 20, 98, 500, 5, 96, 97, 96, 95, 92, 100, 100, 93, 6, "Platinum"],
  ["DEPT-092", "Blockchain & Web3", "Innovation & R&D", 20, 75, 390, 5, 90, 89, 88, 87, 84, 100, 100, 85, 13, "Bronze"],
  ["DEPT-093", "IoT & Edge Computing", "Innovation & R&D", 20, 70, 360, 5, 88, 87, 86, 85, 82, 100, 100, 83, 15, "Bronze"],
  ["DEPT-094", "Robotics AI", "Innovation & R&D", 20, 68, 350, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-095", "Quantum Computing AI", "Innovation & R&D", 20, 55, 280, 5, 84, 83, 82, 81, 78, 100, 100, 79, 19, "Pending"],
  ["DEPT-096", "AR/VR Studio", "Innovation & R&D", 20, 65, 330, 5, 87, 86, 85, 84, 81, 100, 100, 82, 16, "Bronze"],
  ["DEPT-097", "Data Science Lab", "Innovation & R&D", 20, 88, 450, 5, 94, 93, 92, 91, 88, 100, 100, 89, 9, "Silver"],
  ["DEPT-098", "Innovation Pipeline", "Innovation & R&D", 20, 62, 320, 5, 86, 85, 84, 83, 80, 100, 100, 81, 17, "Bronze"],
  ["DEPT-099", "Patent & IP Management", "Innovation & R&D", 20, 58, 300, 5, 84, 83, 82, 81, 78, 100, 100, 80, 18, "Pending"],
  ["DEPT-100", "Future Technologies", "Innovation & R&D", 20, 60, 310, 5, 85, 84, 83, 82, 79, 100, 100, 80, 18, "Pending"],
];

function deriveDescription(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export const DEPARTMENTS: Department[] = RAW.map(
  (r) =>
    ({
      id: r[0],
      name: r[1],
      category: r[2],
      description: `${deriveDescription(r[1])} — 20 AI employees, ~${r[4]} skills`,
      agents: r[3],
      skills: r[4],
      prompts: r[5],
      sops: r[6],
      dcc: {
        sop: r[7],
        know: r[8],
        skill: r[9],
        test: r[10],
        kpi: r[11],
        sec: r[12],
        audit: r[13],
        recov: r[14],
        esc: r[15],
        level: r[16],
      },
    }) as Department,
);

export const DEPARTMENT_CATEGORIES = Array.from(new Set(DEPARTMENTS.map((d) => d.category)));

export const ENGINES: Engine[] = [
  { id: "ENG-01", name: "Enterprise Knowledge Graph", category: "Core Intelligence", status: "operational", health: 98, description: "Graph-based knowledge connecting all departments", version: "3.0.1", metrics: { Nodes: "2.4M", Edges: "18.7M", QPS: "4,500", Latency: "12ms" } },
  { id: "ENG-02", name: "Enterprise RAG", category: "Core Intelligence", status: "operational", health: 97, description: "Retrieval-augmented generation for enterprise data", version: "2.4.0", metrics: { Docs: "1.2M", Accuracy: "96.8%", QPS: "3,200", Latency: "45ms" } },
  { id: "ENG-03", name: "Multi-Agent Collaboration", category: "Orchestration", status: "operational", health: 96, description: "Coordinates multiple agents on complex tasks", version: "2.1.3", metrics: { Active: "342", Completed: "48K", AvgAgents: "5.2", Success: "94%" } },
  { id: "ENG-04", name: "Memory Engine", category: "Core Intelligence", status: "operational", health: 99, description: "Multi-tier memory (hot/warm/cold) for all agents", version: "3.2.0", metrics: { Total: "2.4M", Hot: "340K", Warm: "890K", Cold: "1.17M" } },
  { id: "ENG-05", name: "Planning Engine", category: "Orchestration", status: "operational", health: 97, description: "Task decomposition and planning", version: "2.0.1", metrics: { Plans: "12K", Steps: "84K", AvgSteps: "7", Success: "95%" } },
  { id: "ENG-06", name: "Reflection Engine", category: "Self-Improvement", status: "operational", health: 95, description: "Self-evaluation and learning from outcomes", version: "1.8.0", metrics: { Reflections: "8.4K", Improvements: "1.2K", Accuracy: "92%", Coverage: "88%" } },
  { id: "ENG-07", name: "Self-Healing Engine", category: "Self-Improvement", status: "operational", health: 98, description: "Auto-recovery from task failures", version: "2.3.1", metrics: { Recovered: "847", SuccessRate: "91%", AvgTime: "3.2s", FalsePos: "2%" } },
  { id: "ENG-08", name: "Self-Optimization Engine", category: "Self-Improvement", status: "operational", health: 96, description: "Continuous performance tuning", version: "2.0.0", metrics: { Optimizations: "234", Gains: "12%", AutoApplied: "89%", RolledBack: "3%" } },
  { id: "ENG-09", name: "Evaluation Engine", category: "Quality", status: "operational", health: 97, description: "Quality scoring and evaluation", version: "2.1.0", metrics: { Evaluated: "48K", AvgScore: "94.2%", Flagged: "3.1%", AutoFix: "87%" } },
  { id: "ENG-10", name: "Governance Engine", category: "Governance", status: "operational", health: 99, description: "Policy enforcement and governance", version: "3.0.0", metrics: { Policies: "500+", Enforced: "14.8K", Blocked: "3", Overrides: "0" } },
  { id: "ENG-11", name: "Security Engine", category: "Security", status: "operational", health: 100, description: "Threat detection and prevention", version: "3.1.0", metrics: { Threats: "47", Blocked: "47", Score: "100%", Vulns: "0" } },
  { id: "ENG-12", name: "Audit Engine", category: "Compliance", status: "operational", health: 100, description: "Comprehensive audit logging", version: "2.4.0", metrics: { Logs: "48.2K", Compliance: "100%", Findings: "3", Overdue: "0" } },
  { id: "ENG-13", name: "Compliance Engine", category: "Compliance", status: "operational", health: 98, description: "Regulatory compliance monitoring", version: "2.0.1", metrics: { Frameworks: "12", Controls: "847", Passing: "845", Gaps: "2" } },
  { id: "ENG-14", name: "Observability & Monitoring", category: "Operations", status: "operational", health: 97, description: "System-wide observability", version: "3.0.2", metrics: { Uptime: "99.97%", Response: "23ms", Alerts: "2", Scanned: "4.2TB" } },
  { id: "ENG-15", name: "Workflow Orchestration", category: "Orchestration", status: "operational", health: 96, description: "Multi-step workflow coordination", version: "2.2.0", metrics: { Active: "28", Completed: "8.4K", Success: "94%", AvgTime: "2.3m" } },
  { id: "ENG-16", name: "Event Bus", category: "Infrastructure", status: "operational", health: 98, description: "Event-driven messaging backbone", version: "3.1.0", metrics: { Events: "2.4M/s", Topics: "340", Subscribers: "1.8K", Latency: "2ms" } },
  { id: "ENG-17", name: "API Gateway", category: "Infrastructure", status: "operational", health: 99, description: "Unified API access layer", version: "2.5.0", metrics: { Requests: "12M", Endpoints: "847", AvgLatency: "18ms", Errors: "0.02%" } },
  { id: "ENG-18", name: "MCP Integration Layer", category: "Infrastructure", status: "degraded", health: 92, description: "Model Context Protocol integration", version: "1.9.0", metrics: { Connections: "23", Active: "21", Failed: "2", Retries: "14" } },
  { id: "ENG-19", name: "Enterprise Data Lake", category: "Data", status: "operational", health: 97, description: "Centralized data storage", version: "3.0.0", metrics: { Storage: "48TB", Tables: "1,240", Queries: "450K", Ingest: "2.1GB/s" } },
  { id: "ENG-20", name: "Identity & RBAC", category: "Security", status: "operational", health: 100, description: "Role-based access control", version: "2.3.0", metrics: { Users: "47", Roles: "8", Permissions: "24", Sessions: "23" } },
  { id: "ENG-21", name: "Constitutional Rules Engine", category: "Governance", status: "operational", health: 99, description: "500+ enterprise-wide rules", version: "3.0.0", metrics: { Rules: "500+", Passed: "14.8K", Warned: "47", Blocked: "3" } },
  { id: "ENG-22", name: "SOP Execution Engine", category: "Operations", status: "operational", health: 96, description: "Standard Operating Procedure execution", version: "2.1.0", metrics: { SOPs: "512", Executed: "24K", Success: "96.4%", Coverage: "95%" } },
  { id: "ENG-23", name: "Prompt Template Engine", category: "Core Intelligence", status: "operational", health: 98, description: "50,000+ prompt templates", version: "2.4.0", metrics: { Templates: "52.4K", Used: "8.2K", Quality: "94.2%", New: "127/wk" } },
  { id: "ENG-24", name: "Skill Registry Engine", category: "Core Intelligence", status: "operational", health: 97, description: "10,000+ skill management", version: "3.0.1", metrics: { Skills: "10,247", Active: "9,832", Quarantined: "12", Pending: "47" } },
  { id: "ENG-25", name: "Agent Factory Engine", category: "Operations", status: "operational", health: 95, description: "Agent creation and lifecycle", version: "2.2.0", metrics: { Created: "2,000", Active: "1,847", Retired: "12", Lifetime: "45d" } },
  { id: "ENG-26", name: "DCC Certification Engine", category: "Governance", status: "operational", health: 98, description: "Department capability certification", version: "1.5.0", metrics: { Certified: "93", Pending: "7", Audits: "100", Revocations: "0" } },
  { id: "ENG-27", name: "Human Escalation Engine", category: "Operations", status: "degraded", health: 93, description: "Human-in-the-loop escalation", version: "1.8.0", metrics: { Escalated: "847", Resolved: "812", AvgTime: "4.2m", Pending: "35" } },
  { id: "ENG-28", name: "Cost Optimization Engine", category: "Operations", status: "operational", health: 96, description: "Resource cost optimization", version: "2.0.0", metrics: { Saved: "$12.4K", Optimizations: "234", Efficiency: "87%", Budget: "98%" } },
];

export interface SkillCategory {
  name: string;
  count: number;
  icon: string;
  tone: "blue" | "cyan" | "green" | "purple" | "orange" | "red";
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  { name: "Automation & Workflows", count: 1240, icon: "⚡", tone: "blue" },
  { name: "Communication & Messaging", count: 980, icon: "💬", tone: "cyan" },
  { name: "Data & Analytics", count: 1150, icon: "📊", tone: "green" },
  { name: "Design & Creative", count: 870, icon: "🎨", tone: "purple" },
  { name: "Development & Code", count: 1340, icon: "💻", tone: "blue" },
  { name: "Education & Training", count: 720, icon: "🎓", tone: "orange" },
  { name: "Finance & Accounting", count: 560, icon: "💰", tone: "green" },
  { name: "HR & Recruitment", count: 480, icon: "👤", tone: "cyan" },
  { name: "Legal & Compliance", count: 420, icon: "⚖️", tone: "purple" },
  { name: "Marketing & SEO", count: 920, icon: "📈", tone: "orange" },
  { name: "Research & Analysis", count: 680, icon: "🔍", tone: "blue" },
  { name: "Security & Monitoring", count: 540, icon: "🔐", tone: "red" },
  { name: "Writing & Content", count: 847, icon: "✏️", tone: "cyan" },
];

export interface PromptTemplate {
  name: string;
  uses: number;
  quality: number;
  category: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { name: "Email Draft — Professional Outreach", uses: 3421, quality: 96, category: "Communication" },
  { name: "Lead Qualification Summary", uses: 2890, quality: 94, category: "Sales" },
  { name: "Social Media Post Generator", uses: 2456, quality: 93, category: "Marketing" },
  { name: "Student Admission Checklist", uses: 2103, quality: 97, category: "Education" },
  { name: "Bug Report Template", uses: 1872, quality: 95, category: "Development" },
  { name: "SEO Keyword Analysis", uses: 1654, quality: 92, category: "Marketing" },
  { name: "Financial Summary Report", uses: 1432, quality: 96, category: "Finance" },
  { name: "Meeting Notes Summary", uses: 1320, quality: 94, category: "Operations" },
  { name: "Customer Onboarding Guide", uses: 1198, quality: 95, category: "Customer Success" },
  { name: "Security Incident Report", uses: 987, quality: 98, category: "Security" },
];

export interface AuditEvent {
  time: string;
  type: "info" | "warning" | "critical";
  icon: string;
  message: string;
}

export const AUDIT_EVENTS: AuditEvent[] = [
  { time: "2 min ago", type: "info", icon: "✓", message: "DCC quarterly audit completed for DEPT-012" },
  { time: "15 min ago", type: "warning", icon: "⚠", message: "MCP Integration Layer degraded — 2 connections failed" },
  { time: "32 min ago", type: "info", icon: "🔄", message: "Self-Healing Engine recovered 3 failed tasks" },
  { time: "1 hour ago", type: "critical", icon: "🔒", message: "Security Engine blocked unauthorized access from 192.168.x.x" },
  { time: "2 hours ago", type: "info", icon: "🤖", message: "Agent Factory created 20 new agents for DEPT-087" },
  { time: "3 hours ago", type: "info", icon: "🧠", message: "Memory Engine completed hot→warm migration (15,000 memories)" },
  { time: "4 hours ago", type: "warning", icon: "⚠", message: "Human Escalation queue backlog growing (35 pending)" },
  { time: "5 hours ago", type: "info", icon: "💰", message: "Cost Optimization Engine saved $340 in API costs" },
  { time: "6 hours ago", type: "info", icon: "📜", message: "Constitutional Rules Engine: 14,832 rules passed, 3 blocked" },
  { time: "8 hours ago", type: "info", icon: "💾", message: "Daily backup completed successfully (48TB)" },
];

export interface SecurityEvent {
  time: string;
  severity: "info" | "warning" | "critical";
  message: string;
  detail: string;
}

export const SECURITY_EVENTS: SecurityEvent[] = [
  { time: "1 hour ago", severity: "critical", message: "Blocked credential exfiltration attempt", detail: "Agent AGT-0543 attempted to access .env file — blocked by Protection Mode" },
  { time: "2 hours ago", severity: "warning", message: "Shell command validation triggered", detail: "Agent AGT-0312 attempted curl | bash — blocked and logged" },
  { time: "4 hours ago", severity: "info", message: "Security scan completed", detail: "0 vulnerabilities found across 2,000 agents" },
  { time: "6 hours ago", severity: "warning", message: "Network exfiltration prevention triggered", detail: "Agent AGT-0789 attempted external upload — blocked and quarantined" },
  { time: "8 hours ago", severity: "info", message: "Payment Guard activated", detail: "Blocked unauthorized OpenAI API call — $0.00 charged" },
  { time: "12 hours ago", severity: "info", message: "RBAC policy updated", detail: 'New permission set "DCC-Reviewer" created' },
];

export interface RbacRole {
  icon: string;
  name: string;
  description: string;
  users: number;
  tone: "red" | "orange" | "blue" | "green" | "purple";
}

export const RBAC_ROLES: RbacRole[] = [
  { icon: "👑", name: "Super Admin", description: "Full system access", users: 1, tone: "red" },
  { icon: "🛡️", name: "Admin", description: "Department management", users: 5, tone: "orange" },
  { icon: "👤", name: "Manager", description: "Team & task management", users: 12, tone: "blue" },
  { icon: "✏️", name: "Operator", description: "Daily operations", users: 18, tone: "green" },
  { icon: "👁️", name: "Viewer", description: "Read-only access", users: 11, tone: "purple" },
];

export interface SystemToggle {
  name: string;
  description: string;
  enabled: boolean;
}

export const SYSTEM_TOGGLES: SystemToggle[] = [
  { name: "Protection Mode", description: "Blocks credential theft, unsafe commands, exfiltration", enabled: true },
  { name: "Payment Guard", description: "Prevents unauthorized paid API calls", enabled: true },
  { name: "Self-Healing Engine", description: "Auto-recovery from task failures", enabled: true },
  { name: "Self-Optimization", description: "Continuous performance tuning", enabled: true },
  { name: "DCC Enforcement", description: "Only certified departments can create agents", enabled: true },
  { name: "Owner Approval Required", description: "Risky actions require owner confirmation", enabled: true },
];

export interface ActiveWorkflow {
  icon: string;
  name: string;
  department: string;
  agents: number;
  tone: "blue" | "green" | "purple" | "orange";
  status: "operational" | "degraded";
}

export const ACTIVE_WORKFLOWS: ActiveWorkflow[] = [
  { icon: "🔄", name: "Lead Qualification Pipeline", department: "CRM & Automation Dept", agents: 12, tone: "blue", status: "operational" },
  { icon: "📊", name: "Q3 Analytics Report Generation", department: "Data & Analytics Dept", agents: 8, tone: "green", status: "operational" },
  { icon: "🎓", name: "Student Admission Processing", department: "Education Agency Dept", agents: 15, tone: "purple", status: "operational" },
  { icon: "🔍", name: "Security Audit Scan", department: "Security Monitoring Dept", agents: 6, tone: "orange", status: "degraded" },
];

export interface RecentEvent {
  color: string;
  title: string;
  detail: string;
}

export const RECENT_EVENTS: RecentEvent[] = [
  { color: "text-green-400", title: "Agent AGT-0342", detail: "completed task: University Research Report · 2 minutes ago · University Research Dept" },
  { color: "text-blue-400", title: "DCC Audit", detail: "passed for Department DEPT-012 · 15 minutes ago · Gold certified" },
  { color: "text-orange-400", title: "Self-Healing Engine", detail: "recovered 3 failed tasks · 32 minutes ago · Auto-recovery" },
  { color: "text-red-400", title: "Security Engine", detail: "blocked unauthorized access attempt · 1 hour ago · Threat prevented" },
  { color: "text-purple-400", title: "Agent Factory", detail: "created 20 new agents for DEPT-087 · 2 hours ago · AI Research Lab" },
  { color: "text-cyan-400", title: "Memory Engine", detail: "consolidated 15,000 memories · 3 hours ago · Hot → Warm migration" },
];

export const DCC_CRITERIA: { label: string; threshold: number; unit: string; inverse?: boolean }[] = [
  { label: "SOP Coverage", threshold: 95, unit: "%" },
  { label: "Knowledge Coverage", threshold: 95, unit: "%" },
  { label: "Skill Coverage", threshold: 95, unit: "%" },
  { label: "Test Pass Rate", threshold: 95, unit: "%" },
  { label: "KPI Achievement", threshold: 90, unit: "%" },
  { label: "Security Compliance", threshold: 100, unit: "%" },
  { label: "Audit Compliance", threshold: 100, unit: "%" },
  { label: "Self-Recovery Success", threshold: 90, unit: "%" },
  { label: "Human Escalation Rate", threshold: 10, unit: "%", inverse: true },
];

export const DCC_LEVEL_LABEL: Record<DccLevel, string> = {
  Platinum: "Platinum",
  Gold: "Gold",
  Silver: "Silver",
  Bronze: "Bronze",
  Pending: "Pending",
};

/** Role names assigned to the 20 agents of every department (fidelity to blueprint). */
export const AGENT_ROLES = [
  "Manager", "Planner", "Executor", "QA", "Reporter", "Automation",
  "Safety", "Memory", "Productivity", "Approval", "Specialist I",
  "Specialist II", "Specialist III", "Specialist IV", "Specialist V",
  "Specialist VI", "Analyst", "Coordinator", "Monitor", "Engineer",
];

export interface AgentRow {
  id: string;
  name: string;
  department: string;
  role: string;
  status: "active" | "idle" | "busy";
  tasks: number;
  success: number;
}

export function buildAgents(seed: number): AgentRow[] {
  const roles = ["Manager", "Planner", "Executor", "QA", "Reporter", "Automation", "Safety", "Memory"];
  return Array.from({ length: 50 }, (_, i) => {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const status: AgentRow["status"] = i < 40 ? "active" : i < 47 ? "idle" : "busy";
    return {
      id: `AGT-${String(i + 1 + seed).padStart(4, "0")}`,
      name: `Agent-${String(i + 1 + seed).padStart(4, "0")}`,
      department: dept.name,
      role: roles[i % roles.length],
      status,
      tasks: (i * 7 + seed) % 8 + 1,
      success: (i * 13 + seed * 5) % 15 + 84,
    };
  });
}

export const DCC_DISTRIBUTION: Record<DccLevel, number> = DEPARTMENTS.reduce(
  (acc, d) => {
    acc[d.dcc.level] += 1;
    return acc;
  },
  { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0, Pending: 0 } as Record<DccLevel, number>,
);

export const DEPARTMENT_CATEGORY_COUNTS = DEPARTMENT_CATEGORIES.map((cat) => ({
  category: cat,
  count: DEPARTMENTS.filter((d) => d.category === cat).length,
}));

export const TOTALS = {
  departments: DEPARTMENTS.length,
  agents: DEPARTMENTS.reduce((s, d) => s + d.agents, 0),
  skills: DEPARTMENTS.reduce((s, d) => s + d.skills, 0),
  prompts: DEPARTMENTS.reduce((s, d) => s + d.prompts, 0),
  sops: DEPARTMENTS.reduce((s, d) => s + d.sops, 0),
  engines: ENGINES.length,
};
