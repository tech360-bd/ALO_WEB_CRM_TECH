'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck,
  BookOpen, Bot, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  Clock3, Copy, FileCheck2, FileText, Globe2, Image as ImageIcon, Layers3,
  Link2, ListChecks, LoaderCircle, LockKeyhole, MessageSquareText, MousePointer2,
  PanelRight, Plus, RefreshCw, Search, Send, Settings2, ShieldCheck, Sparkles,
  Target, WandSparkles, X,
} from 'lucide-react';
import {
  ALO_BUILDER_CONTENT_TYPES,
  BUILDER_IMAGE_LIBRARY,
  DEFAULT_BUILDER_INPUT,
  validateBuilderDocument,
  type AloBuilderDocument,
  type AloBuilderInput,
  type BuilderImage,
  type BuilderValidation,
} from '@/lib/alo-short-form-builder';

type BuilderContext = {
  countries: Array<{ id: string; name: string; slug: string; code: string }>;
  universities: Array<{ id: string; universityId: string; name: string; slug: string; country: string; city: string; verificationStatus: string; sourceUrl: string }>;
  courses: Array<{ id: string; courseId: string; courseTitle: string; name: string; slug: string; subjectArea: string; country: string; studyLevel: string; university?: { name: string } }>;
  recent: Array<{ id: string; title: string; slug: string; topic: string; status: string; qualityScore: number; updatedAt: string; document?: AloBuilderDocument | null }>;
  templates: Array<{ id: string; key: string; label: string; data: { input?: AloBuilderInput } }>;
  generations: Array<{ id: string; generationId: string; label: string; createdAt: string; summary: string; prompt: string }>;
  imageLibrary: Array<BuilderImage & { bytes: number }>;
  databaseStatus: 'connected' | 'unavailable';
};

type BuilderTab = 'preview' | 'validation' | 'seo' | 'links' | 'images' | 'approval';

type AssetState = { id: string; slug: string; status: string; qualityScore: number; updatedAt?: string; publishedUrl?: string };

const tabs: Array<{ id: BuilderTab; label: string; icon: typeof PanelRight }> = [
  { id: 'preview', label: 'Preview', icon: PanelRight },
  { id: 'validation', label: 'Validation', icon: ShieldCheck },
  { id: 'seo', label: 'SEO', icon: Target },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'approval', label: 'Approval', icon: FileCheck2 },
];

const quickTemplates: Array<{ title: string; subtitle: string; image: string; alt: string; input: AloBuilderInput }> = [
  {
    title: 'Destination study guide',
    subtitle: 'Country · student journey · course discovery',
    image: '/images/cards/uk.png',
    alt: 'United Kingdom destination for international students',
    input: { ...DEFAULT_BUILDER_INPUT, contentType: 'Study Guide' as const, country: 'United Kingdom', subject: 'Business Management', intake: 'January 2027' },
  },
  {
    title: 'Course landing page',
    subtitle: 'Course · university · requirements',
    image: '/images/services/counseling.png',
    alt: 'Student discussing course choices with a counsellor',
    input: { ...DEFAULT_BUILDER_INPUT, contentType: 'Course Page' as const, country: 'Australia', subject: 'Computer Science', course: '', intake: 'January 2027' },
  },
  {
    title: 'Scholarship overview',
    subtitle: 'Funding · eligibility · application path',
    image: '/images/services/success.png',
    alt: 'Education success journey and scholarship support',
    input: { ...DEFAULT_BUILDER_INPUT, contentType: 'Scholarship Page', country: 'Canada', subject: 'Scholarships', course: '', intake: '' },
  },
];

const inputFields: Array<{ key: keyof AloBuilderInput; label: string; placeholder: string; options?: string[] }> = [
  { key: 'country', label: 'Country', placeholder: 'e.g. United Kingdom' },
  { key: 'university', label: 'University', placeholder: 'Search or enter a university' },
  { key: 'course', label: 'Course', placeholder: 'Search or enter a course' },
  { key: 'subject', label: 'Subject', placeholder: 'e.g. Business Management' },
  { key: 'degree', label: 'Degree', placeholder: 'e.g. Master’s / MSc' },
  { key: 'intake', label: 'Intake', placeholder: 'e.g. January 2027' },
  { key: 'audience', label: 'Audience', placeholder: 'e.g. Bangladeshi students' },
  { key: 'language', label: 'Language', placeholder: 'English', options: ['English', 'বাংলা', 'English + বাংলা'] },
  { key: 'tone', label: 'Tone', placeholder: 'Professional and encouraging', options: ['Professional and encouraging', 'Warm and conversational', 'Concise and factual', 'Premium editorial'] },
  { key: 'seoTarget', label: 'SEO target', placeholder: 'Primary search intent / phrase' },
  { key: 'cta', label: 'Primary CTA', placeholder: 'Book a free counselling session' },
];

function getErrorMessage(payload: any, fallback: string) {
  return typeof payload?.error === 'string' ? payload.error : fallback;
}

function fieldClass() {
  return 'mt-1.5 h-10 w-full rounded-xl border border-[var(--alo-border)] bg-white px-3 text-[13px] text-[var(--alo-text)] outline-none transition placeholder:text-[var(--alo-text-muted)] focus:border-blue-400 focus:ring-4 focus:ring-blue-50';
}

function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[var(--alo-border)] bg-white shadow-[0_10px_35px_rgba(15,23,42,0.035)] ${className}`}>{children}</section>;
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--alo-text-muted)]">{children}</div>;
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const classes = normalized.includes('VERIFIED') || normalized === 'APPROVED' || normalized === 'PUBLISHED'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : normalized.includes('REVIEW') || normalized.includes('PENDING') || normalized.includes('MISSING') || normalized.includes('RESEARCH')
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : normalized === 'DRAFT' ? 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] ring-slate-200' : 'bg-blue-50 text-blue-700 ring-blue-200';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${classes}`}>{status.replaceAll('_', ' ')}</span>;
}

function ScoreRing({ value, size = 'normal' }: { value: number; size?: 'normal' | 'small' }) {
  const radius = size === 'small' ? 16 : 20;
  const stroke = size === 'small' ? 3 : 4;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.max(0, Math.min(value, 100)) / 100;
  const color = value >= 90 ? '#10B981' : value >= 80 ? '#0057B8' : '#E8501A';
  return (
    <div className={`relative ${size === 'small' ? 'h-10 w-10' : 'h-12 w-12'}`} aria-label={`Page health ${value} out of 100`}>
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[var(--alo-text)]">{value}</span>
    </div>
  );
}

export default function AloShortFormBuilder() {
  const [input, setInput] = useState<AloBuilderInput>(DEFAULT_BUILDER_INPUT);
  const [context, setContext] = useState<BuilderContext | null>(null);
  const [document, setDocument] = useState<AloBuilderDocument | null>(null);
  const [serverValidation, setServerValidation] = useState<BuilderValidation | null>(null);
  const [asset, setAsset] = useState<AssetState | null>(null);
  const [activeTab, setActiveTab] = useState<BuilderTab>('preview');
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'loading' | 'generating' | 'saving' | 'submitting' | 'approving' | 'publishing' | 'template' | null>('loading');
  const [templateName, setTemplateName] = useState('');
  const [expandedSettings, setExpandedSettings] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copyState, setCopyState] = useState(false);

  const validation = useMemo(() => document ? validateBuilderDocument(document) : serverValidation, [document, serverValidation]);
  const recent = context?.recent || [];
  const savedTemplates = context?.templates || [];
  const generations = context?.generations || [];

  const loadContext = useCallback(async () => {
    setBusy('loading');
    try {
      const response = await fetch('/api/admin/builder', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(getErrorMessage(payload, response.status === 401 ? 'Log in with an authorized ALO account to open the builder.' : 'The builder workspace could not be loaded.'));
      setContext(payload.data as BuilderContext);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The builder workspace could not be loaded.');
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => { void loadContext(); }, [loadContext]);

  const setField = (key: keyof AloBuilderInput, value: string) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = async () => {
    setNotice(null);
    setError(null);
    setAsset(null);
    setBusy('generating');
    try {
      const response = await fetch('/api/admin/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', input }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        if (payload.duplicate?.id) {
          setNotice({ kind: 'info', text: `Similar draft found: ${payload.duplicate.title}. Open it from Recent drafts instead of creating a duplicate.` });
        }
        throw new Error(getErrorMessage(payload, 'The AI could not generate this page.'));
      }
      setDocument(payload.document as AloBuilderDocument);
      setInput(payload.document.input as AloBuilderInput);
      setServerValidation(payload.validation as BuilderValidation);
      setActiveTab('preview');
      setNotice({ kind: 'success', text: 'Structured page draft generated from connected records. Publishing remains locked until every validation passes and a reviewer approves it.' });
      await loadContext();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'The AI could not generate this page.');
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async (submitForReview = false) => {
    if (!document) return;
    setNotice(null);
    setError(null);
    setBusy(submitForReview ? 'submitting' : 'saving');
    try {
      const response = await fetch('/api/admin/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: submitForReview ? 'submit' : 'save', assetId: asset?.id, document }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        if (payload.validation) setServerValidation(payload.validation);
        throw new Error(getErrorMessage(payload, 'The draft could not be saved.'));
      }
      setDocument(payload.document as AloBuilderDocument);
      setServerValidation(payload.validation as BuilderValidation);
      setAsset(payload.asset as AssetState);
      setNotice({ kind: 'success', text: submitForReview ? 'Sent to the human approval queue. The page will not publish until an independent admin approves it.' : 'Draft saved. It is not public until the full approval and publish workflow is complete.' });
      await loadContext();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The draft could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const handleWorkflowAction = async (action: 'approve' | 'publish') => {
    if (!asset) return;
    setNotice(null);
    setError(null);
    setBusy(action === 'approve' ? 'approving' : 'publishing');
    try {
      const response = await fetch('/api/admin/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, assetId: asset.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        if (payload.validation) setServerValidation(payload.validation);
        throw new Error(getErrorMessage(payload, `Could not ${action} this page.`));
      }
      setDocument(payload.document as AloBuilderDocument);
      setAsset(payload.asset as AssetState);
      setServerValidation(payload.validation as BuilderValidation);
      setNotice({ kind: 'success', text: action === 'approve' ? 'Approved by a second authorized user. Publication is still a separate step.' : `Published to ${payload.asset.publishedUrl}.` });
      await loadContext();
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : `Could not ${action} this page.`);
    } finally {
      setBusy(null);
    }
  };

  const loadDraft = async (draftId: string) => {
    setBusy('loading');
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/builder?assetId=${encodeURIComponent(draftId)}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(getErrorMessage(payload, 'Draft could not be opened.'));
      setDocument(payload.document as AloBuilderDocument);
      setInput(payload.document.input as AloBuilderInput);
      setAsset(payload.asset as AssetState);
      setServerValidation(payload.validation as BuilderValidation);
      setActiveTab('preview');
      setNotice({ kind: 'info', text: `Opened ${payload.asset.status.toLowerCase()} page. Published pages are read-only.` });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Draft could not be opened.');
    } finally {
      setBusy(null);
    }
  };

  const updateDocument = (patch: Partial<AloBuilderDocument>) => setDocument((current) => current ? { ...current, ...patch } : current);
  const updateSection = (index: number, patch: Partial<AloBuilderDocument['sections'][number]>) => {
    setDocument((current) => current ? { ...current, sections: current.sections.map((section, i) => i === index ? { ...section, ...patch } : section) } : current);
  };
  const updateImage = (index: number, patch: Partial<BuilderImage>, invalidate = false) => {
    setDocument((current) => current ? {
      ...current,
      images: current.images.map((image, i) => i === index ? { ...image, ...patch, ...(invalidate ? { verified: false } : {}) } : image),
    } : current);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    setBusy('template');
    setError(null);
    try {
      const response = await fetch('/api/admin/builder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-template', name: templateName.trim(), input }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(getErrorMessage(payload, 'Could not save template.'));
      setTemplateName('');
      setNotice({ kind: 'success', text: 'Template saved to your team library.' });
      await loadContext();
    } catch (templateError) {
      setError(templateError instanceof Error ? templateError.message : 'Could not save template.');
    } finally {
      setBusy(null);
    }
  };

  const copyPublicUrl = async () => {
    if (!asset?.slug) return;
    const url = `${window.location.origin}/guides/${asset.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState(true);
      window.setTimeout(() => setCopyState(false), 1600);
    } catch {
      setNotice({ kind: 'info', text: url });
    }
  };

  const canEdit = asset?.status !== 'PUBLISHED' && asset?.status !== 'APPROVED';
  const generateDisabled = busy !== null || input.prompt.trim().length < 12;
  const saveDisabled = !document || busy !== null || !canEdit;
  const submitDisabled = !document || busy !== null || !validation?.canSubmit || !canEdit;
  const approvalCanApprove = asset?.status === 'IN_REVIEW' && Boolean(validation?.canSubmit) && !busy;
  const approvalCanPublish = asset?.status === 'APPROVED' && Boolean(validation?.canSubmit) && !busy;

  const documentImage = (imageId: string) => document?.images.find((image) => image.id === imageId);

  const renderTabContent = () => {
    if (activeTab === 'preview') {
      if (!document) return (
        <div className="flex min-h-[430px] flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-6 h-48 w-full max-w-[330px] overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-surface-muted)]">
            <Image src="/images/hero/study-abroad-hero.png" alt="Students preparing for an international study journey" fill sizes="330px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-left text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Live page preview</div>
              <div className="mt-1 text-base font-bold">Your structured page appears here</div>
            </div>
          </div>
          <div className="max-w-xs text-sm font-semibold text-[var(--alo-text)]">Grounded content, connected pages, and a clear student next step.</div>
          <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--alo-text-muted)]">Generate a draft to preview the actual database-backed page structure before saving or sending it for review.</p>
        </div>
      );
      const heroImage = documentImage(document.hero.imageId) || document.images[0];
      const secondaryImage = document.images.find((image) => image.role === 'section') || document.images[1];
      return (
        <div className={`mx-auto w-full transition-all ${previewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-[620px]'}`}>
          <div className="overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--alo-border)] bg-white px-4 py-2.5">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="ml-2 truncate text-[11px] text-[var(--alo-text-muted)]">aloeducation.com/guides/{document.slug}</span></div>
              <div className="flex rounded-lg bg-[var(--alo-surface-muted)] p-0.5">
                <button type="button" aria-label="Desktop preview" onClick={() => setPreviewMode('desktop')} className={`rounded-md p-1.5 ${previewMode === 'desktop' ? 'bg-white text-[var(--alo-text)] shadow-sm' : 'text-[var(--alo-text-muted)]'}`}><PanelRight className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Mobile preview" onClick={() => setPreviewMode('mobile')} className={`rounded-md p-1.5 ${previewMode === 'mobile' ? 'bg-white text-[var(--alo-text)] shadow-sm' : 'text-[var(--alo-text-muted)]'}`}><MousePointer2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="max-h-[740px] overflow-y-auto">
              <div className="relative min-h-[220px] overflow-hidden bg-slate-900">
                {heroImage && <Image src={heroImage.url} alt={heroImage.alt || 'Study destination context'} fill sizes={previewMode === 'mobile' ? '390px' : '620px'} className="object-cover opacity-55" />}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/15" />
                <div className="relative z-10 p-6 sm:p-8">
                  <div className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-white/65">
                    {document.breadcrumbs.map((crumb, index) => <span key={`${crumb.href}-${index}`} className="flex items-center gap-1.5">{index > 0 && <ChevronRight className="h-3 w-3" />}{crumb.label}</span>)}
                  </div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20"><Sparkles className="h-3 w-3" />{document.hero.eyebrow || document.contentType}</div>
                  <h2 className="max-w-lg text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">{document.hero.title}</h2>
                  <p className="mt-3 max-w-lg text-xs leading-5 text-white/80 sm:text-sm">{document.hero.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-orange-500 px-3.5 py-2 text-[11px] font-bold text-white">{document.input.cta || 'Explore your next step'}</span>
                    <span className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-white">Explore connected courses</span>
                  </div>
                </div>
              </div>
              {document.facts.length > 0 && <div className="grid grid-cols-2 gap-2 border-b border-[var(--alo-border)] p-4 sm:grid-cols-3">
                {document.facts.slice(0, 3).map((fact) => <div key={fact.id} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]">{fact.label}</div><div className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--alo-text)]">{fact.status === 'VERIFIED' ? fact.value : 'Information currently being verified'}</div><div className={`mt-1 text-[11px] font-bold ${fact.status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>{fact.status.replaceAll('_', ' ')}</div></div>)}
              </div>}
              <div className="space-y-5 p-5 sm:p-6">
                {document.sections.map((section) => {
                  const sectionImage = section.imageId ? documentImage(section.imageId) : undefined;
                  return <section key={section.id} className="grid gap-3 sm:grid-cols-[1fr_150px]">
                    <div><h3 className="text-sm font-bold text-[var(--alo-text)]">{section.title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-5 text-[var(--alo-body)]">{section.body}</p>{section.bullets && section.bullets.length > 0 && <ul className="mt-2 space-y-1">{section.bullets.slice(0, 3).map((bullet, i) => <li key={i} className="flex gap-1.5 text-[11px] leading-4 text-[var(--alo-body)]"><Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />{bullet}</li>)}</ul>}</div>
                    {sectionImage && <div className="relative min-h-[100px] overflow-hidden rounded-xl border border-[var(--alo-border)] bg-[var(--alo-surface-muted)]"><Image src={sectionImage.url} alt={sectionImage.alt} fill sizes="150px" className="object-cover" /></div>}
                  </section>;
                })}
                {document.faqs.length > 0 && <section className="rounded-xl border border-[var(--alo-border)] p-4"><h3 className="text-sm font-bold text-[var(--alo-text)]">Questions students ask</h3><div className="mt-3 space-y-3">{document.faqs.slice(0, 3).map((faq, index) => <div key={index}><div className="text-xs font-semibold text-[var(--alo-text)]">{faq.question}</div><div className="mt-1 text-[11px] leading-4 text-[var(--alo-text-muted)]">{faq.answer}</div></div>)}</div></section>}
                <div className="rounded-xl bg-blue-50 p-4"><div className="text-xs font-bold text-blue-950">Continue your study journey</div><div className="mt-1 text-[11px] text-blue-800">Connected courses, official sources, and an ALO counsellor are one step away.</div></div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-[var(--alo-text-muted)]"><span>Preview reflects this draft · not public</span><span>{document.contentType} · {document.input.language}</span></div>
        </div>
      );
    }

    if (activeTab === 'validation') {
      if (!document || !validation) return <EmptyTab icon={ShieldCheck} title="Validation report" detail="Generate a page to run fact, entity, link, image, SEO and accessibility checks." />;
      return <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between rounded-xl bg-[var(--alo-page)] p-4"><div><div className="text-sm font-bold text-[var(--alo-text)]">Page health score</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Publishing threshold {validation.criticalPage ? validation.criticalThreshold : validation.threshold}{validation.criticalPage ? ' · critical page' : ''}</div></div><ScoreRing value={validation.score} /></div>
        <div className="grid grid-cols-2 gap-2">{Object.entries(validation.categories).map(([name, value]) => <div key={name} className="rounded-xl border border-[var(--alo-border)] p-3"><div className="flex justify-between text-[11px] font-semibold capitalize text-[var(--alo-body)]"><span>{name}</span><span className="text-[var(--alo-text)]">{value}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]"><div className={`h-full rounded-full ${value >= 80 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${value}%` }} /></div></div>)}</div>
        <div className="space-y-2">{validation.checks.map((item) => <div key={item.key} className="flex items-start gap-2.5 rounded-xl border border-[var(--alo-border)] p-3"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${item.severity === 'PASS' ? 'text-emerald-600' : item.severity === 'BLOCKER' ? 'text-red-500' : 'text-amber-500'}`} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[var(--alo-text)]">{item.label}<span className={`rounded-full px-1.5 py-0.5 text-[11px] uppercase ${item.severity === 'PASS' ? 'bg-emerald-50 text-emerald-700' : item.severity === 'BLOCKER' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{item.severity}</span></div><p className="mt-1 text-[11px] leading-4 text-[var(--alo-text-muted)]">{item.message}</p></div></div>)}</div>
        <div className={`rounded-xl p-3 text-[11px] leading-4 ${validation.canSubmit ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}><b>{validation.canSubmit ? 'Ready for human review.' : 'Publishing remains blocked.'}</b> {validation.canSubmit ? 'A separate authorized reviewer must still approve this content.' : 'Resolve every blocker, verify factual sources and image rights, then re-run validation.'}</div>
      </div>;
    }

    if (activeTab === 'seo') {
      if (!document) return <EmptyTab icon={Target} title="SEO panel" detail="SEO title, description, canonical, target terms and structured data will be checked here." />;
      return <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-xl border border-[var(--alo-border)] p-4"><SmallLabel>Search preview</SmallLabel><div className="mt-3 text-[15px] font-semibold leading-5 text-blue-800">{document.seoTitle || 'SEO title pending'}</div><div className="mt-1 truncate text-[11px] text-emerald-800">aloeducation.com{document.canonicalUrl}</div><div className="mt-1.5 text-[11px] leading-5 text-[var(--alo-body)]">{document.metaDescription || 'Add a concise, source-aware description.'}</div></div>
        <label className="block"><SmallLabel>SEO title · 60 characters max</SmallLabel><input className={fieldClass()} maxLength={70} value={document.seoTitle} onChange={(event) => updateDocument({ seoTitle: event.target.value })} /><div className={`mt-1 text-right text-[11px] ${document.seoTitle.length > 60 ? 'text-red-600' : 'text-[var(--alo-text-muted)]'}`}>{document.seoTitle.length}/60</div></label>
        <label className="block"><SmallLabel>Meta description · 70–160 characters</SmallLabel><textarea className="mt-1.5 min-h-[92px] w-full rounded-xl border border-[var(--alo-border)] p-3 text-xs leading-5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" maxLength={180} value={document.metaDescription} onChange={(event) => updateDocument({ metaDescription: event.target.value })} /><div className={`mt-1 text-right text-[11px] ${document.metaDescription.length > 160 ? 'text-red-600' : 'text-[var(--alo-text-muted)]'}`}>{document.metaDescription.length}/160</div></label>
        <label className="block"><SmallLabel>Target keywords</SmallLabel><input className={fieldClass()} value={document.targetKeywords} onChange={(event) => updateDocument({ targetKeywords: event.target.value })} /></label>
        <div className="rounded-xl bg-purple-50 p-3"><div className="flex items-center gap-2 text-[11px] font-bold text-purple-800"><Sparkles className="h-3.5 w-3.5" />Structured data</div><p className="mt-1 text-[11px] leading-4 text-purple-700">Article JSON-LD is generated from the page title, language, organization and selected entities. Database facts keep their source records.</p><div className="mt-2 font-mono text-[11px] text-purple-600">{String((document.structuredData as any)?.['@type'] || 'Article')} · {document.input.language}</div></div>
      </div>;
    }

    if (activeTab === 'links') {
      if (!document) return <EmptyTab icon={Link2} title="Internal-link panel" detail="Relevant destination, university, course, scholarship and application routes will be mapped here." />;
      return <div className="p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><div className="text-sm font-bold text-[var(--alo-text)]">Connected page graph</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Parent · related entities · onward journey</div></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{document.links.length} links</span></div><div className="space-y-2">{document.links.map((link, index) => <div key={`${link.href}-${index}`} className="flex items-center gap-3 rounded-xl border border-[var(--alo-border)] p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Link2 className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold text-[var(--alo-text)]">{link.label}</div><div className="truncate text-[11px] text-[var(--alo-text-muted)]">{link.href}</div></div><div className="hidden text-right sm:block"><div className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">{link.relationship}</div><div className="mt-1 text-[11px] text-emerald-700">{link.status}</div></div><ArrowUpRight className="h-3.5 w-3.5 text-[var(--alo-text-muted)]" /></div>)}</div><div className="mt-4 rounded-xl bg-[var(--alo-page)] p-3 text-[11px] leading-4 text-[var(--alo-body)]">Related routes are created from database relationships; the builder does not create a link to an entity that it did not match.</div></div>;
    }

    if (activeTab === 'images') {
      if (!document) return <EmptyTab icon={ImageIcon} title="Image & rights panel" detail="Choose contextual media. Missing source, license, alt text or dimensions will block publication." />;
      const library = context?.imageLibrary?.length ? context.imageLibrary : BUILDER_IMAGE_LIBRARY.map((image) => ({ ...image, source: '', license: '', width: 0, height: 0, aspectRatio: 0, verified: false, entityType: image.role, bytes: 0 } as BuilderImage & { bytes: number }));
      return <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-[var(--alo-text)]">Contextual image selection</div><div className="mt-1 text-[11px] leading-4 text-[var(--alo-text-muted)]">Every page needs two meaningful, rights-cleared images. Media selection alone is not a rights verification.</div></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">{document.images.filter((image) => image.verified).length}/2 cleared</span></div>
        <div className="space-y-3">{document.images.map((image, index) => <div key={image.id} className="overflow-hidden rounded-xl border border-[var(--alo-border)]">
          <div className="relative h-32 bg-[var(--alo-surface-muted)]"><Image src={image.url} alt={image.alt} fill sizes="340px" className="object-cover" /><div className="absolute bottom-2 left-2 rounded-full bg-slate-950/70 px-2 py-1 text-[11px] font-bold text-white">{image.role === 'hero' ? 'Hero image' : 'Supporting image'}</div>{image.verified && <div className="absolute right-2 top-2 rounded-full bg-emerald-600 p-1.5 text-white"><BadgeCheck className="h-3.5 w-3.5" /></div>}</div>
          <div className="space-y-2.5 p-3">
            <label className="block"><SmallLabel>Descriptive alt text</SmallLabel><input className={fieldClass()} value={image.alt} onChange={(event) => updateImage(index, { alt: event.target.value }, true)} /></label>
            <div className="grid grid-cols-2 gap-2"><label className="block"><SmallLabel>Source / rights reference</SmallLabel><input className={fieldClass()} placeholder="Source URL or asset record" value={image.source} onChange={(event) => updateImage(index, { source: event.target.value }, true)} /></label><label className="block"><SmallLabel>License / permission</SmallLabel><input className={fieldClass()} placeholder="e.g. owned / licensed" value={image.license} onChange={(event) => updateImage(index, { license: event.target.value }, true)} /></label></div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--alo-border)] pt-2"><div className="text-[11px] text-[var(--alo-text-muted)]">{image.width > 0 ? `${image.width} × ${image.height}px · ${image.aspectRatio.toFixed(2)}:1` : 'Dimensions not checked'} · {image.url}</div><button type="button" disabled={!image.source.trim() || !image.license.trim() || !image.width || !image.height} onClick={() => updateImage(index, { verified: !image.verified })} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${image.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-900 text-white'}`}>{image.verified ? 'Rights verified ✓' : 'Confirm rights & verify'}</button></div>
          </div>
        </div>)}</div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-4 text-amber-800"><b>Required before publishing:</b> image URL exists, actual dimensions are valid, alt text is descriptive, and source plus license/permission are recorded and verified.</div>
        <div><SmallLabel>Other library assets</SmallLabel><div className="mt-2 grid grid-cols-3 gap-2">{library.filter((candidate) => !document.images.some((image) => image.id === candidate.id)).slice(0, 6).map((candidate) => <button type="button" key={candidate.id} onClick={() => {
          const next: BuilderImage = { id: candidate.id, url: candidate.url, alt: candidate.alt, caption: candidate.caption, source: '', license: '', width: candidate.width, height: candidate.height, aspectRatio: candidate.aspectRatio, entityType: candidate.entityType, verified: false, role: document.images.some((image) => image.role === 'section') ? 'section' : 'section' };
          setDocument((current) => current ? { ...current, images: [...current.images, next] } : current);
        }} className="group relative overflow-hidden rounded-lg border border-[var(--alo-border)] text-left"><div className="relative h-16"><Image src={candidate.url} alt={candidate.alt} fill sizes="110px" className="object-cover transition group-hover:scale-105" /></div><div className="truncate p-1.5 text-[11px] font-semibold text-[var(--alo-body)]">{candidate.caption}</div></button>)}</div></div>
      </div>;
    }

    if (activeTab === 'approval') {
      if (!document) return <EmptyTab icon={FileCheck2} title="Approval workflow" detail="Drafts move through validation, independent approval, then an explicit publish action." />;
      const steps = [
        { label: 'AI draft created', detail: document.generationId ? `Generation ${document.generationId.slice(0, 8)}` : 'No generation history', done: Boolean(document.generationId) },
        { label: 'Data & media validated', detail: validation?.canSubmit ? 'Threshold passed' : 'Resolve validation blockers', done: Boolean(validation?.canSubmit) },
        { label: 'Human approval', detail: document.publication.approvedBy ? `Approved ${document.publication.approvedAt ? new Date(document.publication.approvedAt).toLocaleDateString() : ''}` : 'Independent admin review required', done: document.publication.status === 'APPROVED' || document.publication.status === 'PUBLISHED' },
        { label: 'Published page', detail: asset?.publishedUrl || (document.publication.status === 'PUBLISHED' ? `/guides/${document.slug}` : 'Not public'), done: document.publication.status === 'PUBLISHED' },
      ];
      return <div className="space-y-5 p-4 sm:p-5">
        <div className="rounded-[14px] border border-[var(--alo-brand-border)] bg-[var(--alo-blue-soft)] p-4 text-[var(--alo-text)]"><div className="flex items-center justify-between"><div><div className="text-sm font-bold">Publishing control</div><div className="mt-1 text-[11px] leading-4 text-[var(--alo-text-muted)]">AI never publishes directly. Every page has a separate human approval step.</div></div><LockKeyhole className="h-5 w-5 text-orange-300" /></div><div className="mt-3"><StatusPill status={asset?.status || document.publication.status} /></div></div>
        <div className="space-y-0">{steps.map((step, index) => <div key={step.label} className="flex gap-3"><div className="flex flex-col items-center"><div className={`z-10 flex h-7 w-7 items-center justify-center rounded-full ${step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]'}`}>{step.done ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-bold">{index + 1}</span>}</div>{index < steps.length - 1 && <div className={`h-9 w-px ${step.done ? 'bg-emerald-200' : 'bg-slate-200'}`} />}</div><div className="pb-4"><div className="text-[11px] font-bold text-[var(--alo-text)]">{step.label}</div><div className="mt-0.5 text-[11px] text-[var(--alo-text-muted)]">{step.detail}</div></div></div>)}</div>
        {asset && <div className="flex flex-wrap gap-2">{asset.status === 'IN_REVIEW' && <button type="button" disabled={!approvalCanApprove} onClick={() => void handleWorkflowAction('approve')} className="flex items-center gap-1.5 rounded-xl bg-[var(--alo-brand)] px-3 py-2.5 text-[11px] font-bold text-white hover:bg-[var(--alo-brand-hover)] disabled:cursor-not-allowed disabled:opacity-40">{busy === 'approving' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />} Approve as reviewer</button>}{asset.status === 'APPROVED' && <button type="button" disabled={!approvalCanPublish} onClick={() => void handleWorkflowAction('publish')} className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy === 'publishing' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publish page</button>}{asset.status === 'PUBLISHED' && <button type="button" onClick={() => void copyPublicUrl()} className="flex items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 py-2.5 text-[11px] font-bold text-[var(--alo-body)]">{copyState ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copyState ? 'Copied' : 'Copy public URL'}</button>}</div>}
        {!asset && <div className="rounded-xl border border-dashed border-[var(--alo-border-strong)] p-4 text-center"><div className="text-xs font-bold text-[var(--alo-body)]">Save a draft to begin review</div><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">This page has not been saved to the ALO content library yet.</p></div>}
        <div className="rounded-xl border border-[var(--alo-border)] p-3 text-[11px] leading-4 text-[var(--alo-text-muted)]">Approvers re-run current source, duplicate, image, link, and conflict checks. Published builder pages are served at <span className="font-semibold text-[var(--alo-body)]">/guides/{document.slug}</span>.</div>
      </div>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[var(--alo-page)] text-[var(--alo-text)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[236px] shrink-0 flex-col border-r border-[var(--alo-border)] bg-white xl:flex">
          <div className="flex h-[72px] items-center gap-3 border-b border-[var(--alo-border)] px-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] text-white shadow-md shadow-blue-100"><Sparkles className="h-4 w-4" /></div><div><div className="text-sm font-black tracking-tight text-[var(--alo-text)]">ALO Studio</div><div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--alo-text-muted)]">Content intelligence</div></div></div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="px-3 pb-2 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--alo-text-muted)]">Workspace</div>
            <SidebarItem href="/admin/builder" icon={WandSparkles} label="Short-form builder" active />
            <SidebarItem href="/admin/website-cms" icon={Layers3} label="Website CMS" />
            <SidebarItem href="/admin/research" icon={Search} label="Research center" />
            <SidebarItem href="/admin/data-coverage" icon={Activity} label="Data coverage" />
            <SidebarItem href="/admin/seo/orphan-pages" icon={Link2} label="Page graph health" />
            <SidebarItem href="/admin/seo/link-health" icon={Link2} label="Internal link health" />
            <div className="px-3 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--alo-text-muted)]">Manage</div>
            <SidebarItem href="/admin/approvals" icon={FileCheck2} label="Approval queue" />
            <SidebarItem href="/admin/universities" icon={Globe2} label="Universities" />
            <SidebarItem href="/admin/courses" icon={BookOpen} label="Courses" />
            <SidebarItem href="/admin/scholarships" icon={BadgeCheck} label="Scholarships" />
          </div>
          <div className="border-t border-[var(--alo-border)] p-4"><div className="rounded-xl bg-[var(--alo-page)] p-3"><div className="flex items-center gap-2 text-[11px] font-bold text-[var(--alo-body)]"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Safe publishing</div><p className="mt-1 text-[11px] leading-4 text-[var(--alo-text-muted)]">Source checks, human approval and explicit publish controls are always on.</p></div></div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[var(--alo-border)] bg-white/95 px-4 py-3 backdrop-blur md:px-7">
            <div className="min-w-0"><div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--alo-text-muted)]"><Link href="/admin/dashboard" className="hover:text-blue-700">Admin</Link><ChevronRight className="h-3 w-3" /><span className="text-[var(--alo-body)]">Content studio</span></div><div className="mt-1 flex items-center gap-2"><h1 className="text-[18px] font-black tracking-tight text-[var(--alo-text)]">Short-form builder</h1><span className="hidden rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 sm:inline-flex"><Sparkles className="mr-1 h-3 w-3" />ALO AI</span></div></div>
            <div className="flex items-center gap-2"><span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold sm:flex ${context?.databaseStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : error ? 'bg-red-50 text-red-700' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]'}`}><span className={`h-1.5 w-1.5 rounded-full ${context?.databaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />{context?.databaseStatus === 'connected' ? 'DATA CONNECTED' : error ? 'CONNECTION CHECK' : 'CONNECTING'}</span><button type="button" onClick={() => void loadContext()} disabled={busy !== null} className="flex items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 py-2 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><RefreshCw className={`h-3.5 w-3.5 ${busy === 'loading' ? 'animate-spin' : ''}`} />Refresh</button><Link href="/admin/approvals" className="relative flex h-9 items-center gap-1.5 rounded-xl bg-[var(--alo-brand)] px-3 text-[11px] font-bold text-white hover:bg-[var(--alo-brand-hover)]"><FileCheck2 className="h-3.5 w-3.5" />Review queue</Link></div>
          </header>

          <div className="mx-auto max-w-[1680px] space-y-5 p-4 md:p-6 xl:p-7">
            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${error ? 'border-red-200 bg-red-50 text-red-800' : notice?.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : notice?.kind === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-[var(--alo-border)] bg-white text-[var(--alo-body)]'}`}><div className="flex items-start gap-2">{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : notice?.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />}<span>{error || notice?.text}</span></div><button type="button" onClick={() => { setError(null); setNotice(null); }} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}

            <section className="overflow-hidden rounded-[16px] border border-[var(--alo-brand-border)] bg-[var(--alo-blue-soft)] p-5 text-[var(--alo-text)] shadow-[var(--alo-shadow-xs)] md:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-[var(--alo-brand-border)] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--alo-brand)]"><WandSparkles className="h-3.5 w-3.5" />Prompt to publish · with safeguards</div><h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.02em] sm:text-[28px]">One prompt. A complete, connected page.</h2><p className="mt-2 max-w-xl text-xs leading-5 text-[var(--alo-placeholder)] sm:text-sm">ALO AI maps the intent to live course and university records, drafts structured copy, then checks evidence, links, images, SEO and accessibility before a human can publish.</p></div><div className="flex flex-wrap gap-2">{[['01', 'Understand'], ['02', 'Research'], ['03', 'Generate'], ['04', 'Validate'], ['05', 'Approve'], ['06', 'Publish']].map(([number, label], index) => <div key={label} className="flex items-center gap-1.5"><div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${index < (document ? 4 : 1) ? 'bg-[var(--alo-success)] text-white' : index === (document ? 4 : 1) ? 'bg-[var(--alo-brand)] text-white' : 'border border-[var(--alo-border-strong)] text-[var(--alo-text-muted)]'}`}>{index < (document ? 4 : 1) ? <Check className="h-3.5 w-3.5" /> : number}</div><span className="hidden text-[11px] font-semibold text-[var(--alo-text-secondary)] 2xl:inline">{label}</span>{index < 5 && <ChevronRight className="hidden h-3 w-3 text-[var(--alo-body)] 2xl:block" />}</div>)}</div></div>
            </section>

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_410px]">
              <div className="min-w-0 space-y-5">
                <Surface>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--alo-border)] px-5 py-4"><div><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700"><MessageSquareText className="h-4 w-4" /></div><h3 className="text-sm font-bold text-[var(--alo-text)]">Start with an instruction</h3></div><p className="ml-10 mt-0.5 text-[11px] text-[var(--alo-text-muted)]">ALO AI resolves entities first; it doesn’t turn the prompt into unsupported facts.</p></div><div className="flex items-center gap-1.5 rounded-full border border-[var(--alo-border)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--alo-text-muted)]"><LockKeyhole className="h-3 w-3" />Human approval required</div></div>
                  <div className="p-5">
                    <label className="block"><div className="mb-1.5 flex items-center justify-between"><SmallLabel>Prompt</SmallLabel><span className="text-[11px] text-[var(--alo-text-muted)]">{input.prompt.length}/1,600</span></div><textarea value={input.prompt} maxLength={1600} onChange={(event) => setField('prompt', event.target.value)} placeholder="e.g. Create an Australia Computer Science January 2027 guide for Bangladeshi students." className="min-h-[98px] w-full resize-y rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)]/60 px-4 py-3 text-[13px] leading-5 text-[var(--alo-text)] outline-none transition placeholder:text-[var(--alo-text-muted)] focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" /></label>
                    <div className="mt-3 flex flex-wrap gap-2">{[
                      'Create an Australia Computer Science January 2027 guide for Bangladeshi students interested in Computer Science.',
                      'Create a UK study guide for Bangladeshi students interested in Business Management for January 2027.',
                      'Build a scholarship overview for international students in Canada.',
                    ].map((prompt) => <button type="button" key={prompt} onClick={() => setInput((current) => ({ ...current, prompt, country: '', university: '', course: '', subject: '', degree: '', intake: '' }))} className="rounded-full border border-[var(--alo-border)] bg-white px-3 py-1.5 text-left text-[11px] font-semibold text-[var(--alo-body)] transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{prompt}</button>)}</div>
                    <div className="mt-5 flex flex-wrap items-end gap-3"><label className="w-full max-w-[240px]"><SmallLabel>Content type</SmallLabel><select value={input.contentType} onChange={(event) => setField('contentType', event.target.value)} className={fieldClass()}>{ALO_BUILDER_CONTENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><button type="button" onClick={() => setExpandedSettings((value) => !value)} className="flex h-10 items-center gap-2 rounded-xl border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><Settings2 className="h-3.5 w-3.5" />{expandedSettings ? 'Hide page inputs' : 'Page inputs'}<ChevronDown className={`h-3 w-3 transition ${expandedSettings ? 'rotate-180' : ''}`} /></button><div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto"><button type="button" onClick={() => { setDocument(null); setAsset(null); setServerValidation(null); void handleGenerate(); }} disabled={generateDisabled} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-[11px] font-bold text-white shadow-md shadow-violet-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">{busy === 'generating' ? <><LoaderCircle className="h-4 w-4 animate-spin" />Researching & generating…</> : <><Sparkles className="h-4 w-4" />Generate structured page</>}</button></div></div>
                    {expandedSettings && <div className="mt-5 grid gap-x-4 gap-y-3 border-t border-[var(--alo-border)] pt-4 sm:grid-cols-2 xl:grid-cols-3">{inputFields.map((field) => <label key={field.key} className="block"><SmallLabel>{field.label}</SmallLabel>{field.options ? <select value={String(input[field.key])} onChange={(event) => setField(field.key, event.target.value)} className={fieldClass()}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input list={field.key === 'country' ? 'builder-countries' : field.key === 'university' ? 'builder-universities' : field.key === 'course' ? 'builder-courses' : undefined} value={String(input[field.key])} onChange={(event) => setField(field.key, event.target.value)} placeholder={field.placeholder} className={fieldClass()} />}</label>)}<label className="block"><SmallLabel>Publishing status</SmallLabel><select value={input.publishingStatus} onChange={(event) => setField('publishingStatus', event.target.value)} className={fieldClass()}><option value="DRAFT">Draft — private</option><option value="REQUEST_REVIEW">Request review — never auto-publish</option></select></label><datalist id="builder-countries">{context?.countries.map((country) => <option key={country.id} value={country.name} />)}</datalist><datalist id="builder-universities">{context?.universities.map((university) => <option key={university.id} value={university.name}>{university.country} · {university.city}</option>)}</datalist><datalist id="builder-courses">{context?.courses.map((course) => <option key={course.id} value={course.courseTitle}>{course.university?.name} · {course.subjectArea}</option>)}</datalist></div>}
                  </div>
                </Surface>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]">
                  <Surface className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[var(--alo-border)] px-5 py-4"><div><h3 className="text-sm font-bold text-[var(--alo-text)]">Page structure</h3><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Editable copy · factual values remain tied to evidence</p></div>{document && <StatusPill status={asset?.status || document.publication.status} />}</div>
                    {!document ? <div className="p-7"><div className="rounded-2xl border border-dashed border-[var(--alo-border-strong)] bg-[var(--alo-page)]/70 p-7 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700"><Bot className="h-5 w-5" /></div><div className="mt-3 text-sm font-bold text-[var(--alo-text)]">Ready when you are</div><p className="mx-auto mt-1 max-w-sm text-[11px] leading-5 text-[var(--alo-text-muted)]">The AI will identify matching database records, build a page outline and attach relevant links. No facts will be written without evidence.</p><button type="button" onClick={() => void handleGenerate()} disabled={generateDisabled} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--alo-brand)] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[var(--alo-brand-hover)] disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />Generate your first draft</button></div></div> : <div className="space-y-4 p-5">
                      <label className="block"><SmallLabel>Page title</SmallLabel><input className={fieldClass()} value={document.title} disabled={!canEdit} onChange={(event) => updateDocument({ title: event.target.value })} /></label>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"><div className="flex items-center justify-between gap-2"><div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Hero section</div><span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-blue-700">{document.contentType}</span></div><label className="mt-2 block"><span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Heading</span><input className="mt-1 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-100" value={document.hero.title} disabled={!canEdit} onChange={(event) => updateDocument({ hero: { ...document.hero, title: event.target.value } })} /></label><label className="mt-2 block"><span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Introduction</span><textarea className="mt-1 min-h-[86px] w-full resize-y rounded-lg border border-blue-100 bg-white p-3 text-[11px] leading-5 outline-none focus:ring-2 focus:ring-blue-100" value={document.hero.description} disabled={!canEdit} onChange={(event) => updateDocument({ hero: { ...document.hero, description: event.target.value } })} /></label></div>
                      {document.sections.map((section, index) => <div key={section.id} className="rounded-xl border border-[var(--alo-border)] p-3.5"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--alo-text-muted)]">SECTION {String(index + 1).padStart(2, '0')}</span><span className="rounded-md bg-[var(--alo-surface-muted)] px-2 py-1 text-[11px] font-semibold capitalize text-[var(--alo-text-muted)]">{section.type}</span></div><input className="w-full border-b border-[var(--alo-border)] pb-2 text-xs font-bold outline-none focus:border-blue-300" value={section.title} disabled={!canEdit} onChange={(event) => updateSection(index, { title: event.target.value })} /><textarea className="mt-2 min-h-[94px] w-full resize-y text-[11px] leading-5 text-[var(--alo-body)] outline-none" value={section.body} disabled={!canEdit} onChange={(event) => updateSection(index, { body: event.target.value })} />{section.bullets && section.bullets.length > 0 && <div className="mt-1 space-y-1">{section.bullets.map((bullet, bulletIndex) => <div key={bulletIndex} className="flex gap-1.5 text-[11px] text-[var(--alo-text-muted)]"><Check className="h-3 w-3 text-emerald-600" />{bullet}</div>)}</div>}</div>)}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--alo-border)] pt-4"><div className="flex items-center gap-2"><ScoreRing value={validation?.score || 0} size="small" /><div><div className="text-[11px] font-bold text-[var(--alo-text)]">Page health</div><div className="text-[11px] text-[var(--alo-text-muted)]">{validation?.canSubmit ? 'Threshold met' : 'Checks need attention'}</div></div></div><button type="button" onClick={() => setActiveTab('validation')} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900">Review checks <ArrowRight className="h-3 w-3" /></button></div>
                    </div>}
                  </Surface>

                  <Surface className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[var(--alo-border)] px-4 py-3"><div><h3 className="text-sm font-bold text-[var(--alo-text)]">Page workspace</h3><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Preview, review and publish controls</p></div><div className="hidden items-center gap-1 rounded-xl bg-[var(--alo-surface-muted)] p-1 sm:flex">{tabs.slice(0, 2).map((tab) => <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${activeTab === tab.id ? 'bg-white text-[var(--alo-text)] shadow-sm' : 'text-[var(--alo-text-muted)]'}`}>{tab.label}</button>)}</div></div>
                    <div className="border-b border-[var(--alo-border)] px-2 pt-2"><div className="flex gap-1 overflow-x-auto">{tabs.map((tab) => { const Icon = tab.icon; return <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-1.5 rounded-t-lg px-2.5 py-2 text-[11px] font-bold transition ${activeTab === tab.id ? 'border-b-2 border-blue-600 bg-blue-50/60 text-blue-700' : 'text-[var(--alo-text-muted)] hover:bg-[var(--alo-page)] hover:text-[var(--alo-text)]'}`}><Icon className="h-3.5 w-3.5" />{tab.label}{tab.id === 'validation' && document && !validation?.canSubmit && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}</button>; })}</div></div>
                    <div className="min-h-[450px]">{renderTabContent()}</div>
                  </Surface>
                </div>

                {document && <Surface className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ListChecks className="h-4 w-4" /></div><div><div className="text-[11px] font-bold text-[var(--alo-text)]">Human controlled publishing</div><div className="text-[11px] text-[var(--alo-text-muted)]">Save draft → meet quality threshold → independent approval → publish</div></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saveDisabled} onClick={() => void handleSave(false)} className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)] disabled:cursor-not-allowed disabled:opacity-40">{busy === 'saving' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}Save draft</button><button type="button" disabled={submitDisabled} title={!validation?.canSubmit ? 'Resolve all blockers and reach the publishing score threshold first.' : 'Submit for independent admin approval'} onClick={() => void handleSave(true)} className="flex h-9 items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 text-[11px] font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">{busy === 'submitting' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Request approval</button><button type="button" onClick={() => setActiveTab('approval')} className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--alo-brand)] px-3.5 text-[11px] font-bold text-white hover:bg-[var(--alo-brand-hover)]"><LockKeyhole className="h-3.5 w-3.5" />Publish controls</button></div></Surface>}
              </div>

              <aside className="min-w-0 space-y-5">
                <Surface className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--alo-border)] px-4 py-3.5"><div><h3 className="text-xs font-bold text-[var(--alo-text)]">Reusable templates</h3><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Start from a page shape, not a blank canvas</p></div><span className="rounded-full bg-[var(--alo-surface-muted)] px-2 py-1 text-[11px] font-bold text-[var(--alo-text-muted)]">{quickTemplates.length + savedTemplates.length}</span></div>
                  <div className="space-y-2 p-3">{quickTemplates.map((template) => <button type="button" key={template.title} onClick={() => { setInput(template.input); setDocument(null); setAsset(null); }} className="group flex w-full gap-3 rounded-xl border border-[var(--alo-border)] p-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40"><div className="relative h-[58px] w-[78px] shrink-0 overflow-hidden rounded-lg bg-[var(--alo-surface-muted)]"><Image src={template.image} alt={template.alt} fill sizes="78px" className="object-cover transition duration-300 group-hover:scale-105" /></div><div className="min-w-0 flex-1 self-center"><div className="truncate text-[11px] font-bold text-[var(--alo-text)]">{template.title}</div><div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--alo-text-muted)]">{template.subtitle}</div></div><ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-[var(--alo-placeholder)] group-hover:text-blue-600" /></button>)}
                    {savedTemplates.map((template) => <button type="button" key={template.id} onClick={() => template.data?.input && setInput(template.data.input)} className="flex w-full items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/40 p-3 text-left hover:bg-purple-50"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-purple-700"><Layers3 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold text-[var(--alo-text)]">{template.label}</div><div className="text-[11px] text-[var(--alo-text-muted)]">Saved template</div></div><ChevronRight className="h-3 w-3 text-[var(--alo-text-muted)]" /></button>)}
                  </div>
                  <div className="border-t border-[var(--alo-border)] p-3"><div className="flex gap-2"><input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Name current settings as template" className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--alo-border)] px-2.5 text-[11px] outline-none focus:border-purple-300" /><button type="button" onClick={() => void saveTemplate()} disabled={!templateName.trim() || busy !== null} className="flex h-9 items-center gap-1 rounded-lg bg-purple-600 px-2.5 text-[11px] font-bold text-white disabled:opacity-40"><Plus className="h-3 w-3" />Save</button></div></div>
                </Surface>

                <Surface className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--alo-border)] px-4 py-3.5"><div><h3 className="text-xs font-bold text-[var(--alo-text)]">Recent drafts</h3><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Your builder content library</p></div><button type="button" onClick={() => void loadContext()} aria-label="Refresh drafts" className="rounded-lg p-1.5 text-[var(--alo-text-muted)] hover:bg-[var(--alo-surface-muted)]"><RefreshCw className="h-3.5 w-3.5" /></button></div>
                  <div className="divide-y divide-[var(--alo-border)]">{recent.length ? recent.slice(0, 5).map((draft) => <button type="button" key={draft.id} onClick={() => void loadDraft(draft.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--alo-page)]"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FileText className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold text-[var(--alo-text)]">{draft.title}</div><div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--alo-text-muted)]"><Clock3 className="h-2.5 w-2.5" />{new Date(draft.updatedAt).toLocaleDateString()}</div></div><div className="flex shrink-0 flex-col items-end gap-1"><StatusPill status={draft.status} /><span className="text-[11px] text-[var(--alo-text-muted)]">{draft.qualityScore}/100</span></div></button>) : <div className="p-5 text-center"><div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]"><FileText className="h-4 w-4" /></div><div className="mt-2 text-[11px] font-bold text-[var(--alo-body)]">No builder drafts yet</div><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Generated content appears here after you save it.</p></div>}</div>
                </Surface>

                <Surface className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--alo-border)] px-4 py-3.5"><div><h3 className="text-xs font-bold text-[var(--alo-text)]">AI generation history</h3><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Auditable prompt and model activity</p></div><Activity className="h-4 w-4 text-purple-600" /></div>
                  <div className="space-y-2 p-3">{generations.length ? generations.slice(0, 5).map((generation) => <div key={generation.id} className="rounded-xl border border-[var(--alo-border)] p-3"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700"><Bot className="h-3.5 w-3.5" /></div><div className="truncate text-[11px] font-bold text-[var(--alo-body)]">{generation.label}</div></div><span className="shrink-0 text-[11px] text-[var(--alo-text-muted)]">{new Date(generation.createdAt).toLocaleDateString()}</span></div><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[var(--alo-text-muted)]">{generation.prompt || generation.summary || 'Structured content generation completed.'}</p></div>) : <div className="rounded-xl border border-dashed border-[var(--alo-border)] p-4 text-center"><div className="text-[11px] font-semibold text-[var(--alo-body)]">No generation history yet</div><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Each successful AI run will record its prompt, model and output snapshot.</p></div>}</div>
                </Surface>

                <Surface className="overflow-hidden">
                  <div className="relative h-[120px]"><Image src="/images/services/english-test.png" alt="English test preparation as part of a study abroad plan" fill sizes="400px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent" /><div className="absolute bottom-3 left-4 right-4"><div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70"><Sparkles className="h-3 w-3" />Quality guardrail</div><div className="mt-1 text-[12px] font-bold text-white">Facts need a source. Pages need a reviewer.</div></div></div>
                  <div className="grid grid-cols-3 divide-x divide-[var(--alo-border)] p-3 text-center"><div><div className="text-[11px] font-bold text-[var(--alo-text)]">FACTS</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Evidence-linked</div></div><div><div className="text-[11px] font-bold text-[var(--alo-text)]">LINKS</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Entity-aware</div></div><div><div className="text-[11px] font-bold text-[var(--alo-text)]">PUBLISH</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Human-approved</div></div></div>
                </Surface>
              </aside>
            </div>

            <Surface className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--alo-border)] px-5 py-4"><div><h3 className="text-sm font-bold text-[var(--alo-text)]">Connected content graph</h3><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Every new guide maps to useful existing pages; no orphaned content is intentionally created.</p></div><Link href="/admin/seo/orphan-pages" className="flex items-center gap-1.5 rounded-lg border border-[var(--alo-border)] px-3 py-2 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]">Open graph audit <ArrowUpRight className="h-3 w-3" /></Link></div>
              <div className="grid gap-3 p-4 sm:grid-cols-5">{[
                { icon: Globe2, title: 'Country', color: 'bg-blue-50 text-blue-700' },
                { icon: Layers3, title: 'University', color: 'bg-indigo-50 text-indigo-700' },
                { icon: BookOpen, title: 'Course', color: 'bg-violet-50 text-violet-700' },
                { icon: BadgeCheck, title: 'Scholarship', color: 'bg-emerald-50 text-emerald-700' },
                { icon: ArrowDownRight, title: 'Application', color: 'bg-orange-50 text-orange-700' },
              ].map((node, index) => { const Icon = node.icon; return <div key={node.title} className="relative flex items-center gap-2.5 rounded-xl border border-[var(--alo-border)] bg-white px-3 py-3"><div className={`flex h-8 w-8 items-center justify-center rounded-xl ${node.color}`}><Icon className="h-4 w-4" /></div><div className="text-[11px] font-bold text-[var(--alo-body)]">{node.title}</div>{index < 4 && <ChevronRight className="absolute -right-3 z-10 hidden h-4 w-4 bg-white text-[var(--alo-placeholder)] sm:block" />}</div>; })}</div>
            </Surface>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ href, icon: Icon, label, active = false }: { href: string; icon: typeof WandSparkles; label: string; active?: boolean }) {
  return <Link href={href} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-[var(--alo-body)] hover:bg-[var(--alo-page)] hover:text-[var(--alo-text)]'}`}><Icon className="h-4 w-4" />{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}</Link>;
}

function EmptyTab({ icon: Icon, title, detail }: { icon: typeof Link2; title: string; detail: string }) {
  return <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]"><Icon className="h-5 w-5" /></div><div className="mt-3 text-sm font-bold text-[var(--alo-text)]">{title}</div><p className="mt-1 max-w-xs text-[11px] leading-5 text-[var(--alo-text-muted)]">{detail}</p></div>;
}
