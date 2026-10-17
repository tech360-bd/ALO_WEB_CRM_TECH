'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Send, ChevronDown, ChevronRight, Clock, GraduationCap,
  Building2, Calendar, Search, Filter,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface ApplicationRecord {
  id: string
  applicationId: string
  status: string
  intake: string | null
  source: string
  notes: string | null
  createdAt: string
  updatedAt: string
  student: { id: string; firstName: string; lastName: string; studentId: string; email: string }
  university: { id: string; name: string; country: string; city: string | null } | null
  course: { id: string; name: string; level: string | null; tuitionFee: number | null } | null
  counselor: { id: string; firstName: string; lastName: string; employeeId: string } | null
  statusHistory: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    note: string | null
    changedAt: string
  }>
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-50 text-[#0057B8]',
  under_review: 'bg-amber-50 text-amber-600',
  conditional_offer: 'bg-purple-50 text-purple-600',
  unconditional_offer: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
  enrolled: 'bg-green-50 text-green-700',
  withdrawn: 'bg-slate-100 text-slate-500',
}

const STATUS_OPTIONS = ['draft', 'submitted', 'under_review', 'conditional_offer', 'unconditional_offer', 'rejected', 'enrolled', 'withdrawn']

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function timeAgo(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return 'Today'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  } catch {
    return '—'
  }
}

export default function ApplicationsPage() {
  const session = getSession()
  const { data, loading } = usePortalData<{ applications: ApplicationRecord[] }>({
    endpoint: '/api/applications',
    params: { studentId: session?.user.referenceId || '', limit: 50 },
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const apps = data?.applications || []

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${a.applicationId} ${a.university?.name || ''} ${a.course?.name || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [apps, search, statusFilter])

  const stats = useMemo(() => {
    const total = apps.length
    const active = apps.filter((a) => ['submitted', 'under_review', 'conditional_offer', 'unconditional_offer'].includes(a.status)).length
    const offers = apps.filter((a) => ['conditional_offer', 'unconditional_offer'].includes(a.status)).length
    const enrolled = apps.filter((a) => a.status === 'enrolled').length
    return { total, active, offers, enrolled }
  }, [apps])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Applications"
        description="Track the status of all your university applications in one place."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={Send} accent="blue" hint="All time" />
        <StatCard label="Active" value={stats.active} icon={Clock} accent="amber" hint="In progress" />
        <StatCard label="Offers" value={stats.offers} icon={GraduationCap} accent="green" hint="Conditional + Unconditional" />
        <StatCard label="Enrolled" value={stats.enrolled} icon={Building2} accent="purple" hint="Confirmed" />
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by application ID, university, course…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border-0 shadow-sm">
              <div className="h-6 w-1/3 rounded bg-slate-100 animate-pulse mb-3" />
              <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <Send className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900">
            {apps.length === 0 ? 'No applications yet' : 'No applications match your filters'}
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {apps.length === 0
              ? 'Browse programs and submit your first application.'
              : 'Try adjusting your search or status filter.'}
          </p>
          {apps.length === 0 && (
            <Button asChild className="bg-[#0057B8] hover:bg-[#00449a] text-white">
              <Link href="/student/course-finder">Find a program</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id
            return (
              <Card key={app.id} className="border-0 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full text-left p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-[#0057B8]" /> : <ChevronRight className="h-5 w-5 text-[#0057B8]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={cn('border-0 capitalize', statusColors[app.status] || 'bg-slate-100 text-slate-600')}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">{app.applicationId}</span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate">
                        {app.course?.name || 'Application'}
                      </p>
                      <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {app.university?.name || '—'}
                        {app.university?.country && <span className="text-slate-400">• {app.university.country}</span>}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Submitted: {formatDate(app.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated: {timeAgo(app.updatedAt)}
                        </span>
                        {app.intake && <span className="text-slate-400">Intake: {app.intake}</span>}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50">
                    {/* Status Timeline */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Status Timeline</h4>
                      {app.statusHistory && app.statusHistory.length > 0 ? (
                        <div className="space-y-3">
                          {app.statusHistory.map((h, idx) => (
                            <div key={h.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                  idx === 0 ? 'bg-[#0057B8] text-white' : 'bg-slate-200 text-slate-600'
                                )}>
                                  {idx + 1}
                                </div>
                                {idx < app.statusHistory.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="capitalize border-slate-300 text-slate-700">
                                    {h.toStatus.replace(/_/g, ' ')}
                                  </Badge>
                                  {h.fromStatus && (
                                    <span className="text-xs text-slate-400">
                                      from {h.fromStatus.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDate(h.changedAt)} • {new Date(h.changedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {h.note && <p className="text-sm text-slate-600 mt-1">{h.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No status history recorded.</p>
                      )}
                    </div>

                    {/* Application details */}
                    <div className="mt-5 grid sm:grid-cols-2 gap-4">
                      <DetailRow label="Application ID" value={app.applicationId} />
                      <DetailRow label="Status" value={app.status.replace(/_/g, ' ')} />
                      <DetailRow label="University" value={app.university?.name || '—'} />
                      <DetailRow label="Course" value={app.course?.name || '—'} />
                      <DetailRow label="Course Level" value={app.course?.level || '—'} />
                      <DetailRow
                        label="Tuition Fee"
                        value={app.course?.tuitionFee ? `£${app.course.tuitionFee.toLocaleString()}` : '—'}
                      />
                      <DetailRow label="Intake" value={app.intake || '—'} />
                      <DetailRow label="Source" value={app.source} />
                      <DetailRow
                        label="Counselor"
                        value={app.counselor ? `${app.counselor.firstName} ${app.counselor.lastName}` : '—'}
                      />
                      <DetailRow label="Submitted" value={formatDate(app.createdAt)} />
                    </div>

                    {app.notes && (
                      <div className="mt-4 p-3 rounded-lg bg-white border border-slate-100">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-slate-600">{app.notes}</p>
                      </div>
                    )}

                    <div className="mt-5 flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/student/messages">
                          <Send className="h-3.5 w-3.5 mr-1.5" /> Ask about this
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/student/documents">Upload documents</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 capitalize">{value}</p>
    </div>
  )
}
