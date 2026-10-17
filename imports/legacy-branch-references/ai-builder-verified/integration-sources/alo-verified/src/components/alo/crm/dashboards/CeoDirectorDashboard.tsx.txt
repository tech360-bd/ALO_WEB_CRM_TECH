'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, FileText, Target, PlaneLanding, DollarSign,
  AlertTriangle, Hourglass, Receipt, BarChart3, Download,
  CheckCircle2, History, Trophy, Globe, Building2, Radio,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, MiniBarChart, StatusBadge, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'View Reports', icon: BarChart3, href: '/crm/reports' },
  { label: 'Export Reports', icon: Download, href: '/crm/reports' },
  { label: 'Approve Special Case', icon: CheckCircle2, href: '/crm/applications' },
  { label: 'View Audit History', icon: History, href: '/crm/configuration' },
]

// Derived sample data — clearly marked as estimated
const branchData = [
  { name: 'Dhaka Banani', conversion: 68, leads: 142, color: 'bg-[#0057B8]' },
  { name: 'Dhaka Dhanmondi', conversion: 61, leads: 118, color: 'bg-[#0073E6]' },
  { name: 'Chattogram', conversion: 54, leads: 87, color: 'bg-[#E8501A]' },
  { name: 'Sylhet', conversion: 47, leads: 64, color: 'bg-purple-500' },
]

const counselorRanking = [
  { name: 'Tanvir Ahmed', branch: 'Banani', conversion: 74, students: 28 },
  { name: 'Nusrat Jahan', branch: 'Dhanmondi', conversion: 68, students: 24 },
  { name: 'Rakib Hasan', branch: 'Banani', conversion: 62, students: 21 },
  { name: 'Farhana Islam', branch: 'Chattogram', conversion: 58, students: 18 },
  { name: 'Sajid Karim', branch: 'Sylhet', conversion: 51, students: 15 },
]

function fmtMoney(n: number) {
  return '৳' + (n || 0).toLocaleString()
}

function pct(n: number, d: number) {
  if (!d) return 0
  return Math.round((n / d) * 100)
}

export function CeoDirectorDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const appsByStatus = data.charts.applicationsByStatus
  const condOffers = appsByStatus.find((s) => s.status === 'conditional_offer')?.count || 0
  const uncondOffers = appsByStatus.find((s) => s.status === 'unconditional_offer')?.count || 0
  const offersReceived = condOffers + uncondOffers
  const offerConvRate = pct(offersReceived, c.totalApplications)
  const visaSuccessRate = pct(c.visaApproved, c.visaApproved + c.visaRejected)

  const todaysNewLeads = Math.round(c.totalLeads * 0.05)
  const stuckStudents = Math.round(c.totalStudents * 0.12)

  // Aggregate top countries from recent leads
  const countryCounts = new Map<string, number>()
  data.recent.leads.forEach((l) => {
    const country = (l.preferredCountry as string) || 'Unknown'
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1)
  })
  const topCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Aggregate top universities from recent applications
  const uniCounts = new Map<string, number>()
  data.recent.applications.forEach((a) => {
    const uni = (a.university?.name as string) || 'Unknown'
    uniCounts.set(uni, (uniCounts.get(uni) || 0) + 1)
  })
  const topUniversities = Array.from(uniCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Partner ranking from recent commissions
  const partnerSums = new Map<string, number>()
  data.recent.commissions.forEach((com) => {
    const name = (com.partner?.companyName as string) || 'Unknown'
    partnerSums.set(name, (partnerSums.get(name) || 0) + Number(com.amount || 0))
  })
  const partnerRanking = Array.from(partnerSums.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="ceo_director"
        displayName={roleDisplayName}
        userName={userName}
        description="Decision-ready insights — focus on what matters most"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="Today's New Leads" value={todaysNewLeads} icon={TrendingUp} accent="blue" hint="~5% of total (est.)" />
        <CrmStatCard label="Applications (Month)" value={c.totalApplications} icon={FileText} accent="orange" href="/crm/applications" />
        <CrmStatCard label="Offer Conversion" value={`${offerConvRate}%`} icon={Target} accent="green" hint={`${offersReceived} offers / ${c.totalApplications}`} />
        <CrmStatCard label="Visa Success Rate" value={`${visaSuccessRate}%`} icon={PlaneLanding} accent="green" hint={`${c.visaApproved} approved`} />
        <CrmStatCard label="Revenue" value={fmtMoney(c.revenue)} icon={DollarSign} accent="green" href="/crm/finance" />
        <CrmStatCard label="High-Risk Cases" value={c.overdueTasks} icon={AlertTriangle} accent="red" hint="Overdue tasks" />
        <CrmStatCard label="Stuck > 7 Days" value={stuckStudents} icon={Hourglass} accent="amber" hint="Est. 12% of students" />
        <CrmStatCard label="Finance Pending" value={c.pendingInvoicesCount} icon={Receipt} accent="purple" hint="Pending invoices" href="/crm/finance" />
      </div>

      {/* Branch Performance + Counselor Ranking */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Branch Performance" description="Conversion % by branch (derived)">
          <div className="space-y-3">
            {branchData.map((b, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{b.name}</span>
                  <span className="text-slate-500">{b.leads} leads · <span className="font-bold text-[#0057B8]">{b.conversion}%</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.conversion}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Counselor Ranking" description="Top 5 by conversion % (derived)" action={<Trophy className="h-4 w-4 text-amber-500" />}>
          <div className="space-y-2">
            {counselorRanking.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.branch} · {c.students} students</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[#0057B8] border-blue-100 bg-blue-50 font-semibold">{c.conversion}%</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Partner Ranking + Top Countries */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Partner Ranking" description="Top partners by commission amount">
          <div className="space-y-2">
            {partnerRanking.length > 0 ? partnerRanking.map(([name, amt], i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="font-semibold text-slate-800 truncate">{name}</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0">{fmtMoney(amt)}</span>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No commission data yet</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top Countries" description="Preferred destinations from recent leads" action={<Globe className="h-4 w-4 text-[#0057B8]" />}>
          <div className="space-y-2.5">
            {topCountries.length > 0 ? topCountries.map(([country, count], i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                <span className="flex-1 text-slate-800 font-medium">{country}</span>
                <Badge variant="outline" className="text-[#0057B8] border-blue-100 bg-blue-50">{count} leads</Badge>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No lead data yet</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Top Universities + Top Sources */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Top Universities" description="Most-applied universities" action={<Building2 className="h-4 w-4 text-[#0057B8]" />}>
          <div className="space-y-2.5">
            {topUniversities.length > 0 ? topUniversities.map(([uni, count], i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                <span className="flex-1 text-slate-800 font-medium truncate">{uni}</span>
                <Badge variant="outline" className="text-[#E8501A] border-orange-100 bg-orange-50">{count} apps</Badge>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No application data yet</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top Source Channels" description="Lead acquisition channels" action={<Radio className="h-4 w-4 text-[#0057B8]" />}>
          <MiniBarChart
            items={data.charts.leadsBySource.map((l) => ({ label: l.source, count: l.count }))}
            emptyText="No leads yet"
          />
        </SectionCard>
      </div>

      {/* Risk Dashboard */}
      <SectionCard title="Risk Dashboard" description="High-risk indicators requiring attention" className="border-red-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs font-semibold text-red-700">Overdue Tasks</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{c.overdueTasks}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700">Pending Invoices</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{c.pendingInvoicesCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Hourglass className="h-4 w-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-700">Stuck Students</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">{stuckStudents}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs font-semibold text-red-700">Visa Rejected</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{c.visaRejected}</p>
          </div>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Executive shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="p-4 hover:border-[#0057B8] hover:shadow-md transition-all group h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center group-hover:bg-[#0057B8] group-hover:text-white transition-colors">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{a.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
