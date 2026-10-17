'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Send, Loader2, User, Bot, RotateCcw, GraduationCap,
  Building2, BookOpen, Plane, ArrowLeft, CheckCircle2, MessageSquare,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

interface UniResponse {
  universities: Array<{ id: string; name: string; country: string }>
}
interface CourseResponse {
  courses: Array<{ id: string; name: string; level: string | null; university: { name: string } }>
}

interface ChatMessage {
  role: 'ai' | 'student'
  content: string
  feedback?: string
  timestamp: number
}

interface InterviewSetup {
  studentName: string
  university: string
  course: string
  type: 'visa' | 'academic' | 'general'
}

const TYPE_META = {
  visa: { label: 'Visa Interview', icon: Plane, color: 'bg-[#FFF7ED] text-[#E8501A] border-orange-200', description: 'UKVI / student visa interview practice' },
  academic: { label: 'Academic Interview', icon: GraduationCap, color: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200', description: 'University admission interview' },
  general: { label: 'General Interview', icon: MessageSquare, color: 'bg-purple-50 text-purple-700 border-purple-200', description: 'Soft skills & communication' },
}

export default function AIMockInterviewPage() {
  const session = getSession()
  const [setup, setSetup] = useState<InterviewSetup | null>(null)
  const [form, setForm] = useState<InterviewSetup>({
    studentName: '', university: '', course: '', type: 'visa',
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: uniData } = usePortalData<UniResponse>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })
  const { data: courseData } = usePortalData<CourseResponse>({
    endpoint: '/api/courses',
    params: { limit: 100 },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const startInterview = async () => {
    if (!form.studentName || !form.university || !form.course) {
      toast.error('Please fill in all fields')
      return
    }
    setSetup(form)
    setLoading(true)
    // Ask first question
    await askQuestion(form, [])
  }

  const askQuestion = async (setupData: InterviewSetup, prevMessages: ChatMessage[]) => {
    setLoading(true)
    try {
      const transcript = prevMessages
        .map((m) => `${m.role === 'ai' ? 'Interviewer' : 'Student'}: ${m.content}${m.feedback ? ` [Feedback: ${m.feedback}]` : ''}`)
        .join('\n')

      const prompt = `You are conducting a ${TYPE_META[setupData.type].label} mock interview for a student named ${setupData.studentName} who is applying to ${setupData.university} for the ${setupData.course} program.

${transcript ? `Previous conversation:\n${transcript}\n` : ''}
Ask the next interview question. Be specific, realistic, and professional. Only ask ONE question at a time. Keep it concise (1-2 sentences). Do not provide feedback yet — wait for the student's answer.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({
          command: `mock-interview-${setupData.type}`,
          agentType: setupData.type === 'visa' ? 'ukvi_practice' : 'general',
          userId: session?.user.id,
          inputText: prompt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI request failed')
      const content = data.output || data.outputText || 'Could you tell me about yourself?'
      setMessages((prev) => [...prev, { role: 'ai', content, timestamp: Date.now() }])
      setQuestionCount((c) => c + 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to get question')
      // Add fallback question
      const fallbacks = [
        `Tell me about yourself and why you want to study ${setupData?.course} at ${setupData?.university}.`,
        `What are your long-term career goals after completing this program?`,
        `How will you fund your studies and living expenses abroad?`,
        `Why did you choose ${setupData?.university} over other universities?`,
      ]
      setMessages((prev) => [...prev, { role: 'ai', content: fallbacks[prev.filter((m) => m.role === 'ai').length % fallbacks.length], timestamp: Date.now() }])
      setQuestionCount((c) => c + 1)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!input.trim() || !setup) return
    const answer = input.trim()
    setMessages((prev) => [...prev, { role: 'student', content: answer, timestamp: Date.now() }])
    setInput('')
    setLoading(true)

    try {
      // Get AI feedback on the answer + next question
      const transcript = messages
        .map((m) => `${m.role === 'ai' ? 'Interviewer' : 'Student'}: ${m.content}`)
        .join('\n')

      const prompt = `You are conducting a ${TYPE_META[setup.type].label} mock interview for ${setup.studentName} applying to ${setup.university} for ${setup.course}.

Conversation so far:
${transcript}

Student just answered: "${answer}"

Respond in this exact format:
FEEDBACK: <brief 2-3 sentence feedback on the answer — what was good, what could be improved>
QUESTION: <the next interview question, just ONE question, 1-2 sentences>`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({
          command: `mock-interview-feedback-${setup.type}`,
          agentType: setup.type === 'visa' ? 'ukvi_practice' : 'general',
          userId: session?.user.id,
          inputText: prompt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI request failed')
      const output: string = data.output || data.outputText || ''

      // Parse feedback and next question
      const feedbackMatch = output.match(/FEEDBACK:\s*([\s\S]*?)(?:QUESTION:|$)/i)
      const questionMatch = output.match(/QUESTION:\s*([\s\S]*?)$/i)
      const feedback = feedbackMatch?.[1]?.trim() || 'Good answer. Try to be more specific with examples.'
      const nextQ = questionMatch?.[1]?.trim() || output

      // Update the last student message with feedback
      setMessages((prev) => {
        const updated = [...prev]
        const lastStudentIdx = updated.map((m) => m.role).lastIndexOf('student')
        if (lastStudentIdx >= 0) {
          updated[lastStudentIdx] = { ...updated[lastStudentIdx], feedback }
        }
        return updated
      })

      // Add next question
      setMessages((prev) => [...prev, { role: 'ai', content: nextQ, timestamp: Date.now() }])
      setQuestionCount((c) => c + 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to get feedback')
      // Fallback
      setMessages((prev) => {
        const updated = [...prev]
        const lastStudentIdx = updated.map((m) => m.role).lastIndexOf('student')
        if (lastStudentIdx >= 0) {
          updated[lastStudentIdx] = { ...updated[lastStudentIdx], feedback: 'Good effort. Consider adding concrete examples to strengthen your response.' }
        }
        return [...updated, { role: 'ai', content: 'Tell me about a challenge you faced and how you overcame it.', timestamp: Date.now() }]
      })
      setQuestionCount((c) => c + 1)
    } finally {
      setLoading(false)
    }
  }

  const endInterview = () => {
    setSetup(null)
    setMessages([])
    setInput('')
    setQuestionCount(0)
  }

  // ─── Setup screen ───
  if (!setup) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Mock Interview"
          description="Practice university and visa interviews with an AI interviewer trained on real-world scenarios."
        />
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Setup Interview</h3>
                <p className="text-xs text-slate-500">Configure the interview scenario</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Student Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.studentName}
                  onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                  placeholder="e.g. Tanvir Ahmed"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Target University <span className="text-red-500">*</span></Label>
                <Select
                  value={form.university}
                  onValueChange={(v) => setForm((f) => ({ ...f, university: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select university" /></SelectTrigger>
                  <SelectContent>
                    {uniData?.universities?.map((u) => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course / Program <span className="text-red-500">*</span></Label>
                <Select
                  value={form.course}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courseData?.courses?.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interview Type <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>).map((k) => {
                    const meta = TYPE_META[k]
                    const Icon = meta.icon
                    const active = form.type === k
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: k }))}
                        className={
                          'p-3 rounded-lg border-2 text-center transition-all ' +
                          (active ? 'border-[#0057B8] bg-[#EFF6FF]' : 'border-slate-200 hover:border-slate-300')
                        }
                      >
                        <Icon className={'h-5 w-5 mx-auto mb-1 ' + (active ? 'text-[#0057B8]' : 'text-slate-400')} />
                        <p className={'text-xs font-semibold ' + (active ? 'text-[#0057B8]' : 'text-slate-600')}>{meta.label}</p>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">{TYPE_META[form.type].description}</p>
              </div>
              <Button
                onClick={startInterview}
                disabled={!form.studentName || !form.university || !form.course || loading}
                className="w-full bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Start Interview</>
                )}
              </Button>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-6 border-0 shadow-sm bg-[#EFF6FF]">
            <h3 className="font-bold text-slate-900 mb-3">How it works</h3>
            <div className="space-y-3 text-sm text-slate-700">
              {[
                { icon: MessageSquare, title: 'AI asks realistic questions', desc: 'Based on the chosen university, course, and interview type.' },
                { icon: Sparkles, title: 'Get instant feedback', desc: 'After each answer, the AI evaluates clarity, relevance, and confidence.' },
                { icon: RotateCcw, title: 'Practice anytime', desc: 'Unlimited sessions — perfect for shy students before the real interview.' },
              ].map((t, i) => {
                const Icon = t.icon
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#0057B8]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-600">{t.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-white border border-blue-100">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Tip:</span> Encourage students to answer in full sentences and avoid one-word responses for more accurate feedback.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Interview screen ───
  const TypeIcon = TYPE_META[setup.type].icon
  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Mock Interview"
        description="In session"
        action={
          <Button variant="outline" onClick={endInterview}>
            <ArrowLeft className="h-4 w-4 mr-2" /> End & Restart
          </Button>
        }
      />

      {/* Session header */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white flex items-center justify-center">
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">{setup.studentName}</p>
            <p className="text-xs text-slate-500 truncate">
              {setup.university} • {setup.course}
            </p>
          </div>
          <Badge variant="outline" className={TYPE_META[setup.type].color}>
            {TYPE_META[setup.type].label}
          </Badge>
          <div className="text-right">
            <p className="text-xs text-slate-500">Questions</p>
            <p className="font-bold text-[#0057B8]">{questionCount}</p>
          </div>
        </div>
      </Card>

      {/* Chat */}
      <Card className="border-0 shadow-sm flex flex-col h-[60vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 alo-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={'flex gap-3 ' + (m.role === 'student' ? 'flex-row-reverse' : '')}>
              <div className={
                'h-8 w-8 rounded-full flex items-center justify-center shrink-0 ' +
                (m.role === 'ai' ? 'bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white' : 'bg-slate-200 text-slate-700')
              }>
                {m.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className={'max-w-[80%] ' + (m.role === 'student' ? 'items-end' : '')}>
                <div className={
                  'p-3 rounded-2xl text-sm ' +
                  (m.role === 'ai'
                    ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'
                    : 'bg-[#0057B8] text-white rounded-tr-sm')
                }>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.feedback && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[#FFF7ED] border border-orange-200">
                    <p className="text-xs font-semibold text-[#E8501A] mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> AI Feedback
                    </p>
                    <p className="text-xs text-slate-700">{m.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer…"
              rows={2}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submitAnswer()
                }
              }}
              className="resize-none"
            />
            <Button
              onClick={submitAnswer}
              disabled={loading || !input.trim()}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0 self-end"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Press Enter to send • Shift+Enter for new line</p>
        </div>
      </Card>
    </div>
  )
}
