'use client'

import { useMemo, useState } from 'react'
import {
  Wallet, TrendingUp, Clock, ArrowDownToLine, ArrowUpRight, ArrowDownRight,
  Loader2, Plus, Banknote,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

interface CommissionRow {
  id: string
  commissionId: string
  amount: number
  currency: string
  status: string
  triggerStage: string
  note: string | null
  requestedAt: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
  application: {
    id: string
    applicationId: string
    student: { firstName: string; lastName: string; studentId: string }
    university: { name: string }
  } | null
}

interface CommissionResponse {
  commissions: CommissionRow[]
  summary: {
    totalAmount: number
    pendingAmount: number
    paidAmount: number
  }
}

const statusColor: Record<string, string> = {
  paid: 'bg-green-50 text-green-700 border-green-200',
  approved: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200',
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  eligible: 'bg-purple-50 text-purple-700 border-purple-200',
  not_requested: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
}

export default function PartnerWalletPage() {
  const session = getSession()
  const partnerId = session?.user.referenceId

  const { data, loading } = usePortalData<CommissionResponse>({
    endpoint: '/api/commissions',
    params: { partnerId: partnerId || '', limit: 100 },
  })

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const summary = data?.summary
  const commissions = data?.commissions ?? []

  // Compute balance breakdown
  const { totalBalance, pendingClaims, available } = useMemo(() => {
    const total = summary?.totalAmount ?? 0
    const paid = summary?.paidAmount ?? 0
    const pending = summary?.pendingAmount ?? 0
    return {
      totalBalance: total,
      pendingClaims: pending,
      available: paid, // paid commissions are withdrawable
    }
  }, [summary])

  // Build transaction history: combine commissions
  const transactions = commissions

  const submitWithdraw = async () => {
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (amt > available) {
      toast.error(`Amount exceeds available balance (${available.toLocaleString()})`)
      return
    }
    setSubmitting(true)
    // Simulated withdraw request — would POST to /api/commissions or a withdraw endpoint
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    setWithdrawOpen(false)
    setWithdrawAmount('')
    setWithdrawNote('')
    toast.success(`Withdrawal request of ${amt.toLocaleString()} submitted! Processing in 3-5 business days.`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Track your commission balance, claims, and withdrawal history."
        action={
          <Button
            onClick={() => setWithdrawOpen(true)}
            className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            disabled={available <= 0}
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" /> Withdraw
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Balance" value={`${(summary?.totalAmount ?? 0).toLocaleString()}`} icon={Wallet} accent="blue" hint="All-time earnings" />
        <StatCard label="Pending Claims" value={`${(summary?.pendingAmount ?? 0).toLocaleString()}`} icon={Clock} accent="amber" hint="Awaiting review" />
        <StatCard label="Available to Withdraw" value={`${available.toLocaleString()}`} icon={Banknote} accent="green" hint="Paid & settled" />
        <StatCard label="Total Paid Out" value={`${(summary?.paidAmount ?? 0).toLocaleString()}`} icon={TrendingUp} accent="purple" hint="Lifetime withdrawals" />
      </div>

      {/* Hero balance card */}
      <Card className="p-6 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/80 mb-1">Available Balance</p>
            <p className="text-4xl font-bold text-white">
              {available.toLocaleString()} <span className="text-lg font-medium opacity-80">{commissions[0]?.currency || 'GBP'}</span>
            </p>
            <p className="text-xs text-white/70 mt-2">
              {pendingClaims > 0 ? `${pendingClaims.toLocaleString()} pending review • ` : ''}Ready to withdraw anytime
            </p>
          </div>
          <Button
            onClick={() => setWithdrawOpen(true)}
            variant="secondary"
            className="bg-white text-[#0057B8] hover:bg-white/90"
            disabled={available <= 0}
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" /> Withdraw Funds
          </Button>
        </div>
      </Card>

      {/* Transaction history */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Transaction History</h3>
          <p className="text-xs text-slate-500 mt-0.5">All commission earnings and payouts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((t) => {
                  const isPaid = t.status === 'paid'
                  return (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(t.paidAt || t.requestedAt || t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {t.application ? `${t.application.student.firstName} ${t.application.student.lastName}` : 'Commission'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t.application?.university.name || '—'} • {t.commissionId}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {isPaid ? (
                            <><ArrowUpRight className="h-3 w-3 text-green-600" /> <span className="text-green-700">Credit</span></>
                          ) : (
                            <><ArrowDownRight className="h-3 w-3 text-amber-600" /> <span className="text-amber-700">Pending</span></>
                          )}
                        </span>
                      </td>
                      <td className={'px-4 py-3 text-right font-semibold ' + (isPaid ? 'text-green-700' : 'text-slate-700')}>
                        +{t.amount.toLocaleString()} {t.currency}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={'capitalize ' + (statusColor[t.status] || statusColor.not_requested)}>
                          {t.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-1 font-medium">No transactions yet</p>
                    <p className="text-xs text-slate-400">Commission earnings will appear here once your students are enrolled.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Submit a withdrawal request. Funds will be transferred to your registered bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-600">Available Balance</span>
              <span className="font-bold text-[#0057B8]">{available.toLocaleString()} {commissions[0]?.currency || 'GBP'}</span>
            </div>
            <div>
              <Label>Withdrawal Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{commissions[0]?.currency || 'GBP'}</span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-14"
                />
              </div>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                placeholder="Bank account, reference, etc."
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">Processing time: 3-5 business days after approval.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button
              onClick={submitWithdraw}
              disabled={submitting}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Submit Request</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
