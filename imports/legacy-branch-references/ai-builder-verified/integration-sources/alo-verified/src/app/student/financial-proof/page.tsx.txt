'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Plane, CheckCircle2, Circle, Clock, AlertCircle, ShieldAlert,
  FileText, Banknote, FileSignature, Stamp, Receipt, Wallet, Landmark,
  ArrowRight, AlertTriangle, ShieldCheck, XCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface FinancialProofReview {
  id: string
  bankStatementStatus: string
  bankSolvencyStatus: string
  sponsorLetterStatus: string
  affidavitStatus: string
  taxDocumentStatus: string
  incomeSourceStatus: string
  depositReceiptStatus: string
  fundsMaturityNote: string | null
  reviewerNote: string | null
  riskFlag: string
  finalFinanceStatus: string
  reviewedAt: string | null
  createdAt: string
}

interface FinancialProofData {
  review: FinancialProofReview | null
}

const ITEM_META: Record<
  string,
  { label: string; description: string; icon: typeof Banknote }
> = {
  bankStatement: { label: 'Bank Statement', description: 'Last 6 months of sponsor bank statements', icon: Banknote },
  bankSolvency: { label: 'Bank Solvency', description: 'Solvency certificate issued by the bank', icon: Landmark },
  sponsorLetter: { label: 'Sponsor Letter', description: 'Sponsorship declaration from your sponsor', icon: FileSignature },
  affidavit: { label: 'Affidavit', description: 'Notarised affidavit of financial support', icon: Stamp },
  taxDocument: { label: 'Tax Document', description: 'Sponsor tax returns / TIN certificate', icon: Receipt },
  incomeSource: { label: 'Income Source Proof', description: 'Salary slips / trade licence / business income', icon: Wallet },
  depositReceipt: { label: 'Tuition Deposit Receipt', description: 'Proof of tuition deposit paid to institution', icon: FileText },
}

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: typeof Circle }
> = {
  missing: { label: 'Missing', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Circle },
  uploaded: { label: 'Uploaded', color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]', border: 'border-[#BED9F5]', icon: FileText },
  under_review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  expired: { label: 'Expired', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
}

const RISK_META: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck; desc: string }> = {
  low: {
    label: 'Low Risk',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: ShieldCheck,
    desc: 'Funds source and maturity look strong. Maintain current documentation.',
  },
  medium: {
    label: 'Medium Risk',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    desc: 'Some documents need verification. Reviewer may request additional proof.',
  },
  high: {
    label: 'High Risk',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: ShieldAlert,
    desc: 'Significant gaps detected. Schedule a finance review with ALO before submitting.',
  },
  unknown: {
    label: 'Not Assessed',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: Circle,
    desc: 'No financial review on file yet.',
  },
}

const FINAL_STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  under_review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

const FIELD_KEYS: Array<{ key: keyof typeof ITEM_META; field: keyof FinancialProofReview }> = [
  { key: 'bankStatement', field: 'bankStatementStatus' },
  { key: 'bankSolvency', field: 'bankSolvencyStatus' },
  { key: 'sponsorLetter', field: 'sponsorLetterStatus' },
  { key: 'affidavit', field: 'affidavitStatus' },
  { key: 'taxDocument', field: 'taxDocumentStatus' },
  { key: 'incomeSource', field: 'incomeSourceStatus' },
  { key: 'depositReceipt', field: 'depositReceiptStatus' },
]

export default function FinancialProofPage() {
  const session = getSession()
  const refId = session?.user.referenceId || ''

  const { data, loading } = usePortalData<FinancialProofData>({
    endpoint: '/api/visa/financial-proof',
    params: { studentId: refId },
    enabled: !!refId,
  })

  const review = data?.review ?? null

  const stats = useMemo(() => {
    if (!review) {
      return { approved: 0, pending: 0, flagged: 0, total: 7, completion: 0 }
    }
    const statuses = FIELD_KEYS.map((f) => review[f.field] as string)
    const approved = statuses.filter((s) => s === 'approved').length
    const flagged = statuses.filter((s) => s === 'rejected' || s === 'expired').length
    const pending = statuses.filter((s) => s === 'missing' || s === 'uploaded' || s === 'under_review').length
    return { approved, pending, flagged, total: 7, completion: Math.round((approved / 7) * 100) }
  }, [review])

  const riskKey = review?.riskFlag || 'unknown'
  const riskMeta = RISK_META[riskKey] || RISK_META.unknown
  const finalMeta = FINAL_STATUS_META[review?.finalFinanceStatus || 'pending'] || FINAL_STATUS_META.pending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Proof Engine"
        description="Track 7 financial proof documents, funds maturity, and overall finance risk for your visa file."
        action={
          <Button asChild className="h-12 bg-[#0057B8] hover:bg-[#004a99]">
            <Link href="/student/documents">
              <FileText className="h-4 w-4 mr-2" /> Upload Documents
            </Link>
          </Button>
        }
      />

      {/* Compliance warning */}
      <Alert className="border-amber-200 bg-amber-50/60">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Country-specific guidance required</AlertTitle>
        <AlertDescription className="text-amber-800/90 text-sm">
          Visa requirements vary by country and can change. Final checklist must be verified by ALO staff against official embassy / immigration guidance before submission. ALO Education does not provide legal guarantee.
        </AlertDescription>
      </Alert>

      {/* Hero summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm lg:col-span-2 h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Finance Completion</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completion}%</p>
              <p className="text-xs text-slate-500 mt-2">{stats.approved} of {stats.total} documents approved</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <Banknote className="h-7 w-7 text-[#0057B8]" />
            </div>
          </div>
          <Progress value={stats.completion} className="h-2.5 mt-4" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {stats.approved} Approved
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-3 w-3 mr-1" /> {stats.pending} Pending
            </Badge>
            {stats.flagged > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" /> {stats.flagged} Flagged
              </Badge>
            )}
          </div>
        </Card>

        {/* Risk flag */}
        <Card className={cn('p-6 border-0 shadow-sm h-full', riskMeta.bg)}>
          <div className="flex items-center gap-2 mb-2">
            <riskMeta.icon className={cn('h-5 w-5', riskMeta.color)} />
            <p className="text-sm font-semibold text-slate-900">Finance Risk Flag</p>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className={cn('text-2xl font-bold', riskMeta.color)}>{riskMeta.label}</p>
              <p className="text-xs text-slate-600 mt-2">{riskMeta.desc}</p>
            </>
          )}
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Approved Docs" value={stats.approved} icon={CheckCircle2} accent="green" hint={`of ${stats.total}`} />
        <StatCard label="Pending Docs" value={stats.pending} icon={Clock} accent="amber" hint="Missing / uploaded / review" />
        <StatCard label="Flagged Docs" value={stats.flagged} icon={AlertTriangle} accent="orange" hint="Rejected / expired" />
        <StatCard
          label="Final Status"
          value={finalMeta.label}
          icon={ShieldCheck}
          accent={review?.finalFinanceStatus === 'approved' ? 'green' : review?.finalFinanceStatus === 'rejected' ? 'orange' : 'amber'}
          hint="Reviewer outcome"
        />
      </div>

      {/* 7 financial proof items */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Financial Proof Documents</h3>
            <p className="text-xs text-slate-500 mt-0.5">7 mandatory financial documents required for visa submission</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIELD_KEYS.map(({ key, field }) => {
              const meta = ITEM_META[key]
              const status = review ? (review[field] as string) : 'missing'
              const statusMeta = STATUS_META[status] || STATUS_META.missing
              const Icon = meta.icon
              const StatusIcon = statusMeta.icon
              return (
                <div
                  key={key}
                  className={cn(
                    'p-4 rounded-lg border flex flex-col h-full transition-colors',
                    statusMeta.bg, statusMeta.border,
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center bg-white/80')}>
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <Badge variant="outline" className={cn('bg-white', statusMeta.color, statusMeta.border)}>
                      <StatusIcon className="h-3 w-3 mr-1" /> {statusMeta.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                  <p className="text-xs text-slate-500 mt-1 flex-1">{meta.description}</p>
                  {status === 'missing' && (
                    <Button asChild size="sm" variant="outline" className="h-9 mt-3 w-full">
                      <Link href="/student/documents">Upload <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  )}
                  {(status === 'rejected' || status === 'expired') && (
                    <Button asChild size="sm" variant="outline" className="h-9 mt-3 w-full">
                      <Link href="/student/documents">Re-upload <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Funds Maturity Note + Reviewer Note + Final Status */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-[#0057B8]" />
            <h3 className="text-sm font-semibold text-slate-900">Funds Maturity Note</h3>
          </div>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : review?.fundsMaturityNote ? (
            <p className="text-sm text-slate-700 whitespace-pre-line">{review.fundsMaturityNote}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No maturity note recorded yet. A reviewer will add this once your bank statement is verified.</p>
          )}
        </Card>

        <Card className="p-6 border-0 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-[#E8501A]" />
            <h3 className="text-sm font-semibold text-slate-900">Reviewer Note</h3>
          </div>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : review?.reviewerNote ? (
            <p className="text-sm text-slate-700 whitespace-pre-line">{review.reviewerNote}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No reviewer note yet. Once a finance officer reviews your documents, feedback will appear here.</p>
          )}
        </Card>

        <Card className="p-6 border-0 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-slate-900">Final Finance Review</h3>
          </div>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <Badge variant="outline" className={cn('text-sm', finalMeta.color, finalMeta.bg, finalMeta.border)}>
                {finalMeta.label}
              </Badge>
              <Separator className="my-3" />
              <p className="text-xs text-slate-500">
                Reviewed at: <span className="font-semibold text-slate-700">{review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString('en-GB') : '—'}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Created: <span className="font-semibold text-slate-700">{review ? new Date(review.createdAt).toLocaleDateString('en-GB') : '—'}</span>
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Empty state CTA */}
      {!loading && !review && (
        <Card className="p-6 border-0 shadow-sm bg-[#F8FAFC]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <Banknote className="h-6 w-6 text-[#0057B8]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">No financial review on file yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload all 7 financial documents. An ALO finance officer will create your financial proof review.</p>
            </div>
            <Button asChild className="h-12 bg-[#0057B8] hover:bg-[#004a99]">
              <Link href="/student/documents">Upload Now <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
