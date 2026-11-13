'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedEmployeeDashboard from '@/components/employee/UnifiedEmployeeDashboard';

const ROLE_REDIRECT: Record<string, string> = {
  COUNSELOR: '/employee/counselor-dashboard',
  SENIOR_COUNSELOR: '/employee/senior-counselor-dashboard',
  APPLICATION_TEAM: '/employee/application-dashboard',
  APPLICATION_MANAGER: '/employee/application-manager-dashboard',
  VISA_OFFICER: '/employee/visa-dashboard',
  VISA_INTERVIEW_OFFICER: '/employee/visa-interview-dashboard',
  FINANCE: '/employee/finance-dashboard',
  MARKETING: '/employee/marketing-dashboard',
  MARKETING_MANAGER: '/employee/marketing-manager-dashboard',
  HR_MANAGER: '/employee/hr-dashboard',
  BRANCH_MANAGER: '/employee/branch-manager-dashboard',
  COUNTRY_MANAGER: '/employee/country-manager-dashboard',
  OFFICE_MANAGER: '/employee/office-manager-dashboard',
  FRONT_DESK: '/employee/front-desk-dashboard',
  SUPPORT_STAFF: '/employee/support-dashboard',
  PARTNER_MANAGER: '/employee/partner-manager-dashboard',
};

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/employee/dashboard', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success || typeof payload.userRole !== 'string') {
          throw new Error(payload?.error || `Dashboard access denied (HTTP ${response.status}).`);
        }
        if (cancelled) return;
        const serverRole = payload.userRole.trim().replace(/[\s-]+/g, '_').toUpperCase();
        const target = ROLE_REDIRECT[serverRole];
        if (target) {
          router.replace(target);
          return;
        }
        setRole(serverRole);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Dashboard could not be loaded.');
      });
    return () => { cancelled = true; };
  }, [router]);

  if (error) {
    return <div role="alert" className="rounded-xl border border-crm-danger-border bg-crm-danger-bg p-5 text-sm text-crm-danger-text">{error}</div>;
  }
  if (!role) return <div className="p-6 text-sm text-[var(--alo-text-muted)]" aria-live="polite">Loading authorized employee dashboard…</div>;
  return <UnifiedEmployeeDashboard forcedRole={role} />;
}
