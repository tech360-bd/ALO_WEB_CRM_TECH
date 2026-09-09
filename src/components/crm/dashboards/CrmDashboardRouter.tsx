'use client';

import { usePortalStore, type CrmRole } from '@/lib/stores/portal-store';
import CrmAdminDashboard from '@/components/crm/CrmAdminDashboard';
import CeoDashboard from '@/components/crm/dashboards/CeoDashboard';
import BranchManagerDashboard from '@/components/crm/dashboards/BranchManagerDashboard';
import CounselorDashboard from '@/components/crm/dashboards/CounselorDashboard';
import ApplicationTeamDashboard from '@/components/crm/dashboards/ApplicationTeamDashboard';
import VisaOfficerDashboard from '@/components/crm/dashboards/VisaOfficerDashboard';
import FinanceDashboard from '@/components/crm/dashboards/FinanceDashboard';
import MarketingDashboard from '@/components/crm/dashboards/MarketingDashboard';
import FrontDeskDashboard from '@/components/crm/dashboards/FrontDeskDashboard';
import HrDashboard from '@/components/crm/dashboards/HrDashboard';
import PartnerManagerDashboard from '@/components/crm/dashboards/PartnerManagerDashboard';
import DocumentReviewDashboard from '@/components/crm/dashboards/DocumentReviewDashboard';
import DataManagerDashboard from '@/components/crm/dashboards/DataManagerDashboard';
import SupportDashboard from '@/components/crm/dashboards/SupportDashboard';
import AiCommandDashboard from '@/components/crm/dashboards/AiCommandDashboard';

const dashboardMap: Record<CrmRole, React.ComponentType> = {
  super_admin: CrmAdminDashboard,
  ceo: CeoDashboard,
  branch_manager: BranchManagerDashboard,
  counselor: CounselorDashboard,
  application_team: ApplicationTeamDashboard,
  visa_officer: VisaOfficerDashboard,
  finance: FinanceDashboard,
  marketing_manager: MarketingDashboard,
  front_desk: FrontDeskDashboard,
  hr: HrDashboard,
  partner_manager: PartnerManagerDashboard,
  document_officer: DocumentReviewDashboard,
  data_manager: DataManagerDashboard,
  support_agent: SupportDashboard,
  ai_manager: AiCommandDashboard,
};

export default function CrmDashboardRouter() {
  const { user } = usePortalStore();

  const role = user?.crmRole || 'super_admin';
  const DashboardComponent = dashboardMap[role] || CrmAdminDashboard;

  return <DashboardComponent />;
}