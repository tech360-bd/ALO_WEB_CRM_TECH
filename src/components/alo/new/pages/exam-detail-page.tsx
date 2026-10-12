'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Globe,
  DollarSign,
  Award,
  BookOpen,
  Languages,
  FileText,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  CalendarDays,
  Headphones,
  HelpCircle,
  BarChart3,
  Target,
  ListChecks,
  PenTool,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExamDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface ExamData {
  name: string;
  slug: string;
  fullName?: string;
  shortName?: string;
  intro?: string;
  description?: string;
  whoShouldTake?: string;
  testFormat?: string;
  modules?: string;
  duration?: string;
  scoring?: string;
  results?: string;
  cost?: string;
  acceptedCountries?: string;
  universityAcceptance?: string;
  visaRelevance?: string;
  minScoreByDest?: string;
  prepStrategy?: string;
  listeningPrep?: string;
  readingPrep?: string;
  writingPrep?: string;
  speakingPrep?: string;
  mockTestStrategy?: string;
  commonMistakes?: string;
  retakeInfo?: string;
  scoreValidity?: string;
  registration?: string;
  testDayChecklist?: string;
  aloSupport?: string;
  bestFor?: string;
  acceptance?: string;
  faqs?: string;
}

// ─── Info Card ───────────────────────────────────────────────────────────────

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift">
      <div className="text-alo-blue mb-2">{icon}</div>
      <p className="text-xs text-alo-gray mb-1">{label}</p>
      <p className="text-sm font-semibold text-alo-black">{value}</p>
    </div>
  );
}

// ─── Content Section ─────────────────────────────────────────────────────────

function ContentSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-alo-blue">{icon}</span>
        <h2 className="text-2xl font-bold text-alo-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ExamDetailPage({ slug, onBack, onNavigate, onLeadOpen }: ExamDetailPageProps) {
  const [data, setData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchExam = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/exams/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json.exam);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExam();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-48 mb-8" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-alo-orange/10 flex items-center justify-center mb-4">
              <Languages className="h-8 w-8 text-alo-orange" />
            </div>
            <h3 className="text-xl font-semibold text-alo-black mb-2">Failed to Load Exam Info</h3>
            <p className="text-alo-gray mb-6 max-w-md">Something went wrong while fetching the exam data.</p>
            <Button onClick={fetchExam} className="bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl transition-all duration-200">
              Try Again
            </Button>
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  // Parse accepted countries
  const acceptedCountries = data.acceptedCountries
    ? typeof data.acceptedCountries === 'string'
      ? data.acceptedCountries.split(',').map((s) => s.trim()).filter(Boolean)
      : Array.isArray(data.acceptedCountries)
        ? data.acceptedCountries
        : []
    : [];

  // Parse FAQs
  const faqs = data.faqs
    ? typeof data.faqs === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(data.faqs);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : Array.isArray(data.faqs)
        ? data.faqs
        : []
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={onBack}
            className="text-alo-gray hover:text-alo-blue flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-alo-gray mb-6 -mt-4">
            <button onClick={onBack} className="hover:text-alo-blue transition-colors">Home</button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-alo-blue transition-colors">English Tests</button>
            <span>/</span>
            <span className="text-alo-black font-medium">{data.name}</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-2">
              {data.name}
            </h1>
            {data.fullName && (
              <p className="text-alo-gray text-sm mb-3">{data.fullName}</p>
            )}
            {data.bestFor && (
              <Badge className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1 rounded-full border-0">
                Best for: {data.bestFor}
              </Badge>
            )}
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <InfoCard icon={<BarChart3 className="h-5 w-5" />} label="Score Range" value={data.scoring} />
            <InfoCard icon={<Clock className="h-5 w-5" />} label="Result Time" value={data.results} />
            <InfoCard icon={<DollarSign className="h-5 w-5" />} label="Cost" value={data.cost} />
            <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Score Validity" value={data.scoreValidity} />
          </div>

          {/* Description */}
          {(data.intro || data.description) && (
            <ContentSection title="Overview" icon={<BookOpen className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.intro || data.description}</p>
            </ContentSection>
          )}

          {/* Accepted Destinations */}
          {acceptedCountries.length > 0 && (
            <ContentSection title="Accepted Destinations" icon={<Globe className="h-5 w-5" />}>
              <div className="flex flex-wrap gap-2">
                {acceptedCountries.map((c) => (
                  <Badge
                    key={c}
                    className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1.5 rounded-full border-0"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </ContentSection>
          )}

          {/* Test Format */}
          {data.testFormat && (
            <ContentSection title="Test Format" icon={<FileText className="h-5 w-5" />}>
              <div className="bg-alo-gray-light rounded-2xl p-6 md:p-8">
                <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.testFormat}</p>
              </div>
            </ContentSection>
          )}

          {/* Who Should Take */}
          {data.whoShouldTake && (
            <ContentSection title="Who Should Take This Test?" icon={<Target className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whoShouldTake}</p>
            </ContentSection>
          )}

          {/* Preparation Strategy */}
          {data.prepStrategy && (
            <ContentSection title="Preparation Strategy" icon={<GraduationCap className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.prepStrategy}</p>
            </ContentSection>
          )}

          {/* Section-wise Preparation */}
          {(data.listeningPrep || data.readingPrep || data.writingPrep || data.speakingPrep) && (
            <ContentSection title="Section-wise Preparation" icon={<ListChecks className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.listeningPrep && (
                  <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5">
                    <h3 className="text-sm font-semibold text-alo-black mb-2 flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-alo-blue" /> Listening
                    </h3>
                    <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">{data.listeningPrep}</p>
                  </div>
                )}
                {data.readingPrep && (
                  <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5">
                    <h3 className="text-sm font-semibold text-alo-black mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-alo-blue" /> Reading
                    </h3>
                    <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">{data.readingPrep}</p>
                  </div>
                )}
                {data.writingPrep && (
                  <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5">
                    <h3 className="text-sm font-semibold text-alo-black mb-2 flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-alo-blue" /> Writing
                    </h3>
                    <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">{data.writingPrep}</p>
                  </div>
                )}
                {data.speakingPrep && (
                  <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5">
                    <h3 className="text-sm font-semibold text-alo-black mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-alo-blue" /> Speaking
                    </h3>
                    <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">{data.speakingPrep}</p>
                  </div>
                )}
              </div>
            </ContentSection>
          )}

          {/* Common Mistakes */}
          {data.commonMistakes && (
            <ContentSection title="Common Mistakes to Avoid" icon={<AlertTriangle className="h-5 w-5" />}>
              <div className="bg-alo-orange/5 border border-alo-orange/20 rounded-2xl p-6 md:p-8">
                <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.commonMistakes}</p>
              </div>
            </ContentSection>
          )}

          {/* Test Day Checklist */}
          {data.testDayChecklist && (
            <ContentSection title="Test Day Checklist" icon={<CheckCircle2 className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.testDayChecklist}</p>
            </ContentSection>
          )}

          {/* ALO Support */}
          {data.aloSupport && (
            <ContentSection title="How ALO Helps" icon={<Award className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.aloSupport}</p>
            </ContentSection>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <ContentSection title="Frequently Asked Questions" icon={<HelpCircle className="h-5 w-5" />}>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq: { q?: string; a?: string; question?: string; answer?: string }, idx: number) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-sm font-medium text-alo-black text-left hover:no-underline">
                      {faq.q || faq.question || ''}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-alo-gray leading-relaxed">
                      {faq.a || faq.answer || ''}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ContentSection>
          )}

          {/* CTA */}
          <section className="bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-2xl p-8 md:p-10 text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Prepare for {data.name} with ALO
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Get expert guidance, study materials, and personalised preparation strategies — all for free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                  'bg-alo-orange hover:bg-alo-orange-dark',
                  'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                  'transition-all duration-200',
                )}
              >
                Prepare with ALO
              </Button>
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm',
                  'bg-white text-alo-blue hover:bg-white/90',
                  'transition-all duration-200',
                )}
              >
                Book Consultation
              </Button>
            </div>
          </section>
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
