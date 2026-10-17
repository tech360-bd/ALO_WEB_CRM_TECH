'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import {
  Plane, Shield, CheckCircle2, Clock, AlertTriangle,
  FileText, Calendar, FileCheck, ChevronRight, BookOpen, MessageCircle
} from 'lucide-react'

interface VisaData {
  visaStatus: string | null
  casNumber: string | null
  casIssuedAt: string | null
  visaAppliedAt: string | null
  visaApprovedAt: string | null
  visaExpiry: string | null
  ukviReference: string | null
  biometricDate: string | null
  interviewDate: string | null
  documents: Array<{
    id: string
    name: string
    type: string
    status: string
  }>
}

const visaSteps = [
  { key: 'cas_issued', label: 'CAS Issued', description: 'Confirmation of Acceptance for Studies' },
  { key: 'documents_ready', label: 'Documents Ready', description: 'All required documents uploaded & verified' },
  { key: 'visa_applied', label: 'Visa Applied', description: 'Application submitted to UKVI' },
  { key: 'biometric_done', label: 'Biometrics Done', description: 'Biometric appointment completed' },
  { key: 'interview_done', label: 'Interview Done', description: 'UKVI interview completed (if required)' },
  { key: 'visa_approved', label: 'Visa Approved', description: 'Visa granted, ready to travel' },
]

const requiredDocs = [
  { name: 'Valid Passport', type: 'identity', required: true },
  { name: 'CAS Letter', type: 'cas', required: true },
  { name: 'TB Test Certificate', type: 'medical', required: true },
  { name: 'Bank Statements (28 days)', type: 'financial', required: true },
  { name: 'Academic Certificates', type: 'academic', required: true },
  { name: 'English Test Certificate', type: 'english', required: true },
  { name: 'ATAS Certificate', type: 'other', required: false },
  { name: 'Police Clearance', type: 'other', required: false },
]

export default function StudentVisa() {
  const { currentUser } = useAppStore()
  const [visaData, setVisaData] = useState<VisaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    async function fetchVisaData() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId || ''
        const res = await fetch(`/api/visa?studentId=${refId}`)
        if (!res.ok) throw new Error('Failed to load visa data')
        const json = await res.json()
        setVisaData(json)
      } catch {
        // Show default state
        setVisaData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchVisaData()
  }, [currentUser?.referenceId])

  // Calculate current step
  useEffect(() => {
    if (!visaData) { setCurrentStep(0); return }
    if (visaData.visaApprovedAt) { setCurrentStep(6); return }
    if (visaData.interviewDate && new Date(visaData.interviewDate) < new Date()) { setCurrentStep(5); return }
    if (visaData.biometricDate && new Date(visaData.biometricDate) < new Date()) { setCurrentStep(4); return }
    if (visaData.visaAppliedAt) { setCurrentStep(3); return }
    if (visaData.casIssuedAt) { setCurrentStep(1); return }
    setCurrentStep(0)
  }, [visaData])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  const progressPercent = (currentStep / visaSteps.length) * 100

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Visa Status</h1>
          <p className="text-sm text-gray-500 mt-1">Track your UK visa application progress</p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${
          currentStep >= 6 ? 'bg-emerald-50 text-emerald-700' :
          currentStep >= 3 ? 'bg-blue-50 text-blue-700' :
          currentStep >= 1 ? 'bg-yellow-50 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {currentStep >= 6 ? 'Visa Approved' :
           currentStep >= 3 ? 'Visa In Progress' :
           currentStep >= 1 ? 'Preparation' :
           'Not Started'}
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
            <Plane className="h-4 w-4 text-alo-orange" />
            Visa Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </div>
          <div className="space-y-3">
            {visaSteps.map((step, idx) => {
              const isCompleted = idx < currentStep
              const isCurrent = idx === currentStep
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isCurrent ? 'bg-alo-orange text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${isCompleted || isCurrent ? 'text-alo-navy font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-alo-orange/10 text-alo-orange text-xs shrink-0">In Progress</Badge>
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Checklist */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-alo-blue" />
              Document Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {requiredDocs.map((doc) => {
                const uploaded = visaData?.documents?.some(d =>
                  d.type === doc.type && (d.status === 'approved' || d.status === 'verified')
                )
                const pending = visaData?.documents?.some(d =>
                  d.type === doc.type && d.status === 'pending'
                )
                return (
                  <div key={doc.name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      uploaded ? 'bg-green-100 text-green-600' :
                      pending ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {uploaded ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                       pending ? <Clock className="h-3.5 w-3.5" /> :
                       <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <span className={`text-sm flex-1 ${uploaded ? 'text-alo-navy' : 'text-gray-500'}`}>
                      {doc.name}
                    </span>
                    {doc.required && !uploaded && (
                      <Badge className="bg-red-50 text-red-600 text-[10px] shrink-0">Required</Badge>
                    )}
                    {uploaded && (
                      <Badge className="bg-green-50 text-green-600 text-[10px] shrink-0">Ready</Badge>
                    )}
                    {pending && (
                      <Badge className="bg-yellow-50 text-yellow-600 text-[10px] shrink-0">Pending</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* UKVI Interview & Details */}
        <div className="space-y-6">
          {/* Visa File Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                Visa File Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {[
                  { label: 'CAS Number', value: visaData?.casNumber || 'Not issued yet' },
                  { label: 'CAS Issued Date', value: visaData?.casIssuedAt ? new Date(visaData.casIssuedAt).toLocaleDateString() : 'Pending' },
                  { label: 'UKVI Reference', value: visaData?.ukviReference || 'Not available' },
                  { label: 'Visa Applied Date', value: visaData?.visaAppliedAt ? new Date(visaData.visaAppliedAt).toLocaleDateString() : 'Not applied' },
                  { label: 'Visa Decision Date', value: visaData?.visaApprovedAt ? new Date(visaData.visaApprovedAt).toLocaleDateString() : 'Pending' },
                  { label: 'Visa Expiry', value: visaData?.visaExpiry ? new Date(visaData.visaExpiry).toLocaleDateString() : 'N/A' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-sm font-medium text-alo-navy">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* UKVI Interview */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-alo-orange" />
                UKVI Interview
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {visaData?.interviewDate ? (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Interview Scheduled</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Date: {new Date(visaData.interviewDate).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">No Interview Scheduled</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    UKVI may require an interview as part of your visa application. Prepare by reviewing your course details and financial documents.
                  </p>
                </div>
              )}
              <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Interview Tips</p>
                    <ul className="text-xs text-amber-600 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Know your course details and university</li>
                      <li>Understand your financial arrangements</li>
                      <li>Be clear about your post-study plans</li>
                      <li>Bring all original documents</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biometric Appointment */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Biometric Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {visaData?.biometricDate ? (
                <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Scheduled: {new Date(visaData.biometricDate).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">No biometric appointment scheduled yet. This will be arranged after your visa application is submitted.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
