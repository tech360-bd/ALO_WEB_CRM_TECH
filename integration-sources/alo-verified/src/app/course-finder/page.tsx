'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search, MapPin, BookOpen, ArrowRight, Building2, PoundSterling,
  Clock, Award, AlertCircle, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'

interface CourseResult {
  id: string
  name: string
  slug: string | null
  level: string | null
  field: string | null
  duration: string | null
  tuitionFee: number | null
  currency: string
  scholarshipAvailable: boolean
  university: {
    id: string
    name: string
    slug: string | null
    country: string
    city: string | null
  }
}

interface CoursesApiResponse {
  courses: CourseResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    countries: string[]
    fields: string[]
    levels: string[]
  }
}

const LEVEL_LABELS: Record<string, string> = {
  foundation: 'Foundation',
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  phd: 'PhD',
  diploma: 'Diploma',
}

function getCountryFlag(country: string): string {
  const map: Record<string, string> = {
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
    Canada: '🇨🇦',
    Australia: '🇦🇺',
    Germany: '🇩🇪',
    Malaysia: '🇲🇾',
    Europe: '🇪🇺',
  }
  return map[country] || '🌍'
}

export default function CourseFinderPage() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [level, setLevel] = useState('all')
  const [field, setField] = useState('all')
  const [page, setPage] = useState(1)

  const [data, setData] = useState<CoursesApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limit = 12

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (country && country !== 'all') params.set('country', country)
      if (level && level !== 'all') params.set('level', level)
      if (field && field !== 'all') params.set('field', field)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/public/courses?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const json = (await res.json()) as CoursesApiResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [search, country, level, field, page])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCourses()
  }

  const resetFilters = () => {
    setSearch('')
    setCountry('all')
    setLevel('all')
    setField('all')
    setPage(1)
  }

  const totalPages = data?.pagination.totalPages || 1
  const currentPage = data?.pagination.page || 1

  return (
    <PublicSiteLayout>
      {/* Hero */}
      <section
        className="text-white py-14 lg:py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Badge
            className="mb-4 border"
            style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
          >
            Course Finder
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Find Your <span style={{ color: '#FFB347' }}>Perfect Course</span>
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            Search across our verified course catalogue by name, country, level, or field. Every
            listing comes from the ALO Education admissions database.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="bg-white border-b border-gray-100 py-6 sticky top-16 lg:top-18 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div className="lg:col-span-1">
              <Label htmlFor="search" className="sr-only">Course name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Course name, e.g. MBA"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country" className="sr-only">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="h-12 w-full">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {(data?.filters.countries || []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {getCountryFlag(c)} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level" className="sr-only">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level" className="h-12 w-full">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {(data?.filters.levels || []).map((l) => (
                    <SelectItem key={l} value={l}>
                      {LEVEL_LABELS[l] || l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="field" className="sr-only">Field</Label>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger id="field" className="h-12 w-full">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  {(data?.filters.fields || []).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="h-12 flex-1 text-white font-semibold"
                style={{ background: '#E8501A' }}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-12"
                style={{ borderColor: '#0057B8', color: '#0057B8' }}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="bg-[#F7F9FC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#1A2332]">
                Results {data && <span style={{ color: '#E8501A' }}>({data.pagination.total})</span>}
              </h2>
              <p className="text-xs text-[#555555] mt-0.5">Real course data from ALO Education&apos;s admissions database.</p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-[#0057B8]" />}
          </div>

          {error && (
            <div className="bg-white border border-red-100 rounded-xl p-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
              <h3 className="font-semibold text-[#1A2332]">Couldn&apos;t load courses</h3>
              <p className="text-sm text-[#555555] mt-1">{error}</p>
              <Button
                onClick={() => fetchCourses()}
                className="mt-4 h-11"
                style={{ background: '#0057B8', color: 'white' }}
              >
                Try again
              </Button>
            </div>
          )}

          {!error && !loading && data && data.courses.length === 0 && (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A2332]">No courses match your filters</h3>
              <p className="text-sm text-[#555555] mt-1 max-w-md mx-auto">
                Try adjusting your search terms, or talk to an ALO Education counselor about other
                available courses.
              </p>
              <Link href="/book-consultation">
                <Button
                  className="mt-5 h-12 text-white font-semibold"
                  style={{ background: '#E8501A' }}
                >
                  Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {!error && data && data.courses.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.courses.map((c) => (
                  <Card
                    key={c.id}
                    className="border-0 shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col"
                  >
                    <div className="h-1.5" style={{ background: '#0057B8' }} />
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors line-clamp-2">
                          {c.name}
                        </h3>
                        {c.scholarshipAvailable && (
                          <Badge className="text-[10px] shrink-0" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: 0 }}>
                            <Award className="h-3 w-3 mr-1" />Scholarship
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#555555] flex items-center gap-1 mb-3">
                        <Building2 className="h-3 w-3" />
                        {c.university.name}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[#555555] mb-4">
                        {c.level && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" style={{ color: '#0057B8' }} />
                            {LEVEL_LABELS[c.level] || c.level}
                          </div>
                        )}
                        {c.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" style={{ color: '#0057B8' }} />
                            {c.duration}
                          </div>
                        )}
                        {typeof c.tuitionFee === 'number' && (
                          <div className="flex items-center gap-1">
                            <PoundSterling className="h-3 w-3" style={{ color: '#10B981' }} />
                            {c.currency} {c.tuitionFee.toLocaleString()}/yr
                          </div>
                        )}
                        {c.field && (
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" style={{ color: '#E8501A' }} />
                            {c.field}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-[#555555] flex items-center gap-1 mb-4">
                        <MapPin className="h-3 w-3" />
                        {getCountryFlag(c.university.country)} {c.university.country}
                      </div>

                      <div className="mt-auto">
                        {c.slug ? (
                          <Link href={`/course/${c.slug}`}>
                            <Button
                              className="w-full h-12 text-white font-semibold"
                              style={{ background: '#E8501A' }}
                              size="sm"
                            >
                              View Course <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/book-consultation">
                            <Button
                              variant="outline"
                              className="w-full h-12 font-semibold"
                              style={{ borderColor: '#0057B8', color: '#0057B8' }}
                              size="sm"
                            >
                              Ask About This Course <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || loading}
                    className="h-11"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <div className="text-sm text-[#555555]">
                    Page <strong className="text-[#1A2332]">{currentPage}</strong> of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || loading}
                    className="h-11"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicSiteLayout>
  )
}
