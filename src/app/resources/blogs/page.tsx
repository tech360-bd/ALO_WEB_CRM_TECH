import React from 'react';
import { Metadata } from 'next';
import { MASTER_BLOGS_DATA } from '@/lib/blogs-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Clock, ArrowRight, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Study Abroad Blogs, Articles & Visa Guides | ALO Education',
  description: 'Authoritative study abroad guides, UK student visa advice, Chevening scholarship tips, IELTS vs PTE comparisons, and university admission strategies.',
  alternates: { canonical: 'https://aloeducation.com/resources/blogs' },
};

export default function BlogIndexPage() {
  const blogs = MASTER_BLOGS_DATA;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 md:p-12 text-white mb-12 shadow-xl">
            <Badge className="bg-[#E8501A] text-white font-bold text-xs px-3 py-1 mb-4 uppercase">
              ALO EDUCATION KNOWLEDGE HUB
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Study Abroad Blogs & Expert Guides
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-3xl leading-relaxed">
              Explore 100% verified guides on student visas, fully funded scholarships, English test preparation, SOP writing masterclasses, and living cost breakdowns.
            </p>
          </div>

          {/* BLOG GRID */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((b) => (
              <Card key={b.id} className="p-6 bg-white hover:shadow-xl transition-all border-slate-200 hover:border-[#0057B8] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge className="bg-blue-50 text-[#0057B8] font-bold text-[11px]">
                      {b.category}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">{b.readTime}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0F172A] mb-2 line-clamp-2 hover:text-[#0057B8] transition-colors">
                    {b.title}
                  </h3>

                  <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {b.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{b.author}</span>
                    <span>{b.publishedAt}</span>
                  </div>
                  <a href={`/resources/blogs/${b.slug}`} className="block w-full">
                    <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      Read Full Article <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
