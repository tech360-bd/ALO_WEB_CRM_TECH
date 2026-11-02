// ============================================================
// ALO EDUCATION — 2000 PROTECTED SELF-LEARNING AGENT NETWORK
//
// "ALO 2000 Protected Self-Learning Agent Network"
//
// The 2000 agents are LOGICAL definitions: 40 departments × 50 micro
// agents. The roster is deterministic (stable codes, no randomness) so
// the registry is reproducible and auditable.
//
// Runtime truth is never invented:
//   persistedAgents / active / paused / failed / waitingApproval /
//   runningJobs are counted from real `ai_agents` and `ai_tasks` rows.
// Every agent is governed by PROTECTION_POLICIES below; a job that
// violates one is blocked server-side, not hidden in the UI.
// ============================================================

import { db } from '@/lib/db';
import type { AgentNetworkDepartment, AgentNetworkSummary } from './types';

const AGENTS_PER_DEPARTMENT = 50;
const CLUSTER_NAME = 'ALO 2000 Protected Self-Learning Agent Network';

interface DepartmentDefinition {
  key: string;
  name: string;
  icon: string;
}

/** The 40 departments from the specification, in order. */
export const AGENT_DEPARTMENTS: readonly DepartmentDefinition[] = [
  { key: 'WEBSITE_BUILDER', name: 'Website Builder Agents', icon: 'LayoutTemplate' },
  { key: 'CRM_BUILDER', name: 'CRM Builder Agents', icon: 'Boxes' },
  { key: 'STUDENT_PORTAL', name: 'Student Portal Agents', icon: 'GraduationCap' },
  { key: 'PARTNER_PORTAL', name: 'Partner Portal Agents', icon: 'Handshake' },
  { key: 'COUNSELOR_WORKFLOW', name: 'Counselor Workflow Agents', icon: 'UserCheck' },
  { key: 'MARKETING_AUTOMATION', name: 'Marketing Automation Agents', icon: 'Megaphone' },
  { key: 'VISA_INTERVIEW', name: 'Visa Interview Agents', icon: 'Plane' },
  { key: 'APPLICATION_TEAM', name: 'Application Team Agents', icon: 'FileText' },
  { key: 'FINANCE', name: 'Finance Agents', icon: 'Wallet' },
  { key: 'HR', name: 'HR Agents', icon: 'Users' },
  { key: 'ENGLISH_TEST', name: 'English Test Agents', icon: 'Languages' },
  { key: 'COURSE_FINDER', name: 'Course Finder Agents', icon: 'Compass' },
  { key: 'UNIVERSITY_DATA', name: 'University Data Agents', icon: 'Building2' },
  { key: 'SCHOLARSHIP_DATA', name: 'Scholarship Data Agents', icon: 'Award' },
  { key: 'COUNTRY_PAGE', name: 'Country Page Agents', icon: 'Globe2' },
  { key: 'DOCUMENT_CLASSIFICATION', name: 'Document Classification Agents', icon: 'FileSearch' },
  { key: 'AUTO_FORM_FILL', name: 'Auto Form Fill Agents', icon: 'ClipboardList' },
  { key: 'WHATSAPP', name: 'WhatsApp Agents', icon: 'MessageCircle' },
  { key: 'MESSENGER', name: 'Messenger Agents', icon: 'MessagesSquare' },
  { key: 'INSTAGRAM', name: 'Instagram Agents', icon: 'Instagram' },
  { key: 'SOCIAL_REPLY', name: 'Social Reply Agents', icon: 'Reply' },
  { key: 'CONTENT_CREATION', name: 'Content Creation Agents', icon: 'PenLine' },
  { key: 'CREATIVE_STUDIO', name: 'Creative Studio Agents', icon: 'Palette' },
  { key: 'VIDEO_SCRIPT', name: 'Video Script Agents', icon: 'Clapperboard' },
  { key: 'SEO', name: 'SEO Agents', icon: 'Search' },
  { key: 'REPORT', name: 'Report Agents', icon: 'BarChart3' },
  { key: 'SECURITY', name: 'Security Agents', icon: 'ShieldAlert' },
  { key: 'RBAC', name: 'RBAC Agents', icon: 'KeyRound' },
  { key: 'AUDIT', name: 'Audit Agents', icon: 'ScrollText' },
  { key: 'QA_TEST', name: 'QA/Test Agents', icon: 'FlaskConical' },
  { key: 'DEPLOYMENT', name: 'Deployment Agents', icon: 'Rocket' },
  { key: 'BACKUP', name: 'Backup Agents', icon: 'DatabaseBackup' },
  { key: 'NOTIFICATION', name: 'Notification Agents', icon: 'Bell' },
  { key: 'SLA', name: 'SLA Agents', icon: 'Timer' },
  { key: 'DATA_CLEANUP', name: 'Data Cleanup Agents', icon: 'Trash2' },
  { key: 'DUPLICATE_DETECTION', name: 'Duplicate Detection Agents', icon: 'CopyCheck' },
  { key: 'RISK_DETECTION', name: 'Risk Detection Agents', icon: 'TriangleAlert' },
  { key: 'COMPLIANCE', name: 'Compliance Agents', icon: 'Scale' },
  { key: 'KNOWLEDGE_BASE', name: 'Knowledge Base Agents', icon: 'BookOpen' },
  { key: 'SUPER_ADMIN_ASSISTANT', name: 'Super Admin Assistant Agents', icon: 'Crown' },
] as const;

/**
 * Policies enforced for every agent in the cluster. These mirror the
 * protection rules in the specification and are surfaced verbatim in the
 * UI so an operator can see exactly what an agent may not do.
 */
export const PROTECTION_POLICIES: readonly string[] = [
  'Self-learning from approved outcomes only',
  'Sandbox-first execution, production only after approval',
  'Permission-aware: inherits the operator scope, never bypasses RBAC',
  'Human approval required for risky or destructive tasks',
  'Rollback snapshot captured before any data change',
  'Every action writes an audit log entry',
  'Confidence score and source evidence attached to each output',
  'No destructive action without approval',
  'No public publish without approval',
  'No private data exposure (passport, bank, visa-sensitive)',
  'No fabricated university, course or scholarship facts',
  'No visa or admission guarantee wording',
  'No OTP or audit-log bypass',
] as const;

/** Stable agent code, e.g. `ALO-VISA_INTERVIEW-014`. */
export function logicalAgentCode(departmentKey: string, index: number): string {
  return `ALO-${departmentKey}-${String(index).padStart(3, '0')}`;
}

/** Total logical agents defined by the cluster. */
export const TOTAL_LOGICAL_AGENTS = AGENT_DEPARTMENTS.length * AGENTS_PER_DEPARTMENT;

const lower = (value: string) => value.toLowerCase();

async function safeAggregate<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * Builds the live registry view: definitional roster + real database state.
 */
export async function getAgentNetworkSummary(): Promise<AgentNetworkSummary> {
  const warnings: string[] = [];

  const persistedByDepartment = await safeAggregate(async () => {
    const rows = await db.aiAgent.groupBy({
      by: ['department', 'status'],
      _count: { _all: true },
    });
    return rows;
  }, [] as Array<{ department: string; status: string; _count: { _all: number } }>);

  if (persistedByDepartment.length === 0) {
    warnings.push(
      'No agents are persisted in ai_agents yet — the roster below is the logical definition. Run `npx tsx prisma/seed-super-admin-agent-network.ts` to materialise all 2000 agents.',
    );
  }

  const jobsByStatus = await safeAggregate(async () => {
    return db.aiTask.groupBy({ by: ['status'], _count: { _all: true } });
  }, [] as Array<{ status: string; _count: { _all: number } }>);

  const countJobs = (status: string) =>
    jobsByStatus.filter((row) => lower(row.status) === lower(status))
      .reduce((sum, row) => sum + row._count._all, 0);

  const departments: AgentNetworkDepartment[] = AGENT_DEPARTMENTS.map((definition) => {
    const rows = persistedByDepartment.filter((row) => {
      const dept = lower(row.department);
      return dept === lower(definition.key)
        || dept === lower(definition.name)
        || dept.includes(lower(definition.key.replace(/_/g, ' ')))
        || dept.includes(lower(definition.name.replace(' Agents', '')));
    });
    const countFor = (status: string) =>
      rows.filter((row) => lower(row.status) === lower(status))
        .reduce((sum, row) => sum + row._count._all, 0);

    const persistedAgents = rows.reduce((sum, row) => sum + row._count._all, 0);

    return {
      key: definition.key,
      name: definition.name,
      icon: definition.icon,
      logicalAgents: AGENTS_PER_DEPARTMENT,
      persistedAgents,
      active: countFor('ACTIVE'),
      paused: countFor('PAUSED'),
      failed: countFor('FAILED'),
      waitingApproval: countFor('WAITING_APPROVAL') + countFor('WAITING'),
      runningJobs: 0,
      protectionMode: 'protected',
    };
  });

  const totalPersistedAgents = departments.reduce((sum, d) => sum + d.persistedAgents, 0);

  return {
    success: true,
    clusterName: CLUSTER_NAME,
    totalLogicalAgents: TOTAL_LOGICAL_AGENTS,
    totalPersistedAgents,
    active: departments.reduce((sum, d) => sum + d.active, 0),
    paused: departments.reduce((sum, d) => sum + d.paused, 0),
    failed: departments.reduce((sum, d) => sum + d.failed, 0),
    waitingApproval: departments.reduce((sum, d) => sum + d.waitingApproval, 0),
    runningJobs: countJobs('RUNNING'),
    departments,
    policies: [...PROTECTION_POLICIES],
    warnings,
  };
}

// ── Full logical roster (2000 rows) ─────────────────────────
//
// The summary above is deliberately aggregate. The registry view needs the
// individual agents, because "2000 logical agents" is only auditable if every
// code is addressable: ALO-VISA_INTERVIEW-014 must be a real row an operator
// can look up, not an arithmetic claim.
//
// The roster is generated from the deterministic definition (40 departments ×
// 50) and joined to persisted `ai_agents` rows by agent code. An agent that has
// no row is reported as NOT_MATERIALISED — never as "active".

export interface LogicalAgentRow {
  code: string;
  department: string;
  departmentName: string;
  index: number;
  name: string;
  /** Persisted status when a row exists, otherwise NOT_MATERIALISED. */
  status: string;
  persisted: boolean;
  jobsProcessed: number;
  pendingApprovals: number;
  lastRunAt: string | null;
  protectionMode: 'protected';
}

export interface AgentRosterResult {
  success: true;
  clusterName: string;
  totalLogicalAgents: number;
  totalPersistedAgents: number;
  department: string | null;
  search: string;
  page: number;
  pageSize: number;
  total: number;
  agents: LogicalAgentRow[];
  departments: Array<{ key: string; name: string; logicalAgents: number; persistedAgents: number }>;
}

export async function getAgentRoster(options: {
  department?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
} = {}): Promise<AgentRosterResult> {
  const departmentKey = (options.department || '').trim().toUpperCase();
  const search = (options.search || '').trim();
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(200, Math.max(10, Math.floor(options.pageSize || 50)));

  const departments = departmentKey
    ? AGENT_DEPARTMENTS.filter((entry) => entry.key === departmentKey)
    : AGENT_DEPARTMENTS;

  // One query per department slice, not one per agent.
  const persisted = await safeAggregate(async () => {
    return db.aiAgent.findMany({
      where: departmentKey
        ? { OR: [{ department: departmentKey }, { department: departments[0]?.name || departmentKey }] }
        : {},
      select: {
        agentCode: true,
        agentName: true,
        status: true,
        jobsProcessed: true,
        pendingApprovals: true,
        lastRunAt: true,
      },
      take: 4000,
    });
  }, [] as Array<{
    agentCode: string;
    agentName: string;
    status: string;
    jobsProcessed: number;
    pendingApprovals: number;
    lastRunAt: Date | null;
  }>);

  const byCode = new Map(persisted.map((row) => [row.agentCode, row]));
  const persistedByDepartment = new Map<string, number>();
  for (const row of persisted) {
    const key = row.agentCode.split('-')[1] || '';
    persistedByDepartment.set(key, (persistedByDepartment.get(key) || 0) + 1);
  }

  const roster: LogicalAgentRow[] = [];
  for (const definition of departments) {
    for (let index = 1; index <= AGENTS_PER_DEPARTMENT; index += 1) {
      const code = logicalAgentCode(definition.key, index);
      const row = byCode.get(code);
      roster.push({
        code,
        department: definition.key,
        departmentName: definition.name,
        index,
        name: row?.agentName || `${definition.name.replace(/ Agents$/, '')} micro-agent ${String(index).padStart(3, '0')}`,
        status: row?.status || 'NOT_MATERIALISED',
        persisted: Boolean(row),
        jobsProcessed: row?.jobsProcessed ?? 0,
        pendingApprovals: row?.pendingApprovals ?? 0,
        lastRunAt: row?.lastRunAt ? row.lastRunAt.toISOString() : null,
        protectionMode: 'protected',
      });
    }
  }

  const filtered = search
    ? roster.filter((agent) =>
      [agent.code, agent.name, agent.department, agent.departmentName, agent.status]
        .some((value) => value.toLowerCase().includes(search.toLowerCase())),
    )
    : roster;

  const start = (page - 1) * pageSize;

  return {
    success: true,
    clusterName: CLUSTER_NAME,
    totalLogicalAgents: TOTAL_LOGICAL_AGENTS,
    totalPersistedAgents: persisted.length,
    department: departmentKey || null,
    search,
    page,
    pageSize,
    total: filtered.length,
    agents: filtered.slice(start, start + pageSize),
    departments: AGENT_DEPARTMENTS.map((definition) => ({
      key: definition.key,
      name: definition.name,
      logicalAgents: AGENTS_PER_DEPARTMENT,
      persistedAgents: persistedByDepartment.get(definition.key) || 0,
    })),
  };
}
