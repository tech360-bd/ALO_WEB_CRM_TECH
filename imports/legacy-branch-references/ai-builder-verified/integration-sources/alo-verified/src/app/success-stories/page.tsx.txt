import Link from 'next/link'
import { db } from '@/lib/db'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Quote, Star, Heart, Award, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Success Stories — ALO Education',
  description:
    'Real success stories and testimonials from students placed by ALO Education. Honest reviews — if no stories are published yet, we tell you so.',
  keywords: ['student testimonials', 'success stories', 'study abroad reviews', 'ALO Education'],
  openGraph: {
    title: 'Success Stories — ALO Education',
    description: 'Real student stories and testimonials.',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

interface StoryCard {
  type: 'testimonial' | 'success-story'
  id: string
  studentName: string
  university: string | null
  country: string | null
  course: string | null
  quote: string | null
  rating: number | null
  photoUrl: string | null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating || rating < 1) return null
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-current' : 'fill-none'}`}
          style={{ color: i < rating ? '#E8501A' : '#d1d5db' }}
        />
      ))}
    </div>
  )
}

export default async function SuccessStoriesPage() {
  let testimonials: StoryCard[] = []
  let successStories: StoryCard[] = []
  let dbError = false

  try {
    const [t, s] = await Promise.all([
      db.testimonial.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
      db.successStory.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    testimonials = t.map((row) => ({
      type: 'testimonial' as const,
      id: row.id,
      studentName: row.studentName,
      university: row.university,
      country: row.country,
      course: null,
      quote: row.quote,
      rating: row.rating,
      photoUrl: row.photoUrl,
    }))
    successStories = s.map((row) => ({
      type: 'success-story' as const,
      id: row.id,
      studentName: row.studentName,
      university: row.university,
      country: row.country,
      course: row.course,
      quote: row.story,
      rating: null,
      photoUrl: row.photoUrl,
    }))
  } catch (e) {
    console.error('SuccessStoriesPage: load error', e)
    dbError = true
  }

  const all = [...successStories, ...testimonials]

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
            Success Stories
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Real <span style={{ color: '#FFB347' }}>Student Stories</span>
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            Honest testimonials and success stories from students placed by ALO Education. We do
            not publish fabricated reviews — if no stories are published yet, we tell you so.
          </p>
        </div>
      </section>

      {/* Listing */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1A2332]">
                All Stories <span style={{ color: '#E8501A' }}>({all.length})</span>
              </h2>
              <p className="text-sm text-[#555555] mt-1">
                {successStories.length} success stories · {testimonials.length} testimonials
              </p>
            </div>
            <Link href="/book-consultation" className="hidden sm:block">
              <Button className="h-11 px-4 text-white font-semibold" style={{ background: '#E8501A' }}>
                Start Your Story <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {dbError ? (
            <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
              <Heart className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#1A2332]">Couldn&apos;t load stories</h3>
              <p className="text-sm text-[#555555] mt-2">
                Please try again later or contact an ALO Education counselor.
              </p>
            </div>
          ) : all.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Quote className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2332]">No stories yet. Be the first!</h3>
              <p className="text-[#555555] mt-2 max-w-md mx-auto">
                We don&apos;t have any published success stories yet. Book a consultation today
                and your story could be the first one we feature here.
              </p>
              <Link href="/book-consultation">
                <Button className="mt-6 h-12 text-white font-semibold" style={{ background: '#E8501A' }}>
                  Book Consultation <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {all.map((s) => (
                <Card
                  key={`${s.type}-${s.id}`}
                  className="border-0 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden"
                >
                  <div className="h-1.5" style={{ background: s.type === 'success-story' ? '#E8501A' : '#0057B8' }} />
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: s.type === 'success-story' ? '#E8501A' : '#0057B8' }}
                      >
                        {getInitials(s.studentName) || '🎓'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#1A2332]">{s.studentName}</h3>
                        {s.university && (
                          <p className="text-xs text-[#555555] mt-0.5 flex items-center gap-1">
                            <Award className="h-3 w-3" style={{ color: '#0057B8' }} />
                            {s.university}
                          </p>
                        )}
                      </div>
                      <Stars rating={s.rating} />
                    </div>

                    {s.quote && (
                      <div className="text-sm text-[#1A2332] leading-relaxed italic flex-1">
                        <Quote className="h-4 w-4 inline mr-1" style={{ color: '#E8501A' }} />
                        {s.quote.length > 280 ? `${s.quote.slice(0, 280)}…` : s.quote}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#555555]">
                      {s.course && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" style={{ color: '#0057B8' }} />
                          {s.course}
                        </span>
                      )}
                      {s.country && (
                        <span>· {s.country}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(232,80,26,0.1)' }}
            >
              <Heart className="h-6 w-6" style={{ color: '#E8501A' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#1A2332]">Want to be our next success story?</h3>
              <p className="text-sm text-[#555555]">
                Book a free consultation and start your journey today.
              </p>
            </div>
            <Link href="/book-consultation">
              <Button className="h-12 text-white font-semibold" style={{ background: '#E8501A' }}>
                Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
