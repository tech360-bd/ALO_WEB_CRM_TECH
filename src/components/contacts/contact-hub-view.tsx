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

type View = 'list' | 'detail' | 'import' | 'duplicates' | 'consent' | 'segments' | 'audit' | 'identify' | 'dashboard' | 'numbers' | 'google' | 'health';

const NAV: Array<{ href: string; label: string; view: View }> = [
  { href: '/crm/contacts', label: 'Contacts', view: 'list' },
  { href: '/crm/contacts/dashboard', label: 'Dashboard', view: 'dashboard' },
  { href: '/crm/contacts/import', label: 'Import', view: 'import' },
  { href: '/crm/contacts/duplicates', label: 'Duplicates', view: 'duplicates' },
  { href: '/crm/contacts/consent', label: 'Consent', view: 'consent' },
  { href: '/crm/contacts/segments', label: 'Segments', view: 'segments' },
  { href: '/crm/contacts/audit', label: 'Audit', view: 'audit' },
  // Inbound identification: type the number the phone is showing. This is the
  // screen a counsellor needs while the call is still ringing.
  { href: '/crm/contacts/identify', label: 'Identify', view: 'identify' },
  // External admin consoles — linked, not duplicated.
  { href: '/admin/whatsapp-numbers', label: 'Company Numbers', view: 'numbers' },
  { href: '/admin/google-contacts', label: 'Google Contacts', view: 'google' },
  { href: '/admin/integration-health', label: 'Integration Health', view: 'health' },
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
      // Identify takes its input from the form, so the hub has no default list call
      // for it; the mapping exists only to keep the record exhaustive.
      identify: '/api/crm/contacts',
      dashboard: '/api/crm/contacts/dashboard',
      numbers: '/api/whatsapp/numbers',
      google: '/api/google/contacts/status',
      health: '/api/crm/contacts/dashboard',
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

  useEffect(() => {
    // The identify view fetches only when a number is submitted, so the hub's
    // list load is skipped rather than fired and ignored.
    if (view === 'identify' || view === 'dashboard' || view === 'numbers' || view === 'google' || view === 'health') return;
    void load();
  }, [load, view]);

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
        {view === 'identify' && <IdentifyView />}
        {view === 'dashboard' && <DashboardView />}
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


interface SecondaryPhone {
  id: string;
  phone: string;
  normalizedPhone: string;
  label: string;
  isPrimary: boolean;
  isWhatsApp: boolean;
  source: string;
  sharedWithOtherContacts: number;
}

const PHONE_LABELS = ['PERSONAL', 'BUSINESS', 'WHATSAPP', 'ALTERNATIVE', 'EMERGENCY', 'FAMILY'] as const;

function PhoneNumbersPanel({ contactId, onChanged }: { contactId: string; onChanged: (text: string) => void }) {
  const [phones, setPhones] = useState<SecondaryPhone[] | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ phone: '', label: 'ALTERNATIVE', isWhatsApp: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const result = await api<{ phones?: SecondaryPhone[]; error?: string }>(`/api/crm/contacts/${encodeURIComponent(contactId)}/phones`);
    if (!result.ok) { setError(String(result.data.error || `Failed (${result.status})`)); setPhones([]); return; }
    setError('');
    setPhones(result.data.phones || []);
  }, [contactId]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!form.phone.trim()) { setError('Enter a phone number first.'); return; }
    setSaving(true);
    const result = await api<{ error?: string; sharedWithContacts?: number; note?: string }>(`/api/crm/contacts/${encodeURIComponent(contactId)}/phones`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!result.ok) { setError(String(result.data.error || 'Could not add the number.')); return; }
    setForm({ phone: '', label: 'ALTERNATIVE', isWhatsApp: false });
    setError('');
    onChanged(result.data.note || 'Phone number added and audited.');
    void load();
  };

  const patch = async (phoneId: string, body: Record<string, unknown>, okText: string) => {
    const result = await api<{ error?: string }>(`/api/crm/contacts/${encodeURIComponent(contactId)}/phones/${encodeURIComponent(phoneId)}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!result.ok) { setError(String(result.data.error || 'Update failed.')); return; }
    onChanged(okText);
    void load();
  };

  const remove = async (phoneId: string) => {
    const result = await api<{ error?: string }>(`/api/crm/contacts/${encodeURIComponent(contactId)}/phones/${encodeURIComponent(phoneId)}`, { method: 'DELETE' });
    if (!result.ok) { setError(String(result.data.error || 'Remove failed.')); return; }
    onChanged('Phone number removed; the removal was audited.');
    void load();
  };

  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <strong style={{ fontSize: 13 }}>Phone numbers</strong>
      <p style={{ margin: '4px 0 10px', color: MUTED, fontSize: 11 }}>
        The primary number stays on the contact record; these additional numbers remain individually searchable.
        A number shared with another contact is allowed (family/business lines) and is never auto-merged.
      </p>
      {error && <p style={{ color: '#b42318', fontSize: 12 }}>Unavailable: {error}</p>}
      {phones === null ? <p style={{ color: MUTED, fontSize: 12 }}>Loading live numbers…</p> : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          {phones.length === 0 && <p style={{ color: MUTED, fontSize: 12 }}>No secondary numbers recorded.</p>}
          {phones.map((row) => (
            <div key={row.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 12 }}>
              <strong>{row.phone}</strong>
              <span style={{ color: MUTED }}>{row.label}{row.isWhatsApp ? ' · WhatsApp' : ''}{row.isPrimary ? ' · primary-secondary' : ''}</span>
              {row.sharedWithOtherContacts > 0 && <span style={{ color: '#b54708' }}>shared with {row.sharedWithOtherContacts} other contact{row.sharedWithOtherContacts === 1 ? '' : 's'}</span>}
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!row.isPrimary && <button type="button" style={{ ...secondary, padding: '4px 10px', fontSize: 11 }} onClick={() => void patch(row.id, { isPrimary: true }, 'Marked as primary secondary number.')}>Make primary</button>}
                <button type="button" style={{ ...secondary, padding: '4px 10px', fontSize: 11 }} onClick={() => void patch(row.id, { isWhatsApp: !row.isWhatsApp }, 'WhatsApp flag updated.')}>{row.isWhatsApp ? 'Unset WhatsApp' : 'Set WhatsApp'}</button>
                <button type="button" style={{ ...secondary, padding: '4px 10px', fontSize: 11, color: '#b42318', borderColor: '#b42318' }} onClick={() => void remove(row.id)}>Remove</button>
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <input aria-label="New phone number" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="01XXXXXXXXX or +8801..." style={{ ...input, maxWidth: 220 }} />
        <select aria-label="Number label" value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} style={{ ...input, maxWidth: 170 }}>
          {PHONE_LABELS.map((label) => <option key={label} value={label}>{label}</option>)}
        </select>
        <label style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={form.isWhatsApp} onChange={(event) => setForm((prev) => ({ ...prev, isWhatsApp: event.target.checked }))} /> WhatsApp
        </label>
        <button type="button" style={button} disabled={saving} onClick={() => void add()}>{saving ? 'Adding…' : 'Add number'}</button>
      </div>
    </div>
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
        <PhoneNumbersPanel contactId={contactId} onChanged={onSaved} />
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


interface MergeRow { id: string; displayName: string; phone: string; email: string; studentId: string }

/**
 * Merge execution UI — the API was complete but API-only; this is the human
 * approval surface required by the duplicate-resolution flow. Nothing merges
 * automatically: preview writes nothing, execution needs the token the preview
 * returns, a written reason, and the caller's `contacts.merge_execute` grant.
 * Student identities are never rewritten; conflicting student/lead/partner ids
 * are hard refusals from the planner.
 */
function MergePanel({ contactIds, onDone }: { contactIds: string[]; onDone: (text: string) => void }) {
  const [rows, setRows] = useState<MergeRow[] | null>(null);
  const [destinationId, setDestinationId] = useState('');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<{ ok: boolean; summary: string; token: string; blockers: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadContacts = async () => {
    setBusy(true);
    setError('');
    const loaded = await Promise.all(
      contactIds.map(async (id) => {
        const result = await api<{ contact?: Record<string, unknown>; error?: string }>(`/api/crm/contacts/${encodeURIComponent(id)}`);
        if (!result.ok) return { id, displayName: `(out of scope or missing)`, phone: id, email: '', studentId: '' };
        const c = (result.data.contact || {}) as Record<string, unknown>;
        return {
          id,
          displayName: String(c.displayName || c.preferredName || c.id || id),
          phone: String(c.phone || c.normalizedPhone || ''),
          email: String(c.email || ''),
          studentId: String(c.studentId || ''),
        };
      }),
    );
    setRows(loaded);
    if (!destinationId && loaded.length > 0) setDestinationId(loaded[0].id);
    setBusy(false);
  };

  const sourceIds = () => (rows || []).map((row) => row.id).filter((id) => id !== destinationId);

  const runPreview = async () => {
    if (!destinationId || sourceIds().length === 0) { setError('Choose which record survives; the rest become aliases.'); return; }
    setBusy(true);
    setError('');
    setPreview(null);
    const result = await api<{
      success?: boolean; error?: string;
      plan?: { ok?: boolean; confirmationToken?: string; blockers?: string[] };
      summary?: string;
    }>('/api/crm/contacts/merge', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'preview', destinationId, sourceIds: sourceIds() }),
    });
    setBusy(false);
    if (!result.ok || !result.data.plan) { setError(String(result.data.error || `Preview failed (${result.status}).`)); return; }
    const plan = result.data.plan;
    setPreview({
      ok: Boolean(plan.ok),
      summary: String(result.data.summary || (plan.ok ? 'Plan ready.' : 'Plan refused.')),
      token: String(plan.confirmationToken || ''),
      blockers: Array.isArray(plan.blockers) ? plan.blockers.map(String) : [],
    });
  };

  const runExecute = async () => {
    if (!preview?.ok || !preview.token) { setError('Preview the merge first.'); return; }
    if (reason.trim().length < 10) { setError('A written reason of at least 10 characters is required.'); return; }
    setBusy(true);
    setError('');
    const result = await api<{ success?: boolean; error?: string; merged?: boolean; auditId?: string }>('/api/crm/contacts/merge', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'execute', destinationId, sourceIds: sourceIds(), reason: reason.trim(), confirmationToken: preview.token }),
    });
    setBusy(false);
    if (!result.ok || !result.data.success) { setError(String(result.data.error || `Execute failed (${result.status}).`)); return; }
    setPreview(null);
    setReason('');
    onDone('Merge executed — source rows kept as aliases, nothing deleted; reversal is available via the audit snapshot.');
  };

  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
      {rows === null ? (
        <button type="button" style={{ ...secondary, padding: '4px 10px', fontSize: 11 }} disabled={busy} onClick={() => void loadContacts()}>{busy ? 'Loading records…' : 'Compare records & merge…'}</button>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Choose the surviving record. The others are kept as searchable aliases — never deleted — and student identities are never rewritten.</p>
          {error && <p style={{ margin: 0, color: '#b42318', fontSize: 12 }}>Unavailable: {error}</p>}
          {rows.map((row) => (
            <label key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}>
              <input type="radio" name={`merge-dest-${contactIds.join('-')}`} checked={destinationId === row.id} onChange={() => { setDestinationId(row.id); setPreview(null); }} />
              <span><strong>{row.displayName}</strong> · {row.phone}{row.studentId ? ` · Student ${row.studentId}` : ''}{row.email ? ` · ${row.email}` : ''}</span>
            </label>
          ))}
          <textarea aria-label="Merge reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why these records are the same person (min 10 characters)…" style={{ ...input, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={{ ...secondary, padding: '6px 12px', fontSize: 12 }} disabled={busy} onClick={() => void runPreview()}>{busy ? 'Working…' : 'Preview merge (writes nothing)'}</button>
            <button type="button" style={{ ...button, padding: '6px 12px', fontSize: 12 }} disabled={busy || !preview?.ok || reason.trim().length < 10} onClick={() => void runExecute()}>Execute merge</button>
          </div>
          {preview && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 12 }}>
              <p style={{ margin: 0 }}><strong>{preview.ok ? 'Plan ready' : 'Merge refused'}</strong> — {preview.summary}</p>
              {preview.blockers.length > 0 && <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#b42318' }}>{preview.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>}
            </div>
          )}
        </div>
      )}
    </div>
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
          {((group.contactIds as string[]) || []).length >= 2 && <MergePanel contactIds={(group.contactIds as string[]) || []} onDone={onDone} />}
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



// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — the sixteen contact metrics
// ─────────────────────────────────────────────────────────────────────────────
// Every number is a live database reading. A metric whose query failed renders as
// "unavailable" with its reason — never as 0, because an empty registry and a broken
// query must not look the same. Each card states how the number is calculated.

interface DashboardMetric {
  key: string;
  label: string;
  definition: string;
  source: string;
  unit: 'count' | 'percent';
  rangeScoped: boolean;
  branchScoped: boolean;
  value: number | null;
  status: 'OK' | 'UNAVAILABLE';
  reason?: string;
}

interface DashboardResponse {
  success: boolean;
  error?: string;
  generatedAt?: string;
  range?: { from: string; to: string; days: number; defaulted: boolean; adjustment: string | null };
  branch?: { branch: string | null; applied: boolean; forced: boolean; reason: string };
  metrics?: DashboardMetric[];
  caveats?: string[];
  scope?: string;
  dataSource?: string;
  mergedTagHandling?: string;
}

function DashboardView() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [branch, setBranch] = useState('');
  const [showDefinitions, setShowDefinitions] = useState(false);

  const submit = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (branch.trim()) params.set('branch', branch.trim());
    const response = await api<DashboardResponse>(`/api/crm/contacts/dashboard${params.toString() ? `?${params.toString()}` : ''}`);
    setLoading(false);
    if (!response.ok) {
      setData(null);
      setError(response.data.error || `Dashboard unavailable (HTTP ${response.status}).`);
      return;
    }
    setData(response.data);
  }, [from, to, branch]);

  useEffect(() => { void submit(); }, [submit]);

  const metrics = data?.metrics || [];

  return (
    <>
      <div style={card}>
        <strong style={{ fontSize: 13 }}>Contact metrics</strong>
        <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>
          Live database readings within your authorized scope. Metrics marked “current” are present-state
          counts, not period counts. Nothing on this page is estimated.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: MUTED }}>
            From{' '}
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} style={{ ...input, width: 160 }} />
          </label>
          <label style={{ fontSize: 12, color: MUTED }}>
            To{' '}
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} style={{ ...input, width: 160 }} />
          </label>
          <input
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder="Branch (company-wide roles only)"
            style={{ ...input, maxWidth: 240 }}
            aria-label="Branch filter"
          />
          <button style={button} onClick={() => void submit()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button style={secondary} onClick={() => setShowDefinitions((value) => !value)}>
            {showDefinitions ? 'Hide definitions' : 'Show definitions'}
          </button>
        </div>
        {data?.range ? (
          <p style={{ color: MUTED, fontSize: 11, marginTop: 8 }}>
            Range {new Date(data.range.from).toLocaleDateString()} → {new Date(data.range.to).toLocaleDateString()} ({data.range.days} days{data.range.defaulted ? ', default window' : ''}).
            {data.range.adjustment ? ` ${data.range.adjustment}` : ''}
          </p>
        ) : null}
        {data?.branch ? <p style={{ color: MUTED, fontSize: 11 }}>{data.branch.reason}</p> : null}
      </div>

      {error ? <p style={{ color: '#b42318', fontSize: 13, marginTop: 12 }}>{error}</p> : null}
      {loading && metrics.length === 0 ? <p style={{ color: MUTED, fontSize: 13, marginTop: 12 }}>Loading live metrics…</p> : null}

      {metrics.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 16 }}>
          {metrics.map((metric) => (
            <div key={metric.key} style={{ ...card, opacity: metric.status === 'OK' ? 1 : 0.85 }}>
              <p style={{ margin: 0, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4 }}>{metric.label}</p>
              <p style={{ margin: '6px 0 2px', fontSize: 24, fontWeight: 700 }}>
                {metric.value === null ? 'Unavailable' : metric.unit === 'percent' ? `${metric.value}%` : metric.value.toLocaleString()}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: MUTED }}>
                {metric.rangeScoped ? 'Range-scoped' : 'Current state'}{metric.branchScoped ? ' · branch-scoped' : ''}
              </p>
              {metric.reason ? <p style={{ margin: '6px 0 0', fontSize: 11, color: '#b42318' }}>{metric.reason}</p> : null}
              {showDefinitions ? (
                <p style={{ margin: '8px 0 0', fontSize: 11, color: MUTED }}>
                  {metric.definition}<br /><em>Source: {metric.source}</em>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !error && metrics.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 13, marginTop: 12 }}>No metrics were returned. That is a failure, not an empty registry.</p>
      ) : null}

      {data?.caveats?.length ? (
        <div style={{ ...card, marginTop: 16 }}>
          <strong style={{ fontSize: 13 }}>How to read this</strong>
          {data.caveats.map((caveat) => (
            <p key={caveat} style={{ fontSize: 12, margin: '6px 0 0', color: MUTED }}>• {caveat}</p>
          ))}
          {data.dataSource ? <p style={{ fontSize: 11, margin: '8px 0 0', color: MUTED }}>Data source: {data.dataSource}</p> : null}
          {data.mergedTagHandling ? <p style={{ fontSize: 11, margin: '4px 0 0', color: MUTED }}>{data.mergedTagHandling}</p> : null}
        </div>
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Identify — "who is this number?"
// ─────────────────────────────────────────────────────────────────────────────
// The card is built server-side; this view only renders what the API proved. It
// never guesses: multiple matches are shown as a list to confirm, a guardian number
// is labelled as a guardian number, and an unknown number offers the allowed next
// actions *without* creating anything.

interface IdentifyPhone { value: string; normalized: string; source: string }
interface IdentifyFollowUp { id: string; title: string; status: string; dueDate: string; overdue: boolean; priority: string }
interface IdentifyGuardian {
  guardianId: string; studentRecordId: string; studentPublicId: string; studentName: string; guardianName: string;
  relationship: string; isPrimaryContact: boolean; isFinancialSponsor: boolean; profileHref: string;
}
interface IdentifyPossible {
  kind: string; recordId: string; publicId: string; name: string; matchedOn: string;
  distinguishing: string[]; profileHref: string;
}
interface IdentifyResult {
  state: 'IDENTIFIED' | 'POSSIBLE_MATCHES' | 'GUARDIAN_NUMBER' | 'UNKNOWN';
  queriedPhone: string;
  matchedOn: string | null;
  restricted: boolean;
  requiresConfirmation: boolean;
  notice: string;
  possible: IdentifyPossible[];
  guardians: IdentifyGuardian[];
  unknown: { number: string; suggestedActions: string[]; notice: string } | null;
  meta: { durationMs: number; realTimeVerified: boolean; realTimeNote: string };
  audit?: { recorded: boolean; note: string };
  primary: {
    kind: string; publicId: string; name: string; lifecycleStage: string; status: string;
    phones: IdentifyPhone[]; email: string; photoUrl: string | null; photoReason: string | null;
    parentGuardian: IdentifyGuardian[]; counselor: { id: string; name: string } | null;
    application: { university: string; course: string; stage: string; status: string } | null;
    lastConversation: { channel: string; at: string; preview: string } | null;
    openFollowUps: IdentifyFollowUp[]; historyCount: number; profileHref: string; scopeNotice: string | null;
  } | null;
}

function IdentifyView() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<IdentifyResult | null>(null);

  const submit = useCallback(async () => {
    const value = phone.trim();
    if (!value) { setError('Enter the number the call or message is coming from.'); return; }
    setLoading(true); setError(''); setResult(null);
    const response = await api<IdentifyResult & { error?: string; code?: string }>(`/api/crm/contacts/identify?phone=${encodeURIComponent(value)}`);
    setLoading(false);
    if (!response.ok) {
      setError(response.data.error || `Identification failed (HTTP ${response.status}).`);
      return;
    }
    setResult(response.data);
  }, [phone]);

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
      <span style={{ color: MUTED }}>{label}</span>
      <strong style={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</strong>
    </div>
  );

  const primary = result?.primary || null;

  return (
    <>
      <div style={card}>
        <strong style={{ fontSize: 13 }}>Identify the person behind a number</strong>
        <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>
          Identification uses stored phone numbers and Student IDs only. A name is never used to identify anyone,
          and nothing is created for a number the CRM does not recognise.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...input, maxWidth: 260 }}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') void submit(); }}
            placeholder="01XXXXXXXXX"
            inputMode="tel"
            aria-label="Caller phone number"
          />
          <button style={button} onClick={() => void submit()} disabled={loading}>
            {loading ? 'Resolving…' : 'Identify'}
          </button>
        </div>
        {error ? <p style={{ color: '#b42318', fontSize: 13, marginTop: 10 }}>{error}</p> : null}
      </div>

      {result ? (
        <>
          <div style={{ ...card, marginTop: 16, borderLeft: `4px solid ${result.state === 'IDENTIFIED' ? '#12805c' : result.state === 'UNKNOWN' ? '#b42318' : '#b45309'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 13 }}>{result.state.replace(/_/g, ' ')}</strong>
              <span style={{ color: MUTED, fontSize: 11 }}>
                number {result.queriedPhone || '—'} · matched on {result.matchedOn || 'nothing'} · {result.meta.durationMs}ms
              </span>
            </div>
            <p style={{ fontSize: 12, marginTop: 8 }}>{result.notice}</p>
            {result.restricted ? <p style={{ color: '#b42318', fontSize: 12 }}>Details withheld: this record is outside your branch or assignment scope.</p> : null}
            {result.audit && !result.audit.recorded ? <p style={{ color: '#b42318', fontSize: 11 }}>{result.audit.note}</p> : null}
            <p style={{ color: MUTED, fontSize: 11, marginTop: 6 }}>{result.meta.realTimeNote}</p>
          </div>

          {primary ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
              <div style={card}>
                <strong style={{ fontSize: 13 }}>{primary.name}</strong>
                <p style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{primary.kind.replace(/_/g, ' ')} · {primary.publicId}</p>
                <div style={{ marginTop: 10 }}>
                  {row('Student ID', primary.kind === 'student' ? primary.publicId : 'Not a registered student')}
                  {row('Lifecycle stage', primary.lifecycleStage)}
                  {row('Status', primary.status)}
                  {row('Counsellor', primary.counselor?.name || '')}
                  {row('Email', primary.email)}
                  {row('Conversation history', `${primary.historyCount} recorded message(s)`)}
                </div>
                <a href={primary.profileHref} style={{ display: 'inline-block', marginTop: 12, color: BRAND, fontSize: 12, fontWeight: 600 }}>
                  Open full profile →
                </a>
                {primary.photoReason ? <p style={{ color: MUTED, fontSize: 11, marginTop: 8 }}>{primary.photoReason}</p> : null}
                {primary.scopeNotice ? <p style={{ color: MUTED, fontSize: 11, marginTop: 8 }}>{primary.scopeNotice}</p> : null}
              </div>

              <div style={card}>
                <strong style={{ fontSize: 13 }}>Numbers on record</strong>
                <div style={{ marginTop: 8 }}>
                  {primary.phones.length === 0 ? <p style={{ color: MUTED, fontSize: 12 }}>No number stored on this record.</p> : null}
                  {primary.phones.map((entry) => (
                    <div key={entry.normalized} style={{ fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${BORDER}` }}>
                      {entry.normalized} <span style={{ color: MUTED }}>({entry.source})</span>
                    </div>
                  ))}
                </div>
                <strong style={{ fontSize: 13, display: 'block', marginTop: 14 }}>Application</strong>
                {primary.application ? (
                  <div style={{ marginTop: 6 }}>
                    {row('University', primary.application.university)}
                    {row('Course', primary.application.course)}
                    {row('Stage', primary.application.stage)}
                  </div>
                ) : <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>No application on record.</p>}
                <strong style={{ fontSize: 13, display: 'block', marginTop: 14 }}>Last conversation</strong>
                {primary.lastConversation ? (
                  <p style={{ fontSize: 12, marginTop: 6 }}>
                    {primary.lastConversation.channel} · {new Date(primary.lastConversation.at).toLocaleString()}
                    <br /><span style={{ color: MUTED }}>{primary.lastConversation.preview || '(no text)'}</span>
                  </p>
                ) : <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>No conversation linked to this record.</p>}
              </div>

              <div style={card}>
                <strong style={{ fontSize: 13 }}>Family &amp; guardians</strong>
                {primary.parentGuardian.length === 0 ? <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>No parent/guardian recorded.</p> : null}
                <div style={{ marginTop: 8 }}>
                  {primary.parentGuardian.map((guardian) => (
                    <div key={guardian.guardianId} style={{ fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
                      <strong>{guardian.guardianName}</strong> · {guardian.relationship}
                      {guardian.isPrimaryContact ? ' · primary' : ''}{guardian.isFinancialSponsor ? ' · sponsor' : ''}
                    </div>
                  ))}
                </div>
                <strong style={{ fontSize: 13, display: 'block', marginTop: 14 }}>Open follow-ups</strong>
                {primary.openFollowUps.length === 0 ? <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>No open follow-up.</p> : null}
                <div style={{ marginTop: 6 }}>
                  {primary.openFollowUps.map((followUp) => (
                    <div key={followUp.id} style={{ fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${BORDER}`, color: followUp.overdue ? '#b42318' : TEXT }}>
                      {followUp.title}
                      <span style={{ color: MUTED }}> · due {followUp.dueDate ? new Date(followUp.dueDate).toLocaleDateString() : 'not set'}{followUp.overdue ? ' · overdue' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {result.possible.length > 0 ? (
            <div style={{ ...card, marginTop: 16 }}>
              <strong style={{ fontSize: 13 }}>Confirm which record this is ({result.possible.length})</strong>
              <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>
                ALO never chooses for you and never merges records automatically. Confirm with the caller before opening a file.
              </p>
              <div style={{ marginTop: 10 }}>
                {result.possible.map((candidate) => (
                  <div key={`${candidate.kind}-${candidate.recordId}`} style={{ padding: '8px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                    <strong>{candidate.name}</strong> · {candidate.publicId} · {candidate.kind.replace(/_/g, ' ')}
                    <div style={{ color: MUTED }}>{candidate.distinguishing.join(' · ')}</div>
                    <a href={candidate.profileHref} style={{ color: BRAND, fontWeight: 600 }}>Open record →</a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.guardians.length > 0 && result.state === 'GUARDIAN_NUMBER' ? (
            <div style={{ ...card, marginTop: 16 }}>
              <strong style={{ fontSize: 13 }}>This is a guardian number</strong>
              <div style={{ marginTop: 8 }}>
                {result.guardians.map((guardian) => (
                  <div key={guardian.guardianId} style={{ fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <strong>{guardian.guardianName}</strong> · {guardian.relationship} of {guardian.studentName} ({guardian.studentPublicId})
                    <a href={guardian.profileHref} style={{ color: BRAND, fontWeight: 600, marginLeft: 8 }}>Open student →</a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.state === 'UNKNOWN' && result.unknown ? (
            <div style={{ ...card, marginTop: 16 }}>
              <strong style={{ fontSize: 13 }}>Unknown number — nothing was created</strong>
              <p style={{ fontSize: 12, marginTop: 6 }}>{result.unknown.notice}</p>
              <p style={{ color: MUTED, fontSize: 12 }}>
                Allowed next actions: {result.unknown.suggestedActions.map((action) => action.replace(/_/g, ' ')).join(' · ')}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
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
