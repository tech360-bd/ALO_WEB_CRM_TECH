'use client';

// ============================================================================
// ALO Education — Accounting Center (real double-entry ledger UI).
// Every number on this page comes from /api/accounting/* backed by the
// JournalEntry/JournalLine/ChartOfAccount/FiscalPeriod tables. Empty states
// are shown honestly; nothing is mocked.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, Scale, CalendarRange, Loader2, RefreshCw, ListTree, Ban } from 'lucide-react';

function money(cents: number | undefined | null): string {
  if (cents === undefined || cents === null || !Number.isFinite(cents)) return '—';
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CrmAccountingPage() {
  const [tab, setTab] = useState('trial-balance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trial, setTrial] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  // Manual journal form
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [debitAccount, setDebitAccount] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [postError, setPostError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      fetch('/api/accounting/trial-balance').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`trial-balance HTTP ${r.status}`)))),
      fetch('/api/accounting/chart-of-accounts').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`chart HTTP ${r.status}`)))),
      fetch('/api/accounting/journal-entries?limit=50').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`journals HTTP ${r.status}`)))),
      fetch('/api/accounting/fiscal-periods').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`periods HTTP ${r.status}`)))),
    ]);
    if (results[0].status === 'fulfilled') setTrial(results[0].value);
    if (results[1].status === 'fulfilled') setAccounts(results[1].value.accounts ?? []);
    if (results[2].status === 'fulfilled') setEntries(results[2].value.entries ?? []);
    if (results[3].status === 'fulfilled') setPeriods(results[3].value.periods ?? []);
    const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    setError(failed ? String(failed.reason?.message ?? failed.reason) : null);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const seedChart = async () => {
    setBusy(true);
    setPostError(null);
    try {
      const res = await fetch('/api/accounting/chart-of-accounts', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setAccounts(json.accounts ?? []);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setBusy(false);
    }
  };

  const postManualJournal = async () => {
    setPostError(null);
    try {
      const value = Number(amount);
      if (!memo.trim() || !debitAccount || !creditAccount || !Number.isFinite(value) || value <= 0) {
        throw new Error('Memo, both accounts and a positive amount are required');
      }
      if (debitAccount === creditAccount) throw new Error('Debit and credit accounts must differ');
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          memo: memo.trim(), date,
          lines: [
            { account: debitAccount, debit: value, credit: 0 },
            { account: creditAccount, debit: 0, credit: value },
          ],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setMemo(''); setAmount('');
      await loadAll();
      setTab('journal-entries');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Posting failed');
    }
  };

  const reverseEntry = async (id: string) => {
    setPostError(null);
    try {
      const res = await fetch(`/api/accounting/journal-entries/${id}/reverse`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      await loadAll();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Reversal failed');
    }
  };

  const postable = accounts.filter((a) => a.isActive && a.isPostable);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)]">Accounting Center</h1>
          <p className="text-xs text-[var(--alo-text-muted)]">Real double-entry ledger • Chart of accounts, journals, trial balance, fiscal periods</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadAll} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
          </Button>
          <Button size="sm" className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black" onClick={seedChart} disabled={busy}>
            <ListTree className="h-4 w-4" /> Seed canonical chart
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-700">
            API error: {error}. Verify your session has FINANCE/ADMIN/SUPER_ADMIN access.
          </CardContent>
        </Card>
      )}
      {postError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 text-sm text-orange-700">{postError}</CardContent>
        </Card>
      )}

      {/* KPI cards — straight from the trial balance API */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--alo-body)]"><Scale className="h-4 w-4" /> Ledger balanced</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--alo-text)]">{trial?.totals?.balanced === true ? 'Yes' : trial?.totals ? 'No' : '—'}</div>
            <p className="text-xs text-[var(--alo-text-muted)]">{trial ? `${trial.rows?.length ?? 0} accounts with activity` : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Total debits</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--alo-text)]">{trial ? money(trial.totals?.totalDebit) : '—'}</div>
            <p className="text-xs text-[var(--alo-text-muted)]">{trial?.integrity ? `${trial.integrity.entriesChecked} POSTED entries verified` : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Total credits</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--alo-text)]">{trial ? money(trial.totals?.totalCredit) : '—'}</div>
            <p className="text-xs text-[var(--alo-text-muted)]">{trial?.integrity?.balanced === false ? '⚠ integrity check failed' : 'Integrity verified'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[var(--alo-body)]">Net A/R (acct 1100)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--alo-text)]">{trial?.accountsReceivable ? money(Math.round(trial.accountsReceivable.netReceivable * 100)) : '—'}</div>
            <p className="text-xs text-[var(--alo-text-muted)]">Journal movements, POSTED only</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="trial-balance"><Scale className="h-4 w-4 mr-1" />Trial balance</TabsTrigger>
          <TabsTrigger value="journal-entries"><BookOpen className="h-4 w-4 mr-1" />Journal entries</TabsTrigger>
          <TabsTrigger value="post-entry">Post journal</TabsTrigger>
          <TabsTrigger value="periods"><CalendarRange className="h-4 w-4 mr-1" />Fiscal periods</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading trial balance…</div>
              ) : (trial?.rows ?? []).length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)]">No posted journals yet. Post a journal to see the trial balance.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]">
                        <th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Account</th><th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4 text-right">Debits</th><th className="py-2 pr-4 text-right">Credits</th><th className="py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(trial?.rows ?? []).map((row: any) => (
                        <tr key={row.accountCode} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono text-xs">{row.accountCode}</td>
                          <td className="py-2 pr-4">{row.accountName}</td>
                          <td className="py-2 pr-4"><Badge variant="outline" className="text-xs">{row.type}</Badge></td>
                          <td className="py-2 pr-4 text-right font-mono">{money(row.totalDebit)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{money(row.totalCredit)}</td>
                          <td className="py-2 text-right font-mono font-semibold">{money(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal-entries" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading journals…</div>
              ) : entries.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)]">No journal entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry: any) => (
                    <div key={entry.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs text-[var(--alo-text-muted)]">{entry.id}</span>
                          <p className="font-medium text-[var(--alo-text)]">{entry.memo}</p>
                          <p className="text-xs text-[var(--alo-text-muted)]">{new Date(entry.entryDate).toISOString().slice(0, 10)} • source: {entry.source} • currency: {entry.currency}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={entry.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>{entry.status}</Badge>
                          {entry.status === 'POSTED' && !entry.reversalOfId && (
                            <Button size="sm" variant="outline" onClick={() => reverseEntry(entry.id)}>
                              <Ban className="h-3 w-3 mr-1" /> Reverse
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[var(--alo-text-muted)]"><th className="pr-4">Account</th><th className="pr-4 text-right">Debit</th><th className="text-right">Credit</th></tr>
                          </thead>
                          <tbody>
                            {(entry.lines ?? []).map((line: any) => (
                              <tr key={line.id}>
                                <td className="pr-4 font-mono">{line.accountCode} — {line.accountName}</td>
                                <td className="pr-4 text-right font-mono">{line.debit ? money(line.debit) : ''}</td>
                                <td className="text-right font-mono">{line.credit ? money(line.credit) : ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post-entry" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Post a manual journal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--alo-body)]">Memo</label>
                  <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. Owner capital contribution" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--alo-body)]">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--alo-body)]">Debit account</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)}>
                    <option value="">Select account…</option>
                    {postable.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--alo-body)]">Credit account</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)}>
                    <option value="">Select account…</option>
                    {postable.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--alo-body)]">Amount</label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <Button className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black" onClick={postManualJournal}>
                <BookOpen className="h-4 w-4" /> Post journal
              </Button>
              {postable.length === 0 && (
                <p className="text-xs text-[var(--alo-text-muted)]">Seed the canonical chart first to enable account selection.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading periods…</div>
              ) : periods.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)]">No fiscal periods defined. Periods are optional; when defined and CLOSED, posting into them is rejected by the ledger.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-[var(--alo-text-muted)]">
                        <th className="py-2 pr-4">Period</th><th className="py-2 pr-4">Start</th><th className="py-2 pr-4">End</th><th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{p.name}</td>
                          <td className="py-2 pr-4">{new Date(p.startDate).toISOString().slice(0, 10)}</td>
                          <td className="py-2 pr-4">{new Date(p.endDate).toISOString().slice(0, 10)}</td>
                          <td className="py-2"><Badge className={p.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>{p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
