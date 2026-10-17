'use client'

import { useEffect, useState } from 'react'
import {
  Sparkles, GraduationCap, Target, Award, BookOpen,
  Loader2, FileText, Copy, Check, Download, RefreshCw, PenLine,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { getSession } from '@/lib/session'
import { usePortalData } from '@/hooks/use-portal-data'
import { toast } from 'sonner'

interface StudentRecord {
  id: string
  firstName: string
  lastName: string
  highestEducation: string | null
  gpa: string | null
  englishTestType: string | null
  englishTestScore: string | null
  preferredCountry: string | null
  preferredCourse: string | null
}

interface SopFormState {
  fullName: string
  targetUniversity: string
  targetCourse: string
  country: string
  background: string
  achievements: string
  workExperience: string
  careerGoals: string
  whyThisCourse: string
  whyThisUniversity: string
  wordCount: string
}

const WORD_COUNTS = ['500', '750', '1000', '1500']

export default function AiSopPage() {
  const session = getSession()
  const { data } = usePortalData<{ students: StudentRecord[] }>({
    endpoint: '/api/students',
    params: { search: session?.user.email || '', limit: 5 },
  })

  const student = data?.students?.find((s) => s.email === session?.user.email) || data?.students?.[0] || null

  const [form, setForm] = useState<SopFormState>({
    fullName: session?.user.name || '',
    targetUniversity: '',
    targetCourse: student?.preferredCourse || '',
    country: student?.preferredCountry || 'United Kingdom',
    background: student?.highestEducation ? `I have completed my ${student.highestEducation} with a GPA of ${student.gpa || '—'}.` : '',
    achievements: '',
    workExperience: '',
    careerGoals: '',
    whyThisCourse: '',
    whyThisUniversity: '',
    wordCount: '750',
  })

  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (student) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || `${student.firstName} ${student.lastName}`,
        targetCourse: f.targetCourse || student.preferredCourse || '',
        country: f.country || student.preferredCountry || 'United Kingdom',
        background: f.background || (student.highestEducation ? `I have completed my ${student.highestEducation} with a GPA of ${student.gpa || '—'}.` : ''),
      }))
    }
  }, [student])

  const setField = <K extends keyof SopFormState>(key: K, value: SopFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleGenerate = async () => {
    if (!form.targetCourse || !form.targetUniversity) {
      toast.error('Please enter your target university and course')
      return
    }
    setLoading(true)
    setGenerated('')
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      const prompt = `Write a compelling Statement of Purpose (SOP) for university admission. Target length: ${form.wordCount} words.

APPLICANT: ${form.fullName}
TARGET UNIVERSITY: ${form.targetUniversity}
TARGET COURSE: ${form.targetCourse}
DESTINATION: ${form.country}

ACADEMIC BACKGROUND:
${form.background || 'Not provided - please infer a strong academic foundation.'}

ACHIEVEMENTS:
${form.achievements || 'Not provided - please suggest generic achievements that strengthen the application.'}

WORK EXPERIENCE / INTERNSHIPS:
${form.workExperience || 'Not provided - mention any relevant projects or internships.'}

WHY THIS COURSE:
${form.whyThisCourse || 'Not provided - please articulate why this course is a good fit.'}

WHY THIS UNIVERSITY:
${form.whyThisUniversity || 'Not provided - mention faculty, research facilities, or curriculum.'}

CAREER GOALS:
${form.careerGoals || 'Not provided - discuss short-term and long-term goals.'}

Structure the SOP with the following sections in a flowing narrative:
1. Engaging introduction
2. Academic background and inspirations
3. Why this specific course
4. Why this university
5. Career aspirations
6. Strong closing

Make it authentic, specific, and persuasive. Avoid clichés. Use first person.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          command: 'sop',
          agentType: 'sop_assistant',
          userId: session?.user.id,
          inputText: prompt,
        }),
      })
      if (!res.ok) throw new Error('AI request failed')
      const data = await res.json()
      setGenerated(data.output || 'No output generated. Please try again.')
      toast.success('SOP generated successfully')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate SOP')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    toast.success('SOP copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([generated], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.fullName.replace(/\s+/g, '_')}_SOP.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('SOP downloaded')
  }

  const wordCount = generated ? generated.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI SOP Writer"
        description="Craft a compelling Statement of Purpose tailored to your target university and program."
        action={
          <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-[#E8501A]/20">
            <Sparkles className="h-3 w-3 mr-1" /> Powered by AI
          </Badge>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Target Program</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} placeholder="e.g. Tanvir Ahmed" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Target University</Label>
                  <Input value={form.targetUniversity} onChange={(e) => setField('targetUniversity', e.target.value)} placeholder="e.g. University of Manchester" />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Course</Label>
                  <Input value={form.targetCourse} onChange={(e) => setField('targetCourse', e.target.value)} placeholder="e.g. MSc Data Science" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Destination Country</Label>
                  <Input value={form.country} onChange={(e) => setField('country', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Word Count</Label>
                  <Select value={form.wordCount} onValueChange={(v) => setField('wordCount', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORD_COUNTS.map((w) => <SelectItem key={w} value={w}>{w} words</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Background</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Academic Background</Label>
                <Textarea value={form.background} onChange={(e) => setField('background', e.target.value)} rows={3} placeholder="Describe your educational journey, key subjects, GPA, projects…" />
              </div>
              <div className="space-y-1.5">
                <Label>Achievements & Awards</Label>
                <Textarea value={form.achievements} onChange={(e) => setField('achievements', e.target.value)} rows={2} placeholder="Scholarships, competitions, research papers, leadership roles…" />
              </div>
              <div className="space-y-1.5">
                <Label>Work Experience / Internships</Label>
                <Textarea value={form.workExperience} onChange={(e) => setField('workExperience', e.target.value)} rows={3} placeholder="Relevant work, internships, research assistantships…" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Motivation & Goals</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Why this course?</Label>
                <Textarea value={form.whyThisCourse} onChange={(e) => setField('whyThisCourse', e.target.value)} rows={2} placeholder="What attracts you to this specific program? Specializations, modules…" />
              </div>
              <div className="space-y-1.5">
                <Label>Why this university?</Label>
                <Textarea value={form.whyThisUniversity} onChange={(e) => setField('whyThisUniversity', e.target.value)} rows={2} placeholder="Faculty, research facilities, industry connections, campus…" />
              </div>
              <div className="space-y-1.5">
                <Label>Career Goals</Label>
                <Textarea value={form.careerGoals} onChange={(e) => setField('careerGoals', e.target.value)} rows={2} placeholder="Short-term and long-term career aspirations after graduation…" />
              </div>
            </div>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#E8501A] hover:bg-[#c8420f] text-white h-11"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Crafting your SOP…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate SOP</>
            )}
          </Button>
        </div>

        {/* Preview */}
        <div>
          <Card className="border-0 shadow-sm sticky top-20 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0057B8]" />
                <h3 className="font-bold text-slate-900">SOP Preview</h3>
                {generated && (
                  <Badge variant="outline" className="bg-white text-slate-600 border-slate-200">
                    {wordCount} words
                  </Badge>
                )}
              </div>
              {generated && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleCopy} className="h-8">
                    {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8">
                    <Download className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 min-h-[500px] max-h-[700px] overflow-y-auto bg-white alo-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0057B8]" />
                    AI is writing your SOP…
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="h-3 w-full rounded bg-slate-100 animate-pulse mb-1.5" />
                      <div className="h-3 w-5/6 rounded bg-slate-100 animate-pulse mb-1.5" />
                      <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse mb-2" />
                    </div>
                  ))}
                </div>
              ) : generated ? (
                <div>
                  <Textarea
                    value={generated}
                    onChange={(e) => setGenerated(e.target.value)}
                    className="min-h-[600px] border-0 p-0 focus-visible:ring-0 text-sm leading-relaxed resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <PenLine className="h-3 w-3" /> Editable — make any changes you want
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-4">
                    <BookOpen className="h-8 w-8 text-[#0057B8]" />
                  </div>
                  <p className="font-semibold text-slate-900">Your AI-generated SOP will appear here</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Fill in your details on the left, then click Generate SOP to get a personalized, persuasive essay.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <span><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Pre-fill from profile</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
