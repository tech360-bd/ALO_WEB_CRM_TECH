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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus, Search, Edit, Trash2, Eye, FileText, Globe, Save, Calendar,
  Clock, CheckCircle, XCircle, ChevronRight, ArrowLeft, Copy, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

const BRAND = { orange: '#F37021', navy: '#1A2332', blue: '#0066CC' }

interface CMSPage {
  id: string
  title: string
  slug: string
  content: string | null
  metaTitle: string | null
  metaDescription: string | null
  template: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-700',
}

const templates = ['default', 'landing', 'full-width', 'sidebar', 'blog']

export default function CMSPageEditor() {
  const [pages, setPages] = useState<CMSPage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editPage, setEditPage] = useState<CMSPage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '', slug: '', content: '', metaTitle: '', metaDescription: '', template: 'default', status: 'draft',
  })
  const [showRevisions, setShowRevisions] = useState(false)

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/pages?${params}`)
      const data = await res.json()
      setPages(data.pages || [])
    } catch {
      toast.error('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchPages() }, [fetchPages])

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const openCreate = () => {
    setIsCreating(true)
    setEditPage(null)
    setFormData({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '', template: 'default', status: 'draft' })
    setShowDialog(true)
  }

  const openEdit = (page: CMSPage) => {
    setIsCreating(false)
    setEditPage(page)
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      template: page.template || 'default',
      status: page.status,
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.title) { toast.error('Title is required'); return }
      if (isCreating) {
        const res = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error()
        toast.success('Page created successfully')
      } else if (editPage) {
        const res = await fetch('/api/pages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editPage.id, ...formData }),
        })
        if (!res.ok) throw new Error()
        toast.success('Page updated successfully')
      }
      setShowDialog(false)
      fetchPages()
    } catch {
      toast.error('Failed to save page')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return
    try {
      await fetch(`/api/pages?id=${id}`, { method: 'DELETE' })
      toast.success('Page deleted')
      fetchPages()
    } catch {
      toast.error('Failed to delete page')
    }
  }

  const handleStatusChange = async (page: CMSPage, newStatus: string) => {
    try {
      await fetch('/api/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: page.id, status: newStatus }),
      })
      toast.success(`Page ${newStatus}`)
      fetchPages()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(`/ ${slug}`)
    toast.success('URL copied to clipboard')
  }

  // Stats
  const stats = {
    total: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft: pages.filter(p => p.status === 'draft').length,
    archived: pages.filter(p => p.status === 'archived').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>CMS Page Editor</h1>
          <p className="text-gray-500 text-sm mt-1">Manage website pages, content, and SEO</p>
        </div>
        <Button onClick={openCreate} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> New Page
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pages', value: stats.total, color: BRAND.navy },
          { label: 'Published', value: stats.published, color: '#22c55e' },
          { label: 'Draft', value: stats.draft, color: '#f59e0b' },
          { label: 'Archived', value: stats.archived, color: '#ef4444' },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
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
              <Input placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg" style={{ color: BRAND.navy }}>Pages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent', borderWidth: 3 }} />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3" />
              <p>No pages found</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map(page => (
                    <TableRow key={page.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium" style={{ color: BRAND.navy }}>{page.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">/{page.slug}</span>
                          <Copy className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => copySlug(page.slug)} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[page.status] || 'bg-gray-100 text-gray-700'}>{page.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{page.template || 'default'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(page.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {page.status === 'draft' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(page, 'published')} className="h-7 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" /> Publish
                            </Button>
                          )}
                          {page.status === 'published' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(page, 'archived')} className="h-7 text-xs text-red-600">
                              <XCircle className="h-3 w-3 mr-1" /> Archive
                            </Button>
                          )}
                          {page.status === 'archived' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(page, 'draft')} className="h-7 text-xs text-gray-600">
                              <RotateCcw className="h-3 w-3 mr-1" /> Restore
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEdit(page)} className="h-7">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(page.id)} className="h-7 text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle style={{ color: BRAND.navy }}>{isCreating ? 'Create New Page' : 'Edit Page'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={e => {
                    const title = e.target.value
                    setFormData(prev => ({ ...prev, title, slug: isCreating ? generateSlug(title) : prev.slug }))
                  }} placeholder="Page title" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <div className="flex gap-2">
                    <Input value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="page-url-slug" />
                    <Button variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(formData.title) }))}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Content</Label>
                  <div className="border rounded-md">
                    <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                        setFormData(prev => ({ ...prev, content: `<strong>${prev.content}</strong>` }))
                      }}><strong>B</strong></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 italic" onClick={() => {
                        setFormData(prev => ({ ...prev, content: `<em>${prev.content}</em>` }))
                      }}><i>I</i></Button>
                      <Separator orientation="vertical" className="h-5" />
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                        setFormData(prev => ({ ...prev, content: `<h2>Heading</h2>\n${prev.content}` }))
                      }}>H2</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                        setFormData(prev => ({ ...prev, content: `<h3>Subheading</h3>\n${prev.content}` }))
                      }}>H3</Button>
                      <Separator orientation="vertical" className="h-5" />
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                        setFormData(prev => ({ ...prev, content: `<ul><li>Item</li></ul>\n${prev.content}` }))
                      }}>List</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                        setFormData(prev => ({ ...prev, content: `<a href="#">Link</a>\n${prev.content}` }))
                      }}>Link</Button>
                    </div>
                    <Textarea value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} rows={15} className="border-0 font-mono text-sm" placeholder="Page content (HTML supported)" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div>
                <Label>Meta Title</Label>
                <Input value={formData.metaTitle} onChange={e => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))} placeholder="SEO meta title" />
                <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60 characters</p>
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea value={formData.metaDescription} onChange={e => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))} rows={3} placeholder="SEO meta description" />
                <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160 characters</p>
              </div>
              <Card className="bg-gray-50 border">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Search Preview</p>
                  <p className="text-blue-700 text-sm font-medium truncate">{formData.metaTitle || formData.title || 'Page Title'}</p>
                  <p className="text-green-700 text-xs">aloeducation.com/{formData.slug || 'page-slug'}</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{formData.metaDescription || 'No description provided'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template</Label>
                  <Select value={formData.template} onValueChange={v => setFormData(prev => ({ ...prev, template: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Approval Workflow */}
              <Card className="bg-gray-50 border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm" style={{ color: BRAND.navy }}>Approval Workflow</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700">
                      <FileText className="h-3 w-3" /> Author Creates
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                      <Eye className="h-3 w-3" /> Editor Reviews
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3" /> Admin Publishes
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revision History */}
              <Card className="bg-gray-50 border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm" style={{ color: BRAND.navy }}>Revision History</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowRevisions(!showRevisions)} className="h-6 text-xs">
                      {showRevisions ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </CardHeader>
                {showRevisions && (
                  <CardContent className="p-4 pt-0">
                    {editPage ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>Created: {new Date(editPage.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>Updated: {new Date(editPage.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Save page to start tracking revisions</p>
                    )}
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
              <Save className="h-4 w-4 mr-2" /> {isCreating ? 'Create Page' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
