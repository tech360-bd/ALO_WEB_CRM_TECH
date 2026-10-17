'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Video, Calendar, Plus, Search, Filter, Star, Clock, CheckCircle2,
  XCircle, AlertCircle, User, MessageSquare, Sparkles, ArrowLeft,
  Phone, ExternalLink, Edit, Trash2, ChevronRight, Users, BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───
interface InterviewSession {
  id: string
  studentId: string
  counselorId: string | null
  interviewType: string
  country: string | null
  scheduledAt: string | null
  completedAt: string | null
  status: string
  meetingLink: string | null
  meetingType: string
  notes: string | null
  feedback: string | null
  score: number | null
  aiGenerated: boolean
  createdAt: string
  questions?: InterviewQuestion[]
  feedbacks?: InterviewFeedback[]
}

interface InterviewQuestion {
  id: string
  sessionId: string | null
  interviewType: string
  country: string | null
  question: string
  category: string | null
  suggestedAnswer: string | null
  difficulty: string
  aiGenerated: boolean
}

interface InterviewFeedback {
  id: string
  sessionId: string
  questionId: string | null
  answer: string | null
  rating: number | null
  feedback: string | null
  improvementTips: string | null
  createdAt: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Counselor {
  id: string
  firstName: string
  lastName: string
  email: string
}

// ─── Constants ───
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: <Video className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: <AlertCircle className="w-3 h-3" /> },
}

const TYPE_COLORS: Record<string, string> = {
  ukvi: 'bg-red-100 text-red-700',
  university: 'bg-blue-100 text-blue-700',
  mock: 'bg-purple-100 text-purple-700',
  practice: 'bg-green-100 text-green-700',
}

const COUNTRIES = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'Ireland', 'New Zealand', 'Netherlands', 'Sweden', 'Malaysia']

export default function InterviewManagement() {
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null)
  const [aiQuestions, setAiQuestions] = useState<InterviewQuestion[]>([])
  const [generatingQ, setGeneratingQ] = useState(false)

  // Create form state
  const [form, setForm] = useState({
    studentId: '',
    interviewType: '',
    country: '',
    scheduledAt: '',
    meetingType: 'manual',
    meetingLink: '',
    counselorId: '',
    notes: '',
  })

  // Score form state
  const [scoreForm, setScoreForm] = useState<Record<string, number>>({})
  const [feedbackText, setFeedbackText] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('limit', '50')

      const res = await fetch(`/api/interviews?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        setStudents(data.students || [])
        setCounselors(data.counselors || [])
      }
    } catch {
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    if (!form.studentId || !form.interviewType) {
      toast.error('Please select a student and interview type')
      return
    }
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Interview session created')
        setShowCreate(false)
        setForm({ studentId: '', interviewType: '', country: '', scheduledAt: '', meetingType: 'manual', meetingLink: '', counselorId: '', notes: '' })
        fetchData()
      } else {
        toast.error('Failed to create session')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}) }),
      })
      if (res.ok) {
        toast.success(`Status updated to ${status}`)
        fetchData()
        if (selectedSession?.id === id) {
          setSelectedSession({ ...selectedSession, status })
        }
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/interviews?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Interview cancelled')
        fetchData()
        setSelectedSession(null)
      }
    } catch {
      toast.error('Failed to cancel')
    }
  }

  const handleGenerateQuestions = async (type: string, country: string) => {
    setGeneratingQ(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `Generate 8 interview questions for a ${type} interview for studying in ${country || 'the UK'}. Return as JSON array with fields: question, category (financial/academic/career/personal/visa_specific), suggestedAnswer, difficulty (easy/medium/hard)`,
          agentType: 'ukvi_practice',
          inputText: `Type: ${type}, Country: ${country || 'UK'}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        try {
          const outputStr = typeof data.output === 'string' ? data.output : JSON.stringify(data.output)
          const jsonMatch = outputStr.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            setAiQuestions(parsed.map((q: Record<string, unknown>, i: number) => ({
              id: `ai-${i}`,
              sessionId: null,
              interviewType: type,
              country: country || null,
              question: q.question || '',
              category: q.category || 'general',
              suggestedAnswer: q.suggestedAnswer || null,
              difficulty: q.difficulty || 'medium',
              aiGenerated: true,
            })))
          }
        } catch {
          // Fallback questions
          setAiQuestions(getFallbackQuestions(type, country))
        }
        toast.success('AI questions generated')
      }
    } catch {
      setAiQuestions(getFallbackQuestions(type, country))
      toast.success('Questions loaded (fallback)')
    } finally {
      setGeneratingQ(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!selectedSession) return
    try {
      const feedbackEntries = Object.entries(scoreForm).map(([key, rating]) => ({
        questionId: key,
        rating,
      }))
      const avgScore = Object.values(scoreForm).length > 0
        ? Math.round(Object.values(scoreForm).reduce((a, b) => a + b, 0) / Object.values(scoreForm).length)
        : null

      const res = await fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSession.id,
          feedback: feedbackText,
          score: avgScore,
          feedbackEntries,
        }),
      })
      if (res.ok) {
        toast.success('Feedback submitted')
        setShowFeedback(false)
        setScoreForm({})
        setFeedbackText('')
        fetchData()
      }
    } catch {
      toast.error('Failed to submit feedback')
    }
  }

  // ─── Stats ───
  const stats = {
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    upcoming: sessions.filter(s => s.status === 'scheduled' && s.scheduledAt && new Date(s.scheduledAt) > new Date()).length,
    avgScore: sessions.filter(s => s.score).length > 0
      ? Math.round(sessions.filter(s => s.score).reduce((a, b) => a + (b.score || 0), 0) / sessions.filter(s => s.score).length * 10) / 10
      : 0,
  }

  const filteredSessions = sessions.filter(s => {
    if (search) {
      const student = students.find(st => st.id === s.studentId)
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : ''
      if (!studentName.includes(search.toLowerCase())) return false
    }
    return true
  })

  // ─── Detail View ───
  if (selectedSession) {
    const student = students.find(s => s.id === selectedSession.studentId)
    const counselor = counselors.find(c => c.id === selectedSession.counselorId)
    const statusConf = STATUS_CONFIG[selectedSession.status] || STATUS_CONFIG.scheduled
    const allQuestions = [...(selectedSession.questions || []), ...aiQuestions]

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setSelectedSession(null); setAiQuestions([]) }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#1A2332]">
              {selectedSession.interviewType.toUpperCase()} Interview
            </h2>
            <p className="text-sm text-muted-foreground">
              {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
            </p>
          </div>
          <Badge className={statusConf.color}>
            {statusConf.icon}
            <span className="ml-1">{statusConf.label}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge className={TYPE_COLORS[selectedSession.interviewType] || 'bg-gray-100 text-gray-700'}>
                    {selectedSession.interviewType.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span>{selectedSession.country || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span>{selectedSession.scheduledAt ? new Date(selectedSession.scheduledAt).toLocaleString() : 'Not scheduled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Counselor</span>
                  <span>{counselor ? `${counselor.firstName} ${counselor.lastName}` : 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meeting</span>
                  <span className="capitalize">{selectedSession.meetingType}</span>
                </div>
                {selectedSession.meetingLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Link</span>
                    <a href={selectedSession.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Join
                    </a>
                  </div>
                )}
                {selectedSession.score && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-bold text-[#F37021]">{selectedSession.score}/10</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">Student Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {student ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#F37021]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#F37021]" />
                      </div>
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </>
                ) : <p className="text-muted-foreground">Student not found</p>}
              </CardContent>
            </Card>

            {selectedSession.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedSession.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedSession.status === 'scheduled' && (
                  <Button className="w-full bg-[#0066CC] hover:bg-[#0055AA]" onClick={() => handleStatusChange(selectedSession.id, 'in_progress')}>
                    <Video className="w-4 h-4 mr-2" /> Start Interview
                  </Button>
                )}
                {selectedSession.status === 'in_progress' && (
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(selectedSession.id, 'completed')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setShowFeedback(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Add Feedback
                </Button>
                {!['completed', 'cancelled'].includes(selectedSession.status) && (
                  <Button variant="destructive" className="w-full" onClick={() => handleCancel(selectedSession.id)}>
                    <XCircle className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle: Questions */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">
                    Questions ({allQuestions.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-[#F37021] hover:bg-[#E06010]"
                    disabled={generatingQ}
                    onClick={() => handleGenerateQuestions(selectedSession.interviewType, selectedSession.country || 'UK')}
                  >
                    {generatingQ ? <><Sparkles className="w-3 h-3 mr-1 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3 mr-1" /> AI Generate</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {allQuestions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No questions yet. Click AI Generate to create questions.</p>
                    ) : (
                      allQuestions.map((q, i) => (
                        <div key={q.id || i} className="p-3 rounded-lg border border-gray-100 hover:border-[#F37021]/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-[#1A2332]">{i + 1}. {q.question}</p>
                              {q.suggestedAnswer && (
                                <p className="text-xs text-muted-foreground mt-1 bg-green-50 p-2 rounded">
                                  <strong>Suggested:</strong> {q.suggestedAnswer}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {q.category && (
                                <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                              )}
                              <Badge className={
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }>
                                {q.difficulty}
                              </Badge>
                              {q.aiGenerated && <Badge className="bg-[#F37021]/10 text-[#F37021]"><Sparkles className="w-2 h-2" /></Badge>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Feedback History */}
            {selectedSession.feedbacks && selectedSession.feedbacks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Feedback History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedSession.feedbacks.map((fb, i) => (
                      <div key={fb.id || i} className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          {fb.rating && <Badge className="bg-[#F37021]/10 text-[#F37021]"><Star className="w-3 h-3 mr-1" />{fb.rating}/10</Badge>}
                          <span className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleString()}</span>
                        </div>
                        {fb.answer && <p className="text-sm"><strong>Answer:</strong> {fb.answer}</p>}
                        {fb.feedback && <p className="text-sm text-muted-foreground mt-1">{fb.feedback}</p>}
                        {fb.improvementTips && <p className="text-xs text-blue-600 mt-1">💡 {fb.improvementTips}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedSession.feedback && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Overall Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedSession.feedback}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Feedback Dialog */}
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#1A2332]">Score Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {allQuestions.map((q, i) => (
                <div key={q.id || i} className="space-y-2">
                  <Label className="text-sm font-medium">{i + 1}. {q.question}</Label>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                          (scoreForm[q.id || `q${i}`] || 0) >= n
                            ? 'bg-[#F37021] text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        onClick={() => setScoreForm(prev => ({ ...prev, [q.id || `q${i}`]: n }))}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {scoreForm[q.id || `q${i}`] ? `${scoreForm[q.id || `q${i}`]}/10` : 'No score'}
                    </span>
                  </div>
                </div>
              ))}
              <Separator />
              <div>
                <Label>Overall Feedback</Label>
                <Textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Enter overall feedback for this interview session..."
                  rows={4}
                />
              </div>
              <Button className="w-full bg-[#F37021] hover:bg-[#E06010]" onClick={handleSubmitFeedback}>
                Submit Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── Main Dashboard View ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <Video className="w-6 h-6 text-[#F37021]" />
            Interview Management
          </h1>
          <p className="text-sm text-muted-foreground">Schedule, conduct, and evaluate student interviews</p>
        </div>
        <Button className="bg-[#F37021] hover:bg-[#E06010]" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Interview
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-[#1A2332]">{stats.scheduled}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-[#1A2332]">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F37021]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-[#1A2332]">{stats.upcoming}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#F37021] opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold text-[#1A2332]">{stats.avgScore}/10</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by student name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ukvi">UKVI</SelectItem>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="mock">Mock</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No interview sessions found</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create First Interview
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Counselor</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map(session => {
                  const student = students.find(s => s.id === session.studentId)
                  const counselor = counselors.find(c => c.id === session.counselorId)
                  const statusConf = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled

                  return (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer hover:bg-[#F37021]/5"
                      onClick={() => setSelectedSession(session)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0066CC]/10 flex items-center justify-center">
                            <User className="w-3 h-3 text-[#0066CC]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student ? `${student.firstName} ${student.lastName}` : 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground">{student?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={TYPE_COLORS[session.interviewType] || 'bg-gray-100 text-gray-700'}>
                          {session.interviewType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{session.country || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{counselor ? `${counselor.firstName} ${counselor.lastName}` : 'Unassigned'}</TableCell>
                      <TableCell>
                        {session.score ? (
                          <Badge className="bg-[#F37021]/10 text-[#F37021]">
                            <Star className="w-3 h-3 mr-1" />{session.score}/10
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConf.color}>
                          {statusConf.icon}
                          <span className="ml-1">{statusConf.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedSession(session) }}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Create Interview Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Student *</Label>
                <Select value={form.studentId} onValueChange={v => setForm(p => ({ ...p, studentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Search student..." /></SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="max-h-48">
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.email})
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interview Type *</Label>
                <Select value={form.interviewType} onValueChange={v => setForm(p => ({ ...p, interviewType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ukvi">UKVI Interview</SelectItem>
                    <SelectItem value="university">University Interview</SelectItem>
                    <SelectItem value="mock">Mock Interview</SelectItem>
                    <SelectItem value="practice">Practice Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.country} onValueChange={v => setForm(p => ({ ...p, country: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <Label>Meeting Type</Label>
                <Select value={form.meetingType} onValueChange={v => setForm(p => ({ ...p, meetingType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Link</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meeting Link</Label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={form.meetingLink}
                  onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Assign Counselor</Label>
                <Select value={form.counselorId} onValueChange={v => setForm(p => ({ ...p, counselorId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select counselor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {counselors.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any notes for this interview session..."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <Button className="w-full bg-[#F37021] hover:bg-[#E06010]" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" /> Create Interview Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getFallbackQuestions(type: string, country: string): InterviewQuestion[] {
  const qSets: Record<string, InterviewQuestion[]> = {
    ukvi: [
      { id: 'ai-1', sessionId: null, interviewType: 'ukvi', country, question: 'Why did you choose this particular university?', category: 'academic', suggestedAnswer: 'I chose this university because it offers a specialized program in my field of interest with excellent research facilities and industry connections.', difficulty: 'medium', aiGenerated: true },
      { id: 'ai-2', sessionId: null, interviewType: 'ukvi', country, question: 'How will you fund your studies and living expenses?', category: 'financial', suggestedAnswer: 'My studies will be funded through a combination of family savings and an education loan from XYZ Bank.', difficulty: 'easy', aiGenerated: true },
      { id: 'ai-3', sessionId: null, interviewType: 'ukvi', country, question: 'What are your plans after completing your degree?', category: 'career', suggestedAnswer: 'I plan to return to my home country and apply the skills I\'ve gained to work in the growing tech industry there.', difficulty: 'medium', aiGenerated: true },
      { id: 'ai-4', sessionId: null, interviewType: 'ukvi', country, question: 'Do you have any relatives in the UK?', category: 'personal', suggestedAnswer: 'No, I do not have any relatives in the UK. I am going solely for educational purposes.', difficulty: 'easy', aiGenerated: true },
      { id: 'ai-5', sessionId: null, interviewType: 'ukvi', country, question: 'Why did you choose the UK over other countries for your studies?', category: 'academic', suggestedAnswer: 'The UK offers a world-class education system with shorter program durations, globally recognized qualifications, and strong post-study work opportunities.', difficulty: 'medium', aiGenerated: true },
      { id: 'ai-6', sessionId: null, interviewType: 'ukvi', country, question: 'Can you tell me about the course modules you will be studying?', category: 'academic', suggestedAnswer: 'The course includes modules on Data Structures, Machine Learning, Software Engineering, and a dissertation project in the final semester.', difficulty: 'hard', aiGenerated: true },
      { id: 'ai-7', sessionId: null, interviewType: 'ukvi', country, question: 'What is the cost of your tuition and how does it compare to studying elsewhere?', category: 'financial', suggestedAnswer: 'The tuition is £15,000 per year. While comparable programs in the US may be more expensive, this program offers excellent value for the specialized curriculum.', difficulty: 'medium', aiGenerated: true },
      { id: 'ai-8', sessionId: null, interviewType: 'ukvi', country, question: 'Have you researched the visa requirements and English language requirements for your course?', category: 'visa_specific', suggestedAnswer: 'Yes, I have an IELTS score of 6.5 which meets the requirement, and I have prepared all necessary financial documents for the visa application.', difficulty: 'easy', aiGenerated: true },
    ],
    university: [
      { id: 'ai-1', sessionId: null, interviewType: 'university', country, question: 'What motivates you to pursue this specific field of study?', category: 'academic', suggestedAnswer: 'I have always been passionate about this field and believe it aligns with my career goals of making a meaningful impact in the industry.', difficulty: 'easy', aiGenerated: true },
      { id: 'ai-2', sessionId: null, interviewType: 'university', country, question: 'Describe a challenge you have faced and how you overcame it.', category: 'personal', suggestedAnswer: 'During my undergraduate project, our team faced a technical setback. I took initiative to research alternative approaches and led the team to a successful outcome.', difficulty: 'medium', aiGenerated: true },
      { id: 'ai-3', sessionId: null, interviewType: 'university', country, question: 'What relevant experience do you have for this program?', category: 'career', suggestedAnswer: 'I completed an internship at XYZ Company where I gained hands-on experience in data analysis and project management.', difficulty: 'medium', aiGenerated: true },
      { id: 'ai-4', sessionId: null, interviewType: 'university', country, question: 'How does this program fit into your long-term career plans?', category: 'career', suggestedAnswer: 'This program will provide me with advanced skills and a global network that I need to achieve my goal of becoming a senior data scientist.', difficulty: 'hard', aiGenerated: true },
      { id: 'ai-5', sessionId: null, interviewType: 'university', country, question: 'What can you contribute to our university community?', category: 'personal', suggestedAnswer: 'I am an active participant in student organizations and would love to contribute to the international student community through mentorship and cultural exchange.', difficulty: 'medium', aiGenerated: true },
    ],
  }
  return qSets[type] || qSets.ukvi
}
