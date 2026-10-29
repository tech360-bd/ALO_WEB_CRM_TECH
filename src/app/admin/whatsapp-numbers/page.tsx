'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, ShieldCheck, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppNumbersAdminPage() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState('');

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/numbers');
      const data = await res.json();
      if (data.success) {
        setNumbers(data.numbers || []);
        setStats(data.stats);
      }
    } catch {}
    setLoading(false);
  };

  const initializePool = async () => {
    setInitializing(true);
    try {
      const res = await fetch('/api/whatsapp/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_official_pool' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Only Super Admin may initialize configured sender records.');
        return;
      }
      toast.success(`${data.result.created} configured sender rows added; no ownership or Meta connection was assumed.`);
      await fetchNumbers();
    } catch {
      toast.error('Official number pool could not be initialized.');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => { fetchNumbers(); }, []);

  const handleSave = async (num: any) => {
    try {
      const payload: Record<string, string> = {
        phoneNumber: num.phoneNumber,
        displayName: num.displayName,
        ownerType: num.ownerType,
        employeeOwnerId: num.employeeOwnerIdDraft ?? num.employeeOwnerId ?? '',
        branch: num.branch,
        reason: 'Number assignment updated from WhatsApp pool dashboard',
      };
      // Never round-trip masked identifiers. A new provider ID is sent only
      // when explicitly typed into the blank Super Admin configuration field.
      if (num.metaPhoneNumberIdDraft?.trim()) payload.metaPhoneNumberId = num.metaPhoneNumberIdDraft.trim();
      const res = await fetch('/api/whatsapp/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Number ${num.phoneNumber} updated`);
        await fetchNumbers();
      } else toast.error(data.error || 'Failed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const verifyConnection = async (num: any) => {
    setVerifying(num.id);
    try {
      const res = await fetch('/api/whatsapp/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_connection', phoneNumber: num.phoneNumber }),
      });
      const data = await res.json();
      if (data.success && data.verified) toast.success(`${num.phoneNumber} was verified against Meta Cloud API.`);
      else toast.error(data.error || 'Meta connection could not be verified.');
      await fetchNumbers();
    } catch {
      toast.error('Meta connection check failed.');
    } finally {
      setVerifying('');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-page)] min-h-screen text-[var(--alo-text)]">
      <div className="flex items-center justify-between border-b border-[var(--alo-border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <Phone className="w-5 h-5 text-[var(--alo-text)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Sender Registry</h1>
            <p className="text-[var(--alo-text-muted)] text-sm">Operator-configured numbers only. A configured value is not proof of ownership or Meta connectivity.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {stats && stats.total < stats.expected && (
            <Button onClick={initializePool} disabled={initializing} variant="outline" className="border-crm-warning-border text-amber-200">
              {initializing ? 'Initializing…' : 'Initialize configured sender records'}
            </Button>
          )}
          <Button onClick={fetchNumbers} variant="outline" className="border-[var(--alo-border)]">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Registry / Configured</p><p className="text-xl font-bold">{stats.total} / {stats.expected}</p></CardContent></Card>
          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Connected</p><p className="text-xl font-bold text-crm-success-text">{stats.connected}</p></CardContent></Card>
          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Disconnected</p><p className="text-xl font-bold text-crm-warning-text">{stats.disconnected}</p></CardContent></Card>
          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Employee Pool</p><p className="text-xl font-bold">{stats.employeePool}</p></CardContent></Card>
        </div>
      )}

      <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
        <CardHeader><CardTitle className="text-sm">Number Management (Auditable)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-[var(--alo-text-muted)]">Loading...</p> : numbers.length === 0 ? (
            <p className="text-sm text-[var(--alo-text-muted)]">No sender numbers are configured. Add owner-confirmed values to the deployment environment, then initialize disconnected registry records.</p>
          ) : numbers.map((num) => (
            <div key={num.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-[var(--alo-surface-muted)] border border-[var(--alo-border)]">
              <div className="col-span-2">
                <p className="font-mono text-sm font-bold">{num.phoneNumber}</p>
                <p className="text-[11px] text-[var(--alo-text-muted)]">{num.normalizedPhone}</p>
              </div>
              <div className="col-span-2"><Input value={num.displayName} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, displayName: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-page)] border-[var(--alo-border)]" /></div>
              <div className="col-span-2"><Input value={num.ownerType} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, ownerType: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-page)] border-[var(--alo-border)]" placeholder="ALO_MAIN/COO/EMPLOYEE" /></div>
              <div className="col-span-1"><Input value={num.employeeOwnerIdDraft ?? num.employeeOwnerId ?? ''} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, employeeOwnerIdDraft: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-page)] border-[var(--alo-border)]" placeholder="Employee ID" title="Active employee database ID, user ID, or employee ID" /></div>
              <div className="col-span-1"><Input value={num.branch} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, branch: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-page)] border-[var(--alo-border)]" placeholder="Branch" /></div>
              <div className="col-span-1">
                <Input value={num.metaPhoneNumberIdDraft || ''} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, metaPhoneNumberIdDraft: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-page)] border-[var(--alo-border)]" placeholder={num.metaPhoneNumberIdMasked ? `Configured ${num.metaPhoneNumberIdMasked} · enter replacement` : 'Meta ID (Super Admin)'} />
              </div>
              <div className="col-span-1 flex flex-col gap-1">
                <Badge className={num.connectionStatus === 'connected' ? 'bg-crm-success-bg text-crm-success-text' : 'bg-crm-warning-bg text-crm-warning-text'}>{num.connectionStatus === 'configured_unverified' ? 'CONFIGURED · UNVERIFIED' : String(num.connectionStatus || 'disconnected').toUpperCase()}</Badge>
                {num.isDefaultSender && <Badge className="bg-[var(--alo-info-bg)] text-[var(--alo-info-text)] text-[11px]">DEFAULT</Badge>}
                {num.isSupport247 && <Badge className="bg-crm-danger-bg text-crm-danger-text text-[11px]">24/7</Badge>}
                <span className="text-[11px] text-[var(--alo-text-muted)]">{num.lastConnectionCheckAt ? `Checked ${new Date(num.lastConnectionCheckAt).toLocaleString()}` : 'Not checked'}</span>
              </div>
              <div className="col-span-2 flex gap-1">
                <Button size="sm" onClick={() => handleSave(num)} className="h-8"><Save className="w-3 h-3 mr-1" />Save</Button>
                <Button size="sm" variant="outline" disabled={verifying === num.id || !num.metaConfigured} onClick={() => verifyConnection(num)} className="h-8 border-[var(--alo-border)] text-[var(--alo-text)]">
                  <ShieldCheck className={`w-3 h-3 mr-1 ${verifying === num.id ? 'animate-pulse' : ''}`} />{verifying === num.id ? 'Checking…' : 'Verify'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[var(--alo-page)] border-crm-warning-border text-[var(--alo-text)]">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-crm-warning-text shrink-0" />
          <div className="text-xs text-[var(--alo-placeholder)]">
            <p className="font-bold text-crm-warning-text">External Credential Blocker</p>
            <p>A saved phone_number_id or access token is configuration only—not proof of a working Cloud API connection. Connection status stays unverified until an authorized provider check succeeds. Never spoof numbers; use official Meta WhatsApp Cloud API only.</p>
            <p className="mt-1">If no recently verified configured sender is available, outbound sending must fail closed. No fallback number is assumed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
