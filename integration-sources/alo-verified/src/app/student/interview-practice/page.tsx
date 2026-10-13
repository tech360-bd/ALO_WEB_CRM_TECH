'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Mic, MicOff, Clock, CheckCircle2, Circle, Play, Plus,
  ChevronDown, ChevronRight, MessageSquare, Award, Calendar,
  ArrowRight, ListChecks, Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface InterviewQuestion {
  id: string
  question: string
  category: string | null
  suggestedAnswer: string | null
  difficulty: string
}

interface InterviewSession {
  id: string
  interviewType: string
  country: string | null
  scheduledAt: string | null
  completedAt: string | null
  status: string
  meetingType: string
  meetingLink: string | null
  score: number | null
  feedback: string | null
  notes: string | null
  questions: InterviewQuestion[]
}

interface DefaultQuestion {
  category: string
  question: string
}

interface InterviewData {
  sessions: InterviewSession[]
  readinessScore: number
  categories: string[]
  defaultQuestions: DefaultQuestion[]
}

const CATEGORY_LABELS: Record<string, string> = {
  why_country: 'Why This Country?',
  why_university: 'Why This University?',
  why_course: 'Why This Course?',
  why_not_bangladesh: 'Why Not Bangladesh?',
  sponsor: 'Who Is Sponsoring?',
  future_plan: 'Future Plan?',
  academic_gap: 'Academic Gap?',
  previous_refusal: 'Previous Refusal?',
  tuition_fee: 'Tuition Fee?',
  accommodation: 'Where Will You Stay?',
  after_graduation: 'After Graduation?',
}

const INTERVIEW_TYPES = [
  { value: 'credibility', label: 'Credibility Interview', desc: 'UKVI-style credibility interview' },
  { value: 'university', label: 'University Interview', desc: 'Admissions panel interview' },
  { value: 'visa', label: 'Visa Officer Interview', desc: 'Mock visa officer Q&A' },
  { value: 'mock', label: 'Mock Interview', desc: 'General practice session' },
]

const SESSION_STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Clock }> = {
  scheduled: { label: 'Scheduled', color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]', border: 'border-[#BED9F5]', icon: Calendar },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Play },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: MicOff },
  no_show: { label: 'No Show', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: MicOff },
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export default function InterviewPracticePage() {
  const session = getSession()
  const refId = session?.user.referenceId || ''

  const { data, loading, error } = usePortalData<InterviewData>({
    endpoint: '/api/visa/interview',
    params: { studentId: refId },
    enabled: !!refId,
  })

  const sessions = data?.sessions ?? []
  const readinessScore = data?.readinessScore ?? 0
  const categories = data?.categories ?? []
  const defaultQuestions = data?.defaultQuestions ?? []

  const [submitting, setSubmitting] = useState(false)
  const [interviewType, setInterviewType] = useState<string>('mock')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const groupedQuestions = useMemo(() => {
    const map = new Map<string, DefaultQuestion[]>()
    defaultQuestions.forEach((q) => {
      const arr = map.get(q.category) || []
      arr.push(q)
      map.set(q.category, arr)
    })
    return Array.from(map.entries())
  }, [defaultQuestions])

  const completedCount = sessions.filter((s) => s.status === 'completed').length

  const scoreColor =
    readinessScore >= 100 ? 'text-green-600'
    : readinessScore >= 50 ? 'text-amber-600'
    : 'text-red-600'

  async function handleSubmitPractice() {
    if (!refId) {
      toast.error('Session not loaded. Please refresh the page.')
      return
    }
    setSubmitting(true)
    try {
      const questions = defaultQuestions
        .map((q, idx) => ({
          question: q.question,
          category: q.category,
          candidateAnswer: answers[idx]?.trim() || undefined,
        }))
        .filter((q) => q.candidateAnswer)

      if (questions.length === 0) {
        toast.error('Please answer at least one question before submitting.')
        setSubmitting(false)
        return
      }

      const token = session?.token
      const res = await fetch('/api/visa/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: refId,
          interviewType,
          scheduledAt: scheduledAt || new Date().toISOString(),
          status: 'completed',
          questions,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create session')
      toast.success('Practice session saved! Your counselor will review it.')
      setAnswers({})
      setScheduledAt('')
      setInterviewType('mock')
      // Reload the page data
      setTimeout(() => window.location.reload(), 1200)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to submit'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Practice"
        description="Practice credibility, university, and visa officer interview questions. Build confidence before your real interview."
      />

      {/* Hero score */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm lg:col-span-2 h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Interview Readiness Score</p>
              <p className={cn('text-4xl font-extrabold mt-1', scoreColor)}>{readinessScore}<span className="text-xl text-slate-400">/100</span></p>
              <p className="text-xs text-slate-500 mt-2">
                Scored 0 → 50 → 100 based on completed practice sessions (0 / 1 / 2+ sessions).
              </p>
            </div>
            <div className="h-14 w-14 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <Mic className="h-7 w-7 text-[#0057B8]" />
            </div>
          </div>
          <Progress value={readinessScore} className="h-2.5 mt-4" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {completedCount} Completed
            </Badge>
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
              <Calendar className="h-3 w-3 mr-1" /> {sessions.length - completedCount} Scheduled
            </Badge>
            <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-[#BED9F5]">
              <ListChecks className="h-3 w-3 mr-1" /> {defaultQuestions.length} Default Questions
            </Badge>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm h-full bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[#E8501A]" />
            <p className="text-sm font-semibold text-slate-900">Why Practice Matters</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Visa officers test intent, finance, and post-study plans. Two completed mock interviews dramatically improve your readiness score and reduce refusal risk.
          </p>
          <Button asChild size="sm" variant="outline" className="h-10 mt-4 w-full">
            <a href="#new-practice">Start Practicing <ArrowRight className="h-3.5 w-3.5 ml-1" /></a>
          </Button>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={sessions.length} icon={Mic} accent="blue" hint="All time" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} accent="green" hint="Practice sessions" />
        <StatCard label="Avg Score" value={sessions.filter((s) => s.score != null).length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.filter((s) => s.score != null).length) : '—'} icon={Award} accent="orange" hint="Counselor rated" />
        <StatCard label="Categories" value={categories.length} icon={ListChecks} accent="purple" hint="Question types" />
      </div>

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-12">
          <TabsTrigger value="bank" className="h-10">Question Bank</TabsTrigger>
          <TabsTrigger value="sessions" className="h-10">My Sessions</TabsTrigger>
          <TabsTrigger value="new" className="h-10">New Practice</TabsTrigger>
        </TabsList>

        {/* Question Bank Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Question Bank</h3>
              <p className="text-xs text-slate-500 mt-0.5">11 categories of visa / credibility interview questions with default prompts</p>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : groupedQuestions.length === 0 ? (
              <div className="text-center py-10">
                <ListChecks className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Question bank is loading or unavailable.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {groupedQuestions.map(([category, qs]) => (
                  <AccordionItem key={category} value={category} className="border-slate-200">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                          <MessageSquare className="h-4 w-4 text-[#0057B8]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{CATEGORY_LABELS[category] || category.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-slate-500">{qs.length} question{qs.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 pl-12">
                      <div className="space-y-3">
                        {qs.map((q, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                            <p className="text-sm text-slate-800 font-medium">Q{idx + 1}. {q.question}</p>
                            <p className="text-[11px] text-slate-500 mt-1.5">Tip: Practice your answer out loud, keep it under 60 seconds, and be specific to your situation.</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">My Interview Sessions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Past interviews, scores, and counselor feedback</p>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <Mic className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">No interview sessions yet.</p>
                <p className="text-xs text-slate-400 mb-4">Start your first practice session in the “New Practice” tab.</p>
                <Button asChild size="sm" className="h-12 bg-[#0057B8] hover:bg-[#004a99]">
                  <a href="#new-practice"><Plus className="h-4 w-4 mr-1" /> New Practice</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto alo-scrollbar pr-1">
                {sessions.map((s) => {
                  const meta = SESSION_STATUS_META[s.status] || SESSION_STATUS_META.scheduled
                  const typeMeta = INTERVIEW_TYPES.find((t) => t.value === s.interviewType)
                  return (
                    <div key={s.id} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', meta.bg)}>
                            <meta.icon className={cn('h-5 w-5', meta.color)} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 capitalize">
                              {(typeMeta?.label) || s.interviewType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-500">
                              Scheduled: {formatDate(s.scheduledAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.score != null && (
                            <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-[#FFE0C2]">
                              <Award className="h-3 w-3 mr-1" /> Score: {s.score}/100
                            </Badge>
                          )}
                          <Badge variant="outline" className={cn(meta.color, meta.bg, meta.border)}>
                            {meta.label}
                          </Badge>
                        </div>
                      </div>
                      {s.feedback && (
                        <div className="mt-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Counselor Feedback</p>
                          <p className="text-xs text-slate-700 whitespace-pre-line">{s.feedback}</p>
                        </div>
                      )}
                      {s.notes && (
                        <p className="text-xs text-slate-500 mt-2 italic">{s.notes}</p>
                      )}
                      {s.questions.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                          <MessageSquare className="h-3 w-3" />
                          {s.questions.length} question{s.questions.length > 1 ? 's' : ''} in this session
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* New Practice Tab */}
        <TabsContent value="new" className="space-y-4" id="new-practice">
          <Card className="p-6 border-0 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">New Practice Session</h3>
              <p className="text-xs text-slate-500 mt-0.5">Answer the 11 default questions below. Your counselor will review and provide feedback.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-2">
                <Label htmlFor="interview-type" className="text-sm font-medium">Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger id="interview-type" className="h-12">
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{t.label}</span>
                          <span className="text-[11px] text-slate-500">{t.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-at" className="text-sm font-medium">Scheduled At (optional)</Label>
                <Input
                  id="scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-4 w-4 text-[#0057B8]" />
                <p className="text-sm font-semibold text-slate-900">Default Questions ({defaultQuestions.length})</p>
              </div>
              {defaultQuestions.length === 0 ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                defaultQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC]">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] bg-white text-[#0057B8] border-[#BED9F5] shrink-0">
                        {CATEGORY_LABELS[q.category] || q.category.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm font-medium text-slate-900">{idx + 1}. {q.question}</p>
                    </div>
                    <Textarea
                      placeholder="Type your answer here. Aim for 80-150 words, specific to your situation."
                      value={answers[idx] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                      className="min-h-[90px] bg-white resize-y"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {Object.values(answers).filter((a) => a?.trim()).length} of {defaultQuestions.length} questions answered
              </p>
              <Button
                onClick={handleSubmitPractice}
                disabled={submitting}
                className="h-12 bg-[#E8501A] hover:bg-[#c44314] px-8 w-full sm:w-auto"
              >
                {submitting ? (
                  <><Clock className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Practice</>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tip card */}
      <Card className="p-6 border-0 shadow-sm bg-[#F8FAFC]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#FFF7ED] flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-[#E8501A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Pro Tip: Practice Out Loud</p>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Record yourself answering these questions. Listen back for clarity, confidence, and conciseness. Visa officers form an impression in the first 30 seconds — practice your opening line until it feels natural.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
