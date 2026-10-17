'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Clock,
  AlertCircle,
  Bell,
  CheckCircle2,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hourglass,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  applicationId: string
  status: string
  intake: string | null
  applicationDate: string
  createdAt: string
  student: { id: string; firstName: string; lastName: string; studentId: string }
  university: { id: string; name: string; country?: string }
  course?: { id: string; name: string } | null
  counselor?: { id: string; firstName: string; lastName: string } | null
}

interface AppsResponse {
  applications: Application[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function daysSince(dateStr: string): number {
  const now = new Date().getTime()
  const then = new Date(dateStr).getTime()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

function pendingColor(days: number): string {
  if (days >= 30) return 'bg-red-50 text-red-600 border-red-100'
  if (days >= 14) return 'bg-orange-50 text-[#E8501A] border-orange-100'
  if (days >= 7) return 'bg-amber-50 text-amber-600 border-amber-100'
  return 'bg-green-50 text-green-600 border-green-100'
}

export default function DecisionPendingPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 25

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, loading } = usePortalData<AppsResponse>({
    endpoint: '/api/applications',
    params: { status: 'under_review', limit, page, search: debouncedSearch || undefined },
  })

  const apps = data?.applications ?? []
  const pagination = data?.pagination

  const stats = {
    total: pagination?.total ?? 0,
    overdue: apps.filter((a) => daysSince(a.applicationDate) >= 30).length,
    avgDays: apps.length > 0 ? Math.round(apps.reduce((s, a) => s + daysSince(a.applicationDate), 0) / apps.length) : 0,
    longPending: apps.filter((a) => daysSince(a.applicationDate) >= 14).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decision Pending"
        description="Applications awaiting university decisions. Track aging and send reminders."
        action={
          <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.success('Bulk reminder sent to universities')}>
            <Bell className="h-4 w-4 mr-2" /> Send Bulk Reminders
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending Decisions" value={stats.total} icon={Hourglass} accent="amber" />
        <StatCard label="Overdue (>30d)" value={stats.overdue} icon={AlertCircle} accent="orange" />
        <StatCard label="Long Pending (>14d)" value={stats.longPending} icon={Clock} accent="purple" />
        <StatCard label="Avg Days Pending" value={stats.avgDays} icon={Calendar} accent="blue" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by application ID, student, university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No pending decisions</h3>
            <p className="text-sm text-slate-500">All submitted applications have been processed by universities.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Application ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">University</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Program</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Submitted</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Days Pending</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Counselor</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const days = daysSince(a.applicationDate)
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3"><span className="font-semibold text-[#0057B8]">{a.applicationId}</span></td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{a.student.firstName} {a.student.lastName}</p>
                        <p className="text-xs text-slate-400">{a.student.studentId}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-medium text-slate-900">{a.university.name}</p>
                        <p className="text-xs text-slate-400">{a.university.country}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-700">{a.course?.name || '—'}</td>
                      <td className="p-3 text-xs text-slate-600">{new Date(a.applicationDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Badge className={cn('border text-xs', pendingColor(days))}>
                          {days} day{days !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-slate-700">
                        {a.counselor ? `${a.counselor.firstName} ${a.counselor.lastName[0]}.` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => toast.success(`Reminder sent for ${a.applicationId}`)}>
                            <Bell className="h-3.5 w-3.5 mr-1" /> Remind
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => toast.info('Mark decision dialog')}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Decision
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info(`View ${a.applicationId}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {!loading && apps.length > 0 && pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> –{' '}
            <span className="font-semibold text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> pending
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-slate-600">Page {pagination.page} / {pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
