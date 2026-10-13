'use client'

import { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  Download,
  FileText,
  Receipt,
  CreditCard,
  Percent,
  Plus,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  studentId: string | null
  invoiceId: string | null
  amount: number
  currency: string
  paymentMethod: string | null
  transactionRef: string | null
  status: string
  paidAt: string
  createdAt: string
}

interface Invoice {
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

interface Expense {
  id: string
  category: string
  amount: number
  currency: string
  description: string | null
  date: string
  status: string
}

interface Commission {
  id: string
  commissionId: string
  partnerId: string
  amount: number
  currency: string
  triggerStage: string
  status: string
  createdAt: string
  partner?: { id: string; companyName: string; partnerId: string; commissionRate?: number }
  application?: { id: string; applicationId: string; student?: { firstName: string; lastName: string }; university?: { name: string } }
}

interface PaymentsResponse {
  payments: Payment[]
  invoices: Invoice[]
  expenses: Expense[]
  summary: {
    totalInvoiced: number
    totalPaid: number
    pendingAmount: number
    overdueCount: number
  }
}

interface CommissionsResponse {
  commissions: Commission[]
  summary: { totalAmount: number; pendingAmount: number; paidAmount: number }
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  partial: 'bg-blue-50 text-[#0057B8] border-blue-100',
  paid: 'bg-green-50 text-green-600 border-green-100',
  overdue: 'bg-red-50 text-red-600 border-red-100',
  completed: 'bg-green-50 text-green-600 border-green-100',
  failed: 'bg-red-50 text-red-600 border-red-100',
  refunded: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  eligible: 'bg-blue-50 text-[#0057B8] border-blue-100',
  requested: 'bg-amber-50 text-amber-600 border-amber-100',
  under_review: 'bg-purple-50 text-purple-600 border-purple-100',
  approved: 'bg-green-50 text-green-600 border-green-100',
  processing: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
  disputed: 'bg-orange-50 text-[#E8501A] border-orange-100',
  not_requested: 'bg-slate-100 text-slate-500 border-slate-200',
}

function money(amount: number, currency = 'GBP') {
  return `${currency} ${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export default function FinancePage() {
  const session = getSession()
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', amount: '', description: '', dueDate: '' })

  const { data: paymentsData, loading: loadingPayments } = usePortalData<PaymentsResponse>({
    endpoint: '/api/payments',
    params: { limit: 100 },
  })

  const { data: commissionsData, loading: loadingCommissions } = usePortalData<CommissionsResponse>({
    endpoint: '/api/commissions',
    params: { limit: 50 },
  })

  const payments = paymentsData?.payments ?? []
  const invoices = paymentsData?.invoices ?? []
  const expenses = paymentsData?.expenses ?? []
  const summary = paymentsData?.summary
  const commissions = commissionsData?.commissions ?? []
  const commissionSummary = commissionsData?.summary

  const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0)
  const pendingInvoices = invoices.filter((i) => ['pending', 'partial', 'overdue'].includes(i.status)).length
  const totalCommissions = commissionSummary?.totalAmount ?? 0
  const pendingClaims = commissions.filter((c) => ['eligible', 'requested', 'under_review'].includes(c.status)).length

  const handleCreateInvoice = async () => {
    if (!invoiceForm.amount || !invoiceForm.studentId) {
      toast.error('Student ID and amount are required')
      return
    }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({
          type: 'invoice',
          studentId: invoiceForm.studentId,
          amount: parseFloat(invoiceForm.amount),
          description: invoiceForm.description || null,
          dueDate: invoiceForm.dueDate || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create invoice')
      toast.success('Invoice created')
      setAddInvoiceOpen(false)
      setInvoiceForm({ studentId: '', amount: '', description: '', dueDate: '' })
      setTimeout(() => window.location.reload(), 800)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Invoices, payments, commissions, and expenses — full financial overview in one place."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info('Export finance report (CSV)')}><Download className="h-4 w-4 mr-2" /> Export</Button>
            <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white"><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div><Label className="text-xs">Student ID *</Label><Input value={invoiceForm.studentId} onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })} placeholder="Student record ID" /></div>
                  <div><Label className="text-xs">Amount *</Label><Input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} /></div>
                  <div><Label className="text-xs">Description</Label><Input value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} /></div>
                  <div><Label className="text-xs">Due Date</Label><Input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddInvoiceOpen(false)}>Cancel</Button>
                  <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={handleCreateInvoice}>Create Invoice</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={money(totalRevenue)} icon={Wallet} accent="green" />
        <StatCard label="Pending Invoices" value={pendingInvoices} icon={Receipt} accent="amber" hint={money(summary?.pendingAmount ?? 0)} />
        <StatCard label="Total Commissions" value={money(totalCommissions)} icon={Percent} accent="purple" />
        <StatCard label="Pending Claims" value={pendingClaims} icon={Clock} accent="orange" />
      </div>

      <Tabs defaultValue="invoices">
        <div className="overflow-x-auto">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex flex-nowrap">
            <TabsTrigger value="invoices" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs"><Receipt className="h-3.5 w-3.5 mr-1.5" /> Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs"><CreditCard className="h-3.5 w-3.5 mr-1.5" /> Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs"><Percent className="h-3.5 w-3.5 mr-1.5" /> Commissions ({commissions.length})</TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs"><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* Invoices */}
        <TabsContent value="invoices">
          <Card className="border-0 shadow-sm overflow-hidden">
            {loadingPayments ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-7 w-7 text-[#0057B8]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No invoices yet</h3>
                <p className="text-sm text-slate-500 mb-5">Create your first invoice for a student or partner.</p>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => setAddInvoiceOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Invoice ID</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Type</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Description</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Amount</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Paid</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Due Date</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                      <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="p-3"><span className="font-semibold text-[#0057B8]">{inv.invoiceId}</span></td>
                        <td className="p-3"><Badge className="bg-slate-100 text-slate-600 border-0 text-xs capitalize">{inv.type}</Badge></td>
                        <td className="p-3 text-xs text-slate-700 max-w-[200px] truncate" title={inv.description || ''}>{inv.description || '—'}</td>
                        <td className="p-3 text-xs font-semibold text-slate-900">{money(inv.amount, inv.currency)}</td>
                        <td className="p-3 text-xs text-slate-700">{money(inv.paidAmount, inv.currency)}</td>
                        <td className="p-3 text-xs text-slate-600">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                        <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[inv.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{inv.status}</Badge></td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => toast.info(`View ${inv.invoiceId}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success('Marked as paid')}><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Paid</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Download PDF')}><Download className="h-4 w-4 mr-2" /> Download PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <Card className="border-0 shadow-sm overflow-hidden">
            {loadingPayments ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">No payments recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Payment ID</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Amount</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Method</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Transaction Ref</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Date</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="p-3 text-xs font-mono text-slate-500">{p.id.slice(-8)}</td>
                        <td className="p-3 text-xs text-slate-700">{p.studentId ? p.studentId.slice(-8) : '—'}</td>
                        <td className="p-3 text-xs font-semibold text-slate-900">{money(p.amount, p.currency)}</td>
                        <td className="p-3 text-xs text-slate-700 capitalize">{p.paymentMethod?.replace(/_/g, ' ') || '—'}</td>
                        <td className="p-3 text-xs font-mono text-slate-600">{p.transactionRef || '—'}</td>
                        <td className="p-3 text-xs text-slate-600">{new Date(p.paidAt).toLocaleDateString()}</td>
                        <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[p.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Commissions */}
        <TabsContent value="commissions">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 grid grid-cols-3 gap-3">
              <div><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold text-slate-900">{money(commissionSummary?.totalAmount ?? 0)}</p></div>
              <div><p className="text-xs text-slate-500">Pending</p><p className="text-lg font-bold text-amber-600">{money(commissionSummary?.pendingAmount ?? 0)}</p></div>
              <div><p className="text-xs text-slate-500">Paid</p><p className="text-lg font-bold text-green-600">{money(commissionSummary?.paidAmount ?? 0)}</p></div>
            </div>
            {loadingCommissions ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
            ) : commissions.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">No commission records yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Commission ID</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Partner</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Application</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Trigger Stage</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Amount</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Created</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                      <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="p-3"><span className="font-semibold text-[#0057B8]">{c.commissionId}</span></td>
                        <td className="p-3 text-xs text-slate-700">{c.partner?.companyName || c.partnerId.slice(-8)}</td>
                        <td className="p-3 text-xs text-slate-700">{c.application?.applicationId || '—'}</td>
                        <td className="p-3 text-xs text-slate-600 capitalize">{c.triggerStage.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-xs font-semibold text-slate-900">{money(c.amount, c.currency)}</td>
                        <td className="p-3 text-xs text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[c.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{c.status.replace(/_/g, ' ')}</Badge></td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => toast.info(`View ${c.commissionId}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success('Marked approved')}><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Mark paid')}><Wallet className="h-4 w-4 mr-2" /> Mark Paid</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card className="border-0 shadow-sm overflow-hidden">
            {loadingPayments ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-7 w-7 text-[#0057B8]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No expenses recorded</h3>
                <p className="text-sm text-slate-500 mb-5">Track office, marketing, and operational expenses here.</p>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.info('New expense form')}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Category</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Description</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Amount</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Date</th>
                      <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="p-3"><Badge className="bg-slate-100 text-slate-600 border-0 text-xs capitalize">{e.category.replace(/_/g, ' ')}</Badge></td>
                        <td className="p-3 text-xs text-slate-700">{e.description || '—'}</td>
                        <td className="p-3 text-xs font-semibold text-slate-900">{money(e.amount, e.currency)}</td>
                        <td className="p-3 text-xs text-slate-600">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[e.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{e.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
