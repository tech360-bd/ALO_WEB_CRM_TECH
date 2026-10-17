'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Plus, Search, MapPin, GraduationCap, Calendar, Clock,
  ChevronRight, FileText, CheckCircle2, Circle, ArrowRight,
  FolderOpen, X
} from 'lucide-react'

const pipelineStages = [
  'draft', 'submitted', 'under_review', 'conditional_offer',
  'unconditional_offer', 'cas_received', 'visa_applied', 'visa_approved', 'enrolled'
]

const stageLabels: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  conditional_offer: 'Conditional Offer', unconditional_offer: 'Unconditional Offer',
  cas_received: 'CAS', visa_applied: 'Visa Applied',
  visa_approved: 'Visa Approved', enrolled: 'Enrolled',
  rejected: 'Rejected', withdrawn: 'Withdrawn',
}

const stageColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-50 text-blue-700',
  under_review: 'bg-yellow-50 text-yellow-700', conditional_offer: 'bg-orange-50 text-orange-700',
  unconditional_offer: 'bg-green-50 text-green-700', cas_received: 'bg-purple-50 text-purple-700',
  visa_applied: 'bg-indigo-50 text-indigo-700', visa_approved: 'bg-emerald-50 text-emerald-700',
  enrolled: 'bg-teal-50 text-teal-700', rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
}

// Applications are now fetched from the API

export default function StudentApplications() {
  const { currentUser } = useAppStore()
  const [applications, setApplications] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true)
        const studentId = currentUser?.referenceId || ''
        const res = await fetch(`/api/applications?studentId=${studentId}&limit=50`)
        if (res.ok) {
          const json = await res.json()
          const mapped = (json.applications || []).map((app: any) => ({
            id: app.id,
            applicationId: app.applicationId || app.id,
            status: app.status || 'draft',
            intake: app.intake || '',
            university: app.university || { name: 'University', country: '', city: '' },
            course: app.course || { name: 'Course', level: '', tuitionFee: 0 },
            documents: (app.documents || []).map((d: any) => ({ name: d.documentName || d.name || 'Document', status: d.status || 'pending' })),
            timeline: (app.statusHistory || []).map((h: any) => ({ stage: h.newStatus || h.status || 'draft', date: h.changedAt || h.createdAt || '', note: h.note || h.changedBy || '' })),
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

  const filtered = applications.filter((app: any) => {
    const matchSearch = !search ||
      app.applicationId.toLowerCase().includes(search.toLowerCase()) ||
      app.university.name.toLowerCase().includes(search.toLowerCase()) ||
      app.course.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || app.status === statusFilter
    return matchSearch && matchStatus
  })

  const getProgress = (status: string) => {
    const idx = pipelineStages.indexOf(status)
    return idx >= 0 ? Math.round(((idx + 1) / pipelineStages.length) * 100) : 0
  }

  const handleNew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('Application created successfully!')
    setShowNewDialog(false)
    setSubmitting(false)
  }

  const openDetail = (app: any) => {
    setSelectedApp(app)
    setShowDetailDialog(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">{applications.length} applications total</p>
        </div>
        <Button className="bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Application
        </Button>
      </div>

      {/* Pipeline Overview */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {pipelineStages.map((stage, idx) => {
              const count = applications.filter((a: any) => a.status === stage).length
              return (
                <div key={stage} className="flex items-center shrink-0">
                  <div className={`px-3 py-2 rounded-lg text-center min-w-[80px] ${
                    count > 0 ? 'bg-[#F37021]/10 border border-[#F37021]/30' : 'bg-gray-50 border border-gray-100'
                  }`}>
                    <p className={`text-lg font-bold ${count > 0 ? 'text-[#F37021]' : 'text-gray-300'}`}>{count}</p>
                    <p className="text-[10px] text-gray-500">{stageLabels[stage]}</p>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-gray-300 mx-0.5 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(stageLabels).filter(([k]) => pipelineStages.includes(k)).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Application Cards */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No applications found</p>
            <Button className="mt-4 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => {
            const progress = getProgress(app.status)
            const docDone = app.documents.filter(d => d.status === 'uploaded').length
            const docTotal = app.documents.length
            return (
              <Card key={app.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetail(app)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2332] truncate">{app.university.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {app.university.city}, {app.university.country}
                      </p>
                    </div>
                    <Badge className={`ml-2 shrink-0 text-xs ${stageColors[app.status]}`}>
                      {stageLabels[app.status]}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3 text-gray-400" />
                      {app.course.name} ({app.course.level})
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-gray-400" /> Intake: {app.intake}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <FolderOpen className="h-3 w-3 text-gray-400" />
                      Documents: {docDone}/{docTotal} complete
                    </p>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{app.applicationId}</span>
                    <span className="text-xs text-[#F37021] font-medium flex items-center gap-0.5">
                      View Details <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Application Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Application</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNew} className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">University</Label>
              <Select name="university">
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select university" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manchester">University of Manchester</SelectItem>
                  <SelectItem value="birmingham">University of Birmingham</SelectItem>
                  <SelectItem value="leeds">University of Leeds</SelectItem>
                  <SelectItem value="sheffield">University of Sheffield</SelectItem>
                  <SelectItem value="bristol">University of Bristol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Course</Label>
              <Select name="course">
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">MSc Computer Science</SelectItem>
                  <SelectItem value="mba">MBA International Business</SelectItem>
                  <SelectItem value="ds">BSc Data Science</SelectItem>
                  <SelectItem value="ai">MSc Artificial Intelligence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Intake</Label>
              <Select name="intake">
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select intake" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sep-2025">September 2025</SelectItem>
                  <SelectItem value="Jan-2026">January 2026</SelectItem>
                  <SelectItem value="Sep-2026">September 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                {submitting ? 'Creating...' : 'Create Application'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Application Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-[#1A2332]">{selectedApp?.university.name}</DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">{selectedApp?.course.name} · {selectedApp?.applicationId}</p>
              </div>
              {selectedApp && (
                <Badge className={stageColors[selectedApp.status]}>{stageLabels[selectedApp.status]}</Badge>
              )}
            </div>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-5">
              {/* Info Row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Intake</p>
                  <p className="text-sm font-semibold text-[#1A2332]">{selectedApp.intake}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Level</p>
                  <p className="text-sm font-semibold text-[#1A2332]">{selectedApp.course.level}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tuition</p>
                  <p className="text-sm font-semibold text-[#1A2332]">£{selectedApp.course.tuitionFee.toLocaleString()}</p>
                </div>
              </div>

              {/* Progress Pipeline */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-2">Application Progress</h4>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {pipelineStages.map((stage, idx) => {
                    const currentIdx = pipelineStages.indexOf(selectedApp.status)
                    const reached = idx <= currentIdx && currentIdx >= 0
                    return (
                      <div key={stage} className="flex items-center shrink-0">
                        <div className={`px-2 py-1 rounded text-[10px] font-medium ${
                          reached ? (idx === currentIdx ? 'bg-[#F37021] text-white' : 'bg-green-50 text-green-700') : 'bg-gray-50 text-gray-400'
                        }`}>{stageLabels[stage]}</div>
                        {idx < pipelineStages.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300 mx-0.5 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Document Checklist */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-2">Document Checklist</h4>
                <div className="space-y-2">
                  {selectedApp.documents.map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {doc.status === 'uploaded' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className="text-sm text-[#1A2332]">{doc.name}</span>
                      </div>
                      <Badge className={`text-xs ${doc.status === 'uploaded' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {doc.status === 'uploaded' ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Status Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-2">Status Timeline</h4>
                <div className="space-y-3">
                  {selectedApp.timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          idx === selectedApp.timeline.length - 1 ? 'bg-[#F37021]' : 'bg-green-400'
                        }`} />
                        {idx < selectedApp.timeline.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-[#1A2332]">{stageLabels[entry.stage] || entry.stage}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
