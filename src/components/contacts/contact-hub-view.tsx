'use client';

/**
 * Company Contact Hub — shared, functional UI for every /crm/contacts/* view.
 *
 * Every value comes from a live API. Loading, empty, error and "unavailable"
 * states are explicit; there are no decorative controls, sample rows or
 * invented KPIs. Buttons always perform a real request or navigate to a real
 * route.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type View = 'list' | 'detail' | 'import' | 'duplicates' | 'consent' | 'segments' | 'audit';

const NAV: Array<{ href: string; label: string; view: View }> = [
  { href: '/crm/contacts', label: 'Contacts', view: 'list' },
  { href: '/crm/contacts/import', label: 'Import', view: 'import' },
  { href: '/crm/contacts/duplicates', label: 'Duplicates', view: 'duplicates' },
  { href: '/crm/contacts/consent', label: 'Consent', view: 'consent' },
  { href: '/crm/contacts/segments', label: 'Segments', view: 'segments' },
  { href: '/crm/contacts/audit', label: 'Audit', view: 'audit' },
];

const BRAND = 'var(--alo-brand)';
const CTA = 'var(--alo-cta-solid, #E8501A)';
const PAGE = 'var(--alo-page, #f6f8fb)';
const SURFACE = 'var(--alo-surface, #ffffff)';
const BORDER = 'var(--alo-border, #e2e8f0)';
const TEXT = 'var(--alo-text, #0f172a)';
const MUTED = 'var(--alo-text-muted, #64748b)';

const card: React.CSSProperties = {
  background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18,
};
const input: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 9, border: `1px solid ${BORDER}`,
  background: SURFACE, color: TEXT, fontSize: 13,
};
const button: React.CSSProperties = {
  padding: '9px 14px', borderRadius: 9, border: 'none', background: CTA, color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const secondary: React.CSSProperties = {
  ...button, background: SURFACE, color: BRAND, border: `1px solid ${BRAND}`,
};

async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  let data: T;
  try { data = (await response.json()) as T; } catch { data = {} as T; }
  return { ok: response.ok, status: response.status, data };
}

function StatusLine({ loading, error, empty, count }: { loading: boolean; error: string; empty?: boolean; count?: number }) {
  if (loading) return <p style={{ color: MUTED, fontSize: 13 }}>Loading live CRM data…</p>;
  if (error) return <p style={{ color: '#b42318', fontSize: 13 }}>Unavailable: {error}</p>;
  if (empty) return <p style={{ color: MUTED, fontSize: 13 }}>No records in your authorized scope.</p>;
  return count !== undefined ? <p style={{ color: MUTED, fontSize: 12 }}>{count} record(s) from the live database.</p> : null;
}

export default function ContactHubView({ view, contactId }: { view: View; contactId?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (url?: string) => {
    setLoading(true); setError('');
    const fallback: Record<View, string> = {
      list: '/api/crm/contacts', detail: `/api/crm/contacts/${encodeURIComponent(contactId || '')}`,
      duplicates: '/api/crm/contacts/duplicates', consent: '/api/crm/contacts/consent',
      segments: '/api/crm/contacts/segments', audit: '/api/crm/contacts/audit',
      import: '/api/crm/contacts/import',
    };
    let target = url || fallback[view];
    if (view === 'list' && !url) {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (params.toString()) target += `?${params.toString()}`;
    }
    try {
      const result = await api(target);
      if (!result.ok) {
        setError(String((result.data as { error?: string }).error || `Request failed (${result.status})`));
        setData(null);
      } else setData(result.data);
    } catch {
      setError('The Contact Hub API could not be reached.');
      setData(null);
    } finally { setLoading(false); }
  }, [view, contactId, search, category]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main style={{ minHeight: '100vh', background: PAGE, color: TEXT, fontFamily: 'var(--font-sans, system-ui)' }}>
      <header style={{ background: BRAND, color: '#fff', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Company Contact Registry</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.9 }}>ALO Education · single source of truth across CRM, WhatsApp, students and campaigns</p>
          </div>
          <nav aria-label="Contact Hub sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} style={{
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                background: item.view === view ? '#ffffff' : 'rgba(255,255,255,0.16)',
                color: item.view === view ? BRAND : '#fff',
              }}>{item.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 24 }}>
        {message && <div role="status" style={{ ...card, marginBottom: 16, borderColor: CTA, color: TEXT }}>{message}</div>}
        <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 12, color: MUTED, maxWidth: 720 }}>
            Records are scoped server-side by branch, assignment and partner permissions. Importing a contact never grants promotional consent;
            {' '}consent and suppression are enforced by the shared ConsentManagementService before every promotional send.
          </p>
          <a href="/api/crm/contacts/export" style={{ ...secondary, textDecoration: 'none' }}>Export minimum fields (audited)</a>
        </div>

        {view === 'list' && <ListView data={data} loading={loading} error={error} search={search} setSearch={setSearch} category={category} setCategory={setCategory} onSearch={() => void load()} onRefresh={() => void load()} />}
        {view === 'detail' && <DetailView contactId={contactId || ''} data={data} loading={loading} error={error} onSaved={(text) => { setMessage(text); void load(); }} />}
        {view === 'import' && <ImportView data={data} loading={loading} error={error} onDone={(text) => { setMessage(text); void load(); }} />}
        {view === 'duplicates' && <DuplicatesView data={data} loading={loading} error={error} onDone={(text) => { setMessage(text); void load(); }} />}
        {view === 'consent' && <ConsentView data={data} loading={loading} error={error} contactId={contactId} onLoad={(id) => void load(`/api/crm/contacts/consent?contactId=${encodeURIComponent(id)}`)} onDone={(text) => setMessage(text)} />}
        {view === 'segments' && <SegmentsView data={data} loading={loading} error={error} />}
        {view === 'audit' && <AuditView data={data} loading={loading} error={error} />}
      </div>
    </main>
  );
}

function ListView({ data, loading, error, search, setSearch, category, setCategory, onSearch, onRefresh }: {
  data: Record<string, unknown> | null; loading: boolean; error: string;
  search: string; setSearch: (value: string) => void; category: string; setCategory: (value: string) => void;
  onSearch: () => void; onRefresh: () => void;
}) {
  const contacts = (data?.contacts as Array<Record<string, unknown>>) || [];
  const segments = (data?.segments as Record<string, Record<string, number>>) || {};
  return (
    <>
      <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input aria-label="Search contacts" placeholder="Name, phone or email" value={search} onChange={(event) => setSearch(event.target.value)} style={{ ...input, maxWidth: 280 }} />
        <select aria-label="Contact category" value={category} onChange={(event) => setCategory(event.target.value)} style={{ ...input, maxWidth: 240 }}>
          <option value="">All categories</option>
          {['PROSPECTIVE_STUDENT', 'STUDENT', 'ALUMNI', 'PARENT_GUARDIAN_SPONSOR', 'EMPLOYEE_MANAGER', 'BRANCH_DEPARTMENT', 'UNIVERSITY_REPRESENTATIVE', 'UNIVERSITY_PARTNER_AGENT', 'B2B_PROVIDER_SUB_AGENT', 'VENDOR_SERVICE_PROVIDER', 'EVENT_ATTENDEE', 'MARKETING_SUBSCRIBER', 'GENERAL_ENQUIRY'].map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
        </select>
        <button type="button" style={button} onClick={onSearch}>Search</button>
        <button type="button" style={secondary} onClick={onRefresh}>Refresh</button>
      </div>
      <StatusLine loading={loading} error={error} empty={!contacts.length} count={contacts.length} />
      {!!contacts.length && <>
        <div style={{ ...card, marginBottom: 16 }}>
          <strong style={{ fontSize: 13 }}>Live segment totals (this result set)</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {Object.entries(segments.byCategory || {}).map(([key, value]) => (
              <span key={key} style={{ padding: '5px 10px', borderRadius: 20, background: 'var(--alo-surface-muted, #f1f5f9)', fontSize: 11 }}>
                {key.replace(/_/g, ' ')}: <strong>{value}</strong>
              </span>
            ))}
          </div>
        </div>
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ textAlign: 'left', color: MUTED }}>
              {['Contact', 'Category', 'Lifecycle', 'Phone', 'Source', 'Branch', 'Status'].map((heading) => <th key={heading} style={{ padding: '8px 6px' }}>{heading}</th>)}
            </tr></thead>
            <tbody>{contacts.map((contact) => (
              <tr key={String(contact.id)} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: '8px 6px' }}><Link href={`/crm/contacts/${encodeURIComponent(String(contact.id))}`} style={{ color: BRAND, fontWeight: 600, textDecoration: 'none' }}>{String(contact.displayName || contact.id)}</Link><div style={{ color: MUTED, fontSize: 10 }}>{String(contact.id)}</div></td>
                <td style={{ padding: '8px 6px' }}>{String(contact.category || '').replace(/_/g, ' ')}</td>
                <td style={{ padding: '8px 6px' }}>{String(contact.lifecycle || '')}</td>
                <td style={{ padding: '8px 6px' }}>{String(contact.phone || '—')}</td>
                <td style={{ padding: '8px 6px' }}>{String(contact.sourceChannel || '—')}</td>
                <td style={{ padding: '8px 6px' }}>{String(contact.branch || '—')}</td>
                <td style={{ padding: '8px 6px' }}>{contact.isOptedOut ? <span style={{ color: '#b42318' }}>Opted out</span> : contact.isBlocked ? 'Blocked' : 'Active'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>}
    </>
  );
}

function DetailView({ contactId, data, loading, error, onSaved }: {
  contactId: string; data: Record<string, unknown> | null; loading: boolean; error: string; onSaved: (text: string) => void;
}) {
  const contact = (data?.contact as Record<string, unknown>) || null;
  const [form, setForm] = useState({ displayName: '', email: '', branch: '', tags: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!contact) return;
    setForm({
      displayName: String(contact.displayName || ''), email: String(contact.email || ''),
      branch: String(contact.branch || ''), tags: Array.isArray(contact.tags) ? (contact.tags as string[]).join(', ') : '',
    });
  }, [contact]);
  const save = async () => {
    setSaving(true);
    const result = await api(`/api/crm/contacts/${encodeURIComponent(contactId)}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }),
    });
    setSaving(false);
    onSaved(result.ok ? 'Contact updated and audited.' : String((result.data as { error?: string }).error || 'Update failed.'));
  };
  const messages = (data?.communicationHistory as Array<Record<string, unknown>>) || [];
  const tasks = (data?.tasks as Array<Record<string, unknown>>) || [];
  const consent = (data?.consentSummary as Array<Record<string, unknown>>) || [];
  const audit = (data?.audit as Array<Record<string, unknown>>) || [];
  return (
    <>
      <StatusLine loading={loading} error={error} empty={!contact} />
      {contact && <>
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>{String(contact.displayName)}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
            {[
              ['Contact ID', contact.id], ['Category', contact.category], ['Lifecycle', contact.lifecycle],
              ['Phone', contact.phone || '—'], ['WhatsApp verified', contact.whatsappVerified ? 'Yes' : 'Not verified'],
              ['Email', contact.email || '—'], ['Email verified', contact.emailVerified ? 'Yes' : 'Not verified'],
              ['Preferred language', contact.preferredLanguage || '—'], ['Assigned counselor', contact.assignedCounselorId || '—'],
              ['Branch', contact.branch || '—'], ['Student ID', contact.studentId || '—'], ['Lead ID', contact.leadId || '—'],
              ['First contact', contact.firstContactAt || '—'], ['Last contact', contact.lastContactAt || '—'],
              ['Identity status', contact.identityStatus], ['Source', contact.sourceChannel],
            ].map(([label, value]) => <div key={String(label)}><div style={{ color: MUTED }}>{String(label)}</div><strong>{String(value ?? '—')}</strong></div>)}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href={`/crm/contacts/consent?contactId=${encodeURIComponent(contactId)}`} style={{ color: BRAND, fontSize: 12 }}>Open consent ledger →</Link>
          </div>
        </div>
        <div style={{ ...card, marginBottom: 16 }}>
          <strong style={{ fontSize: 13 }}>Edit permitted fields</strong>
          <p style={{ color: MUTED, fontSize: 11 }}>Identity links, phone and consent/suppression state cannot be edited here.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {(['displayName', 'email', 'branch', 'tags'] as const).map((field) => (
              <label key={field} style={{ fontSize: 11, color: MUTED }}>{field}
                <input aria-label={field} value={form[field]} onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))} style={input} />
              </label>
            ))}
          </div>
          <button type="button" style={{ ...button, marginTop: 12 }} disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
        <Panel title={`WhatsApp / CRM timeline (${messages.length})`} rows={messages} columns={['direction', 'messageType', 'messageBody', 'deliveryStatus', 'timestamp']} />
        <Panel title={`Consent events (${consent.length})`} rows={consent} columns={['channel', 'purpose', 'status', 'at']} />
        <Panel title={`Tasks (${tasks.length})`} rows={tasks} columns={['title', 'type', 'status', 'dueDate']} />
        <Panel title={`Audit events (${audit.length})`} rows={audit} columns={['action', 'actorUserId', 'createdAt']} />
        <div style={{ ...card, fontSize: 12 }}>
          <strong>Linked records</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{JSON.stringify(data?.linkedRecords || {}, null, 2)}</pre>
        </div>
      </>}
    </>
  );
}

function Panel({ title, rows, columns }: { title: string; rows: Array<Record<string, unknown>>; columns: string[] }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      {!rows.length ? <p style={{ color: MUTED, fontSize: 12 }}>No records in your authorized scope.</p> : (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ textAlign: 'left', color: MUTED }}>{columns.map((column) => <th key={column} style={{ padding: 6 }}>{column}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => (
              <tr key={`${String(row.id || index)}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                {columns.map((column) => <td key={column} style={{ padding: 6, maxWidth: 320, overflowWrap: 'anywhere' }}>{String(row[column] ?? '—')}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ImportView({ data, loading, error, onDone }: {
  data: Record<string, unknown> | null; loading: boolean; error: string; onDone: (text: string) => void;
}) {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('contacts.csv');
  const [mapping, setMapping] = useState('{"fullName":"name","phone":"phone","email":"email","category":"type"}');
  const [lawfulBasis, setLawfulBasis] = useState('EXPLICIT_CONSENT');
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const batches = (data?.batches as Array<Record<string, unknown>>) || [];

  const submit = async (mode: 'preview' | 'commit') => {
    setBusy(true);
    try {
      const parsed = JSON.parse(mapping) as Record<string, string>;
      const response = await api('/api/crm/contacts/import', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode, csv, fileName, mapping: parsed, lawfulBasis, lawfulBasisReference: reference }),
      });
      setResult(response.data);
      if (!response.ok) onDone(String((response.data as { error?: string }).error || 'Import request failed.'));
      else if (mode === 'commit') onDone('Import committed. No marketing consent was created.');
    } catch {
      onDone('Field mapping must be valid JSON.');
    } finally { setBusy(false); }
  };
  const rows = (result?.rows as Array<Record<string, unknown>>) || [];
  return (
    <>
      <div style={{ ...card, marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>CSV import — preview before commit</strong>
        <p style={{ color: MUTED, fontSize: 11 }}>Header row required. The canonical registry is phone-keyed; email-only rows are reported as row errors rather than written to a second contact store.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: MUTED }}>File name<input aria-label="File name" value={fileName} onChange={(event) => setFileName(event.target.value)} style={input} /></label>
          <label style={{ fontSize: 11, color: MUTED }}>Field mapping (JSON)<input aria-label="Field mapping" value={mapping} onChange={(event) => setMapping(event.target.value)} style={input} /></label>
          <label style={{ fontSize: 11, color: MUTED }}>Lawful basis<select aria-label="Lawful basis" value={lawfulBasis} onChange={(event) => setLawfulBasis(event.target.value)} style={input}>{['EXPLICIT_CONSENT', 'EXISTING_CUSTOMER', 'CONTRACTUAL', 'OTHER_DOCUMENTED'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label style={{ fontSize: 11, color: MUTED }}>Basis reference<input aria-label="Basis reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Policy / approval reference" style={input} /></label>
        </div>
        <textarea aria-label="CSV data" value={csv} onChange={(event) => setCsv(event.target.value)} rows={7} placeholder={'name,phone,email,type\nAyesha Rahman,01700000000,ayesha@example.com,PROSPECTIVE_STUDENT'} style={{ ...input, fontFamily: 'monospace' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button type="button" style={secondary} disabled={busy || !csv} onClick={() => void submit('preview')}>Preview &amp; validate</button>
          <button type="button" style={button} disabled={busy || !csv || reference.trim().length < 5} onClick={() => void submit('commit')}>Commit valid rows</button>
        </div>
      </div>
      <StatusLine loading={loading} error={error} empty={!batches.length} count={batches.length} />
      {result && <div style={{ ...card, marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>{String(result.mode || 'result')} result</strong>
        <p style={{ fontSize: 12 }}>Rows: {String(result.totalRows ?? '—')} · Valid: {String(result.validRows ?? result.created ?? '—')} · Invalid: {String(result.invalidRows ?? result.errors ?? '—')} · Duplicates: {String(result.duplicateRows ?? result.duplicates ?? '—')}</p>
        <p style={{ fontSize: 11, color: MUTED }}>{String(result.note || result.message || '')}</p>
        {!!rows.length && <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ textAlign: 'left', color: MUTED }}>{['Row', 'Errors', 'Duplicate', 'Preview'].map((heading) => <th key={heading} style={{ padding: 6 }}>{heading}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={String(row.rowNumber)} style={{ borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: 6 }}>{String(row.rowNumber)}</td>
              <td style={{ padding: 6 }}>{Array.isArray(row.errors) ? (row.errors as string[]).join('; ') : '—'}</td>
              <td style={{ padding: 6 }}>{String(row.duplicate ? row.duplicateReason : '—')}</td>
              <td style={{ padding: 6 }}>{JSON.stringify(row.preview || {})}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </div>}
      <Panel title={`Import history (${batches.length})`} rows={batches} columns={['id', 'fileName', 'totalRows', 'newCount', 'duplicateCount', 'errorCount', 'status', 'createdAt']} />
    </>
  );
}

function DuplicatesView({ data, loading, error, onDone }: {
  data: Record<string, unknown> | null; loading: boolean; error: string; onDone: (text: string) => void;
}) {
  const groups = (data?.groups as Array<Record<string, unknown>>) || [];
  const pending = (data?.pendingReviews as Array<Record<string, unknown>>) || [];
  const requestReview = async (ids: string[], reason: string) => {
    const result = await api('/api/crm/contacts/duplicates', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contactIds: ids, reason }),
    });
    onDone(result.ok ? 'Identity review item created; no contacts were merged.' : String((result.data as { error?: string }).error || 'Review request failed.'));
  };
  return (
    <>
      <StatusLine loading={loading} error={error} empty={!groups.length && !pending.length} count={groups.length} />
      <div style={{ ...card, marginBottom: 16, fontSize: 12 }}>
        <strong>Identity policy</strong>
        <p style={{ color: MUTED }}>{String(data?.policy || 'No record is merged automatically.')}</p>
      </div>
      {groups.map((group) => (
        <div key={`${String(group.matchedOn)}-${String(group.key)}`} style={{ ...card, marginBottom: 12 }}>
          <strong style={{ fontSize: 13 }}>{String(group.matchedOn)} match · {String(group.key)}</strong>
          <p style={{ color: MUTED, fontSize: 11 }}>{String(group.reason)}</p>
          <p style={{ fontSize: 11 }}>Contacts: {(group.contactIds as string[] || []).join(', ')}</p>
          <button type="button" style={secondary} onClick={() => void requestReview((group.contactIds as string[]) || [], `Manual review of ${String(group.matchedOn)} match ${String(group.key)}`)}>Request identity review</button>
        </div>
      ))}
      <Panel title={`Pending review items (${pending.length})`} rows={pending} columns={['id', 'incomingPhone', 'matchReason', 'status', 'createdAt']} />
    </>
  );
}

function ConsentView({ data, loading, error, contactId, onLoad, onDone }: {
  data: Record<string, unknown> | null; loading: boolean; error: string; contactId?: string;
  onLoad: (id: string) => void; onDone: (text: string) => void;
}) {
  const [id, setId] = useState(contactId || '');
  const [form, setForm] = useState({ action: 'WITHDRAW', channel: 'WHATSAPP', purpose: 'PROMOTIONAL_MARKETING', wording: '', reason: '', source: 'CONTACT_HUB_MANUAL' });
  const ledger = (data?.ledger as Array<Record<string, unknown>>) || [];
  const eligibility = (data?.promotionalEligibility as Record<string, unknown>) || null;
  const change = async () => {
    const result = await api('/api/crm/contacts/consent', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contactId: id, ...form }),
    });
    onDone(result.ok ? `Consent ${String(form.action)} recorded through the shared service.` : String((result.data as { error?: string }).error || 'Consent change failed.'));
    if (result.ok) onLoad(id);
  };
  return (
    <>
      <div style={{ ...card, marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>Consent ledger &amp; suppression</strong>
        <p style={{ color: MUTED, fontSize: 11 }}>Transactional service messages and promotional marketing consent are separate. A missing record is never consent.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input aria-label="Contact ID" placeholder="Contact ID" value={id} onChange={(event) => setId(event.target.value)} style={{ ...input, maxWidth: 320 }} />
          <button type="button" style={secondary} disabled={!id} onClick={() => onLoad(id)}>Load ledger</button>
        </div>
        {eligibility && <p style={{ fontSize: 12, marginTop: 10 }}>Promotional eligibility: <strong>{String(eligibility.eligible)}</strong> ({String(eligibility.reason)})</p>}
      </div>
      <StatusLine loading={loading} error={error} empty={!ledger.length} count={ledger.length} />
      <div style={{ ...card, marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>Record a consent event</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 10 }}>
          <label style={{ fontSize: 11, color: MUTED }}>Action<select aria-label="Action" value={form.action} onChange={(event) => setForm((prev) => ({ ...prev, action: event.target.value }))} style={input}>{['GRANT', 'WITHDRAW', 'SUPPRESS'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label style={{ fontSize: 11, color: MUTED }}>Channel<select aria-label="Channel" value={form.channel} onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value }))} style={input}>{['WHATSAPP', 'EMAIL', 'SMS', 'CALL'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label style={{ fontSize: 11, color: MUTED }}>Purpose<select aria-label="Purpose" value={form.purpose} onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))} style={input}>{['PROMOTIONAL_MARKETING', 'SERVICE_UPDATES', 'TRANSACTIONAL'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label style={{ fontSize: 11, color: MUTED }}>Exact wording / evidence<input aria-label="Exact wording" value={form.wording} onChange={(event) => setForm((prev) => ({ ...prev, wording: event.target.value }))} placeholder="Required for GRANT" style={input} /></label>
          <label style={{ fontSize: 11, color: MUTED }}>Reason<input aria-label="Reason" value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} style={input} /></label>
        </div>
        <button type="button" style={{ ...button, marginTop: 12 }} disabled={!id} onClick={() => void change()}>Record audited event</button>
      </div>
      <Panel title={`Ledger (${ledger.length})`} rows={ledger} columns={['id', 'channel', 'purpose', 'consentStatus', 'consentSource', 'policyVersion', 'evidenceReference', 'createdAt']} />
    </>
  );
}

function SegmentsView({ data, loading, error }: { data: Record<string, unknown> | null; loading: boolean; error: string }) {
  const segments = (data?.segments as Record<string, unknown>) || {};
  const categories = (segments.byCategory as Record<string, number>) || {};
  const tags = (segments.byTag as Record<string, number>) || {};
  const sources = (segments.bySource as Record<string, number>) || {};
  return (
    <>
      <StatusLine loading={loading} error={error} empty={!Object.keys(categories).length} count={Number(segments.total || 0)} />
      {!!Object.keys(categories).length && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {[['By category', categories], ['By source channel', sources], ['By tag', tags]].map(([title, values]) => (
          <div key={String(title)} style={card}>
            <strong style={{ fontSize: 13 }}>{String(title)}</strong>
            <div style={{ marginTop: 10 }}>
              {Object.entries(values as Record<string, number>).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ overflowWrap: 'anywhere' }}>{key.replace(/_/g, ' ')}</span><strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={card}>
          <strong style={{ fontSize: 13 }}>Suppression &amp; identity</strong>
          <p style={{ fontSize: 12 }}>Opted out: <strong>{String(segments.optedOut ?? 0)}</strong></p>
          <p style={{ fontSize: 12 }}>Blocked: <strong>{String(segments.blocked ?? 0)}</strong></p>
          <p style={{ fontSize: 12 }}>Identity review required: <strong>{String(segments.reviewRequired ?? 0)}</strong></p>
          <p style={{ color: MUTED, fontSize: 11 }}>{String(data?.note || '')}</p>
        </div>
      </div>}
    </>
  );
}

function AuditView({ data, loading, error }: { data: Record<string, unknown> | null; loading: boolean; error: string }) {
  const events = (data?.events as Array<Record<string, unknown>>) || [];
  return (
    <>
      <StatusLine loading={loading} error={error} empty={!events.length} count={events.length} />
      <Panel title={`Contact registry audit events (${events.length})`} rows={events} columns={['action', 'actor', 'resource', 'resourceId', 'createdAt']} />
    </>
  );
}
