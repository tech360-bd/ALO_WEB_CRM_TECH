'use client'

import { useEffect, useState } from 'react'
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
import { Progress } from '@/components/ui/progress'
import {
  Receipt, Plus, Search, Download, Eye, DollarSign,
  FileText, Calendar, CheckCircle2, XCircle, Clock,
  Upload, Filter, ChevronRight, TrendingDown, Building,
  Plane, Megaphone, Monitor, HandCoins, MoreHorizontal,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid'
type ExpenseCategory = 'office' | 'marketing' | 'travel' | 'salary' | 'commission' | 'technology' | 'other'

interface ExpenseRecord {
  id: string
  category: ExpenseCategory
  amount: number
  currency: string
  description?: string
  receiptUrl?: string
  paidBy?: string
  approvedBy?: string
  status: ExpenseStatus
  date: string
  createdAt: string
  updatedAt: string
}

const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  office: { label: 'Office', icon: Building, color: 'text-blue-600', bg: 'bg-blue-100' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-100' },
  travel: { label: 'Travel', icon: Plane, color: 'text-green-600', bg: 'bg-green-100' },
  salary: { label: 'Salary', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100' },
  commission: { label: 'Commission', icon: HandCoins, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10' },
  technology: { label: 'Technology', icon: Monitor, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  other: { label: 'Other', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100' },
}

const EXPENSE_STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' },
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100' },
}

export default function FinanceExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null)

  // Add form
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('office')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formPaidBy, setFormPaidBy] = useState('')

  useEffect(() => {
    // Fetch from API or use mock data
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/payments?limit=100&type=expense')
        if (res.ok) {
          const data = await res.json()
          if (data.expenses && data.expenses.length > 0) {
            setExpenses(data.expenses)
          } else {
            setExpenses(getMockExpenses())
          }
        } else {
          setExpenses(getMockExpenses())
        }
      } catch {
        setExpenses(getMockExpenses())
      }
      finally { setLoading(false) }
    }
    fetchExpenses()
  }, [])

  const handleAddExpense = async () => {
    if (!formAmount || parseFloat(formAmount) <= 0) { toast.error('Enter a valid amount'); return }
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          category: formCategory,
          amount: parseFloat(formAmount),
          currency: 'GBP',
          description: formDescription,
          date: formDate,
          paidBy: formPaidBy || undefined,
          status: 'pending',
        }),
      })
      toast.success('Expense added successfully')
      setAddOpen(false)
      resetForm()
      setExpenses(prev => [...prev, {
        id: `exp-${Date.now()}`,
        category: formCategory,
        amount: parseFloat(formAmount),
        currency: 'GBP',
        description: formDescription,
        date: formDate,
        paidBy: formPaidBy || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
    } catch {
      toast.error('Failed to add expense')
    }
  }

  const handleApproveReject = async (expense: ExpenseRecord, action: 'approved' | 'rejected') => {
    try {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expense.id, type: 'expense', status: action, approvedBy: 'admin' }),
      })
      toast.success(`Expense ${action}`)
      setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, status: action, approvedBy: 'admin' } : e))
    } catch {
      toast.error(`Failed to ${action} expense`)
    }
  }

  const handleExport = () => {
    const headers = ['ID', 'Category', 'Amount', 'Description', 'Paid By', 'Status', 'Date']
    const rows = filteredExpenses.map(e => [
      e.id, e.category, e.amount, e.description || '-', e.paidBy || '-',
      EXPENSE_STATUS_CONFIG[e.status]?.label || e.status,
      new Date(e.date).toLocaleDateString(),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'expenses.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Expenses exported')
  }

  const resetForm = () => {
    setFormCategory('office')
    setFormAmount('')
    setFormDescription('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormPaidBy('')
  }

  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        e.description?.toLowerCase().includes(s) ||
        e.category.toLowerCase().includes(s) ||
        e.paidBy?.toLowerCase().includes(s)
      )
    }
    return true
  })

  // Summary calculations
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)
  const approvedExpenses = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0)
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)

  // Monthly summary
  const monthlyData = expenses.reduce((acc, e) => {
    const month = new Date(e.date).toLocaleString('default', { month: 'short', year: 'numeric' })
    if (!acc[month]) acc[month] = 0
    acc[month] += e.amount
    return acc
  }, {} as Record<string, number>)

  // Category breakdown
  const categoryBreakdown = (Object.entries(EXPENSE_CATEGORY_CONFIG) as [ExpenseCategory, typeof EXPENSE_CATEGORY_CONFIG[ExpenseCategory]][]).map(([cat, cfg]) => {
    const catExpenses = expenses.filter(e => e.category === cat)
    const total = catExpenses.reduce((s, e) => s + e.amount, 0)
    return { category: cat, ...cfg, total, count: catExpenses.length }
  }).filter(c => c.count > 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded animate-pulse" />)}
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
          <h1 className="text-2xl font-bold text-[#1A2332]">Finance Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage organizational expenses</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} className="border-[#F37021] text-[#F37021]">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Expenses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{pendingExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{approvedExpenses.toLocaleString()}</p>
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
              <p className="text-lg font-bold">£{paidExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(Object.entries(EXPENSE_CATEGORY_CONFIG) as [ExpenseCategory, typeof EXPENSE_CATEGORY_CONFIG[ExpenseCategory]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(Object.entries(EXPENSE_STATUS_CONFIG) as [ExpenseStatus, typeof EXPENSE_STATUS_CONFIG[ExpenseStatus]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }}>
                  <Filter className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expense Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead>
                      <TableHead>Paid By</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No expenses found</TableCell></TableRow>
                    ) : filteredExpenses.map(exp => {
                      const catCfg = EXPENSE_CATEGORY_CONFIG[exp.category]
                      const statusCfg = EXPENSE_STATUS_CONFIG[exp.status]
                      return (
                        <TableRow key={exp.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded flex items-center justify-center ${catCfg.bg}`}>
                                <catCfg.icon className={`h-3.5 w-3.5 ${catCfg.color}`} />
                              </div>
                              <span className="text-sm font-medium">{catCfg.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{exp.description || '-'}</TableCell>
                          <TableCell className="font-semibold">£{exp.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{exp.paidBy || '-'}</TableCell>
                          <TableCell><Badge className={`${statusCfg.bg} ${statusCfg.color} border-0`}>{statusCfg.label}</Badge></TableCell>
                          <TableCell className="text-sm">{new Date(exp.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {exp.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="ghost" className="text-green-600 h-8 w-8 p-0" onClick={() => handleApproveReject(exp, 'approved')}>
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600 h-8 w-8 p-0" onClick={() => handleApproveReject(exp, 'rejected')}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {exp.receiptUrl && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedExpense(exp); setReceiptOpen(true) }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Category Breakdown + Monthly Summary */}
        <div className="space-y-4">
          {/* Category Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.map(cat => {
                const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${cat.bg}`}>
                          <cat.icon className={`h-3 w-3 ${cat.color}`} />
                        </div>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </div>
                      <span className="text-sm font-semibold">£{cat.total.toLocaleString()}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-gray-400">{cat.count} items • {pct.toFixed(1)}%</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Monthly Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(monthlyData).sort().reverse().map(([month, total]) => (
                <div key={month} className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <span className="text-sm font-medium">{month}</span>
                  <span className="text-sm font-semibold">£{total.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== Add Expense Dialog ===== */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formCategory} onValueChange={v => setFormCategory(v as ExpenseCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(EXPENSE_CATEGORY_CONFIG) as [ExpenseCategory, typeof EXPENSE_CATEGORY_CONFIG[ExpenseCategory]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (£) *</Label>
                <Input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Expense description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>Paid By</Label>
                <Input value={formPaidBy} onChange={e => setFormPaidBy(e.target.value)} placeholder="Name of payer" />
              </div>
            </div>
            <div>
              <Label>Receipt Upload</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <Input type="file" className="max-w-xs mx-auto" accept=".pdf,.jpg,.png" onChange={() => toast.info('Receipt file selected')} />
              </div>
            </div>
            <Button onClick={handleAddExpense} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Receipt View Dialog ===== */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {selectedExpense && (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Category:</strong> {EXPENSE_CATEGORY_CONFIG[selectedExpense.category]?.label}</p>
                <p className="text-sm"><strong>Amount:</strong> £{selectedExpense.amount.toLocaleString()}</p>
                <p className="text-sm"><strong>Date:</strong> {new Date(selectedExpense.date).toLocaleDateString()}</p>
                <p className="text-sm"><strong>Paid By:</strong> {selectedExpense.paidBy || '-'}</p>
              </div>
              {selectedExpense.receiptUrl ? (
                <div className="border rounded-lg p-4 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <a href={selectedExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] hover:underline text-sm">
                    View Receipt Document
                  </a>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No receipt uploaded</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Mock Data ---
function getMockExpenses(): ExpenseRecord[] {
  return [
    { id: 'exp-1', category: 'office', amount: 2500, currency: 'GBP', description: 'Office rent - January', paidBy: 'ALO Education', status: 'paid', date: '2026-01-01', createdAt: '2026-01-01', updatedAt: '2026-01-15' },
    { id: 'exp-2', category: 'marketing', amount: 1500, currency: 'GBP', description: 'Facebook Ads - Student Recruitment', paidBy: 'Marketing Team', status: 'approved', date: '2026-01-15', createdAt: '2026-01-15', updatedAt: '2026-01-20' },
    { id: 'exp-3', category: 'travel', amount: 800, currency: 'GBP', description: 'Team travel to Dhaka education fair', paidBy: 'HR Department', status: 'pending', date: '2026-02-01', createdAt: '2026-02-01', updatedAt: '2026-02-01' },
    { id: 'exp-4', category: 'salary', amount: 12000, currency: 'GBP', description: 'Staff salaries - February 2026', paidBy: 'Finance', status: 'paid', date: '2026-02-28', createdAt: '2026-02-28', updatedAt: '2026-02-28' },
    { id: 'exp-5', category: 'commission', amount: 3200, currency: 'GBP', description: 'Partner commission - EduBridge Q1', paidBy: 'Finance', status: 'pending', date: '2026-03-01', createdAt: '2026-03-01', updatedAt: '2026-03-01' },
    { id: 'exp-6', category: 'technology', amount: 450, currency: 'GBP', description: 'CRM software subscription', paidBy: 'IT Department', status: 'approved', date: '2026-01-05', createdAt: '2026-01-05', updatedAt: '2026-01-10' },
    { id: 'exp-7', category: 'office', amount: 350, currency: 'GBP', description: 'Office supplies and stationery', paidBy: 'Admin', status: 'paid', date: '2026-02-10', createdAt: '2026-02-10', updatedAt: '2026-02-15' },
    { id: 'exp-8', category: 'marketing', amount: 2200, currency: 'GBP', description: 'Google Ads - UK University Campaign', paidBy: 'Marketing Team', status: 'pending', date: '2026-02-20', createdAt: '2026-02-20', updatedAt: '2026-02-20' },
    { id: 'exp-9', category: 'travel', amount: 1200, currency: 'GBP', description: 'University visit - UK trip', paidBy: 'Counselor Team', status: 'rejected', date: '2026-01-25', createdAt: '2026-01-25', updatedAt: '2026-01-30' },
    { id: 'exp-10', category: 'other', amount: 180, currency: 'GBP', description: 'Team lunch - Monthly meeting', paidBy: 'HR Department', status: 'paid', date: '2026-02-15', createdAt: '2026-02-15', updatedAt: '2026-02-16' },
  ]
}
