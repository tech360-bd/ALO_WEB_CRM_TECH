'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Brain, Play, FileText, Settings, Search, Zap, Clock, Activity, ToggleLeft, ToggleRight, Edit, Eye, RefreshCw, Users, BarChart3, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const AGENT_DEFINITIONS = [
  { key: 'lead_qualifier', name: 'Lead Qualifier', icon: '🎯', type: 'Sales', description: 'Qualifies and scores incoming leads based on criteria' },
  { key: 'course_recommender', name: 'Course Recommender', icon: '📚', type: 'Education', description: 'Recommends courses based on student profiles' },
  { key: 'university_recommender', name: 'University Recommender', icon: '🎓', type: 'Education', description: 'Suggests universities matching student preferences' },
  { key: 'scholarship_finder', name: 'Scholarship Finder', icon: '🏆', type: 'Education', description: 'Finds relevant scholarships for students' },
  { key: 'sop_assistant', name: 'SOP Assistant', icon: '📝', type: 'Writing', description: 'Helps draft and improve Statements of Purpose' },
  { key: 'cv_builder', name: 'CV Builder', icon: '📄', type: 'Writing', description: 'Builds professional CVs for students' },
  { key: 'ukvi_practice', name: 'UKVI Interview Coach', icon: '🎤', type: 'Visa', description: 'Practices UKVI interview questions and answers' },
  { key: 'email_writer', name: 'Email Writer', icon: '📧', type: 'Communication', description: 'Drafts professional emails for various purposes' },
  { key: 'whatsapp_assistant', name: 'WhatsApp Reply Assistant', icon: '💬', type: 'Communication', description: 'Generates WhatsApp reply templates' },
  { key: 'blog_writer', name: 'Blog Generator', icon: '✍️', type: 'Content', description: 'Creates blog content about studying abroad' },
  { key: 'social_caption', name: 'Social Caption Generator', icon: '📱', type: 'Content', description: 'Generates social media captions' },
  { key: 'campaign_ideas', name: 'Campaign Idea Generator', icon: '📣', type: 'Marketing', description: 'Generates marketing campaign ideas' },
  { key: 'document_analyzer', name: 'Document Analyzer', icon: '🔍', type: 'Operations', description: 'Analyzes and verifies uploaded documents' },
  { key: 'lead_scorer', name: 'Lead Scorer', icon: '📊', type: 'Sales', description: 'Scores leads based on conversion probability' },
  { key: 'visa_checker', name: 'Visa FAQ Assistant', icon: '🛂', type: 'Visa', description: 'Answers visa-related FAQs' },
  { key: 'counselor_summary', name: 'Counselor Summary', icon: '📋', type: 'Operations', description: 'Summarizes counselor sessions and notes' },
  { key: 'followup_generator', name: 'Follow-up Generator', icon: '🔄', type: 'Communication', description: 'Generates follow-up messages and reminders' },
  { key: 'complaint_summary', name: 'Complaint Summary', icon: '⚠️', type: 'Operations', description: 'Summarizes and categorizes complaints' },
  { key: 'research_agent', name: 'Research Agent', icon: '🔬', type: 'System', description: 'Continuously researches study abroad updates' },
  { key: 'boss_agent', name: 'Boss Agent', icon: '🧠', type: 'System', description: 'Orchestrates all agents and approval workflows' },
]

const TYPE_COLORS: Record<string, string> = {
  Sales: 'bg-orange-100 text-orange-700 border-orange-200',
  Education: 'bg-blue-100 text-blue-700 border-blue-200',
  Writing: 'bg-purple-100 text-purple-700 border-purple-200',
  Visa: 'bg-red-100 text-red-700 border-red-200',
  Communication: 'bg-green-100 text-green-700 border-green-200',
  Content: 'bg-pink-100 text-pink-700 border-pink-200',
  Marketing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Operations: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  System: 'bg-gray-100 text-gray-700 border-gray-200',
}

interface AgentData {
  id: string
  name: string
  agentType: string
  description?: string
  prompt?: string
  model: string
  status: string
  createdAt: string
}

interface LogData {
  id: string
  command: string
  agentId?: string
  inputText?: string
  outputText?: string
  status: string
  executionTime?: number
  tokensUsed?: number
  createdAt: string
}

export default function AIAgentManager() {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [logs, setLogs] = useState<LogData[]>([])
  const [stats, setStats] = useState({ totalAgents: 0, activeAgents: 0, totalTasks: 0, pendingApprovals: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editDialog, setEditDialog] = useState(false)
  const [logsDialog, setLogsDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', prompt: '', model: 'gpt-4', description: '' })
  const [agentLogs, setAgentLogs] = useState<LogData[]>([])

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
        setLogs(data.logs || [])
        setStats(data.stats || { totalAgents: 0, activeAgents: 0, totalTasks: 0, pendingApprovals: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const toggleAgent = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      // Update via agents API - use PUT or create a status update
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', agentId, status: newStatus }),
      })
      if (res.ok) {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a))
        toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      }
    } catch {
      // Optimistic update
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a))
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
    }
  }

  const openEditDialog = (agentKey: string) => {
    const existing = agents.find(a => a.agentType === agentKey)
    const def = AGENT_DEFINITIONS.find(d => d.key === agentKey)
    setSelectedAgent(agentKey)
    setEditForm({
      name: existing?.name || def?.name || '',
      prompt: existing?.prompt || `You are the ${def?.name || agentKey} for ALO Education. ${def?.description || ''}`,
      model: existing?.model || 'gpt-4',
      description: existing?.description || def?.description || '',
    })
    setEditDialog(true)
  }

  const saveAgent = async () => {
    if (!selectedAgent) return
    try {
      const existing = agents.find(a => a.agentType === selectedAgent)
      if (existing) {
        // Update existing agent
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_agent',
            agentId: existing.id,
            name: editForm.name,
            prompt: editForm.prompt,
            model: editForm.model,
            description: editForm.description,
          }),
        })
        if (res.ok) {
          toast.success('Agent updated successfully')
        }
      } else {
        // Create new agent
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_agent',
            name: editForm.name,
            agentType: selectedAgent,
            prompt: editForm.prompt,
            model: editForm.model,
            description: editForm.description,
          }),
        })
        if (res.ok) {
          toast.success('Agent created successfully')
        }
      }
      setEditDialog(false)
      fetchAgents()
    } catch {
      toast.error('Failed to save agent')
    }
  }

  const openLogsDialog = (agentKey: string) => {
    setSelectedAgent(agentKey)
    const agent = agents.find(a => a.agentType === agentKey)
    const filtered = agent ? logs.filter(l => l.agentId === agent.id || l.command?.includes(agentKey)) : []
    setAgentLogs(filtered.length > 0 ? filtered : logs.slice(0, 10))
    setLogsDialog(true)
  }

  const runAgent = async (agentKey: string) => {
    try {
      toast.info(`Running ${AGENT_DEFINITIONS.find(d => d.key === agentKey)?.name || agentKey}...`)
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_agent', agentKey, prompt: 'Perform your standard task' }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Agent completed in ${data.executionTime}ms`)
        fetchAgents()
      }
    } catch {
      toast.error('Failed to run agent')
    }
  }

  const getAgentStats = (agentKey: string) => {
    const agent = agents.find(a => a.agentType === agentKey)
    if (!agent) return { callsToday: 0, successRate: 0, tokensUsed: 0, errors: 0 }
    const agentLogs = logs.filter(l => l.agentId === agent.id || l.command?.includes(agentKey))
    const completed = agentLogs.filter(l => l.status === 'completed').length
    const total = agentLogs.length || 1
    return {
      callsToday: agentLogs.length,
      successRate: Math.round((completed / total) * 100),
      tokensUsed: agentLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0),
      errors: agentLogs.filter(l => l.status === 'failed').length,
    }
  }

  const filteredAgents = AGENT_DEFINITIONS.filter(def => {
    const matchesSearch = def.name.toLowerCase().includes(searchTerm.toLowerCase()) || def.key.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || def.type === filterType
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && agents.find(a => a.agentType === def.key)?.status === 'active') ||
      (filterStatus === 'inactive' && (!agents.find(a => a.agentType === def.key) || agents.find(a => a.agentType === def.key)?.status !== 'active'))
    return matchesSearch && matchesType && matchesStatus
  })

  const uniqueTypes = [...new Set(AGENT_DEFINITIONS.map(d => d.type))]

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
            <Brain className="w-7 h-7 text-[#F37021]" />
            AI Agent Manager
          </h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all 20 AI agents</p>
        </div>
        <Button onClick={fetchAgents} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#F37021]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50"><Users className="w-5 h-5 text-[#F37021]" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAgents || AGENT_DEFINITIONS.length}</p>
                <p className="text-xs text-muted-foreground">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><Activity className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.activeAgents}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#0066CC]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Zap className="w-5 h-5 text-[#0066CC]" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50"><BarChart3 className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search agents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map(def => {
          const agent = agents.find(a => a.agentType === def.key)
          const isActive = agent?.status === 'active'
          const aStats = getAgentStats(def.key)
          return (
            <Card key={def.key} className={`transition-all hover:shadow-md ${isActive ? 'border-[#F37021]/30' : 'opacity-70'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{def.icon}</span>
                    <div>
                      <CardTitle className="text-sm font-semibold">{def.name}</CardTitle>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${TYPE_COLORS[def.type] || ''}`}>{def.type}</Badge>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => agent ? toggleAgent(agent.id, agent.status) : toggleAgent(def.key, 'inactive')}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{def.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span>{aStats.callsToday} calls</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-green-500" />
                    <span>{aStats.successRate}% success</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#0066CC]" />
                    <span>{aStats.tokensUsed || 0} tokens</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span>{aStats.errors} errors</span>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={() => runAgent(def.key)}>
                    <Play className="w-3 h-3" /> Run
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={() => openEditDialog(def.key)}>
                    <Edit className="w-3 h-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={() => openLogsDialog(def.key)}>
                    <Eye className="w-3 h-3" /> Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Agent Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#F37021]" />
              Edit Agent: {AGENT_DEFINITIONS.find(d => d.key === selectedAgent)?.name || selectedAgent}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Agent Name</label>
              <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Model</label>
              <Select value={editForm.model} onValueChange={v => setEditForm(prev => ({ ...prev, model: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  <SelectItem value="llama3">Llama 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">System Prompt</label>
              <Textarea
                value={editForm.prompt}
                onChange={e => setEditForm(prev => ({ ...prev, prompt: e.target.value }))}
                className="min-h-[200px] font-mono text-sm"
                placeholder="Enter the system prompt for this agent..."
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Available Variables:</p>
              <div className="flex flex-wrap gap-1">
                {['{{student_name}}', '{{course}}', '{{university}}', '{{country}}', '{{visa_type}}', '{{lead_score}}', '{{agent_name}}'].map(v => (
                  <Badge key={v} variant="secondary" className="text-[10px] cursor-pointer hover:bg-[#F37021]/10"
                    onClick={() => setEditForm(prev => ({ ...prev, prompt: prev.prompt + ' ' + v }))}>
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button className="bg-[#F37021] hover:bg-[#e0631a]" onClick={saveAgent}>Save Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Logs Dialog */}
      <Dialog open={logsDialog} onOpenChange={setLogsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0066CC]" />
              Logs: {AGENT_DEFINITIONS.find(d => d.key === selectedAgent)?.name || selectedAgent}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {agentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No logs found for this agent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentLogs.map(log => (
                  <Card key={log.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                          {log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{log.model || 'N/A'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.inputText && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Input:</p>
                        <p className="text-xs bg-muted/50 p-2 rounded mt-1 line-clamp-2">{log.inputText}</p>
                      </div>
                    )}
                    {log.outputText && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Output:</p>
                        <p className="text-xs bg-green-50 p-2 rounded mt-1 line-clamp-3">{log.outputText}</p>
                      </div>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {log.executionTime && <span>⏱ {log.executionTime}ms</span>}
                      {log.tokensUsed && <span>🔤 {log.tokensUsed} tokens</span>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
