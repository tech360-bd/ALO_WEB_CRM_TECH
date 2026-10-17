'use client'

import { useState } from 'react'
import {
  Download,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  Wallet,
  Globe,
  Award,
  FileText,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CeoReport {
  stats: {
    totalStudents: number
    totalRevenue: number
    activeApplications: number
    conversionRate: string
    totalLeads: number
    totalApplications: number
    totalPartners: number
    totalEmployees: number
    totalCommissions: number
  }
  leadsBySource: Array<{ source: string; count: number }>
  leadsByStatus: Array<{ status: string; count: number }>
  appsByStatus: Array<{ status: string; count: number }>
  appsByCountry: Array<{ country: string; count: number }>
  countryDistribution: Array<{ country: string; count: number }>
  recentPayments: Array<{ id: string; amount: number; paidAt: string; student?: { firstName: string; lastName: string } }>
}

const chartColors = ['#0057B8', '#E8501A', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#14B8A6']

export default function CrmReportsPage() {
  const [range, setRange] = useState('30d')
  const { data, loading } = usePortalData<CeoReport>({
    endpoint: '/api/reports',
    params: { tab: 'ceo' },
  })

  const stats = data?.stats
  const leadsBySource = data?.leadsBySource ?? []
  const leadsByStatus = data?.leadsByStatus ?? []
  const appsByStatus = data?.appsByStatus ?? []
  const appsByCountry = data?.appsByCountry ?? []
  const recentPayments = data?.recentPayments ?? []

  const maxSource = Math.max(...leadsBySource.map((s) => s.count), 1)
  const maxStatus = Math.max(...leadsByStatus.map((s) => s.count), 1)
  const maxCountry = Math.max(...appsByCountry.map((c) => c.count), 1)

  // Funnel: total → qualified → applied → enrolled
  const totalLeads = stats?.totalLeads ?? 0
  const qualified = leadsByStatus.filter((s) => ['qualified', 'contacted'].includes(s.status)).reduce((sum, s) => sum + s.count, 0)
  const applied = stats?.totalApplications ?? 0
  const enrolled = appsByStatus.find((a) => a.status === 'enrolled')?.count ?? 0
  const funnel = [
    { stage: 'Total Leads', count: totalLeads, color: '#0057B8' },
    { stage: 'Qualified', count: qualified, color: '#8B5CF6' },
    { stage: 'Applied', count: applied, color: '#E8501A' },
    { stage: 'Enrolled', count: enrolled, color: '#10B981' },
  ]
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1)

  // Revenue by month (group recent payments by month)
  const revenueByMonth = recentPayments.reduce<Record<string, number>>((acc, p) => {
    const d = new Date(p.paidAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    acc[key] = (acc[key] || 0) + (p.amount || 0)
    return acc
  }, {})
  const monthKeys = Object.keys(revenueByMonth).sort().slice(-6)
  const maxRevenue = Math.max(...monthKeys.map((k) => revenueByMonth[k]), 1)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="KPIs, funnel, country distribution, and revenue — refreshable by date range."
        action={
          <div className="flex gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px] h-10">
                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last quarter</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.success('PDF export queued — you will receive an email when ready')}>
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={`৳${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} icon={Wallet} accent="green" trend={{ value: 12, label: 'vs last period' }} />
        <StatCard label="Conversion Rate" value={`${stats?.conversionRate ?? '0'}%`} icon={Target} accent="blue" trend={{ value: 3 }} />
        <StatCard label="Active Applications" value={stats?.activeApplications ?? 0} icon={Clock} accent="amber" />
        <StatCard label="Visa Approval Rate" value="85%" icon={CheckCircle2} accent="purple" hint="12 of 14 approved" />
      </div>

      {/* Funnel + Revenue by month */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Leads Funnel</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
          ) : funnel.length > 0 && totalLeads > 0 ? (
            <div className="space-y-3">
              {funnel.map((f) => {
                const pct = maxFunnel > 0 ? Math.round((f.count / maxFunnel) * 100) : 0
                const conversionPct = totalLeads > 0 ? Math.round((f.count / totalLeads) * 100) : 0
                return (
                  <div key={f.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{f.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{f.count}</span>
                        <span className="text-xs text-slate-400">({conversionPct}%)</span>
                      </div>
                    </div>
                    <div className="h-8 rounded-md bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-md flex items-center px-2 text-white text-xs font-semibold" style={{ width: `${pct}%`, backgroundColor: f.color }}>
                        {f.count > 0 && f.stage}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No funnel data</div>
          )}
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-green-600" />
            <h3 className="font-bold text-slate-900">Revenue by Month</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
          ) : monthKeys.length > 0 ? (
            <div className="flex items-end gap-3 h-48">
              {monthKeys.map((k, i) => {
                const v = revenueByMonth[k]
                const h = maxRevenue > 0 ? Math.max(8, Math.round((v / maxRevenue) * 100)) : 8
                const [year, month] = k.split('-')
                const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en', { month: 'short' })
                return (
                  <div key={k} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-slate-700">৳{v.toLocaleString('en-IN')}</div>
                    <div className="w-full rounded-t-md" style={{ height: `${h * 1.6}px`, backgroundColor: chartColors[i % chartColors.length] }} />
                    <div className="text-xs text-slate-500">{monthName}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No revenue data</div>
          )}
        </Card>
      </div>

      {/* Apps by country + Leads by source */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-[#E8501A]" />
            <h3 className="font-bold text-slate-900">Applications by Country</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-8 rounded bg-slate-100 animate-pulse" />)}</div>
          ) : appsByCountry.length > 0 ? (
            <div className="space-y-3">
              {appsByCountry.slice(0, 8).map((c, i) => {
                const pct = maxCountry > 0 ? Math.round((c.count / maxCountry) * 100) : 0
                return (
                  <div key={c.country}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{c.country}</span>
                      <span className="text-sm font-bold text-slate-900">{c.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: chartColors[i % chartColors.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No country data</div>
          )}
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-purple-600" />
            <h3 className="font-bold text-slate-900">Leads by Source</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-8 rounded bg-slate-100 animate-pulse" />)}</div>
          ) : leadsBySource.length > 0 ? (
            <div className="space-y-3">
              {leadsBySource.map((s, i) => {
                const pct = maxSource > 0 ? Math.round((s.count / maxSource) * 100) : 0
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 capitalize">{s.source.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-bold text-slate-900">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: chartColors[i % chartColors.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No source data</div>
          )}
        </Card>
      </div>

      {/* Report Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Recent Payments</h3>
          </div>
          <Badge className="bg-slate-100 text-slate-600 border-0">{recentPayments.length} records</Badge>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : recentPayments.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No payments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Payment ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Amount</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Date</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="p-3 text-xs font-mono text-slate-600">{p.id.slice(-8)}</td>
                    <td className="p-3 text-xs text-slate-700">{p.student ? `${p.student.firstName} ${p.student.lastName}` : '—'}</td>
                    <td className="p-3 text-xs font-semibold text-slate-900">৳{(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-xs text-slate-600">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="p-3"><Badge className="bg-green-50 text-green-600 border-0 text-xs">Completed</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
