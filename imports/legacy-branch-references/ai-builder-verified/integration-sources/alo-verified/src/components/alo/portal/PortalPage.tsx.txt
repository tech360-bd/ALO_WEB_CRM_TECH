'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PortalPageProps {
  title: string
  description: string
  workspace: 'student' | 'partner' | 'crm'
  children?: React.ReactNode
}

/**
 * Temporary placeholder for portal routes under active development.
 * Subagents will replace these with full implementations.
 */
export function PortalPagePlaceholder({ title, description, workspace }: PortalPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <Card className="p-12 border-dashed border-2 border-slate-200 bg-slate-50/50">
        <div className="text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <Construction className="h-7 w-7 text-[#0057B8]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-5">
            This module is being assembled. Core data and workflows are already connected
            in the database — the full interface lands shortly.
          </p>
          <Button asChild variant="outline">
            <Link href={`/${workspace}/dashboard`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
