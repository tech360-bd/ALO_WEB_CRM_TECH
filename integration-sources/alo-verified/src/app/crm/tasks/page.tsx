'use client'

import { PageHeader } from '@/components/alo/portal/PortalPage'
import { CheckSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function CrmTasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Follow-ups"
        description="Track assigned tasks, follow-ups, and SLA timers across students, applications, and partners."
      />
      <Card className="p-10 text-center border-dashed border-2">
        <CheckSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Tasks board with kanban view, due-date alerts, priority sorting, and bulk assignment will be assembled here.
        </p>
      </Card>
    </div>
  )
}
