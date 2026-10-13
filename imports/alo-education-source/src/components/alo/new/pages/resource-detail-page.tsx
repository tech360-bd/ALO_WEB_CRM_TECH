'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  Tag,
  FileText,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  GraduationCap,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResourceDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface ResourceData {
  title: string;
  slug: string;
  category?: string;
  summary?: string;
  content?: string;
  author?: string;
  readingTime?: string;
  keyTakeaways?: string;
  whoAppliesTo?: string;
  requirements?: string;
  stepByStep?: string;
  documents?: string;
  timeline?: string;
  fees?: string;
  importantDates?: string;
  commonMistakes?: string;
  aloGuidance?: string;
  officialSources?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Section Component ───────────────────────────────────────────────────────

function ContentSection({ title, icon, children, alt }: { title: string; icon: React.ReactNode; children: React.ReactNode; alt?: boolean }) {
  return (
    <section className={cn('mb-10 rounded-2xl p-6 md:p-8', alt ? 'bg-alo-gray-light' : '')}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-alo-blue">{icon}</span>
        <h2 className="text-xl font-bold text-alo-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ResourceDetailPage({ slug, onBack, onNavigate, onLeadOpen }: ResourceDetailPageProps) {
  const [data, setData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchResource = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/resources/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json.resource);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResource();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-48 mb-8" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-4 w-64 mb-8" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <Skeleton className="h-4 w-4/5 mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4" />
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
              <FileText className="h-8 w-8 text-alo-orange" />
            </div>
            <h3 className="text-xl font-semibold text-alo-black mb-2">Failed to Load Resource</h3>
            <p className="text-alo-gray mb-6 max-w-md">Something went wrong while fetching the resource data.</p>
            <Button onClick={fetchResource} className="bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl transition-all duration-200">
              Try Again
            </Button>
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <button onClick={onBack} className="hover:text-alo-blue transition-colors">Resources</button>
            <span>/</span>
            <span className="text-alo-black font-medium truncate max-w-[200px] sm:max-w-none">{data.title}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {data.category && (
                <Badge className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1 rounded-full border-0">
                  <Tag className="h-3 w-3 mr-1" />
                  {data.category}
                </Badge>
              )}
              {data.readingTime && (
                <span className="flex items-center gap-1 text-xs text-alo-gray">
                  <Clock className="h-3 w-3" />{data.readingTime}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-4 leading-tight">
              {data.title}
            </h1>
            {data.summary && (
              <p className="text-lg text-alo-gray leading-relaxed">{data.summary}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-alo-gray">
              {data.author && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {data.author}
                </span>
              )}
              {data.createdAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(data.createdAt)}
                </span>
              )}
            </div>
          </header>

          {/* Key Takeaways */}
          {data.keyTakeaways && (
            <ContentSection title="Key Takeaways" icon={<CheckCircle2 className="h-5 w-5" />} alt>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.keyTakeaways}</p>
            </ContentSection>
          )}

          {/* Main Content */}
          {data.content && (
            <section className="mb-10">
              <div
                className="prose prose-sm sm:prose max-w-none text-alo-gray leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </section>
          )}

          {/* Who Applies To */}
          {data.whoAppliesTo && (
            <ContentSection title="Who Does This Apply To?" icon={<User className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whoAppliesTo}</p>
            </ContentSection>
          )}

          {/* Requirements */}
          {data.requirements && (
            <ContentSection title="Requirements" icon={<FileText className="h-5 w-5" />} alt>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.requirements}</p>
            </ContentSection>
          )}

          {/* Step by Step */}
          {data.stepByStep && (
            <ContentSection title="Step by Step Guide" icon={<ListChecks className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.stepByStep}</p>
            </ContentSection>
          )}

          {/* Documents */}
          {data.documents && (
            <ContentSection title="Required Documents" icon={<FileText className="h-5 w-5" />} alt>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.documents}</p>
            </ContentSection>
          )}

          {/* Timeline */}
          {data.timeline && (
            <ContentSection title="Timeline" icon={<CalendarDays className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.timeline}</p>
            </ContentSection>
          )}

          {/* Fees */}
          {data.fees && (
            <ContentSection title="Fees" icon={<Tag className="h-5 w-5" />} alt>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.fees}</p>
            </ContentSection>
          )}

          {/* Important Dates */}
          {data.importantDates && (
            <ContentSection title="Important Dates" icon={<CalendarDays className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.importantDates}</p>
            </ContentSection>
          )}

          {/* Common Mistakes */}
          {data.commonMistakes && (
            <ContentSection title="Common Mistakes to Avoid" icon={<AlertTriangle className="h-5 w-5" />} alt>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.commonMistakes}</p>
            </ContentSection>
          )}

          {/* ALO Guidance */}
          {data.aloGuidance && (
            <ContentSection title="ALO Guidance" icon={<GraduationCap className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.aloGuidance}</p>
            </ContentSection>
          )}

          {/* Official Sources */}
          {data.officialSources && (
            <ContentSection title="Official Sources" icon={<Globe className="h-5 w-5" />} alt>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.officialSources}</p>
            </ContentSection>
          )}

          {/* CTA */}
          <section className="bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-2xl p-8 md:p-10 text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Need Help with This?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Our expert counsellors are here to help you at every step of your study abroad journey — completely free.
            </p>
            <Button
              onClick={onLeadOpen}
              className={cn(
                'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                'bg-alo-orange hover:bg-alo-orange-dark',
                'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                'transition-all duration-200',
              )}
            >
              Talk to ALO
            </Button>
          </section>

          {/* Related Articles Placeholder */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-alo-black mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('resources', 'blogs')}
                className="text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6 card-lift group transition-all duration-200"
              >
                <BookOpen className="h-6 w-6 text-alo-blue mb-3" />
                <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">Blogs</h3>
                <p className="text-xs text-alo-gray mt-1">Latest news and tips for studying abroad</p>
              </button>
              <button
                onClick={() => onNavigate('resources', 'visa-guides')}
                className="text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6 card-lift group transition-all duration-200"
              >
                <Globe className="h-6 w-6 text-alo-orange mb-3" />
                <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">Visa Guides</h3>
                <p className="text-xs text-alo-gray mt-1">Step-by-step visa application guides</p>
              </button>
              <button
                onClick={() => onNavigate('resources', 'scholarships')}
                className="text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6 card-lift group transition-all duration-200"
              >
                <GraduationCap className="h-6 w-6 text-alo-sunshine mb-3" />
                <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">Scholarships</h3>
                <p className="text-xs text-alo-gray mt-1">Find funding for your studies</p>
              </button>
            </div>
          </section>
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
