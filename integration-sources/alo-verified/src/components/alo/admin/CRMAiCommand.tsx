'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Brain, Play, Settings, FileText, Shield, CheckCircle, XCircle, Search, Zap, Clock, BookOpen, Activity, ChevronRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

type AgentStatus = 'active' | 'idle' | 'learning' | 'disabled'

interface Agent {
  id: string; name: string; icon: string; status: AgentStatus
  description: string; lastRun: string; tasksCompleted: number
  knowledge: string[]; recentActions: { action: string; time: string }[]
  config: { model: string; temperature: number; maxTokens: number }
}

interface ApprovalItem {
  id: string; agentName: string; agentIcon: string
  action: string; riskLevel: 'low' | 'medium' | 'high' | 'critical'
  description: string; requestedAt: string
}

interface ResearchResult {
  id: string; topic: string; sourceType: string; status: 'completed' | 'running' | 'failed' | 'pending'
  summary: string; date: string
}

const AGENTS: Agent[] = [
  { id: 'boss', name: 'Boss Agent', icon: '🧠', status: 'active', description: 'Orchestrates all agents and approval workflows', lastRun: '2 min ago', tasksCompleted: 342, knowledge: ['Agent coordination rules', 'Approval workflows', 'Priority routing'], recentActions: [{ action: 'Approved Research Agent task', time: '2 min ago' }, { action: 'Routed lead to Lead Scoring Agent', time: '15 min ago' }, { action: 'Initiated daily workflow', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.3, maxTokens: 4096 } },
  { id: 'research', name: 'Research Agent', icon: '🔬', status: 'active', description: 'Continuously researches study abroad updates', lastRun: '5 min ago', tasksCompleted: 218, knowledge: ['UK visa policies', 'University rankings 2025', 'Scholarship deadlines'], recentActions: [{ action: 'Researched UK student visa changes', time: '5 min ago' }, { action: 'Updated university entry requirements', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.5, maxTokens: 8192 } },
  { id: 'seo', name: 'SEO Agent', icon: '📈', status: 'idle', description: 'SEO optimization & keyword research', lastRun: '1 hr ago', tasksCompleted: 156, knowledge: ['Keyword database', 'Competitor analysis', 'SERP tracking data'], recentActions: [{ action: 'Updated keyword rankings', time: '1 hr ago' }, { action: 'Generated meta tags for blog', time: '3 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.4, maxTokens: 4096 } },
  { id: 'content', name: 'Content Agent', icon: '✍️', status: 'active', description: 'Blog and page content generation', lastRun: '10 min ago', tasksCompleted: 189, knowledge: ['Brand voice guidelines', 'Content templates', 'Published articles'], recentActions: [{ action: 'Generated blog: "Top UK Universities 2025"', time: '10 min ago' }, { action: 'Created scholarship page content', time: '2 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.7, maxTokens: 8192 } },
  { id: 'marketing', name: 'Marketing Agent', icon: '📣', status: 'learning', description: 'Marketing strategy & campaign creation', lastRun: '30 min ago', tasksCompleted: 97, knowledge: ['Campaign templates', 'Audience segments', 'ROI metrics'], recentActions: [{ action: 'Learning from Q4 campaign results', time: '30 min ago' }, { action: 'Created spring campaign draft', time: '4 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.6, maxTokens: 4096 } },
  { id: 'social', name: 'Social Media Agent', icon: '📱', status: 'active', description: 'Social media content & scheduling', lastRun: '8 min ago', tasksCompleted: 312, knowledge: ['Platform best practices', 'Hashtag database', 'Posting schedule'], recentActions: [{ action: 'Scheduled 5 Facebook posts', time: '8 min ago' }, { action: 'Created Instagram story template', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.8, maxTokens: 4096 } },
  { id: 'email', name: 'Email Agent', icon: '📧', status: 'active', description: 'Email campaign generation', lastRun: '20 min ago', tasksCompleted: 245, knowledge: ['Email templates', 'Open rate benchmarks', 'Drip sequences'], recentActions: [{ action: 'Sent welcome email to 15 new leads', time: '20 min ago' }, { action: 'Generated follow-up sequence', time: '2 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.5, maxTokens: 4096 } },
  { id: 'whatsapp', name: 'WhatsApp Agent', icon: '💬', status: 'active', description: 'WhatsApp message templates & automation', lastRun: '3 min ago', tasksCompleted: 478, knowledge: ['Message templates', 'Response rules', 'Conversation flows'], recentActions: [{ action: 'Auto-replied to 8 student queries', time: '3 min ago' }, { action: 'Sent appointment reminders', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.4, maxTokens: 2048 } },
  { id: 'chat', name: 'Chat Agent', icon: '🤖', status: 'active', description: 'Student chatbot responses', lastRun: '1 min ago', tasksCompleted: 1023, knowledge: ['FAQ database', 'Course catalog', 'Admission processes'], recentActions: [{ action: 'Answered course inquiry for student #4521', time: '1 min ago' }, { action: 'Escalated complex visa query', time: '5 min ago' }], config: { model: 'gpt-4o', temperature: 0.3, maxTokens: 2048 } },
  { id: 'visa', name: 'Visa Agent', icon: '🛂', status: 'active', description: 'Visa guidance & document review', lastRun: '12 min ago', tasksCompleted: 167, knowledge: ['UK visa requirements', 'Document checklists', 'CAS process'], recentActions: [{ action: 'Reviewed visa documents for 3 students', time: '12 min ago' }, { action: 'Updated visa guidance for Tier 4', time: '3 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.2, maxTokens: 4096 } },
  { id: 'university', name: 'University Agent', icon: '🎓', status: 'idle', description: 'University data management', lastRun: '2 hrs ago', tasksCompleted: 89, knowledge: ['University database', 'Partner institutions', 'Entry requirements'], recentActions: [{ action: 'Updated University of Manchester data', time: '2 hrs ago' }, { action: 'Added 3 new partner universities', time: '1 day ago' }], config: { model: 'gpt-4o', temperature: 0.3, maxTokens: 4096 } },
  { id: 'course', name: 'Course Agent', icon: '📚', status: 'active', description: 'Course recommendations', lastRun: '7 min ago', tasksCompleted: 234, knowledge: ['Course catalog', 'Prerequisite mapping', 'Career pathways'], recentActions: [{ action: 'Recommended courses for 5 students', time: '7 min ago' }, { action: 'Updated course availability', time: '2 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.5, maxTokens: 4096 } },
  { id: 'scholarship', name: 'Scholarship Agent', icon: '🏆', status: 'active', description: 'Scholarship matching', lastRun: '25 min ago', tasksCompleted: 145, knowledge: ['Scholarship database', 'Eligibility criteria', 'Application deadlines'], recentActions: [{ action: 'Matched 8 students to scholarships', time: '25 min ago' }, { action: 'Added 5 new scholarship listings', time: '4 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.4, maxTokens: 4096 } },
  { id: 'interview', name: 'Interview Agent', icon: '🎤', status: 'idle', description: 'UKVI interview preparation', lastRun: '45 min ago', tasksCompleted: 78, knowledge: ['Interview question bank', 'Mock scenarios', 'Credibility tips'], recentActions: [{ action: 'Generated mock interview for student', time: '45 min ago' }, { action: 'Updated question bank', time: '6 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.6, maxTokens: 4096 } },
  { id: 'sop', name: 'SOP Agent', icon: '📝', status: 'active', description: 'Statement of purpose generation', lastRun: '15 min ago', tasksCompleted: 198, knowledge: ['SOP templates', 'University-specific guidelines', 'Writing best practices'], recentActions: [{ action: 'Generated SOP draft for student #3892', time: '15 min ago' }, { action: 'Reviewed and scored 3 SOPs', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.7, maxTokens: 8192 } },
  { id: 'document', name: 'Document Agent', icon: '📄', status: 'learning', description: 'Document verification', lastRun: '35 min ago', tasksCompleted: 267, knowledge: ['Document requirements', 'Verification rules', 'Fraud detection patterns'], recentActions: [{ action: 'Learning new passport verification rules', time: '35 min ago' }, { action: 'Verified 12 student documents', time: '2 hrs ago' }], config: { model: 'gpt-4o', temperature: 0.2, maxTokens: 4096 } },
  { id: 'lead_scoring', name: 'Lead Scoring Agent', icon: '🎯', status: 'active', description: 'Lead quality assessment', lastRun: '4 min ago', tasksCompleted: 356, knowledge: ['Scoring criteria', 'Conversion patterns', 'Hot/cold thresholds'], recentActions: [{ action: 'Scored 10 new leads (3 hot, 5 warm, 2 cold)', time: '4 min ago' }, { action: 'Updated scoring model', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.3, maxTokens: 2048 } },
  { id: 'automation', name: 'Automation Agent', icon: '⚙️', status: 'active', description: 'Workflow automation', lastRun: '6 min ago', tasksCompleted: 512, knowledge: ['Workflow templates', 'Trigger rules', 'Integration endpoints'], recentActions: [{ action: 'Triggered welcome sequence for new lead', time: '6 min ago' }, { action: 'Automated daily report generation', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.2, maxTokens: 2048 } },
  { id: 'security', name: 'Security Agent', icon: '🔒', status: 'active', description: 'Security monitoring', lastRun: '1 min ago', tasksCompleted: 89, knowledge: ['Threat patterns', 'Access control rules', 'Audit logs'], recentActions: [{ action: 'Blocked suspicious login attempt', time: '1 min ago' }, { action: 'Completed security audit', time: '30 min ago' }], config: { model: 'gpt-4o', temperature: 0.1, maxTokens: 2048 } },
  { id: 'quality', name: 'Quality Agent', icon: '✅', status: 'active', description: 'Quality assurance', lastRun: '18 min ago', tasksCompleted: 143, knowledge: ['Quality standards', 'Review checklists', 'Compliance rules'], recentActions: [{ action: 'Reviewed content agent output', time: '18 min ago' }, { action: 'Flagged 2 SOPs for revision', time: '1 hr ago' }], config: { model: 'gpt-4o', temperature: 0.2, maxTokens: 4096 } },
]

const APPROVAL_ITEMS: ApprovalItem[] = [
  { id: '1', agentName: 'Content Agent', agentIcon: '✍️', action: 'Publish Blog Post', riskLevel: 'low', description: 'Publish "Top 10 UK Universities for International Students"', requestedAt: '5 min ago' },
  { id: '2', agentName: 'Email Agent', agentIcon: '📧', action: 'Send Bulk Email', riskLevel: 'medium', description: 'Send spring intake newsletter to 2,500 contacts', requestedAt: '12 min ago' },
  { id: '3', agentName: 'SOP Agent', agentIcon: '📝', action: 'Generate SOP', riskLevel: 'low', description: 'Auto-generate SOP for student Tanvir Ahmed', requestedAt: '20 min ago' },
  { id: '4', agentName: 'Security Agent', agentIcon: '🔒', action: 'Block IP Range', riskLevel: 'critical', description: 'Block IP range 192.168.x.x due to brute force attempts', requestedAt: '25 min ago' },
  { id: '5', agentName: 'Marketing Agent', agentIcon: '📣', action: 'Launch Campaign', riskLevel: 'high', description: 'Launch £5,000 Facebook ad campaign for May intake', requestedAt: '35 min ago' },
  { id: '6', agentName: 'Visa Agent', agentIcon: '🛂', action: 'Update Visa Rules', riskLevel: 'medium', description: 'Update UK Tier 4 visa document requirements', requestedAt: '1 hr ago' },
  { id: '7', agentName: 'Automation Agent', agentIcon: '⚙️', action: 'Modify Workflow', riskLevel: 'high', description: 'Change lead routing rules to prioritize UK applications', requestedAt: '1.5 hrs ago' },
]

const RESEARCH_RESULTS: ResearchResult[] = [
  { id: '1', topic: 'UK Student Visa Policy Changes 2025', sourceType: 'official', status: 'completed', summary: 'UKVI announced new English language requirements effective March 2025...', date: 'Today' },
  { id: '2', topic: 'University of Birmingham Scholarship Updates', sourceType: 'web', status: 'completed', summary: 'New international scholarship worth £10,000 for engineering students...', date: 'Today' },
  { id: '3', topic: 'Australian Post-Study Work Visa Extensions', sourceType: 'web', status: 'running', summary: 'Researching recent changes to post-study work rights...', date: 'Today' },
  { id: '4', topic: 'IELTS vs TOEFL Score Comparison', sourceType: 'internal', status: 'completed', summary: 'Updated score mapping table for 150+ universities...', date: 'Yesterday' },
  { id: '5', topic: 'Canadian Immigration Express Entry Updates', sourceType: 'official', status: 'pending', summary: 'Queued for research - new CRS score thresholds...', date: 'Yesterday' },
]

const statusColors: Record<AgentStatus, string> = {
  active: 'bg-green-100 text-green-700',
  idle: 'bg-gray-100 text-gray-600',
  learning: 'bg-blue-100 text-blue-700',
  disabled: 'bg-red-100 text-red-700',
}

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const sourceColors: Record<string, string> = {
  internal: 'bg-purple-100 text-purple-700',
  web: 'bg-blue-100 text-blue-700',
  manual: 'bg-gray-100 text-gray-700',
  official: 'bg-green-100 text-green-700',
  crm: 'bg-orange-100 text-orange-700',
}

const researchStatusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  running: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

export default function CRMAiCommand() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [detailTab, setDetailTab] = useState('knowledge')
  const [agentPrompt, setAgentPrompt] = useState('')
  const [approvals, setApprovals] = useState(APPROVAL_ITEMS)
  const [researchTopic, setResearchTopic] = useState('')
  const [researchSource, setResearchSource] = useState('web')
  const [researchResults, setResearchResults] = useState(RESEARCH_RESULTS)

  const activeCount = AGENTS.filter(a => a.status === 'active').length
  const tasksToday = AGENTS.reduce((s, a) => s + a.tasksCompleted, 0)
  const knowledgeItems = AGENTS.reduce((s, a) => s + a.knowledge.length, 0)
  const pendingApprovals = approvals.length

  const handleRunAgent = (agent: Agent) => {
    toast.success(`${agent.icon} ${agent.name} triggered successfully!`, { description: 'Task queued for execution' })
  }

  const handleRunAgentWithPrompt = () => {
    if (!agentPrompt.trim()) { toast.error('Please enter a prompt'); return }
    toast.success(`${selectedAgent?.icon} ${selectedAgent?.name} running with custom prompt!`, { description: agentPrompt.substring(0, 80) })
    setAgentPrompt('')
  }

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id))
    toast.success('Action approved!', { description: 'The agent will proceed' })
  }

  const handleReject = (id: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id))
    toast.info('Action rejected', { description: 'The agent has been notified' })
  }

  const handleResearch = () => {
    if (!researchTopic.trim()) { toast.error('Please enter a research topic'); return }
    const newResult: ResearchResult = {
      id: String(Date.now()), topic: researchTopic, sourceType: researchSource,
      status: 'running', summary: 'Research in progress...', date: 'Just now'
    }
    setResearchResults(prev => [newResult, ...prev])
    toast.success('🔬 Research Agent activated!', { description: `Researching: ${researchTopic}` })
    setResearchTopic('')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <Brain className="h-6 w-6 text-[#F37021]" />
            <span className="bg-gradient-to-r from-[#F37021] to-[#0066CC] bg-clip-text text-transparent">
              AI Command Center
            </span>
            <Sparkles className="h-5 w-5 text-[#F37021] animate-pulse" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Orchestrate and monitor all AI agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled title="Requires Super Admin approval">
            <Zap className="h-4 w-4 mr-1" /> Run All Agents
          </Button>
          <Button size="sm" className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => { setSelectedAgent(AGENTS[1]); handleRunAgent(AGENTS[1]) }}>
            <Search className="h-4 w-4 mr-1" /> Research Now
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Agents', value: activeCount, icon: Activity, color: 'text-green-600' },
          { label: 'Tasks Today', value: tasksToday, icon: Zap, color: 'text-[#F37021]' },
          { label: 'Knowledge Items', value: knowledgeItems, icon: BookOpen, color: 'text-[#0066CC]' },
          { label: 'Approval Queue', value: pendingApprovals, icon: Shield, color: 'text-red-600' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content: Agent Grid + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Panel: Agent Grid */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332]">AI Agents</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => { setSelectedAgent(agent); setDetailTab('knowledge') }}
                    className={`text-left p-3 rounded-xl border transition-all hover:shadow-md hover:border-[#F37021]/40 ${selectedAgent?.id === agent.id ? 'border-[#F37021] shadow-md bg-[#F37021]/5' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{agent.icon}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[agent.status]}`}>{agent.status}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-[#1A2332] truncate">{agent.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{agent.lastRun}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{agent.tasksCompleted} tasks</p>
                    <div className="flex gap-1 mt-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-gray-100 hover:bg-[#F37021]/10 cursor-pointer" onClick={e => { e.stopPropagation(); handleRunAgent(agent) }} title="Run"><Play className="h-3 w-3 text-gray-500" /></span>
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-gray-100 hover:bg-[#0066CC]/10 cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedAgent(agent); setDetailTab('config') }} title="Configure"><Settings className="h-3 w-3 text-gray-500" /></span>
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-gray-100 hover:bg-green-50 cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedAgent(agent); setDetailTab('actions') }} title="View Logs"><FileText className="h-3 w-3 text-gray-500" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Agent Detail */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAgent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-[#1A2332]">{selectedAgent.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedAgent.description}</p>
                    <Badge className={`text-[10px] mt-1 ${statusColors[selectedAgent.status]}`}>{selectedAgent.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Tabs value={detailTab} onValueChange={setDetailTab}>
                  <TabsList className="w-full grid grid-cols-4 h-8">
                    <TabsTrigger value="knowledge" className="text-[11px]">Knowledge</TabsTrigger>
                    <TabsTrigger value="actions" className="text-[11px]">Actions</TabsTrigger>
                    <TabsTrigger value="config" className="text-[11px]">Config</TabsTrigger>
                    <TabsTrigger value="approval" className="text-[11px]">Approvals</TabsTrigger>
                  </TabsList>
                  <TabsContent value="knowledge">
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pt-2">
                        {selectedAgent.knowledge.map((k, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-xs">
                            <BookOpen className="h-3.5 w-3.5 text-[#0066CC] shrink-0" />
                            <span className="text-gray-700">{k}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="actions">
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pt-2">
                        {selectedAgent.recentActions.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                            <Clock className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-700">{a.action}</p>
                              <p className="text-[10px] text-gray-400">{a.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="config">
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Model</label>
                        <Select defaultValue={selectedAgent.config.model}>
                          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Temperature: {selectedAgent.config.temperature}</label>
                        <Input type="range" min="0" max="2" step="0.1" defaultValue={selectedAgent.config.temperature} className="mt-1 h-2" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Max Tokens</label>
                        <Input type="number" defaultValue={selectedAgent.config.maxTokens} className="h-8 text-xs mt-1" />
                      </div>
                      <Button size="sm" className="w-full bg-[#0066CC] hover:bg-[#0055aa] text-white text-xs" onClick={() => toast.success('Configuration saved!')}>
                        Save Configuration
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="approval">
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pt-2">
                        {approvals.filter(a => a.agentName === selectedAgent.name).length === 0 ? (
                          <div className="text-center py-6 text-gray-400">
                            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No pending approvals</p>
                          </div>
                        ) : (
                          approvals.filter(a => a.agentName === selectedAgent.name).map(item => (
                            <div key={item.id} className="p-2 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`text-[10px] ${riskColors[item.riskLevel]}`}>{item.riskLevel}</Badge>
                                <span className="text-xs font-medium text-[#1A2332]">{item.action}</span>
                              </div>
                              <p className="text-[10px] text-gray-500">{item.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <Textarea
                    placeholder={`Enter prompt for ${selectedAgent.name}...`}
                    value={agentPrompt}
                    onChange={e => setAgentPrompt(e.target.value)}
                    className="text-xs min-h-[60px] resize-none"
                  />
                  <Button size="sm" className="w-full bg-[#F37021] hover:bg-[#e06010] text-white text-xs" onClick={handleRunAgentWithPrompt}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Run {selectedAgent.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <ChevronRight className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Select an agent to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Research Agent Panel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <span>🔬</span> Research Agent Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Enter research topic... e.g., UK student visa policy changes"
              value={researchTopic}
              onChange={e => setResearchTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResearch()}
              className="flex-1 text-sm"
            />
            <Select value={researchSource} onValueChange={setResearchSource}>
              <SelectTrigger className="w-full sm:w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="official">Official</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-[#0066CC] hover:bg-[#0055aa] text-white shrink-0" onClick={handleResearch}>
              <Search className="h-4 w-4 mr-1" /> Start Research
            </Button>
          </div>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {researchResults.map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-[#1A2332]">{r.topic}</span>
                      <Badge className={`text-[10px] ${sourceColors[r.sourceType]}`}>{r.sourceType}</Badge>
                      <Badge className={`text-[10px] ${researchStatusColors[r.status]}`}>{r.status}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-1">{r.summary}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{r.date}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Approval Workflow */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#F37021]" /> Approval Workflow
            {pendingApprovals > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{pendingApprovals} pending</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {approvals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up! No pending approvals</p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Agent</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Risk</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Requested</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs"><span className="mr-1">{item.agentIcon}</span>{item.agentName}</TableCell>
                      <TableCell className="text-xs font-medium">{item.action}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${riskColors[item.riskLevel]}`}>{item.riskLevel}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-xs truncate hidden md:table-cell">{item.description}</TableCell>
                      <TableCell className="text-[11px] text-gray-400 hidden sm:table-cell">{item.requestedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(item.id)} title="Approve">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReject(item.id)} title="Reject">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
