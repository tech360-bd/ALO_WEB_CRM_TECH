import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NEWS_ARTICLES } from '@/lib/news-data';

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
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B5ED7] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all news
        </Link>

        <div className="mb-8">
          <Badge variant="outline" className="text-[#F97316] border-[#F97316]/30 bg-orange-50 mb-4 px-3 py-1">
            {article.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Published on {article.date}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>By ALO Education Editorial Team</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className={`w-full h-64 md:h-96 rounded-2xl bg-gradient-to-br ${article.thumbnailColor} flex items-center justify-center p-8 mb-10 shadow-inner`}>
          <h2 className="text-white text-2xl md:text-4xl font-bold text-center max-w-2xl leading-snug">
            {article.title}
          </h2>
        </div>

        {/* Article Body */}
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-6 text-lg mb-12">
          <p className="text-xl font-medium text-slate-900 leading-relaxed">
            {article.excerpt}
          </p>
          
          <p>
            International education continues to evolve rapidly, presenting both fresh challenges and exciting opportunities for students planning to study abroad. At ALO Education, our primary commitment is to keep Bangladeshi students and their families updated with accurate, timely, and actionable insights.
          </p>

          <h3 className="text-2xl font-bold text-[#0F172A] mt-8 mb-4">Key Takeaways for Applicants</h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-700">
            <li>Review all official destination and university eligibility criteria early.</li>
            <li>Ensure financial proof and bank documentation are fully compliant with visa guidelines.</li>
            <li>Prepare your English proficiency credentials (IELTS, PTE, TOEFL, or Duolingo) well before application deadlines.</li>
            <li>Consult with certified ALO Education advisors for 1-on-1 personalized profile evaluations.</li>
          </ul>

          <p>
            For more details on how this update affects your individual study timeline, book a free consultation with our senior education advisors today.
          </p>
        </div>

        {/* Call to action */}
        <div className="my-12 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Planning your study abroad journey?</h3>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            Speak with an expert ALO counselor to select the right university, prepare your application, and navigate visa requirements smoothly.
          </p>
          <Link href="/book-consultation">
            <Button className="h-12 px-8 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold">
              Book Free Consultation
            </Button>
          </Link>
        </div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="pt-8 border-t border-slate-200">
            <h3 className="text-2xl font-bold text-[#0F172A] mb-6">Related News & Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNews.map((rel) => (
                <Card key={rel.slug} className="p-5 flex flex-col justify-between border border-slate-200 hover:border-[#0B5ED7] transition-colors">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {rel.category}
                    </Badge>
                    <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 hover:text-[#0B5ED7]">
                      <Link href={`/news/${rel.slug}`}>
                        {rel.title}
                      </Link>
                    </h4>
                  </div>
                  <Link href={`/news/${rel.slug}`} className="text-xs text-[#0B5ED7] font-semibold mt-4">
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
