'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search, Star, MapPin, Clock, DollarSign, Award, GraduationCap,
  SlidersHorizontal, X, CheckCircle2, Globe, BookOpen,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { useShortlist, type ShortlistItem } from '@/hooks/use-shortlist'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CourseRecord {
  id: string
  name: string
  level: string | null
  field: string | null
  duration: string | null
  tuitionFee: number | null
  currency: string
  entryRequirements: string | null
  englishRequirement: string | null
  scholarshipAvailable: boolean
  description: string | null
  careerPaths: string | null
  status: string
  university: { id: string; name: string; country: string; city: string | null }
  _count?: { applications: number }
}

interface UniversityRecord {
  id: string
  name: string
  country: string
  city: string | null
  scholarshipAvailable: boolean
  ranking: number | null
}

const PROGRAM_LEVELS = ['undergraduate', 'postgraduate', 'phd', 'foundation', 'diploma']
const ENGLISH_TESTS = ['IELTS', 'TOEFL', 'PTE', 'DET']
const FEE_BUCKETS = [
  { id: 'any', label: 'Any', min: 0, max: Infinity },
  { id: 'lt10k', label: '< £10,000', min: 0, max: 10000 },
  { id: '10-20k', label: '£10,000 – £20,000', min: 10000, max: 20000 },
  { id: '20-30k', label: '£20,000 – £30,000', min: 20000, max: 30000 },
  { id: 'gt30k', label: '£30,000+', min: 30000, max: Infinity },
]

export default function CourseFinderPage() {
  const { data: courseData, loading } = usePortalData<{ courses: CourseRecord[] }>({
    endpoint: '/api/courses',
    params: { limit: 100 },
  })
  const { data: uniData } = usePortalData<{ universities: UniversityRecord[] }>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })

  const { isShortlisted, toggle } = useShortlist()

  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [level, setLevel] = useState('all')
  const [field, setField] = useState('all')
  const [feeBucket, setFeeBucket] = useState('any')
  const [scholarshipOnly, setScholarshipOnly] = useState(false)
  const [englishTest, setEnglishTest] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseRecord | null>(null)

  const courses = courseData?.courses || []
  const universities = uniData?.universities || []

  const countries = useMemo(() => {
    const set = new Set<string>()
    universities.forEach((u) => u.country && set.add(u.country))
    courses.forEach((c) => c.university?.country && set.add(c.university.country))
    return Array.from(set).sort()
  }, [universities, courses])

  const fields = useMemo(() => {
    const set = new Set<string>()
    courses.forEach((c) => c.field && set.add(c.field))
    return Array.from(set).sort()
  }, [courses])

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        const hay = `${c.name} ${c.university?.name || ''} ${c.field || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (country !== 'all' && c.university?.country !== country) return false
      if (level !== 'all' && c.level !== level) return false
      if (field !== 'all' && c.field !== field) return false
      if (scholarshipOnly && !c.scholarshipAvailable) return false
      if (englishTest !== 'all') {
        const req = (c.englishRequirement || '').toLowerCase()
        if (!req.includes(englishTest.toLowerCase())) return false
      }
      if (feeBucket !== 'any' && c.tuitionFee != null) {
        const bucket = FEE_BUCKETS.find((b) => b.id === feeBucket)
        if (bucket && (c.tuitionFee < bucket.min || c.tuitionFee > bucket.max)) return false
      }
      return true
    })
  }, [courses, search, country, level, field, feeBucket, scholarshipOnly, englishTest])

  const activeFilterCount =
    (search ? 0 : 0) +
    (country !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (field !== 'all' ? 1 : 0) +
    (feeBucket !== 'any' ? 1 : 0) +
    (scholarshipOnly ? 1 : 0) +
    (englishTest !== 'all' ? 1 : 0)

  const clearFilters = () => {
    setSearch('')
    setCountry('all')
    setLevel('all')
    setField('all')
    setFeeBucket('any')
    setScholarshipOnly(false)
    setEnglishTest('all')
  }

  const handleToggleShortlist = (c: CourseRecord) => {
    const item: ShortlistItem = {
      courseId: c.id,
      name: c.name,
      universityName: c.university?.name || 'Unknown',
      country: c.university?.country || '',
      city: c.university?.city || null,
      level: c.level,
      field: c.field,
      duration: c.duration,
      tuitionFee: c.tuitionFee,
      currency: c.currency || 'GBP',
      scholarshipAvailable: c.scholarshipAvailable,
      addedAt: new Date().toISOString(),
    }
    const added = toggle(item)
    toast.success(added ? 'Added to shortlist' : 'Removed from shortlist')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Finder"
        description="Search 10+ programs across top universities. Filter by country, level, tuition, scholarships, and more."
        action={
          <Button asChild variant="outline" className="lg:hidden">
            <Link href="/student/shortlist">
              <Star className="h-4 w-4 mr-2" /> Shortlist
            </Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar Filters */}
        <div className={cn('space-y-4', !showFilters && 'hidden lg:block')}>
          <Card className="p-5 border-0 shadow-sm lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#0057B8]" />
                <h3 className="font-bold text-slate-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <Badge className="bg-[#0057B8] text-white border-0">{activeFilterCount}</Badge>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-[#E8501A] hover:underline">
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Country
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Program Level
                </Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {PROGRAM_LEVELS.map((l) => (
                      <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Field of Study
                </Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fields</SelectItem>
                    {fields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Tuition Fee
                </Label>
                <Select value={feeBucket} onValueChange={setFeeBucket}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FEE_BUCKETS.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> English Test Accepted
                </Label>
                <Select value={englishTest} onValueChange={setEnglishTest}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {ENGLISH_TESTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#E8501A]" />
                  <Label className="text-xs font-medium text-slate-600 cursor-pointer">Scholarship available</Label>
                </div>
                <Switch checked={scholarshipOnly} onCheckedChange={setScholarshipOnly} />
              </div>
            </div>
          </Card>
        </div>

        {/* Main List */}
        <div className="space-y-4 min-w-0">
          {/* Search bar (mobile + desktop) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs, universities…"
                className="pl-9 h-10 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowFilters((s) => !s)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-[#0057B8] text-white border-0">{activeFilterCount}</Badge>
              )}
            </Button>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {loading ? 'Loading programs…' : `${filtered.length} program${filtered.length === 1 ? '' : 's'} found`}
            </span>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5 border-0 shadow-sm">
                  <div className="h-5 w-3/4 rounded bg-slate-100 animate-pulse mb-3" />
                  <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse mb-4" />
                  <div className="h-4 w-full rounded bg-slate-100 animate-pulse mb-2" />
                  <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900">No programs match your filters</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Try adjusting or clearing filters.</p>
              <Button onClick={clearFilters} variant="outline">Clear all filters</Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  shortlisted={isShortlisted(c.id)}
                  onShortlist={() => handleToggleShortlist(c)}
                  onViewDetails={() => setSelectedCourse(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCourse && (
        <CourseDetailDialog
          course={selectedCourse}
          shortlisted={isShortlisted(selectedCourse.id)}
          onShortlist={() => handleToggleShortlist(selectedCourse)}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  )
}

function CourseCard({
  course,
  shortlisted,
  onShortlist,
  onViewDetails,
}: {
  course: CourseRecord
  shortlisted: boolean
  onShortlist: () => void
  onViewDetails: () => void
}) {
  const feeLabel = course.tuitionFee != null
    ? `${course.currency} ${course.tuitionFee.toLocaleString()}/yr`
    : 'Fee on request'

  return (
    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <button onClick={onViewDetails} className="text-left">
            <h3 className="font-bold text-slate-900 hover:text-[#0057B8] transition-colors line-clamp-2">
              {course.name}
            </h3>
          </button>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            {course.university?.name || 'Unknown University'}
          </p>
        </div>
        <button
          onClick={onShortlist}
          className={cn(
            'shrink-0 p-1.5 rounded-lg transition-colors',
            shortlisted ? 'text-[#E8501A] bg-[#FFF7ED]' : 'text-slate-300 hover:text-[#E8501A] hover:bg-slate-50'
          )}
          aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        >
          <Star className={cn('h-5 w-5', shortlisted && 'fill-current')} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {course.level && (
          <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-[#0057B8]/20 capitalize">
            {course.level}
          </Badge>
        )}
        {course.scholarshipAvailable && (
          <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-[#E8501A]/20">
            <Award className="h-3 w-3 mr-1" /> Scholarship
          </Badge>
        )}
        {course.field && (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
            {course.field}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-4">
        <div className="flex flex-col">
          <span className="text-slate-400 mb-0.5">Location</span>
          <span className="font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#0057B8]" />
            {course.university?.city || course.university?.country || '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400 mb-0.5">Duration</span>
          <span className="font-medium flex items-center gap-1">
            <Clock className="h-3 w-3 text-[#0057B8]" />
            {course.duration || '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400 mb-0.5">Tuition</span>
          <span className="font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-[#0057B8]" />
            {feeLabel}
          </span>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-[#0057B8]/20 text-[#0057B8] hover:bg-[#EFF6FF]"
          onClick={onViewDetails}
        >
          View Details
        </Button>
        <Button
          size="sm"
          className={cn(
            'flex-1 border-0',
            shortlisted
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-[#E8501A] hover:bg-[#c8420f] text-white'
          )}
          onClick={onShortlist}
        >
          <Star className={cn('h-3.5 w-3.5 mr-1.5', shortlisted && 'fill-current')} />
          {shortlisted ? 'Shortlisted' : 'Shortlist'}
        </Button>
      </div>
    </Card>
  )
}

function CourseDetailDialog({
  course,
  shortlisted,
  onShortlist,
  onClose,
}: {
  course: CourseRecord
  shortlisted: boolean
  onShortlist: () => void
  onClose: () => void
}) {
  // close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto alo-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{course.name}</h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              {course.university?.name} • {course.university?.city}, {course.university?.country}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Level" value={course.level || '—'} />
            <Stat label="Field" value={course.field || '—'} />
            <Stat label="Duration" value={course.duration || '—'} />
            <Stat label="Tuition" value={course.tuitionFee != null ? `${course.currency} ${course.tuitionFee.toLocaleString()}` : '—'} />
          </div>

          {course.description && (
            <Section title="Overview">
              <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
            </Section>
          )}

          {course.entryRequirements && (
            <Section title="Entry Requirements">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{course.entryRequirements}</p>
            </Section>
          )}

          {course.englishRequirement && (
            <Section title="English Language Requirement">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{course.englishRequirement}</p>
            </Section>
          )}

          {course.careerPaths && (
            <Section title="Career Paths">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{course.careerPaths}</p>
            </Section>
          )}

          {course.scholarshipAvailable && (
            <div className="p-4 rounded-lg bg-[#FFF7ED] border border-[#E8501A]/20 flex items-start gap-3">
              <Award className="h-5 w-5 text-[#E8501A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#E8501A]">Scholarship Available</p>
                <p className="text-xs text-slate-600 mt-1">
                  This program offers scholarship opportunities. Contact your counselor to learn more.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              className="flex-1 border-[#0057B8]/20 text-[#0057B8] hover:bg-[#EFF6FF]"
              onClick={onShortlist}
            >
              <Star className={cn('h-4 w-4 mr-2', shortlisted && 'fill-current text-[#E8501A]')} />
              {shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            </Button>
            <Button asChild className="flex-1 bg-[#0057B8] hover:bg-[#00449a] text-white">
              <Link href="/student/applications">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Apply Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
      {children}
    </div>
  )
}
