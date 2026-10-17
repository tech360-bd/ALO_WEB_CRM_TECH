'use client'

import { useMemo, useState } from 'react'
import {
  Clock, Calendar, AlertTriangle, CheckCircle2, Filter, X,
  Building2, MapPin, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import Link from 'next/link'

interface University {
  id: string
  name: string
  country: string
  city: string | null
  ranking: number | null
  scholarshipAvailable: boolean
}

interface UniResponse {
  universities: University[]
}

interface CourseRow {
  id: string
  name: string
  level: string | null
  field: string | null
  duration: string | null
  university: { id: string; name: string; country: string }
}

interface CourseResponse {
  courses: CourseRow[]
}

interface Deadline {
  id: string
  universityId: string
  universityName: string
  country: string
  program: string
  intake: string
  deadlineDate: Date
  daysRemaining: number
}

function buildDeadlines(universities: University[], courses: CourseRow[]): Deadline[] {
  const now = new Date()
  const out: Deadline[] = []

  // Intake cycles for the next 12 months — application deadline typically 3 months before intake
  const intakeCycles = [
    { label: 'September 2026', intake: new Date(2026, 8, 1), monthsBefore: 3 },
    { label: 'January 2027', intake: new Date(2027, 0, 1), monthsBefore: 2 },
    { label: 'May 2027', intake: new Date(2027, 4, 1), monthsBefore: 2 },
    { label: 'September 2027', intake: new Date(2027, 8, 1), monthsBefore: 3 },
  ]

  // For each university, pick the next 2 upcoming intakes that haven't passed
  universities.forEach((u) => {
    // Find a representative program from courses for this uni
    const uniCourses = courses.filter((c) => c.university.id === u.id)
    const programName = uniCourses[0]?.name || 'Various Undergraduate & Postgraduate Programs'

    intakeCycles.forEach((ic) => {
      const deadlineDate = new Date(ic.intake)
      deadlineDate.setMonth(deadlineDate.getMonth() - ic.monthsBefore)
      if (deadlineDate > now) {
        const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysRemaining <= 365) { // Only show within the next year
          out.push({
            id: `${u.id}-${ic.label}`,
            universityId: u.id,
            universityName: u.name,
            country: u.country,
            program: programName,
            intake: ic.label,
            deadlineDate,
            daysRemaining,
          })
        }
      }
    })
  })

  return out.sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime())
}

const urgencyColor = (days: number) => {
  if (days < 7) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Critical', dot: 'bg-red-500' }
  if (days < 30) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Soon', dot: 'bg-amber-500' }
  if (days < 90) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Upcoming', dot: 'bg-blue-500' }
  return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Open', dot: 'bg-green-500' }
}

export default function DeadlinesPage() {
  const { data: uniData, loading } = usePortalData<UniResponse>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })
  const { data: courseData } = usePortalData<CourseResponse>({
    endpoint: '/api/courses',
    params: { limit: 100 },
  })

  const [universityFilter, setUniversityFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')

  const allDeadlines = useMemo(
    () => buildDeadlines(uniData?.universities ?? [], courseData?.courses ?? []),
    [uniData, courseData]
  )

  const filtered = useMemo(() => {
    let list = allDeadlines
    if (universityFilter !== 'all') list = list.filter((d) => d.universityId === universityFilter)
    if (urgencyFilter !== 'all') {
      list = list.filter((d) => {
        if (urgencyFilter === 'critical') return d.daysRemaining < 7
        if (urgencyFilter === 'soon') return d.daysRemaining >= 7 && d.daysRemaining < 30
        if (urgencyFilter === 'upcoming') return d.daysRemaining >= 30 && d.daysRemaining < 90
        if (urgencyFilter === 'open') return d.daysRemaining >= 90
        return true
      })
    }
    return list
  }, [allDeadlines, universityFilter, urgencyFilter])

  const stats = {
    total: allDeadlines.length,
    critical: allDeadlines.filter((d) => d.daysRemaining < 7).length,
    soon: allDeadlines.filter((d) => d.daysRemaining >= 7 && d.daysRemaining < 30).length,
    open: allDeadlines.filter((d) => d.daysRemaining >= 90).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Deadlines"
        description="Application deadlines across all partner universities — never miss a submission window."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Deadlines" value={stats.total} icon={Calendar} accent="blue" />
        <StatCard label="Critical (<7 days)" value={stats.critical} icon={AlertTriangle} accent="orange" />
        <StatCard label="Soon (<30 days)" value={stats.soon} icon={Clock} accent="amber" />
        <StatCard label="Open (>90 days)" value={stats.open} icon={CheckCircle2} accent="green" />
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400 mr-1" />
        <Select value={universityFilter} onValueChange={setUniversityFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Universities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {uniData?.universities?.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="critical">Critical (&lt; 7 days)</SelectItem>
            <SelectItem value="soon">Soon (7-30 days)</SelectItem>
            <SelectItem value="upcoming">Upcoming (30-90 days)</SelectItem>
            <SelectItem value="open">Open (&gt; 90 days)</SelectItem>
          </SelectContent>
        </Select>
        {(universityFilter !== 'all' || urgencyFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setUniversityFilter('all'); setUrgencyFilter('all') }}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <div className="ml-auto text-xs text-slate-500">{filtered.length} deadline{filtered.length !== 1 ? 's' : ''}</div>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 border-0 shadow-sm">
              <div className="h-16 bg-slate-100 rounded animate-pulse" />
            </Card>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((d) => {
            const u = urgencyColor(d.daysRemaining)
            return (
              <Card key={d.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Days remaining */}
                  <div className={'h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0 ' + u.bg}>
                    <p className={'text-lg font-bold leading-none ' + u.text}>{d.daysRemaining}</p>
                    <p className={'text-[10px] font-medium ' + u.text}>days</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">{d.universityName}</p>
                      <Badge variant="outline" className={u.bg + ' ' + u.text + ' ' + u.border}>
                        <span className={'h-1.5 w-1.5 rounded-full mr-1 ' + u.dot} />
                        {u.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {d.country}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Intake: {d.intake}
                      </span>
                      <span>•</span>
                      <span className="font-medium">Deadline: {d.deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1 truncate">{d.program}</p>
                  </div>

                  <Button asChild size="sm" variant="outline" className="shrink-0 border-[#0057B8] text-[#0057B8] hover:bg-[#EFF6FF]">
                    <Link href="/partner/search-programs">
                      Search Programs <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 border-0 shadow-sm text-center">
            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-1 font-medium">No deadlines match your filters</p>
            <p className="text-xs text-slate-400 mb-4">Try selecting a different university or urgency level.</p>
            <Button variant="outline" onClick={() => { setUniversityFilter('all'); setUrgencyFilter('all') }}>
              <X className="h-4 w-4 mr-2" /> Clear Filters
            </Button>
          </Card>
        )}
      </div>

      {/* Legend */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-[#0057B8]" />
          <h4 className="font-semibold text-slate-900 text-sm">Urgency Legend</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Critical', desc: '< 7 days', color: 'bg-red-50 text-red-700 border-red-200' },
            { label: 'Soon', desc: '7-30 days', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Upcoming', desc: '30-90 days', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Open', desc: '> 90 days', color: 'bg-green-50 text-green-700 border-green-200' },
          ].map((l) => (
            <div key={l.label} className={'p-2 rounded-lg border ' + l.color}>
              <p className="text-xs font-semibold">{l.label}</p>
              <p className="text-[10px] opacity-80">{l.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
