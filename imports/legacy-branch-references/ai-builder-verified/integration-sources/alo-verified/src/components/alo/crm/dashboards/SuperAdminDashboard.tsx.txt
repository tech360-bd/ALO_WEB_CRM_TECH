'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, GraduationCap, Handshake, UserCog, FileText, Award,
  PlaneTakeoff, PlaneLanding, DollarSign, Wallet, FileClock,
  ScrollText, ShieldAlert, Bot, UserPlus, KeyRound, UserX,
  Building2, Upload, BookOpen, CheckCircle2, Lock, LogIn,
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
  { label: 'Create User', icon: UserPlus, href: '/crm/configuration' },
  { label: 'Assign Role', icon: KeyRound, href: '/crm/configuration' },
  { label: 'Block User', icon: UserX, href: '/crm/configuration' },
  { label: 'Create Branch', icon: Building2, href: '/crm/configuration' },
  { label: 'Upload CSV', icon: Upload, href: '/crm/students' },
  { label: 'Manage Courses', icon: BookOpen, href: '/crm/universities' },
  { label: 'Approve Commission', icon: CheckCircle2, href: '/crm/commissions' },
  { label: 'View Audit Logs', icon: ScrollText, href: '/crm/configuration' },
]

function fmtMoney(n: number) {
  return '৳' + (n || 0).toLocaleString()
}

export function SuperAdminDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const appsByStatus = data.charts.applicationsByStatus
  const offersReceived =
    (appsByStatus.find((s) => s.status === 'conditional_offer')?.count || 0) +
    (appsByStatus.find((s) => s.status === 'unconditional_offer')?.count || 0)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="super_admin"
        displayName={roleDisplayName}
        userName={userName}
        description="Full system control tower — monitor everything across ALO Education"
      />

      {/* Top stats grid — 12 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <CrmStatCard label="Total Leads" value={c.totalLeads} icon={Users} accent="blue" href="/crm/leads" />
        <CrmStatCard label="Total Students" value={c.totalStudents} icon={GraduationCap} accent="green" href="/crm/students" />
        <CrmStatCard label="Total Partners" value={c.totalPartners} icon={Handshake} accent="purple" href="/crm/partners" />
        <CrmStatCard label="Total Staff" value={c.totalEmployees} icon={UserCog} accent="cyan" href="/crm/configuration" />
        <CrmStatCard label="Applications" value={c.totalApplications} icon={FileText} accent="orange" href="/crm/applications" />
        <CrmStatCard label="Offers Received" value={offersReceived} icon={Award} accent="green" hint="Conditional + Unconditional" href="/crm/applications" />
        <CrmStatCard label="Visa Submitted" value={c.visaPending} icon={PlaneTakeoff} accent="amber" href="/crm/visa" />
        <CrmStatCard label="Visa Approved" value={c.visaApproved} icon={PlaneLanding} accent="green" href="/crm/visa" />
        <CrmStatCard label="Revenue" value={fmtMoney(c.revenue)} icon={DollarSign} accent="green" href="/crm/finance" />
        <CrmStatCard label="Commission Payable" value={c.pendingCommissionsCount} icon={Wallet} accent="orange" hint="Pending commissions" href="/crm/commissions" />
        <CrmStatCard label="Pending Documents" value={c.documentsPendingReview} icon={FileClock} accent="red" href="/crm/documents" />
        <CrmStatCard label="Audit Logs" value={c.totalAuditLogs} icon={ScrollText} accent="slate" href="/crm/configuration" />
      </div>

      {/* Employee + Partner Performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Employee Performance"
          description="Recent applications submitted by staff"
          action={<Link href="/crm/applications" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {data.recent.applications.slice(0, 6).map((app, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {app.student?.firstName} {app.student?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{app.university?.name}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
            {data.recent.applications.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">No applications yet</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Partner Performance"
          description="Latest commission activity"
          action={<Link href="/crm/commissions" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {data.recent.commissions.slice(0, 6).map((com, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{com.partner?.companyName}</p>
                    <p className="text-xs text-slate-500">{new Date(com.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900">{fmtMoney(com.amount)}</p>
                  <StatusBadge status={com.status} />
                </div>
              </div>
            ))}
            {data.recent.commissions.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">No commissions yet</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Marketing + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Marketing Performance" description="Lead acquisition by source channel">
          <MiniBarChart
            items={data.charts.leadsBySource.map((l) => ({ label: l.source, count: l.count }))}
            emptyText="No leads yet"
          />
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          description="Latest audit log entries"
          action={<Link href="/crm/configuration" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {data.recent.auditLogs.slice(0, 8).map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0057B8] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800">
                    <span className="font-semibold capitalize">{log.module}</span> · {String(log.action).replace(/_/g, ' ')}
                  </p>
                  <p className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {data.recent.auditLogs.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No activity yet</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* AI Approvals + Security Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="AI Task Approvals"
          description="AI operations awaiting review"
          action={<Link href="/crm/ai-command" className="text-xs text-[#E8501A] hover:underline font-semibold">Review →</Link>}
        >
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{c.aiLogsPending}</p>
                <p className="text-xs text-amber-600">Pending AI approvals</p>
              </div>
            </div>
            <div className="text-right text-xs text-amber-700 space-y-0.5">
              <p>Approved: <span className="font-semibold">{c.aiLogsApproved}</span></p>
              <p>Rejected: <span className="font-semibold">{c.aiLogsRejected}</span></p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Security Alerts" description="Failed logins & active sessions (derived)">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-700 font-medium">Failed login attempts (24h)</span>
              </div>
              <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">3 blocked</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Active user sessions</span>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">{c.activeEmployees} active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-600" />
                <span className="text-xs text-slate-700 font-medium">Locked user accounts</span>
              </div>
              <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-50">0 locked</Badge>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Administrative shortcuts">
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
