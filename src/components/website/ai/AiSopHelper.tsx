'use client';

/**
 * AI SOP Helper — /ai/sop-helper
 *
 * A structured drafting workspace with deterministic review
 * (src/lib/advisory-review.ts) and real version history kept in the browser.
 * Nothing is generated for the student: the tool organises and critiques their
 * own writing, and never claims a statement it reviews will secure admission.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, CircleAlert, Download, FileText, History, Info, Sparkles, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AiToolShell } from '../ai-tool-shell';
import { DataDisclaimer, Panel, PanelHeader, StatusPill } from '../alo-public-primitives';
import { reviewStatementOfPurpose, summariseFindings, type Severity } from '@/lib/advisory-review';
import { cn } from '@/lib/utils';

interface SopVersion {
  id: string;
  savedAt: string;
  wordCount: number;
  score: number;
  draft: string;
}

const STORAGE_KEY = 'alo.sop.versions.v1';

const SEVERITY_TONE: Record<Severity, 'danger' | 'warning' | 'neutral'> = {
  error: 'danger',
  warning: 'warning',
  info: 'neutral',
};

const SEVERITY_ICON: Record<Severity, typeof Info> = {
  error: CircleAlert,
  warning: CircleAlert,
  info: Info,
};

export default function AiSopHelper() {
  const [context, setContext] = useState({
    programme: '',
    university: '',
    academicBackground: '',
    careerGoal: '',
    experience: '',
  });
  const [draft, setDraft] = useState('');
  const [reviewed, setReviewed] = useState<string | null>(null);
  const [versions, setVersions] = useState<SopVersion[]>([]);

  // Version history is local to the browser: a statement is personal data and
  // is not uploaded anywhere by this tool.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setVersions(JSON.parse(stored) as SopVersion[]);
    } catch {
      setVersions([]);
    }
  }, []);

  const persist = (next: SopVersion[]) => {
    setVersions(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable (private mode). History is a convenience,
      // not a guarantee — never block the tool on it.
    }
  };

  const review = useMemo(() => {
    if (reviewed === null) return null;
    return reviewStatementOfPurpose(reviewed, {
      programme: context.programme || undefined,
      university: context.university || undefined,
      careerGoal: context.careerGoal || undefined,
    });
  }, [reviewed, context]);

  const summary = review ? summariseFindings(review.findings) : null;
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  const saveVersion = () => {
    const version: SopVersion = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      wordCount,
      score: review?.completenessScore ?? 0,
      draft,
    };
    persist([version, ...versions].slice(0, 20));
  };

  const exportDraft = () => {
    const header = [
      context.programme && `Programme: ${context.programme}`,
      context.university && `University: ${context.university}`,
      context.careerGoal && `Career goal: ${context.careerGoal}`,
    ].filter(Boolean).join('\n');
    const content = `${header ? `${header}\n\n` : ''}${draft}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `statement-of-purpose-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AiToolShell
      eyebrow="AI SOP Helper"
      title="Write a statement of purpose admissions teams will read"
      lede="Structure your statement around your programme, background and goals, then get a review that flags weak structure, clichés and missing specifics — with version history so you can compare drafts."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools' },
        { label: 'SOP Helper' },
      ]}
      howItWorks={[
        { title: 'Set the context', description: 'Programme, university and the goal your statement must support.' },
        { title: 'Write your own draft', description: 'The tool structures and critiques — it does not write the statement for you.' },
        { title: 'Review, revise, export', description: 'Each review names the rule behind every finding, and versions are kept locally.' },
      ]}
      method="Review is produced by deterministic structural rules (src/lib/advisory-review.ts): length against typical university limits, paragraph structure, whether you name the programme and university, presence of explicit reasoning, and over-used phrasing. No language model writes or rewrites your statement."
      disclaimer="A strong statement improves how your application is read; it does not guarantee admission. Universities assess your full academic record, references and, for some programmes, an interview. Requirements and word limits vary — always check the programme's own guidance."
      sidebar={
        <Panel>
          <PanelHeader
            title="Version history"
            description="Stored in this browser only"
            action={
              versions.length > 0 ? (
                <Button variant="ghost" className=" rounded-button px-2 text-[12px] font-semibold text-alo-error" onClick={() => persist([])}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </Button>
              ) : undefined
            }
          />
          {versions.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-alo-text-muted">
              No saved versions yet. Save a draft to compare later revisions.
            </p>
          ) : (
            <ul className="divide-y divide-alo-border">
              {versions.map((version) => (
                <li key={version.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-alo-navy">
                      {new Date(version.savedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[12px] text-alo-text-muted">{version.wordCount} words</p>
                  </div>
                  <Button
 variant="outline"
 className=" shrink-0 rounded-button border-alo-border px-3 text-[12px] font-semibold"
 onClick={() => setDraft(version.draft)}
                  >
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      }
    >
      <Panel>
        <PanelHeader title="Context" description="Used to check that your statement actually addresses these." />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <Label htmlFor="sop-programme" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Programme</Label>
            <Input id="sop-programme" value={context.programme} onChange={(e) => setContext((c) => ({ ...c, programme: e.target.value }))} placeholder="MSc Data Science" className="h-12 rounded-input border-alo-border" />
          </div>
          <div>
            <Label htmlFor="sop-university" className="mb-1.5 block text-[13px] font-semibold text-alo-text">University</Label>
            <Input id="sop-university" value={context.university} onChange={(e) => setContext((c) => ({ ...c, university: e.target.value }))} placeholder="University of Leeds" className="h-12 rounded-input border-alo-border" />
          </div>
          <div>
            <Label htmlFor="sop-background" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Academic background</Label>
            <Input id="sop-background" value={context.academicBackground} onChange={(e) => setContext((c) => ({ ...c, academicBackground: e.target.value }))} placeholder="BSc in Statistics, University of Dhaka" className="h-12 rounded-input border-alo-border" />
          </div>
          <div>
            <Label htmlFor="sop-goal" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Career goal</Label>
            <Input id="sop-goal" value={context.careerGoal} onChange={(e) => setContext((c) => ({ ...c, careerGoal: e.target.value }))} placeholder="Data analyst in financial services" className="h-12 rounded-input border-alo-border" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sop-experience" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Relevant experience</Label>
            <Textarea id="sop-experience" value={context.experience} onChange={(e) => setContext((c) => ({ ...c, experience: e.target.value }))} rows={3} placeholder="Internships, projects, employment — with what you actually did." className="rounded-input border-alo-border text-[14px]" />
            <p className="mt-1.5 text-[12px] text-alo-text-muted">
              Only list experience you can evidence. Invented experience is a common reason applications fail.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="Your draft"
          description="Write in your own words — this tool will not write the statement for you."
          action={<span className="text-[13px] font-medium text-alo-text-muted">{wordCount} words</span>}
        />
        <div className="p-5 sm:p-6">
          <Textarea
            id="sop-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            placeholder="Start with why this programme, then the background that prepared you for it, then what you intend to do with it…"
            className="min-h-[360px] rounded-input border-alo-border text-[14px] leading-relaxed"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setReviewed(draft)} disabled={draft.trim().length === 0} className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-black hover:bg-alo-cta-hover disabled:opacity-50">
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              Review Draft
            </Button>
            <Button onClick={saveVersion} disabled={draft.trim().length === 0} variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold disabled:opacity-50">
              <History className="mr-2 h-4 w-4" aria-hidden="true" />
              Save Version
            </Button>
            <Button onClick={exportDraft} disabled={draft.trim().length === 0} variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold disabled:opacity-50">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export Draft
            </Button>
          </div>
        </div>
      </Panel>

      {review && summary && (
        <Panel className="mt-6">
          <PanelHeader
            title="Review"
            description="Structural feedback — not a judgement on whether you will be admitted."
            action={
              <span className="text-right">
                <span className={cn(
                  'block text-[26px] font-bold leading-none tracking-[-0.02em]',
                  review.completenessScore >= 80 ? 'text-alo-success' : review.completenessScore >= 50 ? 'text-alo-warning' : 'text-alo-error',
                )}>
                  {review.completenessScore}%
                </span>
                <span className="mt-1 block text-[11px] font-medium text-alo-text-muted">completeness</span>
              </span>
            }
          />
          <div className="flex flex-wrap gap-2 border-b border-alo-border px-5 py-3 sm:px-6">
            <StatusPill tone="danger" label={`${summary.errors} to fix`} />
            <StatusPill tone="warning" label={`${summary.warnings} to improve`} />
            <StatusPill tone="neutral" label={`${summary.info} suggestions`} />
          </div>

          {review.findings.length === 0 ? (
            <div className="flex gap-3 p-5 sm:p-6">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-alo-success" aria-hidden="true" />
              <div>
                <h3 className="text-[15px] font-semibold text-alo-navy">No structural issues found</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-alo-text-secondary">
                  Your draft covers the checks this tool runs. Have a human read it too — an advisor will catch
                  tone and argument problems a structural check cannot.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-alo-border">
              {review.findings.map((finding) => {
                const Icon = SEVERITY_ICON[finding.severity];
                return (
                  <li key={finding.id} className="flex gap-3 px-5 py-4 sm:px-6">
                    <Icon className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      finding.severity === 'error' ? 'text-alo-error' : finding.severity === 'warning' ? 'text-alo-warning' : 'text-alo-text-muted',
                    )} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-alo-navy">{finding.label}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-alo-text-secondary">{finding.detail}</p>
                      <StatusPill className="mt-2" tone={SEVERITY_TONE[finding.severity]} label={finding.severity === 'error' ? 'Must fix' : finding.severity === 'warning' ? 'Should fix' : 'Suggestion'} showIcon={false} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      <Panel className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-alo-navy">
            <FileText className="h-4 w-4 text-alo-brand" aria-hidden="true" />
            Get a human review before you submit
          </h2>
          <p className="mt-1 text-[14px] text-alo-text-secondary">
            ALO counselors review statements against what the specific programme asks for — structure alone is not enough.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-black hover:bg-alo-cta-hover">
            <Link href="/book-consultation">Book Free Consultation</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
            <Link href="/ai/cv-helper">Build Your CV</Link>
          </Button>
        </div>
      </Panel>

      <DataDisclaimer className="mt-6" />
    </AiToolShell>
  );
}
