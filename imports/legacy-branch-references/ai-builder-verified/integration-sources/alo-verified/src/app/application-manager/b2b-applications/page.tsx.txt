'use client'

import { ApplicationListPage } from '@/components/alo/portal/ApplicationListPage'

export default function B2BApplicationsPage() {
  return (
    <ApplicationListPage
      source="B2B"
      title="B2B Applications"
      description="Confidential B2B applications sourced via institutional partners. Restricted to application_manager / admin / super_admin roles."
      accentColor="purple"
      icon="building2"
      confidential
    />
  )
}
