'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Handshake, UserCheck, Clock, Users, FileStack,
  DollarSign, FileX, GraduationCap, ShieldCheck,
  AlertTriangle, Trophy, Building2, MapPin, Percent,
  Mail, Upload, Settings, UserCog, MessageSquare, Ban,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, StatusBadge, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'Approve Partner', icon: UserCheck, href: '/crm/partners' },
  { label: 'Suspend Partner', icon: Ban, href: '/crm/partners' },
  { label: 'Assign Account Mgr', icon: UserCog, href: '/crm/partners' },
  { label: 'Partner Students', icon: Users, href: '/crm/students' },
  { label: 'Partner Applications', icon: FileStack, href: '/crm/applications' },
  { label: 'Send Update', icon: Mail, href: '/crm/whatsapp-inbox' },
  { label: 'Upload Agreement', icon: Upload, href: '/crm/documents' },
  { label: 'Commission Rule', icon: Percent, href: '/crm/commissions' },
  { label: 'Partner Training', icon: GraduationCap, href: '/crm/configuration' },
  { label: 'Review Compliance', icon: ShieldCheck, href: '/crm/partners' },
]

// Derived partner network (clearly realistic placeholder — partner list not in dashboard API shape)
const partnerNetwork = [
  { company: 'EduBridge Bangladesh', contact: 'Rashed Khan', country: 'Bangladesh', rate: 12, status: 'active', students: 18 },
  { company: 'Global Reach Ltd', contact: 'Priya Sharma', country: 'India', rate: 10, status: 'active', students: 24 },
  { company: 'StudyLink Nepal', contact: 'Arjun Thapa', country: 'Nepal', rate: 11, status: 'active', students: 14 },
  { company: 'Future Scholars LLC', contact: 'Ahmed Ali', country: 'UAE', rate: 9, status: 'pending', students: 0 },
  { company: 'Pathway Education', contact: 'Sara Chen', country: 'Singapore', rate: 8, status: 'active', students: 11 },
  { company: 'Horizon Consultancy', contact: 'David Park', country: 'South Korea', rate: 10, status: 'suspended', students: 6 },
]

// Compliance scores (derived)
const complianceByPartner = [
  { company: 'EduBridge Bangladesh', score: 94, status: 'good' },
  { company: 'Global Reach Ltd', score: 88, status: 'good' },
  { company: 'StudyLink Nepal', score: 76, status: 'warning' },
  { company: 'Pathway Education', score: 82, status: 'good' },
  { company: 'Horizon Consultancy', score: 58, status: 'critical' },
]

function complianceColor(status: string) {
  if (status === 'good') return 'bg-green-500'
  if (status === 'warning') return 'bg-amber-500'
  return 'bg-red-500'
}

export function PartnerManagerDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common

  // Build partner ranking from recent commissions (group by partner)
  const commissionByPartner = new Map<string, { name: string; total: number; count: number; status: string }>()
  data.recent.commissions.forEach((cm) => {
    const name = cm.partner?.companyName || 'Unknown Partner'
    const existing = commissionByPartner.get(name) || { name, total: 0, count: 0, status: cm.status }
    existing.total += cm.amount || 0
    existing.count += 1
    commissionByPartner.set(name, existing)
  })
  const topPartners = Array.from(commissionByPartner.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  // Fallback to derived ranking if no commission data
  const derivedRanking = [
    { name: 'Global Reach Ltd', total: 184000, count: 24, status: 'paid' },
    { name: 'EduBridge Bangladesh', total: 142500, count: 18, status: 'paid' },
    { name: 'StudyLink Nepal', total: 96800, count: 14, status: 'under_review' },
    { name: 'Pathway Education', total: 74200, count: 11, status: 'paid' },
    { name: 'Horizon Consultancy', total: 41300, count: 6, status: 'held' },
  ]
  const ranking = topPartners.length > 0 ? topPartners : derivedRanking
  const isRankingDerived = topPartners.length === 0

  // Derived estimates
  const activePartners = Math.round(c.totalPartners * 0.75)
  const pendingPartners = Math.max(1, Math.round(c.totalPartners * 0.15))
  const trainingCompletion = 68 // %
  const pendingApprovals = partnerNetwork.filter((p) => p.status === 'pending').length

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="partner_manager"
        displayName={roleDisplayName}
        userName={userName}
        description="Control the B2B partner network — approve, monitor, and grow"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="Total Partners" value={c.totalPartners} icon={Handshake} accent="blue" href="/crm/partners" />
        <CrmStatCard label="Active Partners" value={activePartners} icon={UserCheck} accent="green" hint="Est. 75% of total" href="/crm/partners" />
        <CrmStatCard label="Pending Approval" value={pendingPartners} icon={Clock} accent="amber" hint="Est. 15% of total" />
        <CrmStatCard label="Partner Students" value={c.totalStudents} icon={Users} accent="purple" href="/crm/students" />
        <CrmStatCard label="Partner Applications" value={c.totalApplications} icon={FileStack} accent="cyan" href="/crm/applications" />
        <CrmStatCard label="Partner Commission" value={`৳${(c.commissionAmount / 1000).toFixed(1)}K`} icon={DollarSign} accent="orange" href="/crm/commissions" />
        <CrmStatCard label="Document Issues" value={c.documentsPendingReview} icon={FileX} accent="red" href="/crm/documents" />
        <CrmStatCard label="Training Completion" value={`${trainingCompletion}%`} icon={GraduationCap} accent="blue" hint="Derived estimate" />
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">{pendingApprovals} partner application(s) awaiting approval</p>
              <p className="text-xs text-amber-700 mt-0.5">Review partner agreements, commission terms, and compliance status before activating.</p>
            </div>
            <Link href="/crm/partners" className="shrink-0">
              <Badge variant="outline" className="text-[10px] font-semibold text-amber-700 border-amber-200 bg-white cursor-pointer hover:bg-amber-100">
                Review now
              </Badge>
            </Link>
          </div>
        </Card>
      )}

      {/* Partner Network Table */}
      <SectionCard
        title="Partner Network"
        description="Active partners across regions (derived sample — partner directory not in dashboard API)"
        action={<Link href="/crm/partners" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
      >
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500 tracking-wider">
                <th className="text-left font-semibold py-2 px-2">Company</th>
                <th className="text-left font-semibold py-2 px-2">Contact</th>
                <th className="text-left font-semibold py-2 px-2">Country</th>
                <th className="text-right font-semibold py-2 px-2">Rate</th>
                <th className="text-right font-semibold py-2 px-2">Students</th>
                <th className="text-center font-semibold py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {partnerNetwork.map((p, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-800 text-xs">{p.company}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-xs text-slate-600">{p.contact}</td>
                  <td className="py-2.5 px-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {p.country}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <Badge variant="outline" className="text-[10px] font-semibold text-[#0057B8] border-blue-100 bg-blue-50">
                      {p.rate}%
                    </Badge>
                  </td>
                  <td className="py-2.5 px-2 text-right text-xs font-semibold text-slate-700">{p.students}</td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Performance Ranking + Compliance */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Partner Performance Ranking"
          description={isRankingDerived ? 'Top 5 by commission (derived sample)' : 'Top 5 by commission amount (live)'}
          action={<Trophy className="h-4 w-4 text-[#E8501A]" />}
        >
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {ranking.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-500">{p.count} commission record(s)</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#0057B8]">৳{(p.total / 1000).toFixed(1)}K</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Partner Compliance"
          description="Compliance score per partner (derived)"
          action={<ShieldCheck className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {complianceByPartner.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">{p.company}</p>
                  <span className={`text-xs font-bold ${p.status === 'good' ? 'text-green-700' : p.status === 'warning' ? 'text-amber-700' : 'text-red-700'}`}>
                    {p.score}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${complianceColor(p.status)}`} style={{ width: `${p.score}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {p.status === 'good' ? 'Compliant' : p.status === 'warning' ? 'Action recommended' : 'Non-compliant — review required'}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Partner management workflow shortcuts">
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
