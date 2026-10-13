'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Wallet, DollarSign, Clock, CheckCircle2, Search, Send,
  Banknote, TrendingUp, ArrowRight, Circle, Calendar,
  ChevronRight, Info, CreditCard, FileText
} from 'lucide-react'

const statusConfig: Record<string, { color: string; label: string }> = {
  eligible: { color: 'bg-blue-50 text-blue-700', label: 'Eligible' },
  requested: { color: 'bg-yellow-50 text-yellow-700', label: 'Requested' },
  under_review: { color: 'bg-orange-50 text-orange-700', label: 'Under Review' },
  approved: { color: 'bg-green-50 text-green-700', label: 'Approved' },
  paid: { color: 'bg-emerald-50 text-emerald-700', label: 'Paid' },
  rejected: { color: 'bg-red-50 text-red-700', label: 'Rejected' },
}

const lifecycleStages = ['eligible', 'requested', 'under_review', 'approved', 'paid']

interface Commission {
  id: string; commissionId: string; amount: number; currency: string;
  status: string; triggerStage: string; createdAt: string;
  student: string; university: string;
  paidAt?: string; requestedAt?: string; approvedAt?: string;
}

const mockCommissions: Commission[] = [
  { id: '1', commissionId: 'COM-001', amount: 1500, currency: '£', status: 'eligible', triggerStage: 'CAS Received', createdAt: '2025-03-15', student: 'Tanvir Ahmed', university: 'University of Manchester' },
  { id: '2', commissionId: 'COM-002', amount: 1200, currency: '£', status: 'requested', triggerStage: 'Unconditional Offer', createdAt: '2025-03-10', student: 'Fatima Khan', university: 'University of Birmingham', requestedAt: '2025-03-12' },
  { id: '3', commissionId: 'COM-003', amount: 1800, currency: '£', status: 'under_review', triggerStage: 'Visa Approved', createdAt: '2025-02-28', student: 'Nusrat Jahan', university: 'University of Sheffield', requestedAt: '2025-03-01' },
  { id: '4', commissionId: 'COM-004', amount: 1000, currency: '£', status: 'approved', triggerStage: 'CAS Received', createdAt: '2025-02-15', student: 'Rahim Uddin', university: 'University of Leeds', requestedAt: '2025-02-16', approvedAt: '2025-03-01' },
  { id: '5', commissionId: 'COM-005', amount: 2200, currency: '£', status: 'paid', triggerStage: 'Enrolled', createdAt: '2025-01-20', student: 'Kamal Hossain', university: 'University of Bristol', requestedAt: '2025-01-22', approvedAt: '2025-02-05', paidAt: '2025-02-15' },
  { id: '6', commissionId: 'COM-006', amount: 950, currency: '£', status: 'paid', triggerStage: 'Enrolled', createdAt: '2024-12-10', student: 'Amina Begum', university: 'University of Nottingham', requestedAt: '2024-12-12', approvedAt: '2025-01-03', paidAt: '2025-01-15' },
  { id: '7', commissionId: 'COM-007', amount: 1600, currency: '£', status: 'eligible', triggerStage: 'Unconditional Offer', createdAt: '2025-03-18', student: 'Sakib Hasan', university: 'University of Manchester' },
  { id: '8', commissionId: 'COM-008', amount: 1100, currency: '£', status: 'rejected', triggerStage: 'Conditional Offer', createdAt: '2025-02-05', student: 'Mira Das', university: 'University of York' },
]

const mockPayments = [
  { id: '1', commissionId: 'COM-005', amount: 2200, date: '2025-02-15', method: 'Bank Transfer', ref: 'TXN-78901' },
  { id: '2', commissionId: 'COM-006', amount: 950, date: '2025-01-15', method: 'Bank Transfer', ref: 'TXN-67890' },
  { id: '3', commissionId: 'COM-003-PT', amount: 800, date: '2024-12-20', method: 'Bank Transfer', ref: 'TXN-56789' },
]

export default function PartnerCommissions() {
  const { currentUser } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [claimingCommission, setClaimingCommission] = useState<Commission | null>(null)
  const [claiming, setClaiming] = useState(false)

  const filtered = mockCommissions.filter(c => {
    const matchSearch = !search ||
      c.commissionId.toLowerCase().includes(search.toLowerCase()) ||
      c.student.toLowerCase().includes(search.toLowerCase()) ||
      c.university.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalEarned = mockCommissions.reduce((s, c) => s + c.amount, 0)
  const pendingAmount = mockCommissions.filter(c => ['eligible', 'requested', 'under_review'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
  const paidAmount = mockCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  const thisMonth = mockCommissions.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).reduce((s, c) => s + c.amount, 0)

  const handleClaim = async () => {
    if (!claimingCommission) return
    setClaiming(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success(`Claim submitted for ${claimingCommission.commissionId}`)
    setShowClaimDialog(false)
    setClaimingCommission(null)
    setClaiming(false)
  }

  const getLifecycleStep = (status: string) => lifecycleStages.indexOf(status)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Commissions</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your commission earnings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: `£${totalEarned.toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, bg: 'bg-gray-50', textColor: 'text-gray-600' },
          { label: 'Pending', value: `£${pendingAmount.toLocaleString()}`, icon: <Clock className="h-5 w-5" />, bg: 'bg-[#F37021]/10', textColor: 'text-[#F37021]' },
          { label: 'Paid', value: `£${paidAmount.toLocaleString()}`, icon: <Banknote className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'This Month', value: `£${thisMonth.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, bg: 'bg-[#0066CC]/10', textColor: 'text-[#0066CC]' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">All Commissions</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="rates">Commission Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search commissions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commission List */}
          {filtered.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No commissions found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">University</TableHead>
                      <TableHead className="text-xs">Trigger Stage</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((com) => {
                      const sc = statusConfig[com.status] || { color: 'bg-gray-100 text-gray-600', label: com.status }
                      return (
                        <TableRow key={com.id} className="cursor-pointer hover:bg-gray-50"
                          onClick={() => { setSelectedCommission(com); setShowDetailDialog(true) }}>
                          <TableCell className="text-xs font-mono text-gray-500">{com.commissionId}</TableCell>
                          <TableCell className="text-sm text-[#1A2332]">{com.student}</TableCell>
                          <TableCell className="text-xs text-gray-500">{com.university}</TableCell>
                          <TableCell className="text-xs text-gray-500">{com.triggerStage}</TableCell>
                          <TableCell className="text-sm font-semibold text-[#1A2332]">{com.currency}{com.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{new Date(com.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {com.status === 'eligible' ? (
                              <Button size="sm" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white h-7 text-xs"
                                onClick={(e) => { e.stopPropagation(); setClaimingCommission(com); setShowClaimDialog(true) }}>
                                Claim
                              </Button>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No payments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Commission</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Method</TableHead>
                        <TableHead className="text-xs">Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPayments.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell className="text-xs font-mono text-gray-500">{pay.commissionId}</TableCell>
                          <TableCell className="text-sm font-semibold text-[#1A2332]">£{pay.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-gray-500">{new Date(pay.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-gray-500">{pay.method}</TableCell>
                          <TableCell className="text-xs font-mono text-gray-500">{pay.ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Info className="h-4 w-4 text-[#0066CC]" /> Commission Rate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="bg-[#F37021]/5 border border-[#F37021]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-[#F37021]" />
                  <p className="font-semibold text-[#1A2332]">TYPE1 Partner Rate: 15%</p>
                </div>
                <p className="text-xs text-gray-600">Commission is triggered at key application milestones. You earn 15% of the first year tuition fee for each successful referral.</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Trigger Stages & Commission</h4>
                <div className="space-y-2">
                  {[
                    { stage: 'Unconditional Offer', pct: '30%', desc: '30% of total commission released' },
                    { stage: 'CAS Received', pct: '40%', desc: 'Additional 40% released' },
                    { stage: 'Visa Approved', pct: '20%', desc: 'Additional 20% released' },
                    { stage: 'Enrolled', pct: '10%', desc: 'Final 10% released' },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-[#1A2332]">{item.stage}</p>
                        <p className="text-[10px] text-gray-500">{item.desc}</p>
                      </div>
                      <Badge className="bg-[#F37021]/10 text-[#F37021] text-xs">{item.pct}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Claim Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Commission</DialogTitle>
          </DialogHeader>
          {claimingCommission && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="text-sm"><span className="text-gray-500">Commission ID:</span> {claimingCommission.commissionId}</p>
                <p className="text-sm"><span className="text-gray-500">Amount:</span> <span className="font-bold text-[#1A2332]">{claimingCommission.currency}{claimingCommission.amount.toLocaleString()}</span></p>
                <p className="text-sm"><span className="text-gray-500">Student:</span> {claimingCommission.student}</p>
                <p className="text-sm"><span className="text-gray-500">Trigger:</span> {claimingCommission.triggerStage}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowClaimDialog(false)}>Cancel</Button>
                <Button onClick={handleClaim} disabled={claiming} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                  <Send className="h-4 w-4 mr-2" /> {claiming ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commission Detail Dialog with Lifecycle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-[#1A2332]">Commission Detail</DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">{selectedCommission?.commissionId}</p>
              </div>
              {selectedCommission && (
                <Badge className={statusConfig[selectedCommission.status]?.color || 'bg-gray-100'}>
                  {statusConfig[selectedCommission.status]?.label || selectedCommission.status}
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-[#1A2332]">{selectedCommission.currency}{selectedCommission.amount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Trigger Stage</p>
                  <p className="text-sm font-semibold text-[#1A2332]">{selectedCommission.triggerStage}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Student: <span className="text-[#1A2332] font-medium">{selectedCommission.student}</span></p>
                <p className="text-xs text-gray-500">University: <span className="text-[#1A2332] font-medium">{selectedCommission.university}</span></p>
                <p className="text-xs text-gray-500">Created: <span className="text-[#1A2332] font-medium">{new Date(selectedCommission.createdAt).toLocaleDateString()}</span></p>
              </div>

              <Separator />

              {/* Lifecycle Tracker */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Commission Lifecycle</h4>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {lifecycleStages.map((stage, idx) => {
                    const currentStep = getLifecycleStep(selectedCommission.status)
                    const reached = idx <= currentStep && currentStep >= 0
                    const rejected = selectedCommission.status === 'rejected'
                    return (
                      <div key={stage} className="flex items-center shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                          rejected && idx === 0 ? 'bg-red-100 text-red-700' :
                          reached ? (idx === currentStep ? 'bg-[#F37021] text-white' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-400'
                        }`}>
                          {reached ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] ml-1 ${reached ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {statusConfig[stage]?.label || stage}
                        </span>
                        {idx < lifecycleStages.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300 mx-1 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {selectedCommission.status === 'eligible' && (
                <Button className="w-full bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                  onClick={() => { setShowDetailDialog(false); setClaimingCommission(selectedCommission); setShowClaimDialog(true) }}>
                  <Send className="h-4 w-4 mr-2" /> Claim This Commission
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
