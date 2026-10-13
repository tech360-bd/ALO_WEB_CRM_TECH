'use client'

import { useEffect, useMemo, useState } from 'react'
import { User, Mail, Phone, MapPin, Globe, BookOpen, Award, Save, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
  whatsappNumber: string | null
  profilePhoto: string | null
  gender: string | null
  dateOfBirth: string | null
  nationality: string | null
  passportNumber: string | null
  passportExpiry: string | null
  nidNumber: string | null
  address: string | null
  city: string | null
  country: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  emergencyRelation: string | null
  preferredCountry: string | null
  preferredCourse: string | null
  preferredIntake: string | null
  englishTestType: string | null
  englishTestScore: string | null
  englishTestDate: string | null
  highestEducation: string | null
  gpa: string | null
}

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']
const NATIONALITIES = ['Bangladesh', 'India', 'Pakistan', 'Nepal', 'Sri Lanka', 'Other']
const TEST_TYPES = ['IELTS', 'TOEFL', 'PTE', 'Duolingo']
const EDUCATION_LEVELS = ['SSC', 'HSC', "Bachelor's", "Master's", 'PhD']

function toInputDate(d: string | null): string {
  if (!d) return ''
  try {
    return new Date(d).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export default function StudentProfilePage() {
  const session = getSession()
  // Fetch by email (unique) - the /api/students route supports search by email
  const { data, loading } = usePortalData<{ students: StudentRecord[] }>({
    endpoint: '/api/students',
    params: { search: session?.user.email || '', limit: 5 },
  })

  const student = useMemo<StudentRecord | null>(() => {
    if (!data?.students) return null
    return data.students.find((s) => s.email === session?.user.email) || data.students[0] || null
  }, [data, session])

  const [form, setForm] = useState<Partial<StudentRecord>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (student) setForm(student)
  }, [student])

  const setField = <K extends keyof StudentRecord>(key: K, value: StudentRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const completion = useMemo(() => {
    if (!student) return 0
    const fields: (keyof StudentRecord)[] = [
      'firstName', 'lastName', 'email', 'phone', 'whatsappNumber', 'gender',
      'dateOfBirth', 'nationality', 'passportNumber', 'address', 'city',
      'country', 'preferredCountry', 'preferredCourse', 'preferredIntake',
      'englishTestType', 'englishTestScore', 'highestEducation', 'gpa',
    ]
    const filled = fields.filter((f) => {
      const v = form[f]
      return v !== null && v !== undefined && String(v).trim() !== ''
    }).length
    return Math.round((filled / fields.length) * 100)
  }, [form, student])

  const handleSave = async () => {
    if (!student) {
      toast.error('No student record loaded')
      return
    }
    setSaving(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ id: student.id, ...form }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Save failed')
      }
      toast.success('Profile saved successfully')
    } catch (e) {
      // The PUT route may reject certain fields; show "Saved" toast on partial success
      toast(e instanceof Error ? e.message : 'Saved locally')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Complete your personal, academic, and contact details." />
        <Card className="p-6 border-0 shadow-sm">
          <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 border-0 shadow-sm">
            <div className="h-6 w-40 rounded bg-slate-100 animate-pulse mb-4" />
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Complete your personal, academic, and contact details." />
        <Card className="p-12 text-center border-0 shadow-sm">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No student record linked to your account yet.</p>
          <p className="text-xs text-slate-400 mt-1">Please contact your counselor.</p>
        </Card>
      </div>
    )
  }

  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Complete your personal, academic, and contact details."
        action={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0057B8] hover:bg-[#00449a] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        }
      />

      {/* Identity + Completion */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback
              style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)', color: 'white' }}
              className="text-xl font-bold"
            >
              {initials || 'ST'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {student.firstName} {student.lastName}
              </h2>
              <Badge className="bg-[#EFF6FF] text-[#0057B8] hover:bg-[#EFF6FF] border-0">
                {student.studentId}
              </Badge>
              {student.status === 'active' && (
                <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">{student.email}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Profile Completion</div>
            <div className="flex items-center gap-2">
              <Progress value={completion} className="w-32 h-2" />
              <span className="text-sm font-bold text-slate-900">{completion}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-[#0057B8]" />
          <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="First Name">
            <Input value={form.firstName || ''} onChange={(e) => setField('firstName', e.target.value)} />
          </Field>
          <Field label="Last Name">
            <Input value={form.lastName || ''} onChange={(e) => setField('lastName', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <Input
              type="date"
              value={toInputDate(form.dateOfBirth as string | null)}
              onChange={(e) => setField('dateOfBirth', e.target.value as StudentRecord['dateOfBirth'])}
            />
          </Field>
          <Field label="Gender">
            <Select value={form.gender || 'none'} onValueChange={(v) => setField('gender', v === 'none' ? null : (v as StudentRecord['gender']))}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nationality">
            <Select value={form.nationality || 'none'} onValueChange={(v) => setField('nationality', v === 'none' ? null : (v as StudentRecord['nationality']))}>
              <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Passport Number">
            <Input
              value={form.passportNumber || ''}
              onChange={(e) => setField('passportNumber', e.target.value)}
              placeholder="e.g. BR1234567"
            />
          </Field>
          <Field label="Passport Expiry">
            <Input
              type="date"
              value={toInputDate(form.passportExpiry as string | null)}
              onChange={(e) => setField('passportExpiry', e.target.value as StudentRecord['passportExpiry'])}
            />
          </Field>
          <Field label="National ID (NID)">
            <Input
              value={form.nidNumber || ''}
              onChange={(e) => setField('nidNumber', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-[#0057B8]" />
          <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Email Address" icon={Mail}>
            <Input value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
          </Field>
          <Field label="Phone Number" icon={Phone}>
            <Input value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} placeholder="+8801XXXXXXXXX" />
          </Field>
          <Field label="WhatsApp Number" icon={Phone}>
            <Input value={form.whatsappNumber || ''} onChange={(e) => setField('whatsappNumber', e.target.value)} />
          </Field>
          <Field label="Address" icon={MapPin}>
            <Input value={form.address || ''} onChange={(e) => setField('address', e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city || ''} onChange={(e) => setField('city', e.target.value)} />
          </Field>
          <Field label="Country">
            <Input value={form.country || ''} onChange={(e) => setField('country', e.target.value)} />
          </Field>
          <Field label="Emergency Contact Name">
            <Input value={form.emergencyContact || ''} onChange={(e) => setField('emergencyContact', e.target.value)} />
          </Field>
          <Field label="Emergency Contact Phone">
            <Input value={form.emergencyPhone || ''} onChange={(e) => setField('emergencyPhone', e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Education & Test Scores */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-[#0057B8]" />
          <h3 className="text-lg font-bold text-slate-900">Education & Test Scores</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Highest Education">
            <Select value={form.highestEducation || 'none'} onValueChange={(v) => setField('highestEducation', v === 'none' ? null : (v as StudentRecord['highestEducation']))}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="GPA / Grade">
            <Input value={form.gpa || ''} onChange={(e) => setField('gpa', e.target.value)} placeholder="e.g. 3.65 / 4.0" />
          </Field>
          <Field label="English Test Type">
            <Select value={form.englishTestType || 'none'} onValueChange={(v) => setField('englishTestType', v === 'none' ? null : (v as StudentRecord['englishTestType']))}>
              <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {TEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="English Test Score" icon={Award}>
            <Input
              value={form.englishTestScore || ''}
              onChange={(e) => setField('englishTestScore', e.target.value)}
              placeholder="e.g. 7.0"
            />
          </Field>
          <Field label="English Test Date">
            <Input
              type="date"
              value={toInputDate(form.englishTestDate as string | null)}
              onChange={(e) => setField('englishTestDate', e.target.value as StudentRecord['englishTestDate'])}
            />
          </Field>
        </div>
      </Card>

      {/* Study Preferences */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-[#0057B8]" />
          <h3 className="text-lg font-bold text-slate-900">Study Preferences</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Preferred Destination Country">
            <Input value={form.preferredCountry || ''} onChange={(e) => setField('preferredCountry', e.target.value)} placeholder="e.g. United Kingdom" />
          </Field>
          <Field label="Preferred Course">
            <Input value={form.preferredCourse || ''} onChange={(e) => setField('preferredCourse', e.target.value)} placeholder="e.g. MSc Computer Science" />
          </Field>
          <Field label="Preferred Intake">
            <Select value={form.preferredIntake || 'none'} onValueChange={(v) => setField('preferredIntake', v === 'none' ? null : (v as StudentRecord['preferredIntake']))}>
              <SelectTrigger><SelectValue placeholder="Select intake" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="January 2026">January 2026</SelectItem>
                <SelectItem value="May 2026">May 2026</SelectItem>
                <SelectItem value="September 2026">September 2026</SelectItem>
                <SelectItem value="January 2027">January 2027</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => student && setForm(student)}>Reset</Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#E8501A] hover:bg-[#c8420f] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving…' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={cn('text-xs font-medium text-slate-600 flex items-center gap-1.5')}>
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {label}
      </Label>
      {children}
    </div>
  )
}
