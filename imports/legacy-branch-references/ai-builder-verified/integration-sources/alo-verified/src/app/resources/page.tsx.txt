import Link from 'next/link'
import { db } from '@/lib/db'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, FileText, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resources — ALO Education',
  description:
    'Articles and guides from ALO Education: visa guides, scholarships, application tips, pre-departure, English tests, and study-abroad guides. Sourced from our published blog content.',
  keywords: ['study abroad guide', 'visa guide', 'scholarship guide', 'ALO Education blog'],
  openGraph: {
    title: 'Resources — ALO Education',
    description: 'Articles and guides on studying abroad.',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

// All categories shown on the page (the page itself lists them as filters,
// but actual filtering is a no-op for now since there are only ~6 posts in seed).
const CATEGORIES = [
  'Visa Guides',
  'Scholarships',
  'Application Tips',
  'Pre-Departure',
  'English Tests',
  'Study Abroad Guides',
]

// Map seed categories (e.g. "Visa Guide") to display categories ("Visa Guides")
function normalizeCategory(cat: string | null): string | null {
  if (!cat) return null
  const lower = cat.toLowerCase()
  if (lower.includes('visa')) return 'Visa Guides'
  if (lower.includes('scholarship')) return 'Scholarships'
  if (lower.includes('application')) return 'Application Tips'
  if (lower.includes('pre-departure') || lower.includes('departure')) return 'Pre-Departure'
  if (lower.includes('english')) return 'English Tests'
  if (lower.includes('study abroad') || lower.includes('student life')) return 'Study Abroad Guides'
  return cat
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default async function ResourcesPage() {
  let posts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    category: string | null
    featuredImage: string | null
    publishedAt: Date | null
    createdAt: Date
  }> = []
  let dbError = false

  try {
    posts = await db.blogPost.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        featuredImage: true,
        publishedAt: true,
        createdAt: true,
      },
    })
  } catch (e) {
    console.error('ResourcesPage: load error', e)
    dbError = true
  }

  // Build category counts based on normalized category
  const categoryCounts: Record<string, number> = {}
  for (const p of posts) {
    const c = normalizeCategory(p.category)
    if (c) categoryCounts[c] = (categoryCounts[c] || 0) + 1
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
            Resources
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Study Abroad <span style={{ color: '#FFB347' }}>Guides &amp; Articles</span>
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            Practical articles on visas, scholarships, applications, English tests, pre-departure,
            and destination guides — written by the ALO Education counseling team.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-sm py-1.5 px-3">
              All ({posts.length})
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-sm py-1.5 px-3"
              >
                {cat} ({categoryCounts[cat] || 0})
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Listing */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {dbError ? (
            <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
              <FileText className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#1A2332]">Couldn&apos;t load resources</h3>
              <p className="text-sm text-[#555555] mt-2">
                Please try again later or contact an ALO Education counselor.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2332]">No articles published yet</h3>
              <p className="text-[#555555] mt-2 max-w-md mx-auto">
                We&apos;re working on new guides. Please check back soon, or talk to a counselor
                for direct answers.
              </p>
              <Link href="/book-consultation">
                <Button className="mt-6 h-12 text-white font-semibold" style={{ background: '#E8501A' }}>
                  Talk to a Counselor <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((p) => {
                const cat = normalizeCategory(p.category)
                return (
                  <Card
                    key={p.id}
                    className="border-0 shadow-sm hover:shadow-lg transition-all group flex flex-col overflow-hidden"
                  >
                    <div className="h-1.5" style={{ background: '#0057B8' }} />
                    <CardContent className="p-5 flex flex-col flex-1">
                      {cat && (
                        <Badge
                          className="text-xs mb-3"
                          style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}
                        >
                          {cat}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="text-sm text-[#555555] mt-2 line-clamp-3 flex-1">{p.excerpt}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs text-[#555555]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" style={{ color: '#0057B8' }} />
                          {formatDate(p.publishedAt || p.createdAt)}
                        </span>
                        <Link href={`/resources/${p.slug}`}>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-semibold text-sm group/btn"
                            style={{ color: '#0057B8' }}
                          >
                            Read More
                            <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </PublicSiteLayout>
  )
}
