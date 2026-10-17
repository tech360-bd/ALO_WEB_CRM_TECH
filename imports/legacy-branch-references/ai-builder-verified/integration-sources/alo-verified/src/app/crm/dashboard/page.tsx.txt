'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { getSession } from '@/lib/session'
import { useCrmDashboard } from '@/hooks/use-crm-dashboard'
import { DashboardLoading, DashboardError } from '@/components/alo/crm/dashboards/shared'

// Lazy-load each dashboard so Turbopack only compiles the one needed.
// This drastically reduces memory pressure on first visit.
const SuperAdminDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
)
const CeoDirectorDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/CeoDirectorDashboard').then((m) => ({ default: m.CeoDirectorDashboard }))
)
const BranchManagerDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/BranchManagerDashboard').then((m) => ({ default: m.BranchManagerDashboard }))
)
const CounselorDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/CounselorDashboard').then((m) => ({ default: m.CounselorDashboard }))
)
const ApplicationTeamDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/ApplicationTeamDashboard').then((m) => ({ default: m.ApplicationTeamDashboard }))
)
const VisaOfficerDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/VisaOfficerDashboard').then((m) => ({ default: m.VisaOfficerDashboard }))
)
const FinanceDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard }))
)
const MarketingDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/MarketingDashboard').then((m) => ({ default: m.MarketingDashboard }))
)
const FrontDeskDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/FrontDeskDashboard').then((m) => ({ default: m.FrontDeskDashboard }))
)
const HrDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/HrDashboard').then((m) => ({ default: m.HrDashboard }))
)
const PartnerManagerDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/PartnerManagerDashboard').then((m) => ({ default: m.PartnerManagerDashboard }))
)
const DocumentReviewDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/DocumentReviewDashboard').then((m) => ({ default: m.DocumentReviewDashboard }))
)
const DataManagerDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/DataManagerDashboard').then((m) => ({ default: m.DataManagerDashboard }))
)
const SupportDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/SupportDashboard').then((m) => ({ default: m.SupportDashboard }))
)
const AiCommandDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/AiCommandDashboard').then((m) => ({ default: m.AiCommandDashboard }))
)
const GenericEmployeeDashboard = lazy(() =>
  import('@/components/alo/crm/dashboards/GenericEmployeeDashboard').then((m) => ({ default: m.GenericEmployeeDashboard }))
)

interface DashboardProps {
  data: import('@/hooks/use-crm-dashboard').CrmDashboardData
  userName: string
  roleDisplayName: string
}

export default function CrmDashboardPage() {
  const [roleName, setRoleName] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('User')
  const [roleDisplayName, setRoleDisplayName] = useState<string>('Employee')

  useEffect(() => {
    const s = getSession()
    if (s) {
      setRoleName(s.roles[0]?.name || 'employee')
      setUserName(s.user.name)
      setRoleDisplayName(s.roles[0]?.displayName || 'Employee')
    }
  }, [])

  const { data, loading, error } = useCrmDashboard()

  if (!roleName) return <DashboardLoading />
  if (loading) return <DashboardLoading />
  if (error) return <DashboardError message={error} />
  if (!data) return <DashboardError message="No data" />

  const props: DashboardProps = { data, userName, roleDisplayName }

  const renderDashboard = () => {
    switch (roleName) {
      case 'super_admin':
      case 'admin':
        return <SuperAdminDashboard {...props} />
      case 'ceo_director':
        return <CeoDirectorDashboard {...props} />
      case 'branch_manager':
      case 'country_manager':
      case 'office_manager':
        return <BranchManagerDashboard {...props} />
      case 'counselor':
      case 'junior_counselor':
        return <CounselorDashboard {...props} />
      case 'application_team':
        return <ApplicationTeamDashboard {...props} />
      case 'visa_officer':
        return <VisaOfficerDashboard {...props} />
      case 'finance':
        return <FinanceDashboard {...props} />
      case 'marketing_manager':
      case 'marketing_executive':
        return <MarketingDashboard {...props} />
      case 'front_desk':
        return <FrontDeskDashboard {...props} />
      case 'hr_manager':
        return <HrDashboard {...props} />
      case 'partner_manager':
        return <PartnerManagerDashboard {...props} />
      case 'document_officer':
        return <DocumentReviewDashboard {...props} />
      case 'data_manager':
        return <DataManagerDashboard {...props} />
      case 'support_agent':
        return <SupportDashboard {...props} />
      case 'ai_manager':
        return <AiCommandDashboard {...props} />
      default:
        return <GenericEmployeeDashboard {...props} />
    }
  }

  return <Suspense fallback={<DashboardLoading />}>{renderDashboard()}</Suspense>
}
