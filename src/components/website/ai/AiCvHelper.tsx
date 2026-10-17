'use client';

/**
 * AI CV Helper — /ai/cv-helper
 *
 * A structured CV builder with a completeness review
 * (src/lib/advisory-review.ts), a live print-ready preview and plain-text
 * export. Everything stays in the browser: this tool never uploads a CV.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, CircleAlert, Download, Eye, Info, Plus, Printer, Sparkles, Trash2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AiToolShell } from '../ai-tool-shell';
import { Panel, PanelHeader, StatusPill } from '../alo-public-primitives';
import { reviewCv, summariseFindings, type CvProfile, type Severity } from '@/lib/advisory-review';
import { cn } from '@/lib/utils';

type Education = NonNullable<CvProfile['education']>[number];
type Experience = NonNullable<CvProfile['experience']>[number];

const EMPTY_EDUCATION: Education = { institution: '', qualification: '', startDate: '', endDate: '' };
const EMPTY_EXPERIENCE: Experience = { role: '', organisation: '', startDate: '', endDate: '', summary: '' };

const SEVERITY_ICON: Record<Severity, typeof Info> = {
  error: CircleAlert,
  warning: CircleAlert,
  info: Info,
};

export default function AiCvHelper() {
  const [profile, setProfile] = useState<CvProfile>({
    fullName: '',
    email: '',
    phone: '',
    education: [{ ...EMPTY_EDUCATION }],
    experience: [],
    skills: [],
    achievements: [],
    languages: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const review = useMemo(() => reviewCv(profile), [profile]);
  const summary = summariseFindings(review.findings);

  const patch = (changes: Partial<CvProfile>) => setProfile((current) => ({ ...current, ...changes }));

  const updateEducation = (index: number, changes: Partial<Education>) =>
    patch({
      education: (profile.education ?? []).map((entry, i) => (i === index ? { ...entry, ...changes } : entry)),
    });

  const updateExperience = (index: number, changes: Partial<Experience>) =>
    patch({
      experience: (profile.experience ?? []).map((entry, i) => (i === index ? { ...entry, ...changes } : entry)),
    });

  const addToList = (key: 'skills' | 'achievements' | 'languages', value: string, reset: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    patch({ [key]: [...((profile[key] as string[]) ?? []), trimmed] } as Partial<CvProfile>);
    reset();
  };

  const removeFromList = (key: 'skills' | 'achievements' | 'languages', index: number) =>
    patch({ [key]: (profile[key] as string[]).filter((_, i) => i !== index) } as Partial<CvProfile>);

  const exportCv = () => {
    const lines: string[] = [];
    if (profile.fullName) lines.push(profile.fullName.toUpperCase());
    const contact = [profile.email, profile.phone].filter(Boolean).join(' · ');
    if (contact) lines.push(contact);
    lines.push('');

    const section = (title: string, body: string[]) => {
      if (body.filter(Boolean).length === 0) return;
      lines.push(title.toUpperCase());
      lines.push(...body);
      lines.push('');
    };

    section('Education', (profile.education ?? []).map((entry) =>
      [entry.qualification, entry.institution, [entry.startDate, entry.endDate].filter(Boolean).join(' – ')]
        .filter(Boolean).join(' — ')));

    section('Experience', (profile.experience ?? []).map((entry) =>
      [entry.role, entry.organisation, [entry.startDate, entry.endDate].filter(Boolean).join(' – ')]
        .filter(Boolean).join(' — ')));

    section('Skills', (profile.skills ?? []).join(', ') ? [(profile.skills ?? []).join(', ')] : []);
    section('Achievements', profile.achievements ?? []);
    section('Languages', (profile.languages ?? []).join(', ') ? [(profile.languages ?? []).join(', ')] : []);

    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(profile.fullName || 'cv').toLowerCase().replace(/\s+/g, '-')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AiToolShell
      eyebrow="AI CV Helper"
      title="Build an application-ready CV"
      lede="Capture your personal details, education, experience, skills, achievements and languages in the order admissions teams expect — then see exactly what is still missing before you submit."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools' },
        { label: 'CV Helper' },
      ]}
      howItWorks={[
        { title: 'Fill in each section', description: 'Nothing is generated for you — every line is your own record.' },
        { title: 'Watch completeness update', description: 'Missing or incomplete fields are flagged as you go.' },
        { title: 'Preview and export', description: 'Export a plain-text version to paste into any application portal.' },
      ]}
      method="The completeness review is produced by deterministic rules (src/lib/advisory-review.ts): presence of each required section, valid email format, complete education entries with dates, and enough detail per experience entry. No language model writes or embellishes your CV, and nothing you type is uploaded."
      disclaimer="Never invent qualifications, grades, employment or achievements. Universities verify documents, and a fabricated entry is grounds for refusal or withdrawal of an offer. If you have a study gap or no work experience, state it honestly — counselors can advise how to present it."
      sidebar={
        <Panel>
          <PanelHeader title="Completeness" description="Live review" />
          <div className="p-5">
            <p className={cn(
              'text-[34px] font-bold leading-none tracking-[-0.02em]',
              review.completenessScore >= 80 ? 'text-alo-success' : review.completenessScore >= 50 ? 'text-alo-warning' : 'text-alo-error',
            )}>
              {review.completenessScore}%
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="danger" label={`${summary.errors} to fix`} />
              <StatusPill tone="warning" label={`${summary.warnings} to improve`} />
              <StatusPill tone="neutral" label={`${summary.info} suggestions`} />
            </div>
            <ul className="mt-4 space-y-2">
              {review.findings.length === 0 ? (
                <li className="flex gap-2 text-[13px] text-alo-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-alo-success" aria-hidden="true" />
                  No gaps detected. Preview and export when you are ready.
                </li>
              ) : (
                review.findings.slice(0, 6).map((finding) => {
                  const Icon = SEVERITY_ICON[finding.severity];
                  return (
                    <li key={finding.id} className="flex gap-2 text-[13px] leading-relaxed text-alo-text-secondary">
                      <Icon className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        finding.severity === 'error' ? 'text-alo-error' : finding.severity === 'warning' ? 'text-alo-warning' : 'text-alo-text-muted',
                      )} aria-hidden="true" />
                      {finding.label}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </Panel>
      }
    >
      {/* Personal */}
      <Panel>
        <PanelHeader title="Personal details" description="Use the name exactly as it appears on your passport." />
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <Label htmlFor="cv-name" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Full name</Label>
            <Input id="cv-name" value={profile.fullName ?? ''} onChange={(e) => patch({ fullName: e.target.value })} className="h-12 rounded-input border-alo-border" />
          </div>
          <div>
            <Label htmlFor="cv-email" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Email</Label>
            <Input id="cv-email" type="email" value={profile.email ?? ''} onChange={(e) => patch({ email: e.target.value })} className="h-12 rounded-input border-alo-border" />
          </div>
          <div>
            <Label htmlFor="cv-phone" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Phone</Label>
            <Input id="cv-phone" value={profile.phone ?? ''} onChange={(e) => patch({ phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" className="h-12 rounded-input border-alo-border" />
          </div>
        </div>
      </Panel>

      {/* Education */}
      <Panel className="mt-6">
        <PanelHeader title="Education" description="Include dates — admissions teams check for study gaps." />
        <div className="space-y-4 p-5 sm:p-6">
          {(profile.education ?? []).map((entry, index) => (
            <div key={index} className="rounded-2xl border border-alo-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={entry.institution ?? ''} onChange={(e) => updateEducation(index, { institution: e.target.value })} placeholder="Institution" aria-label={`Education ${index + 1} institution`} className="h-11 rounded-input border-alo-border" />
                <Input value={entry.qualification ?? ''} onChange={(e) => updateEducation(index, { qualification: e.target.value })} placeholder="Qualification" aria-label={`Education ${index + 1} qualification`} className="h-11 rounded-input border-alo-border" />
                <Input value={entry.startDate ?? ''} onChange={(e) => updateEducation(index, { startDate: e.target.value })} placeholder="Start (e.g. 2019)" aria-label={`Education ${index + 1} start`} className="h-11 rounded-input border-alo-border" />
                <Input value={entry.endDate ?? ''} onChange={(e) => updateEducation(index, { endDate: e.target.value })} placeholder="End (e.g. 2023)" aria-label={`Education ${index + 1} end`} className="h-11 rounded-input border-alo-border" />
              </div>
              {(profile.education ?? []).length > 1 && (
                <Button variant="ghost" className="mt-2 h-8 rounded-button px-2 text-[12px] font-semibold text-alo-error" onClick={() => patch({ education: (profile.education ?? []).filter((_, i) => i !== index) })}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Remove entry
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" className="h-12 rounded-button border-alo-border px-4 text-[13px] font-semibold" onClick={() => patch({ education: [...(profile.education ?? []), { ...EMPTY_EDUCATION }] })}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Education
          </Button>
        </div>
      </Panel>

      {/* Experience */}
      <Panel className="mt-6">
        <PanelHeader title="Experience" description="Employment, internships and voluntary roles. Leave empty if you have none." />
        <div className="space-y-4 p-5 sm:p-6">
          {(profile.experience ?? []).length === 0 && (
            <p className="text-[13px] text-alo-text-muted">
              No experience added. If you have none, that is acceptable — do not invent entries.
            </p>
          )}
          {(profile.experience ?? []).map((entry, index) => (
            <div key={index} className="rounded-2xl border border-alo-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={entry.role ?? ''} onChange={(e) => updateExperience(index, { role: e.target.value })} placeholder="Role" aria-label={`Experience ${index + 1} role`} className="h-11 rounded-input border-alo-border" />
                <Input value={entry.organisation ?? ''} onChange={(e) => updateExperience(index, { organisation: e.target.value })} placeholder="Organisation" aria-label={`Experience ${index + 1} organisation`} className="h-11 rounded-input border-alo-border" />
                <Input value={entry.startDate ?? ''} onChange={(e) => updateExperience(index, { startDate: e.target.value })} placeholder="Start" aria-label={`Experience ${index + 1} start`} className="h-11 rounded-input border-alo-border" />
                <Input value={entry.endDate ?? ''} onChange={(e) => updateExperience(index, { endDate: e.target.value })} placeholder="End or Present" aria-label={`Experience ${index + 1} end`} className="h-11 rounded-input border-alo-border" />
              </div>
              <Textarea value={entry.summary ?? ''} onChange={(e) => updateExperience(index, { summary: e.target.value })} rows={3} placeholder="What you did and what resulted from it." aria-label={`Experience ${index + 1} summary`} className="mt-3 rounded-input border-alo-border text-[14px]" />
              <Button variant="ghost" className="mt-2 h-8 rounded-button px-2 text-[12px] font-semibold text-alo-error" onClick={() => patch({ experience: (profile.experience ?? []).filter((_, i) => i !== index) })}>
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Remove entry
              </Button>
            </div>
          ))}
          <Button variant="outline" className="h-12 rounded-button border-alo-border px-4 text-[13px] font-semibold" onClick={() => patch({ experience: [...(profile.experience ?? []), { ...EMPTY_EXPERIENCE }] })}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Experience
          </Button>
        </div>
      </Panel>

      {/* Lists */}
      <Panel className="mt-6">
        <PanelHeader title="Skills, achievements and languages" />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-3">
          <ListEditor label="Skills" placeholder="Python, statistical modelling" value={skillInput} onChange={setSkillInput} items={profile.skills ?? []} onAdd={() => addToList('skills', skillInput, () => setSkillInput(''))} onRemove={(index) => removeFromList('skills', index)} />
          <ListEditor label="Achievements" placeholder="Departmental scholarship 2022" value={achievementInput} onChange={setAchievementInput} items={profile.achievements ?? []} onAdd={() => addToList('achievements', achievementInput, () => setAchievementInput(''))} onRemove={(index) => removeFromList('achievements', index)} />
          <ListEditor label="Languages" placeholder="Bangla (native), English (IELTS 7.0)" value={languageInput} onChange={setLanguageInput} items={profile.languages ?? []} onAdd={() => addToList('languages', languageInput, () => setLanguageInput(''))} onRemove={(index) => removeFromList('languages', index)} />
        </div>
      </Panel>

      {/* Actions + preview */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => setShowPreview((value) => !value)} variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          {showPreview ? 'Hide Preview' : 'Preview CV'}
        </Button>
        <Button onClick={exportCv} className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export CV
        </Button>
        <Button onClick={() => window.print()} variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Print
        </Button>
        <Button asChild variant="ghost" className="h-12 rounded-button px-5 text-[14px] font-semibold text-alo-brand">
          <Link href="/ai/sop-helper">Write Your Statement of Purpose</Link>
        </Button>
      </div>

      {showPreview && (
        <Panel className="mt-6 p-8 sm:p-10">
          <h2 className="text-[22px] font-bold tracking-[-0.01em] text-alo-navy">
            {profile.fullName || 'Your name'}
          </h2>
          {[profile.email, profile.phone].filter(Boolean).length > 0 && (
            <p className="mt-1 text-[13px] text-alo-text-secondary">
              {[profile.email, profile.phone].filter(Boolean).join('  ·  ')}
            </p>
          )}

          <PreviewSection title="Education">
            {(profile.education ?? []).filter((entry) => entry.institution || entry.qualification).map((entry, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <p className="text-[14px] font-semibold text-alo-navy">{entry.qualification || 'Qualification'}</p>
                <p className="text-[13px] text-alo-text-secondary">
                  {[entry.institution, [entry.startDate, entry.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </PreviewSection>

          <PreviewSection title="Experience">
            {(profile.experience ?? []).filter((entry) => entry.role || entry.organisation).map((entry, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <p className="text-[14px] font-semibold text-alo-navy">{entry.role || 'Role'}</p>
                <p className="text-[13px] text-alo-text-secondary">
                  {[entry.organisation, [entry.startDate, entry.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
                </p>
                {entry.summary && <p className="mt-1 text-[13px] leading-relaxed text-alo-text">{entry.summary}</p>}
              </div>
            ))}
          </PreviewSection>

          <PreviewSection title="Skills">{(profile.skills ?? []).length > 0 && <p className="text-[13px] text-alo-text">{(profile.skills ?? []).join(' · ')}</p>}</PreviewSection>
          <PreviewSection title="Achievements">
            {(profile.achievements ?? []).length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-[13px] text-alo-text">
                {(profile.achievements ?? []).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            )}
          </PreviewSection>
          <PreviewSection title="Languages">{(profile.languages ?? []).length > 0 && <p className="text-[13px] text-alo-text">{(profile.languages ?? []).join(' · ')}</p>}</PreviewSection>
        </Panel>
      )}
    </AiToolShell>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-alo-border pt-4">
      <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-alo-text-muted">{title}</h3>
      {children}
    </section>
  );
}

function ListEditor({
  label,
  placeholder,
  value,
  onChange,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  items: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={`cv-${label.toLowerCase()}`} className="mb-1.5 block text-[13px] font-semibold text-alo-text">{label}</Label>
      <div className="flex gap-2">
        <Input
          id={`cv-${label.toLowerCase()}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="h-11 rounded-input border-alo-border"
        />
        <Button type="button" variant="outline" className="h-12 shrink-0 rounded-button border-alo-border px-3" onClick={onAdd} aria-label={`Add ${label}`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="inline-flex items-center gap-1 rounded-button border border-alo-border bg-alo-surface-muted px-2 py-1 text-[12px] font-medium text-alo-text-secondary">
              {item}
              <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${item}`} className="text-alo-text-muted hover:text-alo-error">
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
