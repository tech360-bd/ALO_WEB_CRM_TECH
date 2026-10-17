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
  Plus, Search, Edit, Trash2, Eye, Calendar, Save, Filter,
  BookOpen, Tag, User, Globe, Clock, ChevronRight, CheckCircle, XCircle, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

const BRAND = { orange: '#F37021', navy: '#1A2332', blue: '#0066CC' }

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featuredImage: string | null
  category: string | null
  tags: string | null
  authorId: string | null
  status: string
  publishedAt: string | null
  seoTitle: string | null
  seoDescription: string | null
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-700',
}

const blogCategories = ['Study Abroad', 'Scholarships', 'Visa Guide', 'University Reviews', 'IELTS Tips', 'Student Life', 'Career', 'Country Guide']

export default function CMSBlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<{name: string; count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', featuredImage: '', category: '',
    tags: '', authorId: '', status: 'draft', seoTitle: '', seoDescription: '',
  })

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`/api/blog?${params}`)
      const data = await res.json()
      setPosts(data.posts || [])
      setCategories(data.categories || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, categoryFilter])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const openCreate = () => {
    setIsCreating(true)
    setEditPost(null)
    setFormData({ title: '', slug: '', excerpt: '', content: '', featuredImage: '', category: '', tags: '', authorId: '', status: 'draft', seoTitle: '', seoDescription: '' })
    setTagInput('')
    setShowDialog(true)
  }

  const openEdit = (post: BlogPost) => {
    setIsCreating(false)
    setEditPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      featuredImage: post.featuredImage || '',
      category: post.category || '',
      tags: post.tags || '',
      authorId: post.authorId || '',
      status: post.status,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
    })
    setTagInput(post.tags || '')
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.title) { toast.error('Title is required'); return }
      const body = { ...formData, tags: tagInput }
      if (isCreating) {
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Blog post created successfully')
      } else if (editPost) {
        const res = await fetch('/api/blog', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editPost.id, ...body }),
        })
        if (!res.ok) throw new Error()
        toast.success('Blog post updated successfully')
      }
      setShowDialog(false)
      fetchPosts()
    } catch {
      toast.error('Failed to save blog post')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return
    try {
      await fetch(`/api/blog?id=${id}`, { method: 'DELETE' })
      toast.success('Post deleted')
      fetchPosts()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleStatusChange = async (post: BlogPost, newStatus: string) => {
    try {
      await fetch('/api/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, status: newStatus, publishedAt: newStatus === 'published' ? new Date().toISOString() : undefined }),
      })
      toast.success(`Post ${newStatus}`)
      fetchPosts()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    archived: posts.filter(p => p.status === 'archived').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>Blog Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create, edit, and manage blog posts</p>
        </div>
        <Button onClick={openCreate} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Posts', value: stats.total, color: BRAND.navy, icon: BookOpen },
          { label: 'Published', value: stats.published, color: '#22c55e', icon: CheckCircle },
          { label: 'Drafts', value: stats.draft, color: '#f59e0b', icon: Edit },
          { label: 'Archived', value: stats.archived, color: '#ef4444', icon: Trash2 },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: s.color + '15' }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
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
              <Input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.name} value={c.name!}>{c.name} ({c.count})</SelectItem>)}
                {blogCategories.filter(c => !categories.some(ec => ec.name === c)).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent', borderWidth: 3 }} />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3" />
              <p>No blog posts found</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map(post => (
                    <TableRow key={post.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.featuredImage && (
                            <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                              <img src={post.featuredImage} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm" style={{ color: BRAND.navy }}>{post.title}</p>
                            <p className="text-xs text-gray-400">/{post.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{post.category || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[post.status] || 'bg-gray-100 text-gray-700'}>{post.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(post.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {post.status === 'draft' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(post, 'published')} className="h-7 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" /> Publish
                            </Button>
                          )}
                          {post.status === 'published' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(post, 'archived')} className="h-7 text-xs text-red-600">
                              <XCircle className="h-3 w-3 mr-1" /> Archive
                            </Button>
                          )}
                          {post.status === 'archived' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(post, 'draft')} className="h-7 text-xs text-gray-600">
                              <RotateCcw className="h-3 w-3 mr-1" /> Restore
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEdit(post)} className="h-7"><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(post.id)} className="h-7 text-red-500"><Trash2 className="h-3 w-3" /></Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle style={{ color: BRAND.navy }}>{isCreating ? 'Create New Post' : 'Edit Post'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={e => {
                    const t = e.target.value
                    setFormData(prev => ({ ...prev, title: t, slug: isCreating ? generateSlug(t) : prev.slug }))
                  }} placeholder="Blog post title" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <div className="flex gap-2">
                    <Input value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="post-url-slug" />
                    <Button variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(formData.title) }))}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Excerpt</Label>
                <Textarea value={formData.excerpt} onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} rows={2} placeholder="Brief summary of the post" />
              </div>

              <div>
                <Label>Content</Label>
                <div className="border rounded-md">
                  <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 font-bold" onClick={() => setFormData(prev => ({ ...prev, content: `<strong>${prev.content}</strong>` }))}>B</Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 italic" onClick={() => setFormData(prev => ({ ...prev, content: `<em>${prev.content}</em>` }))}>I</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFormData(prev => ({ ...prev, content: `<h2>Heading</h2>\n${prev.content}` }))}>H2</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFormData(prev => ({ ...prev, content: `<blockquote>Quote</blockquote>\n${prev.content}` }))}>Quote</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFormData(prev => ({ ...prev, content: `<ul><li>Item</li></ul>\n${prev.content}` }))}>List</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFormData(prev => ({ ...prev, content: `<a href="#">Link</a>\n${prev.content}` }))}>Link</Button>
                  </div>
                  <Textarea value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} rows={12} className="border-0 font-mono text-sm" placeholder="Write your blog post content here..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category || '_none'} onValueChange={v => setFormData(prev => ({ ...prev, category: v === '_none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No Category</SelectItem>
                      {blogCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div>
                <Label>Tags</Label>
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="tag1, tag2, tag3" />
              </div>

              <div>
                <Label>Featured Image URL</Label>
                <Input value={formData.featuredImage} onChange={e => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))} placeholder="https://..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SEO Title</Label>
                  <Input value={formData.seoTitle} onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))} placeholder="SEO title" />
                  <p className="text-xs text-gray-400 mt-1">{formData.seoTitle.length}/60 characters</p>
                </div>
                <div>
                  <Label>SEO Description</Label>
                  <Textarea value={formData.seoDescription} onChange={e => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))} rows={2} placeholder="SEO description" />
                  <p className="text-xs text-gray-400 mt-1">{formData.seoDescription.length}/160 characters</p>
                </div>
              </div>

              {/* Approval Workflow */}
              <Card className="bg-gray-50 border">
                <CardContent className="p-3">
                  <p className="text-xs font-medium mb-2" style={{ color: BRAND.navy }}>Approval Workflow</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Author Writes</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Editor Reviews</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Admin Publishes</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
              <Save className="h-4 w-4 mr-2" /> {isCreating ? 'Create Post' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
