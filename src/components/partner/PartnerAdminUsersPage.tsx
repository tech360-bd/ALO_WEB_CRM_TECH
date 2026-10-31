'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, RefreshCw, Users, UserPlus, Armchair } from 'lucide-react';

interface PartnerUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  status: string;
  createdAt: string;
  partnerProfile?: { partnerRole: string } | null;
}
interface SeatRequest {
  id: string;
  currentLimit: number;
  requestedExtraSeats: number;
  reason: string;
  status: string;
  reviewNote: string;
  createdAt: string;
}
const ROLE_OPTIONS = [
  { value: 'PARTNER_COUNSELOR', label: 'Counselor' },
  { value: 'PARTNER_APPLICATION_ASSISTANT', label: 'Application assistant' },
  { value: 'PARTNER_MARKETING_ASSISTANT', label: 'Marketing assistant' },
  { value: 'PARTNER_DOCUMENT_ASSISTANT', label: 'Document assistant' },
  { value: 'PARTNER_VIEWER', label: 'Viewer' },
];
function titleCase(value: string) { return value.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleDateString(); }

export default function PartnerAdminUsersPage() {
  const [users, setUsers] = useState<PartnerUser[]>([]);
  const [seatRequests, setSeatRequests] = useState<SeatRequest[]>([]);
  const [callerRole, setCallerRole] = useState('PARTNER_VIEWER');
  const [seatLimit, setSeatLimit] = useState(0);
  const [seatCount, setSeatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{ kind: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [requestingSeats, setRequestingSeats] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [extraSeats, setExtraSeats] = useState('1');
  const [seatReason, setSeatReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userResponse, requestsResponse] = await Promise.all([
        fetch('/api/partner-admin/users', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/partner-admin/seat-requests', { credentials: 'include', cache: 'no-store' }),
      ]);
      const [userPayload, requestPayload] = await Promise.all([
        userResponse.json().catch(() => ({})),
        requestsResponse.json().catch(() => ({})),
      ]);
      if (!userResponse.ok || !userPayload.success) throw new Error(userPayload.error || `Users could not be loaded (HTTP ${userResponse.status}).`);
      if (!requestsResponse.ok || !requestPayload.success) throw new Error(requestPayload.error || `Seat requests could not be loaded (HTTP ${requestsResponse.status}).`);
      setUsers(Array.isArray(userPayload.users) ? userPayload.users : []);
      setCallerRole(String(userPayload.callerRole || 'PARTNER_VIEWER').toUpperCase());
      setSeatLimit(Number(userPayload.seatLimit || 0));
      setSeatCount(Number(userPayload.currentCount || 0));
      setSeatRequests(Array.isArray(requestPayload.requests) ? requestPayload.requests : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Partner user data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const canManage = callerRole === 'PARTNER_SUPER_ADMIN';
  const pendingRequest = seatRequests.some((request) => request.status.toUpperCase() === 'PENDING');

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingUser(true);
    setFormMessage(null);
    try {
      const response = await fetch('/api/partner-admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, partnerRole: role }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Invitation could not be created (HTTP ${response.status}).`);
      setName('');
      setEmail('');
      setFormMessage({
        kind: payload.invitationSent ? 'success' : 'warning',
        text: payload.message || (payload.invitationSent ? 'Invitation sent.' : 'Account created, but invitation email delivery was not confirmed.'),
      });
      await load();
    } catch (caught) {
      setFormMessage({ kind: 'error', text: caught instanceof Error ? caught.message : 'The partner invitation could not be created.' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSeatRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestingSeats(true);
    setFormMessage(null);
    try {
      const response = await fetch('/api/partner-admin/seat-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedExtraSeats: Number(extraSeats), reason: seatReason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Seat request could not be submitted (HTTP ${response.status}).`);
      setSeatReason('');
      setFormMessage({ kind: 'success', text: payload.message || 'Seat request submitted to ALO Education for review.' });
      await load();
    } catch (caught) {
      setFormMessage({ kind: 'error', text: caught instanceof Error ? caught.message : 'The seat request could not be submitted.' });
    } finally {
      setRequestingSeats(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-alo-text">Partner team &amp; seats</h1><p className="mt-1 text-sm text-alo-text-muted">Manage users in your own partner organisation and request ALO-reviewed seat changes.</p></div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-crm-danger-border bg-crm-danger-bg p-3 text-sm text-crm-danger-text"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {formMessage && <div role="status" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${formMessage.kind === 'success' ? 'border-crm-success-border bg-crm-success-bg text-crm-success-text' : formMessage.kind === 'warning' ? 'border-crm-warning-border bg-crm-warning-bg text-crm-warning-text' : 'border-crm-danger-border bg-crm-danger-bg text-crm-danger-text'}`}>{formMessage.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}{formMessage.text}</div>}

      {loading ? <div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="p-8 text-center text-sm text-alo-text-muted">Loading partner users…</CardContent></Card><Card><CardContent className="p-8 text-center text-sm text-alo-text-muted">Loading seat requests…</CardContent></Card></div> : <>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-xl border-alo-border bg-white"><CardContent className="flex items-center gap-3 p-4"><Users className="h-5 w-5 text-alo-brand" /><div><p className="text-xs text-alo-text-muted">Seats in use</p><p className="text-xl font-semibold text-alo-text">{seatCount} / {seatLimit || '—'}</p></div></CardContent></Card>
          <Card className="rounded-xl border-alo-border bg-white"><CardContent className="flex items-center gap-3 p-4"><Armchair className="h-5 w-5 text-alo-brand" /><div><p className="text-xs text-alo-text-muted">Available seats</p><p className="text-xl font-semibold text-alo-text">{Math.max(0, seatLimit - seatCount)}</p></div></CardContent></Card>
          <Card className="rounded-xl border-alo-border bg-white"><CardContent className="flex items-center gap-3 p-4"><UserPlus className="h-5 w-5 text-alo-brand" /><div><p className="text-xs text-alo-text-muted">Your partner role</p><p className="text-sm font-semibold text-alo-text">{titleCase(callerRole)}</p></div></CardContent></Card>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Team members ({users.length})</CardTitle></CardHeader><CardContent>
            {users.length === 0 ? <p className="py-6 text-center text-sm text-alo-text-muted">No partner users are recorded.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr className="border-b text-xs text-alo-text-muted"><th className="pb-2 font-medium">Name / email</th><th className="pb-2 font-medium">Role</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Added</th></tr></thead><tbody>{users.map((member) => <tr key={member.id} className="border-b last:border-0"><td className="py-3"><p className="font-medium text-alo-text">{member.name || 'Name not set'}</p><p className="text-xs text-alo-text-muted">{member.email}</p></td><td className="py-3 text-xs">{titleCase(member.partnerProfile?.partnerRole || 'PARTNER')}</td><td className="py-3"><Badge variant="outline">{titleCase(member.status)}</Badge></td><td className="py-3 text-xs text-alo-text-muted">{formatDate(member.createdAt)}</td></tr>)}</tbody></table></div>}
          </CardContent></Card>

          <div className="space-y-6">
            <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" />Invite a team member</CardTitle></CardHeader><CardContent>
              {!canManage ? <p className="text-sm text-alo-text-muted">Only the Partner Super Admin can invite users. Contact your organisation administrator to add a team member.</p> : <form onSubmit={handleCreateUser} className="space-y-4"><div className="space-y-2"><Label htmlFor="partner-user-name">Name</Label><Input id="partner-user-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required /></div><div className="space-y-2"><Label htmlFor="partner-user-email">Email address</Label><Input id="partner-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></div><div className="space-y-2"><Label>Partner role</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><Button type="submit" disabled={creatingUser || (seatCount >= seatLimit && seatLimit > 0)}><UserPlus className="mr-2 h-4 w-4" />{creatingUser ? 'Creating invitation…' : 'Invite user'}</Button>{seatCount >= seatLimit && seatLimit > 0 && <p className="text-xs text-crm-warning-text">No seats are available. Request more seats below.</p>}</form>}
            </CardContent></Card>

            <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Armchair className="h-4 w-4" />Request extra seats</CardTitle></CardHeader><CardContent>
              {!canManage ? <p className="text-sm text-alo-text-muted">Only the Partner Super Admin can request seats from ALO Education.</p> : pendingRequest ? <p className="text-sm text-alo-text-muted">An extra-seat request is already pending ALO Education review.</p> : <form onSubmit={handleSeatRequest} className="space-y-4"><div className="space-y-2"><Label htmlFor="extra-seat-count">Additional seats requested</Label><Input id="extra-seat-count" type="number" min="1" max="50" step="1" value={extraSeats} onChange={(event) => setExtraSeats(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="seat-request-reason">Business reason (at least 10 characters)</Label><Textarea id="seat-request-reason" value={seatReason} onChange={(event) => setSeatReason(event.target.value)} minLength={10} maxLength={1000} required /></div><Button type="submit" variant="outline" disabled={requestingSeats}>{requestingSeats ? 'Submitting…' : 'Send request to ALO Education'}</Button></form>}
            </CardContent></Card>
          </div>
        </div>

        <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="text-base">Seat request history</CardTitle></CardHeader><CardContent>{seatRequests.length === 0 ? <p className="text-sm text-alo-text-muted">No seat requests have been submitted.</p> : <div className="space-y-3">{seatRequests.map((request) => <div key={request.id} className="flex flex-col justify-between gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-alo-text">+{request.requestedExtraSeats} seat{request.requestedExtraSeats === 1 ? '' : 's'} requested from a {request.currentLimit}-seat limit</p><p className="mt-1 text-xs text-alo-text-muted">{request.reason || 'No reason recorded'} · {formatDate(request.createdAt)}</p>{request.reviewNote && <p className="mt-1 text-xs text-alo-text-muted">Review note: {request.reviewNote}</p>}</div><Badge variant="outline">{titleCase(request.status)}</Badge></div>)}</div>}</CardContent></Card>
      </>}
    </div>
  );
}
