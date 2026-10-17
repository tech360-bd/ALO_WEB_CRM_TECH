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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Search, Edit, Trash2, Star, Save, CheckCircle, XCircle,
  MessageSquare, Award, Globe, Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

const BRAND = { orange: '#F37021', navy: '#1A2332', blue: '#0066CC' }

interface Testimonial {
  id: string
  studentName: string
  university: string | null
  country: string | null
  quote: string
  photoUrl: string | null
  rating: number
  status: string
  createdAt: string
}

interface SuccessStory {
  id: string
  studentName: string
  university: string | null
  course: string | null
  country: string | null
  story: string | null
  photoUrl: string | null
  videoUrl: string | null
  status: string
  createdAt: string
}

export default function CMSTestimonialManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('testimonials')

  // Testimonial form
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [isCreatingTest, setIsCreatingTest] = useState(false)
  const [editTest, setEditTest] = useState<Testimonial | null>(null)
  const [testForm, setTestForm] = useState({
    studentName: '', university: '', country: '', quote: '', photoUrl: '', rating: 5, status: 'active',
  })

  // Story form
  const [showStoryDialog, setShowStoryDialog] = useState(false)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  const [editStory, setEditStory] = useState<SuccessStory | null>(null)
  const [storyForm, setStoryForm] = useState({
    studentName: '', university: '', course: '', country: '', story: '', photoUrl: '', videoUrl: '', status: 'active',
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [testRes, storyRes] = await Promise.all([
        fetch(`/api/testimonials?status=${statusFilter !== 'all' ? statusFilter : ''}&search=${search}`),
        fetch(`/api/success-stories?status=${statusFilter !== 'all' ? statusFilter : ''}&search=${search}`),
      ])
      const testData = await testRes.json()
      const storyData = await storyRes.json()
      setTestimonials(testData.testimonials || [])
      setStories(storyData.stories || [])
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Testimonial CRUD
  const openCreateTest = () => {
    setIsCreatingTest(true)
    setEditTest(null)
    setTestForm({ studentName: '', university: '', country: '', quote: '', photoUrl: '', rating: 5, status: 'active' })
    setShowTestDialog(true)
  }

  const openEditTest = (t: Testimonial) => {
    setIsCreatingTest(false)
    setEditTest(t)
    setTestForm({
      studentName: t.studentName, university: t.university || '', country: t.country || '',
      quote: t.quote, photoUrl: t.photoUrl || '', rating: t.rating, status: t.status,
    })
    setShowTestDialog(true)
  }

  const saveTest = async () => {
    try {
      if (!testForm.studentName || !testForm.quote) { toast.error('Name and quote are required'); return }
      if (isCreatingTest) {
        const res = await fetch('/api/testimonials', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm),
        })
        if (!res.ok) throw new Error()
        toast.success('Testimonial created')
      } else if (editTest) {
        const res = await fetch('/api/testimonials', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTest.id, ...testForm }),
        })
        if (!res.ok) throw new Error()
        toast.success('Testimonial updated')
      }
      setShowTestDialog(false)
      fetchData()
    } catch { toast.error('Failed to save') }
  }

  const deleteTest = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    try {
      await fetch(`/api/testimonials?id=${id}`, { method: 'DELETE' })
      toast.success('Deleted')
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const toggleTestStatus = async (t: Testimonial) => {
    try {
      await fetch('/api/testimonials', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, status: t.status === 'active' ? 'inactive' : 'active' }),
      })
      toast.success('Status updated')
      fetchData()
    } catch { toast.error('Failed to update') }
  }

  // Story CRUD
  const openCreateStory = () => {
    setIsCreatingStory(true)
    setEditStory(null)
    setStoryForm({ studentName: '', university: '', course: '', country: '', story: '', photoUrl: '', videoUrl: '', status: 'active' })
    setShowStoryDialog(true)
  }

  const openEditStory = (s: SuccessStory) => {
    setIsCreatingStory(false)
    setEditStory(s)
    setStoryForm({
      studentName: s.studentName, university: s.university || '', course: s.course || '',
      country: s.country || '', story: s.story || '', photoUrl: s.photoUrl || '', videoUrl: s.videoUrl || '', status: s.status,
    })
    setShowStoryDialog(true)
  }

  const saveStory = async () => {
    try {
      if (!storyForm.studentName) { toast.error('Student name is required'); return }
      if (isCreatingStory) {
        const res = await fetch('/api/success-stories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(storyForm),
        })
        if (!res.ok) throw new Error()
        toast.success('Success story created')
      } else if (editStory) {
        const res = await fetch('/api/success-stories', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editStory.id, ...storyForm }),
        })
        if (!res.ok) throw new Error()
        toast.success('Success story updated')
      }
      setShowStoryDialog(false)
      fetchData()
    } catch { toast.error('Failed to save') }
  }

  const deleteStory = async (id: string) => {
    if (!confirm('Delete this story?')) return
    try {
      await fetch(`/api/success-stories?id=${id}`, { method: 'DELETE' })
      toast.success('Deleted')
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const toggleStoryStatus = async (s: SuccessStory) => {
    try {
      await fetch('/api/success-stories', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, status: s.status === 'active' ? 'inactive' : 'active' }),
      })
      toast.success('Status updated')
      fetchData()
    } catch { toast.error('Failed to update') }
  }

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  )

  const testStats = {
    total: testimonials.length,
    active: testimonials.filter(t => t.status === 'active').length,
    featured: testimonials.filter(t => t.rating >= 5).length,
  }

  const storyStats = {
    total: stories.length,
    active: stories.filter(s => s.status === 'active').length,
    withVideo: stories.filter(s => s.videoUrl).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>Testimonials & Success Stories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student testimonials and success stories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCreateTest}>
            <MessageSquare className="h-4 w-4 mr-2" /> Add Testimonial
          </Button>
          <Button onClick={openCreateStory} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
            <Award className="h-4 w-4 mr-2" /> Add Story
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold" style={{ color: BRAND.navy }}>{testStats.total}</p>
            <p className="text-xs text-gray-500">Testimonials</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-green-600">{testStats.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-yellow-600">{testStats.featured}</p>
            <p className="text-xs text-gray-500">5-Star</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold" style={{ color: BRAND.navy }}>{storyStats.total}</p>
            <p className="text-xs text-gray-500">Success Stories</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-green-600">{storyStats.active}</p>
            <p className="text-xs text-gray-500">Active Stories</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold" style={{ color: BRAND.blue }}>{storyStats.withVideo}</p>
            <p className="text-xs text-gray-500">With Video</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="testimonials">
            <MessageSquare className="h-4 w-4 mr-1" /> Testimonials ({testimonials.length})
          </TabsTrigger>
          <TabsTrigger value="stories">
            <Award className="h-4 w-4 mr-1" /> Success Stories ({stories.length})
          </TabsTrigger>
        </TabsList>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent', borderWidth: 3 }} />
            </div>
          ) : testimonials.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">No testimonials found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map(t => (
                <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.orange + '20' }}>
                        <span className="text-sm font-bold" style={{ color: BRAND.orange }}>{t.studentName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm" style={{ color: BRAND.navy }}>{t.studentName}</p>
                          <Badge className={t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {t.status}
                          </Badge>
                        </div>
                        {t.university && <p className="text-xs text-gray-500">{t.university}</p>}
                        {t.country && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Globe className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{t.country}</span>
                          </div>
                        )}
                        <div className="mt-1">{renderStars(t.rating)}</div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3 italic">&ldquo;{t.quote}&rdquo;</p>
                        <div className="flex items-center gap-1 mt-3">
                          <Button size="sm" variant="ghost" onClick={() => toggleTestStatus(t)} className="h-7">
                            {t.status === 'active' ? <XCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEditTest(t)} className="h-7">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteTest(t.id)} className="h-7 text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Success Stories Tab */}
        <TabsContent value="stories">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent', borderWidth: 3 }} />
            </div>
          ) : stories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">No success stories found</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>University</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stories.map(s => (
                        <TableRow key={s.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND.blue + '20' }}>
                                <span className="text-xs font-bold" style={{ color: BRAND.blue }}>{s.studentName.charAt(0)}</span>
                              </div>
                              <span className="font-medium text-sm" style={{ color: BRAND.navy }}>{s.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{s.university || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-500">{s.course || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-500">{s.country || '-'}</TableCell>
                          <TableCell>
                            <Badge className={s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => toggleStoryStatus(s)} className="h-7">
                                {s.status === 'active' ? <XCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEditStory(s)} className="h-7">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteStory(s.id)} className="h-7 text-red-500">
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
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Testimonial Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: BRAND.navy }}>{isCreatingTest ? 'Add Testimonial' : 'Edit Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student Name *</Label>
              <Input value={testForm.studentName} onChange={e => setTestForm(prev => ({ ...prev, studentName: e.target.value }))} placeholder="Student name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>University</Label>
                <Input value={testForm.university} onChange={e => setTestForm(prev => ({ ...prev, university: e.target.value }))} placeholder="University name" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={testForm.country} onChange={e => setTestForm(prev => ({ ...prev, country: e.target.value }))} placeholder="Country" />
              </div>
            </div>
            <div>
              <Label>Quote *</Label>
              <Textarea value={testForm.quote} onChange={e => setTestForm(prev => ({ ...prev, quote: e.target.value }))} rows={3} placeholder="Student testimonial quote" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rating</Label>
                <Select value={testForm.rating.toString()} onValueChange={v => setTestForm(prev => ({ ...prev, rating: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(r => (
                      <SelectItem key={r} value={r.toString()}>{'⭐'.repeat(r)} ({r}/5)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={testForm.status} onValueChange={v => setTestForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input value={testForm.photoUrl} onChange={e => setTestForm(prev => ({ ...prev, photoUrl: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>Cancel</Button>
            <Button onClick={saveTest} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
              <Save className="h-4 w-4 mr-2" /> {isCreatingTest ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Story Dialog */}
      <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: BRAND.navy }}>{isCreatingStory ? 'Add Success Story' : 'Edit Success Story'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student Name *</Label>
              <Input value={storyForm.studentName} onChange={e => setStoryForm(prev => ({ ...prev, studentName: e.target.value }))} placeholder="Student name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>University</Label>
                <Input value={storyForm.university} onChange={e => setStoryForm(prev => ({ ...prev, university: e.target.value }))} placeholder="University name" />
              </div>
              <div>
                <Label>Course</Label>
                <Input value={storyForm.course} onChange={e => setStoryForm(prev => ({ ...prev, course: e.target.value }))} placeholder="Course name" />
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <Input value={storyForm.country} onChange={e => setStoryForm(prev => ({ ...prev, country: e.target.value }))} placeholder="Country" />
            </div>
            <div>
              <Label>Story Content</Label>
              <Textarea value={storyForm.story} onChange={e => setStoryForm(prev => ({ ...prev, story: e.target.value }))} rows={5} placeholder="Write the success story..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Photo URL</Label>
                <Input value={storyForm.photoUrl} onChange={e => setStoryForm(prev => ({ ...prev, photoUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <Label>Video URL</Label>
                <Input value={storyForm.videoUrl} onChange={e => setStoryForm(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={storyForm.status} onValueChange={v => setStoryForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStoryDialog(false)}>Cancel</Button>
            <Button onClick={saveStory} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
              <Save className="h-4 w-4 mr-2" /> {isCreatingStory ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
