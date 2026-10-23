'use client';

// ============================================================
// PARENT / GUARDIAN MANAGEMENT — staff view (spec s13, s67, s69)
// ============================================================
// Staff manage a student's parents: contact details, access level, consent
// records and payment responsibilities.
//
// Rules enforced in this UI:
//   * Consent is APPEND-ONLY (s67). There is no "edit consent" — you grant or
//     revoke, and each action creates a new dated record. The latest record per
//     type is what governs, and the full history stays visible.
//   * Access level changes state their consequence plainly: NONE disables the
//     portal, LIMITED withholds university/course/contact detail (s69).
//   * Communication is gated by BOTH consent and channel preference, so the UI
//     shows which channels are actually permitted rather than implying all are.
//   * Payment recording reports the true resulting balance; a payment larger
//     than the amount owed is capped, and the UI says so rather than showing a
//     phantom credit.
// ============================================================

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  Wallet,
  FileSignature,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const RELATIONSHIPS = ['FATHER', 'MOTHER', 'GUARDIAN', 'SPOUSE', 'SIBLING', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER'];
const ACCESS_LEVELS = ['NONE', 'LIMITED', 'FULL_JOURNEY'];
const CONSENT_TYPES = ['DATA_SHARING', 'COMMUNICATION', 'FINANCIAL', 'DOCUMENT_ACCESS', 'THIRD_PARTY_DISCLOSURE'];
const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_APP'];
const SCOPES = ['TUITION', 'DEPOSIT', 'SERVICE_FEE', 'ACCOMMODATION', 'TRAVEL', 'ALL'];

interface Consent {
  id: string;
  consentType: string;
  granted: boolean;
  method: string;
  evidenceRef: string;
  version: string;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

interface Responsibility {
  id: string;
  applicationId: string;
  scope: string;
  amount: number;
  paidAmount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  notes: string;
}

interface Parent {
  id: string;
  studentId: string;
  userId: string | null;
  fullName: string;
  relationship: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  city: string;
  occupation: string;
  communicationPrefs: string[];
  notificationPrefs: string[];
  accessLevel: string;
  portalEnabled: boolean;
  isPrimaryContact: boolean;
  isFinancialSponsor: boolean;
  status: string;
  notes: string;
  capabilities: string[];
  consents: Consent[];
  responsibilities: Responsibility[];
  createdAt?: string;
}

const ACCESS_STYLE: Record<string, string> = {
  FULL_JOURNEY: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  LIMITED: 'border-blue-200 bg-blue-50 text-blue-800',
  NONE: 'border-[var(--alo-border-strong)] bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
};

const ACCESS_CONSEQUENCE: Record<string, string> = {
  FULL_JOURNEY: 'Sees applications, universities, courses, contact details and deadlines.',
  LIMITED: 'Sees name, journey stage, application status and deadlines. University, course and contact details are withheld.',
  NONE: 'No portal access. Enabling the portal at this level has no effect.',
};

/** Latest consent record per type governs; a revocation wins over a grant. */
function latestConsents(consents: Consent[]): Record<string, Consent> {
  const latest: Record<string, Consent> = {};
  for (const consent of consents) {
    const current = latest[consent.consentType];
    if (!current || new Date(consent.createdAt) > new Date(current.createdAt)) {
      latest[consent.consentType] = consent;
    }
  }
  return latest;
}

function isConsentActive(consent: Consent | undefined): boolean {
  return Boolean(consent?.granted) && !consent?.revokedAt;
}

export default function ParentsAdminPage() {
  const [studentId, setStudentId] = useState('');
  const [parents, setParents] = useState<Parent[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    relationship: 'FATHER',
    email: '',
    phone: '',
    whatsapp: '',
    country: '',
    city: '',
    occupation: '',
    accessLevel: 'LIMITED',
    portalEnabled: true,
    isPrimaryContact: false,
    isFinancialSponsor: false,
    notes: '',
    communicationPrefs: [] as string[],
  });

  const [payFor, setPayFor] = useState<{ parentId: string; responsibility: Responsibility } | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const load = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      toast.error('Enter a student id first.');
      return;
    }
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/parents?studentId=${encodeURIComponent(trimmed)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.status === 403 || res.status === 401) {
        setState('error');
        setMessage(json?.error || 'Staff access is required to manage parents and guardians.');
        return;
      }
      if (!res.ok || !json?.success) {
        setState('error');
        setMessage(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setParents(json.parents ?? []);
      setState('loaded');
      if ((json.count ?? 0) === 0) setMessage('No parent or guardian is recorded for this student.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Could not reach the parent service.');
    }
  }, []);

  async function createParent() {
    if (!form.fullName.trim()) {
      toast.error('A full name is required.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId.trim(),
          fullName: form.fullName.trim(),
          relationship: form.relationship,
          email: form.email.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
          country: form.country.trim(),
          city: form.city.trim(),
          occupation: form.occupation.trim(),
          accessLevel: form.accessLevel,
          portalEnabled: form.portalEnabled,
          isPrimaryContact: form.isPrimaryContact,
          isFinancialSponsor: form.isFinancialSponsor,
          notes: form.notes.trim(),
          communicationPrefs: form.communicationPrefs,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Creation failed with status ${res.status}.`);
        return;
      }
      toast.success('Parent/guardian record created.');
      setShowCreate(false);
      setForm({ ...form, fullName: '', email: '', phone: '', whatsapp: '', notes: '', communicationPrefs: [] });
      await load(studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Creation failed.');
    } finally {
      setCreating(false);
    }
  }

  async function patchParent(parent: Parent, changes: Record<string, unknown>) {
    setBusyId(parent.id);
    try {
      const res = await fetch(`/api/parents/${parent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Update failed with status ${res.status}.`);
        return;
      }
      const changed: string[] = json.changed ?? [];
      toast.success(changed.length > 0 ? `Updated: ${changed.join(', ')}` : 'No change was needed.');
      await load(studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function setConsent(parent: Parent, consentType: string, granted: boolean) {
    const method = window.prompt(
      granted
        ? `Record ${consentType} consent for ${parent.fullName}.\n\nHow was consent obtained? (PORTAL, EMAIL, SMS, PHONE, IN_PERSON, SIGNED_FORM)`
        : `Revoke ${consentType} consent for ${parent.fullName}.\n\nReason or channel (recorded for audit):`,
      granted ? 'PORTAL' : 'PORTAL',
    );
    if (method === null) return;
    setBusyId(parent.id);
    try {
      const res = await fetch(`/api/parents/${parent.id}/consents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType, granted, method: method.trim() || 'PORTAL' }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Consent update failed with status ${res.status}.`);
        return;
      }
      toast.success(
        granted
          ? `${consentType} consent granted. Previous records are retained.`
          : `${consentType} consent revoked. Previous records are retained.`,
      );
      await load(studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Consent update failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function addResponsibility(parent: Parent) {
    const raw = window.prompt(
      `Record a payment responsibility for ${parent.fullName}.\n\nFormat: SCOPE|AMOUNT|CURRENCY  (e.g. TUITION|5000|USD)`,
      'TUITION|0|USD',
    );
    if (raw === null) return;
    const [scope, amount, currency] = raw.split('|').map((part) => part.trim());
    if (!scope || !amount) {
      toast.error('Expected SCOPE|AMOUNT|CURRENCY.');
      return;
    }
    setBusyId(parent.id);
    try {
      const res = await fetch(`/api/parents/${parent.id}/responsibilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, amount: Number(amount), currency: currency || 'USD' }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Failed with status ${res.status}.`);
        return;
      }
      toast.success('Payment responsibility recorded.');
      await load(studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record responsibility.');
    } finally {
      setBusyId(null);
    }
  }

  async function recordPayment() {
    if (!payFor) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a positive amount.');
      return;
    }
    const owed = Math.max(0, payFor.responsibility.amount - payFor.responsibility.paidAmount);
    if (amount > owed) {
      const ok = window.confirm(
        `This payment (${amount}) exceeds the outstanding balance (${owed}).\n\nThe recorded paid amount will be capped at ${payFor.responsibility.amount}. Continue?`,
      );
      if (!ok) return;
    }
    setBusyId(payFor.responsibility.id);
    try {
      const res = await fetch(
        `/api/parents/${payFor.parentId}/responsibilities/${payFor.responsibility.id}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Payment failed with status ${res.status}.`);
        return;
      }
      toast.success(`Recorded. Paid ${json.paidAmount}, outstanding ${json.outstanding}, status ${json.status}.`);
      setPayFor(null);
      setPayAmount('');
      await load(studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment recording failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
          <Users className="size-5 text-[var(--alo-brand)]" />
          Parents &amp; Guardians
        </h1>
        <p className="mt-1 text-sm text-[var(--alo-body)]">
          Managed per student. Consent records are append-only and access levels are enforced
          server-side.
        </p>
      </div>

      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardContent className="flex flex-wrap items-end gap-2 pt-5 pb-5">
          <div className="min-w-[260px] flex-1 space-y-1.5">
            <Label htmlFor="student-id" className="text-xs font-semibold">Student id</Label>
            <Input
              id="student-id"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="stu_…"
              className="h-9 font-mono text-xs"
            />
          </div>
          <Button size="sm" onClick={() => void load(studentId)} disabled={state === 'loading'}>
            <Search className="mr-1.5 size-3.5" />
            {state === 'loading' ? 'Loading…' : 'Load'}
          </Button>
          {state === 'loaded' && (
            <Button variant="outline" size="sm" onClick={() => setShowCreate((value) => !value)}>
              <Plus className="mr-1.5 size-3.5" />
              {showCreate ? 'Cancel' : 'Add parent'}
            </Button>
          )}
        </CardContent>
      </Card>

      {state === 'error' && (
        <Card className="rounded-2xl border-2 border-red-200">
          <CardContent className="flex items-start gap-3 pt-6 pb-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Could not load parents</p>
              <p className="mt-0.5 text-xs text-red-700">{message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load(studentId)}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {state === 'loaded' && message && parents.length === 0 && (
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="py-8 text-center text-sm text-[var(--alo-text-muted)]">{message}</CardContent>
        </Card>
      )}

      {showCreate && (
        <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Add parent or guardian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-name" className="text-xs font-semibold">Full name *</Label>
                <Input id="c-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Relationship</Label>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className="h-9 w-full rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs"
                >
                  {RELATIONSHIPS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Access level</Label>
                <select
                  value={form.accessLevel}
                  onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                  className="h-9 w-full rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs"
                >
                  {ACCESS_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email" className="text-xs font-semibold">Email</Label>
                <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone" className="text-xs font-semibold">Phone</Label>
                <Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-wa" className="text-xs font-semibold">WhatsApp</Label>
                <Input id="c-wa" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-country" className="text-xs font-semibold">Country</Label>
                <Input id="c-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-city" className="text-xs font-semibold">City</Label>
                <Input id="c-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-occ" className="text-xs font-semibold">Occupation</Label>
                <Input id="c-occ" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Communication channels</Label>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map((channel) => {
                  const on = form.communicationPrefs.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          communicationPrefs: on
                            ? form.communicationPrefs.filter((item) => item !== channel)
                            : [...form.communicationPrefs, channel],
                        })
                      }
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        on ? 'border-[var(--alo-brand)] bg-[var(--alo-brand)] text-white' : 'border-[var(--alo-border)] bg-white text-[var(--alo-body)]'
                      }`}
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={form.portalEnabled} onCheckedChange={(v) => setForm({ ...form, portalEnabled: v })} />
                Portal enabled
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={form.isPrimaryContact} onCheckedChange={(v) => setForm({ ...form, isPrimaryContact: v })} />
                Primary contact
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={form.isFinancialSponsor} onCheckedChange={(v) => setForm({ ...form, isFinancialSponsor: v })} />
                Financial sponsor
              </label>
            </div>

            <p className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[11px] text-blue-900">
              {ACCESS_CONSEQUENCE[form.accessLevel]}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="c-notes" className="text-xs font-semibold">Internal notes (never shown in the parent portal)</Label>
              <Textarea id="c-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="text-xs" />
            </div>

            <Button size="sm" onClick={() => void createParent()} disabled={creating}>
              {creating ? 'Creating…' : 'Create record'}
            </Button>
          </CardContent>
        </Card>
      )}

      {parents.map((parent) => {
        const isOpen = expanded === parent.id;
        const consents = latestConsents(parent.consents);
        const communicationConsent = isConsentActive(consents.COMMUNICATION);
        // A channel is usable only with BOTH consent and an opted-in preference.
        const permittedChannels = communicationConsent
          ? parent.communicationPrefs
          : [];

        return (
          <Card key={parent.id} className="rounded-2xl border-2 border-[var(--alo-border)]">
            <CardContent className="space-y-3 pt-5 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--alo-text)]">
                    {parent.fullName}
                    <span className="ml-2 text-[11px] font-normal text-[var(--alo-text-muted)]">{parent.relationship}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--alo-body)]">
                    {[parent.email, parent.phone].filter(Boolean).join(' · ') || 'No contact details recorded'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`text-[11px] ${ACCESS_STYLE[parent.accessLevel] ?? ''}`}>
                    {parent.accessLevel}
                  </Badge>
                  {parent.portalEnabled && <Badge variant="outline" className="text-[11px]">portal on</Badge>}
                  {parent.isPrimaryContact && <Badge variant="outline" className="text-[11px]">primary</Badge>}
                  {parent.isFinancialSponsor && <Badge variant="outline" className="text-[11px]">sponsor</Badge>}
                  <Badge variant="outline" className={parent.status === 'ACTIVE' ? 'text-[11px]' : 'border-red-200 bg-red-50 text-[11px] text-red-700'}>
                    {parent.status}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : parent.id)}>
                    {isOpen ? 'Collapse' : 'Manage'}
                  </Button>
                </div>
              </div>

              {/* Channels actually permitted, not just recorded */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-[var(--alo-body)]">Contactable via:</span>
                {permittedChannels.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[var(--alo-text-muted)]">
                    <EyeOff className="size-3" />
                    none — {communicationConsent ? 'no channel preference recorded' : 'COMMUNICATION consent not active'}
                  </span>
                ) : (
                  permittedChannels.map((channel) => (
                    <Badge key={channel} variant="outline" className="text-[11px]">{channel}</Badge>
                  ))
                )}
              </div>

              {isOpen && (
                <>
                  {/* Access control */}
                  <div className="space-y-2 rounded-xl border border-[var(--alo-border)] p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--alo-text)]">
                      <ShieldCheck className="size-3.5 text-[var(--alo-brand)]" />
                      Access control
                    </p>
                    <p className="text-[11px] text-[var(--alo-body)]">{ACCESS_CONSEQUENCE[parent.accessLevel]}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={parent.accessLevel}
                        onChange={(e) => void patchParent(parent, { accessLevel: e.target.value })}
                        disabled={busyId === parent.id}
                        className="h-8 rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs"
                        aria-label={`Access level for ${parent.fullName}`}
                      >
                        {ACCESS_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-xs">
                        <Switch
                          checked={parent.portalEnabled}
                          disabled={busyId === parent.id}
                          onCheckedChange={(v) => void patchParent(parent, { portalEnabled: v })}
                        />
                        Portal enabled
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === parent.id}
                        onClick={() => void patchParent(parent, { status: parent.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                      >
                        {parent.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </div>
                    {parent.accessLevel === 'NONE' && parent.portalEnabled && (
                      <p className="text-[11px] text-amber-800">
                        Portal is enabled but the access level is NONE, so the parent still sees nothing.
                      </p>
                    )}
                    {parent.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {parent.capabilities.map((capability) => (
                          <span key={capability} className="rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--alo-body)]">
                            {capability}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Consents — append-only */}
                  <div className="space-y-2 rounded-xl border border-[var(--alo-border)] p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--alo-text)]">
                      <FileSignature className="size-3.5 text-[var(--alo-brand)]" />
                      Consent records ({parent.consents.length} total, append-only)
                    </p>
                    <div className="space-y-1.5">
                      {CONSENT_TYPES.map((type) => {
                        const current = consents[type];
                        const active = isConsentActive(current);
                        return (
                          <div key={type} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] px-2.5 py-1.5">
                            <div className="min-w-0">
                              <p className="font-mono text-[11px] font-semibold text-[var(--alo-text)]">{type}</p>
                              <p className="text-[11px] text-[var(--alo-text-muted)]">
                                {current
                                  ? `${active ? 'granted' : 'not active'} via ${current.method || 'unspecified'} · v${current.version} · ${new Date(current.createdAt).toLocaleDateString()}`
                                  : 'no record — treated as not consented'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={active ? 'border-emerald-200 bg-emerald-50 text-[11px] text-emerald-800' : 'border-[var(--alo-border)] bg-white text-[11px] text-[var(--alo-text-muted)]'}>
                                {active ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                              <Button variant="outline" size="sm" disabled={busyId === parent.id} onClick={() => void setConsent(parent, type, true)}>
                                Grant
                              </Button>
                              <Button variant="outline" size="sm" disabled={busyId === parent.id || !active} onClick={() => void setConsent(parent, type, false)}>
                                Revoke
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">
                      Revoking never deletes history: a new record is appended and the latest one governs.
                    </p>
                  </div>

                  {/* Payment responsibilities */}
                  <div className="space-y-2 rounded-xl border border-[var(--alo-border)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--alo-text)]">
                        <Wallet className="size-3.5 text-[var(--alo-brand)]" />
                        Payment responsibilities ({parent.responsibilities.length})
                      </p>
                      <Button variant="outline" size="sm" disabled={busyId === parent.id} onClick={() => void addResponsibility(parent)}>
                        <Plus className="mr-1 size-3.5" />
                        Add
                      </Button>
                    </div>
                    {parent.responsibilities.length === 0 ? (
                      <p className="text-[11px] text-[var(--alo-text-muted)]">None recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-[var(--alo-border)] text-left font-bold text-[var(--alo-body)]">
                              <th className="p-1.5">Scope</th>
                              <th className="p-1.5">Amount</th>
                              <th className="p-1.5">Paid</th>
                              <th className="p-1.5">Outstanding</th>
                              <th className="p-1.5">Status</th>
                              <th className="p-1.5" />
                            </tr>
                          </thead>
                          <tbody>
                            {parent.responsibilities.map((item) => (
                              <tr key={item.id} className="border-b border-[var(--alo-border)]">
                                <td className="p-1.5">{item.scope}</td>
                                <td className="p-1.5 font-mono">{item.amount} {item.currency}</td>
                                <td className="p-1.5 font-mono">{item.paidAmount}</td>
                                <td className="p-1.5 font-mono font-semibold">
                                  {Math.max(0, item.amount - item.paidAmount)}
                                </td>
                                <td className="p-1.5"><Badge variant="outline" className="text-[11px]">{item.status}</Badge></td>
                                <td className="p-1.5">
                                  {item.amount - item.paidAmount > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => { setPayFor({ parentId: parent.id, responsibility: item }); setPayAmount(''); }}
                                    >
                                      Record payment
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {payFor && (
        <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Record payment — {payFor.responsibility.scope}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--alo-body)]">
              Owed {payFor.responsibility.amount} {payFor.responsibility.currency}, already paid{' '}
              {payFor.responsibility.paidAmount}, outstanding{' '}
              {Math.max(0, payFor.responsibility.amount - payFor.responsibility.paidAmount)}.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount" className="text-xs font-semibold">Amount received</Label>
              <Input
                id="pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="h-9 max-w-xs text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void recordPayment()} disabled={busyId === payFor.responsibility.id}>
                Record payment
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPayFor(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
