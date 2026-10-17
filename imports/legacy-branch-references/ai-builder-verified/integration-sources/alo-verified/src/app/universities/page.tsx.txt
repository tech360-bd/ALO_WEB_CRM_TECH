import Link from 'next/link'
import { db } from '@/lib/db'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Award, BookOpen, Globe, Building2, ArrowRight, GraduationCap, Search,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Universities — ALO Education',
  description:
    'Explore ALO Education partner universities across the UK, USA, Canada, Australia, Europe, and Malaysia. Find the right university for your study-abroad journey.',
  keywords: ['study abroad', 'partner universities', 'UK universities', 'ALO Education'],
  openGraph: {
    title: 'Universities — ALO Education',
    description: 'Browse our partner universities and find the right fit.',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((w) => !['of', 'the', 'and', 'for'].includes(w.toLowerCase()))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
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

export default async function UniversitiesPage() {
  let universities: Array<{
    id: string
    name: string
    slug: string
    country: string
    city: string | null
    ranking: number | null
    type: string | null
    scholarshipAvailable: boolean
  }> = []
  let dbError = false

  try {
    universities = await db.university.findMany({
      where: { status: 'active' },
      orderBy: [{ ranking: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        city: true,
        ranking: true,
        type: true,
        scholarshipAvailable: true,
      },
    })
  } catch (e) {
    console.error('UniversitiesPage: failed to load universities', e)
    dbError = true
  }

  return (
    <PublicSiteLayout>
      {/* Hero */}
      <section
        className="text-white py-16 lg:py-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Badge
            className="mb-4 border"
            style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
          >
            {universities.length}+ Verified Partner Universities
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Explore <span style={{ color: '#FFB347' }}>World-Class</span> Universities
          </h1>
          <p className="mt-4 text-gray-200 max-w-2xl text-lg">
            Browse our verified network of partner universities across the UK, USA, Canada,
            Australia, Europe, and Malaysia. Every profile is sourced from our admissions database.
          </p>
        </div>
      </section>

      {/* Listing */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1A2332]">
                All Universities <span style={{ color: '#E8501A' }}>({universities.length})</span>
              </h2>
              <p className="text-sm text-[#555555] mt-1">
                Real data from ALO Education&apos;s admissions database.
              </p>
            </div>
            <Link href="/book-consultation" className="hidden sm:block">
              <Button
                className="h-11 px-4 text-white font-semibold"
                style={{ background: '#E8501A' }}
              >
                Get Free Guidance <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {dbError ? (
            <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
              <Building2 className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#1A2332]">Couldn&apos;t load universities</h3>
              <p className="text-sm text-[#555555] mt-2 max-w-md mx-auto">
                We&apos;re unable to connect to the universities database right now. Please try
                again later or contact an ALO Education counselor.
              </p>
            </div>
          ) : universities.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2332]">No universities published yet</h3>
              <p className="text-[#555555] mt-2 max-w-md mx-auto">
                Information not currently verified. Please check with an ALO Education counselor
                for the latest partner university list.
              </p>
              <Link href="/book-consultation">
                <Button
                  className="mt-6 h-12 text-white font-semibold"
                  style={{ background: '#E8501A' }}
                >
                  Talk to a Counselor <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {universities.map((u) => (
                <Card
                  key={u.id}
                  className="border-0 shadow-sm hover:shadow-lg transition-all group overflow-hidden"
                >
                  <div className="h-1.5" style={{ background: '#0057B8' }} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ background: '#0057B8' }}
                      >
                        {getInitials(u.name) || '🎓'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors line-clamp-1">
                          {u.name}
                        </h3>
                        <p className="text-xs text-[#555555] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {u.city ? `${u.city}, ` : ''}
                          {getCountryFlag(u.country)} {u.country}
                        </p>
                      </div>
                      {typeof u.ranking === 'number' && (
                        <Badge
                          className="text-xs font-semibold shrink-0"
                          style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}
                        >
                          QS #{u.ranking}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {u.type && (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" /> {u.type}
                        </Badge>
                      )}
                      {u.scholarshipAvailable && (
                        <Badge
                          className="text-xs"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: 0 }}
                        >
                          <Award className="h-3 w-3 mr-1" /> Scholarships
                        </Badge>
                      )}
                    </div>

                    <Link href={`/universities/${u.slug}`}>
                      <Button
                        className="w-full h-12 text-white font-semibold"
                        style={{ background: '#E8501A' }}
                        size="sm"
                      >
                        View University <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Help block */}
          <div className="mt-10 bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,87,184,0.1)' }}
            >
              <Globe className="h-6 w-6" style={{ color: '#0057B8' }} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-[#1A2332]">Can&apos;t find your university?</h3>
              <p className="text-sm text-[#555555]">
                We partner with hundreds of universities. Tell us what you&apos;re looking for and
                we&apos;ll help you find the perfect match.
              </p>
            </div>
            <Link href="/book-consultation">
              <Button
                variant="outline"
                className="h-12 font-semibold"
                style={{ borderColor: '#0057B8', color: '#0057B8' }}
              >
                Book Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search hint */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[#555555]">
            <Search className="h-4 w-4" style={{ color: '#0057B8' }} />
            Looking for a specific course?{' '}
            <Link href="/course-finder" className="font-semibold" style={{ color: '#0057B8' }}>
              Try our Course Finder <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="mt-6 text-xs text-[#555555]">
            <BookOpen className="inline h-3 w-3 mr-1" style={{ color: '#0057B8' }} />
            University data is sourced from the ALO Education admissions database.
            <GraduationCap className="inline h-3 w-3 ml-2 mr-1" style={{ color: '#E8501A' }} />
            Always confirm details with your counselor before applying.
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
