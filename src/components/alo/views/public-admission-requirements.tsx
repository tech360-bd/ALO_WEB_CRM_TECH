"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
} from "@/components/alo/shared";
import { Breadcrumb, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { type ViewKey } from "@/lib/alo-types";

interface PublicAdmissionRequirementsProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const LEVELS = [
  {
    level: "Foundation",
    icon: "Building",
    accent: "blue" as const,
    description: "1-year pre-undergraduate program for students who don't meet direct Bachelor's entry.",
    requirements: [
      "HSC or equivalent with minimum GPA 3.5",
      "IELTS UKVI 5.5 overall (no band below 5.5)",
      "Age 17+ at start of course",
      "Personal statement",
    ],
    typicalCourses: ["International Foundation Year", "University Foundation Programme", "Pre-University Year"],
  },
  {
    level: "Bachelor",
    icon: "GraduationCap",
    accent: "orange" as const,
    description: "3-4 year undergraduate degree leading to a Bachelor's qualification.",
    requirements: [
      "HSC with minimum GPA 4.0 (or equivalent A-Level: BCC+)",
      "IELTS 6.0 overall (no band below 5.5)",
      "Personal statement / SOP",
      "1-2 reference letters",
      "Some courses: portfolio, interview, or work experience",
    ],
    typicalCourses: ["BSc Computer Science", "BA Business Management", "BEng Mechanical Engineering"],
  },
  {
    level: "Top-up",
    icon: "ArrowUpCircle",
    accent: "blue" as const,
    description: "1-year program that builds on a 2-year Bachelor's or HND to achieve a full Bachelor's degree.",
    requirements: [
      "2-year Bachelor's degree or HND with merit/distinction",
      "IELTS 6.0 overall (no band below 5.5)",
      "Transcript showing modules relevant to top-up",
      "Personal statement",
    ],
    typicalCourses: ["BSc Business Top-up", "BA Computing Top-up"],
  },
  {
    level: "Pre-Masters",
    icon: "BookMarked",
    accent: "orange" as const,
    description: "3-9 month preparatory program for students who don't qualify for direct Masters entry.",
    requirements: [
      "3-year Bachelor's degree with lower GPA, or unrelated subject",
      "IELTS 5.5-6.0 (depending on target Masters)",
      "Personal statement",
      "CV / work experience preferred",
    ],
    typicalCourses: ["Pre-Masters Business", "Pre-Masters Engineering"],
  },
  {
    level: "Masters",
    icon: "Award",
    accent: "blue" as const,
    description: "1-2 year postgraduate degree — Taught, Research, or Professional.",
    requirements: [
      "Bachelor's degree (3 or 4 year, depending on country) with minimum 2:2 or equivalent (GPA 2.7+)",
      "IELTS 6.5 overall (no band below 6.0)",
      "SOP / personal statement",
      "2 reference letters (academic + professional)",
      "CV / resume",
      "Some courses: GMAT/GRE, interview, work experience",
    ],
    typicalCourses: ["MSc Computer Science", "MA Marketing", "MEng Civil Engineering"],
  },
  {
    level: "MBA",
    icon: "Briefcase",
    accent: "orange" as const,
    description: "1-2 year Master of Business Administration — typically requires work experience.",
    requirements: [
      "Bachelor's degree (any discipline) with minimum 2:1 or equivalent (GPA 3.0+)",
      "3-5 years full-time work experience (preferred)",
      "GMAT score (550-700+ depending on school)",
      "IELTS 6.5-7.0 overall",
      "Strong SOP showing leadership and career progression",
      "2 professional reference letters",
      "Interview typically required",
    ],
    typicalCourses: ["Full-time MBA", "Executive MBA", "Global MBA"],
  },
  {
    level: "PhD",
    icon: "Microscope",
    accent: "blue" as const,
    description: "3-4 year research-only doctoral degree. No classes; produce original research thesis.",
    requirements: [
      "Masters degree with merit/distinction (or strong Bachelors for direct-entry PhD)",
      "Research proposal (3,000-5,000 words)",
      "Identified supervisor (or apply to advertised studentship)",
      "IELTS 6.5-7.0 overall",
      "Strong academic references (2)",
      "CV showing research output (publications, conferences)",
    ],
    typicalCourses: ["PhD Computer Science", "PhD Biomedical Sciences", "PhD Economics"],
  },
];

const COUNTRY_REQUIREMENTS = [
  { slug: "uk", name: "UK", flag: "🇬🇧", minIELTS: "6.0", minGPA: "3.0 / 2:2", notes: "Direct entry from HSC rare; Foundation common. MOI accepted by some unis." },
  { slug: "usa", name: "USA", flag: "🇺🇸", minIELTS: "6.5", minGPA: "3.0", notes: "SAT/ACT required by many top schools. 4-year Bachelor's standard." },
  { slug: "canada", name: "Canada", flag: "🇨🇦", minIELTS: "6.5", minGPA: "3.0 / 70%", notes: "Study Permit requires LOA from DLI. SDS program discontinued." },
  { slug: "australia", name: "Australia", flag: "🇦🇺", minIELTS: "6.5", minGPA: "3.0 / 65%", notes: "GTE statement required. Some courses require specific prior subjects." },
  { slug: "ireland", name: "Ireland", flag: "🇮🇪", minIELTS: "6.5", minGPA: "2:2", notes: "MOI accepted by many universities. Level 8 (Bachelor) requires HSC + 1 year uni." },
  { slug: "new-zealand", name: "New Zealand", flag: "🇳🇿", minIELTS: "6.0", minGPA: "3.0 / B average", notes: "NZQA-approved institutions only. Pathway visas available." },
  { slug: "germany", name: "Germany", flag: "🇩🇪", minIELTS: "6.0", minGPA: "2.5 (German scale)", notes: "APS certificate required for Bangladeshi applicants. Many programs in English." },
  { slug: "dubai", name: "Dubai / UAE", flag: "🇦🇪", minIELTS: "5.5", minGPA: "2.5", notes: "Campuses of UK/Australian/US universities. Visa sponsored by university." },
];

const ENGLISH_TEST_TABLE = [
  { test: "IELTS Academic", commonScore: "6.5", ukVisa: "IELTS UKVI 6.5", usa: "Yes", canada: "Yes", australia: "Yes" },
  { test: "IELTS UKVI", commonScore: "6.5", ukVisa: "Yes (mandatory)", usa: "Yes", canada: "Yes", australia: "Yes" },
  { test: "PTE Academic", commonScore: "58", ukVisa: "PTE UKVI required", usa: "Yes", canada: "Yes", australia: "Yes" },
  { test: "TOEFL iBT", commonScore: "90", ukVisa: "TOEFL iBT Home Edition not accepted", usa: "Yes", canada: "Yes", australia: "Yes" },
  { test: "Duolingo English Test", commonScore: "115", ukVisa: "Not accepted for visa", usa: "Yes (4,000+ unis)", canada: "Yes (some)", australia: "Yes (some)" },
  { test: "GRE", commonScore: "320+", ukVisa: "N/A", usa: "Yes (Masters/PhD)", canada: "Some programs", australia: "Some programs" },
  { test: "GMAT", commonScore: "650+", ukVisa: "N/A", usa: "Yes (MBA)", canada: "Yes (MBA)", australia: "Yes (MBA)" },
  { test: "SAT", commonScore: "1300+", ukVisa: "N/A", usa: "Yes (Bachelor's)", canada: "Some", australia: "Some" },
];

const REQUIRED_DOCUMENTS = [
  { category: "Academic", items: ["SSC certificate + transcript", "HSC certificate + transcript", "Bachelor's transcript + certificate (if applying for Masters+)", "Masters transcript (if applying for PhD)"] },
  { category: "English", items: ["IELTS / PTE / TOEFL / Duolingo score report", "MOI letter (Medium of Instruction, if applicable)"] },
  { category: "Identity", items: ["Valid passport (6+ months validity)", "Passport-size photograph (recent, white background)"] },
  { category: "Application", items: ["Statement of Purpose (SOP)", "CV / resume", "2 reference letters", "Application form (per university)"] },
  { category: "Financial (visa stage)", items: ["Bank statements (28 days minimum)", "Sponsor letter (if applicable)", "Scholarship award letter (if applicable)", "Income proof / tax returns"] },
  { category: "Course-specific", items: ["Portfolio (art/design courses)", "Work experience certificates", "Research proposal (PhD)", "GMAT/GRE scores (MBA/PhD)"] },
];

export function PublicAdmissionRequirements({ onNavigate }: PublicAdmissionRequirementsProps) {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0066CC]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Admission Requirements" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#F37021] border border-[#F37021]/20 hover:bg-[#FFF3EA]">
              <Icon name="GraduationCap" className="mr-1 size-3" />
              By Level &amp; Country
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Admission <span className="text-[#0066CC]">Requirements</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Find out exactly what you need to get into your dream university — by study level and by country.
              All requirements verified against official university sources weekly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("public-services", "profile-assessment")} className="h-12 bg-[#F37021] px-6 text-white hover:bg-[#c8451a]">
                <Icon name="UserCheck" className="size-4" />
                Get Free Profile Assessment
              </Button>
              <Button onClick={() => onNavigate("public-contact")} variant="outline" className="h-12 border-[#0066CC]/30 bg-white px-6 text-[#0066CC] hover:bg-[#EAF3FF]">
                <Icon name="Phone" className="size-4" />
                Talk to a Counselor
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BY LEVEL */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F37021]">By Study Level</p>
            <h2 className="mt-2 text-3xl font-black text-[#0B2447]">Requirements by study level</h2>
            <p className="mt-2 text-sm text-[#5A7299]">From Foundation to PhD — what you need at each stage.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((l) => (
              <Card key={l.level} className="alo-card-hover rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:border-[#0066CC]/30">
                <CardContent className="p-6">
                  <div className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    l.accent === "blue" ? "bg-[#EAF3FF] text-[#0066CC]" : "bg-[#FFF3EA] text-[#F37021]"
                  )}>
                    <Icon name={l.icon} className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#0B2447]">{l.level}</h3>
                  <p className="mt-1 text-xs text-[#5A7299]">{l.description}</p>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0066CC]">Requirements</p>
                    <ul className="mt-2 space-y-1.5">
                      {l.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-[#5A7299]">
                          <Icon name="Check" className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 border-t border-[#E2E8F0] pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#F37021]">Typical courses</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {l.typicalCourses.map((c) => (
                        <Badge key={c} variant="outline" className="bg-[#F7FAFE] text-[#5A7299] text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BY COUNTRY */}
      <section className="bg-[#F7FAFE]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">By Destination Country</p>
            <h2 className="mt-2 text-3xl font-black text-[#0B2447]">Country-specific requirements</h2>
            <p className="mt-2 text-sm text-[#5A7299]">Click any country for full entry requirements, visas, and university list.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRY_REQUIREMENTS.map((c) => (
              <Card
                key={c.slug}
                className="alo-card-hover group cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:border-[#0066CC]/30"
                onClick={() => onNavigate("public-country", c.slug)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.flag}</span>
                    <h3 className="text-base font-bold text-[#0B2447] group-hover:text-[#0066CC]">{c.name}</h3>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7299]">Min IELTS</span>
                      <span className="font-bold text-[#0B2447]">{c.minIELTS}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7299]">Min GPA</span>
                      <span className="font-bold text-[#0B2447]">{c.minGPA}</span>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-[#E2E8F0] pt-3 text-xs leading-relaxed text-[#5A7299]">{c.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ENGLISH TEST TABLE */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F37021]">English Tests</p>
            <h2 className="mt-2 text-3xl font-black text-[#0B2447]">English test requirements comparison</h2>
            <p className="mt-2 text-sm text-[#5A7299]">Which test scores are accepted by which country's visa offices.</p>
          </div>
          <Card className="mt-8 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white alo-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0066CC] text-white">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Test</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Common Score</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">UK Visa</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">USA</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Canada</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Australia</th>
                  </tr>
                </thead>
                <tbody>
                  {ENGLISH_TEST_TABLE.map((row, i) => (
                    <tr key={row.test} className={i % 2 === 0 ? "bg-white" : "bg-[#F7FAFE]/60"}>
                      <td className="border-b border-[#E2E8F0] px-4 py-3 font-semibold text-[#0B2447]">{row.test}</td>
                      <td className="border-b border-[#E2E8F0] px-4 py-3 text-[#5A7299]">{row.commonScore}</td>
                      <td className="border-b border-[#E2E8F0] px-4 py-3 text-[#5A7299]">{row.ukVisa}</td>
                      <td className="border-b border-[#E2E8F0] px-4 py-3 text-[#5A7299]">{row.usa}</td>
                      <td className="border-b border-[#E2E8F0] px-4 py-3 text-[#5A7299]">{row.canada}</td>
                      <td className="border-b border-[#E2E8F0] px-4 py-3 text-[#5A7299]">{row.australia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="mt-4">
            <Disclaimer text="Test requirements vary by university and course. Always check the specific requirements page of your target university before booking an English test." />
          </div>
        </div>
      </section>

      {/* DOCUMENT CHECKLIST */}
      <section className="bg-[#F7FAFE]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">Document Checklist</p>
            <h2 className="mt-2 text-3xl font-black text-[#0B2447]">All documents you'll need</h2>
            <p className="mt-2 text-sm text-[#5A7299]">Organised by category — tick them off as you prepare.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REQUIRED_DOCUMENTS.map((cat) => (
              <Card key={cat.category} className="rounded-2xl border border-[#E2E8F0] bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Icon name="Folder" className="size-5 text-[#0066CC]" />
                    <h3 className="text-sm font-bold text-[#0B2447]">{cat.category}</h3>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {cat.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#5A7299]">
                        <Icon name="FileText" className="mt-0.5 size-3 shrink-0 text-[#0066CC]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B2447]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black text-white">Not sure if you qualify?</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                Our free Profile Assessment reviews your academics, English scores, and budget against the entry
                requirements of your target universities — giving you a clear chance-of-admission estimate.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => onNavigate("public-services", "profile-assessment")} className="h-12 bg-[#F37021] px-6 text-white hover:bg-[#c8451a]">
                  <Icon name="UserCheck" className="size-4" />
                  Get Profile Assessment
                </Button>
                <Button onClick={() => onNavigate("public-course-finder")} variant="outline" className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10">
                  <Icon name="Search" className="size-4" />
                  Find Courses
                </Button>
              </div>
            </div>
            <PublicLeadForm
              sourceTag="Admission Requirements page — bottom CTA"
              title="Get your personalised requirements check"
              subtitle="Submit your details and we'll review your profile against your target university's requirements."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
export default PublicAdmissionRequirements;
