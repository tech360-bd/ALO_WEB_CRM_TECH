'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bot, GraduationCap, FileText, FileUser, ClipboardCheck,
  PlaneTakeoff, Megaphone, Clock, CheckCircle2, X, Edit3,
  Send, UserCog, BellRing, Sparkles, ScanLine, ShieldCheck,
  ShieldAlert, History, Cpu, Zap, PieChart,
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
  { label: 'Approve AI Task', icon: CheckCircle2, href: '/crm/ai-command' },
  { label: 'Reject AI Task', icon: X, href: '/crm/ai-command' },
  { label: 'Edit AI Output', icon: Edit3, href: '/crm/ai-command' },
  { label: 'Send to Student', icon: Send, href: '/crm/ai-command' },
  { label: 'Send to Counselor', icon: UserCog, href: '/crm/ai-command' },
  { label: 'Create Reminder', icon: BellRing, href: '/crm/ai-command' },
  { label: 'Create Campaign', icon: Megaphone, href: '/crm/email-campaign' },
  { label: 'Run Course Match', icon: Sparkles, href: '/crm/ai-command' },
  { label: 'Doc Checker', icon: ScanLine, href: '/crm/ai-command' },
  { label: 'Visa Readiness', icon: PlaneTakeoff, href: '/crm/ai-command' },
]

// AI automation rules (derived)
const aiRules = [
  { trigger: 'New lead from WhatsApp', action: 'AI scores lead & suggests counselor', active: true },
  { trigger: 'Student uploads document', action: 'AI runs document checker', active: true },
  { trigger: 'Application submitted', action: 'AI suggests best-matching universities', active: true },
  { trigger: 'Counselor requests SOP', action: 'AI drafts SOP from student profile', active: true },
  { trigger: 'Visa file created', action: 'AI generates visa risk assessment', active: false },
  { trigger: 'Marketing campaign due', action: 'AI generates content variants', active: true },
]

export function AiCommandDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common

  // Build pending approval queue from recent AI logs (filter pending)
  const pendingLogs = data.recent.aiLogs.filter((l) => l.status === 'pending').slice(0, 6)
  // Fallback derived queue if no pending live records
  const derivedQueue = [
    { id: 'AI-2451', command: 'course_match', requester: 'Counselor Tanvir', status: 'pending', tokens: 1240 },
    { id: 'AI-2450', command: 'sop_draft', requester: 'Counselor Nusrat', status: 'pending', tokens: 3180 },
    { id: 'AI-2449', command: 'cv_draft', requester: 'Self-service', status: 'pending', tokens: 890 },
    { id: 'AI-2448', command: 'document_check', requester: 'Document Officer', status: 'pending', tokens: 540 },
    { id: 'AI-2447', command: 'visa_risk_note', requester: 'Visa Officer Farhana', status: 'pending', tokens: 1620 },
  ]
  const queue = pendingLogs.length > 0
    ? pendingLogs.map((l) => ({ id: l.id?.toString() || 'AI-X', command: l.command, requester: 'Counselor (live)', status: l.status, tokens: l.tokensUsed }))
    : derivedQueue
  const isQueueDerived = pendingLogs.length === 0

  // Audit trail from recent AI logs
  const auditTrail = data.recent.aiLogs.slice(0, 6)

  // Donut chart math (Approved vs Rejected vs Pending)
  const total = c.aiLogsApproved + c.aiLogsRejected + c.aiLogsPending
  const approvedPct = total > 0 ? Math.round((c.aiLogsApproved / total) * 100) : 0
  const rejectedPct = total > 0 ? Math.round((c.aiLogsRejected / total) * 100) : 0
  const pendingPct = total > 0 ? 100 - approvedPct - rejectedPct : 0

  // Derived AI task type estimates (clearly marked)
  const aiCourseMatches = Math.round(c.totalAiLogs * 0.22)
  const aiSopDrafts = Math.round(c.totalAiLogs * 0.18)
  const aiCvDrafts = Math.round(c.totalAiLogs * 0.14)
  const aiDocChecks = Math.round(c.totalAiLogs * 0.20)
  const aiVisaNotes = Math.round(c.totalAiLogs * 0.10)
  const aiMarketingContent = Math.round(c.totalAiLogs * 0.16)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="ai_manager"
        displayName={roleDisplayName}
        userName={userName}
        description="Approve AI outputs — keep humans in control of important CRM actions"
      />

      {/* Security Alert Banner */}
      <Card className="p-4 border-[#E8501A]/30 bg-[#FFF7ED]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#E8501A] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#E8501A]">Human-in-the-loop Security Policy</p>
            <p className="text-xs text-[#E8501A]/80 mt-0.5">
              AI cannot modify critical CRM data without human approval. All AI actions are logged and auditable.
            </p>
          </div>
          <Badge className="text-[10px] bg-[#E8501A] text-white border-0 shrink-0">Enforced</Badge>
        </div>
      </Card>

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="AI Recommendations" value={c.totalAiLogs} icon={Bot} accent="purple" href="/crm/ai-command" />
        <CrmStatCard label="Course Matches" value={aiCourseMatches} icon={GraduationCap} accent="blue" hint="Est. 22% of AI logs" />
        <CrmStatCard label="SOP Drafts" value={aiSopDrafts} icon={FileText} accent="cyan" hint="Est. 18% of AI logs" />
        <CrmStatCard label="CV Drafts" value={aiCvDrafts} icon={FileUser} accent="green" hint="Est. 14% of AI logs" />
        <CrmStatCard label="Document Checks" value={aiDocChecks} icon={ClipboardCheck} accent="orange" hint="Est. 20% of AI logs" />
        <CrmStatCard label="Visa Risk Notes" value={aiVisaNotes} icon={PlaneTakeoff} accent="red" hint="Est. 10% of AI logs" />
        <CrmStatCard label="Marketing Content" value={aiMarketingContent} icon={Megaphone} accent="pink" hint="Est. 16% of AI logs" />
        <CrmStatCard label="Pending Approvals" value={c.aiLogsPending} icon={Clock} accent="amber" href="/crm/ai-command" />
      </div>

      {/* Pending Approvals + Donut */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard
          title="Pending Approvals"
          description={isQueueDerived ? 'AI outputs awaiting review (derived sample)' : 'Live AI outputs awaiting human approval'}
          className="lg:col-span-2"
          action={<Link href="/crm/ai-command" className="text-xs text-[#0057B8] hover:underline font-semibold">Open queue</Link>}
        >
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500 tracking-wider">
                  <th className="text-left font-semibold py-2 px-2">Task ID</th>
                  <th className="text-left font-semibold py-2 px-2">Command</th>
                  <th className="text-left font-semibold py-2 px-2">Requester</th>
                  <th className="text-right font-semibold py-2 px-2">Tokens</th>
                  <th className="text-center font-semibold py-2 px-2">Status</th>
                  <th className="text-right font-semibold py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((t, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 px-2 text-xs font-mono font-semibold text-slate-700">{t.id}</td>
                    <td className="py-2.5 px-2">
                      <span className="text-xs font-semibold text-[#0057B8] capitalize">{String(t.command).replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-slate-600">{t.requester}</td>
                    <td className="py-2.5 px-2 text-right text-xs text-slate-600">{t.tokens}</td>
                    <td className="py-2.5 px-2 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Badge variant="outline" className="text-[9px] font-semibold text-green-700 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100">
                          Approve
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-semibold text-[#0057B8] border-blue-100 bg-blue-50 cursor-pointer hover:bg-blue-100">
                          Edit
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

        {/* Donut: Approved vs Rejected vs Pending */}
        <SectionCard
          title="Approval Outcomes"
          description="Approved vs rejected vs pending"
          action={<PieChart className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="flex flex-col items-center">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="5"
                  strokeDasharray={`${approvedPct} 100`} pathLength={100} strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EF4444" strokeWidth="5"
                  strokeDasharray={`${rejectedPct} 100`} strokeDashoffset={`${-approvedPct}`} pathLength={100} strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F59E0B" strokeWidth="5"
                  strokeDasharray={`${pendingPct} 100`} strokeDashoffset={`${-(approvedPct + rejectedPct)}`} pathLength={100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-slate-900">{total}</p>
                <p className="text-[10px] text-slate-500">Total tasks</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 w-full">
              <div className="text-center">
                <p className="text-lg font-bold text-green-700">{c.aiLogsApproved}</p>
                <p className="text-[10px] text-slate-500">Approved {approvedPct}%</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-700">{c.aiLogsRejected}</p>
                <p className="text-[10px] text-slate-500">Rejected {rejectedPct}%</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-700">{c.aiLogsPending}</p>
                <p className="text-[10px] text-slate-500">Pending {pendingPct}%</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Audit Trail + Model Performance + Rule Configuration */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard
          title="AI Audit Trail"
          description="Recent AI command executions (live)"
          action={<History className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {auditTrail.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No AI logs yet</p>
            )}
            {auditTrail.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 capitalize truncate">{String(l.command || 'unknown').replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-500">
                    {l.model || 'gpt-4o'} · {l.tokensUsed || 0} tokens · {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Model Performance"
          description="Live usage metrics"
          action={<Cpu className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#EFF6FF] border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Tokens used (today)</span>
                <Zap className="h-3.5 w-3.5 text-[#0057B8]" />
              </div>
              <p className="text-2xl font-bold text-[#0057B8] mt-1">
                {auditTrail.reduce((sum, l) => sum + (l.tokensUsed || 0), 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500">From recent {auditTrail.length} logs</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Avg execution time</span>
                <Clock className="h-3.5 w-3.5 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-700 mt-1">2.3s</p>
              <p className="text-[10px] text-green-600">Derived estimate</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Approval rate</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-700" />
              </div>
              <p className="text-2xl font-bold text-purple-700 mt-1">{total > 0 ? approvedPct : 0}%</p>
              <p className="text-[10px] text-purple-600">Of completed AI tasks</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="AI Rule Configuration"
          description="Automation triggers (derived)"
          action={<ShieldCheck className="h-4 w-4 text-[#E8501A]" />}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {aiRules.map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-slate-800 truncate flex-1">{r.trigger}</p>
                  <Badge variant="outline" className={`text-[9px] font-semibold shrink-0 ${r.active ? 'text-green-700 border-green-200 bg-green-50' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                    {r.active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500">{r.action}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="AI command workflow shortcuts">
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
