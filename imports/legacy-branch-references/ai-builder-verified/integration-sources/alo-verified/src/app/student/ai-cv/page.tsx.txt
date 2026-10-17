'use client'

import { useEffect, useState } from 'react'
import {
  Sparkles, User, GraduationCap, Wrench,
  Download, Loader2, FileText, Copy, Check, RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { getSession } from '@/lib/session'
import { usePortalData } from '@/hooks/use-portal-data'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StudentRecord {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  highestEducation: string | null
  gpa: string | null
  englishTestType: string | null
  englishTestScore: string | null
  preferredCountry: string | null
  preferredCourse: string | null
}

interface CvFormState {
  fullName: string
  email: string
  phone: string
  summary: string
  education: string
  experience: string
  skills: string
  languages: string
  certifications: string
  achievements: string
  targetRole: string
}

export default function AiCvPage() {
  const session = getSession()
  const { data } = usePortalData<{ students: StudentRecord[] }>({
    endpoint: '/api/students',
    params: { search: session?.user.email || '', limit: 5 },
  })

  const student = data?.students?.find((s) => s.email === session?.user.email) || data?.students?.[0] || null

  const [form, setForm] = useState<CvFormState>({
    fullName: student ? `${student.firstName} ${student.lastName}` : session?.user.name || '',
    email: student?.email || session?.user.email || '',
    phone: student?.phone || session?.user.phone || '',
    summary: '',
    education: student?.highestEducation ? `${student.highestEducation} (GPA: ${student.gpa || '—'})` : '',
    experience: '',
    skills: '',
    languages: 'English (IELTS: ' + (student?.englishTestScore || '—') + '), Bengali (Native)',
    certifications: '',
    achievements: '',
    targetRole: student?.preferredCourse || '',
  })

  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Keep form synced once student loads
  useEffect(() => {
    if (student) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || `${student.firstName} ${student.lastName}`,
        email: f.email || student.email,
        phone: f.phone || student.phone || '',
        education: f.education || (student.highestEducation ? `${student.highestEducation} (GPA: ${student.gpa || '—'})` : ''),
        targetRole: f.targetRole || student.preferredCourse || '',
        languages: f.languages || `English (IELTS: ${student.englishTestScore || '—'}), Bengali (Native)`,
      }))
    }
  }, [student])

  const setField = <K extends keyof CvFormState>(key: K, value: CvFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleGenerate = async () => {
    if (!form.fullName) {
      toast.error('Please enter your name')
      return
    }
    setLoading(true)
    setGenerated('')
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      const prompt = `Generate a professional CV/Resume for the following student. Format as clean, well-structured text with sections (Summary, Education, Experience, Skills, Languages, Certifications, Achievements). Make it ATS-friendly.

NAME: ${form.fullName}
EMAIL: ${form.email}
PHONE: ${form.phone}
TARGET ROLE: ${form.targetRole || 'Not specified'}

PROFESSIONAL SUMMARY:
${form.summary || 'Provide a compelling professional summary based on the education and experience below.'}

EDUCATION:
${form.education || 'Not provided'}

EXPERIENCE:
${form.experience || 'Not provided - include any internships, projects, or relevant work.'}

SKILLS:
${form.skills || 'Not provided - suggest relevant skills based on target role.'}

LANGUAGES:
${form.languages || 'English'}

CERTIFICATIONS:
${form.certifications || 'Not provided'}

ACHIEVEMENTS:
${form.achievements || 'Not provided'}

Please generate a polished CV based on this information.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          command: 'cv',
          agentType: 'email_writer',
          userId: session?.user.id,
          inputText: prompt,
        }),
      })
      if (!res.ok) throw new Error('AI request failed')
      const data = await res.json()
      setGenerated(data.output || 'No output generated. Please try again.')
      toast.success('CV generated successfully')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate CV')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    toast.success('CV copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([generated], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.fullName.replace(/\s+/g, '_')}_CV.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CV downloaded')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI CV Builder"
        description="Generate a professional, ATS-friendly CV tailored to your target program in seconds."
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
              <User className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Personal Details</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full Name</Label>
                <Input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} placeholder="e.g. Tanvir Ahmed" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Target Role / Program</Label>
                <Input value={form.targetRole} onChange={(e) => setField('targetRole', e.target.value)} placeholder="e.g. MSc Computer Science" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Professional Summary</Label>
                <Textarea value={form.summary} onChange={(e) => setField('summary', e.target.value)} rows={3} placeholder="A brief summary of who you are and your career goals…" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Education & Experience</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Education (degree, institution, year, GPA)</Label>
                <Textarea value={form.education} onChange={(e) => setField('education', e.target.value)} rows={3} placeholder="BSc in Computer Science, BRAC University, 2024, CGPA 3.65/4.0" />
              </div>
              <div className="space-y-1.5">
                <Label>Work Experience / Internships</Label>
                <Textarea value={form.experience} onChange={(e) => setField('experience', e.target.value)} rows={4} placeholder="Software Engineer Intern at XYZ Ltd (Jun 2023 – Aug 2023): Worked on…" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Skills & Extras</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Skills (comma-separated)</Label>
                <Textarea value={form.skills} onChange={(e) => setField('skills', e.target.value)} rows={2} placeholder="Python, JavaScript, React, SQL, Machine Learning" />
              </div>
              <div className="space-y-1.5">
                <Label>Languages</Label>
                <Input value={form.languages} onChange={(e) => setField('languages', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Certifications</Label>
                <Textarea value={form.certifications} onChange={(e) => setField('certifications', e.target.value)} rows={2} placeholder="AWS Cloud Practitioner, Google Data Analytics Cert" />
              </div>
              <div className="space-y-1.5">
                <Label>Achievements / Awards</Label>
                <Textarea value={form.achievements} onChange={(e) => setField('achievements', e.target.value)} rows={2} placeholder="Dean's List 2023, Winner - National Hackathon 2024" />
              </div>
            </div>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#E8501A] hover:bg-[#c8420f] text-white h-11"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating your CV…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate CV with AI</>
            )}
          </Button>
        </div>

        {/* Preview */}
        <div>
          <Card className="border-0 shadow-sm sticky top-20 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0057B8]" />
                <h3 className="font-bold text-slate-900">CV Preview</h3>
              </div>
              {generated && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleCopy} className="h-8">
                    {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8">
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 min-h-[500px] max-h-[700px] overflow-y-auto bg-white alo-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0057B8]" />
                    AI is drafting your CV…
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-1/3 rounded bg-slate-100 animate-pulse mb-2" />
                      <div className="h-3 w-full rounded bg-slate-100 animate-pulse mb-1.5" />
                      <div className="h-3 w-5/6 rounded bg-slate-100 animate-pulse mb-1.5" />
                      <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : generated ? (
                <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">{generated}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-[#0057B8]" />
                  </div>
                  <p className="font-semibold text-slate-900">Your AI-generated CV will appear here</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Fill in your details on the left, then click Generate CV to get a polished, ATS-ready document.
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
