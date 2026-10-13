'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  CalendarDays,
  Award,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  FileText,
  Users,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScholarshipDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface ScholarshipData {
  name: string;
  slug: string;
  amount?: number;
  amountType?: string;
  currency?: string;
  fundingType?: string;
  eligibility?: string;
  academicReq?: string;
  englishReq?: string;
  nationalityReq?: string;
  courseEligibility?: string;
  universityEligibility?: string;
  covers?: string;
  doesNotCover?: string;
  deadline?: string;
  openDate?: string;
  requiredDocs?: string;
  howToApply?: string;
  selectionProcess?: string;
  description?: string;
  overview?: string;
  whoCanApply?: string;
  whatALOdoes?: string;
  universityName?: string;
  universityInfo?: { name: string; slug: string; city?: string; countrySlug?: string } | null;
  courseInfo?: { name: string; slug: string; level?: string; subject?: string } | null;
  countryInfo?: { name: string; shortName?: string; flag?: string; slug: string } | null;
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-alo-blue">{icon}</span>
        <h3 className="text-lg font-semibold text-alo-black">{title}</h3>
      </div>
      {children}
    </section>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ScholarshipDetailPage({ slug, onBack, onNavigate, onLeadOpen }: ScholarshipDetailPageProps) {
  const [data, setData] = useState<ScholarshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchScholarship = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/scholarships/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json.scholarship);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarship();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-48 mb-8" />
            <Skeleton className="h-10 w-96 mb-2" />
            <Skeleton className="h-5 w-72 mb-8" />
            <Skeleton className="h-20 w-48 rounded-xl mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
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
              <Award className="h-8 w-8 text-alo-orange" />
            </div>
            <h3 className="text-xl font-semibold text-alo-black mb-2">Failed to Load Scholarship</h3>
            <p className="text-alo-gray mb-6 max-w-md">Something went wrong while fetching the scholarship data.</p>
            <Button onClick={fetchScholarship} className="bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl transition-all duration-200">
              Try Again
            </Button>
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  const currency = data.currency || '£';
  const amountStr = data.amount
    ? `${currency}${data.amount.toLocaleString()}`
    : 'Varies';
  const amountLabel = data.amountType || '';

  const coverItems = data.covers
    ? typeof data.covers === 'string'
      ? data.covers.split(',').map((s) => s.trim()).filter(Boolean)
      : Array.isArray(data.covers)
        ? data.covers
        : []
    : [];

  const notCoverItems = data.doesNotCover
    ? typeof data.doesNotCover === 'string'
      ? data.doesNotCover.split(',').map((s) => s.trim()).filter(Boolean)
      : Array.isArray(data.doesNotCover)
        ? data.doesNotCover
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
            <button onClick={() => onNavigate('resources', 'scholarships')} className="hover:text-alo-blue transition-colors">Scholarships</button>
            <span>/</span>
            <span className="text-alo-black font-medium truncate max-w-[200px] sm:max-w-none">{data.name}</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {data.fundingType && (
                <Badge className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1 rounded-full border-0">
                  {data.fundingType}
                </Badge>
              )}
              {data.countryInfo && (
                <Badge className="bg-alo-orange/10 text-alo-orange text-xs font-medium px-3 py-1 rounded-full border-0">
                  {data.countryInfo.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-3">{data.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-alo-gray">
              {data.universityName && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-alo-blue" />
                  {data.universityName}
                </span>
              )}
              {data.countryInfo && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-alo-blue" />
                  {data.countryInfo.name}
                </span>
              )}
            </div>
          </div>

          {/* Funding Amount - Prominent */}
          <div className="bg-alo-blue/5 border border-alo-blue/20 rounded-2xl p-6 md:p-8 mb-12 text-center">
            <p className="text-sm text-alo-gray mb-1">Funding Amount</p>
            <p className="text-4xl md:text-5xl font-bold text-alo-blue mb-2">{amountStr}</p>
            {amountLabel && <p className="text-sm text-alo-gray">{amountLabel}</p>}
            {data.deadline && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-alo-orange font-medium">
                <CalendarDays className="h-4 w-4" />
                Deadline: {data.deadline}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              {data.eligibility && (
                <InfoSection title="Eligibility" icon={<Users className="h-5 w-5" />}>
                  <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.eligibility}</p>
                </InfoSection>
              )}
              {data.whoCanApply && (
                <InfoSection title="Who Can Apply" icon={<HelpCircle className="h-5 w-5" />}>
                  <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whoCanApply}</p>
                </InfoSection>
              )}
              {data.deadline && (
                <InfoSection title="Deadline" icon={<CalendarDays className="h-5 w-5" />}>
                  <p className="text-alo-black font-semibold text-lg">{data.deadline}</p>
                  {data.openDate && (
                    <p className="text-sm text-alo-gray mt-1">Opens: {data.openDate}</p>
                  )}
                </InfoSection>
              )}
              {data.academicReq && (
                <InfoSection title="Academic Requirements" icon={<BookOpen className="h-5 w-5" />}>
                  <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.academicReq}</p>
                </InfoSection>
              )}
              {data.englishReq && (
                <InfoSection title="English Requirements" icon={<FileText className="h-5 w-5" />}>
                  <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.englishReq}</p>
                </InfoSection>
              )}
            </div>
            <div>
              {coverItems.length > 0 && (
                <InfoSection title="What It Covers" icon={<CheckCircle2 className="h-5 w-5" />}>
                  <ul className="space-y-2">
                    {coverItems.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-alo-gray">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </InfoSection>
              )}
              {notCoverItems.length > 0 && (
                <InfoSection title="Does Not Cover" icon={<XCircle className="h-5 w-5" />}>
                  <ul className="space-y-2">
                    {notCoverItems.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-alo-gray">
                        <XCircle className="h-4 w-4 text-alo-orange shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </InfoSection>
              )}
              {data.howToApply && (
                <InfoSection title="How to Apply" icon={<FileText className="h-5 w-5" />}>
                  <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.howToApply}</p>
                </InfoSection>
              )}
              {data.selectionProcess && (
                <InfoSection title="Selection Process" icon={<Award className="h-5 w-5" />}>
                  <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.selectionProcess}</p>
                </InfoSection>
              )}
            </div>
          </div>

          {/* Overview / Description */}
          {(data.overview || data.description) && (
            <section className="bg-alo-gray-light rounded-2xl p-6 md:p-8 mb-12">
              <h2 className="text-2xl font-bold text-alo-black mb-4">Overview</h2>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">
                {data.overview || data.description}
              </p>
            </section>
          )}

          {/* University Link Card */}
          {data.universityInfo && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-alo-black mb-4">University</h2>
              <button
                onClick={() => onNavigate('university', data.universityInfo!.slug)}
                className={cn(
                  'w-full text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6',
                  'card-lift group transition-all duration-200',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                      {data.universityInfo.name}
                    </h3>
                    {data.universityInfo.city && data.countryInfo && (
                      <p className="text-sm text-alo-gray mt-1">
                        {data.universityInfo.city}, {data.countryInfo.name}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-alo-gray group-hover:text-alo-blue transition-colors shrink-0 mt-1" />
                </div>
              </button>
            </section>
          )}

          {/* CTA */}
          <section className="bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-2xl p-8 md:p-10 text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Check Your Eligibility
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Our counsellors can help you understand if you qualify for this scholarship and guide you through the application process — completely free.
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
                Check Eligibility
              </Button>
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm',
                  'bg-white text-alo-blue hover:bg-white/90',
                  'transition-all duration-200',
                )}
              >
                Talk to ALO
              </Button>
            </div>
          </section>
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
