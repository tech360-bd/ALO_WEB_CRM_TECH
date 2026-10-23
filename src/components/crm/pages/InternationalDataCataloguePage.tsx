'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, Building2, Database, FileCheck, Globe, Search, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';

export const CATALOGUE_SECTIONS: { title: string; description: string; fields: string[]; view: PortalView; action: string }[] = [
  { title: 'International universities', description: 'Browse existing university profiles and their recorded destinations, campuses and official links.', fields: ['Universities', 'Countries', 'Campuses', 'Official sources'], view: 'crm-universities', action: 'Browse universities' },
  { title: 'Courses & programmes', description: 'Find recorded programmes, qualifications, study levels, fees and intake information in the existing Course Finder.', fields: ['Undergraduate', 'Postgraduate', 'Research', 'Top-up', 'Intakes', 'Tuition'], view: 'crm-course-finder', action: 'Open Course Finder' },
  { title: 'Admission information', description: 'Review course-specific entry, language and intake information. Use Applications to manage individual admission cases separately.', fields: ['Entry requirements', 'English requirements', 'Deadlines', 'Applications'], view: 'crm-course-finder', action: 'Review admission requirements' },
  { title: 'Scholarships & funding', description: 'Browse actual scholarship records with recorded award values, deadlines, verification status and official source links. Awards are never inferred from tuition.', fields: ['Scholarships', 'Funding', 'Eligibility', 'Verification'], view: 'crm-scholarships', action: 'Browse scholarships' },
  { title: 'CRM data & admission cases', description: 'Open existing student and application workspaces. Personal CRM case data remains separate from public academic catalogue information.', fields: ['Students', 'Admissions', 'Applications', 'CRM'], view: 'crm-students', action: 'Open student records' },
];
const icons = [Building2, BookOpen, FileCheck, Award, Users];

export default function InternationalDataCataloguePage() {
  const setView = usePortalStore((state) => state.setView);
  const [query, setQuery] = useState('');
  const sections = useMemo(() => CATALOGUE_SECTIONS.filter((section) => `${section.title} ${section.description} ${section.fields.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  return <div className="space-y-6">
    <header className="rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-6 md:p-8">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--alo-brand)]"><Globe className="h-5 w-5" /> ALO Education · International data</p>
      <h1 className="max-w-4xl text-2xl font-bold leading-tight text-[var(--alo-text)] md:text-3xl">International University, Course, Admission, Scholarship and CRM Data Catalogue</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--alo-body)]">One starting point for the existing academic catalogue and CRM workspaces. Browse records, check admission information and review source evidence without creating duplicate data.</p>
    </header>

    <Link href="/all-university-information" className="inline-flex items-center gap-2 rounded-lg border border-[var(--alo-border)] px-4 py-3 text-sm font-semibold text-[var(--alo-brand)]">All University Information — public page <ArrowRight className="h-4 w-4" /></Link>

    <div className="relative max-w-xl">
      <label htmlFor="international-catalogue-search" className="mb-2 block text-sm font-medium">Find a catalogue section</label>
      <Search className="pointer-events-none absolute bottom-4 left-3 h-4 w-4 text-[var(--alo-text-muted)]" />
      <Input id="international-catalogue-search" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Universities, courses, admission, scholarships, CRM…" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => {
        const Icon = icons[CATALOGUE_SECTIONS.indexOf(section)];
        return <Card key={section.title} className="flex flex-col rounded-2xl">
          <CardHeader><Icon className="mb-2 h-6 w-6 text-[var(--alo-brand)]" /><CardTitle className="text-lg">{section.title}</CardTitle></CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <p className="text-sm leading-relaxed text-[var(--alo-body)]">{section.description}</p>
            <ul className="flex flex-wrap gap-2" aria-label={`${section.title} topics`}>{section.fields.map((field) => <li key={field} className="rounded-full bg-[var(--alo-page)] px-3 py-1 text-xs text-[var(--alo-text-muted)]">{field}</li>)}</ul>
            <Button variant="outline" className="mt-auto justify-between gap-2 whitespace-normal text-left" onClick={() => setView(section.view)}>{section.action}<ArrowRight className="h-4 w-4 shrink-0" /></Button>
          </CardContent>
        </Card>;
      })}
    </div>
    {!sections.length && <p role="status" className="rounded-xl border p-6 text-sm text-[var(--alo-text-muted)]">No matching section. Try “course”, “admission”, “scholarship” or “CRM”.</p>}

    <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-[var(--alo-brand)]" /> Sources, review & data governance</CardTitle></CardHeader><CardContent className="space-y-4">
      <p className="text-sm text-[var(--alo-body)]">Availability depends on the records stored in your database. A catalogue entry is not proof of complete university research. Check verification status and official evidence before advising a student; missing results do not prove that a programme or award does not exist. Material publication changes remain subject to the existing approval controls.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setView('crm-university-updates')}><Database className="mr-2 h-4 w-4" /> Source & update centre</Button>
        <Button variant="outline" onClick={() => setView('crm-applications')}>Admission cases</Button>
        <Button variant="outline" onClick={() => setView('crm-audit-logs')}>CRM audit history</Button>
      </div>
    </CardContent></Card>
  </div>;
}
