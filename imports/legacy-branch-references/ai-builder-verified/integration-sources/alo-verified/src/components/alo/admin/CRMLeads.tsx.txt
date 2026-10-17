'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Search, Plus, Filter, Eye, ArrowRight, Target, Phone, Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface Lead {
  id: string
  leadId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  whatsappNumber: string
  source: string
  status: string
  temperature: string
  preferredCountry: string
  preferredCourse: string
  notes: string
  nextFollowUp: string
  createdAt: string
  counselor?: { id: string; firstName: string; lastName: string; employeeId: string }
  notes_relation?: Array<{ id: string; note: string; createdAt: string }>
}

export default function CRMLeads() {
  const { currentUser } = useAppStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '',
    source: 'website', preferredCountry: '', preferredCourse: '', preferredIntake: '',
    notes: '', temperature: 'warm', assignedTo: ''
  })

  useEffect(() => { fetchLeads() }, [search, statusFilter, sourceFilter, pagination.page])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      let url = `/api/leads?page=${pagination.page}&limit=${pagination.limit}`
      if (search) url += `&search=${search}`
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`
      if (sourceFilter && sourceFilter !== 'all') url += `&source=${sourceFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setLeads(json.leads || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLead = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error('First name and last name are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        toast.success('Lead added successfully')
        setAddDialogOpen(false)
        setForm({ firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '', source: 'website', preferredCountry: '', preferredCourse: '', preferredIntake: '', notes: '', temperature: 'warm', assignedTo: '' })
        fetchLeads()
      } else {
        toast.error('Failed to add lead')
      }
    } catch {
      toast.error('Failed to add lead')
    } finally {
      setSubmitting(false)
    }
  }

  const viewLeadDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setDetailDialogOpen(true)
  }

  const convertToStudent = (lead: Lead) => {
    toast.success(`Lead ${lead.firstName} ${lead.lastName} converted to student!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'contacted': return 'bg-amber-100 text-amber-700'
      case 'qualified': return 'bg-green-100 text-green-700'
      case 'enrolled': return 'bg-purple-100 text-purple-700'
      case 'lost': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Leads Management</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} /></div>
                <div>
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={v => setForm({...form, source: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preferred Country</Label><Input value={form.preferredCountry} onChange={e => setForm({...form, preferredCountry: e.target.value})} /></div>
                <div><Label>Preferred Course</Label><Input value={form.preferredCourse} onChange={e => setForm({...form, preferredCourse: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Temperature</Label>
                  <Select value={form.temperature} onValueChange={v => setForm({...form, temperature: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">🔥 Hot</SelectItem>
                      <SelectItem value="warm">🌤 Warm</SelectItem>
                      <SelectItem value="cold">❄️ Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Preferred Intake</Label><Input value={form.preferredIntake} onChange={e => setForm({...form, preferredIntake: e.target.value})} placeholder="e.g., Sep 2025" /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
              <Button onClick={handleAddLead} disabled={submitting} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">
                {submitting ? 'Adding...' : 'Add Lead'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Temperature</TableHead>
                    <TableHead className="hidden lg:table-cell">Counselor</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-mono text-xs">{lead.leadId}</TableCell>
                      <TableCell>
                        <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-gray-500 hidden md:block">{lead.preferredCountry || '—'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {lead.email && <span className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                          {lead.phone && <span className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{lead.source}</Badge></TableCell>
                      <TableCell><Badge className={getStatusColor(lead.status)}>{lead.status}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell capitalize">{lead.temperature}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {lead.counselor ? `${lead.counselor.firstName} ${lead.counselor.lastName}` : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewLeadDetail(lead)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => convertToStudent(lead)} title="Convert to Student"><ArrowRight className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {leads.length} of {pagination.total} leads</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</Button>
          </div>
        </div>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedLead.firstName} {selectedLead.lastName}</h3>
                <Badge className={getStatusColor(selectedLead.status)}>{selectedLead.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Lead ID</p><p className="font-medium">{selectedLead.leadId}</p></div>
                <div><p className="text-gray-500">Source</p><p className="font-medium capitalize">{selectedLead.source}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedLead.email || 'N/A'}</p></div>
                <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedLead.phone || 'N/A'}</p></div>
                <div><p className="text-gray-500">Country</p><p className="font-medium">{selectedLead.preferredCountry || 'N/A'}</p></div>
                <div><p className="text-gray-500">Course</p><p className="font-medium">{selectedLead.preferredCourse || 'N/A'}</p></div>
                <div><p className="text-gray-500">Temperature</p><p className="font-medium capitalize">{selectedLead.temperature}</p></div>
                <div><p className="text-gray-500">Counselor</p><p className="font-medium">{selectedLead.counselor ? `${selectedLead.counselor.firstName} ${selectedLead.counselor.lastName}` : 'Unassigned'}</p></div>
              </div>
              {selectedLead.notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm">{selectedLead.notes}</p>
                </div>
              )}
              {selectedLead.notes_relation && selectedLead.notes_relation.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Notes History</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedLead.notes_relation.map((note: any) => (
                      <div key={note.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p>{note.note}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => convertToStudent(selectedLead)} className="flex-1 bg-[#F37021] hover:bg-[#e06010] text-white">
                  <ArrowRight className="h-4 w-4 mr-2" /> Convert to Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
