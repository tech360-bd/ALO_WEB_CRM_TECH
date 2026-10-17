'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Shield,
  Download,
  RefreshCw,
  Search,
  Lock,
  ChevronLeft,
  ChevronRight,
  ScrollText,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { getSession, hasRole } from '@/lib/session'
import { toast } from 'sonner'

// ── ALO brand colors ──
const NAVY = '#0f172a'
const BLUE = '#0057B8'
const ORANGE = '#E8501A'

// ── Types ──
interface AuditLogUser {
  id: string
  name: string | null
  email: string | null
}

interface AuditLog {
  id: string
  userId: string | null
  action: string
  module: string
  recordId: string | null
  oldData: string | null
  newData: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  user: AuditLogUser | null
}

interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Module dropdown options (covers the modules in use across the app).
// `__all` is the sentinel meaning "no module filter".
const MODULE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '__all', label: 'All modules' },
  { value: 'auth', label: 'Auth' },
  { value: 'public', label: 'Public (consultation)' },
  { value: 'students', label: 'Students' },
  { value: 'leads', label: 'Leads' },
  { value: 'applications', label: 'Applications' },
  { value: 'partners', label: 'Partners' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'settings', label: 'Settings' },
  { value: 'visa', label: 'Visa' },
]

const ALLOWED_ROLES = ['super_admin', 'admin', 'marketing_manager']

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

function actionColor(action: string): string {
  if (action.includes('create') || action.includes('submitted')) return '#10B981'
  if (action.includes('update')) return BLUE
  if (action.includes('delete')) return ORANGE
  if (action.includes('login') || action.includes('logout')) return '#8B5CF6'
  if (action.includes('approve')) return '#059669'
  if (action.includes('reject')) return '#DC2626'
  return '#64748B'
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export default function AuditLogsPage() {
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)
  const [mounted, setMounted] = useState(false)

  // Filters
  const [moduleFilter, setModuleFilter] = useState<string>('__all')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [userIdFilter, setUserIdFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Applied filters (only update on "Apply")
  const [appliedFilters, setAppliedFilters] = useState<{
    module: string
    action: string
    userId: string
    startDate: string
    endDate: string
  }>({ module: '__all', action: '', userId: '', startDate: '', endDate: '' })

  // Data
  const [data, setData] = useState<AuditLogsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const limit = 50

  // Mount + session
  useEffect(() => {
    setMounted(true)
    setSession(getSession())
  }, [])

  const canView = useMemo(
    () => Boolean(session) && hasRole(session, ...ALLOWED_ROLES),
    [session]
  )

  // Build query string from applied filters
  const buildQuery = useCallback(
    (overrides?: { page?: number }) => {
      const params = new URLSearchParams()
      params.set('page', String(overrides?.page ?? page))
      params.set('limit', String(limit))
      if (appliedFilters.module && appliedFilters.module !== '__all') {
        params.set('module', appliedFilters.module)
      }
      if (appliedFilters.action) params.set('action', appliedFilters.action)
      if (appliedFilters.userId) params.set('userId', appliedFilters.userId)
      if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate)
      if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate)
      return params.toString()
    },
    [page, appliedFilters]
  )

  const fetchLogs = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/audit-logs?${buildQuery()}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed: ${res.status}`)
      }
      const json = (await res.json()) as AuditLogsResponse
      setData(json)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [session, buildQuery])

  useEffect(() => {
    if (canView) {
      void fetchLogs()
    }
  }, [canView, fetchLogs])

  function handleApplyFilters() {
    setPage(1)
    setAppliedFilters({
      module: moduleFilter,
      action: actionFilter,
      userId: userIdFilter,
      startDate,
      endDate,
    })
  }

  function handleResetFilters() {
    setModuleFilter('__all')
    setActionFilter('')
    setUserIdFilter('')
    setStartDate('')
    setEndDate('')
    setAppliedFilters({ module: '__all', action: '', userId: '', startDate: '', endDate: '' })
    setPage(1)
  }

  function handleExportCsv() {
    if (!data || data.logs.length === 0) {
      toast.error('No data to export')
      return
    }
    const headers = [
      'Timestamp',
      'User Name',
      'User Email',
      'Action',
      'Module',
      'Record ID',
      'IP Address',
      'User Agent',
    ]
    const rows = data.logs.map((l) => [
      l.createdAt,
      l.user?.name ?? '',
      l.user?.email ?? '',
      l.action,
      l.module,
      l.recordId ?? '',
      l.ip ?? '',
      l.userAgent ?? '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    link.download = `audit-logs-${stamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.logs.length} rows to CSV`)
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1) return
    if (data && newPage > data.pagination.totalPages) return
    setPage(newPage)
  }

  // SSR-safe: don't render gated content until mounted (avoids localStorage access)
  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          description="Immutable activity log — every privileged action across ALO CRM."
        />
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center text-slate-500">
            Loading...
          </CardContent>
        </Card>
      </div>
    )
  }

  // Role gate
  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          description="Immutable activity log — every privileged action across ALO CRM."
        />
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="h-14 w-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Access Restricted
              </h3>
              <p className="text-sm text-slate-500">
                You do not have permission to view audit logs. This area is
                restricted to <span style={{ color: BLUE }}>Super Admin</span>,{' '}
                <span style={{ color: BLUE }}>Admin</span>, and{' '}
                <span style={{ color: BLUE }}>Marketing Manager</span> roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 0
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1
  const showingTo = Math.min(page * limit, total)

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Audit Logs"
        description="Immutable activity log — every privileged action across ALO CRM."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void fetchLogs()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleExportCsv}
              disabled={!data || data.logs.length === 0}
              className="text-white"
              style={{ backgroundColor: ORANGE }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
            <Search className="h-4 w-4" style={{ color: BLUE }} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Module</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Action</Label>
              <Input
                placeholder="e.g. create, login, approve"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters()
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">User ID</Label>
              <Input
                placeholder="Exact user ID"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters()
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">End date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="text-white"
              style={{ backgroundColor: BLUE }}
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" style={{ color: BLUE }} />
            <h3 className="font-bold text-slate-900">Activity Log</h3>
            <Badge className="bg-slate-100 text-slate-600 border-0">
              {total} {total === 1 ? 'record' : 'records'}
            </Badge>
          </div>
          {data && total > 0 && (
            <span className="text-xs text-slate-500">
              Showing {showingFrom}–{showingTo} of {total}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                <TableHead className="whitespace-nowrap">User</TableHead>
                <TableHead className="whitespace-nowrap">Action</TableHead>
                <TableHead className="whitespace-nowrap">Module</TableHead>
                <TableHead className="whitespace-nowrap">Record ID</TableHead>
                <TableHead className="whitespace-nowrap">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-red-600">
                    Error: {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && data && data.logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No audit logs match the current filters.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                data &&
                data.logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/60">
                    <TableCell className="whitespace-nowrap text-xs text-slate-700">
                      {formatTimestamp(log.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {log.user ? (
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium text-slate-900">
                            {log.user.name || '(no name)'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {log.user.email || ''}
                          </span>
                        </div>
                      ) : log.userId ? (
                        <span className="text-xs font-mono text-slate-500">
                          {log.userId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          (anonymous)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        className="border-0 text-xs font-mono"
                        style={{
                          backgroundColor: `${actionColor(log.action)}15`,
                          color: actionColor(log.action),
                        }}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700 capitalize">
                        {log.module}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {log.recordId ? (
                        <span className="text-xs font-mono text-slate-600">
                          {log.recordId.length > 16
                            ? `${log.recordId.slice(0, 8)}…${log.recordId.slice(-4)}`
                            : log.recordId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-600">
                        {log.ip || '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sticky ALO branding footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-2 lg:pl-72"
        style={{ borderTopColor: `${BLUE}22` }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px] shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${BLUE}, #0073E6)`,
              }}
            >
              ALO
            </div>
            <span className="text-slate-600 font-medium">
              ALO Education CRM
            </span>
            <span className="text-slate-400 hidden sm:inline">
              · Audit Logs
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="hidden sm:flex items-center gap-1">
              <Shield className="h-3 w-3" style={{ color: ORANGE }} />
              Immutable record
            </span>
            <span className="text-slate-400">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
