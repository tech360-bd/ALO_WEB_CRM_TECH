'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Eye, GraduationCap, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface University {
  id: string
  name: string
  slug: string
  country: string
  city: string
  website: string
  ranking: number
  type: string
  status: string
  scholarshipAvailable: boolean
  _count?: { courses: number; applications: number }
}

export default function CRMUniversities() {
  const [universities, setUniversities] = useState<University[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedUni, setSelectedUni] = useState<University | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', country: '', city: '', website: '', type: '', ranking: '',
    description: '', scholarshipAvailable: false, status: 'active'
  })

  useEffect(() => { fetchUniversities() }, [search, countryFilter, pagination.page])

  const fetchUniversities = async () => {
    try {
      setLoading(true)
      let url = `/api/universities?page=${pagination.page}&limit=${pagination.limit}`
      if (search) url += `&search=${search}`
      if (countryFilter && countryFilter !== 'all') url += `&country=${countryFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setUniversities(json.universities || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleAddUniversity = async () => {
    if (!form.name || !form.country) {
      toast.error('Name and country are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ranking: parseInt(form.ranking) || null })
      })
      if (res.ok) {
        toast.success('University added successfully')
        setAddDialogOpen(false)
        setForm({ name: '', country: '', city: '', website: '', type: '', ranking: '', description: '', scholarshipAvailable: false, status: 'active' })
        fetchUniversities()
      } else { toast.error('Failed to add university') }
    } catch { toast.error('Failed to add university') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Universities Management</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white"><Plus className="h-4 w-4 mr-2" /> Add University</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add University</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country *</Label><Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Website</Label><Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
                <div><Label>Ranking</Label><Input type="number" value={form.ranking} onChange={e => setForm({...form, ranking: e.target.value})} /></div>
              </div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem><SelectItem value="polytechnic">Polytechnic</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
              <Button onClick={handleAddUniversity} disabled={submitting} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">{submitting ? 'Adding...' : 'Add University'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search universities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="United Kingdom">UK</SelectItem>
                <SelectItem value="United States">USA</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Malaysia">Malaysia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : universities.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No universities found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="hidden md:table-cell">City</TableHead>
                    <TableHead className="hidden md:table-cell">Ranking</TableHead>
                    <TableHead className="hidden lg:table-cell">Courses</TableHead>
                    <TableHead className="hidden lg:table-cell">Applications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {universities.map((uni) => (
                    <TableRow key={uni.id}>
                      <TableCell>
                        <p className="font-medium">{uni.name}</p>
                        {uni.scholarshipAvailable && <Badge className="bg-green-100 text-green-700 mt-1 text-xs">Scholarship</Badge>}
                      </TableCell>
                      <TableCell className="flex items-center gap-1 text-sm"><Globe className="h-3 w-3" />{uni.country}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{uni.city || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{uni.ranking || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{uni._count?.courses || 0}</TableCell>
                      <TableCell className="hidden lg:table-cell">{uni._count?.applications || 0}</TableCell>
                      <TableCell><Badge className={uni.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{uni.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => { setSelectedUni(uni); setDetailDialogOpen(true) }}><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {universities.length} of {pagination.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>University Details</DialogTitle></DialogHeader>
          {selectedUni && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedUni.name}</h3>
                <Badge className={selectedUni.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{selectedUni.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Country</p><p className="font-medium">{selectedUni.country}</p></div>
                <div><p className="text-gray-500">City</p><p className="font-medium">{selectedUni.city || 'N/A'}</p></div>
                <div><p className="text-gray-500">Type</p><p className="font-medium capitalize">{selectedUni.type || 'N/A'}</p></div>
                <div><p className="text-gray-500">Ranking</p><p className="font-medium">{selectedUni.ranking || 'N/A'}</p></div>
                <div><p className="text-gray-500">Courses</p><p className="font-medium">{selectedUni._count?.courses || 0}</p></div>
                <div><p className="text-gray-500">Applications</p><p className="font-medium">{selectedUni._count?.applications || 0}</p></div>
                <div><p className="text-gray-500">Scholarship</p><p className="font-medium">{selectedUni.scholarshipAvailable ? 'Available' : 'Not Available'}</p></div>
                <div><p className="text-gray-500">Website</p><p className="font-medium text-[#0066CC]">{selectedUni.website || 'N/A'}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
