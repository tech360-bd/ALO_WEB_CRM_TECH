'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import {
  CreditCard, Wallet, Clock, CheckCircle2, AlertTriangle,
  Download, Search, FileText, DollarSign, Receipt, Calendar
} from 'lucide-react'

interface Payment {
  id: string
  paymentId: string
  amount: number
  currency: string
  status: string
  description: string
  paymentMethod: string
  paidAt: string | null
  dueDate: string | null
  invoiceUrl: string | null
  createdAt: string
}

interface Invoice {
  id: string
  invoiceId: string
  amount: number
  currency: string
  status: string
  description: string
  issuedAt: string
  dueDate: string
  paidAt: string | null
}

const paymentStatusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  paid: { color: 'bg-green-50 text-green-700', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Paid' },
  pending: { color: 'bg-yellow-50 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
  overdue: { color: 'bg-red-50 text-red-700', icon: <AlertTriangle className="h-3 w-3" />, label: 'Overdue' },
  partial: { color: 'bg-blue-50 text-blue-700', icon: <DollarSign className="h-3 w-3" />, label: 'Partial' },
  refunded: { color: 'bg-gray-50 text-gray-600', icon: <Receipt className="h-3 w-3" />, label: 'Refunded' },
  failed: { color: 'bg-red-50 text-red-600', icon: <AlertTriangle className="h-3 w-3" />, label: 'Failed' },
}

export default function StudentPayments() {
  const { currentUser } = useAppStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId || ''
        const res = await fetch(`/api/payments?studentId=${refId}&limit=50`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setPayments(json.payments || json || [])
        setInvoices(json.invoices || [])
      } catch {
        setPayments([])
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [currentUser?.referenceId])

  const filteredPayments = payments.filter(p => {
    const matchesSearch = !search || p.description.toLowerCase().includes(search.toLowerCase()) || p.paymentId.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)
  const overdueCount = payments.filter(p => p.status === 'overdue').length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">View your payment history and invoices</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">£{totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">£{totalPending.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-alo-orange/10 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-alo-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{payments.length}</p>
              <p className="text-xs text-gray-500">Total Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{overdueCount}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                You have {overdueCount} overdue payment{overdueCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600 mt-0.5">Please settle overdue payments to avoid delays in your application.</p>
            </div>
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Pay Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="payments">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <Wallet className="h-3.5 w-3.5 mr-1.5" /> Payment History
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Invoices
          </TabsTrigger>
        </TabsList>

        {/* Payment History */}
        <TabsContent value="payments" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPayments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No payments found</p>
                <p className="text-xs text-gray-400 mt-1">Your payment history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Payment ID</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Method</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const sc = paymentStatusConfig[payment.status] || paymentStatusConfig.pending
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="text-xs font-mono text-gray-500">{payment.paymentId}</TableCell>
                          <TableCell className="text-sm text-alo-navy">{payment.description}</TableCell>
                          <TableCell className="text-sm font-semibold text-alo-navy">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{payment.paymentMethod || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${sc.color}`}>
                              <span className="mr-1">{sc.icon}</span> {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : payment.dueDate ? `Due: ${new Date(payment.dueDate).toLocaleDateString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            {payment.invoiceUrl && (
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="h-3.5 w-3.5 text-gray-400" />
                              </Button>
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

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-4">
          {invoices.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No invoices</p>
                <p className="text-xs text-gray-400 mt-1">Invoices will appear when payments are due</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Card key={inv.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                      <Receipt className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-alo-navy">{inv.description}</p>
                      <p className="text-xs text-gray-500">{inv.invoiceId} &middot; Issued: {new Date(inv.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-alo-navy">{inv.currency} {inv.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] text-gray-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge className={`text-xs shrink-0 ${
                      inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                      inv.status === 'overdue' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
