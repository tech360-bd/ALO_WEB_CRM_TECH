// ============================================================
// ALO EDUCATION — SUPER ADMIN OPERATING DASHBOARD CONTRACTS
//
// Single source of truth for the shapes returned by
// /api/super-admin/* and consumed by the dashboard.
//
// Design rule: a metric that cannot be computed is reported as
// `available: false` with a machine-readable reason. It is NEVER
// replaced with a placeholder number.
// ============================================================

export type KpiKey =
  | 'students'
  | 'leads'
  | 'applications'
  | 'partners'
  | 'employees'
  | 'counselorPerformance'
  | 'marketing'
  | 'visa'
  | 'englishTest'
  | 'finance'
  | 'hr'
  | 'ai';

export type KpiStatus = 'ok' | 'attention' | 'critical' | 'unknown';

export interface KpiSubMetric {
  label: string;
  /** null when the underlying source could not be read. */
  value: number | string | null;
  /** Optional tone so the UI can colour a sub-metric without hardcoding. */
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
}

export interface KpiCard {
  key: KpiKey;
  label: string;
  /** lucide-react icon name, resolved by the UI. */
  icon: string;
  value: number | null;
  unit?: string;
  sub: KpiSubMetric[];
  status: KpiStatus;
  href: string;
  /** CTA label the card uses when clicked. */
  actionLabel: string;
  available: boolean;
  unavailableReason?: string;
}

export interface DashboardHeaderMetrics {
  adminName: string | null;
  role: 'SUPER_ADMIN';
  totalActiveStudents: number | null;
  totalActiveApplications: number | null;
  employeesOnline: number | null;
  employeesActiveToday: number | null;
  pendingApprovals: number | null;
  securityAlerts: number | null;
  aiJobsRunning: number | null;
  unreadNotifications: number | null;
}

export interface OperatingMetricsResponse {
  success: true;
  generatedAt: string;
  header: DashboardHeaderMetrics;
  kpis: KpiCard[];
  /** Non-fatal problems encountered while aggregating, for operator visibility. */
  warnings: string[];
}

export interface EmployeeControlRow {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  branch: string;
  destinationFocus: string[];
  status: string;
  isOnline: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
  activeSessions: number;
  openTasks: number;
  /** Audit rows this employee produced today — their real "today activity". */
  actionsToday: number;
  /** Roles actually assigned to the underlying portal user (RBAC truth). */
  assignedRoles: string[];
  /** Whether this employee can currently be impersonated via Acting-As. */
  actingAsEligible: boolean;
  performanceScore: number | null;
}

export interface BranchControlRow {
  id: string;
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  status: string;
  employees: number;
  activeLeads: number;
  activeStudents: number;
  activeApplications: number;
  pendingDocuments: number;
  conversionRate: number | null;
  performanceScore: number | null;
}

export interface CountryControlRow {
  id: string;
  code: string;
  name: string;
  slug: string;
  status: string;
  leads: number;
  students: number;
  applications: number;
  universities: number;
  courses: number;
  visaCases: number;
  highRiskVisaCases: number;
  visaReadinessAvg: number | null;
  lastVerifiedAt: string | null;
}

export interface ApprovalRow {
  id: string;
  type: string;
  title: string;
  description: string;
  requestedByName: string;
  status: string;
  priority: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  deadline: string | null;
}

export interface AuditLogRow {
  id: string;
  action: string;
  actorRole: string;
  actorUserId: string | null;
  resource: string;
  resourceId: string;
  createdAt: string;
  /** Parsed acting-as context when the event was produced in Acting-As mode. */
  actingAsRole?: string | null;
  actingAsUserId?: string | null;
  ipAddress: string;
}

export interface AgentNetworkDepartment {
  key: string;
  name: string;
  icon: string;
  /** Number of logical agents defined for the department. */
  logicalAgents: number;
  /** Agents that exist as real rows in the database. */
  persistedAgents: number;
  active: number;
  paused: number;
  failed: number;
  waitingApproval: number;
  runningJobs: number;
  protectionMode: 'protected';
}

export interface AgentNetworkSummary {
  success: true;
  clusterName: string;
  totalLogicalAgents: number;
  totalPersistedAgents: number;
  active: number;
  paused: number;
  failed: number;
  waitingApproval: number;
  runningJobs: number;
  departments: AgentNetworkDepartment[];
  policies: string[];
  warnings: string[];
}
