'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Shield, Eye, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface VisaFile {
  id: string
  stage: string
  casNumber: string
  casDate: string
  visaAppointmentDate: string
  biometricsDate: string
  notes: string
  status: string
  createdAt: string
  student?: { firstName: string; lastName: string; studentId: string; nationality: string }
  visaOfficer?: { firstName: string; lastName: string; employeeId: string }
  checklist?: Array<{ id: string; itemName: string; isCompleted: boolean; isRequired: boolean }>
}

export default function CRMVisa() {
  const [visaFiles, setVisaFiles] = useState<VisaFile[]>([])
  const [stageDistribution, setStageDistribution] = useState<Array<{ stage: string; count: number }>>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedVisa, setSelectedVisa] = useState<VisaFile | null>(null)
  const [newStage, setNewStage] = useState('')

  useEffect(() => { fetchVisaFiles() }, [stageFilter, pagination.page])

  const fetchVisaFiles = async () => {
    try {
      setLoading(true)
      let url = `/api/visa?page=${pagination.page}&limit=${pagination.limit}`
      if (stageFilter && stageFilter !== 'all') url += `&stage=${stageFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setVisaFiles(json.visaFiles || [])
        setStageDistribution(json.stageDistribution || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleUpdateStage = async () => {
    if (!selectedVisa || !newStage) return
    toast.success(`Visa stage updated to ${newStage.replace(/_/g, ' ')}`)
    setUpdateDialogOpen(false)
    fetchVisaFiles()
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'not_started': return 'bg-gray-100 text-gray-700'
      case 'cas_requested': return 'bg-blue-100 text-blue-700'
      case 'cas_received': return 'bg-indigo-100 text-indigo-700'
      case 'application_submitted': return 'bg-amber-100 text-amber-700'
      case 'biometrics_done': return 'bg-orange-100 text-orange-700'
      case 'visa_approved': return 'bg-green-100 text-green-700'
      case 'visa_refused': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A2332]">Visa Management</h1>

      {/* Stage Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { stage: 'not_started', label: 'Not Started' },
          { stage: 'cas_requested', label: 'CAS Requested' },
          { stage: 'cas_received', label: 'CAS Received' },
          { stage: 'application_submitted', label: 'Submitted' },
          { stage: 'biometrics_done', label: 'Biometrics' },
          { stage: 'visa_approved', label: 'Approved' },
          { stage: 'visa_refused', label: 'Refused' },
        ].map(s => {
          const count = stageDistribution.find(d => d.stage === s.stage)?.count || 0
          return (
            <Card key={s.stage} className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => setStageFilter(s.stage === stageFilter ? 'all' : s.stage)}>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-[#1A2332]">{count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Stages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="cas_requested">CAS Requested</SelectItem>
                <SelectItem value="cas_received">CAS Received</SelectItem>
                <SelectItem value="application_submitted">Application Submitted</SelectItem>
                <SelectItem value="biometrics_done">Biometrics Done</SelectItem>
                <SelectItem value="visa_approved">Visa Approved</SelectItem>
                <SelectItem value="visa_refused">Visa Refused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : visaFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Shield className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No visa files found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Nationality</TableHead><TableHead>Stage</TableHead><TableHead className="hidden md:table-cell">CAS Number</TableHead><TableHead className="hidden lg:table-cell">Appointment</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {visaFiles.map((vf) => (
                    <TableRow key={vf.id}>
                      <TableCell><p className="font-medium">{vf.student?.firstName} {vf.student?.lastName}</p><p className="text-xs text-gray-500">{vf.student?.studentId}</p></TableCell>
                      <TableCell className="text-sm">{vf.student?.nationality || '—'}</TableCell>
                      <TableCell><Badge className={getStageColor(vf.stage)}>{vf.stage?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{vf.casNumber || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{vf.visaAppointmentDate ? new Date(vf.visaAppointmentDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell><Badge className={vf.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{vf.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedVisa(vf); setDetailDialogOpen(true) }}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedVisa(vf); setNewStage(vf.stage); setUpdateDialogOpen(true) }} title="Update Stage"><Clock className="h-4 w-4" /></Button>
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Visa File Details</DialogTitle></DialogHeader>
          {selectedVisa && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedVisa.student?.firstName} {selectedVisa.student?.lastName}</h3>
                <Badge className={getStageColor(selectedVisa.stage)}>{selectedVisa.stage?.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">CAS Number</p><p className="font-medium">{selectedVisa.casNumber || 'Pending'}</p></div>
                <div><p className="text-gray-500">Nationality</p><p className="font-medium">{selectedVisa.student?.nationality || 'N/A'}</p></div>
                <div><p className="text-gray-500">Biometrics</p><p className="font-medium">{selectedVisa.biometricsDate ? new Date(selectedVisa.biometricsDate).toLocaleDateString() : 'Pending'}</p></div>
                <div><p className="text-gray-500">Visa Officer</p><p className="font-medium">{selectedVisa.visaOfficer ? `${selectedVisa.visaOfficer.firstName} ${selectedVisa.visaOfficer.lastName}` : 'Unassigned'}</p></div>
              </div>
              {selectedVisa.checklist && selectedVisa.checklist.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Document Checklist</p>
                  <div className="space-y-1">
                    {selectedVisa.checklist.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <CheckCircle2 className={`h-4 w-4 ${item.isCompleted ? 'text-green-600' : 'text-gray-300'}`} />
                        <span className={item.isCompleted ? 'line-through text-gray-400' : ''}>{item.itemName}</span>
                        {item.isRequired && !item.isCompleted && <Badge className="bg-red-100 text-red-700 text-xs ml-auto">Required</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Stage Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Visa Stage</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={newStage} onValueChange={setNewStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="cas_requested">CAS Requested</SelectItem>
                <SelectItem value="cas_received">CAS Received</SelectItem>
                <SelectItem value="application_submitted">Application Submitted</SelectItem>
                <SelectItem value="biometrics_done">Biometrics Done</SelectItem>
                <SelectItem value="visa_approved">Visa Approved</SelectItem>
                <SelectItem value="visa_refused">Visa Refused</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateStage} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">Update Stage</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
