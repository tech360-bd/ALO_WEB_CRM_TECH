'use client';

// ============================================================
// OUTBOUND WEBHOOKS — administration (spec s77, s94, s66)
// ============================================================
// Manages subscriptions, inspects real delivery outcomes and documents the
// signing contract.
//
// Honesty rules enforced in this UI:
//   * With no subscription the page states NOT CONFIGURED. It never implies
//     outbound delivery is working (s94).
//   * A signing secret is shown EXACTLY ONCE, at creation or rotation, and the
//     UI says plainly that it cannot be retrieved again (s66). Stored secrets
//     are encrypted and never returned by the API.
//   * "Send test" reports the true HTTP outcome. A failed test is rendered as a
//     failure with the real status/error, never as success.
//   * Delivery rows show attempts, response status and the recorded error, so a
//     silently failing integration is visible (s91).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Webhook,
  Plus,
  RefreshCw,
  Send,
  KeyRound,
  Trash2,
  RotateCcw,
  Info,
  AlertTriangle,
  Copy,
  ListTree,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  name: string;
  targetUrl: string;
  events: string;
  active: boolean;
  environment: string;
  partnerId: string | null;
  branchId: string | null;
  maxRetries: number;
  timeoutMs: number;
  description: string;
  secretConfigured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Delivery {
  id: string;
  subscriptionId: string;
  eventId: string;
  eventType: string;
  status: string;
  attempts: number;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
}

interface DeliveryStats {
  since: string;
  delivered: number;
  failed: number;
  dead: number;
  pending: number;
  total: number;
}

interface Catalogue {
  events: string[];
  signing: { algorithm: string; signedPayload: string; headers: string[]; note: string };
  delivery: { retries: string; deadLetter: string; idempotency: string };
}

const STATUS_STYLE: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
  FAILED: 'bg-amber-100 text-amber-800 border-amber-200',
  DEAD: 'bg-red-100 text-red-800 border-red-200',
  SKIPPED: 'bg-slate-100 text-slate-700 border-slate-200',
};

function parseEvents(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export default function WebhooksAdminPage() {
  const [tab, setTab] = useState<'subscriptions' | 'deliveries' | 'catalogue'>('subscriptions');

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', targetUrl: '', events: '', description: '' });
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // A secret is shown once and only once.
  const [revealedSecret, setRevealedSecret] = useState<{ subscription: string; secret: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setFailure('');
    try {
      const res = await fetch('/api/webhooks/subscriptions', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setFailure(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setSubscriptions(json.subscriptions ?? []);
      setConfigured(json.configured === true);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Could not load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalogue = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks/events', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) setCatalogue(json as Catalogue);
    } catch {
      // The catalogue is documentation; failing to load it is not fatal.
    }
  }, []);

  const loadDeliveries = useCallback(async (status: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/webhooks/deliveries?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Could not load deliveries.');
        return;
      }
      setDeliveries(json.deliveries ?? []);
      setDeliveryTotal(json.total ?? 0);
      setStats(json.stats ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load deliveries.');
    }
  }, []);

  useEffect(() => {
    void loadSubscriptions();
    void loadCatalogue();
  }, [loadSubscriptions, loadCatalogue]);

  useEffect(() => {
    if (tab === 'deliveries') void loadDeliveries(statusFilter);
  }, [tab, statusFilter, loadDeliveries]);

  async function createSubscription() {
    if (!form.name.trim() || !form.targetUrl.trim()) {
      toast.error('A name and a target URL are required.');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Select at least one event.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/webhooks/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          targetUrl: form.targetUrl.trim(),
          events: selectedEvents,
          description: form.description.trim(),
          active: true,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Creation failed with status ${res.status}.`);
        return;
      }
      // Show the plaintext secret exactly once.
      setRevealedSecret({ subscription: json.subscription.name, secret: json.secret });
      toast.success('Subscription created. Copy the signing secret now — it is not shown again.');
      setShowCreate(false);
      setForm({ name: '', targetUrl: '', events: '', description: '' });
      setSelectedEvents([]);
      await loadSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Creation failed.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(subscription: Subscription) {
    setBusyId(subscription.id);
    try {
      const res = await fetch(`/api/webhooks/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !subscription.active }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Update failed.');
        return;
      }
      toast.success(`${subscription.name} is now ${!subscription.active ? 'ACTIVE' : 'PAUSED'}.`);
      await loadSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function rotateSecret(subscription: Subscription) {
    if (!window.confirm(`Rotate the signing secret for ${subscription.name}? The current secret stops working immediately.`)) return;
    setBusyId(subscription.id);
    try {
      const res = await fetch(`/api/webhooks/subscriptions/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate-secret' }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Rotation failed.');
        return;
      }
      setRevealedSecret({ subscription: subscription.name, secret: json.secret });
      toast.success('Secret rotated. Copy it now — the old secret no longer works.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rotation failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeSubscription(subscription: Subscription) {
    if (!window.confirm(`Delete ${subscription.name}? Queued deliveries for it will stop.`)) return;
    setBusyId(subscription.id);
    try {
      const res = await fetch(`/api/webhooks/subscriptions/${subscription.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Delete failed.');
        return;
      }
      toast.success('Subscription deleted.');
      await loadSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function sendTest(subscription: Subscription) {
    setTestingId(subscription.id);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Test request failed with status ${res.status}.`);
        return;
      }
      // Truthful reporting: success only means the test ran.
      if (json.delivered) {
        toast.success(`Test delivered — HTTP ${json.httpStatus} in ${json.durationMs ?? '?'}ms.`);
      } else {
        toast.error(`Test NOT delivered (${json.status}). ${json.error || ''} HTTP ${json.httpStatus ?? 'n/a'}`);
      }
      if (tab === 'deliveries') await loadDeliveries(statusFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Test failed.');
    } finally {
      setTestingId(null);
    }
  }

  async function replay(delivery: Delivery) {
    setBusyId(delivery.id);
    try {
      const res = await fetch(`/api/webhooks/deliveries/${delivery.id}/replay`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        // 409 means it was already delivered — replay protection, not a failure.
        toast.error(json?.error || `Replay failed with status ${res.status}.`);
        return;
      }
      toast.success(`Requeued for delivery (${json.delivery?.status ?? 'PENDING'}).`);
      await loadDeliveries(statusFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Replay failed.');
    } finally {
      setBusyId(null);
    }
  }

  const allEvents = catalogue?.events ?? [];

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Webhook className="size-5 text-[#0057B8]" />
            Outbound Webhooks
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Signed event delivery to external systems, with retry, dead-lettering and replay.
          </p>
        </div>
        <div className="flex gap-2">
          {(['subscriptions', 'deliveries', 'catalogue'] as const).map((key) => (
            <Button
              key={key}
              variant={tab === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(key)}
              className="capitalize"
            >
              {key}
            </Button>
          ))}
        </div>
      </div>

      {/* One-time secret reveal */}
      {revealedSecret && (
        <Card className="rounded-2xl border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <KeyRound className="size-4" />
              Signing secret for {revealedSecret.subscription} — shown once
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs">
                {revealedSecret.secret}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(revealedSecret.secret);
                  toast.success('Copied to clipboard.');
                }}
              >
                <Copy className="mr-1.5 size-3.5" />
                Copy
              </Button>
            </div>
            <p className="text-[11px] text-amber-900">
              This value is stored encrypted and cannot be retrieved again. If you lose it you must
              rotate, which immediately invalidates the current secret.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setRevealedSecret(null)}>
              I have saved it — dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {failure && (
        <Card className="rounded-2xl border-2 border-red-200">
          <CardContent className="flex items-start gap-3 pt-6 pb-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Could not load webhooks</p>
              <p className="mt-0.5 text-xs text-red-700">{failure}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadSubscriptions()}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---------------- SUBSCRIPTIONS ---------------- */}
      {tab === 'subscriptions' && (
        <>
          {!configured && !failure && (
            <Card className="rounded-2xl border-2 border-slate-300 bg-slate-50">
              <CardContent className="flex items-start gap-3 pt-6 pb-6">
                <Info className="mt-0.5 size-5 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-bold text-slate-800">NOT CONFIGURED</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    No outbound webhook subscription exists, so no events are being delivered to any
                    external system. Create one below to enable delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreate((value) => !value)}>
              <Plus className="mr-1.5 size-3.5" />
              {showCreate ? 'Cancel' : 'New subscription'}
            </Button>
          </div>

          {showCreate && (
            <Card className="rounded-2xl border-2 border-[#0057B8]/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Create subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="wh-name" className="text-xs font-semibold">Name</Label>
                    <Input
                      id="wh-name"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="Partner CRM sync"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wh-url" className="text-xs font-semibold">Target URL (https)</Label>
                    <Input
                      id="wh-url"
                      value={form.targetUrl}
                      onChange={(event) => setForm({ ...form, targetUrl: event.target.value })}
                      placeholder="https://partner.example.com/webhooks/alo"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Events ({selectedEvents.length} selected)
                  </Label>
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
                    {allEvents.map((event) => {
                      const on = selectedEvents.includes(event);
                      return (
                        <button
                          key={event}
                          type="button"
                          onClick={() =>
                            setSelectedEvents((current) =>
                              on ? current.filter((item) => item !== event) : [...current, event],
                            )
                          }
                          className={`rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
                            on
                              ? 'border-[#0057B8] bg-[#0057B8] text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {event}
                        </button>
                      );
                    })}
                    {allEvents.length === 0 && (
                      <span className="text-[11px] text-slate-500">Event catalogue unavailable.</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A namespace wildcard such as <code className="font-mono">application.*</code> is
                    accepted when the namespace exists in the catalogue.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wh-desc" className="text-xs font-semibold">Description</Label>
                  <Textarea
                    id="wh-desc"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <Button size="sm" onClick={() => void createSubscription()} disabled={creating}>
                  {creating ? 'Creating…' : 'Create subscription'}
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading subscriptions…</p>
          ) : subscriptions.length === 0 ? (
            !failure && <p className="py-8 text-center text-sm text-slate-500">No subscriptions yet.</p>
          ) : (
            <div className="space-y-2.5">
              {subscriptions.map((subscription) => {
                const events = parseEvents(subscription.events);
                return (
                  <Card key={subscription.id} className="rounded-2xl border-2 border-slate-200">
                    <CardContent className="space-y-2.5 pt-5 pb-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{subscription.name}</p>
                          <p className="truncate font-mono text-[11px] text-slate-500">{subscription.targetUrl}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={subscription.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                            {subscription.active ? 'ACTIVE' : 'PAUSED'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{subscription.environment}</Badge>
                          <Badge variant="outline" className={subscription.secretConfigured ? 'text-[10px]' : 'border-red-200 bg-red-50 text-[10px] text-red-700'}>
                            {subscription.secretConfigured ? 'signed' : 'NO SECRET'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {events.map((event) => (
                          <span key={event} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                            {event}
                          </span>
                        ))}
                      </div>

                      {subscription.description && (
                        <p className="text-[11px] text-slate-600">{subscription.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
                        <Button variant="outline" size="sm" onClick={() => void sendTest(subscription)} disabled={testingId === subscription.id}>
                          <Send className="mr-1.5 size-3.5" />
                          {testingId === subscription.id ? 'Testing…' : 'Send test'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void toggleActive(subscription)} disabled={busyId === subscription.id}>
                          <Switch checked={subscription.active} className="mr-1.5 scale-75" aria-hidden />
                          {subscription.active ? 'Pause' : 'Activate'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void rotateSecret(subscription)} disabled={busyId === subscription.id}>
                          <KeyRound className="mr-1.5 size-3.5" />
                          Rotate secret
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void removeSubscription(subscription)} disabled={busyId === subscription.id}>
                          <Trash2 className="mr-1.5 size-3.5 text-red-600" />
                          Delete
                        </Button>
                        <span className="ml-auto font-mono text-[10px] text-slate-400">
                          retries {subscription.maxRetries} · timeout {subscription.timeoutMs}ms
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------------- DELIVERIES ---------------- */}
      {tab === 'deliveries' && (
        <>
          {stats && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Delivered', value: stats.delivered, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
                { label: 'Pending', value: stats.pending, className: 'border-blue-200 bg-blue-50 text-blue-800' },
                { label: 'Failed', value: stats.failed, className: 'border-amber-200 bg-amber-50 text-amber-800' },
                { label: 'Dead-lettered', value: stats.dead, className: 'border-red-200 bg-red-50 text-red-800' },
                { label: 'Total (7d)', value: stats.total, className: 'border-slate-200 bg-slate-50 text-slate-800' },
              ].map((item) => (
                <Card key={item.label} className={`rounded-2xl border-2 ${item.className}`}>
                  <CardContent className="pt-5 pb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{item.label}</p>
                    <p className="text-2xl font-black">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"
              aria-label="Filter deliveries by status"
            >
              <option value="">All statuses</option>
              {['DELIVERED', 'PENDING', 'FAILED', 'DEAD', 'SKIPPED'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => void loadDeliveries(statusFilter)}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Refresh
            </Button>
            <span className="text-[11px] text-slate-500">{deliveryTotal} matching deliveries</span>
          </div>

          <Card className="rounded-2xl border-2 border-slate-200">
            <CardContent className="pt-5 pb-5">
              {deliveries.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No deliveries recorded{statusFilter ? ` for ${statusFilter}` : ''}. A delivery row is
                  created only when an event is actually emitted.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left font-bold text-slate-600">
                        <th className="p-2">Event</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">HTTP</th>
                        <th className="p-2">Attempts</th>
                        <th className="p-2">Duration</th>
                        <th className="p-2">Error</th>
                        <th className="p-2">When</th>
                        <th className="p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((delivery) => (
                        <tr key={delivery.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2 font-mono">{delivery.eventType}</td>
                          <td className="p-2">
                            <Badge variant="outline" className={`text-[9px] ${STATUS_STYLE[delivery.status] ?? ''}`}>
                              {delivery.status}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono">{delivery.responseStatus ?? '—'}</td>
                          <td className="p-2 font-mono">{delivery.attempts}</td>
                          <td className="p-2 font-mono">{delivery.durationMs != null ? `${delivery.durationMs}ms` : '—'}</td>
                          <td className="max-w-[220px] truncate p-2 text-red-700" title={delivery.errorMessage ?? ''}>
                            {delivery.errorMessage || '—'}
                          </td>
                          <td className="whitespace-nowrap p-2">
                            {delivery.lastAttemptAt ? new Date(delivery.lastAttemptAt).toLocaleString() : '—'}
                          </td>
                          <td className="p-2">
                            {(delivery.status === 'DEAD' || delivery.status === 'FAILED') && (
                              <Button variant="outline" size="sm" onClick={() => void replay(delivery)} disabled={busyId === delivery.id}>
                                <RotateCcw className="mr-1 size-3" />
                                Replay
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ---------------- CATALOGUE ---------------- */}
      {tab === 'catalogue' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <ListTree className="size-4 text-[#0057B8]" />
                Event catalogue ({allEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {allEvents.map((event) => (
                <span key={event} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-700">
                  {event}
                </span>
              ))}
              {allEvents.length === 0 && (
                <p className="text-xs text-slate-500">Catalogue could not be loaded.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Activity className="size-4 text-[#0057B8]" />
                Signing &amp; delivery contract
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              {catalogue ? (
                <>
                  <div>
                    <p className="font-bold">Signature</p>
                    <p className="mt-0.5 font-mono text-[11px]">{catalogue.signing.algorithm}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      signed payload = {catalogue.signing.signedPayload}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {catalogue.signing.headers.map((header) => (
                        <span key={header} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">
                          {header}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-600">{catalogue.signing.note}</p>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5">
                    <p className="font-bold">Retries</p>
                    <p className="mt-0.5 text-[11px]">{catalogue.delivery.retries}</p>
                    <p className="mt-1.5 font-bold">Dead letter</p>
                    <p className="mt-0.5 text-[11px]">{catalogue.delivery.deadLetter}</p>
                    <p className="mt-1.5 font-bold">Idempotency</p>
                    <p className="mt-0.5 text-[11px]">{catalogue.delivery.idempotency}</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">Contract documentation unavailable.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
