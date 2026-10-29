"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, SectionCard } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

interface Props { onNavigate: (v: ViewKey, slug?: string) => void; }

const DEGREE_LEVELS = [
  { slug: "bachelors", icon: "GraduationCap", title: "Bachelor's Degree", desc: "Undergraduate programs (3-4 years) at top universities worldwide.", duration: "3-4 Years", levels: ["BSc", "BA", "BEng", "BBA"] },
  { slug: "masters", icon: "Award", title: "Master's Degree", desc: "Postgraduate programs (1-2 years) for specialization and career advancement.", duration: "1-2 Years", levels: ["MSc", "MA", "MEng", "MBA"] },
  { slug: "msc", icon: "FlaskConical", title: "MSc (Master of Science)", desc: "Science, technology, engineering and mathematics master's programs.", duration: "1-2 Years", levels: ["MSc Computer Science", "MSc Data Science", "MSc Engineering", "MSc Finance"] },
  { slug: "mba", icon: "Briefcase", title: "MBA", desc: "Master of Business Administration programs for professionals.", duration: "1-2 Years", levels: ["Full-time MBA", "Executive MBA", "Global MBA"] },
  { slug: "phd", icon: "BookOpen", title: "PhD / Research", desc: "Doctoral research programs at leading universities.", duration: "3-5 Years", levels: ["PhD", "MPhil", "MRes", "Doctorate"] },
  { slug: "research", icon: "Microscope", title: "Research Programs", desc: "Postdoctoral and research-focused opportunities.", duration: "1-5 Years", levels: ["Postdoc", "Research Fellow", "Visiting Researcher"] },
];

export function PublicHigherStudy({ onNavigate }: Props) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Higher Study" subtitle="Explore degree programs by level — Bachelor's, Master's, MBA, PhD and Research" icon="GraduationCap" />

      {/* Degree Level Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DEGREE_LEVELS.map((level) => (
          <Card key={level.slug} className="alo-card-hover cursor-pointer rounded-2xl border border-[var(--alo-brand-border)] bg-white shadow-sm" onClick={() => onNavigate("public-course-finder")}>
            <CardContent className="p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                <Icon name={level.icon} className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--alo-text)]">{level.title}</h3>
              <p className="mt-2 text-sm text-[var(--alo-text-muted)]">{level.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {level.levels.map((l) => (
                  <Badge key={l} variant="outline" className="border-[var(--alo-brand-border)] text-[var(--alo-text-muted)]">{l}</Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[var(--alo-text-muted)]"><Icon name="Clock" className="mr-1 inline size-3.5" />{level.duration}</span>
                <span className="text-sm font-semibold text-[var(--alo-brand)]">Find Courses <Icon name="ArrowRight" className="ml-1 inline size-3.5" /></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <SectionCard title="Quick Access" icon="Zap">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: "Search", label: "Course Finder", action: "public-course-finder" as ViewKey },
            { icon: "Building2", label: "Universities", action: "public-universities" as ViewKey },
            { icon: "Award", label: "Scholarships", action: "scholarship-finder" as ViewKey },
            { icon: "GraduationCap", label: "Admission Req.", action: "public-admission-requirements" as ViewKey },
            { icon: "Plane", label: "Visa Support", action: "public-visa-support" as ViewKey },
            { icon: "CalendarCheck", label: "Consultation", action: "public-contact" as ViewKey },
          ].map((item) => (
            <button key={item.label} onClick={() => onNavigate(item.action)} className="flex flex-col items-center gap-2 rounded-xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)] p-4 transition-colors hover:bg-[var(--alo-brand-light)]">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                <Icon name={item.icon} className="size-5" />
              </div>
              <span className="text-xs font-medium text-[var(--alo-text)]">{item.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-info)] p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Not Sure Which Degree Is Right for You?</h2>
        <p className="mt-2 text-white/90">Request a consultation with our expert counselors to find your perfect study path.</p>
        <Button onClick={() => onNavigate("public-contact")} className="mt-4 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">Request Consultation</Button>
      </div>
    </div>
  );
}
export default PublicHigherStudy;
