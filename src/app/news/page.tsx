'use client';

import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Calendar, ArrowRight, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NEWS_ARTICLES } from '@/lib/news-data';

/** Resolves the per-category Lucide glyph with a single consistent fallback. */
function NewsIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? LucideIcons.Newspaper;
  return <Cmp className={className} />;
}

export default function NewsListingPage() {
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] hover:bg-[var(--alo-brand)]/20 border-none mb-4">
            NEWS & UPDATES
          </Badge>
          <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[36px] lg:text-[42px] text-[var(--alo-text)] mb-4">Study Abroad News</h1>
          <p className="text-lg text-[var(--alo-body)]">
            Stay informed with the latest updates on visa regulations, university admissions, scholarships, and ALO Education events.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {NEWS_ARTICLES.map((article) => (
            <Card key={article.slug} className="flex flex-col overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
              {/* Master §09 image card: a controlled brand-tinted surface with
                  one Lucide icon — no rainbow gradient, no dark scrim. */}
              <div className={`flex h-48 flex-col items-center justify-center gap-3 border-b border-[var(--alo-border)] ${article.surface}`}>
                <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <NewsIcon name={article.icon} className="size-7" />
                </span>
                <p className="caption-text">{article.category}</p>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-[var(--alo-cta)] border-[var(--alo-cta)]/30 bg-[var(--alo-cta-soft)]">
                    {article.category}
                  </Badge>
                  <span className="text-xs text-[var(--alo-text-muted)] flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {article.date}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--alo-text)] mb-3 group-hover:text-[var(--alo-brand)] transition-colors line-clamp-2">
                  <Link href={`/news/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>
                <p className="text-sm text-[var(--alo-body)] mb-5 flex-grow line-clamp-3">
                  {article.excerpt}
                </p>
                <Link href={`/news/${article.slug}`}>
                  <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent hover:text-[var(--alo-cta)] text-[var(--alo-brand)] font-semibold">
                    Read full article <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-[var(--alo-brand)] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="md:w-1/2 text-white text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Never miss an update</h3>
            <p className="text-[var(--alo-brand-pale)]">
              Subscribe to our newsletter to receive the latest study abroad news, scholarship alerts, and visa updates directly in your inbox.
            </p>
          </div>
          <div className="md:w-1/2 w-full">
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--alo-text-muted)]" />
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="pl-10 h-12 bg-white text-[var(--alo-text)] border-none rounded-xl"
                  required
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white rounded-xl font-bold shrink-0 shadow-md">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
