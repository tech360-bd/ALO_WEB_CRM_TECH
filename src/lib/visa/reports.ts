import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, isVisaSuperAdmin, visaCaseListScope } from '@/lib/visa/access';

export const VISA_REPORT_TYPES = ['daily_interview', 'weekly_readiness', 'high_risk', 'missing_docs', 'funding', 'study_gap', 'refusal', 'officer_performance', 'counselor_pending', 'pipeline'] as const;
export type VisaReportType = typeof VISA_REPORT_TYPES[number];

const REPORT_ALIASES: Record<string, VisaReportType> = {
  daily: 'daily_interview', 'high-risk': 'high_risk', 'missing-docs': 'missing_docs',
  'funding-review': 'funding', 'study-gap': 'study_gap', 'refusal-review': 'refusal',
  'officer-performance': 'officer_performance', 'counselor-pending': 'counselor_pending',
  'pipeline-overview': 'pipeline', readiness: 'weekly_readiness', weekly: 'weekly_readiness',
};

export function normalizeVisaReportType(value: string): VisaReportType | null {
  const normalized = value.trim().toLowerCase();
  if ((VISA_REPORT_TYPES as readonly string[]).includes(normalized)) return normalized as VisaReportType;
  return REPORT_ALIASES[normalized] || null;
}

export function canUseVisaReport(auth: AuthContext, reportType: VisaReportType, action: 'view' | 'export' = 'view') {
  if (isVisaSuperAdmin(auth)) return true;
  if (!hasVisaPermission(auth, action === 'export' ? 'visa.reports.export' : 'visa.reports.view')) return false;
  if (reportType === 'high_risk' || reportType === 'funding' || reportType === 'study_gap' || reportType === 'refusal') return hasVisaPermission(auth, 'visa.risk.view');
  if (reportType === 'weekly_readiness') return hasVisaPermission(auth, 'visa.readiness.view');
  if (reportType === 'missing_docs') return hasVisaPermission(auth, 'visa.documents.view');
  if (reportType === 'daily_interview') return hasVisaPermission(auth, 'visa.interviews.view');
  if (reportType === 'counselor_pending') return hasVisaPermission(auth, 'visa.tasks.view');
  if (reportType === 'pipeline') return hasVisaPermission(auth, 'visa.dashboard.view');
  if (reportType === 'officer_performance') return hasVisaPermission(auth, 'visa.reports.staff_performance.view');
  return false;
}

export async function getAuthorizedVisaCaseIds(auth: AuthContext): Promise<string[] | null> {
  const scope = visaCaseListScope(auth);
  if (!scope || scope.viewScope !== 'full') return null;
  const cases = await db.visaCase.findMany({ where: scope.where as any, select: { id: true } });
  return cases.map((visaCase) => visaCase.id);
}

export function reportCaseIds(report: { filters: string }): string[] | null {
  try {
    const filters = JSON.parse(report.filters || '{}');
    return Array.isArray(filters.scopeCaseIds) && filters.scopeCaseIds.every((id: unknown) => typeof id === 'string') ? filters.scopeCaseIds : null;
  } catch {
    return null;
  }
}

export async function isVisaReportInCurrentScope(auth: AuthContext, report: { filters: string; reportType: string }) {
  if (isVisaSuperAdmin(auth)) return true;
  const type = normalizeVisaReportType(report.reportType);
  if (!type || !canUseVisaReport(auth, type, 'view')) return false;
  const storedCaseIds = reportCaseIds(report);
  if (!storedCaseIds) return false;
  const currentCaseIds = await getAuthorizedVisaCaseIds(auth);
  if (!currentCaseIds) return false;
  const current = new Set(currentCaseIds);
  return storedCaseIds.every((id) => current.has(id));
}
