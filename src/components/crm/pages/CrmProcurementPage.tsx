'use client';

// ============================================================================
// ALO Education — Procurement & Assets Center.
// Vendors, purchase requests, purchase orders, vendor invoices and fixed
// assets with depreciation — all from /api/procurement/* and /api/assets/*,
// backed by real database tables. Approval actions call the real
// transactional endpoints. Empty states are honest.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Truck, ClipboardList, Package, Receipt, Laptop, Loader2, RefreshCw } from 'lucide-react';

function money(cents: number | undefined | null): string {
  if (cents === undefined || cents === null || !Number.isFinite(cents)) return '—';
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const statusBadge = (status: string): string => ({
  DRAFT: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CONVERTED: 'bg-purple-100 text-purple-700',
  SENT: 'bg-blue-100 text-blue-700',
  PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  MATCHED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700',
  DISPUTED: 'bg-red-100 text-red-700',
  IN_USE: 'bg-emerald-100 text-emerald-700',
  IN_STORAGE: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  RETIRED: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  DISPOSED: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  BLACKLISTED: 'bg-red-100 text-red-700',
}[status] ?? 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]');

export default function CrmProcurementPage() {
  const [tab, setTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [assetTotals, setAssetTotals] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      fetch('/api/procurement/vendors').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`vendors HTTP ${r.status}`)))),
      fetch('/api/procurement/purchase-requests').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`requests HTTP ${r.status}`)))),
      fetch('/api/procurement/purchase-orders').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`orders HTTP ${r.status}`)))),
      fetch('/api/procurement/vendor-invoices').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`invoices HTTP ${r.status}`)))),
      fetch('/api/assets').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`assets HTTP ${r.status}`)))),
    ]);
    if (results[0].status === 'fulfilled') setVendors(results[0].value.vendors ?? []);
    if (results[1].status === 'fulfilled') setRequests(results[1].value.requests ?? []);
    if (results[2].status === 'fulfilled') setOrders(results[2].value.orders ?? []);
    if (results[3].status === 'fulfilled') setInvoices(results[3].value.invoices ?? []);
    if (results[4].status === 'fulfilled') {
      setAssets(results[4].value.assets ?? []);
      setAssetTotals(results[4].value.totals ?? null);
    }
    const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    setError(failed ? String(failed.reason?.message ?? failed.reason) : null);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const act = async (fn: () => Promise<Response>, successReload = true) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fn();
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (successReload) await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const runDepreciation = () => act(() => fetch('/api/assets/depreciation', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ period }),
  }));

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)]">Procurement & Assets</h1>
          <p className="text-xs text-[var(--alo-text-muted)]">Vendors, purchase requests/orders, vendor invoices, fixed assets and depreciation — ledger-integrated</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadAll} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-700">
            API error: {error}. Verify your session has FINANCE/ADMIN/SUPER_ADMIN/PROCUREMENT access.
          </CardContent>
        </Card>
      )}
      {actionError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 text-sm text-orange-700">{actionError}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Vendors</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendors.length}</div><p className="text-xs text-[var(--alo-text-muted)]">{vendors.filter((v) => v.status === 'ACTIVE').length} active</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Open requests</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{requests.filter((r) => ['DRAFT', 'SUBMITTED'].includes(r.status)).length}</div><p className="text-xs text-[var(--alo-text-muted)]">{requests.length} total</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Outstanding payable</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{money(invoices.filter((i) => i.status !== 'PAID' && i.status !== 'DISPUTED').reduce((s, i) => s + (i.total - i.amountPaid), 0))}</div><p className="text-xs text-[var(--alo-text-muted)]">{invoices.length} vendor invoices</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Asset net book value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{assetTotals ? money(assetTotals.netBookValueCents) : '—'}</div><p className="text-xs text-[var(--alo-text-muted)]">{assets.length} fixed assets</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="requests"><ClipboardList className="h-4 w-4 mr-1" />Requests</TabsTrigger>
          <TabsTrigger value="orders"><Truck className="h-4 w-4 mr-1" />Orders</TabsTrigger>
          <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-1" />Invoices</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="assets"><Laptop className="h-4 w-4 mr-1" />Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card><CardContent className="pt-4">
            {loading ? <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              : requests.length === 0 ? <p className="text-sm text-[var(--alo-text-muted)]">No purchase requests yet. Create one via POST /api/procurement/purchase-requests.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]"><th className="py-2 pr-4">PR #</th><th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2">Actions</th></tr></thead>
                  <tbody>{requests.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{r.prNumber}</td>
                      <td className="py-2 pr-4">{r.title}</td>
                      <td className="py-2 pr-4 font-mono">{money(r.amount)}</td>
                      <td className="py-2 pr-4"><Badge className={statusBadge(r.status)}>{r.status}</Badge></td>
                      <td className="py-2 space-x-1">
                        {r.status === 'DRAFT' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch(`/api/procurement/purchase-requests/${r.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'submit' }) }))}>Submit</Button>}
                        {r.status === 'SUBMITTED' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch(`/api/procurement/purchase-requests/${r.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) }))}>Approve</Button>}
                        {r.status === 'SUBMITTED' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch(`/api/procurement/purchase-requests/${r.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'reject', reason: 'Rejected from Procurement Center' }) }))}>Reject</Button>}
                        {r.status === 'APPROVED' && vendors.length > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch('/api/procurement/purchase-orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestId: r.id, vendorId: vendors[0].id }) }))}>Create PO (first vendor)</Button>}
                      </td>
                    </tr>))}</tbody>
                </table></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card><CardContent className="pt-4">
            {loading ? <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              : orders.length === 0 ? <p className="text-sm text-[var(--alo-text-muted)]">No purchase orders yet. Convert an approved request.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]"><th className="py-2 pr-4">PO #</th><th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Journal</th><th className="py-2 pr-4">Status</th><th className="py-2">Actions</th></tr></thead>
                  <tbody>{orders.map((o: any) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{o.poNumber}</td>
                      <td className="py-2 pr-4">{o.vendor?.name ?? '—'}</td>
                      <td className="py-2 pr-4 font-mono">{money(o.total)}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{o.journalEntryId ?? '—'}</td>
                      <td className="py-2 pr-4"><Badge className={statusBadge(o.status)}>{o.status}</Badge></td>
                      <td className="py-2 space-x-1">
                        {o.status === 'PENDING_APPROVAL' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch(`/api/procurement/purchase-orders/${o.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) }))}>Approve & post</Button>}
                        {o.status === 'APPROVED' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch(`/api/procurement/purchase-orders/${o.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'send' }) }))}>Send</Button>}
                        {o.status === 'SENT' && (o.lines ?? []).length > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch(`/api/procurement/purchase-orders/${o.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'receive', receipts: o.lines.map((l: any) => ({ lineId: l.id, quantity: l.quantity - l.receivedQuantity })).filter((r: any) => r.quantity > 0) }) }))}>Receive all</Button>}
                      </td>
                    </tr>))}</tbody>
                </table></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card><CardContent className="pt-4">
            {loading ? <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              : invoices.length === 0 ? <p className="text-sm text-[var(--alo-text-muted)]">No vendor invoices recorded yet.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]"><th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Paid</th><th className="py-2 pr-4">Status</th><th className="py-2">Actions</th></tr></thead>
                  <tbody>{invoices.map((i: any) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{i.invoiceNumber}</td>
                      <td className="py-2 pr-4">{i.vendor?.name ?? '—'}</td>
                      <td className="py-2 pr-4 font-mono">{money(i.total)}</td>
                      <td className="py-2 pr-4 font-mono">{money(i.amountPaid)}</td>
                      <td className="py-2 pr-4"><Badge className={statusBadge(i.status)}>{i.status}</Badge></td>
                      <td className="py-2 space-x-1">
                        {i.status === 'RECEIVED' && i.poId && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch('/api/procurement/vendor-invoices', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'match', invoiceId: i.id }) }))}>3-way match</Button>}
                        {(i.status === 'MATCHED' || i.status === 'PARTIALLY_PAID') && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => fetch('/api/procurement/vendor-invoices', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'pay', invoiceId: i.id, amount: (i.total - i.amountPaid) / 100 }) }))}>Pay balance</Button>}
                      </td>
                    </tr>))}</tbody>
                </table></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card><CardContent className="pt-4">
            {loading ? <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              : vendors.length === 0 ? <p className="text-sm text-[var(--alo-text-muted)]">No vendors yet. Create one via POST /api/procurement/vendors.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]"><th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Terms</th><th className="py-2">Status</th></tr></thead>
                  <tbody>{vendors.map((v: any) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{v.code}</td>
                      <td className="py-2 pr-4">{v.name}</td>
                      <td className="py-2 pr-4">{v.category}</td>
                      <td className="py-2 pr-4">{v.paymentTerms}</td>
                      <td className="py-2"><Badge className={statusBadge(v.status)}>{v.status}</Badge></td>
                    </tr>))}</tbody>
                </table></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Monthly depreciation run</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--alo-body)]">Period (YYYY-MM)</label>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-10" className="w-40" />
              </div>
              <Button className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black" disabled={busy} onClick={runDepreciation}>
                <Package className="h-4 w-4" /> Run depreciation
              </Button>
              <p className="text-xs text-[var(--alo-text-muted)]">Posts DR 5200 / CR 1510 per asset; idempotent per asset and period.</p>
            </CardContent>
          </Card>
          <Card><CardContent className="pt-4">
            {loading ? <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              : assets.length === 0 ? <p className="text-sm text-[var(--alo-text-muted)]">No fixed assets registered yet.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]"><th className="py-2 pr-4">Tag</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Cost</th><th className="py-2 pr-4">Accum. dep.</th><th className="py-2 pr-4">NBV</th><th className="py-2 pr-4">Status</th></tr></thead>
                  <tbody>{assets.map((a: any) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{a.assetTag}</td>
                      <td className="py-2 pr-4">{a.name}</td>
                      <td className="py-2 pr-4 font-mono">{money(a.purchaseCost)}</td>
                      <td className="py-2 pr-4 font-mono">{money(a.accumulatedDepreciation)}</td>
                      <td className="py-2 pr-4 font-mono">{money(a.purchaseCost - a.accumulatedDepreciation)}</td>
                      <td className="py-2"><Badge className={statusBadge(a.status)}>{a.status}</Badge></td>
                    </tr>))}</tbody>
                </table></div>)}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
