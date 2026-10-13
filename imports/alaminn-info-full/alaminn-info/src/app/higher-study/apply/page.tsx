/**
 * /higher-study/apply
 * --------------------------------------------------------------------
 * Apply Now landing page (referenced by the Higher Study nav and home
 * page CTA). Explains the ALO Education referral flow + the consent
 * process, with a primary Apply CTA and English Learning link.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Send,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Languages,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { PageHero, SectionCard } from "@/components/higher-study/page-hero";
import { ApplyCta } from "@/components/higher-study/apply-cta";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Apply Through ALO Education — Higher Study | Alaminn.info",
  description:
    "Start your verified application via ALO Education with a consent-tracked referral. No PII in URLs, 24-hour signed referral token, audited end-to-end handoff, and free application support from our partner team.",
  path: "/higher-study/apply",
  keywords: [
    "apply to university",
    "ALO Education",
    "study abroad application",
    "consent-tracked referral",
    "university application support",
    "scholarship application help",
  ],
});

const STEPS = [
  {
    n: 1,
    title: "Click Apply on any card",
    desc: "Every university, course, scholarship and PhD card has an orange 'Apply' button.",
    icon: Send,
  },
  {
    n: 2,
    title: "Read the consent dialog",
    desc: "We explain exactly what context is shared (no PII) and what ALO Education will do with it.",
    icon: ShieldCheck,
  },
  {
    n: 3,
    title: "Tick the consent box",
    desc: "Your explicit opt-in is required. We record the consent timestamp + version for audit.",
    icon: CheckCircle2,
  },
  {
    n: 4,
    title: "Referral created (24h token)",
    desc: "We create an audit record + sign a 24-hour referral token. You're redirected to ALO Education.",
    icon: Clock,
  },
  {
    n: 5,
    title: "ALO Education takes over",
    desc: "The ALO Education team contacts you to start your application. You can revoke consent anytime.",
    icon: Sparkles,
  },
];

const TRUST_POINTS = [
  {
    title: "No PII in URLs",
    desc: "Your name, email, phone, address — none of it goes in the URL. Only public context (country, university, course slugs).",
    icon: ShieldCheck,
  },
  {
    title: "24-hour signed token",
    desc: "Referral tokens are HMAC-SHA256 signed and expire after 24 hours. After that, a fresh consent is required.",
    icon: Clock,
  },
  {
    title: "Audited end-to-end",
    desc: "Every referral transitions through created → transferred → completed/failed states, all logged for audit.",
    icon: FileText,
  },
  {
    title: "You're in control",
    desc: "Consent is reversible — email privacy@alaminn.info and we'll kill any active referral immediately.",
    icon: CheckCircle2,
  },
];

export default function ApplyPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Apply", url: `${HIGHER_STUDY_BASE_URL}/higher-study/apply` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Apply" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Consent-tracked referral"
        title="Apply Through ALO Education"
        description="Start your verified application via ALO Education — our partner team handles your application end-to-end, with explicit consent tracking, no PII in URLs, and a 24-hour signed referral token."
      >
        <div className="flex flex-wrap gap-2">
          <ApplyCta
            referralType="university-application"
            label="Apply through ALO Education"
            className="bg-orange-600 text-white shadow-orange hover:bg-orange-700"
          />
          <Link
            href="/higher-study/book-consultation"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 hover:border-blue-200 hover:bg-blue-50"
          >
            Book a free call first
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        {/* How it works */}
        <section>
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            How the referral flow works
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Five simple steps — from clicking Apply to ALO Education contacting you.
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.n}
                  className="relative rounded-2xl border border-ink-200 bg-white p-4 shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-display text-sm font-extrabold text-white shadow-blue">
                      {step.n}
                    </span>
                    <Icon className="h-4 w-4 text-orange-600" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2 font-display text-sm font-extrabold text-ink-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-600">{step.desc}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Trust points */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            Why our referral is safe
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Four guarantees baked into every Apply click.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft"
                >
                  <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  <h3 className="mt-2 font-display text-sm font-extrabold text-ink-900">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-600">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Browse by entity */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            Apply for…
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Jump to the relevant directory and click Apply on any card.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/higher-study/global-universities"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">Universities</p>
                <p className="text-xs text-ink-500">Apply to UK, USA, Canada, Australia…</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </Link>
            <Link
              href="/higher-study/course-finder"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">Courses</p>
                <p className="text-xs text-ink-500">Apply for specific programmes.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </Link>
            <Link
              href="/higher-study/scholarships"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">Scholarships</p>
                <p className="text-xs text-ink-500">Get help with funding applications.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </Link>
            <Link
              href="/higher-study/phd-research"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">PhD &amp; research</p>
                <p className="text-xs text-ink-500">Apply for funded PhD projects.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </Link>
            <Link
              href="/higher-study/eligibility-check"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">Eligibility check</p>
                <p className="text-xs text-ink-500">Not sure where to start? Try this first.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </Link>
            <a
              href="https://english.aloeducation.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">English prep</p>
                <p className="text-xs text-ink-500">Improve IELTS / PTE / TOEFL score.</p>
              </div>
              <Languages className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* FAQ */}
        <SectionCard
          className="mt-10 border-blue-200 bg-gradient-to-br from-blue-50/60 to-orange-50/60"
          title="Common questions"
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-display text-sm font-bold text-ink-900">
                Is applying through ALO Education free?
              </dt>
              <dd className="mt-1 text-ink-700">
                Yes — the consultation and application support from ALO Education
                is free for students. Universities pay ALO Education a commission
                on enrolment, which is why the service is free to you.
              </dd>
            </div>
            <div>
              <dt className="font-display text-sm font-bold text-ink-900">
                Will I lose control of my application?
              </dt>
              <dd className="mt-1 text-ink-700">
                No. You retain full visibility — ALO Education involves you at
                every step. You can withdraw consent at any time by emailing{" "}
                <a href="mailto:privacy@alaminn.info" className="font-semibold text-blue-700 underline">
                  privacy@alaminn.info
                </a>
                .
              </dd>
            </div>
            <div>
              <dt className="font-display text-sm font-bold text-ink-900">
                What if I want to apply to a university not listed here?
              </dt>
              <dd className="mt-1 text-ink-700">
                Use the general Apply CTA below — ALO Education handles
                applications to any accredited university worldwide.
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <ApplyCta
              referralType="university-application"
              label="Apply through ALO Education"
              className="bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <Link
              href="/higher-study/book-consultation"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 hover:border-blue-200 hover:bg-blue-50"
            >
              Book a free consultation
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </SectionCard>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
    </>
  );
}
