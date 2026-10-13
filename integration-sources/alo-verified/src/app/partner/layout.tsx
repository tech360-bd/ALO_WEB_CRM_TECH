'use client'

import { PortalShell, partnerNav } from '@/components/alo/portal/PortalShell'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      workspace="partner"
      navGroups={partnerNav}
      brandLabel="ALO Partner"
      brandSubLabel="Partner Portal"
    >
      {children}
    </PortalShell>
  )
}
