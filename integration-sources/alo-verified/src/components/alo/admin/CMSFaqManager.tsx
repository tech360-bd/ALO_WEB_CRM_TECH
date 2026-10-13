'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Search, Edit, Trash2, HelpCircle, ArrowUp, ArrowDown,
  Save, CheckCircle, XCircle, Download, Upload, GripVertical
} from 'lucide-react'
import { toast } from 'sonner'

const BRAND = { orange: '#F37021', navy: '#1A2332', blue: '#0066CC' }

interface Faq {
  id: string
  question: string
  answer: string
  category: string | null
  orderNum: number
  status: string
}

const faqCategories = ['General', 'Admissions', 'Visa', 'Scholarships', 'IELTS', 'Accommodation', 'Fees', 'Applications']

export default function CMSFaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [faqCategories, setFaqCategories] = useState<{name: string; count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editFaq, setEditFaq] = useState<Faq | null>(null)
  const [formData, setFormData] = useState({
    question: '', answer: '', category: '', orderNum: 0, status: 'active',
  })

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/faqs?${params}`)
      const data = await res.json()
      setFaqs(data.faqs || [])
      setFaqCategories(data.categories || [])
    } catch {
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter])

  useEffect(() => { fetchFaqs() }, [fetchFaqs])

  const openCreate = () => {
    setIsCreating(true)
    setEditFaq(null)
    setFormData({ question: '', answer: '', category: '', orderNum: faqs.length + 1, status: 'active' })
    setShowDialog(true)
  }

  const openEdit = (faq: Faq) => {
    setIsCreating(false)
    setEditFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      orderNum: faq.orderNum,
      status: faq.status,
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.question || !formData.answer) { toast.error('Question and answer are required'); return }
      if (isCreating) {
        const res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error()
        toast.success('FAQ created')
      } else if (editFaq) {
        const res = await fetch('/api/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editFaq.id, ...formData }),
        })
        if (!res.ok) throw new Error()
        toast.success('FAQ updated')
      }
      setShowDialog(false)
      fetchFaqs()
    } catch {
      toast.error('Failed to save FAQ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' })
      toast.success('FAQ deleted')
      fetchFaqs()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleStatusToggle = async (faq: Faq) => {
    const newStatus = faq.status === 'active' ? 'inactive' : 'active'
    try {
      await fetch('/api/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faq.id, status: newStatus }),
      })
      toast.success(`FAQ ${newStatus === 'active' ? 'published' : 'unpublished'}`)
      fetchFaqs()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleReorder = async (faq: Faq, direction: 'up' | 'down') => {
    const sortedFaqs = [...faqs].sort((a, b) => a.orderNum - b.orderNum)
    const idx = sortedFaqs.findIndex(f => f.id === faq.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sortedFaqs.length - 1)) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const swapFaq = sortedFaqs[swapIdx]

    try {
      await Promise.all([
        fetch('/api/faqs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: faq.id, orderNum: swapFaq.orderNum }) }),
        fetch('/api/faqs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swapFaq.id, orderNum: faq.orderNum }) }),
      ])
      toast.success('Order updated')
      fetchFaqs()
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const handleBulkImport = () => {
    const csv = prompt('Paste CSV data (format: question,answer,category):')
    if (!csv) return

    const lines = csv.split('\n').filter(l => l.trim())
    let imported = 0

    Promise.all(
      lines.map(async line => {
        const parts = line.split(',').map(s => s.trim())
        if (parts.length >= 2) {
          try {
            await fetch('/api/faqs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question: parts[0],
                answer: parts[1],
                category: parts[2] || '',
                status: 'active',
              }),
            })
            imported++
          } catch { /* skip */ }
        }
      })
    ).then(() => {
      toast.success(`${imported} FAQ(s) imported`)
      fetchFaqs()
    })
  }

  const handleExport = () => {
    const csv = [
      'question,answer,category,status,order',
      ...faqs.map(f => `"${f.question}","${f.answer}","${f.category || ''}","${f.status}",${f.orderNum}`)
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faqs_export.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('FAQs exported')
  }

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const cat = faq.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(faq)
    return acc
  }, {} as Record<string, Faq[]>)

  const stats = {
    total: faqs.length,
    active: faqs.filter(f => f.status === 'active').length,
    inactive: faqs.filter(f => f.status === 'inactive').length,
    categories: Object.keys(groupedFaqs).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>FAQ Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage frequently asked questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkImport}>
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button onClick={openCreate} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> Add FAQ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total FAQs', value: stats.total, color: BRAND.navy },
          { label: 'Published', value: stats.active, color: '#22c55e' },
          { label: 'Unpublished', value: stats.inactive, color: '#ef4444' },
          { label: 'Categories', value: stats.categories, color: BRAND.blue },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search FAQs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {faqCategories.map(c => <SelectItem key={c.name} value={c.name!}>{c.name} ({c.count})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List by Category */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent', borderWidth: 3 }} />
        </div>
      ) : faqs.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">No FAQs found</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-4">
            {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <Card key={category} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: BRAND.orange, color: 'white' }}>{category}</Badge>
                    <span className="text-xs text-gray-400">{categoryFaqs.length} items</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">Order</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryFaqs.sort((a, b) => a.orderNum - b.orderNum).map(faq => (
                        <TableRow key={faq.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleReorder(faq, 'up')}>
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-gray-500 w-4">{faq.orderNum}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleReorder(faq, 'down')}>
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm" style={{ color: BRAND.navy }}>{faq.question}</TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-xs truncate">{faq.answer}</TableCell>
                          <TableCell>
                            <Badge className={faq.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {faq.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleStatusToggle(faq)} className="h-7">
                                {faq.status === 'active' ? <XCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(faq)} className="h-7">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(faq.id)} className="h-7 text-red-500">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: BRAND.navy }}>{isCreating ? 'Add FAQ' : 'Edit FAQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input value={formData.question} onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))} placeholder="Enter the question" />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea value={formData.answer} onChange={e => setFormData(prev => ({ ...prev, answer: e.target.value }))} rows={4} placeholder="Enter the answer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category || '_none'} onValueChange={v => setFormData(prev => ({ ...prev, category: v === '_none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No Category</SelectItem>
                    {faqCategories.map(c => <SelectItem key={c.name} value={c.name!}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Order Number</Label>
              <Input type="number" value={formData.orderNum} onChange={e => setFormData(prev => ({ ...prev, orderNum: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
              <Save className="h-4 w-4 mr-2" /> {isCreating ? 'Create FAQ' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
