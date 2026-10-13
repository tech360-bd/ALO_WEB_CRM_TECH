'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Globe,
  BookOpen,
  GraduationCap,
  FileText,
  DollarSign,
  Plane,
  Building2,
  Flag,
  CheckCircle2,
  X,
  Shield,
  Briefcase,
  Heart,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type Country = { id: number; name: string; slug: string; flag?: string };
type Exam = { id: number; name: string; description?: string; type?: string; scoreInfo?: string };
type FAQ = { id: number; question: string; answer: string; category?: string };
type Resource = { slug: string; title: string; category?: string; excerpt?: string; heroImage?: string };

const CATEGORIES = [
  { key: 'countries', label: 'Countries', icon: <Globe className="h-5 w-5" /> },
  { key: 'exams', label: 'Exams', icon: <BookOpen className="h-5 w-5" /> },
  { key: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
  { key: 'costs', label: 'Costs', icon: <DollarSign className="h-5 w-5" /> },
  { key: 'visas', label: 'Visas', icon: <Plane className="h-5 w-5" /> },
  { key: 'resources', label: 'Resources', icon: <BookOpen className="h-5 w-5" /> },
  { key: 'living', label: 'Living', icon: <Heart className="h-5 w-5" /> },
] as const;

export function StudentInfoCenter({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [activeCategory, setActiveCategory] = useState('countries');
  const [countries, setCountries] = useState<Country[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/countries').then((r) => r.json()),
      fetch('/api/exams').then((r) => r.json()),
      fetch('/api/faqs').then((r) => r.json()),
      fetch('/api/resources').then((r) => r.json()).catch(() => ({})),
    ])
      .then(([ctryData, examData, faqData, resData]) => {
        if (Array.isArray(ctryData?.countries)) setCountries(ctryData.countries);
        else if (Array.isArray(ctryData)) setCountries(ctryData);
        if (Array.isArray(examData?.exams)) setExams(examData.exams);
        else if (Array.isArray(examData)) setExams(examData);
        if (Array.isArray(faqData?.faqs)) setFaqs(faqData.faqs);
        else if (Array.isArray(faqData)) setFaqs(faqData);
        if (Array.isArray(resData?.resources)) setResources(resData.resources);
        else if (Array.isArray(resData)) setResources(resData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryChange = (cat: string) => { setActiveCategory(cat); setSearch(''); setSelectedCountry(null); };

  const filteredFaqs = faqs.filter((f) => { if (!search) return true; const q = search.toLowerCase(); return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q); });
  const filteredExams = exams.filter((e) => { if (!search) return true; const q = search.toLowerCase(); return e.name.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q); });
  const filteredCountries = countries.filter((c) => { if (!search) return true; return c.name.toLowerCase().includes(search.toLowerCase()); });
  const filteredResources = resources.filter((r) => { if (!search) return true; const q = search.toLowerCase(); return r.title.toLowerCase().includes(q) || (r.excerpt || '').toLowerCase().includes(q); });

  const DOCS = [
    { name: 'Academic Transcripts', desc: 'Official transcripts from all previous institutions' },
    { name: 'Passport', desc: 'Valid passport with at least 6 months remaining' },
    { name: 'IELTS / TOEFL Scores', desc: 'English proficiency test results' },
    { name: 'Statement of Purpose (SOP)', desc: 'A personal essay explaining your study goals' },
    { name: 'Letters of Recommendation', desc: '2-3 academic or professional references' },
    { name: 'CV / Resume', desc: 'Updated curriculum vitae' },
    { name: 'Financial Documents', desc: 'Bank statements, sponsor letters, scholarship letters' },
    { name: 'Photographs', desc: 'Passport-size photographs as per requirements' },
  ];

  const COSTS = [
    { country: 'United Kingdom', tuition: '£12,000–£25,000/yr', living: '£900–£1,500/mo' },
    { country: 'United States', tuition: '$20,000–$55,000/yr', living: '$1,000–$2,000/mo' },
    { country: 'Canada', tuition: 'CAD 15,000–35,000/yr', living: 'CAD 800–1,500/mo' },
    { country: 'Australia', tuition: 'AUD 20,000–45,000/yr', living: 'AUD 1,200–2,000/mo' },
    { country: 'Germany', tuition: '€0–€3,000/semester', living: '€700–€1,100/mo' },
    { country: 'Malaysia', tuition: 'MYR 15,000–40,000/yr', living: 'MYR 1,000–2,000/mo' },
  ];

  const VISAS = [
    { country: 'United Kingdom', visa: 'Student Visa (Tier 4)', processing: '3–6 weeks', keyReq: 'CAS letter, financial proof, English test' },
    { country: 'United States', visa: 'F-1 Student Visa', processing: '2–8 weeks', keyReq: 'I-20 form, SEVIS fee, financial documents, interview' },
    { country: 'Canada', visa: 'Study Permit', processing: '4–12 weeks', keyReq: 'LOA, GIC account, biometrics, medical exam' },
    { country: 'Australia', visa: 'Subclass 500', processing: '4–8 weeks', keyReq: 'CoE, GTE statement, financial proof, OSHC' },
  ];

  const LIVING = [
    { title: 'Accommodation', desc: 'University halls, private rentals, or homestays. Book early.', icon: <Building2 className="h-5 w-5" /> },
    { title: 'Transport', desc: 'Student discounts on public transport in most cities.', icon: <Plane className="h-5 w-5" /> },
    { title: 'Healthcare', desc: 'Most countries require health insurance for students.', icon: <Heart className="h-5 w-5" /> },
    { title: 'Part-time Work', desc: 'Most student visas allow 20hrs/week during term time.', icon: <Briefcase className="h-5 w-5" /> },
    { title: 'Banking', desc: 'Open a local bank account upon arrival.', icon: <DollarSign className="h-5 w-5" /> },
    { title: 'Cultural Adaptation', desc: 'Join societies, attend orientation, connect with locals.', icon: <Globe className="h-5 w-5" /> },
  ];

  const renderContent = () => {
    if (loading) return <div className="space-y-4 p-4">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full rounded-xl" />))}</div>;

    switch (activeCategory) {
      case 'countries':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">Country Requirements</h2>
            <p className="text-[#555555] text-sm">Select a country to explore admission requirements.</p>
            {filteredCountries.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {filteredCountries.map((c) => (
                  <Card key={c.id} className={`rounded-2xl border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${selectedCountry === c.slug ? 'ring-2 ring-[#F37021]' : ''}`} onClick={() => setSelectedCountry(selectedCountry === c.slug ? null : c.slug)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0066CC]/10 flex items-center justify-center text-[#0066CC]"><Flag className="h-6 w-6" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-[#101828]">{c.name}</h3><p className="text-xs text-[#555555]">Click to explore</p></div>
                      <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${selectedCountry === c.slug ? 'rotate-90' : ''}`} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <p className="text-[#555555] text-center py-8">No countries found.</p>}
            {selectedCountry && (
              <Card className="rounded-2xl border-0 shadow-md mt-4">
                <CardHeader><CardTitle className="text-lg text-[#101828]">{countries.find((c) => c.slug === selectedCountry)?.name} — Quick Info</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {['Academic transcripts & certificates', 'English proficiency test (IELTS/TOEFL)', 'Valid passport (6+ months)', 'SOP & Letters of Recommendation'].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-[#555555]"><CheckCircle2 className="h-4 w-4 mt-0.5 text-[#F37021] flex-shrink-0" /><span>{item}</span></div>
                  ))}
                  <Button onClick={() => onNavigate('country', selectedCountry)} size="sm" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full mt-2">View Full Guide <ChevronRight className="ml-1 h-3 w-3" /></Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'exams':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">English & Admission Exams</h2>
            <p className="text-[#555555] text-sm">Required exams for studying abroad.</p>
            {filteredExams.length > 0 ? (
              <div className="space-y-3 mt-4">
                {filteredExams.map((exam) => (
                  <Card key={exam.id} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F37021]/10 flex items-center justify-center text-[#F37021]"><BookOpen className="h-5 w-5" /></div>
                        <div><h3 className="font-semibold text-[#101828]">{exam.name}</h3>{exam.type && <Badge variant="secondary" className="text-xs mt-1 bg-[#0066CC]/10 text-[#0066CC] border-0">{exam.type}</Badge>}</div>
                      </div>
                      {exam.description && <p className="mt-3 text-sm text-[#555555] leading-relaxed">{exam.description}</p>}
                      {exam.scoreInfo && <div className="mt-2 flex items-center gap-2 text-sm text-[#F37021] font-medium"><GraduationCap className="h-4 w-4" />{exam.scoreInfo}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <p className="text-[#555555] text-center py-8">No exams found.</p>}
          </div>
        );

      case 'documents':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">Required Documents</h2>
            <p className="text-[#555555] text-sm">Common documents for study abroad applications.</p>
            <div className="grid gap-3 mt-4">
              {DOCS.map((doc) => (
                <Card key={doc.name} className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3"><FileText className="h-5 w-5 mt-0.5 text-[#F37021] flex-shrink-0" /><div><h3 className="font-medium text-[#101828] text-sm">{doc.name}</h3><p className="text-xs text-[#555555] mt-0.5">{doc.desc}</p></div></CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">Costs & Budgeting</h2>
            <p className="text-[#555555] text-sm">Estimated costs for popular destinations.</p>
            <div className="space-y-3 mt-4">
              {COSTS.map((c) => (
                <Card key={c.country} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3"><Globe className="h-5 w-5 text-[#0066CC]" /><h3 className="font-semibold text-[#101828]">{c.country}</h3></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#F8FAFC] rounded-xl p-3"><p className="text-xs text-[#555555]">Tuition</p><p className="text-sm font-semibold text-[#F37021] mt-0.5">{c.tuition}</p></div>
                      <div className="bg-[#F8FAFC] rounded-xl p-3"><p className="text-xs text-[#555555]">Living</p><p className="text-sm font-semibold text-[#0066CC] mt-0.5">{c.living}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'visas':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">Visa Information</h2>
            <p className="text-[#555555] text-sm">Key visa requirements for popular study destinations.</p>
            <div className="space-y-3 mt-4">
              {VISAS.map((v) => (
                <Card key={v.country} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-[#101828] mb-2">{v.country}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-[#555555]"><Plane className="h-4 w-4 text-[#F37021] flex-shrink-0" /><span><strong>Visa:</strong> {v.visa}</span></div>
                      <div className="flex items-center gap-2 text-[#555555]"><Shield className="h-4 w-4 text-[#0066CC] flex-shrink-0" /><span><strong>Processing:</strong> {v.processing}</span></div>
                      <p className="text-[#555555] text-xs leading-relaxed">{v.keyReq}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'resources':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">Student Resources</h2>
            <p className="text-[#555555] text-sm">Visa guides, document checklists, and preparation tips.</p>
            {filteredResources.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {filteredResources.map((res) => (
                  <Card key={res.slug} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={() => onNavigate('resource', res.slug)}>
                    {res.heroImage && <div className="aspect-video overflow-hidden"><img src={res.heroImage} alt={res.title} className="w-full h-full object-cover" /></div>}
                    <CardContent className="p-4">
                      {res.category && <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-0 text-xs mb-2">{res.category}</Badge>}
                      <h3 className="font-semibold text-[#101828] text-sm line-clamp-2">{res.title}</h3>
                      {res.excerpt && <p className="text-xs text-[#555555] mt-1 line-clamp-2">{res.excerpt}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {['UK Visa Guide', 'US F-1 Visa Checklist', 'Canada Study Permit Guide', 'Australia GTE Statement Tips', 'SOP Writing Guide', 'IELTS Preparation Tips'].map((title) => (
                  <Card key={title} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3"><BookOpen className="h-5 w-5 text-[#F37021] flex-shrink-0" /><div><h3 className="font-medium text-[#101828] text-sm">{title}</h3><p className="text-xs text-[#555555]">Coming soon — check back for detailed guides</p></div></CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'living':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[#101828]">Living Abroad</h2>
            <p className="text-[#555555] text-sm">Tips about student life overseas.</p>
            <div className="space-y-3 mt-4">
              {LIVING.map((item) => (
                <Card key={item.title} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFB347]/20 flex items-center justify-center text-[#F37021] flex-shrink-0">{item.icon}</div>
                    <div><h3 className="font-medium text-[#101828] text-sm">{item.title}</h3><p className="text-xs text-[#555555] mt-0.5 leading-relaxed">{item.desc}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-h-screen">
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
      </button>

      <section className="bg-gradient-to-r from-[#101828] to-[#0066CC] pt-24 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Student Info Center</h1>
          <p className="mt-2 text-white/70">Everything you need to know about studying abroad.</p>
          <div className="mt-6 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input placeholder="Search information..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/20" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} onClick={() => handleCategoryChange(cat.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${activeCategory === cat.key ? 'bg-[#F37021] text-white shadow-md' : 'text-[#555555] hover:bg-gray-100'}`}>
                  {cat.icon}{cat.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} onClick={() => handleCategoryChange(cat.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat.key ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-[#555555]'}`}>
                  {cat.icon}{cat.label}
                </button>
              ))}
            </div>

            {renderContent()}

            {!loading && filteredFaqs.length > 0 && (
              <div className="mt-8 p-4">
                <h2 className="text-xl font-bold text-[#101828] mb-4">Common Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.slice(0, 6).map((faq, i) => (
                    <AccordionItem key={faq.id || i} value={`faq-${faq.id || i}`} className="border-gray-100">
                      <AccordionTrigger className="text-left text-sm text-[#101828] font-medium hover:text-[#F37021] transition-colors">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-sm text-[#555555] leading-relaxed">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </main>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => handleCategoryChange(cat.key)} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 ${activeCategory === cat.key ? 'text-[#F37021]' : 'text-gray-400'}`} aria-label={cat.label}>
              <span className="h-5 w-5">{cat.icon}</span>
              <span className="text-[10px] leading-tight font-medium truncate w-full text-center">{cat.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="lg:hidden h-20" />
    </motion.div>
  );
}
