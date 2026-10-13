'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Plus, Search, Filter, Download, Upload, CheckCircle, XCircle, Clock, Edit, Trash2, Eye, RefreshCw, Tag, Globe, FileText, Database } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['University', 'Course', 'Visa', 'Scholarship', 'FAQ', 'General']
const SOURCES = ['manual', 'research_agent', 'official', 'web']

const CATEGORY_COLORS: Record<string, string> = {
  University: 'bg-blue-100 text-blue-700',
  Course: 'bg-purple-100 text-purple-700',
  Visa: 'bg-red-100 text-red-700',
  Scholarship: 'bg-green-100 text-green-700',
  FAQ: 'bg-yellow-100 text-yellow-700',
  General: 'bg-gray-100 text-gray-700',
}

const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-gray-100 text-gray-700',
  research_agent: 'bg-purple-100 text-purple-700',
  official: 'bg-green-100 text-green-700',
  web: 'bg-blue-100 text-blue-700',
}

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  source: string
  status: string
  tags?: string | null
  approvedBy?: string | null
  createdAt: string
  updatedAt: string
}

export default function AIKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [addDialog, setAddDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'General', source: 'manual', tags: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterSource !== 'all') params.set('source', filterSource)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/knowledge?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch knowledge:', err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterCategory, filterSource, filterStatus, page])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const addEntry = async () => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          source: form.source,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : null,
        }),
      })
      if (res.ok) {
        toast.success('Knowledge entry added')
        setAddDialog(false)
        setForm({ title: '', content: '', category: 'General', source: 'manual', tags: '' })
        fetchEntries()
      }
    } catch {
      toast.error('Failed to add entry')
    }
  }

  const updateEntry = async () => {
    if (!selectedEntry) return
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEntry.id,
          title: form.title,
          content: form.content,
          category: form.category,
          source: form.source,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : null,
        }),
      })
      if (res.ok) {
        toast.success('Entry updated')
        setEditDialog(false)
        fetchEntries()
      }
    } catch {
      toast.error('Failed to update entry')
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Entry deleted')
        fetchEntries()
      }
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  const approveEntry = async (id: string) => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved', approvedBy: 'admin' }),
      })
      if (res.ok) {
        toast.success('Entry approved')
        fetchEntries()
      }
    } catch {
      toast.error('Failed to approve entry')
    }
  }

  const rejectEntry = async (id: string) => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      })
      if (res.ok) {
        toast.success('Entry rejected')
        fetchEntries()
      }
    } catch {
      toast.error('Failed to reject entry')
    }
  }

  const openEditDialog = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry)
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      source: entry.source,
      tags: entry.tags ? JSON.parse(entry.tags).join(', ') : '',
    })
    setEditDialog(true)
  }

  const openViewDialog = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry)
    setViewDialog(true)
  }

  const exportKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge?limit=1000')
      if (res.ok) {
        const data = await res.json()
        const csv = ['Title,Content,Category,Source,Status']
        data.entries.forEach((e: KnowledgeEntry) => {
          csv.push(`"${e.title.replace(/"/g, '""')}","${e.content.replace(/"/g, '""')}","${e.category}","${e.source}","${e.status}"`)
        })
        const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'knowledge_base_export.csv'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Knowledge base exported')
      }
    } catch {
      toast.error('Failed to export')
    }
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const header = lines[0]
      const entries = []
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        if (parts && parts.length >= 3) {
          entries.push({
            title: parts[0].replace(/^"|"$/g, ''),
            content: parts[1].replace(/^"|"$/g, ''),
            category: parts[2]?.replace(/^"|"$/g, '') || 'General',
            source: parts[3]?.replace(/^"|"$/g, '') || 'manual',
          })
        }
      }
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_import', entries }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.count} entries imported`)
        setImportDialog(false)
        fetchEntries()
      }
    } catch {
      toast.error('Failed to import CSV')
    }
  }

  const pendingCount = entries.filter(e => e.status === 'pending').length
  const approvedCount = entries.filter(e => e.status === 'approved').length

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#F37021]" />
            AI Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">Manage knowledge entries for AI agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialog(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button variant="outline" onClick={exportKnowledge} className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="bg-[#F37021] hover:bg-[#e0631a] gap-2" onClick={() => {
            setForm({ title: '', content: '', category: 'General', source: 'manual', tags: '' })
            setAddDialog(true)
          }}>
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#F37021]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50"><Database className="w-5 h-5 text-[#F37021]" /></div>
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50"><Clock className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#0066CC]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Globe className="w-5 h-5 text-[#0066CC]" /></div>
              <div>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search knowledge..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={v => { setFilterSource(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No knowledge entries found</p>
                      <Button variant="link" className="text-[#F37021]" onClick={() => setAddDialog(true)}>Add your first entry</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map(entry => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{entry.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{entry.content}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[entry.category] || ''}`}>
                          {entry.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[entry.source] || ''}`}>
                          {entry.source.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'approved' ? 'default' : entry.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openViewDialog(entry)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(entry)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          {entry.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => approveEntry(entry.id)}>
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => rejectEntry(entry.id)}>
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#F37021]" />
              Add Knowledge Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input placeholder="Enter title..." value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Content *</label>
              <Textarea placeholder="Enter knowledge content..." value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))} className="min-h-[150px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={form.source} onValueChange={v => setForm(prev => ({ ...prev, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input placeholder="e.g. UK, visa, student" value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button className="bg-[#F37021] hover:bg-[#e0631a]" onClick={addEntry} disabled={!form.title || !form.content}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#0066CC]" />
              Edit Knowledge Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))} className="min-h-[150px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={form.source} onValueChange={v => setForm(prev => ({ ...prev, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button className="bg-[#F37021] hover:bg-[#e0631a]" onClick={updateEntry}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0066CC]" />
              {selectedEntry?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={CATEGORY_COLORS[selectedEntry.category] || ''}>{selectedEntry.category}</Badge>
                <Badge variant="outline" className={SOURCE_COLORS[selectedEntry.source] || ''}>{selectedEntry.source.replace('_', ' ')}</Badge>
                <Badge variant={selectedEntry.status === 'approved' ? 'default' : 'secondary'}>{selectedEntry.status}</Badge>
              </div>
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedEntry.content}</p>
              </div>
              {selectedEntry.tags && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(selectedEntry.tags).map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                <p>Created: {new Date(selectedEntry.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedEntry.updatedAt).toLocaleString()}</p>
                {selectedEntry.approvedBy && <p>Approved by: {selectedEntry.approvedBy}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#F37021]" />
              Import from CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: Title, Content, Category, Source
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Click to select a CSV file</p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
