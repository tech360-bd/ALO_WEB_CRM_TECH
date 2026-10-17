'use client'

import { PageHeader } from '@/components/alo/portal/PortalPage'
import { CalendarCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function CrmAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Calendar view of consultations, follow-ups, mock interviews, and walk-ins."
      />
      <Card className="p-10 text-center border-dashed border-2">
        <CalendarCheck className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Calendar with day/week/month views, counselor availability, and student appointment booking will be assembled here.
        </p>
      </Card>
    </div>
  )
}
