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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Code, Save, History, Play, RotateCcw, Plus, RefreshCw, ChevronDown, ChevronUp, Variable, FileCode, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const AGENT_LIST = [
  { key: 'lead_qualifier', name: 'Lead Qualifier', icon: '🎯' },
  { key: 'course_recommender', name: 'Course Recommender', icon: '📚' },
  { key: 'university_recommender', name: 'University Recommender', icon: '🎓' },
  { key: 'scholarship_finder', name: 'Scholarship Finder', icon: '🏆' },
  { key: 'sop_assistant', name: 'SOP Assistant', icon: '📝' },
  { key: 'cv_builder', name: 'CV Builder', icon: '📄' },
  { key: 'ukvi_practice', name: 'UKVI Interview Coach', icon: '🎤' },
  { key: 'email_writer', name: 'Email Writer', icon: '📧' },
  { key: 'whatsapp_assistant', name: 'WhatsApp Reply Assistant', icon: '💬' },
  { key: 'blog_writer', name: 'Blog Generator', icon: '✍️' },
  { key: 'social_caption', name: 'Social Caption Generator', icon: '📱' },
  { key: 'campaign_ideas', name: 'Campaign Idea Generator', icon: '📣' },
  { key: 'document_analyzer', name: 'Document Analyzer', icon: '🔍' },
  { key: 'lead_scorer', name: 'Lead Scorer', icon: '📊' },
  { key: 'visa_checker', name: 'Visa FAQ Assistant', icon: '🛂' },
  { key: 'counselor_summary', name: 'Counselor Summary', icon: '📋' },
  { key: 'followup_generator', name: 'Follow-up Generator', icon: '🔄' },
  { key: 'complaint_summary', name: 'Complaint Summary', icon: '⚠️' },
  { key: 'research_agent', name: 'Research Agent', icon: '🔬' },
  { key: 'boss_agent', name: 'Boss Agent', icon: '🧠' },
]

const PROMPT_VARIABLES = [
  { name: '{{student_name}}', description: 'Student full name' },
  { name: '{{course}}', description: 'Course name' },
  { name: '{{university}}', description: 'University name' },
  { name: '{{country}}', description: 'Target country' },
  { name: '{{visa_type}}', description: 'Visa type (e.g., Tier 4)' },
  { name: '{{lead_score}}', description: 'Lead quality score (0-100)' },
  { name: '{{agent_name}}', description: 'Current agent name' },
  { name: '{{user_role}}', description: 'User role (counselor, admin, etc.)' },
  { name: '{{current_date}}', description: 'Current date' },
  { name: '{{branch_name}}', description: 'Branch office name' },
]

interface PromptVersion {
  id: string
  agentType: string
  prompt: string
  version: number
  changeNote?: string | null
  createdBy?: string | null
  createdAt: string
}

export default function AIPromptManager() {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [agentTypes, setAgentTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string>('lead_qualifier')
  const [promptText, setPromptText] = useState('')
  const [changeNote, setChangeNote] = useState('')
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [historyDialog, setHistoryDialog] = useState(false)
  const [agentVersions, setAgentVersions] = useState<PromptVersion[]>([])
  const [showVariables, setShowVariables] = useState(false)

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/prompts')
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
        setAgentTypes(data.agentTypes?.length > 0 ? data.agentTypes : AGENT_LIST.map(a => a.key))
      }
    } catch (err) {
      console.error('Failed to fetch prompts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAgentPrompt = useCallback(async (agentType: string) => {
    try {
      // Try to get from fetched versions
      const latest = versions.filter(v => v.agentType === agentType).sort((a, b) => b.version - a.version)[0]
      if (latest) {
        setPromptText(latest.prompt)
      } else {
        // Default prompt
        const def = AGENT_LIST.find(a => a.key === agentType)
        setPromptText(`You are the ${def?.name || agentType} for ALO Education, a comprehensive education consultancy. ${def?.name === 'Lead Qualifier' ? 'Analyze lead information and determine qualification status based on criteria like English proficiency, financial capability, and academic background.' : def?.name === 'Course Recommender' ? 'Recommend suitable courses based on student profile, academic background, and career goals.' : `Help users with ${def?.name || agentType} related tasks. Be concise, professional, and helpful.`}`)
      }
    } catch {
      setPromptText('')
    }
  }, [versions])

  useEffect(() => { fetchPrompts() }, [fetchPrompts])
  useEffect(() => { fetchAgentPrompt(selectedAgent) }, [selectedAgent, fetchAgentPrompt])

  const savePrompt = async () => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent,
          prompt: promptText,
          changeNote: changeNote || `Updated prompt for ${selectedAgent}`,
          createdBy: 'admin',
        }),
      })
      if (res.ok) {
        toast.success('Prompt saved as new version')
        setChangeNote('')
        fetchPrompts()
      } else {
        toast.error('Failed to save prompt')
      }
    } catch {
      toast.error('Failed to save prompt')
    }
  }

  const testPrompt = async () => {
    try {
      setTestLoading(true)
      setTestOutput('')
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'test_prompt',
          agentType: selectedAgent,
          inputText: testInput || 'Test input',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTestOutput(data.output || 'No output received')
      } else {
        setTestOutput('Error: Failed to get response')
      }
    } catch {
      setTestOutput('Error: Connection failed')
    } finally {
      setTestLoading(false)
    }
  }

  const openHistory = async (agentType: string) => {
    const filtered = versions.filter(v => v.agentType === agentType).sort((a, b) => b.version - a.version)
    setAgentVersions(filtered)
    setHistoryDialog(true)
  }

  const rollbackVersion = async (version: PromptVersion) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', id: version.id }),
      })
      if (res.ok) {
        toast.success(`Rolled back to version ${version.version}`)
        setPromptText(version.prompt)
        setHistoryDialog(false)
        fetchPrompts()
      }
    } catch {
      toast.error('Failed to rollback')
    }
  }

  const insertVariable = (variable: string) => {
    setPromptText(prev => prev + ' ' + variable)
  }

  const currentAgentDef = AGENT_LIST.find(a => a.key === selectedAgent)
  const currentVersion = versions.filter(v => v.agentType === selectedAgent).sort((a, b) => b.version - a.version)[0]

  if (loading && versions.length === 0) {
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
            <Code className="w-7 h-7 text-[#F37021]" />
            AI Prompt Manager
          </h1>
          <p className="text-muted-foreground mt-1">Manage and version agent prompts</p>
        </div>
        <Button variant="outline" onClick={fetchPrompts} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Select Agent</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-0.5">
                {AGENT_LIST.map(agent => {
                  const hasVersions = versions.some(v => v.agentType === agent.key)
                  const latestV = versions.filter(v => v.agentType === agent.key).sort((a, b) => b.version - a.version)[0]
                  return (
                    <button
                      key={agent.key}
                      onClick={() => setSelectedAgent(agent.key)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors ${selectedAgent === agent.key ? 'bg-[#F37021]/10 border-l-2 border-[#F37021]' : ''}`}
                    >
                      <span className="text-lg">{agent.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{agent.name}</p>
                        {latestV && <p className="text-xs text-muted-foreground">v{latestV.version}</p>}
                      </div>
                      {hasVersions && <Badge variant="outline" className="text-[10px]">v{latestV?.version}</Badge>}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Current Agent Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentAgentDef?.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold">{currentAgentDef?.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{selectedAgent}</Badge>
                      {currentVersion && (
                        <Badge className="text-xs bg-[#0066CC]">v{currentVersion.version}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openHistory(selectedAgent)}>
                    <History className="w-4 h-4" /> History
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowVariables(!showVariables)}>
                    <Variable className="w-4 h-4" /> Variables
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variables Panel */}
          {showVariables && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Variable className="w-4 h-4 text-[#F37021]" /> Available Variables
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_VARIABLES.map(v => (
                    <button
                      key={v.name}
                      onClick={() => insertVariable(v.name)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-[#F37021]/10 text-xs transition-colors"
                      title={v.description}
                    >
                      <code className="font-mono text-[#0066CC]">{v.name}</code>
                      <span className="text-muted-foreground">{v.description}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">Edit Prompt</TabsTrigger>
              <TabsTrigger value="test">Test Prompt</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">System Prompt</label>
                    <div className="relative">
                      <Textarea
                        value={promptText}
                        onChange={e => setPromptText(e.target.value)}
                        className="min-h-[300px] font-mono text-sm pr-12"
                        placeholder="Enter the system prompt for this agent..."
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-0.5 text-[10px] text-muted-foreground font-mono">
                        {promptText.split('\n').map((_, i) => (
                          <div key={i} className="leading-[20px]">{i + 1}</div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{promptText.length} characters</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Change Note</label>
                    <Input
                      value={changeNote}
                      onChange={e => setChangeNote(e.target.value)}
                      placeholder="Describe what changed in this version..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-[#F37021] hover:bg-[#e0631a] gap-2" onClick={savePrompt} disabled={!promptText.trim()}>
                      <Save className="w-4 h-4" /> Save New Version
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Test Input</label>
                    <Textarea
                      value={testInput}
                      onChange={e => setTestInput(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Enter test input for the agent..."
                    />
                  </div>
                  <Button onClick={testPrompt} disabled={testLoading} className="gap-2 bg-[#0066CC] hover:bg-[#0055aa]">
                    <Play className="w-4 h-4" /> {testLoading ? 'Running...' : 'Test Prompt'}
                  </Button>

                  {testOutput && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Output</label>
                      <div className="bg-green-50 p-4 rounded-lg text-sm whitespace-pre-wrap border border-green-200">
                        {testOutput}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Version History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#F37021]" />
              Version History: {currentAgentDef?.name}
            </DialogTitle>
          </DialogHeader>
          {agentVersions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No version history yet</p>
              <p className="text-xs">Save a prompt to create the first version</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentVersions.map(v => (
                <Card key={v.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#0066CC]">v{v.version}</Badge>
                      <span className="text-sm font-medium">{v.changeNote || `Version ${v.version}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => rollbackVersion(v)}>
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                    {v.prompt}
                  </div>
                  {v.createdBy && <p className="text-xs text-muted-foreground mt-1">Created by: {v.createdBy}</p>}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
