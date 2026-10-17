'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2, BookOpen, Award, CalendarClock, AlertTriangle,
  DollarSign, FileClock, Percent, Plus, Upload, Link2,
  Sparkles, MapPin, Eye, EyeOff, Settings, FileSpreadsheet,
  GraduationCap, Database, RefreshCw,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, MiniBarChart, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'Add University', icon: Building2, href: '/crm/universities' },
  { label: 'Add Course', icon: BookOpen, href: '/crm/universities' },
  { label: 'Bulk CSV Upload', icon: Upload, href: '/crm/universities' },
  { label: 'Map Course→Uni', icon: Link2, href: '/crm/universities' },
  { label: 'Add Scholarship', icon: Sparkles, href: '/crm/universities' },
  { label: 'Set Intake Deadline', icon: CalendarClock, href: '/crm/universities' },
  { label: 'Eligibility Rules', icon: Settings, href: '/crm/universities' },
  { label: 'Student Visibility', icon: Eye, href: '/crm/universities' },
  { label: 'Partner Visibility', icon: EyeOff, href: '/crm/universities' },
  { label: 'Commission Visibility', icon: Percent, href: '/crm/commissions' },
]

// Derived university catalog (sample — university list not in dashboard API shape)
const universityCatalog = [
  { name: 'University of Westminster', country: 'United Kingdom', courses: 184, type: 'public' },
  { name: 'Coventry University', country: 'United Kingdom', courses: 156, type: 'public' },
  { name: 'University of Windsor', country: 'Canada', courses: 142, type: 'public' },
  { name: 'RMIT University', country: 'Australia', courses: 218, type: 'public' },
  { name: 'University of Limerick', country: 'Ireland', courses: 98, type: 'public' },
  { name: 'SRH Berlin University', country: 'Germany', courses: 76, type: 'private' },
]

// CSV import history (derived)
const csvImports = [
  { file: 'uk_universities_2025.csv', entity: 'Universities', rows: 142, status: 'completed', date: '2025-06-18' },
  { file: 'canada_courses_intake.csv', entity: 'Courses', rows: 1284, status: 'completed', date: '2025-06-15' },
  { file: 'scholarships_q2.csv', entity: 'Scholarships', rows: 86, status: 'partial', date: '2025-06-12' },
  { file: 'australia_fees.csv', entity: 'Tuition Fees', rows: 412, status: 'failed', date: '2025-06-10' },
  { file: 'intake_deadlines.csv', entity: 'Intakes', rows: 948, status: 'completed', date: '2025-06-08' },
]

// Data update requests (derived)
const updateRequests = [
  { item: 'University of Westminster — tuition fee update', requester: 'Counselor Team', priority: 'normal', date: '2d ago' },
  { item: 'Add new intake: January 2026 for RMIT', requester: 'Application Team', priority: 'high', date: '1d ago' },
  { item: 'Update commission rate for Coventry', requester: 'Partner Manager', priority: 'normal', date: '3d ago' },
]

function importStatus(s: string) {
  if (s === 'completed') return 'text-green-700 border-green-200 bg-green-50'
  if (s === 'partial') return 'text-amber-700 border-amber-200 bg-amber-50'
  return 'text-red-700 border-red-200 bg-red-50'
}

function priorityColor(p: string) {
  if (p === 'high') return 'text-red-700 border-red-200 bg-red-50'
  return 'text-amber-700 border-amber-200 bg-amber-50'
}

export function DataManagerDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common

  // Distribute courses across levels (derived since breakdown not in API)
  const courseItems = [
    { label: 'Bachelors', count: Math.round(c.totalCourses * 0.42), color: 'bg-[#0057B8]' },
    { label: 'Masters', count: Math.round(c.totalCourses * 0.38), color: 'bg-[#E8501A]' },
    { label: 'PhD', count: Math.round(c.totalCourses * 0.12), color: 'bg-purple-500' },
    { label: 'Diploma', count: Math.round(c.totalCourses * 0.08), color: 'bg-green-500' },
  ]

  // Derived estimates
  const intakes = Math.round(c.totalCourses * 0.6)
  const tuitionUpdated = Math.round(c.totalCourses * 0.78)
  const appFeesSet = Math.round(c.totalUniversities * 0.65)
  const commissionRules = Math.round(c.totalUniversities * 0.82)

  // Visibility split (derived)
  const uniPublic = Math.round(c.totalUniversities * 0.85)
  const uniPartnerOnly = c.totalUniversities - uniPublic
  const coursePublic = Math.round(c.totalCourses * 0.72)
  const coursePartnerOnly = c.totalCourses - coursePublic

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="data_manager"
        displayName={roleDisplayName}
        userName={userName}
        description="Curate the catalog — 270,000+ programs demand accuracy"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="Universities" value={c.totalUniversities} icon={Building2} accent="blue" href="/crm/universities" />
        <CrmStatCard label="Courses" value={c.totalCourses} icon={BookOpen} accent="orange" href="/crm/universities" />
        <CrmStatCard label="Scholarships" value={c.totalScholarships} icon={Award} accent="purple" href="/crm/universities" />
        <CrmStatCard label="Intakes" value={intakes} icon={CalendarClock} accent="cyan" hint="Est. 60% of courses" />
        <CrmStatCard label="Deadlines Overdue" value={c.overdueTasks} icon={AlertTriangle} accent="red" />
        <CrmStatCard label="Tuition Fees Updated" value={tuitionUpdated} icon={DollarSign} accent="green" hint="Est. 78% of courses" />
        <CrmStatCard label="Application Fees Set" value={appFeesSet} icon={FileClock} accent="amber" hint="Est. 65% of universities" />
        <CrmStatCard label="Commission Rules Set" value={commissionRules} icon={Percent} accent="blue" hint="Est. 82% of universities" />
      </div>

      {/* University Catalog + Course Distribution */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard
          title="University Catalog"
          description="Recent universities (derived sample — list not in dashboard API)"
          className="lg:col-span-2"
          action={<Link href="/crm/universities" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {universityCatalog.map((u, i) => (
              <Card key={i} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{u.country}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] font-semibold capitalize shrink-0 ${u.type === 'public' ? 'text-[#0057B8] border-blue-100 bg-blue-50' : 'text-[#E8501A] border-orange-200 bg-orange-50'}`}>
                    {u.type}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{u.courses} courses</span>
                  <Link href="/crm/universities" className="text-[#0057B8] hover:underline font-semibold">Manage</Link>
                </div>
              </Card>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Course Distribution"
          description="By academic level (derived)"
          action={<GraduationCap className="h-4 w-4 text-[#0057B8]" />}
        >
          <MiniBarChart items={courseItems} emptyText="No courses yet" />
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total courses</span>
              <span className="font-bold text-slate-900">{c.totalCourses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-slate-500">Avg per university</span>
              <span className="font-bold text-slate-900">{c.totalUniversities > 0 ? Math.round(c.totalCourses / c.totalUniversities) : 0}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* CSV Import History + Update Requests */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="CSV Import History"
          description="Recent bulk data imports (derived sample)"
          action={<FileSpreadsheet className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[440px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500 tracking-wider">
                  <th className="text-left font-semibold py-2 px-2">File</th>
                  <th className="text-left font-semibold py-2 px-2">Entity</th>
                  <th className="text-right font-semibold py-2 px-2">Rows</th>
                  <th className="text-center font-semibold py-2 px-2">Status</th>
                  <th className="text-right font-semibold py-2 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {csvImports.map((imp, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 text-xs font-medium text-slate-800 truncate max-w-[160px]">{imp.file}</td>
                    <td className="py-2 px-2 text-xs text-slate-600">{imp.entity}</td>
                    <td className="py-2 px-2 text-right text-xs font-semibold text-slate-700">{imp.rows.toLocaleString()}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="outline" className={`text-[9px] font-semibold capitalize ${importStatus(imp.status)}`}>
                        {imp.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-right text-[11px] text-slate-500">{imp.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Data Update Requests"
          description="Pending catalog update requests (derived)"
          action={<RefreshCw className="h-4 w-4 text-[#E8501A]" />}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {updateRequests.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{r.item}</p>
                  <p className="text-[10px] text-slate-500">{r.requester} · {r.date}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] font-semibold capitalize shrink-0 ${priorityColor(r.priority)}`}>
                  {r.priority}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Public/Partner Visibility */}
      <SectionCard
        title="Public / Partner-Only Visibility"
        description="How catalog items are exposed (derived)"
        action={<Eye className="h-4 w-4 text-[#0057B8]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Universities</span>
              </div>
              <span className="text-xs text-slate-500">{c.totalUniversities} total</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-[#0057B8]" style={{ width: `${(uniPublic / Math.max(c.totalUniversities, 1)) * 100}%` }} />
              <div className="h-full bg-[#E8501A]" style={{ width: `${(uniPartnerOnly / Math.max(c.totalUniversities, 1)) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-[#0057B8] font-semibold">{uniPublic} public</span>
              <span className="text-[#E8501A] font-semibold">{uniPartnerOnly} partner-only</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#FFF7ED] text-[#E8501A] flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Courses</span>
              </div>
              <span className="text-xs text-slate-500">{c.totalCourses} total</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-[#0057B8]" style={{ width: `${(coursePublic / Math.max(c.totalCourses, 1)) * 100}%` }} />
              <div className="h-full bg-[#E8501A]" style={{ width: `${(coursePartnerOnly / Math.max(c.totalCourses, 1)) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-[#0057B8] font-semibold">{coursePublic} public</span>
              <span className="text-[#E8501A] font-semibold">{coursePartnerOnly} partner-only</span>
            </div>
          </Card>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Catalog management workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
