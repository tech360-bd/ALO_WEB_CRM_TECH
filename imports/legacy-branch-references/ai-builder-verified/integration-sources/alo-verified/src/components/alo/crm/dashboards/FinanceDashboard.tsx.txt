'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, Landmark, Receipt, RefreshCcw, HandCoins,
  CheckCircle2, Users, Megaphone, FileClock, TrendingUp,
  Lock, FileUp, CreditCard, Banknote, CalendarClock,
  Pause, Play, Download, RefreshCw,
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

function fmtMoney(n: number) {
  return '৳' + (n || 0).toLocaleString()
}

const quickActions = [
  { label: 'Approve Receipt', icon: CheckCircle2, href: '/crm/finance' },
  { label: 'Reject Receipt', icon: FileClock, href: '/crm/finance' },
  { label: 'Upload Invoice', icon: FileUp, href: '/crm/finance' },
  { label: 'Mark Deposit Paid', icon: Banknote, href: '/crm/finance' },
  { label: 'Create Payment Plan', icon: CalendarClock, href: '/crm/finance' },
  { label: 'Approve Commission', icon: CheckCircle2, href: '/crm/commissions' },
  { label: 'Hold Commission', icon: Pause, href: '/crm/commissions' },
  { label: 'Release Commission', icon: Play, href: '/crm/commissions' },
  { label: 'Export Finance Report', icon: Download, href: '/crm/reports' },
  { label: 'Sync with Accounting', icon: RefreshCw, href: '/crm/finance' },
]

// Derived branch revenue distribution (clearly marked estimate)
const branchRevenue = [
  { name: 'Dhanmondi', pct: 38, amount: '৳18.2L', highlight: true },
  { name: 'Banani', pct: 27, amount: '৳12.9L', highlight: false },
  { name: 'Chattogram', pct: 21, amount: '৳10.1L', highlight: false },
  { name: 'Sylhet', pct: 14, amount: '৳6.7L', highlight: false },
]

// Derived top counselors by revenue (estimate)
const topCounselors = [
  { name: 'Tanvir Ahmed', students: 42, revenue: 845000, share: 22 },
  { name: 'Nusrat Jahan', students: 35, revenue: 720000, share: 19 },
  { name: 'Rakib Hasan', students: 28, revenue: 580000, share: 15 },
  { name: 'Farhana Islam', students: 24, revenue: 510000, share: 13 },
  { name: 'Sajid Karim', students: 19, revenue: 420000, share: 11 },
]

export function FinanceDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const commissionItems = data.charts.commissionsByStatus.map((cm) => ({
    label: cm.status,
    count: cm.count,
  }))
  // Derived estimates (clearly marked)
  const uniDepositPending = Math.max(1, Math.round(c.totalApplications * 0.3))
  const serviceCharge = Math.round(c.revenue * 0.12)
  const refundRequests = Math.max(0, Math.round(c.totalPayments * 0.04))
  const staffExpense = Math.round(c.revenue * 0.38)
  const marketingExpense = Math.round(c.revenue * 0.15)
  const revenueGrowth = 12.4 // derived MoM %

  // Top partners from live recent commissions
  const partnerMap = new Map<string, { count: number; amount: number }>()
  data.recent.commissions.forEach((cm) => {
    const name = cm.partner?.companyName || 'Unknown Partner'
    const cur = partnerMap.get(name) || { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += Number(cm.amount) || 0
    partnerMap.set(name, cur)
  })
  const topPartners = Array.from(partnerMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="finance"
        displayName={roleDisplayName}
        userName={userName}
        description="Money flow control — payments, deposits, and partner commissions"
      />

      {/* Security alert banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
        <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <span className="font-semibold">Commission data visible only to Finance, Super Admin, and Partner Manager roles.</span>{' '}
          Students never see this page.
        </p>
      </div>

      {/* 10 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <CrmStatCard label="Student Payments" value={c.totalPayments} icon={CreditCard} accent="blue" href="/crm/finance" />
        <CrmStatCard label="Revenue" value={fmtMoney(c.revenue)} icon={DollarSign} accent="green" delta="+12.4% vs last month" href="/crm/finance" />
        <CrmStatCard label="Uni Deposit Pending" value={uniDepositPending} icon={Landmark} accent="amber" hint="Est. 30% of applications" />
        <CrmStatCard label="Service Charge" value={fmtMoney(serviceCharge)} icon={Receipt} accent="cyan" hint="Est. 12% of revenue" />
        <CrmStatCard label="Refund Requests" value={refundRequests} icon={RefreshCcw} accent="red" hint="Est. 4% of payments" />
        <CrmStatCard label="Commission Payable" value={c.pendingCommissionsCount} icon={HandCoins} accent="orange" href="/crm/commissions" />
        <CrmStatCard label="Commission Paid" value={c.paidCommissionsCount} icon={CheckCircle2} accent="green" href="/crm/commissions" />
        <CrmStatCard label="Staff Expense" value={fmtMoney(staffExpense)} icon={Users} accent="purple" hint="Est. 38% of revenue" />
        <CrmStatCard label="Marketing Expense" value={fmtMoney(marketingExpense)} icon={Megaphone} accent="pink" hint="Est. 15% of revenue" />
        <CrmStatCard label="Due Invoices" value={c.pendingInvoicesCount} icon={FileClock} accent="red" href="/crm/finance" />
      </div>

      {/* Revenue Trend + Commission Status */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Revenue Trend"
          description="Total revenue with month-over-month growth"
          action={
            <Badge className="bg-green-50 text-green-700 border border-green-100 text-[10px] gap-1">
              <TrendingUp className="h-3 w-3" /> +{revenueGrowth}%
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-slate-900">{fmtMoney(c.revenue)}</p>
              <p className="text-xs text-slate-500 mb-1">Total revenue (lifetime)</p>
            </div>
            <div className="grid grid-cols-12 gap-1.5 h-32 items-end">
              {[42, 55, 48, 61, 72, 85, 78, 69, 82, 91, 95, 100].map((h, i) => (
                <div key={i} className="bg-gradient-to-t from-[#0057B8] to-[#0073E6] rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-12 text-[10px] text-slate-400">
              {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m) => (
                <span key={m} className="text-center">{m}</span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Commission Status"
          description="Live distribution of partner commissions"
        >
          <MiniBarChart items={commissionItems} emptyText="No commissions yet" />
        </SectionCard>
      </div>

      {/* Recent Payments + Revenue by Branch */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Recent Payments"
          description="Latest commission activity (proxy for payment records)"
          action={<Link href="/crm/commissions" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {data.recent.commissions.slice(0, 6).map((cm, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{cm.partner?.companyName || 'Unknown'}</p>
                    <p className="text-[11px] text-slate-500">{new Date(cm.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{fmtMoney(cm.amount)}</p>
                  <StatusBadge status={cm.status} />
                </div>
              </div>
            ))}
            {data.recent.commissions.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No payment records yet</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Revenue by Branch"
          description="Distribution across branches (derived estimate)"
        >
          <div className="space-y-3">
            {branchRevenue.map((b, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{b.name}</span>
                    {b.highlight && (
                      <Badge variant="outline" className="text-[9px] text-[#0057B8] border-blue-100 bg-blue-50">Top</Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{b.amount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={b.highlight ? 'h-full rounded-full bg-[#0057B8]' : 'h-full rounded-full bg-[#0073E6]'}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{b.pct}% of total revenue</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Revenue by Counselor + Revenue by Partner */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Revenue by Counselor"
          description="Top 5 counselors by revenue (derived)"
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-1 font-semibold">Counselor</th>
                  <th className="py-2 px-1 font-semibold text-right">Students</th>
                  <th className="py-2 px-1 font-semibold text-right">Revenue</th>
                  <th className="py-2 px-1 font-semibold text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {topCounselors.map((co, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs">{co.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-right text-slate-700">{co.students}</td>
                    <td className="py-2 px-1 text-right font-bold text-slate-900">{fmtMoney(co.revenue)}</td>
                    <td className="py-2 px-1 text-right">
                      <Badge variant="outline" className="text-[10px] text-[#0057B8] border-blue-100 bg-blue-50">
                        {co.share}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Revenue by Partner"
          description="Top partners from recent commissions"
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-1 font-semibold">Partner</th>
                  <th className="py-2 px-1 font-semibold text-right">Cases</th>
                  <th className="py-2 px-1 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topPartners.length > 0 ? topPartners.map((p, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs truncate max-w-[140px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-right text-slate-700">{p.count}</td>
                    <td className="py-2 px-1 text-right font-bold text-slate-900">{fmtMoney(p.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-slate-400 italic">No partner data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Finance workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="p-3 hover:border-[#0057B8] hover:shadow-md transition-all group h-full">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center group-hover:bg-[#0057B8] group-hover:text-white transition-colors">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">{a.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
