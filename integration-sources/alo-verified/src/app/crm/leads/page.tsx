'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Download,
  Plus,
  Upload,
  Facebook,
  Building2,
  UserCog,
  UserPlus,
  UserCheck,
  Send,
  RefreshCw,
  Tags,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Users,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LeadNote {
  id: string
  note: string
  noteType: string
  createdAt: string
}

interface Counselor {
  id: string
  firstName: string
  lastName: string
  employeeId?: string
}

interface Lead {
  id: string
  leadId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  whatsappNumber: string | null
  source: string
  status: string
  temperature: string
  preferredCountry: string | null
  preferredCourse: string | null
  preferredIntake: string | null
  englishTestType: string | null
  englishTestScore: string | null
  highestEducation: string | null
  assignedTo: string | null
  nextFollowUp: string | null
  lastContactedAt: string | null
  notes: string | null
  createdAt: string
  counselor?: Counselor | null
  notes_relation?: LeadNote[]
}

interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-[#0057B8] border-blue-100',
  contacted: 'bg-amber-50 text-amber-600 border-amber-100',
  qualified: 'bg-purple-50 text-purple-600 border-purple-100',
  unqualified: 'bg-slate-100 text-slate-500 border-slate-200',
  converted: 'bg-green-50 text-green-600 border-green-100',
  lost: 'bg-red-50 text-red-600 border-red-100',
  recycled: 'bg-orange-50 text-[#E8501A] border-orange-100',
}

const tempColors: Record<string, string> = {
  hot: 'bg-red-50 text-red-600',
  warm: 'bg-amber-50 text-amber-600',
  cold: 'bg-slate-100 text-slate-500',
}

const sources = ['website', 'facebook', 'instagram', 'referral', 'partner', 'walk_in', 'whatsapp', 'call']
const statuses = ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost', 'recycled']

function exportLeadsCsv(leads: Lead[]) {
  const headers = [
    'Lead Ref', 'First Name', 'Last Name', 'Email', 'Phone', 'WhatsApp',
    'Source', 'Status', 'Temperature', 'Country', 'Course', 'Intake',
    'Test Type', 'Test Score', 'Counselor', 'Created At',
  ]
  const rows = leads.map((l) => [
    l.leadId, l.firstName, l.lastName, l.email || '', l.phone || '', l.whatsappNumber || '',
    l.source, l.status, l.temperature, l.preferredCountry || '', l.preferredCourse || '', l.preferredIntake || '',
    l.englishTestType || '', l.englishTestScore || '',
    l.counselor ? `${l.counselor.firstName} ${l.counselor.lastName}` : '',
    new Date(l.createdAt).toISOString(),
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`${leads.length} leads exported`)
}

export default function CrmLeadsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCounselor, setFilterCounselor] = useState('')
  const [filterTemp, setFilterTemp] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [advOpen, setAdvOpen] = useState(false)
  const limit = 10

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const params: Record<string, string | number | undefined> = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: filterStatus || undefined,
    source: filterSource || undefined,
    assignedTo: filterCounselor || undefined,
    temperature: filterTemp || undefined,
  }

  const { data, loading } = usePortalData<LeadsResponse>({
    endpoint: '/api/leads',
    params,
  })

  const leads = data?.leads ?? []
  const pagination = data?.pagination
  const allSelected = leads.length > 0 && leads.every((l) => selected[l.id])
  const selectedCount = Object.values(selected).filter(Boolean).length

  const toggleAll = () => {
    const next: Record<string, boolean> = { ...selected }
    if (allSelected) {
      leads.forEach((l) => { next[l.id] = false })
    } else {
      leads.forEach((l) => { next[l.id] = true })
    }
    setSelected(next)
  }

  const toggleOne = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  const clearFilters = () => {
    setFilterStatus(''); setFilterSource(''); setFilterCountry('')
    setFilterCounselor(''); setFilterTemp(''); setFromDate(''); setToDate('')
    setAdvOpen(false)
  }

  const activeFilterCount = [filterStatus, filterSource, filterCountry, filterCounselor, filterTemp, fromDate, toDate].filter(Boolean).length

  const stats = useMemo(() => {
    const total = pagination?.total ?? 0
    const newCount = leads.filter((l) => l.status === 'new').length
    const contacted = leads.filter((l) => l.status === 'contacted' || l.status === 'qualified').length
    const converted = leads.filter((l) => l.status === 'converted').length
    const pendingFollowUp = leads.filter((l) => l.nextFollowUp && new Date(l.nextFollowUp) <= new Date()).length
    return { total, newCount, contacted, converted, pendingFollowUp }
  }, [leads, pagination])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="SamsCRM-style lead management with bulk operations, advanced filters, and pipeline tracking."
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => exportLeadsCsv(leads)}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button asChild className="bg-[#0057B8] hover:bg-[#00449a] text-white">
              <Link href="/crm/students">
                <Plus className="h-4 w-4 mr-2" /> New Lead
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Leads" value={stats.total} icon={Users} accent="blue" />
        <StatCard label="New" value={stats.newCount} icon={TrendingUp} accent="orange" />
        <StatCard label="In Contact" value={stats.contacted} icon={Target} accent="purple" />
        <StatCard label="Follow-up Due" value={stats.pendingFollowUp} icon={Clock} accent="amber" />
      </div>

      {/* Action toolbar */}
      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads by name, email, phone, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Dialog open={advOpen} onOpenChange={setAdvOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10">
                <Filter className="h-4 w-4 mr-2" /> Advanced
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-[#0057B8] text-white">{activeFilterCount}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {statuses.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Source</Label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger><SelectValue placeholder="All sources" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      {sources.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Temperature</Label>
                  <Select value={filterTemp} onValueChange={setFilterTemp}>
                    <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Country</Label>
                  <Input
                    placeholder="e.g. UK, USA"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Counselor ID</Label>
                  <Input
                    placeholder="Employee ID"
                    value={filterCounselor}
                    onChange={(e) => setFilterCounselor(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Created from</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Created to</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={clearFilters}>Clear all</Button>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => setAdvOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                <MoreHorizontal className="h-4 w-4 mr-2" /> Bulk Actions
                {selectedCount > 0 && <Badge className="ml-2 bg-[#E8501A] text-white">{selectedCount}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Import bulk lead — CSV upload dialog would open')}>
                <Upload className="h-4 w-4 mr-2" /> Import bulk lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Facebook lead — Facebook Lead Ads integration')}>
                <Facebook className="h-4 w-4 mr-2" /> Facebook lead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info(`Change office for ${selectedCount} leads`)}>
                <Building2 className="h-4 w-4 mr-2" /> Change office
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Change counselor for ${selectedCount} leads`)}>
                <UserCog className="h-4 w-4 mr-2" /> Change counselor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Add sub-agent for ${selectedCount} leads`)}>
                <UserPlus className="h-4 w-4 mr-2" /> Add sub-agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Add referral for ${selectedCount} leads`)}>
                <UserCheck className="h-4 w-4 mr-2" /> Add referral
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info(`Move ${selectedCount} leads to application`)}>
                <Send className="h-4 w-4 mr-2" /> Move to application
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Change status for ${selectedCount} leads`)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Change status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Change channel for ${selectedCount} leads`)}>
                <Tags className="h-4 w-4 mr-2" /> Change channel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportLeadsCsv(leads.filter((l) => selected[l.id]))}>
                <Download className="h-4 w-4 mr-2" /> Download selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Leads table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No leads found</h3>
            <p className="text-sm text-slate-500 mb-5">
              {activeFilterCount > 0 || debouncedSearch
                ? 'Try adjusting your filters or search criteria.'
                : 'Get started by adding your first lead or importing an existing list.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              <Button asChild className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                <Link href="/crm/students"><Plus className="h-4 w-4 mr-2" /> Add Lead</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Lead Ref</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Counselor</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Client Information</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Admission Preference</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Test Score</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">CRM Activity</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Outstanding Task</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const isSelected = !!selected[l.id]
                  const followUpOverdue = l.nextFollowUp && new Date(l.nextFollowUp) <= new Date()
                  const lastNote = l.notes_relation?.[0]
                  return (
                    <tr key={l.id} className={cn('border-b border-slate-100 hover:bg-slate-50/60', isSelected && 'bg-blue-50/40')}>
                      <td className="p-3">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(l.id)} aria-label={`Select ${l.leadId}`} />
                      </td>
                      <td className="p-3">
                        <Link href={`/crm/lead-profile/${l.id}`} className="font-semibold text-[#0057B8] hover:underline">
                          {l.leadId}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(l.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-3">
                        {l.counselor ? (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center text-white text-[10px] font-bold">
                              {l.counselor.firstName[0]}{l.counselor.lastName[0]}
                            </div>
                            <span className="text-xs text-slate-700">{l.counselor.firstName} {l.counselor.lastName[0]}.</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <Badge className={cn('border capitalize text-xs', statusColors[l.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                            {l.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={cn('border-0 text-[10px] capitalize w-fit', tempColors[l.temperature] || 'bg-slate-100 text-slate-500')}>
                            {l.temperature}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{l.firstName} {l.lastName}</p>
                        <p className="text-xs text-slate-500">{l.email || '—'}</p>
                        <p className="text-xs text-slate-500">{l.phone || '—'}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-slate-700">{l.preferredCountry || '—'}</p>
                        <p className="text-xs text-slate-500">{l.preferredCourse || '—'}</p>
                        <p className="text-xs text-slate-400">Intake: {l.preferredIntake || '—'}</p>
                      </td>
                      <td className="p-3">
                        {l.englishTestType ? (
                          <div>
                            <p className="text-xs font-medium text-slate-700">{l.englishTestType}</p>
                            <p className="text-xs text-slate-500">Score: {l.englishTestScore || '—'}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not taken</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-slate-600">
                          <p>Source: <span className="font-medium capitalize">{l.source.replace(/_/g, ' ')}</span></p>
                          {l.lastContactedAt && (
                            <p className="text-slate-400">Last: {new Date(l.lastContactedAt).toLocaleDateString()}</p>
                          )}
                          {lastNote && (
                            <p className="text-slate-400 truncate max-w-[180px]">"{lastNote.note}"</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {l.nextFollowUp ? (
                          <div className={cn('text-xs', followUpOverdue ? 'text-[#E8501A] font-semibold' : 'text-slate-600')}>
                            <p>{followUpOverdue ? 'Overdue' : 'Due'}</p>
                            <p className="text-slate-400">{new Date(l.nextFollowUp).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Link href={`/crm/lead-profile/${l.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/crm/lead-profile/${l.id}`}>View profile</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Move to application workflow')}>Move to application</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Add reminder')}>Add reminder</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Send email')}>Send email</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toast.info('Change status')}>Change status</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Change counselor')}>Change counselor</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!loading && leads.length > 0 && pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> –{' '}
            <span className="font-semibold text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} / {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
