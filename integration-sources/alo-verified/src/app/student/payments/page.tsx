'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, Download, FileText, CheckCircle2, Clock, AlertCircle,
  Wallet, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PaymentRecord {
  id: string
  studentId: string | null
  invoiceId: string | null
  amount: number
  currency: string
  paymentMethod: string | null
  transactionRef: string | null
  receiptUrl: string | null
  status: string
  paidAt: string
  createdAt: string
}

interface InvoiceRecord {
  id: string
  invoiceId: string
  studentId: string | null
  partnerId: string | null
  type: string
  amount: number
  currency: string
  description: string | null
  dueDate: string | null
  paidAmount: number
  status: string
  paidAt: string | null
  createdAt: string
}

interface PaymentsResponse {
  payments: PaymentRecord[]
  invoices: InvoiceRecord[]
  expenses: unknown[]
  summary: {
    totalInvoiced: number
    totalPaid: number
    pendingAmount: number
    overdueCount: number
  }
}

type StatusMeta = { label: string; color: string; Icon: typeof CheckCircle2 }

const STATUS_META: Record<string, StatusMeta> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700', Icon: Clock },
  partial: { label: 'Partial', color: 'bg-blue-50 text-[#0057B8]', Icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-50 text-green-700', Icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700', Icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'bg-red-50 text-red-700', Icon: AlertCircle },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700', Icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'bg-slate-100 text-slate-600', Icon: RefreshCw },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', Icon: AlertCircle },
}

function formatMoney(amount: number, currency = 'GBP'): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`
  }
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const STATUS_FILTERS = ['all', 'pending', 'partial', 'paid', 'overdue'] as const

export default function PaymentsPage() {
  const session = getSession()
  const studentId = session?.user.referenceId || ''
  const { data, loading } = usePortalData<PaymentsResponse>({
    endpoint: '/api/payments',
    params: { studentId, limit: 100 },
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all')

  const invoices = data?.invoices || []
  const payments = data?.payments || []

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${inv.invoiceId} ${inv.description || ''} ${inv.type}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [invoices, search, statusFilter])

  const summary = data?.summary
  const totalPaid = summary?.totalPaid || 0
  const totalInvoiced = summary?.totalInvoiced || 0
  const pendingAmount = summary?.pendingAmount || 0
  const overdueCount = summary?.overdueCount || 0

  const handleDownload = (invoiceId: string, receiptUrl?: string | null) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank', 'noopener,noreferrer')
      return
    }
    // No stored receipt — direct the student to request the PDF from finance via WhatsApp.
    toast.info(`Invoice ${invoiceId} — contact finance via WhatsApp to receive the PDF copy.`)
  }

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <PageHeader
        title="Payments & Invoices"
        description="Your payment history, outstanding invoices, and downloadable receipts."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Total Invoiced</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatMoney(totalInvoiced)}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#0057B8]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Total Paid</p>
                <p className="text-xl font-bold text-green-700 mt-1">{formatMoney(totalPaid)}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{formatMoney(pendingAmount)}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Overdue</p>
                <p className="text-xl font-bold text-red-700 mt-1">{overdueCount}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search invoice no. or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9 bg-slate-50"
            />
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors',
                    statusFilter === s
                      ? 'bg-[#0057B8] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices table */}
      <Card className="border-0 shadow-sm flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0057B8]" /> Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3">
                <Wallet className="h-7 w-7 text-[#0057B8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {invoices.length === 0 ? 'No payments yet' : 'No matching invoices'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {invoices.length === 0
                  ? 'When you submit an application or pay a deposit, your invoices and payment history will appear here.'
                  : 'Try a different search or filter.'}
              </p>
              {invoices.length === 0 && (
                <Button asChild className="mt-4 bg-[#0057B8] hover:bg-[#00449a] text-white">
                  <Link href="/student/course-finder">Find a program</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs">Invoice #</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs text-right">Paid</TableHead>
                    <TableHead className="text-xs">Due Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const meta = STATUS_META[inv.status] || STATUS_META.pending
                    const Icon = meta.Icon
                    return (
                      <TableRow key={inv.id} className="border-slate-50 hover:bg-slate-50/40">
                        <TableCell className="font-mono text-xs font-semibold text-[#0057B8]">{inv.invoiceId}</TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-[200px] truncate">
                          {inv.description || inv.type || 'Invoice'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-slate-900">
                          {formatMoney(inv.amount, inv.currency)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-slate-600">
                          {formatMoney(inv.paidAmount, inv.currency)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>
                          <Badge className={cn('border-0 h-6 gap-1', meta.color)}>
                            <Icon className="h-3 w-3" />
                            <span className="text-[10px] font-semibold">{meta.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-[#0057B8] hover:text-[#00449a]"
                            onClick={() => handleDownload(inv.invoiceId)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent payments */}
      {payments.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#E8501A]" /> Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs">Transaction Ref</TableHead>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((p) => {
                    const meta = STATUS_META[p.status] || STATUS_META.completed
                    const Icon = meta.Icon
                    return (
                      <TableRow key={p.id} className="border-slate-50 hover:bg-slate-50/40">
                        <TableCell className="font-mono text-xs text-slate-700">{p.transactionRef || '—'}</TableCell>
                        <TableCell className="text-xs text-slate-600 capitalize">
                          {p.paymentMethod ? p.paymentMethod.replace(/_/g, ' ') : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-slate-900">
                          {formatMoney(p.amount, p.currency)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(p.paidAt)}</TableCell>
                        <TableCell>
                          <Badge className={cn('border-0 h-6 gap-1', meta.color)}>
                            <Icon className="h-3 w-3" />
                            <span className="text-[10px] font-semibold">{meta.label}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <footer className="mt-auto pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ALO Education — Empowering students worldwide.
      </footer>
    </div>
  )
}
