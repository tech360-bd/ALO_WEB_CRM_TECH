import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogBySlug, MASTER_BLOGS_DATA } from '@/lib/blogs-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, HelpCircle, Share2, Shield, User, ArrowRight } from 'lucide-react';

export async function generateStaticParams() {
  return MASTER_BLOGS_DATA.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Study Abroad Blog & Guidance | ALO Education',
      description: 'Expert insights, visa guides, and scholarship strategies for international students.',
    };
  }

  return {
    title: blog.seoTitle,
    description: blog.seoDescription,
    alternates: {
      canonical: `https://aloeducation.com/resources/blogs/${blog.slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.seoDescription,
      url: `https://aloeducation.com/resources/blogs/${blog.slug}`,
      images: [{ url: blog.heroImage }],
      type: 'article',
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // Schema.org BlogPosting Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.seoDescription,
    image: blog.heroImage,
    author: {
      '@type': 'Organization',
      name: blog.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ALO Education Bangladesh',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aloeducation.com/logo.png',
      },
    },
    datePublished: blog.publishedAt,
  };

  const relatedBlogs = MASTER_BLOGS_DATA.filter((b) => b.slug !== blog.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-20 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <a href="/" className="hover:text-[#0B5ED7]">Home</a>
            <span>›</span>
            <a href="/resources" className="hover:text-[#0B5ED7]">Resources</a>
            <span>›</span>
            <a href="/resources/blogs" className="hover:text-[#0B5ED7]">Blogs & Articles</a>
            <span>›</span>
            <span className="text-[#0B5ED7] font-bold truncate max-w-xs">{blog.title}</span>
          </nav>

          {/* ARTICLE HEADER */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-blue-50 text-[#0B5ED7] font-bold text-xs px-3 py-1">
                {blog.category}
              </Badge>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> {blog.publishedAt}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> {blog.readTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] mb-4 leading-tight">
              {blog.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
              {blog.excerpt}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 text-xs text-slate-700">
              <div className="h-8 w-8 rounded-full bg-[#0B5ED7] text-white flex items-center justify-center font-bold">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{blog.author}</p>
                <p className="text-[11px] text-slate-500">Official Author & Education Specialist</p>
              </div>
            </div>
          </div>

          {/* TABLE OF CONTENTS & CONTENT */}
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              
              {/* TABLE OF CONTENTS */}
              {blog.tableOfContents && blog.tableOfContents.length > 0 && (
                <Card className="p-6 bg-blue-50/50 border-blue-100">
                  <h3 className="font-bold text-[#0B5ED7] text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Table of Contents
                  </h3>
                  <div className="space-y-2 text-xs">
                    {blog.tableOfContents.map((toc, idx) => (
                      <p key={idx} className="text-slate-700 hover:text-[#0B5ED7] cursor-pointer font-medium">
                        {toc}
                      </p>
                    ))}
                  </div>
                </Card>
              )}

              {/* ARTICLE BODY */}
              <Card className="p-8 bg-white border-slate-200">
                <div
                  className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-slate-800"
                  dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
                />
              </Card>

              {/* FAQS SECTION */}
              {blog.faqs && blog.faqs.length > 0 && (
                <Card className="p-6 bg-white border-slate-200">
                  <h3 className="font-bold text-[#0F172A] text-lg mb-4 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-[#0B5ED7]" /> Article Frequently Asked Questions
                  </h3>
                  <div className="space-y-4 text-xs">
                    {blog.faqs.map((faq, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="font-bold text-slate-900 mb-1">{faq.question}</p>
                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* SIDEBAR CTAS */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 bg-gradient-to-br from-[#0B5ED7] to-[#003d80] text-white rounded-3xl border-0 shadow-lg">
                <h3 className="font-bold text-lg mb-2">Need Expert Counseling?</h3>
                <p className="text-xs text-blue-100 mb-4 leading-relaxed">
                  Book a 1-on-1 session with ALO Education's senior study abroad advisors to evaluate your admission & visa profile.
                </p>
                <a href="/eligibility-check" className="block w-full">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full bg-[#F97316] text-white hover:bg-[#EA580C] font-bold text-xs py-3 rounded-xl shadow-md">
                    Check Eligibility Free →
                  </Button>
                </a>
              </Card>

              {/* TAGS */}
              <Card className="p-5 bg-white border-slate-200 text-xs">
                <h4 className="font-bold text-slate-900 mb-3">Topic Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {blog.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* RELATED BLOGS */}
          <div className="mt-16 pt-10 border-t border-slate-200">
            <h3 className="text-xl font-bold text-[#0F172A] mb-6">Related Articles & Guides</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {relatedBlogs.map((rel) => (
                <Card key={rel.id} className="p-5 bg-white border-slate-200 hover:shadow-md transition-all">
                  <Badge className="bg-blue-50 text-[#0B5ED7] text-[10px] font-bold mb-2">{rel.category}</Badge>
                  <h4 className="font-bold text-sm text-[#0F172A] mb-2 line-clamp-2">{rel.title}</h4>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{rel.excerpt}</p>
                  <a href={`/resources/blogs/${rel.slug}`} className="text-xs font-bold text-[#0B5ED7] hover:underline flex items-center gap-1">
                    Read Article <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
