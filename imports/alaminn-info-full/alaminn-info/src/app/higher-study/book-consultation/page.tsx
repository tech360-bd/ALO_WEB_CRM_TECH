/**
 * /higher-study/book-consultation
 * --------------------------------------------------------------------
 * Free 1:1 Higher Study consultation booking form.
 *
 * Fields: name, email, phone (optional), preferred date, preferred
 * time, topic, country of interest, study level, consent checkbox.
 *
 * On submit: POST /api/v1/higher-study/consultation (creates a
 * MeetingRequest + HigherStudyReferral). Show success state with
 * reference number.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Star,
} from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { PageHero, SectionCard } from "@/components/higher-study/page-hero";
import { ConsultationForm } from "@/components/higher-study/consultation-form";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Book a Free Consultation — Higher Study | Alaminn.info",
  description:
    "Book a free 30-minute 1:1 consultation with our Higher Study advisors. Get personalised advice on university selection, course choice, scholarship strategy, PhD applications, visa or English test preparation. Online via Google Meet.",
  path: "/higher-study/book-consultation",
  keywords: [
    "free consultation",
    "study abroad consultation",
    "higher study advisor",
    "university application help",
    "scholarship strategy",
    "PhD application advice",
    "visa consultation",
    "IELTS preparation advice",
  ],
});

const TOPICS_COVERED = [
  {
    title: "University application",
    desc: "Shortlisting universities, understanding requirements, structuring your application timeline.",
  },
  {
    title: "Course selection",
    desc: "Choosing the right course, specialisation and study level for your career goals.",
  },
  {
    title: "Scholarship strategy",
    desc: "Identifying scholarships you can realistically win and crafting competitive applications.",
  },
  {
    title: "PhD & research",
    desc: "Finding supervisors, drafting research proposals, navigating DTPs and CDTs.",
  },
  {
    title: "Student visa",
    desc: "Visa routes, financial evidence, biometrics, refusal risks and how to mitigate them.",
  },
  {
    title: "English test preparation",
    desc: "Choosing between IELTS, PTE, TOEFL and Duolingo; building a study plan to hit your target score.",
  },
];

export default function BookConsultationPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Book Consultation", url: `${HIGHER_STUDY_BASE_URL}/higher-study/book-consultation` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Book a Consultation" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Free · 30 minutes · Online"
        title="Book a Free Consultation"
        description="Talk 1:1 with a Higher Study advisor about your study-abroad plans. Get personalised advice on universities, courses, scholarships, PhDs, visas or English tests — no obligation, no sales pressure."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FeatureChip icon={<Calendar className="h-4 w-4" />} label="Free 30 min" />
          <FeatureChip icon={<Video className="h-4 w-4" />} label="Google Meet" />
          <FeatureChip icon={<Clock className="h-4 w-4" />} label="Confirmed in 24h" />
          <FeatureChip icon={<ShieldCheck className="h-4 w-4" />} label="Privacy-first" />
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_360px]">
        <div>
          <ConsultationForm />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[148px] lg:self-start">
          <SectionCard
            title="What to expect"
            icon={<Sparkles className="h-4 w-4" />}
          >
            <ol className="space-y-3 text-sm text-ink-700">
              <li className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                <span>Submit the form with your preferred date and time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                <span>We confirm your slot within 24 hours via email + send a Google Meet link.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                <span>Join the call with your questions ready — we&apos;ll give you a written action plan afterwards.</span>
              </li>
            </ol>
          </SectionCard>

          <SectionCard
            title="Topics we cover"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            <ul className="space-y-2">
              {TOPICS_COVERED.map((t) => (
                <li
                  key={t.title}
                  className="rounded-xl border border-ink-100 bg-ink-50/40 p-3"
                >
                  <p className="font-display text-sm font-bold text-ink-900">
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-600">{t.desc}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="What students say"
            icon={<Star className="h-4 w-4" />}
          >
            <blockquote className="rounded-xl border border-ink-100 bg-white p-4">
              <p className="text-sm italic text-ink-700">
                &ldquo;The 30-minute call completely reframed my approach —
                they identified 3 scholarships I&apos;d never heard of and
                helped me prioritise my applications.&rdquo;
              </p>
              <footer className="mt-2 text-xs font-semibold text-ink-600">
                — Recent Higher Study advisee
              </footer>
            </blockquote>
          </SectionCard>

          <SectionCard
            title="Privacy"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            <p className="text-xs text-ink-700">
              Your details are used solely to schedule and conduct this
              consultation. We share your information with the ALO Education
              team for follow-up only with your explicit consent (the checkbox
              in the form). You can request deletion at any time by emailing{" "}
              <a
                href="mailto:privacy@alaminn.info"
                className="font-semibold text-blue-700 underline"
              >
                privacy@alaminn.info
              </a>
              .
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
