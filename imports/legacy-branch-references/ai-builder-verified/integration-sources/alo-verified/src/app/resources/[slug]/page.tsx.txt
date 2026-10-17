import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Calendar, FileText, BookOpen, Info } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadPost(slug: string) {
  try {
    return await db.blogPost.findUnique({ where: { slug } })
  } catch (e) {
    console.error('ResourceDetail: load error', e)
    return null
  }
}

async function loadRelated(slug: string, category: string | null) {
  try {
    return await db.blogPost.findMany({
      where: {
        status: 'published',
        slug: { not: slug },
        ...(category ? { category } : {}),
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        publishedAt: true,
        createdAt: true,
      },
    })
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) {
    return { title: 'Article not found — ALO Education' }
  }
  return {
    title: `${post.title} — ALO Education`,
    description: post.excerpt || post.seoDescription || '',
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      type: 'article',
    },
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default async function ResourceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const post = await loadPost(slug)

  if (!post) {
    notFound()
  }

  const related = await loadRelated(slug, post.category)

  return (
    <PublicSiteLayout>
      {/* Header */}
      <section
        className="text-white py-12 lg:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-xs mb-4">
            <Link href="/resources" className="text-gray-300 hover:text-white inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> All Resources
            </Link>
          </div>
          {post.category && (
            <Badge
              className="mb-3 border"
              style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
            >
              {post.category}
            </Badge>
          )}
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-3 text-gray-200 text-base lg:text-lg max-w-2xl">{post.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              ALO Education
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-white py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4">
          {post.content ? (
            <article
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none
                prose-headings:text-[#1A2332] prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-[#1A2332] prose-p:leading-relaxed
                prose-a:text-[#0057B8] prose-a:underline
                prose-strong:text-[#1A2332]
                prose-ul:list-disc prose-ul:pl-6 prose-ul:text-[#1A2332]
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-[#1A2332]
                prose-blockquote:border-l-4 prose-blockquote:border-[#E8501A] prose-blockquote:pl-4 prose-blockquote:italic"
              // BlogPost.content is stored as HTML string from the CMS editor
              // (see src/app/api/seed/route.ts — content is an HTML string).
              // Render via dangerouslySetInnerHTML after the post is fetched
              // server-side; no user input is involved on this read-only route.
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-[#555555] flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#E8501A' }} />
              <div>
                Article content is not currently available. Please check with an ALO Education
                counselor for the information you need.
              </div>
            </div>
          )}

          {/* CTA */}
          <div
            className="mt-12 rounded-2xl p-6 sm:p-8 text-white"
            style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)' }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold">Have questions about this article?</h3>
                <p className="text-sm text-orange-50 mt-1">
                  Book a free consultation with an ALO Education counselor and we&apos;ll answer
                  your questions in person.
                </p>
              </div>
              <Link href="/book-consultation">
                <Button className="h-12 px-6 bg-white text-[#E8501A] hover:bg-gray-50 font-semibold whitespace-nowrap">
                  Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-[#F7F9FC] py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-[#1A2332] mb-6">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <Card
                  key={r.id}
                  className="border-0 shadow-sm hover:shadow-lg transition-all group flex flex-col overflow-hidden"
                >
                  <div className="h-1.5" style={{ background: '#0057B8' }} />
                  <CardContent className="p-5 flex flex-col flex-1">
                    {r.category && (
                      <Badge
                        className="text-xs mb-2"
                        style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}
                      >
                        {r.category}
                      </Badge>
                    )}
                    <h3 className="font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                    {r.excerpt && (
                      <p className="text-sm text-[#555555] mt-2 line-clamp-2 flex-1">{r.excerpt}</p>
                    )}
                    <div className="mt-4 text-xs text-[#555555] flex items-center gap-1">
                      <Calendar className="h-3 w-3" style={{ color: '#0057B8' }} />
                      {formatDate(r.publishedAt || r.createdAt)}
                    </div>
                    <Link href={`/resources/${r.slug}`} className="mt-3">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold text-sm group/btn"
                        style={{ color: '#0057B8' }}
                      >
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty-related fallback */}
      {related.length === 0 && (
        <section className="bg-[#F7F9FC] py-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-[#555555]">
              More articles coming soon.{' '}
              <Link href="/resources" className="font-semibold" style={{ color: '#0057B8' }}>
                Browse all resources
              </Link>
              .
            </p>
          </div>
        </section>
      )}
    </PublicSiteLayout>
  )
}
