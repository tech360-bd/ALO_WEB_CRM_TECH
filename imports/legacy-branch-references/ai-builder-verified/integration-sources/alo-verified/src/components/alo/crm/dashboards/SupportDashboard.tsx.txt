'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle, Mail, UserCheck, UserX, ShieldCheck,
  Bot, Repeat, AlertTriangle, Send, FileText, UserCog,
  Link2, KeyRound, Upload, MessageSquarePlus, ArrowUp,
  PhoneCall, Clock, Moon,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'Reply WhatsApp', icon: Send, href: '/crm/whatsapp-inbox' },
  { label: 'Send Template', icon: FileText, href: '/crm/whatsapp-inbox' },
  { label: 'Assign Chat', icon: UserCog, href: '/crm/whatsapp-inbox' },
  { label: 'Create Lead', icon: ArrowUp, href: '/crm/leads' },
  { label: 'Link to Student', icon: Link2, href: '/crm/students' },
  { label: 'Request OTP', icon: KeyRound, href: '/crm/whatsapp-inbox' },
  { label: 'Upload from WA', icon: Upload, href: '/crm/documents' },
  { label: 'Add Note', icon: MessageSquarePlus, href: '/crm/whatsapp-inbox' },
  { label: 'Escalate', icon: ArrowUp, href: '/crm/whatsapp-inbox' },
  { label: 'Close Chat', icon: MessageCircle, href: '/crm/whatsapp-inbox' },
]

// Active conversations (derived sample — chat list not in dashboard API shape)
const activeConversations = [
  { name: 'Tanvir Ahmed', phone: '+8801711***', preview: 'Yes, I have my IELTS score ready', time: '2 min ago', unread: 3, sla: 'green', studentId: 'STD-1042' },
  { name: 'Unknown (+8801912)', phone: '+8801912***', preview: 'What is the deadline for September intake?', time: '8 min ago', unread: 1, sla: 'green', studentId: null },
  { name: 'Sadia Rahman', phone: '+8801822***', preview: 'I uploaded my passport — please check', time: '18 min ago', unread: 0, sla: 'amber', studentId: 'STD-1058' },
  { name: 'Arif Hossain', phone: '+8801933***', preview: 'My visa interview is tomorrow!', time: '32 min ago', unread: 2, sla: 'amber', studentId: 'STD-1071' },
  { name: 'Unknown (+919876)', phone: '+919876***', preview: 'Scholarship available for MBA?', time: '1h ago', unread: 4, sla: 'red', studentId: null },
  { name: 'Nusrat Jahan', phone: '+8801712***', preview: 'Thanks for the SOP review', time: '2h ago', unread: 0, sla: 'green', studentId: 'STD-1033' },
]

const escalatedChats = [
  { name: 'Unknown (+919876)', issue: 'Repeated visa question, no student record', escalatedBy: 'AI Bot', time: '1h ago' },
  { name: 'Rakib Hasan', issue: 'Asking for refund, requires counselor', escalatedBy: 'Agent Sajid', time: '3h ago' },
]

function slaColor(s: string) {
  if (s === 'green') return 'bg-green-500'
  if (s === 'amber') return 'bg-amber-500'
  return 'bg-red-500'
}
function slaLabel(s: string) {
  if (s === 'green') return 'Within SLA'
  if (s === 'amber') return 'Approaching'
  return 'Breached'
}

export function SupportDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common

  // Derived estimates (clearly marked)
  const totalMessages = c.totalWhatsappNumbers * 87 // ~87 msgs per number
  const unreadMessages = Math.round(totalMessages * 0.12)
  const studentMatched = Math.round(totalMessages * 0.62)
  const unknownContacts = Math.round(totalMessages * 0.18)
  const otpVerified = Math.round(studentMatched * 0.71)
  const aiHandled = c.totalAiLogs
  const humanHandover = Math.round(aiHandled * 0.18)
  const missedReplies = Math.round(totalMessages * 0.04)

  const greenCount = activeConversations.filter((x) => x.sla === 'green').length
  const amberCount = activeConversations.filter((x) => x.sla === 'amber').length
  const redCount = activeConversations.filter((x) => x.sla === 'red').length

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="support_agent"
        displayName={roleDisplayName}
        userName={userName}
        description="Every message matters — respond fast, escalate smart"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="WhatsApp Numbers" value={c.totalWhatsappNumbers} icon={MessageCircle} accent="green" href="/crm/whatsapp-inbox" />
        <CrmStatCard label="All Messages" value={totalMessages} icon={Mail} accent="blue" hint="Est. 87 msgs per number" />
        <CrmStatCard label="Unread" value={unreadMessages} icon={Mail} accent="red" hint="Est. 12% of messages" />
        <CrmStatCard label="Student Matched" value={studentMatched} icon={UserCheck} accent="green" hint="Est. 62% of messages" />
        <CrmStatCard label="Unknown Contacts" value={unknownContacts} icon={UserX} accent="amber" hint="Est. 18% of messages" />
        <CrmStatCard label="OTP Verified" value={otpVerified} icon={ShieldCheck} accent="cyan" hint="Est. 71% of matched" />
        <CrmStatCard label="AI-Handled Chats" value={aiHandled} icon={Bot} accent="purple" href="/crm/ai-command" />
        <CrmStatCard label="Human Handover" value={humanHandover} icon={Repeat} accent="orange" hint="Est. 18% of AI chats" />
      </div>

      {/* SLA Timer Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-green-200 bg-green-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-green-700">{greenCount}</p>
              <p className="text-[11px] text-green-600 font-semibold">Within SLA</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-green-600 mt-2">Responded under 5 min</p>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-amber-700">{amberCount}</p>
              <p className="text-[11px] text-amber-600 font-semibold">Approaching SLA</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-amber-600 mt-2">Awaiting reply 5–15 min</p>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-red-700">{redCount}</p>
              <p className="text-[11px] text-red-600 font-semibold">SLA Breached</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-red-600 mt-2">No reply in 15+ min</p>
        </Card>
      </div>

      {/* Active Conversations + Escalated Chats */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard
          title="Active Conversations"
          description="Live WhatsApp chats (derived sample — chat list not in dashboard API)"
          className="lg:col-span-2"
          action={<Link href="/crm/whatsapp-inbox" className="text-xs text-[#0057B8] hover:underline font-semibold">Open inbox</Link>}
        >
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {activeConversations.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                    {c.studentId ? (
                      <Badge variant="outline" className="text-[9px] text-[#0057B8] border-blue-100 bg-blue-50 shrink-0">
                        {c.studentId}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-200 bg-amber-50 shrink-0">
                        Unknown
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{c.preview}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">{c.time}</p>
                  {c.unread > 0 && (
                    <Badge className="text-[9px] bg-[#E8501A] text-white mt-0.5">{c.unread}</Badge>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${slaColor(c.sla)}`} />
                  <span className="text-[9px] text-slate-500">{slaLabel(c.sla)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          {/* After-hours alert */}
          <Card className="p-4 border-purple-200 bg-purple-50/50">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Moon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-900">After-hours Messages</p>
                <p className="text-3xl font-bold text-purple-700 mt-1">{Math.round(unreadMessages * 0.3)}</p>
                <p className="text-[10px] text-purple-600">Est. 30% of unread arrived outside 9am–6pm</p>
                <p className="text-[10px] text-purple-600 mt-1.5">AI auto-reply is handling these — review in queue.</p>
              </div>
            </div>
          </Card>

          {/* AI Auto-Reply Performance */}
          <Card className="p-4 border-[#0057B8]/20 bg-[#EFF6FF]/50">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#0057B8] text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#0057B8]">AI Auto-Reply Performance</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Response rate</span>
                    <span className="font-bold text-[#0057B8]">87%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Accuracy</span>
                    <span className="font-bold text-green-700">92%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Avg response time</span>
                    <span className="font-bold text-slate-700">2.4 min</span>
                  </div>
                </div>
                <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#0057B8] rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Escalated Chats */}
      <SectionCard
        title="Escalated Chats"
        description="Conversations requiring counselor or supervisor attention (derived)"
        className="border-red-200"
        action={<AlertTriangle className="h-4 w-4 text-red-600" />}
      >
        <div className="space-y-2">
          {escalatedChats.map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-50/60 border border-red-100">
              <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                <p className="text-[11px] text-slate-600">{e.issue}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Escalated by {e.escalatedBy} · {e.time}</p>
              </div>
              <Link href="/crm/whatsapp-inbox" className="shrink-0">
                <Badge variant="outline" className="text-[10px] font-semibold text-red-700 border-red-200 bg-white cursor-pointer hover:bg-red-100">
                  Take over
                </Badge>
              </Link>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Support workflow shortcuts">
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
