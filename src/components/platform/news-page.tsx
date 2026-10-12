'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Newspaper,
  Calendar,
  Clock,
  Tag,
  TrendingUp,
  AlertCircle,
  Award,
  BookOpen,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NEWS_CATEGORIES = [
  { id: 'all', label: 'All News', icon: Newspaper },
  { id: 'policy', label: 'Policy Changes', icon: AlertCircle },
  { id: 'scholarship', label: 'Scholarships', icon: Award },
  { id: 'program', label: 'New Programs', icon: BookOpen },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
];

const NEWS_ARTICLES = [
  {
    id: 1,
    title: 'UK Announces New Graduate Route Extension for 2025',
    excerpt: 'The UK Home Office has announced an extension to the Graduate Route visa, allowing international students to stay and work for up to 3 years after completing their degree. This is a significant boost for Bangladeshi students planning to study in the UK.',
    category: 'policy',
    date: 'February 28, 2025',
    readTime: '4 min',
    featured: true,
    image: 'uk-graduate-route',
  },
  {
    id: 2,
    title: 'Australia Increases International Student Visa Fees by 15%',
    excerpt: 'Starting April 2025, the Australian government will increase student visa application fees from AUD 715 to AUD 825. However, new scholarship funds of AUD 50M have also been allocated for South Asian students.',
    category: 'policy',
    date: 'February 25, 2025',
    readTime: '3 min',
    featured: false,
    image: 'australia-visa',
  },
  {
    id: 3,
    title: 'Chevening Scholarships 2025-26: Applications Now Open',
    excerpt: 'The UK\'s prestigious Chevening Scholarship program is now accepting applications for the 2025-26 academic year. Bangladeshi students with leadership potential are encouraged to apply for fully-funded master\'s programs.',
    category: 'scholarship',
    date: 'February 20, 2025',
    readTime: '5 min',
    featured: true,
    image: 'chevening',
  },
  {
    id: 4,
    title: 'New Zealand Launches South Asia Education Initiative',
    excerpt: 'New Zealand has launched a dedicated education initiative for South Asian countries including Bangladesh, featuring streamlined visa processing and 200 new scholarships for undergraduate and postgraduate programs.',
    category: 'scholarship',
    date: 'February 15, 2025',
    readTime: '3 min',
    featured: false,
    image: 'nz-initiative',
  },
  {
    id: 5,
    title: 'Ireland Expands Third Level Graduate Scheme to 2 Years',
    excerpt: 'Ireland has extended its Third Level Graduate Scheme from 1 year to 2 years, giving international graduates more time to find employment. This makes Ireland an even more attractive destination for Bangladeshi students.',
    category: 'policy',
    date: 'February 10, 2025',
    readTime: '4 min',
    featured: false,
    image: 'ireland-graduate',
  },
  {
    id: 6,
    title: 'University of Toronto Introduces AI & Data Science Programs',
    excerpt: 'The University of Toronto has announced new undergraduate and postgraduate programs in Artificial Intelligence and Data Science, starting Fall 2025. These programs include co-op placement opportunities.',
    category: 'program',
    date: 'February 8, 2025',
    readTime: '3 min',
    featured: false,
    image: 'utoronto-ai',
  },
  {
    id: 7,
    title: 'Canada Doubles Study Permit Allocation for Bangladesh',
    excerpt: 'Immigration, Refugees and Citizenship Canada (IRCC) has doubled the study permit allocation for Bangladeshi students in 2025, recognizing the growing demand and quality of applicants from the region.',
    category: 'policy',
    date: 'February 5, 2025',
    readTime: '4 min',
    featured: false,
    image: 'canada-permit',
  },
  {
    id: 8,
    title: 'Commonwealth Scholarships 2025: 50+ Seats for Bangladesh',
    excerpt: 'The Commonwealth Scholarship Commission has allocated over 50 fully-funded scholarship seats for Bangladeshi students for the 2025 intake, covering tuition, travel, and living expenses at UK universities.',
    category: 'scholarship',
    date: 'January 30, 2025',
    readTime: '5 min',
    featured: false,
    image: 'commonwealth',
  },
  {
    id: 9,
    title: 'IELTS Introduces New Online Test Format for 2025',
    excerpt: 'IELTS has launched a new computer-delivered test format available at more centers across Bangladesh, including Dhaka, Chittagong, and Sylhet. Results are now available within 3-5 days.',
    category: 'trending',
    date: 'January 25, 2025',
    readTime: '2 min',
    featured: false,
    image: 'ielts-online',
  },
  {
    id: 10,
    title: 'University of Melbourne Offers 30% Fee Reduction for South Asian Students',
    excerpt: 'The University of Melbourne has introduced a 30% tuition fee reduction scheme for high-achieving students from South Asia, applicable to select postgraduate coursework programs starting in 2025.',
    category: 'scholarship',
    date: 'January 20, 2025',
    readTime: '3 min',
    featured: false,
    image: 'melbourne-fee',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  policy: 'bg-red-100 text-red-700',
  scholarship: 'bg-emerald-100 text-emerald-700',
  program: 'bg-blue-100 text-blue-700',
  trending: 'bg-amber-100 text-amber-700',
};

export function NewsPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = NEWS_ARTICLES.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredArticles = filtered.filter(a => a.featured);
  const regularArticles = filtered.filter(a => !a.featured);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Back button */}
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative bg-[#0052B8] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-5 left-10 w-80 h-80 rounded-full border border-white/30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            <Newspaper className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">News & Updates</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Stay Informed on<br />Global Education
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
            Get the latest updates on immigration policies, scholarship announcements, new programs, and everything that matters for your study abroad journey.
          </p>
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search news articles..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-slate-50 border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {NEWS_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#0052B8] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0052B8] hover:text-[#0052B8]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#E8501A]" /> Featured Stories
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map(article => (
                <motion.div key={article.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="h-48 bg-gradient-to-br from-[#0052B8] to-[#003d8f] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Newspaper className="h-16 w-16 text-white/20" />
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className={CATEGORY_COLORS[article.category]}>{article.category}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0052B8] transition-colors">{article.title}</h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {article.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                        </div>
                        <span className="text-[#0052B8] font-medium flex items-center gap-1 group-hover:underline">
                          Read More <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Latest Updates</h2>
          {regularArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No articles found matching your criteria.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map(article => (
                <Card key={article.id} className="h-full hover:shadow-md transition-shadow group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={CATEGORY_COLORS[article.category]}>{article.category}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#0052B8] transition-colors line-clamp-2">{article.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {article.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                      </div>
                      <span className="text-[#0052B8] font-medium flex items-center gap-1">
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-[#0052B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stay Ahead with ALO News</h2>
          <p className="text-white/90 max-w-xl mx-auto mb-8">Get weekly updates on policy changes, scholarships, and opportunities directly in your inbox. Join 15,000+ subscribers.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-lg text-slate-900 placeholder-slate-400" />
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6 py-3">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
