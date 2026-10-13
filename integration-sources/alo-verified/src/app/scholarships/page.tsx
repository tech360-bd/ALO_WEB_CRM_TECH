import Link from 'next/link'
import { db } from '@/lib/db'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, MapPin, Building2, ArrowRight, Calendar, Info } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scholarships — ALO Education',
  description:
    'Explore scholarship opportunities from ALO Education partner universities. Filter by country, type, and amount to find funding for your study-abroad journey.',
  keywords: ['scholarships', 'study abroad', 'international student scholarships', 'ALO Education'],
  openGraph: {
    title: 'Scholarships — ALO Education',
    description: 'Browse scholarship opportunities from partner universities.',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

function getCountryFlag(country: string | null): string {
  if (!country) return '🌍'
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

export default async function ScholarshipsPage() {
  let scholarships: Array<{
    id: string
    name: string
    description: string | null
    amount: string | null
    type: string | null
    country: string | null
    deadline: Date | null
    eligibility: string | null
    universityId: string | null
    university: { name: string; slug: string } | null
  }> = []
  let dbError = false

  try {
    scholarships = await db.scholarship.findMany({
      where: { status: 'active' },
      orderBy: [{ deadline: 'asc' }, { name: 'asc' }],
      include: {
        university: {
          select: { name: true, slug: true },
        },
      },
    })
  } catch (e) {
    console.error('ScholarshipsPage: load error', e)
    dbError = true
  }

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
            Scholarships
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Fund Your <span style={{ color: '#FFB347' }}>Education Abroad</span>
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            Browse scholarship opportunities from our partner universities. Always verify deadlines
            and eligibility with an ALO Education counselor before applying.
          </p>
        </div>
      </section>

      {/* Listing */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1A2332]">
                All Scholarships <span style={{ color: '#E8501A' }}>({scholarships.length})</span>
              </h2>
              <p className="text-sm text-[#555555] mt-1">Real data from the ALO Education admissions database.</p>
            </div>
            <Link href="/book-consultation" className="hidden sm:block">
              <Button className="h-11 px-4 text-white font-semibold" style={{ background: '#E8501A' }}>
                Get Scholarship Help <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {dbError ? (
            <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
              <Award className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#1A2332]">Couldn&apos;t load scholarships</h3>
              <p className="text-sm text-[#555555] mt-2">
                Please try again later or contact an ALO Education counselor.
              </p>
            </div>
          ) : scholarships.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Award className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2332]">No scholarships published yet</h3>
              <p className="text-[#555555] mt-2 max-w-md mx-auto">
                Information not currently verified. Please check with an ALO Education counselor
                for the latest scholarship opportunities.
              </p>
              <Link href="/book-consultation">
                <Button className="mt-6 h-12 text-white font-semibold" style={{ background: '#E8501A' }}>
                  Talk to a Counselor <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scholarships.map((s) => (
                <Card
                  key={s.id}
                  className="border-0 shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col"
                >
                  <div className="h-1.5" style={{ background: '#10B981' }} />
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(16,185,129,0.1)' }}
                      >
                        <Award className="h-5 w-5" style={{ color: '#059669' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors line-clamp-2">
                          {s.name}
                        </h3>
                        {s.amount && (
                          <Badge className="text-xs mt-1" style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}>
                            {s.amount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {s.description && (
                      <p className="text-xs text-[#555555] mt-2 line-clamp-3">{s.description}</p>
                    )}

                    <div className="mt-4 space-y-1.5 text-xs text-[#555555]">
                      {s.university && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3" style={{ color: '#0057B8' }} />
                          <Link
                            href={`/universities/${s.university.slug}`}
                            className="hover:text-[#E8501A] transition-colors"
                          >
                            {s.university.name}
                          </Link>
                        </div>
                      )}
                      {s.country && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" style={{ color: '#0057B8' }} />
                          {getCountryFlag(s.country)} {s.country}
                        </div>
                      )}
                      {s.type && (
                        <div className="flex items-center gap-1.5">
                          <Info className="h-3 w-3" style={{ color: '#0057B8' }} />
                          Type: <span className="capitalize">{s.type}</span>
                        </div>
                      )}
                      {s.deadline && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" style={{ color: '#E8501A' }} />
                          Deadline: {new Date(s.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4">
                      {s.university ? (
                        <Link href={`/universities/${s.university.slug}`}>
                          <Button
                            className="w-full h-12 text-white font-semibold"
                            style={{ background: '#E8501A' }}
                            size="sm"
                          >
                            View Details <ArrowRight className="h-4 w-4 ml-1" />
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
                            Ask About This <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(232,80,26,0.1)' }}
              >
                <Award className="h-6 w-6" style={{ color: '#E8501A' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1A2332]">Want help finding more scholarships?</h3>
                <p className="text-sm text-[#555555]">
                  Our counselors can match you with university, government, and external
                  scholarships based on your profile, course, and destination.
                </p>
              </div>
              <Link href="/book-consultation">
                <Button
                  className="h-12 text-white font-semibold"
                  style={{ background: '#E8501A' }}
                >
                  Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
