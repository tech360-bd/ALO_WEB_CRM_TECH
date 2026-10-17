'use client'

import { useMemo } from 'react'
import {
  TrendingUp, Building2, Globe, GraduationCap, Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'

interface CommissionRow {
  id: string
  commissionId: string
  amount: number
  currency: string
  triggerStage: string
  status: string
  application: {
    id: string
    applicationId: string
    student: { firstName: string; lastName: string; studentId: string }
    university: { name: string }
  } | null
}

interface CommissionResponse {
  commissions: CommissionRow[]
  summary: { totalAmount: number; pendingAmount: number; paidAmount: number }
}

interface UniResponse {
  universities: Array<{ id: string; name: string; country: string; city: string | null }>
}

interface PartnerResponse {
  partners: Array<{ id: string; companyName: string; commissionRate: number; country: string }>
}

interface CourseRow {
  id: string
  name: string
  level: string | null
  tuitionFee: number | null
  university: { id: string; name: string; country: string }
}
interface CourseResponse {
  courses: CourseRow[]
}

const STAGE_LABELS: Record<string, string> = {
  application_submitted: 'On application submission',
  offer_received: 'On offer received',
  deposit_paid: 'On deposit paid',
  cas_received: 'On CAS received',
  visa_approved: 'On visa approved',
  enrollment_confirmed: 'On enrollment confirmed',
  custom: 'Custom',
}

export default function CommissionStructurePage() {
  const session = getSession()
  const partnerId = session?.user.referenceId

  const { data, loading } = usePortalData<CommissionResponse>({
    endpoint: '/api/commissions',
    params: { partnerId: partnerId || '', limit: 200 },
  })

  const { data: uniData } = usePortalData<UniResponse>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })

  const { data: partnerData } = usePortalData<PartnerResponse>({
    endpoint: '/api/partners',
    params: { search: '' },
  })

  const { data: courseData } = usePortalData<CourseResponse>({
    endpoint: '/api/courses',
    params: { limit: 100 },
  })

  const structureRows = useMemo(() => {
    // Group commissions by university to derive per-uni rates
    const byUni = new Map<string, { name: string; country: string; total: number; count: number; stages: Set<string>; currency: string }>()

    data?.commissions?.forEach((c) => {
      if (!c.application?.university?.name) return
      const key = c.application.university.name
      const existing = byUni.get(key) || {
        name: c.application.university.name,
        country: '',
        total: 0,
        count: 0,
        stages: new Set<string>(),
        currency: c.currency,
      }
      existing.total += c.amount
      existing.count += 1
      existing.stages.add(c.triggerStage)
      byUni.set(key, existing)
    })

    // Augment with university list (for unis that have courses but no commissions yet)
    uniData?.universities?.forEach((u) => {
      if (!byUni.has(u.name)) {
        byUni.set(u.name, {
          name: u.name,
          country: u.country,
          total: 0,
          count: 0,
          stages: new Set(['enrollment_confirmed']),
          currency: 'GBP',
        })
      } else {
        const r = byUni.get(u.name)!
        r.country = u.country
      }
    })

    return Array.from(byUni.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [data, uniData])

  // Derive partner-level commission rate
  const partner = partnerData?.partners?.find((p) => p.id === partnerId)
  const defaultRate = partner?.commissionRate ?? 0

  // Per-uni program levels
  const levelByUni = useMemo(() => {
    const m = new Map<string, Set<string>>()
    courseData?.courses?.forEach((c) => {
      if (!c.university?.name || !c.level) return
      const set = m.get(c.university.name) || new Set<string>()
      set.add(c.level)
      m.set(c.university.name, set)
    })
    return m
  }, [courseData])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Structure"
        description="Your commission rates and earnings potential across all partner universities."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Partner Default Rate" value={`${defaultRate}%`} icon={TrendingUp} accent="blue" hint="Base commission rate" />
        <StatCard label="Universities" value={structureRows.length} icon={Building2} accent="purple" />
        <StatCard label="Total Earned" value={(data?.summary?.totalAmount ?? 0).toLocaleString()} icon={TrendingUp} accent="green" />
        <StatCard label="Pending" value={(data?.summary?.pendingAmount ?? 0).toLocaleString()} icon={Info} accent="amber" />
      </div>

      {/* Info banner */}
      <Card className="p-4 border-0 shadow-sm bg-[#EFF6FF]">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-[#0057B8] shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-0.5">How commissions work</p>
            <p className="text-xs text-slate-600">
              Commission is earned at the <span className="font-semibold">enrollment confirmed</span> stage for each student you register who enrolls at a partner university. Rates may vary by university and program level. Contact your account manager to discuss custom rates.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">University Commission Rates</h3>
          <p className="text-xs text-slate-500 mt-0.5">Per-university breakdown of commission structure</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-semibold">University</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Country</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Program Levels</th>
                <th className="px-4 py-3 font-semibold text-right">Commission Rate</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Trigger Stage</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : structureRows.length > 0 ? (
                structureRows.map((row) => {
                  // Derive rate: if partner has commissions for this uni, show average, otherwise show default rate
                  const avgCommission = row.count > 0 ? Math.round(row.total / row.count) : 0
                  const rate = row.count > 0 ? `${defaultRate}%` : `${defaultRate}%`
                  const levels = levelByUni.get(row.name)
                  return (
                    <tr key={row.name} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {row.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="text-xs text-slate-500 md:hidden">{row.country}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-400" /> {row.country || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {levels ? Array.from(levels).map((l) => (
                            <Badge key={l} variant="outline" className="capitalize text-[10px] bg-slate-50">
                              <GraduationCap className="h-2.5 w-2.5 mr-1" /> {l}
                            </Badge>
                          )) : <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-[#0057B8]">{rate}</p>
                        {avgCommission > 0 && (
                          <p className="text-[10px] text-slate-500">avg {avgCommission.toLocaleString()} {row.currency}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-orange-200">
                          Percentage
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">
                        {Array.from(row.stages).map((s) => STAGE_LABELS[s] || s).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                        {row.count > 0 ? `${row.count} commissions earned` : 'Standard partner rate applies'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-1 font-medium">No commission data yet</p>
                    <p className="text-xs text-slate-400">Commission structure appears here once universities are loaded.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 border-0 shadow-sm">
        <h4 className="font-semibold text-slate-900 text-sm mb-3">Commission Trigger Stages</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {Object.entries(STAGE_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 p-2 rounded bg-slate-50">
              <div className="h-2 w-2 rounded-full bg-[#0057B8]" />
              <span className="text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
