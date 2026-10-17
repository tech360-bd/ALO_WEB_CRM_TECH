'use client'

import { ApplicationListPage } from '@/components/alo/portal/ApplicationListPage'

export default function PartnerApplicationsPage() {
  return (
    <ApplicationListPage
      source="PARTNER"
      title="Partner Applications"
      description="Applications sourced through partner channels — source = PARTNER_INBOUND or PARTNER_OUTBOUND. Partner contact details are visible."
      accentColor="orange"
      icon="fileText"
    />
  )
}
