'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  User, GraduationCap, Globe, Phone, Upload, FileText,
  ChevronRight, ChevronLeft, CheckCircle2, Send, AlertCircle
} from 'lucide-react'

const steps = [
  { label: 'Personal', icon: <User className="h-4 w-4" /> },
  { label: 'Academic', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'English Test', icon: <Globe className="h-4 w-4" /> },
  { label: 'Preferences', icon: <Globe className="h-4 w-4" /> },
  { label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { label: 'Review', icon: <CheckCircle2 className="h-4 w-4" /> },
]

export default function PartnerSubmitStudent() {
  const { currentUser } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    // Personal
    firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '',
    dateOfBirth: '', gender: '', nationality: '',
    // Academic
    highestEducation: '', gpa: '', institution: '',
    // English
    englishTestType: '', englishTestScore: '', englishTestDate: '',
    // Preferences
    preferredCountry: '', preferredCourse: '', preferredIntake: '',
    // Documents & Notes
    documents: [] as File[],
    notes: '',
  })

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const body = {
        ...form,
        partnerId: currentUser?.referenceId || '',
        source: 'PARTNER',
        communicationMode: 'PARTNER',
        createUserAccount: true,
      }
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit student')
      }
      toast.success('Student submitted successfully!')
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit student')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[500px] animate-fade-in">
        <Card className="border-0 shadow-sm max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-alo-navy mb-2">Student Submitted!</h2>
            <p className="text-sm text-gray-500 mb-6">
              The student has been successfully registered. They will receive an email to set up their account.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setSubmitted(false); setCurrentStep(0); setForm({ firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '', dateOfBirth: '', gender: '', nationality: '', highestEducation: '', gpa: '', institution: '', englishTestType: '', englishTestScore: '', englishTestDate: '', preferredCountry: '', preferredCourse: '', preferredIntake: '', documents: [], notes: '' }) }}
                className="bg-alo-orange hover:bg-alo-orange/90 text-white">
                Submit Another
              </Button>
              <Button variant="outline" onClick={() => {
                const store = useAppStore.getState()
                store.setCurrentView('partner-students')
              }}>
                View Students
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercent = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-alo-navy">Submit New Student</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the student details to register them</p>
      </div>

      {/* Progress Steps */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <div className="flex gap-1">
            {steps.map((step, idx) => (
              <button
                key={step.label}
                onClick={() => setCurrentStep(idx)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-medium transition-colors ${
                  idx === currentStep
                    ? 'bg-alo-orange text-white'
                    : idx < currentStep
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-400'
                }`}
              >
                {idx < currentStep ? <CheckCircle2 className="h-3 w-3" /> : step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {/* Personal Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-alo-navy flex items-center gap-2">
                <User className="h-5 w-5 text-alo-orange" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">First Name *</Label>
                  <Input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)}
                    className="mt-1" placeholder="First name" required />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Last Name *</Label>
                  <Input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)}
                    className="mt-1" placeholder="Last name" required />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
                    className="mt-1" placeholder="student@email.com" required />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone *</Label>
                  <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                    className="mt-1" placeholder="+880" required />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">WhatsApp Number</Label>
                  <Input value={form.whatsappNumber} onChange={(e) => updateField('whatsappNumber', e.target.value)}
                    className="mt-1" placeholder="+880" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date of Birth *</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="mt-1" required />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => updateField('gender', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Nationality *</Label>
                  <Input value={form.nationality} onChange={(e) => updateField('nationality', e.target.value)}
                    className="mt-1" placeholder="e.g. Bangladeshi" required />
                </div>
              </div>
            </div>
          )}

          {/* Academic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-alo-navy flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-alo-blue" /> Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Highest Education *</Label>
                  <Select value={form.highestEducation} onValueChange={(v) => updateField('highestEducation', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ssc">SSC / O-Level</SelectItem>
                      <SelectItem value="hsc">HSC / A-Level</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                      <SelectItem value="master">Master&apos;s Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">GPA / Grade</Label>
                  <Input value={form.gpa} onChange={(e) => updateField('gpa', e.target.value)}
                    className="mt-1" placeholder="e.g. 3.5 / 4.0" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">Institution Name</Label>
                  <Input value={form.institution} onChange={(e) => updateField('institution', e.target.value)}
                    className="mt-1" placeholder="University/College name" />
                </div>
              </div>
            </div>
          )}

          {/* English Test */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-alo-navy flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" /> English Test Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Test Type</Label>
                  <Select value={form.englishTestType} onValueChange={(v) => updateField('englishTestType', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IELTS">IELTS</SelectItem>
                      <SelectItem value="TOEFL">TOEFL</SelectItem>
                      <SelectItem value="PTE">PTE Academic</SelectItem>
                      <SelectItem value="Duolingo">Duolingo English Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Overall Score</Label>
                  <Input value={form.englishTestScore} onChange={(e) => updateField('englishTestScore', e.target.value)}
                    className="mt-1" placeholder="e.g. 7.0" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Test Date</Label>
                  <Input type="date" value={form.englishTestDate} onChange={(e) => updateField('englishTestDate', e.target.value)}
                    className="mt-1" />
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">English test information is optional at this stage but may be required later for university applications.</p>
              </div>
            </div>
          )}

          {/* Preferences */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-alo-navy flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" /> Study Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Preferred Country *</Label>
                  <Select value={form.preferredCountry} onValueChange={(v) => updateField('preferredCountry', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Malaysia">Malaysia</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Course</Label>
                  <Input value={form.preferredCourse} onChange={(e) => updateField('preferredCourse', e.target.value)}
                    className="mt-1" placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Intake</Label>
                  <Select value={form.preferredIntake} onValueChange={(v) => updateField('preferredIntake', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select intake" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sep-2025">September 2025</SelectItem>
                      <SelectItem value="Jan-2026">January 2026</SelectItem>
                      <SelectItem value="Sep-2026">September 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-alo-navy flex items-center gap-2">
                <FileText className="h-5 w-5 text-alo-orange" /> Document Upload
              </h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-alo-orange/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600">Click to upload documents</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB each</p>
                <p className="text-xs text-gray-400 mt-1">Passport, Academic Certificates, English Test, Financial Documents</p>
                <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </div>
              {form.documents.length > 0 && (
                <div className="space-y-2">
                  {Array.from(form.documents).map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                      <Badge variant="outline" className="text-xs">{(file.size / 1024).toFixed(0)}KB</Badge>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Additional Notes</Label>
                <Textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)}
                  className="mt-1 min-h-[100px]" placeholder="Any additional information about this student..." />
              </div>
            </div>
          )}

          {/* Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-alo-navy flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> Review & Submit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-alo-navy flex items-center gap-2">
                    <User className="h-4 w-4 text-alo-orange" /> Personal
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> {form.firstName} {form.lastName}</p>
                    <p><span className="text-gray-500">Email:</span> {form.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {form.phone}</p>
                    <p><span className="text-gray-500">WhatsApp:</span> {form.whatsappNumber || 'N/A'}</p>
                    <p><span className="text-gray-500">DOB:</span> {form.dateOfBirth || 'N/A'}</p>
                    <p><span className="text-gray-500">Gender:</span> {form.gender || 'N/A'}</p>
                    <p><span className="text-gray-500">Nationality:</span> {form.nationality || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-alo-navy flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-alo-blue" /> Academic & Test
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="text-gray-500">Education:</span> {form.highestEducation || 'N/A'}</p>
                    <p><span className="text-gray-500">GPA:</span> {form.gpa || 'N/A'}</p>
                    <p><span className="text-gray-500">Institution:</span> {form.institution || 'N/A'}</p>
                    <p><span className="text-gray-500">English Test:</span> {form.englishTestType || 'N/A'}</p>
                    <p><span className="text-gray-500">Score:</span> {form.englishTestScore || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-alo-navy flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-600" /> Preferences
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="text-gray-500">Country:</span> {form.preferredCountry || 'N/A'}</p>
                    <p><span className="text-gray-500">Course:</span> {form.preferredCourse || 'N/A'}</p>
                    <p><span className="text-gray-500">Intake:</span> {form.preferredIntake || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-alo-navy flex items-center gap-2">
                    <FileText className="h-4 w-4 text-alo-orange" /> Documents
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="text-gray-500">{form.documents.length} file(s) attached</p>
                    {form.notes && <p className="mt-2"><span className="text-gray-500">Notes:</span> {form.notes}</p>}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">Please review all information before submitting. The student will receive an email to activate their account.</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                className="bg-alo-orange hover:bg-alo-orange/90 text-white"
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Student'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
