'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Loader2, Search, RefreshCw, Banknote } from 'lucide-react';

interface CommissionLead {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  destinationCountry: string;
  studyLevel: string;
  intake: string;
  partnerId: string;
  partnerName: string;
  partnerRef: string;
  status: string;
  commissionExpected: number;
  commissionReceived: number;
  commissionStatus: string;
  createdAt: string;
}
interface Summary { leadCount: number; expected: number; received: number; outstanding: number }
const money = (amount: number) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 }).format(amount || 0);

export default function CrmCommissionsPage() {
  const [leads, setLeads] = useState<CommissionLead[]>([]);
  const [summary, setSummary] = useState<Summary>({ leadCount: 0, expected: 0, received: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<CommissionLead | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100', page: '1' });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/finance/partner-commissions?${params.toString()}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Commission records could not be loaded (HTTP ${response.status}).`);
      setLeads(Array.isArray(payload.data) ? payload.data : []);
      setSummary(payload.summary || { leadCount: 0, expected: 0, received: 0, outstanding: 0 });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Commission records could not be loaded.');
      setLeads([]);
    } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { void loadData(); }, [loadData]);

  const openPayment = (lead: CommissionLead) => {
    setSelectedLead(lead);
    setAmount((Math.max(0, Number(lead.commissionExpected) - Number(lead.commissionReceived))).toFixed(2));
    setNotes('');
    setMessage(null);
  };
  const recordPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/finance/partner-commissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id, amount: Number(amount), notes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Payment could not be recorded (HTTP ${response.status}).`);
      setSelectedLead(null);
      setMessage(`Payment of ${money(Number(payload.data?.amount || amount))} recorded for ${payload.data?.lead?.studentName || selectedLead.studentName || 'the partner lead'}.`);
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Partner commission payment could not be recorded.');
    } finally { setSaving(false); }
  };

  return <div className="space-y-6 p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-alo-text">Partner commission management</h1><p className="mt-1 text-sm text-alo-text-muted">Review commissions on partner leads and record partial or full payouts with an audit trail.</p></div><Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {message && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric title="Commission records" value={String(summary.leadCount)} />
      <Metric title="Expected" value={money(summary.expected)} />
      <Metric title="Paid" value={money(summary.received)} />
      <Metric title="Outstanding" value={money(summary.outstanding)} />
    </div>
    <Card className="rounded-xl border border-alo-border bg-white"><CardContent className="p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alo-text-muted" /><Input placeholder="Search student, partner, email or reference..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div><div className="mt-4 overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead><tr className="border-b border-alo-border text-left text-xs text-alo-text-muted"><th className="pb-3 font-medium">Partner</th><th className="pb-3 font-medium">Student</th><th className="pb-3 font-medium">Destination / intake</th><th className="pb-3 text-right font-medium">Expected</th><th className="pb-3 text-right font-medium">Paid</th><th className="pb-3 text-right font-medium">Balance</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="py-10 text-center text-alo-text-muted"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr> : leads.map((lead) => { const expected = Number(lead.commissionExpected || 0); const received = Number(lead.commissionReceived || 0); const balance = Math.max(0, expected - received); const state = lead.commissionStatus || (received > 0 ? 'partial' : 'pending'); return <tr key={lead.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]"><td className="py-3"><p className="font-medium text-alo-text">{lead.partnerName || 'Partner not recorded'}</p><p className="text-xs text-alo-text-muted">{lead.partnerRef || lead.partnerId}</p></td><td className="py-3"><p className="font-medium text-alo-text">{lead.studentName || 'Student not recorded'}</p><p className="text-xs text-alo-text-muted">{lead.studentEmail || lead.studentPhone || lead.studentId}</p></td><td className="py-3 text-xs text-alo-text-secondary">{[lead.destinationCountry, lead.studyLevel, lead.intake].filter(Boolean).join(' · ') || 'Not recorded'}</td><td className="py-3 text-right font-medium">{money(expected)}</td><td className="py-3 text-right">{money(received)}</td><td className="py-3 text-right font-semibold">{money(balance)}</td><td className="py-3"><Badge variant="outline" className={state === 'paid' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : state === 'partial' ? 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]' : 'border-amber-200 bg-amber-50 text-amber-800'}>{state}</Badge></td><td className="py-3 text-right"><Button variant="outline" size="sm" disabled={balance <= 0} onClick={() => openPayment(lead)}><Banknote className="mr-1 h-3.5 w-3.5" />Record</Button></td></tr>; })}{!loading && leads.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-sm text-alo-text-muted">No partner commission records match this search.</td></tr>}</tbody></table></div></CardContent></Card>

    <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => { if (!open && !saving) setSelectedLead(null); }}><DialogContent><DialogHeader><DialogTitle>Record partner commission payment</DialogTitle><DialogDescription>{selectedLead ? `${selectedLead.partnerName || 'Partner'} · ${selectedLead.studentName || 'Student'} · ${money(Math.max(0, Number(selectedLead.commissionExpected) - Number(selectedLead.commissionReceived)))} remaining` : ''}</DialogDescription></DialogHeader><form onSubmit={recordPayment} className="space-y-4"><div className="space-y-2"><Label htmlFor="commission-payment-amount">Payment amount (BDT)</Label><Input id="commission-payment-amount" type="number" inputMode="decimal" min="0.01" max={selectedLead ? Math.max(0, Number(selectedLead.commissionExpected) - Number(selectedLead.commissionReceived)) : undefined} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="commission-payment-notes">Internal payment note (optional)</Label><Textarea id="commission-payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setSelectedLead(null)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving payment…' : 'Record payment'}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function Metric({ title, value }: { title: string; value: string }) {
  return <Card className="rounded-xl border border-alo-border bg-white"><CardContent className="p-4"><p className="text-xs text-alo-text-muted">{title}</p><p className="mt-1 text-xl font-semibold text-alo-text">{value}</p></CardContent></Card>;
}
