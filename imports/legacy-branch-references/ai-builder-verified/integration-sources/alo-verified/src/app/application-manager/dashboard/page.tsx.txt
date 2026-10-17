'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Send, FileText, Building2, Layers, ArrowRight, Clock,
  CheckCircle2, AlertCircle, TrendingUp, Activity,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'

interface DashboardData {
  totals: { direct: number; partner: number; b2b: number; all: number }
  pipeline: {
    draft: number; submitted: number; under_review: number; offers: number;
    deposit_paid: number; cas_received: number; visa: number;
    enrolled: number; rejected: number; withdrawn: number;
  }
  submissionQueue: number
  byStatus: Array<{ status: string; count: number }>
  bySource: Array<{ source: string; count: number }>
  recentActivity: Array<{
    id: string
    applicationId: string | null
    fromStatus: string | null
    toStatus: string
    note: string | null
    changedAt: string
    studentName: string | null
    universityName: string | null
  }>
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  conditional_offer: 'Conditional Offer', unconditional_offer: 'Unconditional Offer',
  deposit_paid: 'Deposit Paid', cas_received: 'CAS Received',
  visa_applied: 'Visa Applied', visa_approved: 'Visa Approved',
  visa_refused: 'Visa Refused', enrolled: 'Enrolled',
  withdrawn: 'Withdrawn', rejected: 'Rejected', cancelled: 'Cancelled',
}

export default function ApplicationManagerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (!session) return
    fetch('/api/application-manager/dashboard', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${r.status}`)
        }
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalApps = data?.totals.all ?? 0
  const pipelineTotal = useMemo(() => {
    if (!data?.pipeline) return 0
    const p = data.pipeline
    return p.draft + p.submitted + p.under_review + p.offers + p.deposit_paid + p.cas_received + p.visa + p.enrolled + p.rejected + p.withdrawn
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Manager Dashboard"
        description="Pipeline view across direct, partner, and B2B applications. Advance statuses from the Submission Queue."
        action={
          <Button asChild className="h-12 bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
            <Link href="/application-manager/submission-queue">
              <Send className="h-4 w-4 mr-2" /> Submission Queue ({data?.submissionQueue ?? 0})
            </Link>
          </Button>
        }
      />

      {/* Source breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Direct Applications" value={data?.totals.direct ?? 0} icon={Send} accent="blue" />
        <StatCard label="Partner Applications" value={data?.totals.partner ?? 0} icon={FileText} accent="orange" />
        <StatCard label="B2B Applications" value={data?.totals.b2b ?? 0} icon={Building2} accent="purple" hint="Confidential — privileged access only" />
        <StatCard label="Total Applications" value={totalApps} icon={Layers} accent="green" />
      </div>

      {/* Pipeline */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Application Pipeline</h3>
          </div>
          <Link href="/application-manager/submission-queue" className="text-sm text-[#E8501A] hover:underline">
            Advance statuses →
          </Link>
        </div>
        {loading ? (
          <div className="h-32 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {[
              { label: 'Draft', value: data?.pipeline.draft ?? 0, color: 'bg-slate-400' },
              { label: 'Submitted', value: data?.pipeline.submitted ?? 0, color: 'bg-[#0057B8]' },
              { label: 'Under Review', value: data?.pipeline.under_review ?? 0, color: 'bg-blue-500' },
              { label: 'Offers', value: data?.pipeline.offers ?? 0, color: 'bg-green-500' },
              { label: 'Deposit', value: data?.pipeline.deposit_paid ?? 0, color: 'bg-emerald-600' },
              { label: 'CAS', value: data?.pipeline.cas_received ?? 0, color: 'bg-purple-500' },
              { label: 'Visa', value: data?.pipeline.visa ?? 0, color: 'bg-amber-500' },
              { label: 'Enrolled', value: data?.pipeline.enrolled ?? 0, color: 'bg-green-600' },
              { label: 'Rejected', value: data?.pipeline.rejected ?? 0, color: 'bg-red-500' },
              { label: 'Withdrawn', value: data?.pipeline.withdrawn ?? 0, color: 'bg-slate-500' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-100 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-1">{s.label}</p>
                <div className={`h-1 w-full rounded-full mt-2 ${s.color}`} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Submission queue + by status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-[#0057B8] to-[#0073E6] text-white">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-5 w-5" />
            <h3 className="font-bold">Submission Queue</h3>
          </div>
          <p className="text-4xl font-bold">{data?.submissionQueue ?? 0}</p>
          <p className="text-sm text-white/80 mt-1">Applications awaiting status advance</p>
          <Button asChild variant="secondary" className="mt-4 h-12 w-full">
            <Link href="/application-manager/submission-queue">
              Open Queue <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </Card>

        <Card className="p-6 border-0 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#E8501A]" />
            <h3 className="font-bold text-slate-900">Recent Status Changes</h3>
          </div>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {data.recentActivity.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#0057B8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {a.studentName || '—'} • {a.universityName || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.applicationId} • {a.fromStatus ? STATUS_LABELS[a.fromStatus] || a.fromStatus : '—'} → {STATUS_LABELS[a.toStatus] || a.toStatus}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(a.changedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No recent activity</p>
          )}
        </Card>
      </div>

      {/* By source */}
      <Card className="p-6 border-0 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Source Distribution</h3>
        {data?.bySource && data.bySource.length > 0 ? (
          <div className="space-y-2">
            {data.bySource.map((s) => {
              const pct = totalApps > 0 ? (s.count / totalApps) * 100 : 0
              return (
                <div key={s.source} className="flex items-center gap-3">
                  <div className="w-40 text-sm font-medium text-slate-700">{s.source || 'UNKNOWN'}</div>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E8501A] to-[#0057B8]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm font-semibold text-slate-900">{s.count} ({pct.toFixed(1)}%)</div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-6">No source data</p>
        )}
      </Card>
    </div>
  )
}
