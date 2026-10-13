'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Microscope, Play, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Plus, BookOpen, Brain, Lightbulb, Rocket, GitBranch, PlusCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const JOB_STATUS_COLORS: Record<string, string> = {
  queued: 'bg-yellow-100 text-yellow-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  blocked: 'bg-orange-100 text-orange-700',
  needs_review: 'bg-purple-100 text-purple-700',
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

interface ResearchJob {
  id: string
  agentKey: string
  topic: string
  targetAgents?: string | null
  sourceType: string
  status: string
  resultSummary?: string | null
  sourcesJson?: string | null
  blockedReason?: string | null
  createdBy?: string | null
  createdAt: string
  completedAt?: string | null
}

interface Recommendation {
  id: string
  agentKey: string
  recommendationType: string
  title: string
  description: string
  riskLevel: string
  approvalStatus: string
  createdAt: string
}

interface Proposal {
  id: string
  proposedAgentKey: string
  proposedAgentName: string
  department: string
  purpose: string
  reason: string
  suggestedTools?: string | null
  suggestedModel?: string | null
  approvalStatus: string
  isActive: boolean
  createdAt: string
}

interface Distribution {
  id: string
  knowledgeId: string
  agentKey: string
  distributionStatus: string
  reason?: string | null
  createdAt: string
}

export default function AIResearchDashboard() {
  const [jobs, setJobs] = useState<ResearchJob[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [stats, setStats] = useState({ totalAgents: 0, activeAgents: 0, totalTasks: 0, pendingApprovals: 0 })
  const [loading, setLoading] = useState(true)
  const [newJobDialog, setNewJobDialog] = useState(false)
  const [newJob, setNewJob] = useState({ topic: '', sourceType: 'internal', targetAgents: '' })
  const [knowledgeDialog, setKnowledgeDialog] = useState(false)
  const [knowledgeForm, setKnowledgeForm] = useState({ title: '', content: '', category: 'General', source: 'research_agent' })
  const [detailDialog, setDetailDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<ResearchJob | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [agentsRes, researchRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/research'),
      ])

      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setRecommendations(data.recommendations || [])
        setProposals(data.proposals || [])
        setStats(data.stats || { totalAgents: 0, activeAgents: 0, totalTasks: 0, pendingApprovals: 0 })
      }

      if (researchRes.ok) {
        const data = await researchRes.json()
        setJobs(data.jobs || [])
        setDistributions(data.distributions || [])
      }
    } catch (err) {
      console.error('Failed to fetch research data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const startResearch = async () => {
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newJob.topic,
          sourceType: newJob.sourceType,
          targetAgents: newJob.targetAgents ? newJob.targetAgents.split(',').map(t => t.trim()) : null,
        }),
      })
      if (res.ok) {
        toast.success('Research job started')
        setNewJobDialog(false)
        setNewJob({ topic: '', sourceType: 'internal', targetAgents: '' })
        fetchData()
      }
    } catch {
      toast.error('Failed to start research')
    }
  }

  const approveRecommendation = async (id: string, approved: boolean) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_recommendation', recommendationId: id, approved }),
      })
      if (res.ok) {
        toast.success(approved ? 'Recommendation approved' : 'Recommendation rejected')
        setRecommendations(prev => prev.filter(r => r.id !== id))
      }
    } catch {
      toast.error('Failed to update recommendation')
    }
  }

  const approveProposal = async (id: string, approved: boolean) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_proposal', proposalId: id, approved }),
      })
      if (res.ok) {
        toast.success(approved ? 'Proposal approved & agent activated' : 'Proposal rejected')
        setProposals(prev => prev.map(p => p.id === id ? { ...p, approvalStatus: approved ? 'approved' : 'rejected', isActive: approved } : p))
      }
    } catch {
      toast.error('Failed to update proposal')
    }
  }

  const addKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledgeForm),
      })
      if (res.ok) {
        toast.success('Knowledge entry added')
        setKnowledgeDialog(false)
        setKnowledgeForm({ title: '', content: '', category: 'General', source: 'research_agent' })
      }
    } catch {
      toast.error('Failed to add knowledge')
    }
  }

  const openJobDetail = (job: ResearchJob) => {
    setSelectedJob(job)
    setDetailDialog(true)
  }

  const runningJobs = jobs.filter(j => j.status === 'running').length
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const pendingRecs = recommendations.filter(r => r.approvalStatus === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <Microscope className="w-7 h-7 text-[#F37021]" />
            AI Research Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Research Agent & Boss Agent management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button className="bg-[#F37021] hover:bg-[#e0631a] gap-2" onClick={() => setNewJobDialog(true)}>
            <Plus className="w-4 h-4" /> New Research
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setKnowledgeDialog(true)}>
            <BookOpen className="w-4 h-4" /> Add Knowledge
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#F37021]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50"><Microscope className="w-5 h-5 text-[#F37021]" /></div>
              <div>
                <p className="text-2xl font-bold">{runningJobs}</p>
                <p className="text-xs text-muted-foreground">Running Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{completedJobs}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#0066CC]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Lightbulb className="w-5 h-5 text-[#0066CC]" /></div>
              <div>
                <p className="text-2xl font-bold">{pendingRecs}</p>
                <p className="text-xs text-muted-foreground">Pending Recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Rocket className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{proposals.filter(p => p.approvalStatus === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Agent Proposals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList className="flex-wrap">
          <TabsTrigger value="jobs">Research Jobs</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="proposals">Agent Proposals</TabsTrigger>
          <TabsTrigger value="distributions">Knowledge Distribution</TabsTrigger>
          <TabsTrigger value="sources">Research Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Target Agents</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Microscope className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>No research jobs yet</p>
                          <Button variant="link" className="text-[#F37021]" onClick={() => setNewJobDialog(true)}>Start your first research</Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map(job => (
                        <TableRow key={job.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openJobDetail(job)}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{job.topic}</p>
                              {job.resultSummary && <p className="text-xs text-muted-foreground line-clamp-1">{job.resultSummary}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{job.sourceType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${JOB_STATUS_COLORS[job.status] || ''}`}>{job.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {job.targetAgents ? JSON.parse(job.targetAgents).map((a: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">{a}</Badge>
                              )) : <span className="text-xs text-muted-foreground">All</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={e => { e.stopPropagation(); openJobDetail(job) }}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.filter(r => r.approvalStatus === 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No pending recommendations from Boss Agent</p>
              </CardContent>
            </Card>
          ) : (
            recommendations.filter(r => r.approvalStatus === 'pending').map(rec => (
              <Card key={rec.id} className="border-l-4 border-l-[#0066CC]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{rec.recommendationType.replace('_', ' ')}</Badge>
                        <Badge className={`text-xs ${RISK_COLORS[rec.riskLevel] || ''}`}>{rec.riskLevel} risk</Badge>
                        <Badge variant="outline" className="text-xs">{rec.agentKey}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(rec.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => approveRecommendation(rec.id, true)}>
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => approveRecommendation(rec.id, false)}>
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Past recommendations */}
          {recommendations.filter(r => r.approvalStatus !== 'pending').length > 0 && (
            <>
              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Past Recommendations</h3>
              {recommendations.filter(r => r.approvalStatus !== 'pending').map(rec => (
                <Card key={rec.id} className="opacity-70">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge className={rec.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {rec.approvalStatus}
                      </Badge>
                      <span className="text-sm">{rec.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{rec.agentKey}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <PlusCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No agent creation proposals yet</p>
                <p className="text-xs">The Research Agent may propose new agents based on operational needs</p>
              </CardContent>
            </Card>
          ) : (
            proposals.map(proposal => (
              <Card key={proposal.id} className={proposal.approvalStatus === 'pending' ? 'border-l-4 border-l-[#F37021]' : 'opacity-70'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{proposal.proposedAgentKey}</Badge>
                        <Badge variant="outline" className="text-xs">{proposal.department}</Badge>
                        <Badge className={proposal.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : proposal.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {proposal.approvalStatus}
                        </Badge>
                        {proposal.isActive && <Badge className="bg-green-100 text-green-700">Active</Badge>}
                      </div>
                      <h3 className="font-semibold">{proposal.proposedAgentName}</h3>
                      <p className="text-sm text-muted-foreground mt-1"><strong>Purpose:</strong> {proposal.purpose}</p>
                      <p className="text-sm text-muted-foreground"><strong>Reason:</strong> {proposal.reason}</p>
                      {proposal.suggestedModel && <p className="text-xs text-muted-foreground mt-1">Suggested model: {proposal.suggestedModel}</p>}
                    </div>
                    {proposal.approvalStatus === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => approveProposal(proposal.id, true)}>
                          <CheckCircle className="w-4 h-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => approveProposal(proposal.id, false)}>
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Knowledge ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No knowledge distributions yet</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    distributions.map(dist => (
                      <TableRow key={dist.id}>
                        <TableCell className="text-xs font-mono">{dist.knowledgeId.substring(0, 8)}...</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{dist.agentKey}</Badge></TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${dist.distributionStatus === 'distributed' ? 'bg-green-100 text-green-700' : dist.distributionStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {dist.distributionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{dist.reason || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(dist.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.filter(j => j.sourcesJson).map(job => {
              let sources: any[] = []
              try { sources = JSON.parse(job.sourcesJson || '[]') } catch { sources = [] }
              return sources.map((source: any, i: number) => (
                <Card key={`${job.id}-${i}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <ExternalLink className="w-5 h-5 text-[#0066CC] mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm">{source.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{source.summary}</p>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0066CC] hover:underline mt-1 inline-block">
                            {source.url}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {job.sourceType} • {source.date ? new Date(source.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            })}
            {jobs.filter(j => j.sourcesJson).length === 0 && (
              <Card className="col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No research sources available yet</p>
                  <p className="text-xs">Start a research job to collect sources</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Research Job Dialog */}
      <Dialog open={newJobDialog} onOpenChange={setNewJobDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="w-5 h-5 text-[#F37021]" />
              Start New Research
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Research Topic *</label>
              <Input placeholder="e.g., UK Student Visa Changes 2025" value={newJob.topic} onChange={e => setNewJob(prev => ({ ...prev, topic: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Source Type</label>
              <Select value={newJob.sourceType} onValueChange={v => setNewJob(prev => ({ ...prev, sourceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Database</SelectItem>
                  <SelectItem value="web">Web Research</SelectItem>
                  <SelectItem value="official">Official Sources</SelectItem>
                  <SelectItem value="crm">CRM Data</SelectItem>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target Agents (comma-separated)</label>
              <Input placeholder="e.g., lead_qualifier, visa_checker" value={newJob.targetAgents} onChange={e => setNewJob(prev => ({ ...prev, targetAgents: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewJobDialog(false)}>Cancel</Button>
            <Button className="bg-[#F37021] hover:bg-[#e0631a]" onClick={startResearch} disabled={!newJob.topic.trim()}>Start Research</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Knowledge Dialog */}
      <Dialog open={knowledgeDialog} onOpenChange={setKnowledgeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0066CC]" />
              Add Knowledge Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={knowledgeForm.title} onChange={e => setKnowledgeForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea value={knowledgeForm.content} onChange={e => setKnowledgeForm(prev => ({ ...prev, content: e.target.value }))} className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={knowledgeForm.category} onValueChange={v => setKnowledgeForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="University">University</SelectItem>
                    <SelectItem value="Course">Course</SelectItem>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Scholarship">Scholarship</SelectItem>
                    <SelectItem value="FAQ">FAQ</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={knowledgeForm.source} onValueChange={v => setKnowledgeForm(prev => ({ ...prev, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research_agent">Research Agent</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="official">Official</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKnowledgeDialog(false)}>Cancel</Button>
            <Button className="bg-[#F37021] hover:bg-[#e0631a]" onClick={addKnowledge} disabled={!knowledgeForm.title || !knowledgeForm.content}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="w-5 h-5 text-[#F37021]" />
              Research Job Detail
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={JOB_STATUS_COLORS[selectedJob.status] || ''}>{selectedJob.status}</Badge>
                <Badge variant="outline">{selectedJob.sourceType}</Badge>
                <Badge variant="outline">{selectedJob.agentKey}</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedJob.topic}</h3>
              </div>
              {selectedJob.resultSummary && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Result Summary</p>
                  <p className="text-sm">{selectedJob.resultSummary}</p>
                </div>
              )}
              {selectedJob.blockedReason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-700 mb-1">Blocked Reason</p>
                  <p className="text-sm text-red-600">{selectedJob.blockedReason}</p>
                </div>
              )}
              {selectedJob.sourcesJson && (
                <div>
                  <p className="text-sm font-medium mb-2">Sources</p>
                  {(() => {
                    try {
                      const sources = JSON.parse(selectedJob.sourcesJson)
                      return sources.map((s: any, i: number) => (
                        <Card key={i} className="p-3 mb-2">
                          <p className="font-medium text-sm">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.summary}</p>
                          {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0066CC] hover:underline">{s.url}</a>}
                        </Card>
                      ))
                    } catch { return <p className="text-sm text-muted-foreground">Invalid sources data</p> }
                  })()}
                </div>
              )}
              {selectedJob.targetAgents && (
                <div>
                  <p className="text-sm font-medium mb-2">Target Agents</p>
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(selectedJob.targetAgents).map((a: string, i: number) => (
                      <Badge key={i} variant="outline">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                <p>Created: {new Date(selectedJob.createdAt).toLocaleString()}</p>
                {selectedJob.completedAt && <p>Completed: {new Date(selectedJob.completedAt).toLocaleString()}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
