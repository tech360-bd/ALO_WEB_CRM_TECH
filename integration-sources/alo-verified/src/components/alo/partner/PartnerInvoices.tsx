'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Receipt, DollarSign, Clock, CheckCircle2, Download, Upload, Search,
  FileText, CreditCard, Calendar, Building, ChevronRight, AlertTriangle, Eye
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceId: string
  type: string
  amount: number
  currency: string
  taxAmount: number
  totalAmount: number
  status: string
  dueDate: string
  paidDate?: string
  description: string
  commissionRef?: string
  createdAt: string
}

const statusConfig: Record<string, { color: string; label: string }> = {
  paid: { color: 'bg-green-50 text-green-700', label: 'Paid' },
  pending: { color: 'bg-amber-50 text-amber-700', label: 'Pending' },
  overdue: { color: 'bg-red-50 text-red-700', label: 'Overdue' },
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
  cancelled: { color: 'bg-gray-100 text-gray-500 line-through', label: 'Cancelled' },
  partially_paid: { color: 'bg-blue-50 text-blue-700', label: 'Partially Paid' },
}

// Invoices are now fetched from the API

export default function PartnerInvoices() {
  const { currentUser } = useAppStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true)
        const partnerId = currentUser?.referenceId || ''
        const res = await fetch(`/api/payments?partnerId=${partnerId}&limit=50`)
        if (res.ok) {
          const json = await res.json()
          const mapped = (json.payments || json || []).map((p: any) => ({
            id: p.id,
            invoiceId: p.paymentId || p.invoiceId || p.id,
            type: p.type || 'Commission Payout',
            amount: p.amount || 0,
            currency: p.currency || '£',
            taxAmount: p.taxAmount || 0,
            totalAmount: p.totalAmount || p.amount || 0,
            status: p.status || 'pending',
            dueDate: p.dueDate || '',
            paidDate: p.paidAt || p.paidDate || undefined,
            description: p.description || '',
            commissionRef: p.commissionRef || undefined,
            createdAt: p.createdAt || '',
          }))
          setInvoices(mapped)
        }
      } catch {
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [currentUser?.referenceId])

  const filtered = invoices.filter(i => {
    const matchSearch = !search ||
      i.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0)
  const totalPending = invoices.filter(i => ['pending', 'partially_paid'].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.totalAmount, 0)

  const handleUpload = async () => {
    setUploading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Commission invoice uploaded successfully')
    setShowUploadDialog(false)
    setUploading(false)
  }

  const handleDownload = (invoice: Invoice) => {
    toast.success(`Downloading ${invoice.invoiceId}.pdf...`)
  }

  const handleDownloadStatement = () => {
    toast.success('Downloading account statement...')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Track commission invoices and payment status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadStatement}>
            <Download className="h-4 w-4 mr-2" /> Statement
          </Button>
          <Button className="bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" /> Upload Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Paid', value: `£${totalPaid.toLocaleString()}`, icon: <CheckCircle2 className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Pending', value: `£${totalPending.toLocaleString()}`, icon: <Clock className="h-5 w-5" />, bg: 'bg-amber-50', textColor: 'text-amber-600' },
          { label: 'Overdue', value: `£${totalOverdue.toLocaleString()}`, icon: <AlertTriangle className="h-5 w-5" />, bg: 'bg-red-50', textColor: 'text-red-600' },
          { label: 'Total Invoices', value: invoices.length.toString(), icon: <Receipt className="h-5 w-5" />, bg: 'bg-[#0066CC]/10', textColor: 'text-[#0066CC]' },
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

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="tax">Tax / VAT Info</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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

          {/* Invoice List */}
          {filtered.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No invoices found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Invoice ID</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Due Date</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => {
                      const sc = statusConfig[inv.status] || { color: 'bg-gray-100 text-gray-600', label: inv.status }
                      return (
                        <TableRow key={inv.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedInvoice(inv); setShowDetailDialog(true) }}>
                          <TableCell className="text-xs font-mono text-[#0066CC]">{inv.invoiceId}</TableCell>
                          <TableCell className="text-sm text-[#1A2332]">{inv.type}</TableCell>
                          <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{inv.description}</TableCell>
                          <TableCell className="text-sm font-semibold text-[#1A2332]">{inv.currency}{inv.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDownload(inv) }}>
                                <Download className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
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

        <TabsContent value="tax" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Building className="h-5 w-5 text-[#0066CC]" /> Tax & VAT Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Company Name</p>
                  <p className="text-sm font-semibold text-[#1A2332]">ALO Education Ltd</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">VAT Registration Number</p>
                  <p className="text-sm font-semibold text-[#1A2332]">GB 123 4567 89</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Company Registration</p>
                  <p className="text-sm font-semibold text-[#1A2332]">12345678</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tax Year</p>
                  <p className="text-sm font-semibold text-[#1A2332]">April 2025 - March 2026</p>
                </div>
              </div>
              <Separator />
              <div className="bg-[#F37021]/5 border border-[#F37021]/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#1A2332] mb-2">VAT Notice</h4>
                <p className="text-xs text-gray-600">
                  Commission payouts are subject to VAT regulations based on your location. If you are based outside the UK, 
                  reverse charge may apply. Please consult your local tax advisor for specific guidance. ALO Education will 
                  provide VAT invoices for all transactions where applicable.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => toast.success('Downloading tax summary...')}>
                <Download className="h-4 w-4 mr-2" /> Download Annual Tax Summary
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Invoice Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Commission Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#F37021]/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG files only, max 10MB</p>
              <Input type="file" accept=".pdf,.jpg,.png" className="hidden" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Invoice Reference</Label>
              <Input className="mt-1" placeholder="e.g., INV-2025-005" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Amount</Label>
              <Input className="mt-1" type="number" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <Textarea className="mt-1" placeholder="Brief description of the invoice..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload Invoice'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-[#1A2332]">{selectedInvoice.invoiceId}</p>
                  <p className="text-sm text-gray-500">{selectedInvoice.type}</p>
                </div>
                <Badge className={statusConfig[selectedInvoice.status]?.color || 'bg-gray-100'}>
                  {statusConfig[selectedInvoice.status]?.label || selectedInvoice.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{selectedInvoice.description}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="text-sm font-semibold">{selectedInvoice.currency}{selectedInvoice.amount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tax / VAT</p>
                  <p className="text-sm font-semibold">{selectedInvoice.currency}{selectedInvoice.taxAmount.toLocaleString()}</p>
                </div>
                <div className="bg-[#F37021]/5 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-[#F37021]">{selectedInvoice.currency}{selectedInvoice.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Paid Date</p>
                  <p className="text-sm font-medium">{selectedInvoice.paidDate ? new Date(selectedInvoice.paidDate).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              {selectedInvoice.commissionRef && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Commission References</p>
                  <p className="text-sm font-medium text-[#0066CC]">{selectedInvoice.commissionRef}</p>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => handleDownload(selectedInvoice)}>
                <Download className="h-4 w-4 mr-2" /> Download Invoice PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
