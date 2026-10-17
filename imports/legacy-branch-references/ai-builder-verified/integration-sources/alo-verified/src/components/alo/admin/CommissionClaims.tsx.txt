'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText, Plus, Search, Clock, CheckCircle2, XCircle, DollarSign,
  Upload, Download, Eye, Filter, ChevronRight, AlertTriangle,
  Send, Receipt, Banknote, FileCheck, ArrowRight, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface ClaimRecord {
  id: string
  commissionId: string
  partnerId: string
  claimAmount: number
  invoiceUrl?: string
  note?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  commission?: { commissionId: string; amount: number; status: string; partner?: { companyName: string } }
  partner?: { companyName: string }
}

interface CommissionOption {
  id: string
  commissionId: string
  amount: number
  status: string
  partnerId: string
  partner?: { companyName: string }
}

const CLAIM_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' },
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100' },
}

const TRIGGER_LABELS: Record<string, string> = {
  application_submitted: 'Application Submitted',
  offer_received: 'Offer Received',
  deposit_paid: 'Deposit Paid',
  cas_received: 'CAS Received',
  visa_approved: 'Visa Approved',
  enrollment_confirmed: 'Enrollment Confirmed',
  custom_stage: 'Custom Stage',
}

export default function CommissionClaims() {
  const [claims, setClaims] = useState<ClaimRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [invoiceUploadOpen, setInvoiceUploadOpen] = useState(false)
  const [commissions, setCommissions] = useState<CommissionOption[]>([])
  const [partners, setPartners] = useState<{id: string; companyName: string}[]>([])

  // Submit form
  const [formPartnerId, setFormPartnerId] = useState('')
  const [formCommissionId, setFormCommissionId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formTriggerStage, setFormTriggerStage] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formTaxNote, setFormTaxNote] = useState('')

  // Payment form
  const [payRef, setPayRef] = useState('')
  const [payAmount, setPayAmount] = useState('')

  // Review form
  const [reviewNote, setReviewNote] = useState('')

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/commissions?limit=100')
      if (res.ok) {
        const data = await res.json()
        // Extract claims from commissions
        const allClaims: ClaimRecord[] = []
        const comms = data.commissions || []
        for (const c of comms) {
          if (c.claims && c.claims.length > 0) {
            for (const claim of c.claims) {
              allClaims.push({
                ...claim,
                commission: {
                  commissionId: c.commissionId,
                  amount: c.amount,
                  status: c.status,
                  partner: c.partner,
                },
                partner: c.partner,
              })
            }
          }
        }
        setClaims(allClaims)
        setCommissions(comms.map((c: CommissionOption) => ({
          id: c.id, commissionId: c.commissionId, amount: c.amount,
          status: c.status, partnerId: c.partnerId, partner: c.partner,
        })))
      }
    } catch { toast.error('Failed to fetch claims') }
    finally { setLoading(false) }
  }, [])

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/partners?limit=100')
      if (res.ok) {
        const data = await res.json()
        setPartners((data.partners || []).map((p: {id: string; companyName: string}) => ({ id: p.id, companyName: p.companyName })))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchClaims() }, [fetchClaims])
  useEffect(() => { fetchPartners() }, [fetchPartners])

  const handleSubmitClaim = async () => {
    if (!formPartnerId || !formAmount) {
      toast.error('Please fill in partner and amount')
      return
    }
    try {
      // Create a claim via commission update (add note about claim)
      if (formCommissionId) {
        await fetch('/api/commissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: formCommissionId,
            status: 'requested',
            note: `Claim submitted: £${parseFloat(formAmount).toLocaleString()}. ${formNote}. Tax/VAT: ${formTaxNote || 'N/A'}`,
          }),
        })
      }
      toast.success('Commission claim submitted successfully')
      setSubmitOpen(false)
      resetForm()
      fetchClaims()
    } catch {
      toast.error('Failed to submit claim')
    }
  }

  const handleReviewClaim = async (action: 'approve' | 'reject') => {
    if (!selectedClaim) return
    try {
      if (selectedClaim.commission) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        await fetch('/api/commissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedClaim.commissionId,
            status: newStatus,
            reviewedBy: 'admin',
            note: reviewNote || `Claim ${action}`,
          }),
        })
      }
      toast.success(`Claim ${action}d successfully`)
      setReviewOpen(false)
      setReviewNote('')
      setSelectedClaim(null)
      fetchClaims()
    } catch {
      toast.error(`Failed to ${action} claim`)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedClaim) return
    try {
      if (selectedClaim.commission) {
        await fetch('/api/commissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedClaim.commissionId,
            status: 'paid',
            reviewedBy: 'admin',
            note: `Payment processed: £${payAmount || selectedClaim.claimAmount}. Ref: ${payRef}`,
          }),
        })
      }
      toast.success('Payment processed successfully')
      setPaymentOpen(false)
      setPayRef('')
      setPayAmount('')
      setSelectedClaim(null)
      fetchClaims()
    } catch {
      toast.error('Failed to process payment')
    }
  }

  const resetForm = () => {
    setFormPartnerId('')
    setFormCommissionId('')
    setFormAmount('')
    setFormTriggerStage('')
    setFormNote('')
    setFormTaxNote('')
  }

  const getClaimBadge = (status: string) => {
    const cfg = CLAIM_STATUS_CONFIG[status]
    if (!cfg) return <Badge>{status}</Badge>
    return <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
  }

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        c.id.toLowerCase().includes(s) ||
        c.commission?.commissionId?.toLowerCase().includes(s) ||
        c.partner?.companyName?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const pendingCount = claims.filter(c => c.status === 'pending').length
  const approvedCount = claims.filter(c => c.status === 'approved').length
  const paidCount = claims.filter(c => c.status === 'paid').length
  const rejectedCount = claims.filter(c => c.status === 'rejected').length
  const totalClaimAmount = claims.reduce((s, c) => s + c.claimAmount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-gray-100 rounded animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Commission Claims</h1>
          <p className="text-sm text-gray-500 mt-1">Submit, review and process commission claims</p>
        </div>
        <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => setSubmitOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Submit Claim
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#F37021]" />
            </div>
            <div>
              <p className="text-lg font-bold">{claims.length}</p>
              <p className="text-xs text-gray-500">Total Claims</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{approvedCount}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-lg font-bold">{paidCount}</p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{totalClaimAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Amount</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search claims..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(CLAIM_STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all') }}>
              <Filter className="h-4 w-4 mr-2" /> Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      {selectedClaim ? (
        <ClaimDetail
          claim={selectedClaim}
          onBack={() => setSelectedClaim(null)}
          onReview={() => setReviewOpen(true)}
          onProcessPayment={() => setPaymentOpen(true)}
          onUploadInvoice={() => setInvoiceUploadOpen(true)}
          getClaimBadge={getClaimBadge}
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commission ID</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Claim Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No claims found. Submit a new claim to get started.
                      </TableCell>
                    </TableRow>
                  ) : filteredClaims.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedClaim(c)}>
                      <TableCell className="font-mono text-xs">{c.commission?.commissionId || '-'}</TableCell>
                      <TableCell className="font-medium">{c.partner?.companyName || '-'}</TableCell>
                      <TableCell className="font-semibold">£{c.claimAmount.toLocaleString()}</TableCell>
                      <TableCell>{getClaimBadge(c.status)}</TableCell>
                      <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedClaim(c) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {c.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" className="text-green-600" onClick={(e) => {
                                e.stopPropagation()
                                setSelectedClaim(c)
                                setReviewOpen(true)
                              }}><CheckCircle2 className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={(e) => {
                                e.stopPropagation()
                                setSelectedClaim(c)
                                setReviewOpen(true)
                              }}><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                          {c.status === 'approved' && (
                            <Button size="sm" variant="ghost" className="text-purple-600" onClick={(e) => {
                              e.stopPropagation()
                              setSelectedClaim(c)
                              setPaymentOpen(true)
                            }}><DollarSign className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Submit Claim Dialog ===== */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Submit Commission Claim</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partner *</Label>
              <Select value={formPartnerId} onValueChange={v => { setFormPartnerId(v); setFormCommissionId('') }}>
                <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Commission</Label>
              <Select value={formCommissionId} onValueChange={v => {
                setFormCommissionId(v)
                const comm = commissions.find(c => c.id === v)
                if (comm) setFormAmount(comm.amount.toString())
              }}>
                <SelectTrigger><SelectValue placeholder="Select commission" /></SelectTrigger>
                <SelectContent>
                  {commissions.filter(c => !formPartnerId || c.partnerId === formPartnerId).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.commissionId} - £{c.amount.toLocaleString()} ({c.partner?.companyName || 'Unknown'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Claim Amount (£) *</Label>
              <Input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Trigger Stage</Label>
              <Select value={formTriggerStage} onValueChange={setFormTriggerStage}>
                <SelectTrigger><SelectValue placeholder="Select trigger stage" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Commission Invoice</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <Input type="file" className="max-w-xs mx-auto" accept=".pdf,.jpg,.png" onChange={() => toast.info('Invoice file selected')} />
              </div>
            </div>
            <div>
              <Label>Tax / VAT Notes</Label>
              <Input value={formTaxNote} onChange={e => setFormTaxNote(e.target.value)} placeholder="e.g., VAT inclusive 20%" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="Additional notes..." rows={3} />
            </div>
            <Button onClick={handleSubmitClaim} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">
              Submit Claim
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Review Claim Dialog ===== */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Claim</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedClaim && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Commission:</strong> {selectedClaim.commission?.commissionId}</p>
                <p className="text-sm"><strong>Amount:</strong> £{selectedClaim.claimAmount.toLocaleString()}</p>
                <p className="text-sm"><strong>Partner:</strong> {selectedClaim.partner?.companyName}</p>
              </div>
            )}
            <div>
              <Label>Review Note</Label>
              <Textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add review comments..." rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReviewClaim('reject')}>
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReviewClaim('approve')}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Payment Processing Dialog ===== */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedClaim && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Claim Amount:</strong> £{selectedClaim.claimAmount.toLocaleString()}</p>
                <p className="text-sm"><strong>Partner:</strong> {selectedClaim.partner?.companyName}</p>
              </div>
            )}
            <div>
              <Label>Payment Amount (£)</Label>
              <Input type="number" value={payAmount || selectedClaim?.claimAmount.toString() || ''} onChange={e => setPayAmount(e.target.value)} />
            </div>
            <div>
              <Label>Transaction Reference</Label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g., TXN-202600123" />
            </div>
            <div>
              <Label>Payment Proof</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <Input type="file" className="max-w-xs mx-auto" accept=".pdf,.jpg,.png" onChange={() => toast.info('Payment proof selected')} />
              </div>
            </div>
            <div>
              <Label>Tax/VAT Notes</Label>
              <Input placeholder="e.g., Before VAT, After VAT, Tax deduction applied" />
            </div>
            <Button onClick={handleProcessPayment} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <DollarSign className="h-4 w-4 mr-2" /> Process Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Invoice Upload Dialog ===== */}
      <Dialog open={invoiceUploadOpen} onOpenChange={setInvoiceUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Commission Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload invoice document</p>
              <Input type="file" className="mt-2 max-w-xs mx-auto" accept=".pdf,.jpg,.png" onChange={() => toast.info('Invoice file selected')} />
            </div>
            <Button onClick={() => { toast.success('Invoice uploaded'); setInvoiceUploadOpen(false) }} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">
              Upload Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Claim Detail Sub-Component ---
function ClaimDetail({ claim, onBack, onReview, onProcessPayment, onUploadInvoice, getClaimBadge }: {
  claim: ClaimRecord
  onBack: () => void
  onReview: () => void
  onProcessPayment: () => void
  onUploadInvoice: () => void
  getClaimBadge: (status: string) => React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronRight className="h-4 w-4 rotate-180" /> Back</Button>
        <span className="font-mono text-sm text-gray-500">Claim Detail</span>
        {getClaimBadge(claim.status)}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Claim Amount</p><p className="text-xl font-bold">£{claim.claimAmount.toLocaleString()}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Commission</p><p className="text-sm font-bold">{claim.commission?.commissionId || '-'}</p><p className="text-xs text-gray-400">£{(claim.commission?.amount || 0).toLocaleString()}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Partner</p><p className="text-sm font-bold">{claim.partner?.companyName || '-'}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Status</p><div className="mt-1">{getClaimBadge(claim.status)}</div></CardContent></Card>
      </div>

      {/* Claim History Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Claim History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Claim Submitted', date: claim.createdAt, done: true },
              { label: 'Under Review', date: null, done: claim.status !== 'pending' },
              { label: 'Approved', date: claim.reviewedAt, done: ['approved', 'paid'].includes(claim.status) },
              { label: 'Payment Processed', date: null, done: claim.status === 'paid' },
            ].filter(e => e.done).map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${e.label.includes('Approved') ? 'bg-green-500' : e.label.includes('Payment') ? 'bg-purple-500' : 'bg-[#F37021]'}`} />
                <div>
                  <p className="text-sm font-medium">{e.label}</p>
                  <p className="text-xs text-gray-500">{e.date ? new Date(e.date).toLocaleString() : 'Completed'}</p>
                </div>
              </div>
            ))}
            {claim.reviewedBy && (
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Reviewed by {claim.reviewedBy}</p>
                  <p className="text-xs text-gray-500">{claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleString() : ''}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {claim.note && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">{claim.note}</p></CardContent>
        </Card>
      )}

      {/* Invoice */}
      {claim.invoiceUrl && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Commission Invoice</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-[#0066CC]" />
              <a href={claim.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0066CC] hover:underline">View Invoice</a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {claim.status === 'pending' && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={onReview}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Review
              </Button>
            )}
            {claim.status === 'approved' && (
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={onProcessPayment}>
                <DollarSign className="h-4 w-4 mr-1" /> Process Payment
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onUploadInvoice}>
              <Upload className="h-4 w-4 mr-1" /> Upload Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
