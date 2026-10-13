'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bot,
  Activity,
  Clock,
  Cpu,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lock,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { getSession, hasRole } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types matching the API responses ────────────────────────────────────────
interface AiAgent {
  id: string
  name: string
  agentType: string
  description: string | null
  prompt: string | null
  model: string | null
  status: string
  createdAt?: string
}

interface AiLog {
  id: string
  agentId: string | null
  userId: string | null
  command: string
  inputText: string | null
  outputText: string | null
  model: string | null
  status: string
  tokensUsed: number | null
  executionTime: number | null
  error: string | null
  createdAt: string
}

interface PostApproval {
  id: string
  contentId: string | null
  requestedBy: string | null
  reviewedBy: string | null
  decision: string
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

interface AiApiResponse {
  agents: AiAgent[]
  logs: AiLog[]
}

interface AgentsApiResponse {
  agents: AiAgent[]
  logs: AiLog[]
  researchJobs: Array<{ id: string; agentKey: string; topic: string; status: string; createdAt: string }>
  recommendations: Array<{ id: string; approvalStatus: string; createdAt: string }>
  proposals: Array<{ id: string; approvalStatus: string; createdAt: string }>
  stats: {
    totalAgents: number
    activeAgents: number
    totalTasks: number
    pendingApprovals: number
  }
}

interface PostsApiResponse {
  approvals: PostApproval[]
  pendingApprovals: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

const LOG_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

const AGENT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  retired: 'bg-red-50 text-red-700 border-red-200',
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const ALLOWED_ROLES = ['super_admin', 'admin', 'ai_manager', 'marketing_manager']

export default function CrmAiCommandPage() {
  const session = getSession()
  const [aiData, setAiData] = useState<AiApiResponse | null>(null)
  const [agentsData, setAgentsData] = useState<AgentsApiResponse | null>(null)
  const [approvals, setApprovals] = useState<PostApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [logFilter, setLogFilter] = useState('')

  const allowed = hasRole(session, ...ALLOWED_ROLES)
  const canViewApprovals = hasRole(session, 'super_admin', 'admin', 'marketing_manager')

  const fetchAll = useCallback(async () => {
    if (!session?.token) {
      setLoading(false)
      return
    }
    setRefreshing(true)
    try {
      const headers = { Authorization: `Bearer ${session.token}` }
      const [aiRes, agentsRes, postsRes] = await Promise.all([
        fetch('/api/ai?limit=50', { headers }).then((r) => r.ok ? r.json() as Promise<AiApiResponse> : null).catch(() => null),
        fetch('/api/agents', { headers }).then((r) => r.ok ? r.json() as Promise<AgentsApiResponse> : null).catch(() => null),
        canViewApprovals
          ? fetch('/api/marketing/posts?limit=100', { headers }).then((r) => r.ok ? r.json() as Promise<PostsApiResponse> : null).catch(() => null)
          : Promise.resolve(null),
      ])
      if (aiRes) setAiData(aiRes)
      if (agentsRes) setAgentsData(agentsRes)
      if (postsRes && Array.isArray(postsRes.approvals)) setApprovals(postsRes.approvals)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load AI command data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session, canViewApprovals])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ─── Access-restricted gate ──────────────────────────────────────────────
  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Command Center"
          description="Approve, reject, and edit AI outputs — course matches, SOP drafts, CV drafts, visa risk notes, and marketing content."
        />
        <Card className="p-10 text-center border-amber-200 bg-amber-50/50">
          <Lock className="h-12 w-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access restricted</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You need <span className="font-semibold">AI Manager</span>, <span className="font-semibold">Marketing Manager</span>, <span className="font-semibold">Admin</span>, or <span className="font-semibold">Super Admin</span> role to view the AI Command Center.
          </p>
        </Card>
      </div>
    )
  }

  // Merge agents from both endpoints — /api/agents returns a richer set.
  const agents = agentsData?.agents ?? aiData?.agents ?? []
  const logs = (agentsData?.logs ?? aiData?.logs ?? []).filter((l) => {
    if (!logFilter) return true
    const q = logFilter.toLowerCase()
    return (
      (l.command || '').toLowerCase().includes(q) ||
      (l.inputText || '').toLowerCase().includes(q) ||
      (l.outputText || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q)
    )
  })
  const stats = agentsData?.stats ?? {
    totalAgents: agents.length,
    activeAgents: agents.filter((a) => a.status === 'active').length,
    totalTasks: logs.length,
    pendingApprovals: approvals.length,
  }

  // Build a lookup of agentId → agent name so logs can display a friendly name.
  const agentNameById = new Map<string, string>()
  for (const a of agents) agentNameById.set(a.id, a.name)
  // Also surface the most-recent log per agent for the registry "last action" col.
  const lastLogByAgent = new Map<string, AiLog>()
  for (const l of logs) {
    if (!l.agentId) continue
    const prev = lastLogByAgent.get(l.agentId)
    if (!prev || new Date(l.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
      lastLogByAgent.set(l.agentId, l)
    }
  }

  const pendingApprovals = approvals.filter((a) => a.decision === 'pending')

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Command Center"
        description="Approve, reject, and edit AI outputs — course matches, SOP drafts, CV drafts, visa risk notes, and marketing content."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAll()}
            disabled={refreshing}
            className="h-9"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Agents" value={stats.totalAgents} icon={Bot} accent="blue" />
        <StatCard label="Active Agents" value={stats.activeAgents} icon={Cpu} accent="green" />
        <StatCard label="Tasks (recent)" value={stats.totalTasks} icon={Activity} accent="purple" />
        <StatCard label="Pending Approvals" value={pendingApprovals.length} icon={ShieldCheck} accent="orange" />
      </div>

      {/* Pending Approvals — Marketing Manager / Super Admin only */}
      {canViewApprovals && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#E8501A]" /> Pending Marketing Approvals
              <Badge className="bg-amber-50 text-amber-700 border-0 ml-1">{pendingApprovals.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-green-300 mx-auto mb-2" />
                No pending approvals. All caught up.
              </div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {pendingApprovals.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          Content ID: {a.contentId || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Requested by: {a.requestedBy || '—'} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 border-0 shrink-0">
                        {a.decision}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <p className="text-xs text-slate-400 mt-3">
              Approvals are managed in <span className="font-medium">Marketing Automation → Posts &amp; Approvals</span>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Agent Registry */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#0057B8]" /> AI Agent Registry
            <Badge className="bg-slate-100 text-slate-600 border-0 ml-1">{agents.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              <Bot className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No AI agents registered. Seed the database or create one via the Agents API.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Agent Name</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Model</TableHead>
                    <TableHead className="whitespace-nowrap">Last Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((a) => {
                    const last = a.id ? lastLogByAgent.get(a.id) : undefined
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-slate-900">
                          {a.name}
                          {a.description && (
                            <p className="text-xs text-slate-400 line-clamp-1">{a.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-50 text-[#0057B8] border-0 text-xs">
                            {a.agentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('border text-xs capitalize', AGENT_STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {a.model || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {last ? (
                            <div>
                              <p className="font-medium text-slate-700 line-clamp-1">{last.command}</p>
                              <p className="text-slate-400">{timeAgo(last.createdAt)}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">No activity yet</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent AI Logs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#E8501A]" /> Recent AI Logs
              <Badge className="bg-slate-100 text-slate-600 border-0 ml-1">{logs.length}</Badge>
            </CardTitle>
            <Input
              placeholder="Filter logs by command, status, or content…"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="h-9 max-w-xs text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No AI logs yet. Logs appear here when agents execute tasks.
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Agent</TableHead>
                    <TableHead className="whitespace-nowrap">Command</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Tokens</TableHead>
                    <TableHead className="whitespace-nowrap">Exec Time</TableHead>
                    <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => {
                    const agentName = l.agentId ? (agentNameById.get(l.agentId) || l.agentId) : '—'
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-slate-700 font-medium">
                          {agentName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-xs">
                          <p className="truncate">{l.command}</p>
                          {l.error && (
                            <p className="text-red-500 text-[10px] line-clamp-1">⚠ {l.error}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('border text-xs capitalize', LOG_STATUS_COLORS[l.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                            {l.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {l.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                            {l.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {l.tokensUsed != null ? l.tokensUsed.toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {l.executionTime != null ? `${l.executionTime}ms` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                          {timeAgo(l.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Footer hint */}
      {!loading && (agents.length === 0 && logs.length === 0) && (
        <Card className="p-4 border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-900">No AI activity detected.</p>
              <p className="mt-1">
                Run <code className="font-mono bg-slate-100 px-1 rounded">POST /api/agents</code> with action <code className="font-mono bg-slate-100 px-1 rounded">run_agent</code> or trigger a marketing content draft to populate this dashboard.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
