"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { type ViewKey } from "@/lib/alo-types";

interface PublicFaqProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface FaqItem {
  question: string;
  answer: string;
  sortOrder: number;
  category?: string;
}

interface HomepageData {
  faqs: FaqItem[];
}

interface FallbackFaq {
  question: string;
  answer: string;
  category: string;
}

const CATEGORIES = ["All", "Admissions", "Visa", "Courses", "English Tests", "Payments", "Documents", "Accommodation", "Scholarships", "Pre-Departure"];

const FALLBACK_FAQS: FallbackFaq[] = [
  // Admissions
  { category: "Admissions", question: "When should I start applying for universities abroad?", answer: "We recommend starting 12-18 months before your intended intake. For September intake, start in January-February of the same year. This gives you time to research universities, take English tests, prepare documents, and apply before deadlines (typically January-March for September intake)." },
  { category: "Admissions", question: "What is the difference between conditional and unconditional offer?", answer: "A conditional offer means you've been accepted but must meet certain conditions (e.g., final exam results, English test score). An unconditional offer means you've met all requirements and have a confirmed place. Your CAS (Confirmation of Acceptance for Studies) is issued after you accept an unconditional offer and pay your deposit." },
  { category: "Admissions", question: "Can I apply to multiple universities at the same time?", answer: "Yes — and you should. We recommend applying to 6-10 universities across three tiers: reach (aspirational), match (likely), and safety (high probability). ALO's University Shortlisting service helps you build this balanced list for free." },
  { category: "Admissions", question: "Do I need an interview for university admission?", answer: "Some universities conduct admissions interviews (especially for medicine, law, MBA, and competitive programs). Most don't. If you do have an interview, ALO provides free mock interview practice with our AI simulator and counselors." },
  { category: "Admissions", question: "What is a CAS and when do I receive it?", answer: "A Confirmation of Acceptance for Studies (CAS) is a unique reference number issued by your UK university after you accept your offer and pay your deposit. You'll need it for your Student Visa application. Non-UK universities have equivalent documents (e.g., COE for Australia, LOA for Canada)." },

  // Visa
  { category: "Visa", question: "How long does a UK Student Visa take to process?", answer: "Standard processing time is 3 weeks (15 working days) from your biometrics appointment. Priority service (5-day) costs £500 extra; super-priority (24-hour) costs £1,000 extra. We recommend applying at least 6 weeks before your course start date." },
  { category: "Visa", question: "What financial documents do I need for a UK Student Visa?", answer: "You need to show funds for your first year's tuition + living costs (£1,334/month for London, £1,023/month outside London) for 9 months, held in your or your sponsor's bank account for 28 consecutive days. The bank statement must be original, dated within 31 days of your application." },
  { category: "Visa", question: "What is a credibility interview?", answer: "The credibility interview is a short video interview conducted by UKVI to verify you're a genuine student. You'll be asked about your course choice, university choice, career plans, and how you'll fund your studies. ALO provides free mock credibility interviews to all our students." },
  { category: "Visa", question: "Can I work while studying abroad?", answer: "Most countries allow part-time work on a student visa: UK (20 hours/week during term, full-time during holidays), Australia (48 hours/fortnight), Canada (24 hours/week), USA (on-campus only, 20 hours/week). Rules change — always check current regulations." },
  { category: "Visa", question: "What happens if my visa is refused?", answer: "If refused, you'll receive a refusal letter explaining the reasons. You can appeal in some cases, re-apply with stronger evidence, or apply to a different country. ALO reviews refusal letters and advises on next steps free of charge." },

  // Courses
  { category: "Courses", question: "What's the difference between Bachelor, Masters, and PhD?", answer: "Bachelor's is typically 3-4 years (undergraduate). Masters is 1-2 years (postgraduate). PhD is 3-4 years (research-only, no classes). Foundation is a 1-year pre-undergraduate program for students who don't meet direct entry requirements." },
  { category: "Courses", question: "What is a Foundation year and who needs it?", answer: "A Foundation year is a 1-year preparatory program before a Bachelor's degree. Bangladeshi HSC graduates who don't meet direct entry requirements (often due to lower grades or subject mismatch) typically take Foundation. It's also useful for students switching subject streams." },
  { category: "Courses", question: "What is a Pre-Masters?", answer: "A Pre-Masters is a 3-9 month preparatory program for students who don't qualify for direct Masters entry (e.g., 2-year Bachelor's instead of 4-year, or lower GPA). It prepares you academically and in English for a Masters degree." },
  { category: "Courses", question: "Can I study in the UK without IELTS?", answer: "Some universities accept Medium of Instruction (MOI) letters from your previous institution if your degree was taught in English. However, UKVI usually still requires IELTS UKVI for the visa. We recommend taking IELTS to keep all options open." },
  { category: "Courses", question: "What is sandwich year and placement year?", answer: "A sandwich year (also called placement year) is a year of work experience between your 2nd and 3rd year of a Bachelor's degree. It extends your course from 3 to 4 years but gives you valuable industry experience and often leads to a job offer." },

  // English Tests
  { category: "English Tests", question: "Which English test should I take?", answer: "IELTS is the most widely accepted. PTE Academic is popular if you're nervous speaking to a human examiner. Duolingo is cheapest ($59) and fastest but less widely accepted. Always check your target university's accepted tests first." },
  { category: "English Tests", question: "What IELTS score do I need for UK universities?", answer: "Most Bachelor's courses require IELTS 6.0 overall (no band below 5.5). Most Masters courses require IELTS 6.5 overall (no band below 6.0). Law, medicine, and education often require 7.0+. Check your specific course requirements." },
  { category: "English Tests", question: "Does ALO provide free IELTS mock tests?", answer: "Yes! ALO registered students get 3 free full AI-scored mock tests. Guests get 1 free mock. Each mock includes Listening, Reading, Writing, and Speaking with a detailed PDF report. Visit our Exams page to start." },
  { category: "English Tests", question: "Can I take IELTS UKVI instead of regular IELTS?", answer: "Yes — IELTS UKVI is accepted by UKVI for visa applications and by UK universities. It's slightly more expensive. We recommend IELTS UKVI if you're planning to study in the UK, as it covers both university admission and visa requirements." },
  { category: "English Tests", question: "What is Duolingo English Test and is it accepted?", answer: "Duolingo English Test (DET) is a 1-hour online English test costing $59. Results are available in 48 hours. Over 4,000 universities accept it, but visa officers may still require IELTS. Check your university's accepted tests before booking." },

  // Payments
  { category: "Payments", question: "Are ALO services really free for students?", answer: "Yes — 100% free. We're funded by partner university commissions. We never push you toward a university because of commission. If a university isn't right for you, we tell you. Application fees to universities are reimbursed by you (the student) — we don't charge any service fees." },
  { category: "Payments", question: "What costs should I budget for as a Bangladeshi student?", answer: "Annual tuition: £10,000-£30,000 (UK), $20,000-$50,000 (USA), AUD $20,000-$45,000 (Australia). Living costs: £1,000-£1,500/month, $1,000-$2,000/month. Visa fee, flight, initial setup: ~£1,500. Health surcharge (UK): £776/year. Total first-year cost: £15,000-£40,000 depending on country." },
  { category: "Payments", question: "Can I pay tuition in installments?", answer: "Most universities offer installment plans (typically 2-3 payments per year). Some require full upfront payment for the first semester. Many accept card payments, bank transfers, or international payment services like Flywire or Western Union." },
  { category: "Payments", question: "Can I get an education loan to study abroad?", answer: "Yes — Bangladeshi banks offer education loans up to BDT 40-50 lakh for studying abroad. You'll need a guarantor (usually parents), collateral (property or fixed deposit), and proof of admission. Processing takes 2-4 weeks. ALO can recommend banks with student-friendly terms." },

  // Documents
  { category: "Documents", question: "What documents do I need to apply to universities?", answer: "Standard documents: passport, academic transcripts (SSC, HSC, Bachelor's if any), English test score, Statement of Purpose, CV/resume, 2 reference letters, passport-size photo. Some courses require portfolios (art/design), GMAT/GRE (MBA/PhD), or work experience certificates." },
  { category: "Documents", question: "Do my documents need to be translated?", answer: "If your original documents are not in English, you need certified English translations. The translator must stamp and sign each page. ALO can recommend certified translators in Dhaka for academic transcripts, certificates, and bank statements." },
  { category: "Documents", question: "How long are English test scores valid?", answer: "IELTS, PTE, TOEFL, and Duolingo scores are valid for 2 years from the test date. Make sure your score will be valid when you apply for your visa (not just when you apply to the university — there can be a 6-9 month gap)." },
  { category: "Documents", question: "Should I notarize my documents?", answer: "Most universities accept scanned copies of your original documents. Notarization is usually only required for visa applications or specific university requests. Don't notarize everything upfront — wait to see what's actually required." },

  // Accommodation
  { category: "Accommodation", question: "When should I book accommodation?", answer: "Book as soon as you accept your university offer — especially for September intake, when accommodation fills up fast. Most universities guarantee on-campus housing for international students if you apply by a deadline (typically June-July for September intake)." },
  { category: "Accommodation", question: "On-campus vs off-campus — which is better?", answer: "On-campus is more expensive but convenient, social, and safe. Off-campus gives more independence and is often cheaper. We recommend on-campus for your first year to settle in, then off-campus once you know the city." },
  { category: "Accommodation", question: "How much does accommodation cost per month?", answer: "UK: £400-£800 (shared) to £800-£1,500 (private). USA: $500-$1,500. Australia: AUD $400-$1,000. Canada: CAD $500-$1,500. Ireland: €500-€1,200. Cost varies hugely by city — London, Sydney, and New York are most expensive." },
  { category: "Accommodation", question: "How can I avoid accommodation scams?", answer: "Never wire money before viewing the property (in person or via video call). Always verify the landlord owns the property. Use university-approved accommodation platforms. If a deal seems too good to be true, it usually is. ALO verifies private listings for our students free of charge." },

  // Scholarships
  { category: "Scholarships", question: "Can Bangladeshi students get fully-funded scholarships?", answer: "Yes — Chevening (UK), Commonwealth (UK), Australia Awards (Australia), DAAD (Germany), Fulbright (USA), and New Zealand Scholarships all fully-fund Bangladeshi students. Competition is fierce — apply 12 months in advance. ALO provides free scholarship guidance and SOP support." },
  { category: "Scholarships", question: "Do universities offer scholarships for international students?", answer: "Yes — most universities offer merit scholarships of £2,000-£10,000/year for international students. Some have country-specific scholarships for Bangladesh. Check each university's scholarship page and deadlines (often earlier than admission deadlines)." },
  { category: "Scholarships", question: "What makes a strong scholarship application?", answer: "Strong scholarship applications show: (1) academic excellence (top 10% of your class), (2) leadership experience (volunteering, projects, initiatives), (3) clear career plan linked to the scholarship's mission, (4) why you specifically deserve this scholarship. ALO provides free SOP coaching for scholarship applicants." },

  // Pre-Departure
  { category: "Pre-Departure", question: "What should I pack for studying abroad?", answer: "Essentials: passport, visa, CAS, offer letter, academic transcripts (originals), bank cards, prescribed medicines (with prescription), adapter (UK uses Type G), £200-£300 cash for arrival. Don't overpack — most things are available abroad. Cultural items (food, prayer mat) can be brought if important to you." },
  { category: "Pre-Departure", question: "Do I need a TB test for UK visa?", answer: "Yes — Bangladeshi applicants for UK visas lasting more than 6 months must take a TB test at an approved clinic in Dhaka. The certificate is valid for 6 months. Book your appointment early — wait times can be 2-3 weeks." },
  { category: "Pre-Departure", question: "How do I open a bank account abroad?", answer: "Most banks require: passport, visa/BRP, university enrollment letter, proof of address. Some banks have partnerships with universities for faster account opening. Bring a bank statement from your Bangladeshi bank showing 6 months of history (helps for credit cards later)." },
  { category: "Pre-Departure", question: "What happens if I get homesick?", answer: "Homesickness is normal — almost every international student experiences it. Stay connected with family back home, join Bangladeshi student associations at your university, explore your new city, and don't hesitate to use your university's mental health support. ALO counselors are also available for support via the Student Portal." },
];

export function PublicFaq({ onNavigate }: PublicFaqProps) {
  const [dbFaqs, setDbFaqs] = React.useState<FaqItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [category, setCategory] = React.useState<string>("All");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data: HomepageData = await res.json();
        if (cancelled) return;
        setDbFaqs(data.faqs || []);
      } catch {
        // Fallback to local FAQs
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Build the unified FAQ list — use DB FAQs if available, otherwise fallback
  const allFaqs: FallbackFaq[] = React.useMemo(() => {
    if (dbFaqs.length > 0) {
      return dbFaqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        category: f.category || "General",
      }));
    }
    return FALLBACK_FAQS;
  }, [dbFaqs]);

  const filtered = allFaqs.filter((f) => {
    const matchCategory = category === "All" || f.category === category;
    const matchSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Categories present in the FAQ list
  const availableCategories = ["All", ...Array.from(new Set(allFaqs.map((f) => f.category))).sort()];

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#2563EB]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "FAQ" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#F97316] border border-[#F97316]/20 hover:bg-[#FFF3EA]">
              <Icon name="HelpCircle" className="mr-1 size-3" />
              Quick Answers
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Frequently Asked <span className="text-[#2563EB]">Questions</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Real answers to the questions Bangladeshi students ask us most. Can't find your question?{" "}
              <button onClick={() => onNavigate("public-contact")} className="font-semibold text-[#2563EB] hover:underline">
                Ask us directly
              </button>
              .
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6 lg:py-14">
        {/* Search */}
        <div className="relative mb-6">
          <Icon name="Search" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#5A7299]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions... (e.g. 'visa', 'scholarship', 'IELTS')"
            className="h-12 w-full rounded-xl border-2 border-[#2563EB]/15 bg-white pl-11 pr-4 text-sm text-[#0B2447] placeholder:text-[#5A7299] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
          />
        </div>

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {availableCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                category === c
                  ? "bg-[#2563EB] text-white"
                  : "border border-[#2563EB]/20 bg-white text-[#2563EB] hover:bg-[#EAF3FF]"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-[#5A7299]">
          {filtered.length} {filtered.length === 1 ? "question" : "questions"}
          {category !== "All" && ` in ${category}`}
          {search && ` matching "${search}"`}
        </p>

        {/* FAQ Accordion */}
        {loading ? (
          <LoadingGrid count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Search"
            title="No matching questions"
            description="Try a different search term or browse all categories."
            action={
              <Button onClick={() => { setSearch(""); setCategory("All"); }} className="bg-[#2563EB] text-white hover:bg-[#2563EB]/90">
                Reset filters
              </Button>
            }
          />
        ) : (
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white alo-shadow">
            <CardContent className="p-2">
              <Accordion type="single" collapsible className="w-full">
                {filtered.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-[#E2E8F0] last:border-0">
                    <AccordionTrigger className="px-4 py-4 text-left text-sm font-semibold text-[#0B2447] hover:bg-[#EAF3FF]/40 hover:no-underline">
                      <div className="flex items-start gap-3">
                        {faq.category && (
                          <Badge variant="outline" className="mt-0.5 shrink-0 bg-[#EAF3FF] text-[#2563EB]">
                            {faq.category}
                          </Badge>
                        )}
                        <span className="flex-1">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1 text-sm leading-relaxed text-[#5A7299]">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Still have questions CTA */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <SectionCard title="Still have questions?" description="Our counselors are happy to help" icon="Headset">
            <Button onClick={() => onNavigate("public-contact")} className="mt-2 h-11 bg-[#2563EB] text-white hover:bg-[#2563EB]/90">
              <Icon name="Phone" className="size-4" />
              Contact Us
            </Button>
          </SectionCard>
          <SectionCard title="Want a free consultation?" description="1-on-1 expert guidance" icon="CalendarCheck">
            <Button onClick={() => onNavigate("public-contact")} className="mt-2 h-11 bg-[#F97316] text-white hover:bg-[#c8451a]">
              <Icon name="CalendarCheck" className="size-4" />
              Book Free Session
            </Button>
          </SectionCard>
        </div>

        {/* Lead form */}
        <div className="mt-12">
          <PublicLeadForm
            sourceTag="FAQ page — bottom CTA"
            title="Submit your details and we'll answer within 24 hours"
            subtitle="Have a specific question not covered in our FAQ? Send us your details and we'll respond personally."
          />
        </div>
      </div>
    </div>
  );
}
export default PublicFaq;
