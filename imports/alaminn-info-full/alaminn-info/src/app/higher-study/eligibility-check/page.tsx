/**
 * /higher-study/eligibility-check
 * --------------------------------------------------------------------
 * Multi-step eligibility checker (client component) that asks 6
 * questions then POSTs to /api/v1/higher-study/eligibility-check.
 *
 * Result: shows matching universities / courses / scholarships with
 * "Apply Through ALO Education" CTA.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Languages,
  Briefcase,
  DollarSign,
} from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { PageHero, SectionCard } from "@/components/higher-study/page-hero";
import { EligibilityCheckerForm } from "@/components/higher-study/eligibility-checker-form";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Eligibility Checker — Higher Study | Alaminn.info",
  description:
    "Answer 6 quick questions about your study level, country of interest, academic background, English test, work experience and budget — get matched with universities, courses and scholarships from our verified database. Free, no sign-up required.",
  path: "/higher-study/eligibility-check",
  keywords: [
    "eligibility checker",
    "university eligibility",
    "course eligibility",
    "scholarship eligibility",
    "study abroad matcher",
    "find my university",
    "Profile evaluation",
  ],
});

export default function EligibilityCheckPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Eligibility Checker", url: `${HIGHER_STUDY_BASE_URL}/higher-study/eligibility-check` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Eligibility Checker" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="2-minute matcher"
        title="Eligibility Checker"
        description="Answer 6 quick questions about your study level, country, academic background, English test, work experience and budget. We'll match you with universities, courses and scholarships from our verified database — no sign-up required."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FeatureChip icon={<Clock className="h-4 w-4" />} label="2 minutes" />
          <FeatureChip icon={<CheckCircle2 className="h-4 w-4" />} label="No sign-up" />
          <FeatureChip icon={<ShieldCheck className="h-4 w-4" />} label="Verified data" />
          <FeatureChip icon={<Sparkles className="h-4 w-4" />} label="Free" />
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_320px]">
        <div>
          <EligibilityCheckerForm />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[148px] lg:self-start">
          <SectionCard
            title="How it works"
            icon={<Sparkles className="h-4 w-4" />}
          >
            <ol className="space-y-3 text-sm text-ink-700">
              <li className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                <span>Answer 6 questions about your profile and preferences.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                <span>We query our verified database for matching universities, courses and scholarships.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                <span>Browse your matches and click <strong>Apply Through ALO Education</strong> for end-to-end application support.</span>
              </li>
            </ol>
          </SectionCard>

          <SectionCard
            title="What we check"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            <ul className="space-y-2 text-xs text-ink-700">
              <li className="flex items-start gap-2">
                <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span><strong className="font-semibold">Budget fit:</strong> Tuition fees within your stated range.</span>
              </li>
              <li className="flex items-start gap-2">
                <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
                <span><strong className="font-semibold">English level:</strong> Courses matching your test status.</span>
              </li>
              <li className="flex items-start gap-2">
                <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden="true" />
                <span><strong className="font-semibold">Work experience:</strong> Programmes that match your years.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
                <span><strong className="font-semibold">Scholarship fit:</strong> Funding aligned with your profile.</span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Privacy"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            <p className="text-xs text-ink-700">
              Your answers are sent to our server only to compute matches —
              no PII (name, email) is required or stored. A referral audit
              record is created with the public context (study level +
              country) for attribution, but no personal data is persisted.
            </p>
            <Link
              href="/legal/privacy"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Read privacy policy
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </SectionCard>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
    </>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white/80 px-3 py-2 shadow-soft backdrop-blur">
      <span className="text-blue-600">{icon}</span>
      <span className="text-xs font-semibold text-ink-900">{label}</span>
    </div>
  );
}
