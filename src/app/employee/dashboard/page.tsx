'use client';

import { useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { useRouter } from 'next/navigation';
import UnifiedEmployeeDashboard from '@/components/employee/UnifiedEmployeeDashboard';

const ROLE_REDIRECT: Record<string,string> = {
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
  const user = usePortalStore(s=>s.user);
  const router = useRouter();
  useEffect(()=>{
    if(!user) return;
    const roles = (user as any)?.roles || [];
    const firstRole = typeof roles[0]==='string' ? roles[0] : roles[0]?.name;
    const key = String(firstRole||'COUNSELOR').toUpperCase();
    const target = ROLE_REDIRECT[key];
    if(target && window.location.pathname === '/employee/dashboard'){
      router.replace(target);
    }
  },[user]);
  return <UnifiedEmployeeDashboard />;
}
