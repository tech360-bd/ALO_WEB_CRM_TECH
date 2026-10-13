'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Users, FileText, Wallet, ShieldCheck, ArrowRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { StatCard } from '@/components/alo/portal/StatCard'
import { PageHeader } from '@/components/alo/portal/PortalPage'

interface DashboardData {
  partner: {
    id: string
    partnerId: string
    companyName: string
    status: string
    commissionRate: number
  }
  stats: {
    studentCount: number
    appCount: number
    commissionTotal: number
    commissionPending: number
    staffCount: number
    seatLimit: number
    seatsUsed: number
    offersCount: number
    visaApprovedCount: number
  }
  pipeline: Array<{ status: string; count: number }>
  recentApplications: Array<{
    id: string
    applicationId: string
    status: string
    student: { firstName: string; lastName: string }
    university: { name: string }
  }>
  recentCommissions: Array<{
    id: string
    commissionId: string
    amount: number
    status: string
    createdAt: string
  }>
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  conditional_offer: 'Conditional Offer',
  unconditional_offer: 'Unconditional Offer',
  deposit_paid: 'Deposit Paid',
  cas_received: 'CAS Received',
  visa_applied: 'Visa Applied',
  visa_approved: 'Visa Approved',
  visa_refused: 'Visa Refused',
  enrolled: 'Enrolled',
  withdrawn: 'Withdrawn',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export default function PartnerAdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      toast.error('Session expired')
      return
    }
    fetch('/api/partner-admin/dashboard', {
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

  const stats = data?.stats
  const pipelineTotal = useMemo(
    () => data?.pipeline.reduce((s, p) => s + p.count, 0) ?? 0,
    [data]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Admin Dashboard"
        description="Real-time KPIs for your organization. Staff seat usage, student/app volumes, commission earnings."
        action={
          <Button asChild className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0 h-12">
            <Link href="/partner-admin/users">
              <ShieldCheck className="h-4 w-4 mr-2" /> Manage Staff
            </Link>
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats?.studentCount ?? 0}
          icon={Users}
          accent="blue"
          hint="All students referred by your organization"
        />
        <StatCard
          label="Applications"
          value={stats?.appCount ?? 0}
          icon={FileText}
          accent="orange"
          hint="Across all intakes & universities"
        />
        <StatCard
          label="Commission Earned"
          value={`£${(stats?.commissionTotal ?? 0).toLocaleString()}`}
          icon={Wallet}
          accent="green"
          hint={`${stats?.commissionPending ?? 0} pending claims`}
        />
        <StatCard
          label="Staff Seats"
          value={`${stats?.seatsUsed ?? 0} / ${stats?.seatLimit ?? 3}`}
          icon={ShieldCheck}
          accent="purple"
          hint={`${(stats?.seatLimit ?? 3) - (stats?.seatsUsed ?? 0)} seats remaining`}
        />
      </div>

      {/* Seat progress + secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900">Staff Seat Usage</h3>
            <Badge className="bg-[#0057B8] text-white border-0">
              {(stats?.seatLimit ?? 3) - (stats?.seatsUsed ?? 0)} available
            </Badge>
          </div>
          <Progress
            value={((stats?.seatsUsed ?? 0) / (stats?.seatLimit ?? 3)) * 100}
            className="h-3"
          />
          <p className="text-xs text-slate-500 mt-2">
            Your subscription allows <b>{stats?.seatLimit ?? 3}</b> staff seats (1 super admin + 2 staff).{' '}
            <Link href="/partner-admin/users" className="text-[#0057B8] hover:underline">
              Manage seats →
            </Link>
          </p>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h3 className="font-bold text-slate-900">Outcomes</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Offers</span>
              <span className="font-semibold text-slate-900">{stats?.offersCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Visa Approved</span>
              <span className="font-semibold text-green-600">{stats?.visaApprovedCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pending Commissions</span>
              <span className="font-semibold text-[#E8501A]">{stats?.commissionPending ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Application Pipeline</h3>
          </div>
          <Link href="/partner-admin/reports" className="text-sm text-[#E8501A] hover:underline">
            View reports
          </Link>
        </div>
        {loading ? (
          <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
        ) : data?.pipeline && data.pipeline.length > 0 ? (
          <div className="space-y-2">
            {data.pipeline.map((stage) => {
              const pct = pipelineTotal > 0 ? (stage.count / pipelineTotal) * 100 : 0
              return (
                <div key={stage.status} className="flex items-center gap-3">
                  <div className="w-40 text-sm text-slate-700 font-medium">
                    {STATUS_LABELS[stage.status] || stage.status}
                  </div>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0057B8] to-[#0073E6]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold text-slate-900">{stage.count}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500">No applications in pipeline yet</div>
        )}
      </Card>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Recent Applications</h3>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          {data?.recentApplications && data.recentApplications.length > 0 ? (
            <div className="space-y-2">
              {data.recentApplications.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                    <FileText className="h-4 w-4 text-[#0057B8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {a.student?.firstName} {a.student?.lastName} • {a.university?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500">{a.applicationId}</p>
                  </div>
                  <Badge className="capitalize border-0 bg-slate-100 text-slate-700 text-xs">
                    {STATUS_LABELS[a.status] || a.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-slate-500">No applications yet</div>
          )}
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Recent Commissions</h3>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          {data?.recentCommissions && data.recentCommissions.length > 0 ? (
            <div className="space-y-2">
              {data.recentCommissions.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-[#E8501A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{c.commissionId}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">£{c.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-slate-500">No commission records</div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-6 border-0 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button asChild variant="outline" className="h-12 justify-start">
            <Link href="/partner-admin/company">
              <ArrowRight className="h-4 w-4 mr-2" /> Edit Company Profile
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 justify-start">
            <Link href="/partner-admin/users">
              <ArrowRight className="h-4 w-4 mr-2" /> Add Staff Member
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 justify-start">
            <Link href="/partner-admin/support">
              <AlertCircle className="h-4 w-4 mr-2" /> Open Support Ticket
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
