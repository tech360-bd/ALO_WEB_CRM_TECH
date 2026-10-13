/**
 * /higher-study/application-guide
 * --------------------------------------------------------------------
 * Application guide hub. Shows:
 *   - 18-step application journey (master prompt §21)
 *   - Required documents checklist
 *   - Timeline visual
 *   - Common mistakes
 *   - Links to study resources
 *
 * SEO: JSON-LD Article + FAQPage.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  FileText,
  CalendarClock,
  AlertCircle,
  ArrowRight,
  CheckSquare,
  Clock,
  Sparkles,
  Send,
} from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import {
  PageHero,
  SectionCard,
  ProseSection,
} from "@/components/higher-study/page-hero";
import type { FaqItem } from "@/lib/higher-study/types";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Application Guide — Higher Study | Alaminn.info",
  description:
    "Complete 18-step application journey for studying abroad: research, shortlist, prepare documents, apply, accept offer, apply for visa, plan pre-departure. Includes required documents checklist, 12-month timeline, common mistakes and links to deeper guides.",
  path: "/higher-study/application-guide",
  keywords: [
    "application guide",
    "study abroad application",
    "university application steps",
    "application timeline",
    "required documents",
    "common application mistakes",
    "SOP",
    "personal statement",
    "academic CV",
    "recommendation letter",
    "student visa application",
  ],
});

const STEPS = [
  {
    n: 1,
    title: "Self-assessment & goal-setting",
    desc: "Define your academic interests, career goals, budget and preferred destinations.",
    duration: "Week 1",
  },
  {
    n: 2,
    title: "Research destinations & universities",
    desc: "Use our destination guides + university directory to shortlist 8–12 institutions.",
    duration: "Weeks 2–3",
  },
  {
    n: 3,
    title: "Choose your study level & course",
    desc: "Filter by study level, subject and specialisation. Narrow to 5–6 courses.",
    duration: "Weeks 3–4",
  },
  {
    n: 4,
    title: "Check eligibility & requirements",
    desc: "Verify academic, English, work-experience and portfolio requirements for each shortlisted course.",
    duration: "Week 4",
  },
  {
    n: 5,
    title: "Plan your budget & funding",
    desc: "Calculate total cost (tuition + living + travel). Identify scholarships you can apply for.",
    duration: "Week 5",
  },
  {
    n: 6,
    title: "Prepare for English tests",
    desc: "Book IELTS / PTE / TOEFL. Aim to complete at least 6 weeks before deadlines.",
    duration: "Weeks 5–10",
  },
  {
    n: 7,
    title: "Draft your SOP / personal statement",
    desc: "Tailor to each course. Get feedback from at least 2 reviewers.",
    duration: "Weeks 6–9",
  },
  {
    n: 8,
    title: "Update your academic CV",
    desc: "Use the academic CV format (not a job CV). 1–2 pages max for master's, 2–3 for PhD.",
    duration: "Week 7",
  },
  {
    n: 9,
    title: "Request recommendation letters",
    desc: "Ask 2 academic referees (and 1 professional for MBA). Give them 4–6 weeks' notice.",
    duration: "Weeks 7–8",
  },
  {
    n: 10,
    title: "Prepare transcripts & certificates",
    desc: "Get official transcripts in English (or certified translations). Scan + keep originals.",
    duration: "Week 8",
  },
  {
    n: 11,
    title: "Prepare portfolio (if required)",
    desc: "For art, design, architecture, film — submit 10–20 pieces reflecting your best work.",
    duration: "Weeks 8–10",
  },
  {
    n: 12,
    title: "PhD: contact supervisors",
    desc: "Send tailored first-contact emails to 3–5 potential supervisors. Include a 1-page research proposal summary.",
    duration: "Weeks 8–12",
  },
  {
    n: 13,
    title: "Submit applications",
    desc: "UCAS for UK undergrad. Direct for postgrad. Allow 2–3 hours per application.",
    duration: "Weeks 10–14",
  },
  {
    n: 14,
    title: "Apply for scholarships",
    desc: "Submit separate scholarship applications — many deadlines are 2–4 months before course start.",
    duration: "Weeks 12–18",
  },
  {
    n: 15,
    title: "Interview preparation",
    desc: "Some courses (MBA, medicine, PhD) require interviews. Practise common questions.",
    duration: "Weeks 14–18",
  },
  {
    n: 16,
    title: "Receive & accept offer",
    desc: "Compare offers, accept your firm + insurance choice, pay the deposit.",
    duration: "Weeks 16–22",
  },
  {
    n: 17,
    title: "Apply for student visa",
    desc: "Gather financial evidence, CAS/I-20, biometrics. Apply 3 months before start.",
    duration: "Weeks 22–26",
  },
  {
    n: 18,
    title: "Plan pre-departure",
    desc: "Book flights, arrange accommodation, get travel/health insurance, attend pre-departure briefing.",
    duration: "Weeks 26–30",
  },
];

const REQUIRED_DOCUMENTS = [
  "Valid passport (6+ months validity beyond course end date)",
  "Academic transcripts (certified English translation if needed)",
  "Degree certificates (or proof of expected graduation)",
  "English test score report (IELTS / PTE / TOEFL / Duolingo)",
  "Statement of Purpose (SOP) — tailored per course",
  "Personal statement (for UCAS undergrad)",
  "Academic CV — 1–2 pages",
  "2 academic recommendation letters (1 professional for MBA)",
  "Portfolio (for art / design / architecture courses)",
  "Research proposal (for PhD / MRes / MPhil)",
  "Proof of funds (bank statements — usually 28 days old max)",
  "Passport-size photographs (visa application)",
  "Visa application form + fee receipt",
  "CAS (UK) / I-20 (USA) / eCoE (Australia) — issued by university",
  "TB test certificate (if applying from a listed country)",
  "Health insurance / overseas student health cover",
  "Scholarship application documents (if applying)",
  "Application fee receipt (if paid by card)",
];

const COMMON_MISTAKES = [
  {
    title: "Applying to only 'top-ranked' universities",
    desc: "Rankings don't measure fit. Apply to a balanced mix: 2 reach, 3 match, 2 safety.",
  },
  {
    title: "Copying SOP from the internet",
    desc: "Admissions officers spot copied SOPs instantly. Write your own story — specific, evidence-based, course-tailored.",
  },
  {
    title: "Asking for recommendation letters too late",
    desc: "Referees need 4–6 weeks. Ask early, share your CV + SOP draft + course list, and politely remind them 1 week before deadline.",
  },
  {
    title: "Ignoring scholarship deadlines",
    desc: "Many scholarships close 4–6 months before course start. Track them from day 1 — don't leave them until you have an offer.",
  },
  {
    title: "Underestimating English test preparation",
    desc: "Most students need 8–12 weeks of focused prep to hit 6.5–7.0 IELTS. Book the test 2 months before you need the score.",
  },
  {
    title: "Weak financial evidence",
    desc: "Bank statements must show funds held for 28+ consecutive days. Move money in early — don't deposit a lump sum days before applying.",
  },
  {
    title: "Not contacting PhD supervisors early",
    desc: "Funded PhDs require a supervisor's nod before you apply. Start emailing supervisors 6–9 months before the start date.",
  },
  {
    title: "Missing visa interview prep",
    desc: "Some countries (UK, USA) require visa interviews. Practise answering 'Why this course? Why this country? What's your post-study plan?'",
  },
];

const TIMELINE_PHASES = [
  {
    phase: "Months 1–3",
    title: "Research & planning",
    color: "blue",
    tasks: ["Self-assessment", "Shortlist universities", "Choose study level", "Plan budget"],
  },
  {
    phase: "Months 3–6",
    title: "Document preparation",
    color: "orange",
    tasks: ["English test", "SOP draft", "Academic CV", "Recommendation letters"],
  },
  {
    phase: "Months 6–8",
    title: "Application submission",
    color: "blue",
    tasks: ["Submit applications", "Apply for scholarships", "PhD: contact supervisors"],
  },
  {
    phase: "Months 8–10",
    title: "Offers & acceptance",
    color: "emerald",
    tasks: ["Receive offers", "Accept firm + insurance", "Pay deposit"],
  },
  {
    phase: "Months 10–12",
    title: "Visa & pre-departure",
    color: "orange",
    tasks: ["Visa application", "Book flights", "Arrange accommodation", "Pre-departure briefing"],
  },
];

const FAQS: FaqItem[] = [
  {
    question: "When should I start preparing my application?",
    answer:
      "For September intake (most common in the UK, USA, Canada), start 12 months ahead — around September of the year before. For January/May intakes (Australia, some UK/US universities), start 8–9 months ahead. PhD applications often need 12–18 months because of supervisor identification.",
  },
  {
    question: "How many universities should I apply to?",
    answer:
      "We recommend 6–8: 2 reach (above your profile), 3–4 match (in line with your profile), 1–2 safety (well within your profile). For UCAS undergrad in the UK, you can apply to a maximum of 5 universities on a single application.",
  },
  {
    question: "Do I need to take an English test if I studied in English?",
    answer:
      "It depends. Some universities waive the English requirement if your previous degree was taught in English (typically in the UK, USA, Ireland, Australia, New Zealand, Canada — but not all). Check each university's English waiver policy. If you're from Bangladesh, India, Pakistan or Nigeria, you usually still need to take an English test.",
  },
  {
    question: "What's the difference between SOP and personal statement?",
    answer:
      "An SOP (Statement of Purpose) is typically longer (500–1000 words) and focuses on academic + research interests + career goals — used for postgraduate applications. A personal statement (UCAS undergrad in the UK) is shorter (4000 characters max) and broader — about why you want to study the subject, what makes you suitable, and your wider interests.",
  },
  {
    question: "Can I apply for scholarships before I have an offer?",
    answer:
      "Yes — and you should! Many scholarships (Chevening, Commonwealth, Erasmus Mundus, DAAD) have deadlines BEFORE course application deadlines, or run in parallel. Apply for scholarships as soon as applications open — usually 10–12 months before course start.",
  },
  {
    question: "How much bank balance do I need to show for a student visa?",
    answer:
      "It varies by country. UK: tuition for first year + £1,334/month (London) or £1,023/month (outside London) for 9 months. USA: cost shown on I-20. Australia: AUD 24,505/year + travel + tuition. Canada: CAD 10,000/year (Quebec: CAD 11,411) + tuition. Funds must usually be held for 28+ consecutive days before applying.",
  },
  {
    question: "What happens if my visa is refused?",
    answer:
      "You can usually re-apply, but you'll lose time and may need to defer your course start date. Common refusal reasons: insufficient financial evidence, weak English score, inconsistent SOP, or failing the credibility interview. Use our consultation service to review your visa application before submitting — it's free.",
  },
  {
    question: "Should I apply through an agent or directly?",
    answer:
      "Both routes work. Direct applications give you full control. Applying through a verified partner like ALO Education (via our consent-tracked referral) gives you document review, deadline tracking and often application fee waivers — without surrendering control of your data. Always check an agent's credentials and never pay for 'guaranteed admission'.",
  },
];

export default function ApplicationGuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Higher Study Application Guide — 18-Step Journey",
    description:
      "Complete 18-step application journey for studying abroad, with required documents checklist, 12-month timeline and common mistakes to avoid.",
    datePublished: "2025-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Alaminn.info Higher Study",
      url: HIGHER_STUDY_BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Alaminn.info",
      url: HIGHER_STUDY_BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${HIGHER_STUDY_BASE_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/application-guide`,
    },
  };
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Application Guide", url: `${HIGHER_STUDY_BASE_URL}/higher-study/application-guide` },
  ]);
  const faqLd = buildFaqJsonLd(FAQS);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Application Guide" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="18-step journey"
        title="Application Guide"
        description="A complete walk-through of the study-abroad application journey — from self-assessment to pre-departure. Includes required documents checklist, 12-month timeline, common mistakes and FAQs."
      />

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        {/* Timeline visual */}
        <SectionCard
          title="12-month timeline at a glance"
          icon={<CalendarClock className="h-4 w-4" />}
          description="A typical 12-month journey for September intake. Adjust dates for January/May intakes."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TIMELINE_PHASES.map((p) => (
              <div
                key={p.phase}
                className={`rounded-xl border-2 p-3 ${
                  p.color === "blue"
                    ? "border-blue-200 bg-blue-50/60"
                    : p.color === "orange"
                      ? "border-orange-200 bg-orange-50/60"
                      : "border-emerald-200 bg-emerald-50/60"
                }`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wider ${
                  p.color === "blue" ? "text-blue-700" : p.color === "orange" ? "text-orange-700" : "text-emerald-700"
                }`}>
                  {p.phase}
                </p>
                <p className="mt-1 font-display text-sm font-extrabold text-ink-900">
                  {p.title}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-ink-700">
                  {p.tasks.map((t) => (
                    <li key={t} className="flex items-start gap-1.5">
                      <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 18-step journey */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            The 18-step application journey
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Detailed walk-through of every step — from self-assessment to pre-departure.
          </p>
          <ol className="mt-5 space-y-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft sm:flex-row sm:items-start sm:p-5"
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-display text-base font-extrabold text-white shadow-blue">
                    {step.n}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 ring-1 ring-orange-200 sm:mt-1">
                    <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                    {step.duration}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-extrabold text-ink-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Required documents checklist */}
        <section className="mt-8">
          <SectionCard
            title="Required documents checklist"
            icon={<FileText className="h-4 w-4" />}
            description="Tick these off as you prepare each document. Don't leave any to the last minute."
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {REQUIRED_DOCUMENTS.map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-xl border border-ink-100 bg-ink-50/40 p-3"
                >
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="text-sm text-ink-800">{doc}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        {/* Common mistakes */}
        <section className="mt-8">
          <SectionCard
            title="Common mistakes to avoid"
            icon={<AlertCircle className="h-4 w-4" />}
            description="These are the most-frequent reasons applications are rejected or delayed."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {COMMON_MISTAKES.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-red-100 bg-red-50/40 p-4"
                >
                  <p className="font-display text-sm font-extrabold text-ink-900">
                    {m.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-700">{m.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        {/* FAQ */}
        <section className="mt-8">
          <SectionCard
            title="Frequently asked questions"
            icon={<Compass className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-xl border border-ink-100 bg-ink-50/40 p-4 [&_summary]:cursor-pointer [&_summary]:list-none"
                >
                  <summary className="flex items-center justify-between gap-2 font-semibold text-ink-900">
                    {faq.question}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </SectionCard>
        </section>

        {/* Related resources */}
        <section className="mt-8">
          <SectionCard
            title="Related study resources"
            icon={<Sparkles className="h-4 w-4" />}
            description="Deep-dive guides on each document type and stage of the journey."
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "SOP Writing Guide", href: "/higher-study/study-resources?category=sop" },
                { label: "Personal Statement Guide", href: "/higher-study/study-resources?category=personal-statement" },
                { label: "Academic CV Checklist", href: "/higher-study/study-resources?category=cv" },
                { label: "Recommendation Letters", href: "/higher-study/study-resources?category=recommendation-letter" },
                { label: "Portfolio Preparation", href: "/higher-study/study-resources?category=portfolio" },
                { label: "Visa Application Guide", href: "/higher-study/study-resources?category=visa" },
                { label: "Financial Planning", href: "/higher-study/study-resources?category=financial" },
                { label: "Pre-Departure Checklist", href: "/higher-study/study-resources?category=pre-departure" },
                { label: "Interview Preparation", href: "/higher-study/study-resources?category=interview" },
              ].map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white p-3 text-sm font-semibold text-ink-900 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <span>{r.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-400 group-hover:text-blue-600" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </SectionCard>
        </section>

        {/* CTA */}
        <section className="mt-8 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-blue-50 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink-900">
                Ready to start your application?
              </h2>
              <p className="mt-1 text-sm text-ink-700">
                Apply through ALO Education for end-to-end application support,
                or book a free 1:1 consultation to map out your journey.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/higher-study/apply"
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-orange hover:bg-orange-700"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Apply via ALO Education
              </Link>
              <Link
                href="/higher-study/book-consultation"
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 hover:border-blue-200 hover:bg-blue-50"
              >
                Book consultation
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([articleLd, breadcrumbLd, faqLd]) }}
      />
    </>
  );
}

// silence unused import
void ProseSection;
