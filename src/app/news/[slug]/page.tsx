import { notFound } from 'next/navigation';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NEWS_ARTICLES } from '@/lib/news-data';

/** Resolves the per-category Lucide glyph with a single consistent fallback. */
function NewsIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? LucideIcons.Newspaper;
  return <Cmp className={className} />;
}

export function generateStaticParams() {
  return NEWS_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = NEWS_ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: 'News Not Found' };
  return {
    title: `${article.title} | ALO Education News`,
    description: article.excerpt,
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = NEWS_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const relatedNews = NEWS_ARTICLES.filter(a => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link 
          href="/news" 
          className="inline-flex items-center gap-2 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all news
        </Link>

        <div className="mb-8">
          <Badge variant="outline" className="text-[var(--alo-cta)] border-[var(--alo-cta)]/30 bg-[var(--alo-cta-soft)] mb-4 px-3 py-1">
            {article.category}
          </Badge>
          <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[36px] lg:text-[42px] text-[var(--alo-text)] mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--alo-text-muted)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Published on {article.date}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>By ALO Education Editorial Team</span>
          </div>
        </div>

        {/* Editorial band (Master §08-E / §02) — a controlled brand-tinted
            surface with one category icon. The article title is the H1 above;
            repeating it over a dark gradient block is not allowed. */}
        <div className={`mb-10 flex items-center gap-5 rounded-2xl border border-[var(--alo-border)] px-6 py-8 sm:px-8 ${article.surface}`}>
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
            <NewsIcon name={article.icon} className="size-8" />
          </span>
          <div className="min-w-0">
            <p className="caption-text">{article.category}</p>
            <p className="mt-1 text-lg font-semibold leading-snug text-[var(--alo-text)] sm:text-xl">
              {article.excerpt}
            </p>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-slate max-w-none text-[var(--alo-body)] leading-relaxed space-y-6 text-lg mb-12">
          <p className="text-xl font-medium text-[var(--alo-text)] leading-relaxed">
            {article.excerpt}
          </p>
          
          <p>
            International education continues to evolve rapidly, presenting both fresh challenges and exciting opportunities for students planning to study abroad. At ALO Education, our primary commitment is to keep Bangladeshi students and their families updated with accurate, timely, and actionable insights.
          </p>

          <h3 className="text-2xl font-bold text-[var(--alo-text)] mt-8 mb-4">Key Takeaways for Applicants</h3>
          <ul className="list-disc pl-6 space-y-2 text-[var(--alo-body)]">
            <li>Review all official destination and university eligibility criteria early.</li>
            <li>Ensure financial proof and bank documentation are fully compliant with visa guidelines.</li>
            <li>Prepare your English proficiency credentials (IELTS, PTE, TOEFL, or Duolingo) well before application deadlines.</li>
            <li>Consult with certified ALO Education advisors for 1-on-1 personalized profile evaluations.</li>
          </ul>

          <p>
            For more details on how this update affects your individual study timeline, request a consultation with our senior education advisors today.
          </p>
        </div>

        {/* Call to action */}
        <div className="my-12 p-8 bg-[var(--alo-page)] rounded-2xl border border-[var(--alo-border)] text-center">
          <h3 className="text-2xl font-bold text-[var(--alo-text)] mb-2">Planning your study abroad journey?</h3>
          <p className="text-[var(--alo-body)] mb-6 max-w-xl mx-auto">
            Speak with an expert ALO counselor to select the right university, prepare your application, and navigate visa requirements smoothly.
          </p>
          <Link href="/book-consultation">
            <Button className="h-12 px-8 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white rounded-xl font-bold">
              Request Consultation
            </Button>
          </Link>
        </div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="pt-8 border-t border-[var(--alo-border)]">
            <h3 className="text-2xl font-bold text-[var(--alo-text)] mb-6">Related News & Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNews.map((rel) => (
                <Card key={rel.slug} className="p-5 flex flex-col justify-between border border-[var(--alo-border)] hover:border-[var(--alo-brand)] transition-colors">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {rel.category}
                    </Badge>
                    <h4 className="font-bold text-[var(--alo-text)] text-sm mb-2 line-clamp-2 hover:text-[var(--alo-brand)]">
                      <Link href={`/news/${rel.slug}`}>
                        {rel.title}
                      </Link>
                    </h4>
                  </div>
                  <Link href={`/news/${rel.slug}`} className="text-xs text-[var(--alo-brand)] font-semibold mt-4">
                    Read article →
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
