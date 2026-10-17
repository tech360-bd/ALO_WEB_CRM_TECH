'use client'

import { useState, useEffect } from 'react'
import { PortalShell, filterCrmNavForRole } from '@/components/alo/portal/PortalShell'
import { getSession, type AloSession } from '@/lib/session'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AloSession | null>(null)

  useEffect(() => {
    setSessionState(getSession())
  }, [])

  const roleName = session?.roles?.[0]?.name
  const navGroups = filterCrmNavForRole(roleName)

  return (
    <PortalShell
      workspace="crm"
      navGroups={navGroups}
      brandLabel="ALO CRM"
      brandSubLabel="Employee Workspace"
    >
      {children}
    </PortalShell>
  )
}
