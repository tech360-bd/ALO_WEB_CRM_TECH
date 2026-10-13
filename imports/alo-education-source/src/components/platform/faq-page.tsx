'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  MessageCircle,
  HelpCircle,
  FileText,
  Globe,
  GraduationCap,
  Shield,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
};

// Auto-assign category based on question keywords if no category from API
function inferCategory(q: string): string {
  const ql = q.toLowerCase();
  if (/visa|passport|immigration/.test(ql)) return 'Visa & Immigration';
  if (/scholarship|fund|tuition|fee|cost|budget|money|financ/.test(ql)) return 'Costs & Scholarships';
  if (/ielts|toefl|gre|gmat|exam|test|score|english/.test(ql)) return 'Exams & Tests';
  if (/university|college|course|program|degree|admission|apply/.test(ql)) return 'Admissions';
  if (/document|transcript|sop|lor|cv|resume/.test(ql)) return 'Documents';
  if (/country|uk|usa|canada|australia|germany|malaysia/.test(ql)) return 'Countries';
  return 'General';
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Visa & Immigration': <Shield className="h-4 w-4" />,
  'Costs & Scholarships': <DollarSign className="h-4 w-4" />,
  'Exams & Tests': <GraduationCap className="h-4 w-4" />,
  'Admissions': <FileText className="h-4 w-4" />,
  'Documents': <FileText className="h-4 w-4" />,
  'Countries': <Globe className="h-4 w-4" />,
  'General': <HelpCircle className="h-4 w-4" />,
};

export function FaqPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch('/api/faqs')
      .then((r) => r.json())
      .then((data) => {
        let raw: FAQ[] = [];
        if (Array.isArray(data?.faqs)) raw = data.faqs;
        else if (Array.isArray(data)) raw = data;
        // Assign categories if missing
        const enriched = raw.map((f, i) => ({
          ...f,
          id: f.id || i,
          category: f.category || inferCategory(f.question),
        }));
        setFaqs(enriched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean) as string[]))];

  const filtered = faqs.filter((f) => {
    const matchesSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFaqs = activeCategory === 'all'
    ? categories.slice(1).reduce((acc, cat) => {
        const items = filtered.filter((f) => f.category === cat);
        if (items.length > 0) acc[cat] = items;
        return acc;
      }, {} as Record<string, FAQ[]>)
    : { [activeCategory]: filtered };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC] to-[#101828]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-32 md:py-36 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">FAQ</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Frequently Asked<span className="block text-[#FFB347]">Questions</span></h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Find answers to the most common questions about studying abroad with ALO Education.</p>
        </div>
      </section>

      {/* Search + Category Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-10 rounded-xl" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#101828]"><X className="h-4 w-4" /></button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)} className={`rounded-full whitespace-nowrap ${activeCategory === cat ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>
                {cat === 'all' ? 'All Topics' : <>{CATEGORY_ICONS[cat] && <span className="mr-1.5 inline-flex">{CATEGORY_ICONS[cat]}</span>}{cat}</>}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full rounded-xl" />))}</div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-[#555555] mb-6">Showing {filtered.length} question{filtered.length !== 1 ? 's' : ''}</p>
              {Object.entries(groupedFaqs).map(([cat, items]) => (
                <div key={cat} className="mb-8">
                  {activeCategory === 'all' && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-[#F37021] rounded-full" />
                      <h2 className="text-xl font-semibold text-[#101828]">{cat}</h2>
                      <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-0 text-xs">{items.length}</Badge>
                    </div>
                  )}
                  <Accordion type="single" collapsible className="w-full">
                    {items.map((faq, i) => (
                      <AccordionItem key={faq.id || i} value={`faq-${faq.id || i}`} className="bg-white rounded-xl mb-2 px-4 border border-gray-100 shadow-sm data-[state=open]:shadow-md transition-shadow">
                        <AccordionTrigger className="text-left text-[#101828] font-medium hover:text-[#F37021] transition-colors py-4">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-[#555555] leading-relaxed pb-4">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              <MessageCircle className="h-12 w-12 text-[#F37021]/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#101828] mb-2">No questions found</h3>
              <p className="text-[#555555] mb-4">Try adjusting your search or category.</p>
              <Button onClick={() => { setSearch(''); setActiveCategory('all'); }} variant="outline" className="rounded-full">Clear Filters</Button>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#F37021] to-[#FFB347]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Still Have Questions?</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Can't find what you're looking for? Book a free consultation with our expert counselors.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onLeadOpen} size="lg" className="bg-white text-[#F37021] hover:bg-white/90 rounded-full px-8">Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button onClick={() => onNavigate('contact')} variant="outline" size="lg" className="border-white text-white hover:bg-white/10 rounded-full px-8">Contact Us</Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
