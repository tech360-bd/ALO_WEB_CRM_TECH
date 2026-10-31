import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MASTER_BLOGS_DATA, getBlogBySlug } from '@/lib/blogs-data';

export function generateStaticParams() {
  return MASTER_BLOGS_DATA.map((blog) => ({
    slug: blog.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);
  
  if (!blog) {
    return {
      title: 'Blog Not Found | ALO Education',
    };
  }
  
  return {
    title: blog.seoTitle,
    description: blog.seoDescription,
    alternates: {
      canonical: `/blog/${blog.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="pt-20 bg-[var(--alo-page)] min-h-screen">
      
      {/* Hero — image as media, title on a light band (no dark overlay over text).
          Master §08 Variant E: the headline never sits on top of a photograph. */}
      <header className="border-b border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 py-8 lg:grid-cols-[1.05fr_1fr] lg:py-12">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-[var(--alo-text-muted)]">
                <Link href="/" className="hover:text-[var(--alo-brand)] transition-colors">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/blog" className="hover:text-[var(--alo-brand)] transition-colors">Blog</Link>
              </nav>
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-secondary)] ring-1 ring-inset ring-[var(--alo-border)]">
                <span className="size-1.5 rounded-full bg-[var(--alo-cta)]" aria-hidden="true" />
                <span className="text-[var(--alo-cta-active)]">{post.category}</span>
              </span>
              <h1 className="mt-4 font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-[var(--alo-text)] sm:text-[36px] lg:text-[42px]">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[var(--alo-body)]">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[var(--alo-brand)] text-sm font-bold text-white">
                    {post.author.charAt(0)}
                  </div>
                  <span className="font-semibold text-[var(--alo-text)]">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {post.readTime}
                </div>
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] lg:aspect-[4/3]">
              <Image
                src={post.heroImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
          
          {/* Main Content */}
          <article className="lg:w-2/3 bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-[var(--alo-border)]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)] mb-8 pb-8 border-b border-[var(--alo-border)]">
              <Link href="/" className="hover:text-[var(--alo-brand)] transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[var(--alo-brand)] transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-[var(--alo-text)] font-medium truncate max-w-[200px] md:max-w-md">{post.title}</span>
            </div>

            <div 
              className="prose prose-lg prose-blue max-w-none prose-headings:text-[var(--alo-brand)] prose-a:text-[var(--alo-cta)] prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
            
            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-[var(--alo-border)]">
              <h3 className="text-lg font-bold text-[var(--alo-text)] mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] px-4 py-2 rounded-full text-sm hover:bg-[var(--alo-page)] cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* FAQs */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[var(--alo-border)]">
                <h3 className="text-2xl font-bold text-[var(--alo-text)] mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {post.faqs.map((faq, index) => (
                    <details key={index} className="group bg-[var(--alo-page)] rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-[var(--alo-text)]">
                        {faq.question}
                        <span className="transition group-open:rotate-180">
                          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      <div className="p-6 pt-0 text-[var(--alo-body)] leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:w-1/3">
            <div className="sticky top-32 space-y-8">
              {/* Table of Contents */}
              {post.tableOfContents && post.tableOfContents.length > 0 && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-[var(--alo-border)]">
                  <h3 className="text-lg font-bold text-[var(--alo-text)] mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--alo-cta)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    Table of Contents
                  </h3>
                  <ul className="space-y-4">
                    {post.tableOfContents.map((item, index) => (
                      <li key={index} className="text-[var(--alo-body)] text-sm hover:text-[var(--alo-brand)] transition-colors cursor-pointer border-l-2 border-transparent hover:border-[var(--alo-brand)] pl-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Widget */}
              <div className="bg-gradient-to-br from-[var(--alo-brand)] to-blue-900 p-8 rounded-3xl text-white shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
                
                <h3 className="text-2xl font-bold mb-4 relative z-10">Ready to Study Abroad?</h3>
                <p className="text-[var(--alo-brand-pale)] mb-8 text-sm relative z-10">
                  Get personalized guidance from our expert counselors to turn your dream into reality.
                </p>
                <Link href="/book-consultation" className="inline-block w-full bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white font-bold py-3 px-6 rounded-xl transition-colors relative z-10">
                  Request Consultation
                </Link>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}
