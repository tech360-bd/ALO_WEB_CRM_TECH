'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, Download, Users, FileText, Wallet, TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'

interface ReportsData {
  totals: { students: number; applications: number; commissions: number; commissionAmount: number }
  commissionByStatus: Array<{ status: string; count: number; amount: number }>
  applicationsByStatus: Array<{ status: string; count: number }>
  applicationsByUniversity: Array<{ name: string; count: number }>
  recentStudents: Array<{ id: string; studentId: string; firstName: string; lastName: string; email: string; status: string; createdAt: string }>
  recentApplications: Array<{
    id: string; applicationId: string; status: string;
    student: { firstName: string; lastName: string; studentId: string };
    university: { name: string; country: string | null };
    course: { name: string; level: string | null } | null;
  }>
}

export default function PartnerAdminReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (!session) return
    fetch('/api/partner-admin/reports?months=12', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${r.status}`)
        }
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function exportCsv() {
    if (!data) return
    const rows = [
      ['Application ID', 'Student', 'University', 'Course', 'Status', 'Date'],
      ...data.recentApplications.map((a) => [
        a.applicationId,
        `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim(),
        a.university?.name || '',
        a.course?.name || '',
        a.status,
        new Date().toISOString(),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `partner-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported')
  }

  const totals = data?.totals

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Partner-scoped performance metrics. Export to CSV for offline analysis."
        action={
          <Button onClick={exportCsv} disabled={!data} variant="outline" className="h-12">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        }
      />

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={totals?.students ?? 0} icon={Users} accent="blue" />
        <StatCard label="Total Applications" value={totals?.applications ?? 0} icon={FileText} accent="orange" />
        <StatCard label="Commissions" value={totals?.commissions ?? 0} icon={BarChart3} accent="purple" hint="across all stages" />
        <StatCard label="Commission Amount" value={`£${(totals?.commissionAmount ?? 0).toLocaleString()}`} icon={Wallet} accent="green" />
      </div>

      {/* Applications by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0057B8]" /> Applications by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.applicationsByStatus && data.applicationsByStatus.length > 0 ? (
              <div className="space-y-2">
                {data.applicationsByStatus.map((s) => {
                  const total = data.totals.applications || 1
                  const pct = (s.count / total) * 100
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <div className="w-40 text-sm capitalize text-slate-700 font-medium">
                        {s.status.replace(/_/g, ' ')}
                      </div>
                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0057B8] to-[#0073E6]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-sm font-semibold text-slate-900">{s.count}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No application data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#E8501A]" /> Commission by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.commissionByStatus && data.commissionByStatus.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commissionByStatus.map((c) => (
                    <TableRow key={c.status}>
                      <TableCell className="capitalize">{c.status.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right font-semibold">£{c.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No commission data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By university */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Applications by University</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.applicationsByUniversity && data.applicationsByUniversity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.applicationsByUniversity.map((u) => {
                  const total = data.totals.applications || 1
                  const pct = ((u.count / total) * 100).toFixed(1)
                  return (
                    <TableRow key={u.name}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-right">{u.count}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">{pct}%</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No university data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recent applications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentApplications && data.recentApplications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentApplications.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.applicationId}</TableCell>
                    <TableCell>{a.student?.firstName} {a.student?.lastName}</TableCell>
                    <TableCell>{a.university?.name}</TableCell>
                    <TableCell className="text-xs">{a.course?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {a.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No applications yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
