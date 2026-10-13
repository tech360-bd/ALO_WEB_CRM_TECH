'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileUp, Clock, FileX, CheckCircle2, CalendarX,
  Files, FileStack, AlertTriangle, FileText, Eye,
  X, MessageSquarePlus, RefreshCw, CalendarClock,
  ShieldCheck, Paperclip, ListChecks,
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
  { label: 'Preview Document', icon: Eye, href: '/crm/documents' },
  { label: 'Approve', icon: CheckCircle2, href: '/crm/documents' },
  { label: 'Reject', icon: X, href: '/crm/documents' },
  { label: 'Add Note', icon: MessageSquarePlus, href: '/crm/documents' },
  { label: 'Request Replacement', icon: RefreshCw, href: '/crm/documents' },
  { label: 'Set Expiry Date', icon: CalendarClock, href: '/crm/documents' },
  { label: 'Mark Verified', icon: ShieldCheck, href: '/crm/documents' },
  { label: 'Attach to Application', icon: Paperclip, href: '/crm/applications' },
]

// Document status legend (7 statuses per spec)
const statusLegend = [
  { status: 'Pending', color: 'bg-amber-500', desc: 'Awaiting officer review' },
  { status: 'Approved', color: 'bg-green-500', desc: 'Verified and accepted' },
  { status: 'Rejected', color: 'bg-red-500', desc: 'Did not meet requirements' },
  { status: 'Expired', color: 'bg-slate-400', desc: 'Past validity date' },
  { status: 'Need Replacement', color: 'bg-orange-500', desc: 'Poor quality / wrong format' },
  { status: 'Verified for Application', color: 'bg-[#0057B8]', desc: 'Cleared for app submission' },
  { status: 'Verified for Visa', color: 'bg-purple-500', desc: 'Cleared for visa stage' },
]

// Derived review queue (document list not in dashboard API shape — using realistic placeholder)
const reviewQueue = [
  { student: 'Tanvir Ahmed', type: 'Passport Bio Page', uploaded: '2 hours ago', status: 'pending', priority: 'normal' },
  { student: 'Sadia Rahman', type: 'Academic Transcript', uploaded: '5 hours ago', status: 'pending', priority: 'high' },
  { student: 'Arif Hossain', type: 'Bank Statement', uploaded: '1 day ago', status: 'pending', priority: 'high' },
  { student: 'Nusrat Jahan', type: 'IELTS Certificate', uploaded: '1 day ago', status: 'need_replacement', priority: 'normal' },
  { student: 'Rakib Hasan', type: 'SOP Draft', uploaded: '2 days ago', status: 'pending', priority: 'normal' },
  { student: 'Farhana Islam', type: 'Recommendation Letter', uploaded: '3 days ago', status: 'pending', priority: 'low' },
  { student: 'Sajid Karim', type: 'Passport Bio Page', uploaded: '3 days ago', status: 'approved', priority: 'normal' },
]

// High-priority deadline documents (derived)
const highPriorityDocs = [
  { student: 'Sadia Rahman', type: 'Bank Statement', deadline: 'Today', reason: 'Visa appointment in 2 days' },
  { student: 'Arif Hossain', type: 'Academic Transcript', deadline: 'Tomorrow', reason: 'University deadline approaching' },
  { student: 'Mitu Akter', type: 'SOP Final', deadline: '+2 days', reason: 'Submission window closing' },
]

function priorityBadge(p: string) {
  if (p === 'high') return 'text-red-700 border-red-200 bg-red-50'
  if (p === 'normal') return 'text-amber-700 border-amber-200 bg-amber-50'
  return 'text-slate-600 border-slate-200 bg-slate-50'
}

export function DocumentReviewDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const docsByStatus = data.charts.documentsByStatus
  const docItems = docsByStatus.map((d) => ({ label: d.status, count: d.count }))

  // Derived estimates
  const newUploads = Math.max(1, Math.round(c.documentsPendingReview * 0.4))
  const expiredDocs = Math.max(0, Math.round(c.totalDocuments * 0.04))
  const docsByVisa = c.totalVisaFiles

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="document_officer"
        displayName={roleDisplayName}
        userName={userName}
        description="Verify, approve, and route documents with precision"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="New Uploads (24h)" value={newUploads} icon={FileUp} accent="cyan" hint="Est. 40% of pending" />
        <CrmStatCard label="Pending Review" value={c.documentsPendingReview} icon={Clock} accent="amber" href="/crm/documents" />
        <CrmStatCard label="Rejected" value={c.documentsRejected} icon={FileX} accent="red" href="/crm/documents" />
        <CrmStatCard label="Approved" value={c.documentsApproved} icon={CheckCircle2} accent="green" href="/crm/documents" />
        <CrmStatCard label="Expired" value={expiredDocs} icon={CalendarX} accent="slate" hint="Est. 4% of total" />
        <CrmStatCard label="Docs by Application" value={c.totalDocuments} icon={Files} accent="blue" href="/crm/documents" />
        <CrmStatCard label="Docs by Visa Stage" value={docsByVisa} icon={FileStack} accent="purple" href="/crm/visa-letter-management" />
        <CrmStatCard label="High-Priority Deadline" value={c.overdueTasks} icon={AlertTriangle} accent="orange" hint="Overdue tasks" />
      </div>

      {/* High-priority deadline alert */}
      <Card className="p-4 border-red-200 bg-red-50/50">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">{highPriorityDocs.length} high-priority deadline(s) approaching</p>
            <div className="mt-2 space-y-1.5">
              {highPriorityDocs.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-red-800">
                    <span className="font-semibold">{d.student}</span> — {d.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 italic">{d.reason}</span>
                    <Badge variant="outline" className="text-[9px] text-red-700 border-red-200 bg-white">{d.deadline}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link href="/crm/documents" className="shrink-0">
            <Badge variant="outline" className="text-[10px] font-semibold text-red-700 border-red-200 bg-white cursor-pointer hover:bg-red-100">
              Review queue
            </Badge>
          </Link>
        </div>
      </Card>

      {/* Document Status Pipeline + Status Legend */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Document Status Pipeline"
          description="Live distribution of documents by status"
          action={<ListChecks className="h-4 w-4 text-[#0057B8]" />}
        >
          <MiniBarChart items={docItems} emptyText="No documents yet" />
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-amber-700">{c.documentsPendingReview}</p>
              <p className="text-[10px] text-slate-500">In Queue</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-700">{c.documentsApproved}</p>
              <p className="text-[10px] text-slate-500">Approved</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-700">{c.documentsRejected}</p>
              <p className="text-[10px] text-slate-500">Rejected</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Document Status Legend"
          description="7 lifecycle statuses used across the CRM"
          action={<FileText className="h-4 w-4 text-[#E8501A]" />}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {statusLegend.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className={`h-3 w-3 rounded-full shrink-0 ${s.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{s.status}</p>
                  <p className="text-[10px] text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Pending Review Queue */}
      <SectionCard
        title="Pending Review Queue"
        description="Documents awaiting verification (derived sample — document list not in dashboard API)"
        action={<Link href="/crm/documents" className="text-xs text-[#0057B8] hover:underline font-semibold">Open inbox</Link>}
      >
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500 tracking-wider">
                <th className="text-left font-semibold py-2 px-2">Student</th>
                <th className="text-left font-semibold py-2 px-2">Document Type</th>
                <th className="text-left font-semibold py-2 px-2">Uploaded</th>
                <th className="text-center font-semibold py-2 px-2">Priority</th>
                <th className="text-center font-semibold py-2 px-2">Status</th>
                <th className="text-right font-semibold py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800 text-xs">{d.student}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-xs text-slate-600">{d.type}</td>
                  <td className="py-2.5 px-2 text-xs text-slate-500">{d.uploaded}</td>
                  <td className="py-2.5 px-2 text-center">
                    <Badge variant="outline" className={`text-[9px] font-semibold capitalize ${priorityBadge(d.priority)}`}>
                      {d.priority}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-semibold text-green-700 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100">
                        Approve
                      </Badge>
                      <Badge variant="outline" className="text-[9px] font-semibold text-red-700 border-red-200 bg-red-50 cursor-pointer hover:bg-red-100">
                        Reject
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Document verification workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
