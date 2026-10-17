'use client'

import { PageHeader } from '@/components/alo/portal/PortalPage'
import { Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function CrmCommissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Partner commission ledger — eligible, requested, paid, and held. Restricted to Finance, Partner Manager, and Super Admin."
      />
      <Card className="p-10 text-center border-dashed border-2">
        <Wallet className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Commission approval workflow, payment scheduling, partner statement generation, and reconciliation tools will be assembled here. Students never see this page.
        </p>
      </Card>
    </div>
  )
}
