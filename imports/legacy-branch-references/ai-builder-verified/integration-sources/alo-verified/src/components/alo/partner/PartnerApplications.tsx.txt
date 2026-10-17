'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  FileText, Search, Filter, CheckCircle2, Circle, ArrowRight,
  Clock, GraduationCap, TrendingUp, Users, Shield, ChevronRight,
  Calendar, MapPin, Building2
} from 'lucide-react'

// Application statuses
type AppStatus =
  | 'submitted'
  | 'conditional_offer'
  | 'unconditional_offer'
  | 'cas_issued'
  | 'visa_approved'
  | 'visa_refused'
  | 'enrolled'
  | 'rejected'

const statusLabels: Record<AppStatus, string> = {
  submitted: 'Submitted',
  conditional_offer: 'Conditional Offer',
  unconditional_offer: 'Unconditional Offer',
  cas_issued: 'CAS Issued',
  visa_approved: 'Visa Approved',
  visa_refused: 'Visa Refused',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
}

const statusColors: Record<AppStatus, string> = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  conditional_offer: 'bg-orange-50 text-orange-700 border-orange-200',
  unconditional_offer: 'bg-green-50 text-green-700 border-green-200',
  cas_issued: 'bg-purple-50 text-purple-700 border-purple-200',
  visa_approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  visa_refused: 'bg-red-50 text-red-700 border-red-200',
  enrolled: 'bg-teal-50 text-teal-700 border-teal-200',
  rejected: 'bg-red-100 text-red-800 border-red-300',
}

// Timeline stages for the visual pipeline
const timelineStages = [
  { key: 'submitted', label: 'Submitted', icon: FileText },
  { key: 'conditional_offer', label: 'Conditional Offer', icon: FileText },
  { key: 'unconditional_offer', label: 'Unconditional Offer', icon: CheckCircle2 },
  { key: 'cas_issued', label: 'CAS Issued', icon: Building2 },
  { key: 'visa_approved', label: 'Visa Approved', icon: Shield },
  { key: 'enrolled', label: 'Enrolled', icon: GraduationCap },
]

// Applications are now fetched from the API

// Stats computation
function computeStats(apps: any[]) {
  const total = apps.length
  const active = apps.filter((a: any) => !['enrolled', 'rejected', 'visa_refused'].includes(a.status)).length
  const offers = apps.filter((a: any) => ['conditional_offer', 'unconditional_offer', 'cas_issued', 'visa_approved', 'enrolled'].includes(a.status)).length
  const visaApproved = apps.filter((a: any) => ['visa_approved', 'enrolled'].includes(a.status)).length
  const enrolled = apps.filter((a: any) => a.status === 'enrolled').length
  return { total, active, offers, visaApproved, enrolled }
}

// Get the timeline stage index for determining pipeline position
function getTimelineIndex(status: AppStatus): number {
  const order: AppStatus[] = ['submitted', 'conditional_offer', 'unconditional_offer', 'cas_issued', 'visa_approved', 'enrolled']
  const idx = order.indexOf(status)
  return idx >= 0 ? idx : -1
}

// Determine if a stage is completed, current, or future
function getStageState(stageKey: string, currentStatus: AppStatus): 'completed' | 'current' | 'future' | 'skipped' {
  const currentIdx = getTimelineIndex(currentStatus)
  const stageIdx = timelineStages.findIndex(s => s.key === stageKey)

  if (currentStatus === 'rejected') {
    return stageIdx === 0 ? 'current' : 'future'
  }
  if (currentStatus === 'visa_refused') {
    if (stageIdx < currentIdx) return 'completed'
    if (stageIdx === currentIdx) return 'current'
    return 'future'
  }

  if (stageIdx < currentIdx) return 'completed'
  if (stageIdx === currentIdx) return 'current'
  return 'future'
}

export default function PartnerApplications() {
  const { currentUser } = useAppStore()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true)
        const partnerId = currentUser?.referenceId || ''
        const res = await fetch(`/api/applications?partnerId=${partnerId}&limit=50`)
        if (res.ok) {
          const json = await res.json()
          const mapped = (json.applications || []).map((app: any) => ({
            id: app.applicationId || app.id,
            studentName: app.student ? `${app.student.firstName} ${app.student.lastName}` : 'Student',
            university: app.university?.name || 'University',
            course: app.course?.name || 'Course',
            status: (app.status || 'submitted') as AppStatus,
            applicationDate: app.createdAt ? app.createdAt.split('T')[0] : '',
            lastUpdate: app.updatedAt ? app.updatedAt.split('T')[0] : app.createdAt ? app.createdAt.split('T')[0] : '',
            timeline: (app.statusHistory || []).map((h: any) => ({ stage: h.newStatus || h.status || 'submitted', date: h.changedAt ? h.changedAt.split('T')[0] : '', note: h.note || h.changedBy || '' })),
          }))
          setApplications(mapped)
        }
      } catch {
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [currentUser?.referenceId])

  const stats = computeStats(applications)

  const filtered = applications.filter((app: any) => {
    const matchSearch = !search || app.studentName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || app.status === statusFilter
    return matchSearch && matchStatus
  })

  const openDetail = (app: any) => {
    setSelectedApp(app)
    setShowDetailDialog(true)
  }

  const handleExport = () => {
    toast.success('Applications exported to CSV')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all applications submitted by your students
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="border-[#F37021] text-[#F37021] hover:bg-[#F37021]/10">
          <FileText className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, icon: <FileText className="h-5 w-5" />, bg: 'bg-[#0066CC]/10', textColor: 'text-[#0066CC]' },
          { label: 'Active', value: stats.active, icon: <Clock className="h-5 w-5" />, bg: 'bg-yellow-50', textColor: 'text-yellow-600' },
          { label: 'Offers Received', value: stats.offers, icon: <TrendingUp className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Visa Approved', value: stats.visaApproved, icon: <Shield className="h-5 w-5" />, bg: 'bg-emerald-50', textColor: 'text-emerald-600' },
          { label: 'Enrolled', value: stats.enrolled, icon: <GraduationCap className="h-5 w-5" />, bg: 'bg-[#F37021]/10', textColor: 'text-[#F37021]' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(statusLabels) as [AppStatus, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No applications found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-[#1A2332]">Student Name</TableHead>
                    <TableHead className="font-semibold text-[#1A2332]">University</TableHead>
                    <TableHead className="font-semibold text-[#1A2332] hidden md:table-cell">Course</TableHead>
                    <TableHead className="font-semibold text-[#1A2332]">Status</TableHead>
                    <TableHead className="font-semibold text-[#1A2332] hidden sm:table-cell">Applied</TableHead>
                    <TableHead className="font-semibold text-[#1A2332] hidden lg:table-cell">Last Update</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                      onClick={() => openDetail(app)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#0066CC]/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#0066CC]">
                              {app.studentName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1A2332]">{app.studentName}</p>
                            <p className="text-[10px] text-gray-400">{app.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-[#1A2332] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{app.university}</span>
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-gray-600 truncate max-w-[180px]">{app.course}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusColors[app.status]}`}>
                          {statusLabels[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="text-xs text-gray-500">
                          {new Date(app.applicationDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-xs text-gray-500">
                          {new Date(app.lastUpdate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-[#1A2332]">{selectedApp?.studentName}</DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedApp?.university} · {selectedApp?.id}
                </p>
              </div>
              {selectedApp && (
                <Badge className={statusColors[selectedApp.status]}>
                  {statusLabels[selectedApp.status]}
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6">
              {/* Application Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Course</p>
                  <p className="text-sm font-semibold text-[#1A2332] truncate">{selectedApp.course}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Applied</p>
                  <p className="text-sm font-semibold text-[#1A2332]">
                    {new Date(selectedApp.applicationDate).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Last Update</p>
                  <p className="text-sm font-semibold text-[#1A2332]">
                    {new Date(selectedApp.lastUpdate).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={`text-xs mt-0.5 ${statusColors[selectedApp.status]}`}>
                    {statusLabels[selectedApp.status]}
                  </Badge>
                </div>
              </div>

              {/* Visual Timeline Pipeline */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#F37021]" /> Application Pipeline
                </h4>
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {timelineStages.map((stage, idx) => {
                    const state = getStageState(stage.key, selectedApp.status)
                    const isRejected = selectedApp.status === 'rejected' && idx > 0
                    const isVisaRefused = selectedApp.status === 'visa_refused' && stage.key === 'visa_approved'

                    let stageClass = 'bg-gray-100 text-gray-400 border-gray-200' // future
                    if (state === 'completed') {
                      stageClass = 'bg-green-50 text-green-700 border-green-300'
                    } else if (state === 'current') {
                      stageClass = 'bg-[#F37021]/10 text-[#F37021] border-[#F37021]/40'
                    }
                    if (isRejected) {
                      stageClass = 'bg-red-50 text-red-400 border-red-200'
                    }

                    return (
                      <div key={stage.key} className="flex items-center shrink-0">
                        <div className={`px-3 py-2 rounded-lg text-center min-w-[90px] border ${stageClass}`}>
                          <stage.icon className="h-4 w-4 mx-auto mb-1" />
                          <p className="text-[10px] font-medium leading-tight">{stage.label}</p>
                          {state === 'completed' && (
                            <CheckCircle2 className="h-3 w-3 mx-auto mt-0.5 text-green-500" />
                          )}
                          {state === 'current' && (
                            <Circle className="h-3 w-3 mx-auto mt-0.5 text-[#F37021] fill-[#F37021]" />
                          )}
                        </div>
                        {idx < timelineStages.length - 1 && (
                          <ArrowRight className={`h-4 w-4 mx-0.5 shrink-0 ${
                            state === 'completed' ? 'text-green-400' : 'text-gray-300'
                          }`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Detailed Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#0066CC]" /> Status Timeline
                </h4>
                <div className="space-y-0">
                  {selectedApp.timeline.map((entry, idx) => {
                    const isLast = idx === selectedApp.timeline.length - 1
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            isLast ? 'bg-[#F37021]' : 'bg-green-400'
                          }`} />
                          {!isLast && <div className="w-0.5 h-8 bg-gray-200" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-[#1A2332]">
                            {statusLabels[entry.stage as AppStatus] || entry.stage}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-gray-400 mt-0.5 bg-gray-50 px-2 py-1 rounded inline-block">
                              {entry.note}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Special Status Notes */}
              {(selectedApp.status === 'rejected' || selectedApp.status === 'visa_refused') && (
                <div className={`p-4 rounded-lg border ${
                  selectedApp.status === 'rejected'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm font-semibold text-red-800">
                    {selectedApp.status === 'rejected' ? 'Application Rejected' : 'Visa Refused'}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {selectedApp.status === 'rejected'
                      ? 'The university has rejected this application. Contact your ALO counselor for next steps.'
                      : 'The visa application has been refused. Contact your ALO counselor immediately for guidance on next steps.'}
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                    onClick={() => toast.success('Request sent to your ALO counselor')}
                  >
                    Contact Counselor
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
