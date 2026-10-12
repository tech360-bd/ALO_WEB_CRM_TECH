'use client';

import Link from 'next/link';
import { Calendar, ArrowRight, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NEWS_ARTICLES } from '@/lib/news-data';

export default function NewsListingPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <Badge className="bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border-none mb-4">
            NEWS & UPDATES
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-4">Study Abroad News</h1>
          <p className="text-lg text-slate-600">
            Stay informed with the latest updates on visa regulations, university admissions, scholarships, and ALO Education events.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {NEWS_ARTICLES.map((article) => (
            <Card key={article.slug} className="flex flex-col overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className={`h-48 bg-gradient-to-br ${article.thumbnailColor} relative overflow-hidden flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <h3 className="text-white font-bold text-xl px-6 text-center opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300">
                  {article.category}
                </h3>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-[#F97316] border-[#F97316]/30 bg-orange-50">
                    {article.category}
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {article.date}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#2563EB] transition-colors line-clamp-2">
                  <Link href={`/news/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>
                <p className="text-sm text-slate-600 mb-5 flex-grow line-clamp-3">
                  {article.excerpt}
                </p>
                <Link href={`/news/${article.slug}`}>
                  <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent hover:text-[#F97316] text-[#2563EB] font-semibold">
                    Read full article <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-[#2563EB] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="md:w-1/2 text-white text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Never miss an update</h3>
            <p className="text-blue-100">
              Subscribe to our newsletter to receive the latest study abroad news, scholarship alerts, and visa updates directly in your inbox.
            </p>
          </div>
          <div className="md:w-1/2 w-full">
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="pl-10 h-12 bg-white text-slate-900 border-none rounded-xl"
                  required
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold shrink-0 shadow-md">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
