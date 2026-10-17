'use client'

import { PortalShell, studentNav } from '@/components/alo/portal/PortalShell'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      workspace="student"
      navGroups={studentNav}
      brandLabel="ALO Student"
      brandSubLabel="Student Portal"
    >
      {children}
    </PortalShell>
  )
}
