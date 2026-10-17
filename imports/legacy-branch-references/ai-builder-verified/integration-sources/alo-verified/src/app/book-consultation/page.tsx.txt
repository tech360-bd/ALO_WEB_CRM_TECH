'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRight, CheckCircle2, AlertCircle, Loader2, Phone, Mail, MapPin,
} from 'lucide-react'

interface FormState {
  firstName: string
  phone: string
  email: string
  destination: string
  level: string
  subject: string
  intake: string
  budget: string
  englishTest: string
  englishScore: string
  message: string
}

const DESTINATIONS = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Ireland',
  'Germany',
  'Malaysia',
  'Other',
]

const LEVELS = ['Foundation', 'Undergraduate', 'Postgraduate', 'PhD', 'Diploma']

const INTAKES = ['Spring 2026', 'Summer 2026', 'Fall 2026', 'Winter 2027', 'Spring 2027', 'Undecided']

const ENGLISH_TESTS = [
  'Not taken yet',
  'IELTS Academic',
  'IELTS UKVI',
  'PTE Academic',
  'TOEFL iBT',
  'Duolingo English Test',
  'OIETC / ELLT',
  'Oxford ELLT',
  'LanguageCert',
  'OET',
  'GRE',
  'GMAT',
  'SAT',
  'ACT',
  'MOI (Medium of Instruction)',
]

const INITIAL: FormState = {
  firstName: '',
  phone: '',
  email: '',
  destination: '',
  level: '',
  subject: '',
  intake: '',
  budget: '',
  englishTest: '',
  englishScore: '',
  message: '',
}

export default function BookConsultationPage() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dedupeMessage, setDedupeMessage] = useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return

    // Basic validation
    if (!form.firstName.trim()) {
      setErrorMessage('Please enter your full name.')
      setStatus('error')
      return
    }
    if (!form.phone.trim()) {
      setErrorMessage('Please enter your phone number.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage(null)
    setDedupeMessage(null)

    try {
      // Match API field names (see src/app/api/public/consultation/route.ts)
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        preferredCountry: form.destination || undefined,
        preferredCourse: form.subject || undefined,
        preferredIntake: form.intake || undefined,
        englishTestType: form.englishTest || undefined,
        englishTestScore: form.englishScore || undefined,
        highestEducation: form.level || undefined,
        notes: form.message || `Consultation request — Destination: ${form.destination || 'TBD'}, Level: ${form.level || 'TBD'}, Budget: ${form.budget || 'TBD'}`,
        source: 'website',
      }

      const res = await fetch('/api/public/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.error || `Request failed with status ${res.status}`)
      }

      if (json.deduplicated) {
        setDedupeMessage(
          json.message ||
            'You already have a consultation request on file. We will contact you soon.'
        )
      }

      setStatus('success')
    } catch (e) {
      setStatus('error')
      setErrorMessage(e instanceof Error ? e.message : 'Unknown error. Please try again.')
    }
  }

  const resetForm = () => {
    setForm(INITIAL)
    setStatus('idle')
    setErrorMessage(null)
    setDedupeMessage(null)
  }

  return (
    <PublicSiteLayout>
      {/* Hero */}
      <section
        className="text-white py-14 lg:py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Badge
            className="mb-4 border"
            style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
          >
            Book a Free Consultation
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Start Your <span style={{ color: '#FFB347' }}>Study-Abroad Journey</span> Today
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            Book a free consultation with an ALO Education counselor. We&apos;ll review your
            profile, recommend destinations and courses, and outline next steps — at no cost to
            you.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          {status === 'success' ? (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-8 text-white text-center"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h2 className="text-2xl font-bold mt-4">Consultation Request Received!</h2>
                  <p className="text-emerald-50 mt-2 max-w-md mx-auto">
                    Thank you. A counselor will contact you within 1 working day to schedule your
                    free session.
                  </p>
                </div>
                {dedupeMessage && (
                  <div className="p-5 bg-amber-50 border-b border-amber-100 text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>{dedupeMessage}</div>
                  </div>
                )}
                <div className="p-6 bg-white flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={resetForm} variant="outline" className="h-12">
                    Submit another request
                  </Button>
                  <Link href="/">
                    <Button className="h-12 text-white font-semibold" style={{ background: '#0057B8' }}>
                      Back to Home <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-gray-100 shadow-md">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#1A2332] mb-2">Tell us about yourself</h2>
                <p className="text-sm text-[#555555] mb-6">
                  Fields marked with <span style={{ color: '#E8501A' }}>*</span> are required. The
                  more you share, the better we can prepare for your session.
                </p>

                {status === 'error' && errorMessage && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Personal info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="mb-1.5">
                        Full Name <span style={{ color: '#E8501A' }}>*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="e.g. Tanvir Ahmed"
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="mb-1.5">
                        Phone (WhatsApp) <span style={{ color: '#E8501A' }}>*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. +880 17xx-xxxxxx"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-1.5">
                        Email (optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget" className="mb-1.5">
                        Approximate Budget (per year, in BDT)
                      </Label>
                      <Input
                        id="budget"
                        placeholder="e.g. 25–35 lakhs"
                        value={form.budget}
                        onChange={(e) => update('budget', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Study preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="destination" className="mb-1.5">Preferred Destination</Label>
                      <Select value={form.destination} onValueChange={(v) => update('destination', v)}>
                        <SelectTrigger id="destination" className="h-12 w-full">
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATIONS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="level" className="mb-1.5">Preferred Level</Label>
                      <Select value={form.level} onValueChange={(v) => update('level', v)}>
                        <SelectTrigger id="level" className="h-12 w-full">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject" className="mb-1.5">Subject / Course of Interest</Label>
                      <Input
                        id="subject"
                        placeholder="e.g. MSc Data Science"
                        value={form.subject}
                        onChange={(e) => update('subject', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="intake" className="mb-1.5">Preferred Intake</Label>
                      <Select value={form.intake} onValueChange={(v) => update('intake', v)}>
                        <SelectTrigger id="intake" className="h-12 w-full">
                          <SelectValue placeholder="Select intake" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTAKES.map((i) => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="englishTest" className="mb-1.5">English Test Status</Label>
                      <Select value={form.englishTest} onValueChange={(v) => update('englishTest', v)}>
                        <SelectTrigger id="englishTest" className="h-12 w-full">
                          <SelectValue placeholder="Select test" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENGLISH_TESTS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="englishScore" className="mb-1.5">English Test Score (if taken)</Label>
                      <Input
                        id="englishScore"
                        placeholder="e.g. IELTS 6.5 / Duolingo 115"
                        value={form.englishScore}
                        onChange={(e) => update('englishScore', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message" className="mb-1.5">Anything else we should know?</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your academic background, career goals, or any specific questions you have."
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full sm:w-auto h-12 px-8 text-white font-semibold"
                      style={{ background: '#E8501A' }}
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Book My Free Consultation <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-[#555555] flex-1">
                      By submitting, you agree to be contacted by ALO Education about your
                      consultation request. We never share your data with third parties.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Contact block */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5 text-center">
                <Phone className="h-6 w-6 mx-auto mb-2" style={{ color: '#0057B8' }} />
                <div className="text-xs text-[#888] uppercase tracking-wider">Call us</div>
                <div className="font-semibold text-[#1A2332] text-sm mt-1">+880 1700-000000</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2" style={{ color: '#0057B8' }} />
                <div className="text-xs text-[#888] uppercase tracking-wider">Email us</div>
                <div className="font-semibold text-[#1A2332] text-sm mt-1">info@aloeducation.com</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5 text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2" style={{ color: '#0057B8' }} />
                <div className="text-xs text-[#888] uppercase tracking-wider">Visit us</div>
                <div className="font-semibold text-[#1A2332] text-sm mt-1">Banani, Dhaka</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
