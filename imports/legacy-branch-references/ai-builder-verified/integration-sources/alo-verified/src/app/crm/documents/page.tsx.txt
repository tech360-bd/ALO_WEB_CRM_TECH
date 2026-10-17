'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  Filter,
  FileCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DocumentItem {
  id: string
  studentId: string | null
  employeeId: string | null
  documentType: string
  documentName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  note: string | null
  uploadedAt: string
}

interface DocumentsResponse {
  documents: DocumentItem[]
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-amber-50 text-amber-600 border-amber-100',
  under_review: 'bg-blue-50 text-[#0057B8] border-blue-100',
  approved: 'bg-green-50 text-green-600 border-green-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
}

const typeColors: Record<string, string> = {
  passport: 'bg-purple-50 text-purple-600 border-purple-100',
  academic: 'bg-blue-50 text-[#0057B8] border-blue-100',
  english_test: 'bg-amber-50 text-amber-600 border-amber-100',
  sop: 'bg-green-50 text-green-600 border-green-100',
  lor: 'bg-orange-50 text-[#E8501A] border-orange-100',
  cv: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  financial: 'bg-teal-50 text-teal-600 border-teal-100',
  photo: 'bg-pink-50 text-pink-600 border-pink-100',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, loading } = usePortalData<DocumentsResponse>({
    endpoint: '/api/documents',
    params: { limit: 100 },
  })

  const allDocs = data?.documents ?? []
  const filteredDocs = allDocs.filter((d) => {
    if (filterType !== 'all' && d.documentType !== filterType) return false
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      return d.documentName.toLowerCase().includes(q) || d.documentType.toLowerCase().includes(q) || (d.studentId || '').toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total: allDocs.length,
    pending: allDocs.filter((d) => d.status === 'uploaded' || d.status === 'under_review').length,
    approved: allDocs.filter((d) => d.status === 'approved').length,
    rejected: allDocs.filter((d) => d.status === 'rejected').length,
  }

  const allSelected = filteredDocs.length > 0 && filteredDocs.every((d) => selected[d.id])
  const toggleAll = () => {
    const next = { ...selected }
    if (allSelected) filteredDocs.forEach((d) => { next[d.id] = false })
    else filteredDocs.forEach((d) => { next[d.id] = true })
    setSelected(next)
  }
  const toggleOne = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const selectedCount = Object.values(selected).filter(Boolean).length

  const typeOptions = Array.from(new Set(allDocs.map((d) => d.documentType).filter(Boolean)))
  const statusOptions = Array.from(new Set(allDocs.map((d) => d.status).filter(Boolean)))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Repository"
        description="Central repository for all student documents — review, approve, reject, and audit."
        action={
          <div className="flex gap-2">
            {selectedCount > 0 && (
              <Button variant="outline" onClick={() => toast.success(`Bulk approved ${selectedCount} documents`)}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Bulk Approve ({selectedCount})
              </Button>
            )}
            <Button variant="outline" onClick={() => toast.info('Export manifest (CSV)')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Documents" value={stats.total} icon={FileText} accent="blue" />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} accent="amber" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="green" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="orange" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by filename, type, student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {typeOptions.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No documents found</h3>
            <p className="text-sm text-slate-500">
              {search || filterType !== 'all' || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'Documents uploaded by students will appear here for review.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" /></th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Document ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Type</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Filename</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Uploaded</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Reviewer</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Review Date</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((d) => {
                  const isSelected = !!selected[d.id]
                  return (
                    <tr key={d.id} className={cn('border-b border-slate-100 hover:bg-slate-50/60', isSelected && 'bg-blue-50/40')}>
                      <td className="p-3"><Checkbox checked={isSelected} onCheckedChange={() => toggleOne(d.id)} aria-label={`Select ${d.documentName}`} /></td>
                      <td className="p-3"><span className="text-xs font-mono text-slate-500">{d.id.slice(-8)}</span></td>
                      <td className="p-3 text-xs text-slate-700">{d.studentId ? d.studentId.slice(-8) : <span className="text-slate-400">—</span>}</td>
                      <td className="p-3"><Badge className={cn('border text-xs capitalize', typeColors[d.documentType] || typeColors.other)}>{d.documentType.replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-900 truncate max-w-[200px]" title={d.documentName}>{d.documentName}</span>
                        </div>
                      </td>
                      <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[d.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{d.status.replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3 text-xs text-slate-600">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                      <td className="p-3 text-xs text-slate-700">{d.reviewedBy ? d.reviewedBy.slice(-8) : <span className="text-slate-400">—</span>}</td>
                      <td className="p-3 text-xs text-slate-600">{d.reviewedAt ? new Date(d.reviewedAt).toLocaleDateString() : <span className="text-slate-400">—</span>}</td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => toast.info('Preview document')}><Eye className="h-4 w-4 mr-2" /> Review</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('Document approved')}><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Approve</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => toast.info('Reject dialog')}><XCircle className="h-4 w-4 mr-2" /> Reject</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Download')}><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
