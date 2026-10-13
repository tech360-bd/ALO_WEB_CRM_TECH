'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  ArrowRight,
  Search,
  Brain,
  FileCheck,
  Rocket,
  Bookmark,
  Quote,
  Globe,
  Clock,
  ArrowRightLeft,
  Sparkles,
  BookOpen,
  Award,
  MessageCircle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  UNIVERSITIES,
  COURSES,
  SCHOLARSHIPS,
  ENGLISH_TESTS,
  TESTIMONIALS,
  BLOGS,
  FAQS,
  PARTNER_LOGOS,
} from './homepage-data';

// Types

interface NewHomepageProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
  onFinderOpen: () => void;
}

// Shared heading

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center mb-10 md:mb-14">
      <h2 className="text-3xl md:text-4xl font-bold text-[#000000] tracking-tight">{title}</h2>
      {description && (
        <p className="mt-3 text-[#555555] text-base md:text-lg max-w-2xl mx-auto">{description}</p>
      )}
    </div>
  );
}

// 1. HERO SECTION

function HeroSection({ onNavigate, onLeadOpen }: { onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center -mt-16 md:-mt-16">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero/UK slide Banner.webp')" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0, 20, 60, 0.40) 0%, rgba(0, 0, 0, 0.70) 100%)' }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Your Global Education<br />Starts Here
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-xl leading-relaxed">
            Find the right university, course and pathway for your future with ALO Education&apos;s AI-powered platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={() => onNavigate('courses')}
              className={cn(
                'bg-[#F37021] text-white h-12 px-8 rounded-xl font-semibold text-sm',
                'transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40',
                'min-w-[180px] glow-pulse',
              )}
            >
              Find My Course<ArrowRight className="inline ml-2 h-4 w-4" />
            </button>
            <button
              onClick={onLeadOpen}
              className="border-2 border-white text-white h-12 px-8 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-200 min-w-[180px]"
            >
              Talk to an Expert
            </button>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3">
            {['150+ Partner Universities', '12,000+ Courses', 'Free for Students'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-white/70 text-sm">
                <CheckCircle className="h-4 w-4 text-[#FFB347] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 2. TRUST BAR

function TrustBar() {
  return (
    <section className="bg-white py-10 overflow-hidden">
      <p className="text-center text-[#555555] text-sm uppercase tracking-wider mb-6">Trusted by students worldwide</p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="scroll-x-animation flex items-center gap-12 w-max">
          {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((name, i) => (
            <span key={`${name}-${i}`} className="text-sm font-medium text-[#BBBBBB] whitespace-nowrap select-none">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// 3. STUDY DESTINATIONS

const GRADIENTS = [
  'from-blue-50 to-blue-100',
  'from-red-50 to-red-100',
  'from-amber-50 to-amber-100',
  'from-sky-50 to-sky-100',
  'from-emerald-50 to-emerald-100',
  'from-green-50 to-green-100',
  'from-yellow-50 to-yellow-100',
  'from-orange-50 to-amber-100',
];

function StudyDestinations({ onNavigate }: { onNavigate: (page: string, slug?: string) => void }) {
  const [countries, setCountries] = useState<Array<{ slug: string; name: string; flag: string; universities: number }>>([]);

  useEffect(() => {
    fetch('/api/countries')
      .then(r => r.json())
      .then(d => setCountries(d.countries || []))
      .catch(() => {});
  }, []);

  return (
    <section className="bg-[#F7F7F7] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Study Abroad" description="Explore destinations with verified universities, courses and scholarships" />
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          {countries.map((country, i) => (
            <button
              key={country.slug}
              onClick={() => onNavigate('country', country.slug)}
              className={cn(
                'group bg-white rounded-2xl overflow-hidden border border-transparent',
                'hover:border-[#0066CC]/20 card-lift text-left',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] min-h-[48px]',
              )}
            >
              <div className={`bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center h-20 md:h-24`}>
                <span className="text-3xl md:text-4xl">{country.flag}</span>
              </div>
              <div className="p-3 md:p-4">
                <p className="font-semibold text-sm text-[#000000] leading-tight line-clamp-1">{country.name}</p>
                <p className="text-xs text-[#555555] mt-1">{country.universities || 0} universities</p>
                <span className="inline-flex items-center text-xs text-[#0066CC] font-medium mt-1.5 group-hover:gap-1.5 gap-1 transition-all">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. HOW ALO WORKS

function HowAloWorks() {
  const steps = [
    { num: 1, icon: <Search className="h-5 w-5" />, title: 'Tell Us Your Goals', desc: 'Share your academic background, preferences, and budget to get personalised recommendations.' },
    { num: 2, icon: <Brain className="h-5 w-5" />, title: 'AI Matches You', desc: 'Our intelligent engine analyses your profile and matches you with the best-fit programmes.' },
    { num: 3, icon: <FileCheck className="h-5 w-5" />, title: 'Apply with Support', desc: 'Get expert help with your application, documents, and scholarship submissions.' },
    { num: 4, icon: <Rocket className="h-5 w-5" />, title: 'Start Your Journey', desc: 'Receive your offer, secure your visa, and prepare for an incredible study abroad experience.' },
  ];

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="How ALO Works" />
        <div className="relative">
          <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-[2px] bg-[#E5E5E5]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className={cn('relative z-10 flex items-center justify-center', 'size-12 rounded-full bg-[#0066CC] text-white', 'shadow-lg shadow-blue-200/50')}>
                  {step.icon}
                </div>
                <h3 className="mt-5 font-semibold text-[#000000]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#555555] leading-relaxed max-w-[240px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 5. FEATURED UNIVERSITIES

function FeaturedUniversities({ onNavigate }: { onNavigate: (page: string, slug?: string) => void }) {
  return (
    <section className="bg-[#F7F7F7] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Featured Universities" description="Discover our partner universities with verified courses and scholarship opportunities" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {UNIVERSITIES.map((uni) => (
            <div key={uni.name} className={cn('group bg-white rounded-2xl overflow-hidden border border-transparent', 'hover:border-[#0066CC]/20 card-lift')}>
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="img-zoom absolute inset-0 bg-gradient-to-br from-blue-100/50 to-blue-200/50" />
                <div className="absolute bottom-3 left-4 right-4 z-10">
                  <p className="text-sm font-bold text-[#000000] text-shadow-overlay">{uni.name}</p>
                </div>
                <div className="absolute top-3 right-3 z-10 flex items-center justify-center size-11 rounded-full bg-[#0066CC] text-white text-xs font-bold shadow-lg">
                  {uni.matchScore}%
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-lg font-bold text-[#000000]">{uni.name}</p>
                <p className="text-sm text-[#555555] mt-0.5">{uni.city}, {uni.country}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#555555]">
                  <div><span className="block font-medium text-[#000000]">{uni.ranking}</span>Ranking</div>
                  <div><span className="block font-medium text-[#000000]">{uni.tuition}</span>Tuition</div>
                  <div><span className="block font-medium text-[#10B981]">{uni.scholarship}</span>Scholarship</div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <button className="text-xs font-medium px-4 h-9 rounded-lg border border-[#E5E5E5] text-[#555555] hover:border-[#0066CC] hover:text-[#0066CC] transition-colors min-h-[48px]">
                    <ArrowRightLeft className="inline h-3.5 w-3.5 mr-1" />Compare
                  </button>
                  <button
                    onClick={() => onNavigate('university', uni.name.toLowerCase().replace(/\s+/g, '-'))}
                    className="text-xs font-semibold text-[#0066CC] hover:underline min-h-[48px] flex items-center"
                  >
                    View University <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => onNavigate('universities')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px]">
            View All Universities <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// 6. COURSE FINDER CTA

function CourseFinderCTA({ onFinderOpen }: { onFinderOpen: () => void }) {
  return (
    <section className="relative overflow-hidden py-16 md:py-20" style={{ background: 'linear-gradient(135deg, #004C99, #0066CC)' }}>
      <div className="absolute inset-0 dot-grid-blue pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <Sparkles className="h-10 w-10 text-[#FFB347] mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Find Your Perfect Course</h2>
        <p className="mt-4 text-white/80 text-base md:text-lg max-w-xl mx-auto">AI-powered matching based on your profile, preferences, and eligibility</p>
        <button
          onClick={onFinderOpen}
          className={cn('mt-8 bg-[#F37021] text-white h-12 px-8 rounded-xl font-semibold text-sm', 'transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40')}
        >
          Start Course Finder<ArrowRight className="inline ml-2 h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

// 7. POPULAR COURSES

function PopularCourses({ onNavigate }: { onNavigate: (page: string, slug?: string) => void }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Popular Courses" description="Browse our most searched programmes" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map((course) => (
            <div key={course.name} className={cn('group bg-white rounded-2xl border border-[#E5E5E5] p-5 card-lift', 'hover:border-[#0066CC]/20')}>
              <h3 className="font-semibold text-[#000000] text-base leading-tight">{course.name}</h3>
              <p className="text-sm text-[#555555] mt-1">{course.university}</p>
              <p className="text-xs text-[#555555] mt-0.5 flex items-center gap-1">
                <Globe className="h-3 w-3" /> {course.city}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div><p className="text-xs text-[#555555]">Degree</p><p className="text-sm font-medium text-[#000000]">{course.degree}</p></div>
                <div><p className="text-xs text-[#555555]">Duration</p><p className="text-sm font-medium text-[#000000]">{course.duration}</p></div>
                <div><p className="text-xs text-[#555555]">Tuition</p><p className="text-sm font-medium text-[#000000]">{course.tuition}</p></div>
                <div><p className="text-xs text-[#555555]">Intake</p><p className="text-sm font-medium text-[#000000]">{course.intake}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-[#E8F2FF] text-[#0066CC] text-xs font-medium border-0">{course.english}</Badge>
                {course.scholarship && (
                  <Badge variant="secondary" className="bg-[#FFF0E6] text-[#F37021] text-xs font-medium border-0">
                    <Award className="h-3 w-3 mr-1" />Scholarship
                  </Badge>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                <button
                  onClick={() => onNavigate('course', course.name.toLowerCase().replace(/\s+/g, '-'))}
                  className="text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px] flex items-center"
                >
                  View Course <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </button>
                <button className={cn('flex items-center justify-center w-10 h-10 rounded-lg', 'text-[#555555] hover:text-[#F37021] hover:bg-[#FFF0E6]', 'transition-colors')} aria-label="Save course">
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => onNavigate('courses')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px]">
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// 8. SCHOLARSHIPS

function Scholarships({ onNavigate }: { onNavigate: (page: string, slug?: string) => void }) {
  return (
    <section className="bg-[#F7F7F7] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-3">
            <h2 className="text-3xl md:text-4xl font-bold text-[#000000] tracking-tight">Scholarships</h2>
            <Badge className="bg-[#FFF0E6] text-[#F37021] font-semibold border-0 px-3 py-1 text-sm">Up to £10,000</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SCHOLARSHIPS.map((s) => (
            <div key={s.name} className="bg-white rounded-2xl border border-[#E5E5E5] border-l-4 border-l-[#F37021] p-5 card-lift">
              <h3 className="font-semibold text-[#000000] text-sm leading-tight">{s.name}</h3>
              <p className="text-xs text-[#555555] mt-1">{s.university}</p>
              <p className="text-2xl font-bold text-[#10B981] mt-3">{s.amount}</p>
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-[#555555] flex items-center gap-1.5"><Clock className="h-3 w-3 shrink-0" /> {s.deadline}</p>
                <p className="text-xs text-[#555555] line-clamp-2">{s.eligibility}</p>
              </div>
              <button
                onClick={() => onNavigate('scholarships')}
                className={cn('mt-4 w-full bg-[#F37021] text-white h-10 rounded-lg text-sm font-semibold', 'hover:bg-[#D45A10] transition-colors min-h-[48px]')}
              >
                Check Eligibility
              </button>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => onNavigate('scholarships')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px]">
            View All Scholarships <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// 9. ENGLISH TEST PREPARATION

function EnglishTestPrep({ onNavigate, onLeadOpen }: { onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'rgba(232, 242, 255, 0.5)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="English Test Preparation" description="Master IELTS, PTE, TOEFL and more with our preparation resources" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {ENGLISH_TESTS.map((test) => (
            <div key={test.name} className={cn('bg-white rounded-2xl p-5 card-lift border border-transparent', 'hover:border-[#0066CC]/20')}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#E8F2FF] text-[#0066CC] mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-[#000000] text-base">{test.name}</h3>
              <p className="text-sm text-[#555555] mt-2 leading-relaxed line-clamp-3">{test.description}</p>
              <Badge variant="secondary" className="mt-3 bg-[#FFF6E8] text-[#D45A10] text-xs border-0">Best for: {test.bestFor}</Badge>
              <button onClick={() => onNavigate('english-tests')} className="mt-4 text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px] flex items-center">
                Learn More <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => onNavigate('english-tests')} className="border-2 border-[#0066CC] text-[#0066CC] h-12 px-8 rounded-xl font-semibold text-sm hover:bg-[#0066CC] hover:text-white transition-all min-h-[48px]">
            Compare All Tests
          </button>
          <button onClick={onLeadOpen} className="bg-[#F37021] text-white h-12 px-8 rounded-xl font-semibold text-sm hover:bg-[#D45A10] transition-colors min-h-[48px]">
            Take Free Assessment
          </button>
        </div>
      </div>
    </section>
  );
}

// 10. TESTIMONIALS

function StudentStories() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Student Stories" />
        <p className="-mt-6 mb-10 text-center text-xs text-[#555555] max-w-lg mx-auto">
          These are approved testimonials from students who have consented to share their experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={cn('bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8', 'card-lift hover:border-[#0066CC]/20')}>
              <Quote className="h-8 w-8 text-[#F37021] mb-4" />
              <p className="text-[#555555] text-sm leading-relaxed">{t.quote}</p>
              <div className="mt-6 pt-4 border-t border-[#E5E5E5] flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#000000] text-sm">{t.name}</p>
                  <p className="text-xs text-[#555555] mt-0.5">{t.course} - {t.university}</p>
                </div>
                <Badge variant="secondary" className="bg-[#E8F2FF] text-[#0066CC] text-xs font-medium border-0 shrink-0">{t.outcome}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 11. BLOG / GUIDES

function BlogGuides({ onNavigate }: { onNavigate: (page: string, slug?: string) => void }) {
  const blogImages = ['/images/alo/blogs/blog-01.webp', '/images/alo/blogs/blog-02.webp', '/images/alo/blogs/blog-03.webp'];

  return (
    <section className="bg-[#F7F7F7] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Blog & Guides" description="Stay informed with the latest study abroad insights" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOGS.map((blog, i) => (
            <div key={blog.title} className={cn('group bg-white rounded-2xl overflow-hidden border border-transparent', 'hover:border-[#0066CC]/20 card-lift')}>
              <div className="relative h-40 overflow-hidden bg-gray-100">
                {blogImages[i] && (
                  <div className="img-zoom absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${blogImages[i]}')` }} />
                )}
                <Badge className="absolute top-3 left-3 z-10 bg-white/90 text-[#0066CC] text-xs font-medium border-0 backdrop-blur-sm">{blog.category}</Badge>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#000000] text-base leading-tight line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-[#555555] mt-2 line-clamp-2">{blog.summary}</p>
                <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#555555]">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {blog.author}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {blog.readTime}</span>
                  </div>
                  <button onClick={() => onNavigate('blog')} className="text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px] flex items-center">
                    Read More <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => onNavigate('blog')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066CC] hover:underline min-h-[48px]">
            View All Articles <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// 12. FAQ

function FaqSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Frequently Asked Questions" />
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-[#E5E5E5]">
              <AccordionTrigger className="text-[#000000] font-medium hover:no-underline hover:text-[#0066CC] text-left text-sm md:text-base min-h-[48px]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#555555] text-sm leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// 13. FINAL CTA

function FinalCTA({ onNavigate, onLeadOpen }: { onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  return (
    <section className="relative overflow-hidden py-16 md:py-20" style={{ background: 'linear-gradient(135deg, #004C99, #0066CC)' }}>
      <div className="absolute inset-0 dot-grid-blue pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <MessageCircle className="h-10 w-10 text-[#FFB347] mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ready to Start Your Study Abroad Journey?</h2>
        <p className="mt-4 text-white/80 text-base md:text-lg max-w-xl mx-auto">
          Book a free consultation with an ALO counsellor and take the first step towards your international education.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLeadOpen}
            className={cn('bg-[#F37021] text-white h-12 px-8 rounded-xl font-semibold text-sm', 'hover:bg-[#D45A10] transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40', 'min-w-[220px]')}
          >
            Book Free Consultation<ArrowRight className="inline ml-2 h-4 w-4" />
          </button>
          <button onClick={() => onNavigate('courses')} className="border-2 border-white text-white h-12 px-8 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-200 min-w-[200px]">
            Explore Courses
          </button>
        </div>
      </div>
    </section>
  );
}

// MAIN EXPORT

export function NewHomepage({ onNavigate, onLeadOpen, onFinderOpen }: NewHomepageProps) {
  return (
    <div className="flex flex-col bg-white">
        <HeroSection onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <TrustBar />
        <StudyDestinations onNavigate={onNavigate} />
        <HowAloWorks />
        <FeaturedUniversities onNavigate={onNavigate} />
        <CourseFinderCTA onFinderOpen={onFinderOpen} />
        <PopularCourses onNavigate={onNavigate} />
        <Scholarships onNavigate={onNavigate} />
        <EnglishTestPrep onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <StudentStories />
        <BlogGuides onNavigate={onNavigate} />
        <FaqSection />
        <FinalCTA onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
    </div>
  );
}
