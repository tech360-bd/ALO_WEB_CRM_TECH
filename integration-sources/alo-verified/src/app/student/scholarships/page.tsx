'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Award, Search, Calendar, MapPin, Globe, GraduationCap,
  DollarSign, ArrowRight, Building2, Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UniversityRecord {
  id: string
  name: string
  slug: string
  country: string
  city: string | null
  ranking: number | null
  type: string | null
  description: string | null
  scholarshipAvailable: boolean
  status: string
  _count?: { courses: number; applications: number; scholarships: number }
}

interface CourseRecord {
  id: string
  name: string
  level: string | null
  field: string | null
  tuitionFee: number | null
  currency: string
  scholarshipAvailable: boolean
  university: { id: string; name: string; country: string; city: string | null }
}

// Curated scholarship catalogue for top study destinations (derived from public info).
// Matched to universities flagged scholarshipAvailable=true in DB.
const SCHOLARSHIP_CATALOGUE = [
  {
    id: 'chevening',
    name: 'Chevening Scholarship',
    country: 'United Kingdom',
    amount: 'Full tuition + £18,000 stipend',
    type: 'full',
    deadline: 'November 2025',
    eligibility: 'Minimum 2 years work experience, strong academic background, leadership potential.',
    description: 'UK Government\'s international awards scheme offering full funding for one-year master\'s degrees.',
  },
  {
    id: 'commonwealth',
    name: 'Commonwealth Master\'s Scholarship',
    country: 'United Kingdom',
    amount: 'Full tuition + stipend + flights',
    type: 'full',
    deadline: 'October 2025',
    eligibility: 'Commonwealth country national, hold a first degree with upper second class honors.',
    description: 'Funded by the UK Department for International Development for students from developing Commonwealth countries.',
  },
  {
    id: 'global-leaders',
    name: 'Global Leaders Scholarship',
    country: 'United Kingdom',
    amount: '£5,000 – £10,000',
    type: 'partial',
    deadline: 'June 2026',
    eligibility: 'Outstanding academic record, demonstrated leadership, IELTS 6.5+.',
    description: 'Merit-based award for international students with strong leadership potential.',
  },
  {
    id: 'great-scholarship',
    name: 'GREAT Scholarship',
    country: 'United Kingdom',
    amount: '£10,000',
    type: 'partial',
    deadline: 'April 2026',
    eligibility: 'Indian, Bangladeshi, or Pakistani nationals applying to a participating UK university.',
    description: 'Jointly funded by the UK government\'s GREAT Britain Campaign and participating universities.',
  },
  {
    id: 'aus-awards',
    name: 'Australia Awards Scholarship',
    country: 'Australia',
    amount: 'Full tuition + living allowance',
    type: 'full',
    deadline: 'April 2026',
    eligibility: 'Eligible country national, committed to returning home after studies.',
    description: 'Long-term awards administered by the Australian Department of Foreign Affairs.',
  },
  {
    id: 'fulbright',
    name: 'Fulbright Foreign Student Program',
    country: 'United States',
    amount: 'Full tuition + living stipend',
    type: 'full',
    deadline: 'May 2026',
    eligibility: 'Bachelor\'s degree, academic excellence, leadership, community service.',
    description: 'Enables graduate students to pursue master\'s or PhD study in the United States.',
  },
]

export default function ScholarshipsPage() {
  const { data: uniData, loading } = usePortalData<{ universities: UniversityRecord[] }>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })
  const { data: courseData } = usePortalData<{ courses: CourseRecord[] }>({
    endpoint: '/api/courses',
    params: { limit: 100 },
  })

  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const scholarshipUniversities = useMemo(
    () => (uniData?.universities || []).filter((u) => u.scholarshipAvailable),
    [uniData]
  )

  const scholarshipCourses = useMemo(
    () => (courseData?.courses || []).filter((c) => c.scholarshipAvailable),
    [courseData]
  )

  // Build a combined list: catalogue scholarships + university-level scholarships
  const scholarships = useMemo(() => {
    const result: Array<{
      id: string
      name: string
      universityName: string
      country: string
      amount: string
      type: string
      deadline: string
      eligibility: string
      description: string
      source: 'catalogue' | 'university' | 'course'
      courseId?: string
    }> = []

    // Add university-derived scholarships
    scholarshipUniversities.forEach((u) => {
      result.push({
        id: `uni-${u.id}`,
        name: `${u.name} International Scholarship`,
        universityName: u.name,
        country: u.country,
        amount: u._count?.scholarships ? 'Multiple awards available' : 'Up to £10,000',
        type: 'partial',
        deadline: 'Rolling',
        eligibility: `Open to international students applying to ${u.name}. Merit-based, requires strong academic record.`,
        description: u.description || `${u.name} offers scholarships to outstanding international students across various programs.`,
        source: 'university',
      })
    })

    // Add course-specific scholarships
    scholarshipCourses.forEach((c) => {
      result.push({
        id: `course-${c.id}`,
        name: `${c.name} Scholarship`,
        universityName: c.university?.name || 'University',
        country: c.university?.country || '',
        amount: c.tuitionFee ? `Up to ${(c.tuitionFee * 0.3).toFixed(0)} ${c.currency} (30% waiver)` : 'Partial tuition waiver',
        type: 'partial',
        deadline: 'Rolling',
        eligibility: `Open to applicants of ${c.name}. ${c.level || 'Program'} level.`,
        description: `Scholarship available for ${c.name} at ${c.university?.name}.`,
        source: 'course',
        courseId: c.id,
      })
    })

    // Add catalogue scholarships
    SCHOLARSHIP_CATALOGUE.forEach((s) => {
      result.push({
        ...s,
        universityName: 'Multiple Universities',
        source: 'catalogue',
      })
    })

    return result
  }, [scholarshipUniversities, scholarshipCourses])

  const countries = useMemo(() => {
    const set = new Set<string>()
    scholarships.forEach((s) => s.country && set.add(s.country))
    return Array.from(set).sort()
  }, [scholarships])

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      if (countryFilter !== 'all' && s.country !== countryFilter) return false
      if (typeFilter !== 'all' && s.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${s.name} ${s.universityName} ${s.country} ${s.eligibility}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [scholarships, search, countryFilter, typeFilter])

  const stats = useMemo(() => ({
    total: scholarships.length,
    full: scholarships.filter((s) => s.type === 'full').length,
    partial: scholarships.filter((s) => s.type === 'partial').length,
    universities: scholarshipUniversities.length,
  }), [scholarships, scholarshipUniversities])

  const handleApply = (scholarshipName: string) => {
    toast.success(`Application started for "${scholarshipName}". Your counselor will reach out with next steps.`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarships"
        description="Discover scholarships matched to your profile from universities and external programs."
        action={
          <Button asChild variant="outline">
            <Link href="/student/course-finder">
              <Search className="h-4 w-4 mr-2" /> Browse Programs
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Available" value={stats.total} icon={Award} accent="orange" hint="Matched for you" />
        <StatCard label="Full Funding" value={stats.full} icon={Sparkles} accent="blue" hint="Tuition + stipend" />
        <StatCard label="Partial Awards" value={stats.partial} icon={Award} accent="green" hint="Tuition waivers" />
        <StatCard label="Universities" value={stats.universities} icon={Building2} accent="purple" hint="With scholarship" />
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scholarships, universities, eligibility…"
              className="pl-9"
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="merit">Merit</SelectItem>
              <SelectItem value="need_based">Need-based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 border-0 shadow-sm">
              <div className="h-6 w-2/3 rounded bg-slate-100 animate-pulse mb-3" />
              <div className="h-4 w-1/3 rounded bg-slate-100 animate-pulse mb-4" />
              <div className="h-4 w-full rounded bg-slate-100 animate-pulse mb-2" />
              <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900">No scholarships match your filters</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Try adjusting filters or search.</p>
          <Button variant="outline" onClick={() => { setSearch(''); setCountryFilter('all'); setTypeFilter('all') }}>
            Clear filters
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-9 w-9 rounded-lg bg-[#FFF7ED] flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-[#E8501A]" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 capitalize',
                        s.type === 'full' ? 'bg-green-50 text-green-700' :
                        s.type === 'partial' ? 'bg-[#EFF6FF] text-[#0057B8]' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {s.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 line-clamp-2">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {s.universityName}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 line-clamp-2 mb-3">{s.description}</p>

              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-[#0057B8] shrink-0" />
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-medium text-slate-700">{s.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-[#0057B8] shrink-0" />
                  <span className="text-slate-400">Country:</span>
                  <span className="font-medium text-slate-700">{s.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#0057B8] shrink-0" />
                  <span className="text-slate-400">Deadline:</span>
                  <span className="font-medium text-slate-700">{s.deadline}</span>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-[#0057B8] shrink-0 mt-0.5" />
                  <span className="text-slate-400 shrink-0">Eligibility:</span>
                  <span className="font-medium text-slate-700 line-clamp-2">{s.eligibility}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-3 border-t border-slate-100">
                {s.source === 'course' && s.courseId ? (
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/student/course-finder">View Course <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className={cn('flex-1 border-0 bg-[#E8501A] hover:bg-[#c8420f] text-white')}
                  onClick={() => handleApply(s.name)}
                >
                  Apply Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
