'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plane, CheckCircle2, Circle, Clock, FileText, AlertCircle,
  Calendar, ArrowRight, Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface VisaChecklistItem {
  id: string
  itemName: string
  isRequired: boolean
  isCompleted: boolean
  note: string | null
}

interface VisaFile {
  id: string
  stage: string
  casNumber: string | null
  casDate: string | null
  visaAppointmentDate: string | null
  biometricsDate: string | null
  visaDecisionDate: string | null
  visaDecision: string | null
  refusalReason: string | null
  notes: string | null
  status: string
  createdAt: string
  student: { id: string; firstName: string; lastName: string; studentId: string; nationality: string | null }
  visaOfficer: { id: string; firstName: string; lastName: string; employeeId: string } | null
  checklist: VisaChecklistItem[]
}

interface VisaData {
  visaFiles: VisaFile[]
  stageDistribution: Array<{ stage: string; count: number }>
}

interface StudentRecord {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  preferredCountry: string | null
  preferredIntake: string | null
  passportNumber: string | null
}

interface DocumentRecord {
  id: string
  documentName: string
  documentType: string
  status: string
}

const STAGES = [
  { id: 'not_started', label: 'Not Started', order: 0 },
  { id: 'document_collection', label: 'Document Collection', order: 1 },
  { id: 'document_review', label: 'Document Review', order: 2 },
  { id: 'cas_received', label: 'CAS Received', order: 3 },
  { id: 'visa_file_preparing', label: 'Visa File Preparing', order: 4 },
  { id: 'visa_submitted', label: 'Visa Submitted', order: 5 },
  { id: 'biometrics_done', label: 'Biometrics Done', order: 6 },
  { id: 'waiting_decision', label: 'Waiting Decision', order: 7 },
  { id: 'visa_approved', label: 'Visa Approved', order: 8 },
  { id: 'visa_refused', label: 'Visa Refused', order: 8 },
  { id: 'reapply_planning', label: 'Reapply Planning', order: 9 },
  { id: 'closed', label: 'Closed', order: 10 },
]

const REQUIRED_DOC_TYPES = [
  { type: 'passport', label: 'Valid Passport' },
  { type: 'academic', label: 'Academic Certificates' },
  { type: 'english_test', label: 'English Test Result' },
  { type: 'financial', label: 'Financial Documents' },
  { type: 'photo', label: 'Passport-size Photographs' },
  { type: 'sop', label: 'Statement of Purpose' },
]

function getStageOrder(stage: string): number {
  return STAGES.find((s) => s.id === stage)?.order ?? 0
}

function getStageLabel(stage: string): string {
  return STAGES.find((s) => s.id === stage)?.label || stage.replace(/_/g, ' ')
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function VisaPage() {
  const session = getSession()
  const { data, loading } = usePortalData<VisaData>({
    endpoint: '/api/visa',
    params: { studentId: session?.user.referenceId || '', limit: 10 },
  })
  const { data: studentData } = usePortalData<{ students: StudentRecord[] }>({
    endpoint: '/api/students',
    params: { search: session?.user.email || '', limit: 5 },
  })
  const { data: docData } = usePortalData<{ documents: DocumentRecord[] }>({
    endpoint: '/api/documents',
    params: { studentId: session?.user.referenceId || '', limit: 100 },
  })

  const visaFile = data?.visaFiles?.[0] || null
  const documents = docData?.documents || []

  // Derive a checklist: combine visa checklist (if visaFile exists) with document types
  const derivedChecklist = useMemo(() => {
    const docByType = new Map<string, DocumentRecord>()
    documents.forEach((d) => {
      // Prefer approved/uploaded
      const existing = docByType.get(d.documentType)
      if (!existing || d.status === 'approved' || (existing.status !== 'approved' && d.status !== 'rejected')) {
        docByType.set(d.documentType, d)
      }
    })

    const items = REQUIRED_DOC_TYPES.map((req) => {
      const doc = docByType.get(req.type)
      let status: 'ready' | 'pending' | 'rejected' | 'missing' = 'missing'
      if (doc) {
        if (doc.status === 'approved') status = 'ready'
        else if (doc.status === 'rejected' || doc.status === 'expired') status = 'rejected'
        else status = 'pending'
      }
      // Cross-check with visaFile.checklist if it has matching item
      const visaItem = visaFile?.checklist?.find(
        (c) => c.itemName.toLowerCase().includes(req.type) || c.itemName.toLowerCase().includes(req.label.toLowerCase())
      )
      if (visaItem?.isCompleted && status !== 'ready') status = 'ready'
      return {
        id: req.type,
        label: req.label,
        type: req.type,
        status,
        documentId: doc?.id || null,
      }
    })

    // Add extra items from visaFile.checklist that don't match standard types
    if (visaFile?.checklist) {
      const extra = visaFile.checklist.filter(
        (c) => !REQUIRED_DOC_TYPES.some((r) => c.itemName.toLowerCase().includes(r.type) || c.itemName.toLowerCase().includes(r.label.toLowerCase()))
      )
      extra.forEach((c) => {
        items.push({
          id: c.id,
          label: c.itemName,
          type: 'other',
          status: c.isCompleted ? 'ready' : 'pending',
          documentId: null,
        })
      })
    }

    return items
  }, [documents, visaFile])

  const readiness = useMemo(() => {
    if (derivedChecklist.length === 0) return 0
    const ready = derivedChecklist.filter((i) => i.status === 'ready').length
    return Math.round((ready / derivedChecklist.length) * 100)
  }, [derivedChecklist])

  const currentStageOrder = visaFile ? getStageOrder(visaFile.stage) : 0
  const completedStages = STAGES.filter((s) => s.order < currentStageOrder && s.id !== 'visa_refused')

  const student = studentData?.students?.find((s) => s.email === session?.user.email) || studentData?.students?.[0] || null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Readiness"
        description="Track your visa file preparation, document checklist, and application stages."
      />

      {/* Readiness + Stage Stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-500">Overall Visa File Readiness</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{readiness}%</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <Plane className="h-7 w-7 text-[#0057B8]" />
            </div>
          </div>
          <Progress value={readiness} className="h-2.5" />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {derivedChecklist.filter((i) => i.status === 'ready').length} Ready
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              {derivedChecklist.filter((i) => i.status === 'pending').length} Pending
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {derivedChecklist.filter((i) => i.status === 'rejected').length} Rejected
            </Badge>
            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
              <Circle className="h-3 w-3 mr-1" />
              {derivedChecklist.filter((i) => i.status === 'missing').length} Missing
            </Badge>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="h-5 w-5 text-[#E8501A]" />
            <p className="text-sm font-semibold text-slate-900">Current Stage</p>
          </div>
          {loading ? (
            <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />
          ) : visaFile ? (
            <>
              <p className="text-lg font-bold text-slate-900">{getStageLabel(visaFile.stage)}</p>
              <p className="text-xs text-slate-500 mt-1">
                Stage {currentStageOrder + 1} of {STAGES.length - 1}
              </p>
              {visaFile.casNumber && (
                <p className="text-xs text-slate-500 mt-2">
                  CAS: <span className="font-mono font-medium text-slate-700">{visaFile.casNumber}</span>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-slate-900">Not Started</p>
              <p className="text-xs text-slate-500 mt-1">No visa file created yet.</p>
            </>
          )}
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Documents Ready" value={derivedChecklist.filter((i) => i.status === 'ready').length} icon={CheckCircle2} accent="green" hint={`of ${derivedChecklist.length} required`} />
        <StatCard label="Pending Review" value={derivedChecklist.filter((i) => i.status === 'pending').length} icon={Clock} accent="amber" hint="In progress" />
        <StatCard label="Stages Done" value={completedStages.length} icon={Plane} accent="blue" hint={`of ${STAGES.length - 1}`} />
        <StatCard label="Target Country" value={student?.preferredCountry || '—'} icon={Info} accent="purple" hint={student?.preferredIntake || 'Intake TBD'} />
      </div>

      {/* Visa Timeline */}
      <Card className="p-6 border-0 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Visa Application Timeline</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 alo-scrollbar">
            <div className="flex items-start gap-1 min-w-max">
              {STAGES.filter((s) => s.id !== 'visa_refused' && s.id !== 'reapply_planning').map((stage, idx) => {
                const isComplete = stage.order < currentStageOrder
                const isCurrent = stage.id === visaFile?.stage
                const isFuture = stage.order > currentStageOrder
                return (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center" style={{ width: 110 }}>
                      <div className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center transition-colors',
                        isComplete && 'bg-green-500 text-white',
                        isCurrent && 'bg-[#0057B8] text-white ring-4 ring-[#0057B8]/20',
                        isFuture && 'bg-slate-100 text-slate-400'
                      )}>
                        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : isCurrent ? <Clock className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <span className={cn(
                        'text-[10px] text-center mt-2 leading-tight',
                        (isComplete || isCurrent) ? 'text-slate-900 font-semibold' : 'text-slate-400'
                      )}>
                        {stage.label}
                      </span>
                    </div>
                    {idx < STAGES.filter((s) => s.id !== 'visa_refused' && s.id !== 'reapply_planning').length - 1 && (
                      <div className={cn('h-0.5 w-6 mt-4', isComplete ? 'bg-green-500' : 'bg-slate-200')} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {visaFile && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DetailItem icon={FileText} label="CAS Number" value={visaFile.casNumber || '—'} />
            <DetailItem icon={Calendar} label="CAS Date" value={formatDate(visaFile.casDate)} />
            <DetailItem icon={Calendar} label="Visa Appointment" value={formatDate(visaFile.visaAppointmentDate)} />
            <DetailItem icon={Calendar} label="Biometrics" value={formatDate(visaFile.biometricsDate)} />
          </div>
        )}
      </Card>

      {/* Document Checklist */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Required Documents Checklist</h3>
          <Button asChild size="sm" variant="outline">
            <Link href="/student/documents">Upload <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
        <div className="space-y-2">
          {derivedChecklist.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No checklist items yet.</p>
          ) : (
            derivedChecklist.map((item) => {
              const meta = {
                ready: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Ready' },
                pending: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, label: 'Pending' },
                rejected: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, label: 'Rejected' },
                missing: { color: 'text-slate-400', bg: 'bg-slate-50', icon: Circle, label: 'Missing' },
              }[item.status]
              const Icon = meta.icon
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                    <Icon className={cn('h-5 w-5', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400 capitalize">{meta.label}</p>
                  </div>
                  {item.status !== 'ready' && (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/student/documents">Upload</Link>
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Notes */}
      {visaFile?.notes && (
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Visa Officer Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-line">{visaFile.notes}</p>
        </Card>
      )}
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  )
}
