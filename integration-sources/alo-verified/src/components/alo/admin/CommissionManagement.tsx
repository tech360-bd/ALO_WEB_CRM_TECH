'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Wallet, DollarSign, CheckCircle2, AlertTriangle, Search,
  Download, Eye, Clock, Calendar, FileText, MessageSquare,
  TrendingUp, Users, ChevronRight, CircleDot, CircleCheck,
  Send, CreditCard, Shield, Zap, ArrowUpRight, Plus, X,
  Upload, Filter, BarChart3, ArrowRight, Info, Settings2,
  Building2, GraduationCap, Handshake, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'

// --- Types ---
type CommissionStatus = 'not_requested' | 'eligible' | 'requested' | 'under_review' | 'approved' | 'processing' | 'paid' | 'rejected' | 'disputed' | 'cancelled'
type TriggerStage = 'application_submitted' | 'offer_received' | 'deposit_paid' | 'cas_received' | 'visa_approved' | 'enrollment_confirmed' | 'custom_stage'
type B2BType = 'PARTNER_INBOUND' | 'PARTNER_OUTBOUND'
type CommunicationMode = 'DIRECT' | 'PARTNER_ONLY'

interface CommissionRecord {
  id: string
  commissionId: string
  partnerId: string
  studentId?: string
  applicationId?: string
  universityId?: string
  amount: number
  currency: string
  triggerStage: string
  status: CommissionStatus
  requestedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  approvedAt?: string
  paidAt?: string
  paymentProof?: string
  note?: string
  createdAt: string
  updatedAt: string
  partner?: { id: string; companyName: string; partnerId: string; commissionRate?: number }
  application?: {
    id: string; applicationId: string
    student?: { firstName: string; lastName: string; studentId: string }
    university?: { name: string }
  }
  claims?: CommissionClaimItem[]
}

interface CommissionClaimItem {
  id: string
  commissionId: string
  partnerId: string
  claimAmount: number
  invoiceUrl?: string
  note?: string
  status: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

interface Summary {
  totalAmount: number
  pendingAmount: number
  paidAmount: number
  disputedAmount?: number
  approvedAmount?: number
}

// --- Status Config ---
const STATUS_CONFIG: Record<CommissionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_requested: { label: 'Not Requested', color: 'text-gray-600', bg: 'bg-gray-100', icon: CircleDot },
  eligible: { label: 'Eligible', color: 'text-blue-600', bg: 'bg-blue-100', icon: Info },
  requested: { label: 'Requested', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
  under_review: { label: 'Under Review', color: 'text-orange-600', bg: 'bg-orange-100', icon: Eye },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'text-purple-600', bg: 'bg-purple-100', icon: Zap },
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100', icon: X },
  disputed: { label: 'Disputed', color: 'text-orange-700', bg: 'bg-orange-200', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-200', icon: X },
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

const STATUS_FLOW: CommissionStatus[] = ['not_requested', 'eligible', 'requested', 'under_review', 'approved', 'processing', 'paid']
const EXTRA_STATUSES: CommissionStatus[] = ['rejected', 'disputed', 'cancelled']

// --- B2B Mock Data ---
const B2B_RULES = [
  { type: 'PARTNER_INBOUND' as B2BType, label: 'TYPE 1: PARTNER_INBOUND', description: 'Partner sends student to ALO', color: '#0066CC', icon: ArrowUpRight, commRate: 15 },
  { type: 'PARTNER_OUTBOUND' as B2BType, label: 'TYPE 2: PARTNER_OUTBOUND', description: 'ALO sends student to partner', color: '#F37021', icon: Building2, commRate: 10 },
]

const COMMUNICATION_MODES: { value: CommunicationMode; label: string; desc: string }[] = [
  { value: 'DIRECT', label: 'Direct Communication', desc: 'ALO communicates directly with student' },
  { value: 'PARTNER_ONLY', label: 'Partner Only', desc: 'All communication through partner' },
]

export default function CommissionManagement() {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [summary, setSummary] = useState<Summary>({ totalAmount: 0, pendingAmount: 0, paidAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [triggerFilter, setTriggerFilter] = useState<string>('all')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [selectedCommission, setSelectedCommission] = useState<CommissionRecord | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'mark_paid' | 'mark_disputed' | 'cancel' | null>(null)
  const [paymentProofOpen, setPaymentProofOpen] = useState(false)
  const [b2bOpen, setB2bOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [partners, setPartners] = useState<{id: string; companyName: string}[]>([])

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (triggerFilter !== 'all') params.set('triggerStage', triggerFilter)
      if (partnerFilter !== 'all') params.set('partnerId', partnerFilter)
      params.set('limit', '50')

      const res = await fetch(`/api/commissions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCommissions(data.commissions || [])
        setSummary({
          totalAmount: data.summary?.totalAmount || 0,
          pendingAmount: data.summary?.pendingAmount || 0,
          paidAmount: data.summary?.paidAmount || 0,
          disputedAmount: data.summary?.disputedAmount || 0,
          approvedAmount: data.summary?.approvedAmount || 0,
        })
      }
    } catch { toast.error('Failed to fetch commissions') }
    finally { setLoading(false) }
  }, [search, statusFilter, triggerFilter, partnerFilter])

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/partners?limit=100')
      if (res.ok) {
        const data = await res.json()
        setPartners((data.partners || []).map((p: {id: string; companyName: string}) => ({ id: p.id, companyName: p.companyName })))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])
  useEffect(() => { fetchPartners() }, [fetchPartners])

  const handleStatusAction = async (newStatus: CommissionStatus, proof?: string) => {
    if (!selectedCommission) return
    try {
      const res = await fetch('/api/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCommission.id,
          status: newStatus,
          reviewedBy: 'admin',
          note: noteText || undefined,
          paymentProof: proof || undefined,
        }),
      })
      if (res.ok) {
        toast.success(`Commission ${newStatus.replace(/_/g, ' ')} successfully`)
        setActionDialogOpen(false)
        setNoteOpen(false)
        setNoteText('')
        setSelectedCommission(null)
        fetchCommissions()
      } else {
        toast.error('Failed to update commission')
      }
    } catch {
      toast.error('Failed to update commission')
    }
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Partner', 'Student', 'Amount', 'Currency', 'Trigger', 'Status', 'Created']
    const rows = commissions.map(c => [
      c.commissionId,
      c.partner?.companyName || '-',
      c.application?.student ? `${c.application.student.firstName} ${c.application.student.lastName}` : '-',
      c.amount,
      c.currency,
      TRIGGER_LABELS[c.triggerStage] || c.triggerStage,
      STATUS_CONFIG[c.status as CommissionStatus]?.label || c.status,
      new Date(c.createdAt).toLocaleDateString(),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'commissions.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Commission statement exported')
  }

  const disputedAmt = commissions.filter(c => c.status === 'disputed').reduce((s, c) => s + c.amount, 0)
  const approvedAmt = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0)

  const getStatusBadge = (status: CommissionStatus) => {
    const cfg = STATUS_CONFIG[status]
    if (!cfg) return <Badge>{status}</Badge>
    const Icon = cfg.icon
    return <Badge className={`${cfg.bg} ${cfg.color} border-0 gap-1`}><Icon className="h-3 w-3" />{cfg.label}</Badge>
  }

  const filteredCommissions = commissions

  // --- Status Flow Visualization ---
  const StatusFlowBar = ({ current }: { current: CommissionStatus }) => {
    const currentIdx = STATUS_FLOW.indexOf(current)
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_FLOW.map((s, i) => {
          const isDone = i < currentIdx
          const isCurrent = s === current
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`px-2 py-1 rounded text-xs font-medium ${isCurrent ? cfg.bg + ' ' + cfg.color + ' ring-2 ring-offset-1' : isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}
                style={isCurrent ? { ringColor: cfg.color.includes('orange') ? '#F37021' : cfg.color.includes('blue') ? '#0066CC' : '#22c55e' } : {}}>
                {cfg.label}
              </div>
              {i < STATUS_FLOW.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300" />}
            </div>
          )
        })}
        {EXTRA_STATUSES.includes(current) && (
          <div className="ml-2">{getStatusBadge(current)}</div>
        )}
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-[#1A2332]">Commission Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track, manage and process partner commissions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setB2bOpen(true)} className="border-[#0066CC] text-[#0066CC]">
            <Handshake className="h-4 w-4 mr-2" /> B2B Rules
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-[#F37021] text-[#F37021]">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="commissions">All Commissions</TabsTrigger>
          <TabsTrigger value="partner-view">Partner View</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ===== DASHBOARD TAB ===== */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-[#F37021]" />
                </div>
                <div>
                  <p className="text-lg font-bold">£{(summary.totalAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">£{(summary.pendingAmount || 0).toLocaleString()}</p>
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
                  <p className="text-lg font-bold">£{(approvedAmt || 0).toLocaleString()}</p>
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
                  <p className="text-lg font-bold">£{(summary.paidAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Paid</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-lg font-bold">£{(disputedAmt || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Disputed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(STATUS_CONFIG) as [CommissionStatus, typeof STATUS_CONFIG[CommissionStatus]][]).map(([status, cfg]) => {
                const count = commissions.filter(c => c.status === status).length
                const pct = commissions.length > 0 ? (count / commissions.length) * 100 : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded ${cfg.bg} flex items-center justify-center`}>
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{cfg.label}</span>
                        <span className="text-sm text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Recent Commissions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Commissions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('commissions')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead><TableHead>Partner</TableHead><TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead><TableHead>Trigger</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.slice(0, 5).map(c => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedCommission(c); setActiveTab('commissions') }}>
                        <TableCell className="font-mono text-xs">{c.commissionId}</TableCell>
                        <TableCell>{c.partner?.companyName || '-'}</TableCell>
                        <TableCell>{c.application?.student ? `${c.application.student.firstName} ${c.application.student.lastName}` : '-'}</TableCell>
                        <TableCell className="font-semibold">£{c.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{TRIGGER_LABELS[c.triggerStage] || c.triggerStage}</Badge></TableCell>
                        <TableCell>{getStatusBadge(c.status as CommissionStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ALL COMMISSIONS TAB ===== */}
        <TabsContent value="commissions" className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(Object.entries(STATUS_CONFIG) as [CommissionStatus, typeof STATUS_CONFIG[CommissionStatus]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                  <SelectTrigger><SelectValue placeholder="Trigger" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Triggers</SelectItem>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                  <SelectTrigger><SelectValue placeholder="Partner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); setTriggerFilter('all'); setPartnerFilter('all') }}>
                  <Filter className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission List vs Detail */}
          {selectedCommission ? (
            <CommissionDetail
              commission={selectedCommission}
              onBack={() => setSelectedCommission(null)}
              onAction={(type) => { setActionType(type); setActionDialogOpen(true) }}
              onAddNote={() => setNoteOpen(true)}
              onUploadProof={() => setPaymentProofOpen(true)}
              getStatusBadge={getStatusBadge}
            />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead><TableHead>Partner</TableHead><TableHead>Student</TableHead>
                        <TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Trigger</TableHead>
                        <TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommissions.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">No commissions found</TableCell></TableRow>
                      ) : filteredCommissions.map(c => (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-mono text-xs">{c.commissionId}</TableCell>
                          <TableCell className="font-medium">{c.partner?.companyName || '-'}</TableCell>
                          <TableCell>{c.application?.student ? `${c.application.student.firstName} ${c.application.student.lastName}` : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: '#0066CC', color: '#0066CC' }}>INBOUND</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">£{c.amount.toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{TRIGGER_LABELS[c.triggerStage] || c.triggerStage}</Badge></TableCell>
                          <TableCell>{getStatusBadge(c.status as CommissionStatus)}</TableCell>
                          <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedCommission(c)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== PARTNER VIEW TAB ===== */}
        <TabsContent value="partner-view" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Partner Commission Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead><TableHead>Total Earned</TableHead><TableHead>Pending</TableHead>
                      <TableHead>Paid</TableHead><TableHead>Disputed</TableHead><TableHead>Commission Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map(p => {
                      const pComms = commissions.filter(c => c.partnerId === p.id)
                      const total = pComms.reduce((s, c) => s + c.amount, 0)
                      const pending = pComms.filter(c => ['eligible', 'requested', 'under_review', 'approved'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
                      const paid = pComms.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
                      const disp = pComms.filter(c => c.status === 'disputed').reduce((s, c) => s + c.amount, 0)
                      const rate = pComms[0]?.partner?.commissionRate || 0
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.companyName}</TableCell>
                          <TableCell className="font-semibold">£{total.toLocaleString()}</TableCell>
                          <TableCell>£{pending.toLocaleString()}</TableCell>
                          <TableCell>£{paid.toLocaleString()}</TableCell>
                          <TableCell>{disp > 0 ? `£${disp.toLocaleString()}` : '-'}</TableCell>
                          <TableCell>{rate}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SETTINGS TAB ===== */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Default Commission Rates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {B2B_RULES.map(rule => (
                  <div key={rule.type} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <rule.icon className="h-5 w-5" style={{ color: rule.color }} />
                      <span className="font-medium">{rule.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Rate:</Label>
                      <Input type="number" defaultValue={rule.commRate} className="w-20" />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Trigger Stage Configuration</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant="outline" className="text-xs">{key}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== B2B Rules Dialog ===== */}
      <Dialog open={b2bOpen} onOpenChange={setB2bOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>B2B Commission Rules</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {B2B_RULES.map(rule => (
              <div key={rule.type} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: rule.color + '15' }}>
                    <rule.icon className="h-4 w-4" style={{ color: rule.color }} />
                  </div>
                  <span className="font-bold" style={{ color: rule.color }}>{rule.label}</span>
                </div>
                <p className="text-sm text-gray-600 ml-10">{rule.description}</p>
                <div className="ml-10 mt-2">
                  <span className="text-sm font-medium">Default Rate: {rule.commRate}%</span>
                </div>
              </div>
            ))}
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Communication Mode</h4>
              {COMMUNICATION_MODES.map(mode => (
                <div key={mode.value} className="p-3 border rounded-lg mb-2">
                  <div className="flex items-center gap-2">
                    {mode.value === 'DIRECT' ? <MessageCircle className="h-4 w-4 text-[#0066CC]" /> : <Users className="h-4 w-4 text-[#F37021]" />}
                    <span className="font-medium text-sm">{mode.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{mode.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Add Note Dialog ===== */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
          <Textarea placeholder="Enter note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} />
          <Button onClick={async () => {
            if (!selectedCommission) return
            await fetch('/api/commissions', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: selectedCommission.id, status: selectedCommission.status, note: noteText }),
            })
            toast.success('Note added')
            setNoteOpen(false)
            setNoteText('')
            fetchCommissions()
          }} className="bg-[#F37021] hover:bg-[#e06010] text-white">Save Note</Button>
        </DialogContent>
      </Dialog>

      {/* ===== Action Dialog ===== */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>
            {actionType === 'approve' && 'Approve Commission'}
            {actionType === 'reject' && 'Reject Commission'}
            {actionType === 'mark_paid' && 'Mark as Paid'}
            {actionType === 'mark_disputed' && 'Mark as Disputed'}
            {actionType === 'cancel' && 'Cancel Commission'}
          </DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedCommission && `Commission: ${selectedCommission.commissionId} - £${selectedCommission.amount.toLocaleString()}`}
            </p>
            {(actionType === 'reject' || actionType === 'mark_disputed') && (
              <div>
                <Label>Reason</Label>
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter reason..." rows={3} />
              </div>
            )}
            {actionType === 'mark_paid' && (
              <div>
                <Label>Payment Proof URL</Label>
                <Input placeholder="Enter payment proof URL" id="proof-url" />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
              <Button
                className={
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  actionType === 'mark_paid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  actionType === 'mark_disputed' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                  'bg-gray-600 hover:bg-gray-700 text-white'
                }
                onClick={() => {
                  const statusMap: Record<string, CommissionStatus> = {
                    approve: 'approved', reject: 'rejected', mark_paid: 'paid', mark_disputed: 'disputed', cancel: 'cancelled'
                  }
                  if (actionType && statusMap[actionType]) {
                    const proofEl = document.getElementById('proof-url') as HTMLInputElement
                    handleStatusAction(statusMap[actionType], proofEl?.value)
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Payment Proof Upload Dialog ===== */}
      <Dialog open={paymentProofOpen} onOpenChange={setPaymentProofOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Payment Proof</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drop file here or click to browse</p>
              <Input type="file" className="mt-2 max-w-xs mx-auto" accept=".pdf,.jpg,.png" onChange={() => toast.info('File selected for upload')} />
            </div>
            <Button onClick={() => { toast.success('Payment proof uploaded'); setPaymentProofOpen(false) }} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">
              Upload Proof
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Commission Detail Sub-Component ---
function CommissionDetail({ commission, onBack, onAction, onAddNote, onUploadProof, getStatusBadge }: {
  commission: CommissionRecord
  onBack: () => void
  onAction: (type: 'approve' | 'reject' | 'mark_paid' | 'mark_disputed' | 'cancel') => void
  onAddNote: () => void
  onUploadProof: () => void
  getStatusBadge: (status: CommissionStatus) => React.ReactNode
}) {
  const stageIdx = STATUS_FLOW.indexOf(commission.status as CommissionStatus)
  const isActive = stageIdx >= 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronRight className="h-4 w-4 rotate-180" /> Back</Button>
        <span className="font-mono text-sm text-gray-500">{commission.commissionId}</span>
        {getStatusBadge(commission.status as CommissionStatus)}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Amount</p><p className="text-xl font-bold">£{commission.amount.toLocaleString()}</p><p className="text-xs text-gray-400">{commission.currency}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Partner</p><p className="text-sm font-bold">{commission.partner?.companyName || '-'}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Student</p><p className="text-sm font-bold">{commission.application?.student ? `${commission.application.student.firstName} ${commission.application.student.lastName}` : '-'}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">University</p><p className="text-sm font-bold">{commission.application?.university?.name || '-'}</p></CardContent></Card>
      </div>

      {/* Status Flow */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Status Flow</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUS_FLOW.map((s, i) => {
              const isDone = isActive && i < stageIdx
              const isCurrent = s === commission.status
              const cfg = STATUS_CONFIG[s]
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isCurrent ? cfg.bg + ' ' + cfg.color + ' ring-2 ring-offset-1 shadow-sm' : isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : <CircleDot className="h-3 w-3" />}
                    {cfg.label}
                  </div>
                  {i < STATUS_FLOW.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />}
                </div>
              )
            })}
          </div>
          {EXTRA_STATUSES.includes(commission.status as CommissionStatus) && (
            <div className="mt-3">{getStatusBadge(commission.status as CommissionStatus)}</div>
          )}
        </CardContent>
      </Card>

      {/* Trigger Stage Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Trigger Stage</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(TRIGGER_LABELS).map(([key, label], i) => {
              const isTrigger = key === commission.triggerStage
              return (
                <div key={key} className="flex items-center gap-1">
                  <div className={`px-3 py-1.5 rounded text-xs font-medium ${isTrigger ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {label}
                  </div>
                  {i < Object.keys(TRIGGER_LABELS).length - 1 && <ArrowRight className="h-3 w-3 text-gray-300" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Lifecycle</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Created', date: commission.createdAt, done: true },
              { label: 'Requested', date: commission.requestedAt, done: !!commission.requestedAt },
              { label: 'Reviewed', date: commission.reviewedAt, done: !!commission.reviewedAt },
              { label: 'Approved', date: commission.approvedAt, done: !!commission.approvedAt },
              { label: 'Paid', date: commission.paidAt, done: !!commission.paidAt },
            ].filter(e => e.done).map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#F37021] mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{e.label}</p>
                  <p className="text-xs text-gray-500">{e.date ? new Date(e.date).toLocaleString() : '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {commission.note && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">{commission.note}</p></CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {['eligible', 'requested', 'under_review'].includes(commission.status) && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onAction('approve')}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
            )}
            {['eligible', 'requested', 'under_review'].includes(commission.status) && (
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onAction('reject')}>
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            )}
            {commission.status === 'approved' && (
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => onAction('mark_paid')}>
                <DollarSign className="h-4 w-4 mr-1" /> Mark Paid
              </Button>
            )}
            {!['paid', 'cancelled', 'rejected'].includes(commission.status) && (
              <Button size="sm" variant="outline" className="border-orange-400 text-orange-600" onClick={() => onAction('mark_disputed')}>
                <AlertTriangle className="h-4 w-4 mr-1" /> Disputed
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onAddNote}>
              <MessageSquare className="h-4 w-4 mr-1" /> Add Note
            </Button>
            <Button size="sm" variant="outline" onClick={onUploadProof}>
              <Upload className="h-4 w-4 mr-1" /> Upload Proof
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
