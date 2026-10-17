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
import { Search, Plus, Eye, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface Partner {
  id: string
  partnerId: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  country: string
  status: string
  commissionRate: number
  _count?: { students: number; applications: number; commissions: number; partnerStaff: number }
}

export default function CRMPartners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '', whatsappNumber: '',
    country: 'Bangladesh', city: '', address: '', website: '', businessType: '',
    commissionRate: '10', status: 'active', createUserAccount: true
  })

  useEffect(() => { fetchPartners() }, [search, statusFilter, pagination.page])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      let url = `/api/partners?page=${pagination.page}&limit=${pagination.limit}`
      if (search) url += `&search=${search}`
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setPartners(json.partners || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleAddPartner = async () => {
    if (!form.companyName || !form.contactPerson || !form.email) {
      toast.error('Company name, contact person, and email are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, commissionRate: parseFloat(form.commissionRate) })
      })
      if (res.ok) {
        toast.success('Partner added successfully')
        setAddDialogOpen(false)
        setForm({ companyName: '', contactPerson: '', email: '', phone: '', whatsappNumber: '', country: 'Bangladesh', city: '', address: '', website: '', businessType: '', commissionRate: '10', status: 'active', createUserAccount: true })
        fetchPartners()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to add partner')
      }
    } catch { toast.error('Failed to add partner') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Partners Management</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white"><Plus className="h-4 w-4 mr-2" /> Add Partner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Partner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name *</Label><Input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} /></div>
              <div><Label>Contact Person *</Label><Input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>WhatsApp</Label><Input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
              </div>
              <div><Label>Website</Label><Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Business Type</Label><Input value={form.businessType} onChange={e => setForm({...form, businessType: e.target.value})} /></div>
                <div><Label>Commission Rate (%)</Label><Input type="number" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: e.target.value})} /></div>
              </div>
              <Button onClick={handleAddPartner} disabled={submitting} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">{submitting ? 'Adding...' : 'Add Partner'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No partners found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Students</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-mono text-xs">{partner.partnerId}</TableCell>
                      <TableCell><p className="font-medium">{partner.companyName}</p></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">{partner.contactPerson}</p>
                        <p className="text-xs text-gray-500">{partner.email}</p>
                      </TableCell>
                      <TableCell className="text-sm">{partner.country}</TableCell>
                      <TableCell className="text-sm">{partner.commissionRate}%</TableCell>
                      <TableCell><Badge className={partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{partner.status}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell">{partner._count?.students || 0}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => { setSelectedPartner(partner); setDetailDialogOpen(true) }}><Eye className="h-4 w-4" /></Button></TableCell>
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
          <p className="text-sm text-gray-500">Showing {partners.length} of {pagination.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Partner Details</DialogTitle></DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedPartner.companyName}</h3>
                <Badge className={selectedPartner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{selectedPartner.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Partner ID</p><p className="font-medium">{selectedPartner.partnerId}</p></div>
                <div><p className="text-gray-500">Contact</p><p className="font-medium">{selectedPartner.contactPerson}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedPartner.email}</p></div>
                <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedPartner.phone || 'N/A'}</p></div>
                <div><p className="text-gray-500">Country</p><p className="font-medium">{selectedPartner.country}</p></div>
                <div><p className="text-gray-500">Commission</p><p className="font-medium">{selectedPartner.commissionRate}%</p></div>
                <div><p className="text-gray-500">Students</p><p className="font-medium">{selectedPartner._count?.students || 0}</p></div>
                <div><p className="text-gray-500">Applications</p><p className="font-medium">{selectedPartner._count?.applications || 0}</p></div>
                <div><p className="text-gray-500">Commissions</p><p className="font-medium">{selectedPartner._count?.commissions || 0}</p></div>
                <div><p className="text-gray-500">Staff</p><p className="font-medium">{selectedPartner._count?.partnerStaff || 0}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
