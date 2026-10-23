'use client';

// ============================================================================
// ADMIN CONTENT MANAGER (spec §45-§46) — Super Admin management for
// Services, Scholarships and Resources with obvious manual creation buttons:
//   + Add Service / + Add Scholarship / + Add Resource / + Add FAQ /
//   + Add Related Content / + Add Official Source
// All writes go through the existing admin APIs (RBAC + audit logs).
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, RefreshCw, CheckCircle2, EyeOff, Eye, Trash2, Link2, Shield, FileQuestion, ExternalLink } from 'lucide-react';

type Kind = 'services' | 'scholarships' | 'resources';

const KIND_META: Record<Kind, { title: string; addLabel: string; listApi: string; createApi: string; itemApi: (id: string) => string; nameField: string; describe: (x: any) => string; }> = {
  services: {
    title: 'Services', addLabel: '+ Add Service',
    listApi: '/api/admin/services', createApi: '/api/admin/services', itemApi: (id) => `/api/admin/services/${id}`,
    nameField: 'title', describe: (x) => x.shortDescription || '',
  },
  scholarships: {
    title: 'Scholarships', addLabel: '+ Add Scholarship',
    listApi: '/api/admin/scholarships', createApi: '/api/admin/scholarships', itemApi: (id) => `/api/admin/scholarships/${id}`,
    nameField: 'name', describe: (x) => `${x.university || 'Multiple universities'} — ${x.country || 'Global'}`,
  },
  resources: {
    title: 'Resources', addLabel: '+ Add Resource',
    listApi: '/api/admin/resources', createApi: '/api/admin/resources', itemApi: (id) => `/api/admin/resources/${id}`,
    nameField: 'title', describe: (x) => x.excerpt || x.summary || '',
  },
};

const VERIFICATION_STATUSES = ['verified', 'needs_verification', 'expired', 'unverified'] as const;

export default function AdminContentManager() {
  const [kind, setKind] = useState<Kind>('services');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | 'create' | 'edit' | 'faq' | 'related' | 'source'>(null);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const meta = KIND_META[kind];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(meta.listApi);
      if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'Sign in as SUPER_ADMIN or ADMIN to manage content.' : `Failed to load (${res.status})`);
      const data = await res.json();
      setItems(data[kind] || data.items || data.data || []);
    } catch (e: any) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [meta]);

  useEffect(() => { setPanel(null); setActive(null); load(); }, [kind, load]);

  const visible = items.filter((x) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return String(x[meta.nameField] || '').toLowerCase().includes(q) || String(x.slug || '').toLowerCase().includes(q);
  });

  const say = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const isEdit = panel === 'edit' && active?.id;
      const payload = { ...form };
      if (!payload.slug && payload[meta.nameField]) {
        payload.slug = String(payload[meta.nameField]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      const res = await fetch(isEdit ? meta.itemApi(active.id) : meta.createApi, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      say(isEdit ? 'Saved — change is audit-logged.' : 'Created — change is audit-logged.');
      setPanel(null);
      setActive(null);
      setForm({});
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, patchBody: any, doneMsg: string) => {
    try {
      const res = await fetch(meta.itemApi(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchBody) });
      if (!res.ok) throw new Error((await res.json()).error || `Failed (${res.status})`);
      say(doneMsg);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this record permanently? The deletion is audit-logged.')) return;
    try {
      const res = await fetch(meta.itemApi(id), { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || `Failed (${res.status})`);
      say('Deleted — change is audit-logged.');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveFaq = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, targetType: kind.replace(/s$/, ''), targetId: active?.id || '', targetSlug: active?.slug || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save FAQ');
      say('FAQ added — change is audit-logged.');
      setPanel(null); setActive(null); setForm({});
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const saveRelated = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: form.sourceType || kind.replace(/s$/, '').toUpperCase(), sourceId: active?.id || form.sourceId, targetType: form.targetType, targetId: form.targetId, relationshipType: form.relationshipType || 'related', sortOrder: Number(form.sortOrder) || 0, status: 'ACTIVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add related content');
      say('Related content linked — change is audit-logged.');
      setPanel(null); setActive(null); setForm({});
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const saveSource = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/official-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, targetType: kind.replace(/s$/, ''), targetId: active?.id || '', targetSlug: active?.slug || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add official source');
      say('Official source added with verification status — audit-logged.');
      setPanel(null); setActive(null); setForm({});
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const editFields: { key: string; label: string; area?: boolean }[] = kind === 'services'
    ? [
        { key: 'title', label: 'Service title' }, { key: 'slug', label: 'Slug' },
        { key: 'shortDescription', label: 'Short description', area: true },
        { key: 'description', label: 'Description', area: true }, { key: 'content', label: 'Full content (what/why/process…)', area: true },
        { key: 'icon', label: 'Icon' }, { key: 'heroImage', label: 'Hero image URL' },
        { key: 'timeline', label: 'Timeline guidance' }, { key: 'fees', label: 'Fees (only when publicly approved)' },
        { key: 'sourceUrl', label: 'Source URL' }, { key: 'sourceName', label: 'Source name' },
        { key: 'seoTitle', label: 'SEO title' }, { key: 'seoDescription', label: 'Meta description', area: true },
      ]
    : kind === 'scholarships'
    ? [
        { key: 'name', label: 'Scholarship name' }, { key: 'slug', label: 'Slug' },
        { key: 'country', label: 'Country' }, { key: 'university', label: 'University' },
        { key: 'studyLevel', label: 'Study level' }, { key: 'subject', label: 'Subject' },
        { key: 'scholarshipType', label: 'Scholarship type (merit_based / need_based / …)' },
        { key: 'fundingType', label: 'Funding type (full_funding / partial / tuition_waiver / …)' },
        { key: 'amount', label: 'Amount (number)' }, { key: 'currency', label: 'Currency' },
        { key: 'fundingAmount', label: 'Funding amount (display, e.g. "£5,000")' },
        { key: 'coverage', label: 'Coverage (Tuition/Living/…)', area: true },
        { key: 'intake', label: 'Intake' }, { key: 'deadline', label: 'Deadline (display)' },
        { key: 'applicationMethod', label: 'Application method (automatic / separate)' },
        { key: 'applicationUrl', label: 'Application URL' },
        { key: 'eligibility', label: 'Eligibility', area: true },
        { key: 'minimumRequirements', label: 'Minimum requirements', area: true },
        { key: 'overview', label: 'Overview', area: true },
        { key: 'officialSourceUrl', label: 'Official source URL' }, { key: 'sourceName', label: 'Source name' },
        { key: 'seoTitle', label: 'SEO title' }, { key: 'seoDescription', label: 'Meta description', area: true },
      ]
    : [
        { key: 'title', label: 'Article title' }, { key: 'slug', label: 'Slug' },
        { key: 'summary', label: 'Summary', area: true },
        { key: 'detailedExplanation', label: 'Main content', area: true },
        { key: 'authorId', label: 'Author' }, { key: 'countrySlug', label: 'Country slug' },
        { key: 'studyLevel', label: 'Study level' }, { key: 'readingTime', label: 'Reading time (min)' },
        { key: 'featuredImage', label: 'Featured image URL (legally usable)' },
        { key: 'sourceUrl', label: 'Source URL' }, { key: 'sourceName', label: 'Source name' },
        { key: 'seoTitle', label: 'SEO title' }, { key: 'seoDescription', label: 'Meta description', area: true },
      ];

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header + system switcher */}
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-6 md:p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Content management</Badge>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Services · Scholarships · Resources</h1>
              <p className="text-sm text-[var(--alo-body)] mt-1">Manage all three public content systems. No developer or database editing is required for normal content management.</p>
            </div>
            <div className="flex gap-2" role="tablist" aria-label="Content system">
              {(Object.keys(KIND_META) as Kind[]).map((k) => (
                <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`px-4 h-11 rounded-xl text-sm font-bold transition-colors ${kind === k ? 'bg-[var(--alo-brand)] text-white' : 'bg-white border border-[var(--alo-border)] text-[var(--alo-body)]'}`}>{KIND_META[k].title}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <Button onClick={() => { setPanel('create'); setForm({}); }} className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-11 font-bold"><Plus className="w-4 h-4 mr-1" />{meta.addLabel}</Button>
            <Button variant="outline" onClick={() => { setPanel('faq'); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11"><FileQuestion className="w-4 h-4 mr-1" />+ Add FAQ</Button>
            <Button variant="outline" onClick={() => { setPanel('related'); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11"><Link2 className="w-4 h-4 mr-1" />+ Add Related Content</Button>
            <Button variant="outline" onClick={() => { setPanel('source'); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11"><Shield className="w-4 h-4 mr-1" />+ Add Official Source</Button>
            <Button variant="outline" onClick={load} className="border-[var(--alo-border)] "><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          </div>
        </div>

        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm" role="status">{toast}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm" role="alert">{error}</div>}

        {/* Editor / action panels */}
        {panel === 'create' || panel === 'edit' ? (
          <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <h2 className="font-bold text-lg text-[var(--alo-text)] mb-1">{panel === 'create' ? meta.addLabel : `Edit ${active?.[meta.nameField] || ''}`}</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mb-4">Status/verification are managed on the list row. Saved without unverified claims — ALO never fabricates data.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {editFields.map((f) => f.area ? (
                <div key={f.key} className="md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor={`f_${f.key}`}>{f.label}</label>
                  <Textarea id={`f_${f.key}`} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="bg-white border-[var(--alo-border)] min-h-[90px]" />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor={`f_${f.key}`}>{f.label}</label>
                  <Input id={`f_${f.key}`} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={save} disabled={busy} className="bg-[var(--alo-brand)] text-white px-8 font-bold">{busy ? 'Saving…' : panel === 'create' ? 'Create (DRAFT, unpublished by default)' : 'Save changes'}</Button>
              <Button variant="outline" onClick={() => { setPanel(null); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11">Cancel</Button>
            </div>
          </Card>
        ) : null}

        {panel === 'faq' ? (
          <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <h2 className="font-bold text-lg text-[var(--alo-text)] mb-1">+ Add FAQ {active ? `for ${active[meta.nameField]}` : `for ${meta.title}`}</h2>
            <div className="grid gap-3 mt-3">
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="faq_q">Question</label><Input id="faq_q" value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="faq_a">Answer (verified information only)</label><Textarea id="faq_a" value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="bg-white border-[var(--alo-border)] min-h-[100px]" /></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="faq_t">Target slug (optional)</label><Input id="faq_t" value={form.targetSlug || active?.slug || ''} onChange={(e) => setForm({ ...form, targetSlug: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
                <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="faq_c">Category</label><Input id="faq_c" value={form.category || 'general'} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
                <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="faq_s">Sort order</label><Input id="faq_s" value={form.sortOrder || 0} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveFaq} disabled={busy || !form.question || !form.answer} className="bg-[var(--alo-brand)] text-white px-8 font-bold">{busy ? 'Saving…' : 'Save FAQ'}</Button>
              <Button variant="outline" onClick={() => { setPanel(null); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11">Cancel</Button>
            </div>
          </Card>
        ) : null}

        {panel === 'related' ? (
          <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <h2 className="font-bold text-lg text-[var(--alo-text)] mb-1">+ Add Related Content {active ? `for ${active[meta.nameField]}` : ''}</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mb-3">The unified relationship engine connects services ↔ scholarships ↔ resources ↔ courses — only relevant links, never random.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="rel_st">Source type</label><Input id="rel_st" value={form.sourceType || (active ? kind.replace(/s$/, '').toUpperCase() : '')} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="rel_si">Source id {active && '(pre-filled)'}</label><Input id="rel_si" value={form.sourceId || active?.id || ''} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="rel_tt">Target type (SERVICE / SCHOLARSHIP / RESOURCE / COURSE / UNIVERSITY / COUNTRY)</label><Input id="rel_tt" value={form.targetType || ''} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="rel_ti">Target id</label><Input id="rel_ti" value={form.targetId || ''} onChange={(e) => setForm({ ...form, targetId: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="rel_rt">Relationship type</label><Input id="rel_rt" value={form.relationshipType || 'related'} onChange={(e) => setForm({ ...form, relationshipType: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="rel_so">Sort order</label><Input id="rel_so" value={form.sortOrder || 0} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveRelated} disabled={busy || !form.targetType || (!form.targetId && false)} className="bg-[var(--alo-brand)] text-white px-8 font-bold">{busy ? 'Saving…' : 'Link content'}</Button>
              <Button variant="outline" onClick={() => { setPanel(null); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11">Cancel</Button>
            </div>
          </Card>
        ) : null}

        {panel === 'source' ? (
          <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <h2 className="font-bold text-lg text-[var(--alo-text)] mb-1">+ Add Official Source {active ? `for ${active[meta.nameField]}` : ''}</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mb-3">Prefer: official university / government / visa authority / test provider / scholarship provider. Source text is never copied word-for-word.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="src_url">Official source URL (https://…)</label><Input id="src_url" value={form.sourceUrl || ''} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="src_title">Source name/title</label><Input id="src_title" value={form.sourceTitle || ''} onChange={(e) => setForm({ ...form, sourceTitle: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="src_type">Source type</label>
                <select id="src_type" value={form.sourceType || 'official_university'} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 text-sm h-11 w-full">
                  <option value="official_university">Official university website</option>
                  <option value="official_government">Official government website</option>
                  <option value="official_visa_authority">Official visa authority</option>
                  <option value="official_test_provider">Official test provider</option>
                  <option value="official_scholarship">Official scholarship provider</option>
                  <option value="ALO_editorial">ALO editorial</option>
                  <option value="other">Other</option>
                </select></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="src_ds">Data section (tuition / scholarship / deadline / visa /…)</label><Input id="src_ds" value={form.dataSection || ''} onChange={(e) => setForm({ ...form, dataSection: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="src_vs">Verification status</label>
                <select id="src_vs" value={form.verificationStatus || 'pending'} onChange={(e) => setForm({ ...form, verificationStatus: e.target.value })} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 text-sm h-11 w-full">
                  <option value="verified">Verified</option><option value="pending">Needs verification</option><option value="needs_review">Needs review</option>
                </select></div>
              <div><label className="text-xs font-semibold text-[var(--alo-body)]" htmlFor="src_ts">Target slug (optional)</label><Input id="src_ts" value={form.targetSlug || active?.slug || ''} onChange={(e) => setForm({ ...form, targetSlug: e.target.value })} className="bg-white border-[var(--alo-border)] h-11" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveSource} disabled={busy || !form.sourceUrl} className="bg-[var(--alo-brand)] text-white px-8 font-bold">{busy ? 'Saving…' : 'Add source'}</Button>
              <Button variant="outline" onClick={() => { setPanel(null); setActive(null); setForm({}); }} className="border-[var(--alo-border)] h-11">Cancel</Button>
            </div>
          </Card>
        ) : null}

        {/* List */}
        <Card className="bg-white border-[var(--alo-border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 flex flex-wrap gap-3 items-center justify-between border-b border-[var(--alo-border)]">
            <h2 className="font-bold text-[var(--alo-text)]">{meta.title} ({visible.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" aria-hidden />
              <Input aria-label={`Search ${meta.title}`} placeholder="Search by name or slug…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[var(--alo-border)] h-10" />
            </div>
          </div>
          {loading ? (
            <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[var(--alo-page)] rounded-xl animate-pulse" />)}</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--alo-text-muted)]">{error ? 'Could not load content.' : 'No records yet — use the creation buttons above.'}</div>
          ) : (
            <div className="divide-y divide-[var(--alo-border)]">
              {visible.map((x: any) => {
                const isPublished = String(x.status || '').toUpperCase() === 'PUBLISHED' || String(x.status || '') === 'active';
                return (
                  <div key={x.id} className="p-4 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[var(--alo-text)]">{x[meta.nameField] || x.slug}</span>
                        <Badge className={`text-[11px] ${isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]'}`}>{x.status || 'UNKNOWN'}</Badge>
                        <Badge className={`text-[11px] ${/verified/i.test(String(x.verificationStatus || '')) && !/un|needs/i.test(String(x.verificationStatus || '')) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{x.verificationStatus || 'unverified'}</Badge>
                      </div>
                      <p className="text-xs text-[var(--alo-text-muted)] mt-1 line-clamp-1">{meta.describe(x)} • /{x.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" className=" border-[var(--alo-border)] " onClick={() => { setPanel('edit'); setActive(x); setForm(x); }}>Edit</Button>
                      <Button size="sm" variant="outline" className=" border-[var(--alo-border)] " onClick={() => patch(x.id, { status: isPublished ? 'DRAFT' : 'PUBLISHED' }, isPublished ? 'Unpublished.' : 'Published.')} aria-label={`Publish or unpublish ${x[meta.nameField]}`}>
                        {isPublished ? <><EyeOff className="w-3.5 h-3.5 mr-1" />Unpublish</> : <><Eye className="w-3.5 h-3.5 mr-1" />Publish</>}
                      </Button>
                      <Button size="sm" variant="outline" className=" border-emerald-300 text-emerald-700 " onClick={() => patch(x.id, { verificationStatus: 'VERIFIED', lastVerifiedAt: new Date().toISOString() }, 'Marked verified — timestamp recorded.')}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Verify
                      </Button>
                      <Button size="sm" variant="outline" className=" border-[var(--alo-border)] " onClick={() => { setPanel('faq'); setActive(x); setForm({}); }}>+ FAQ</Button>
                      <Button size="sm" variant="outline" className=" border-[var(--alo-border)] " onClick={() => { setPanel('related'); setActive(x); setForm({}); }}>+ Related</Button>
                      <Button size="sm" variant="outline" className=" border-[var(--alo-border)] " onClick={() => { setPanel('source'); setActive(x); setForm({}); }}>+ Source</Button>
                      <Button size="sm" variant="outline" className=" border-red-200 text-red-600 " onClick={() => remove(x.id)} aria-label={`Delete ${x[meta.nameField]}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <p className="text-[11px] text-[var(--alo-text-muted)]">Every create/edit/delete/publish/verify action is audit-logged. Public pages render only PUBLISHED/active records — unpublished content never leaks.</p>
      </div>
    </div>
  );
}
