'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Eye, ClipboardList, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Application {
  id: string
  applicationId: string
  status: string
  intake: string
  notes: string
  createdAt: string
  student?: { firstName: string; lastName: string; studentId: string; email: string }
  university?: { name: string; country: string; city: string }
  course?: { name: string; level: string; tuitionFee: number }
  counselor?: { firstName: string; lastName: string; employeeId: string }
  partner?: { companyName: string; partnerId: string }
  statusHistory?: Array<{ fromStatus: string; toStatus: string; changedAt: string; note: string }>
}

export default function CRMApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchApplications() }, [search, statusFilter, pagination.page])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      let url = `/api/applications?page=${pagination.page}&limit=${pagination.limit}`
      if (search) url += `&search=${search}`
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setApplications(json.applications || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const viewDetail = (app: Application) => {
    setSelectedApp(app)
    setDetailDialogOpen(true)
  }

  const openUpdateStatus = (app: Application) => {
    setSelectedApp(app)
    setNewStatus(app.status)
    setStatusNote('')
    setUpdateDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedApp || !newStatus) return
    try {
      setUpdating(true)
      const res = await fetch(`/api/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedApp.id, status: newStatus, note: statusNote })
      })
      if (res.ok) {
        toast.success('Application status updated')
        setUpdateDialogOpen(false)
        fetchApplications()
      } else { toast.error('Failed to update status') }
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(false) }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'submitted': return 'bg-blue-100 text-blue-700'
      case 'under_review': return 'bg-amber-100 text-amber-700'
      case 'conditional_offer': return 'bg-orange-100 text-orange-700'
      case 'unconditional_offer': return 'bg-green-100 text-green-700'
      case 'enrolled': return 'bg-emerald-100 text-emerald-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'withdrawn': return 'bg-gray-200 text-gray-600'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A2332]">Applications Management</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="conditional_offer">Conditional Offer</SelectItem>
                <SelectItem value="unconditional_offer">Unconditional Offer</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No applications found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">University</TableHead>
                    <TableHead className="hidden lg:table-cell">Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Counselor</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">{app.applicationId}</TableCell>
                      <TableCell>
                        <p className="font-medium">{app.student?.firstName} {app.student?.lastName}</p>
                        <p className="text-xs text-gray-500">{app.student?.studentId}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">{app.university?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{app.university?.country}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{app.course?.name || 'N/A'}</TableCell>
                      <TableCell><Badge className={getStatusColor(app.status)}>{app.status?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{app.counselor ? `${app.counselor.firstName} ${app.counselor.lastName}` : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewDetail(app)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openUpdateStatus(app)} title="Update Status"><CheckCircle2 className="h-4 w-4" /></Button>
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {applications.length} of {pagination.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedApp.applicationId}</h3>
                <Badge className={getStatusColor(selectedApp.status)}>{selectedApp.status?.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Student</p><p className="font-medium">{selectedApp.student?.firstName} {selectedApp.student?.lastName}</p></div>
                <div><p className="text-gray-500">University</p><p className="font-medium">{selectedApp.university?.name}</p></div>
                <div><p className="text-gray-500">Course</p><p className="font-medium">{selectedApp.course?.name || 'N/A'}</p></div>
                <div><p className="text-gray-500">Intake</p><p className="font-medium">{selectedApp.intake || 'N/A'}</p></div>
                <div><p className="text-gray-500">Counselor</p><p className="font-medium">{selectedApp.counselor ? `${selectedApp.counselor.firstName} ${selectedApp.counselor.lastName}` : 'N/A'}</p></div>
                <div><p className="text-gray-500">Partner</p><p className="font-medium">{selectedApp.partner?.companyName || 'N/A'}</p></div>
              </div>
              {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Status Timeline</p>
                  <div className="space-y-2">
                    {selectedApp.statusHistory.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-[#F37021] mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">{h.toStatus?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500">{new Date(h.changedAt).toLocaleString()} {h.note && `- ${h.note}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Application Status</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <p className="text-sm">Update status for <strong>{selectedApp.applicationId}</strong></p>
              <div>
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="conditional_offer">Conditional Offer</SelectItem>
                    <SelectItem value="unconditional_offer">Unconditional Offer</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Note</Label><Textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={2} /></div>
              <Button onClick={handleUpdateStatus} disabled={updating} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">{updating ? 'Updating...' : 'Update Status'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
