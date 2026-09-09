'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';

// Student
import StudentPortalShell from '@/components/student/StudentPortalShell';
import StudentViewRouter from '@/components/student/StudentViewRouter';
// Employee
import EmployeePortalShell from '@/components/employee/EmployeePortalShell';
import EmployeeViewRouter from '@/components/employee/EmployeeViewRouter';
// Partner
import PartnerPortalShell from '@/components/partner/PartnerPortalShell';
import PartnerViewRouter from '@/components/partner/PartnerViewRouter';
// CRM Admin
import CrmAdminShell from '@/components/crm/CrmAdminShell';
import CrmViewRouter from '@/components/crm/CrmViewRouter';
// Marketing
import MarketingHubShell from '@/components/marketing/hub/MarketingHubShell';
// Counselor
import CounselorPortalShell from '@/components/counselor/CounselorPortalShell';
import CounselorViewRouter from '@/components/counselor/CounselorViewRouter';

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);
  const userType = usePortalStore((s) => s.userType);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (userType === 'STUDENT') {
    return <StudentPortalShell><StudentViewRouter /></StudentPortalShell>;
  }
  if (userType === 'EMPLOYEE') {
    return <EmployeePortalShell><EmployeeViewRouter /></EmployeePortalShell>;
  }
  if (userType === 'PARTNER') {
    return <PartnerPortalShell><PartnerViewRouter /></PartnerPortalShell>;
  }
  if (userType === 'MARKETING' || userType === 'MARKETING_MANAGER') {
    return <MarketingHubShell />;
  }
  if (userType === 'ADMIN' || userType === 'SUPER_ADMIN') {
    return <CrmAdminShell><CrmViewRouter /></CrmAdminShell>;
  }

  return null;
}
