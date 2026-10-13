'use client'

import { ApplicationListPage } from '@/components/alo/portal/ApplicationListPage'

export default function DirectApplicationsPage() {
  return (
    <ApplicationListPage
      source="DIRECT"
      title="Direct Applications"
      description="Applications submitted directly by students (no partner involvement). Source = DIRECT."
      accentColor="blue"
      icon="send"
    />
  )
}
