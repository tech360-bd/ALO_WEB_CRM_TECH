'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, DollarSign, Receipt, CreditCard, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: string
  paymentId: string
  amount: number
  currency: string
  method: string
  status: string
  paidAt: string
  student?: { firstName: string; lastName: string; studentId: string }
  invoice?: { invoiceId: string }
}

export default function CRMFinance() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [summary, setSummary] = useState({ totalInvoiced: 0, totalPaid: 0, pendingAmount: 0, overdueCount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', amount: '', description: '', dueDate: '' })
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', method: 'bank_transfer', reference: '', note: '' })

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setInvoices(data.invoices || [])
        setSummary(data.summary || { totalInvoiced: 0, totalPaid: 0, pendingAmount: 0, overdueCount: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch finance data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      case 'partial': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleAddInvoice = async () => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice', studentId: invoiceForm.studentId, amount: parseFloat(invoiceForm.amount), description: invoiceForm.description, dueDate: invoiceForm.dueDate })
      })
      if (res.ok) {
        toast.success('Invoice created successfully')
        setAddInvoiceOpen(false)
        fetchFinanceData()
      } else {
        toast.error('Failed to create invoice')
      }
    } catch { toast.error('Failed to create invoice') }
  }

  const handleAddPayment = async () => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: paymentForm.studentId, amount: parseFloat(paymentForm.amount), paymentMethod: paymentForm.method, transactionRef: paymentForm.reference })
      })
      if (res.ok) {
        toast.success('Payment recorded successfully')
        setAddPaymentOpen(false)
        fetchFinanceData()
      } else {
        toast.error('Failed to record payment')
      }
    } catch { toast.error('Failed to record payment') }
  }

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Finance Management</h1>
        <div className="flex gap-2">
          <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#F37021] text-[#F37021]"><Receipt className="h-4 w-4 mr-2" /> Add Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Student ID</Label><Input value={invoiceForm.studentId} onChange={e => setInvoiceForm({...invoiceForm, studentId: e.target.value})} /></div>
                <div><Label>Amount</Label><Input type="number" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={invoiceForm.description} onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})} /></div>
                <div><Label>Due Date</Label><Input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} /></div>
                <Button onClick={handleAddInvoice} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">Create Invoice</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white"><Plus className="h-4 w-4 mr-2" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Student ID</Label><Input value={paymentForm.studentId} onChange={e => setPaymentForm({...paymentForm, studentId: e.target.value})} /></div>
                <div><Label>Amount</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                <div><Label>Method</Label>
                  <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bkash">bKash</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Reference</Label><Input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} /></div>
                <Button onClick={handleAddPayment} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">Record Payment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center"><TrendingUp className="h-5 w-5 text-[#F37021]" /></div><div><p className="text-xl font-bold">৳{summary.totalPaid.toLocaleString()}</p><p className="text-xs text-gray-500">Total Revenue</p></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><CreditCard className="h-5 w-5 text-amber-600" /></div><div><p className="text-xl font-bold">৳{summary.pendingAmount.toLocaleString()}</p><p className="text-xs text-gray-500">Pending</p></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Receipt className="h-5 w-5 text-blue-600" /></div><div><p className="text-xl font-bold">{invoices.length}</p><p className="text-xs text-gray-500">Total Invoices</p></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-red-600" /></div><div><p className="text-xl font-bold">{summary.overdueCount}</p><p className="text-xs text-gray-500">Overdue</p></div></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search payments..." className="pl-9" /></div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Payment History</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No payments found</TableCell></TableRow>
                ) : payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.paymentId || p.id}</TableCell>
                    <TableCell className="font-medium">{p.student ? `${p.student.firstName} ${p.student.lastName}` : '—'}</TableCell>
                    <TableCell className="font-semibold">{p.currency === 'GBP' ? '£' : '৳'}{(p.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{p.method || p.paymentMethod || '—'}</TableCell>
                    <TableCell><Badge className={getStatusColor(p.status)}>{p.status}</Badge></TableCell>
                    <TableCell className="text-sm">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
