'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Contact', icon: Mail },
  { id: 3, label: 'Academic', icon: GraduationCap },
  { id: 4, label: 'Preferences', icon: Globe },
]

const COUNTRIES = [
  'Bangladesh', 'India', 'Pakistan', 'Nepal', 'Sri Lanka', 'United Kingdom',
  'United States', 'Canada', 'Australia', 'Germany', 'Ireland', 'New Zealand',
  'Malaysia', 'Singapore', 'UAE', 'Other',
]

const INTAKES = [
  'January 2026', 'May 2026', 'September 2026',
  'January 2027', 'May 2027', 'September 2027',
]

const ENGLISH_TESTS = ['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'None']

const EDUCATION_LEVELS = [
  'SSC / O-Level', 'HSC / A-Level', 'Diploma', 'Bachelor', 'Masters', 'PhD',
]

interface FormState {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  email: string
  phone: string
  whatsappNumber: string
  address: string
  city: string
  country: string
  highestEducation: string
  gpa: string
  englishTestType: string
  englishTestScore: string
  preferredCountry: string
  preferredCourse: string
  preferredIntake: string
  notes: string
  createUserAccount: boolean
}

const initialState: FormState = {
  firstName: '', lastName: '', dateOfBirth: '', gender: '', nationality: 'Bangladesh',
  email: '', phone: '', whatsappNumber: '', address: '', city: '', country: 'Bangladesh',
  highestEducation: '', gpa: '', englishTestType: 'IELTS', englishTestScore: '',
  preferredCountry: 'United Kingdom', preferredCourse: '', preferredIntake: 'September 2026',
  notes: '', createUserAccount: false,
}

export default function RegisterStudentPage() {
  const session = getSession()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ id: string; studentId: string; name: string } | null>(null)

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    if (step === 1) return form.firstName && form.lastName && form.email
    if (step === 2) return form.phone
    if (step === 3) return form.highestEducation
    if (step === 4) return form.preferredCountry && form.preferredIntake
    return true
  }

  const submit = async () => {
    if (!session?.user.referenceId) {
      toast.error('No partner record linked to your account')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ...form,
          partnerId: session.user.referenceId,
          source: 'PARTNER_INBOUND',
          communicationMode: 'PARTNER_ONLY',
          status: 'active',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register student')
      setCreated({
        id: data.id,
        studentId: data.studentId,
        name: `${data.firstName} ${data.lastName}`,
      })
      toast.success(`Student ${data.studentId} registered successfully!`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to register student')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="space-y-6">
        <PageHeader title="Register New Student" description="Onboard a new student to your partner network." />
        <Card className="p-8 border-0 shadow-sm max-w-2xl mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Student Registered!</h2>
          <p className="text-sm text-slate-500 mb-4">
            {created.name} has been added to your student network.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EFF6FF] text-[#0057B8] text-sm font-semibold mb-6">
            Student ID: {created.studentId}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/partner/students">
                <User className="h-4 w-4 mr-2" /> View All Students
              </Link>
            </Button>
            <Button asChild className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
              <Link href="/partner/register-student">
                <User className="h-4 w-4 mr-2" /> Register Another
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register New Student"
        description="Onboard a new student to your partner network."
      />

      {/* Stepper */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const isActive = step === s.id
            const isDone = step > s.id
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={
                      'h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ' +
                      (isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-[#0057B8] text-white'
                        : 'bg-slate-100 text-slate-400')
                    }
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className={'text-xs font-medium ' + (isActive ? 'text-[#0057B8]' : 'text-slate-500')}>
                      Step {s.id}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{s.label}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={'flex-1 h-0.5 mx-2 ' + (isDone ? 'bg-green-500' : 'bg-slate-200')} />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-6 border-0 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-[#0057B8]" /> Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Tanvir" className="mt-1" />
              </div>
              <div>
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Ahmed" className="mt-1" />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Nationality</Label>
                <Select value={form.nationality} onValueChange={(v) => update('nationality', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="student@example.com" className="mt-1" />
                <p className="text-xs text-slate-500 mt-1">Used as the student&apos;s login username if a user account is created.</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#0057B8]" /> Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone <span className="text-red-500">*</span></Label>
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+8801712345678" className="mt-1" />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input value={form.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} placeholder="+8801712345678" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Street Address</Label>
                <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House #, Road #, Area" className="mt-1" />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Dhaka" className="mt-1" />
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.country} onValueChange={(v) => update('country', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#0057B8]" /> Academic Background
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Highest Education <span className="text-red-500">*</span></Label>
                <Select value={form.highestEducation} onValueChange={(v) => update('highestEducation', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>GPA / Score</Label>
                <Input value={form.gpa} onChange={(e) => update('gpa', e.target.value)} placeholder="3.65 / 4.0" className="mt-1" />
              </div>
              <div>
                <Label>English Test</Label>
                <Select value={form.englishTestType} onValueChange={(v) => update('englishTestType', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {ENGLISH_TESTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>English Test Score</Label>
                <Input value={form.englishTestScore} onChange={(e) => update('englishTestScore', e.target.value)} placeholder="6.5 / 7.0" className="mt-1" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#0057B8]" /> Study Preferences
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Preferred Country <span className="text-red-500">*</span></Label>
                <Select value={form.preferredCountry} onValueChange={(v) => update('preferredCountry', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preferred Intake <span className="text-red-500">*</span></Label>
                <Select value={form.preferredIntake} onValueChange={(v) => update('preferredIntake', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INTAKES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Preferred Course / Program</Label>
                <Input value={form.preferredCourse} onChange={(e) => update('preferredCourse', e.target.value)} placeholder="MSc Computer Science, MBA, etc." className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes for Counselor</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Any background, budget constraints or special instructions…"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2 flex items-start gap-2 p-3 rounded-lg bg-slate-50">
                <Checkbox
                  id="createUser"
                  checked={form.createUserAccount}
                  onCheckedChange={(v) => update('createUserAccount', v === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="createUser" className="cursor-pointer font-semibold">Create login account for student</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Student can sign in directly using their email and a temporary password (ChangeMe@12345).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <p className="text-xs text-slate-500 hidden sm:block">Step {step} of {STEPS.length}</p>
          {step < 4 ? (
            <Button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canProceed()}
              className="bg-[#0057B8] hover:bg-[#004a99] text-white border-0"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={!canProceed() || submitting}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting…</>
              ) : (
                <><Send className="h-4 w-4 mr-1" /> Register Student</>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Quick fill tip */}
      <Card className="p-4 border-0 shadow-sm bg-[#EFF6FF]">
        <div className="flex items-start gap-3">
          <ArrowRight className="h-4 w-4 text-[#0057B8] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Tip:</span> After registration, the student
            appears in <Link href="/partner/students" className="text-[#0057B8] underline">My Students</Link> and
            the ALO counselor team is auto-notified to begin the application process.
          </p>
        </div>
      </Card>
    </div>
  )
}
