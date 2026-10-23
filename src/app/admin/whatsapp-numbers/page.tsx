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

  useEffect(() => { fetchNumbers(); }, []);

  const handleSave = async (num: any) => {
    try {
      const res = await fetch('/api/whatsapp/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: num.phoneNumber,
          displayName: num.displayName,
          ownerType: num.ownerType,
          branch: num.branch,
          metaPhoneNumberId: num.metaPhoneNumberId,
          metaBusinessAccountId: num.metaBusinessAccountId,
          reason: 'Admin update via dashboard',
        }),
      });
      const data = await res.json();
      if (data.success) toast.success(`Number ${num.phoneNumber} updated`);
      else toast.error(data.error || 'Failed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-text)] min-h-screen text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Official Number Pool</h1>
            <p className="text-[var(--alo-text-muted)] text-sm">20 official numbers 01805020100-01805020119 • Main: 01805020100 • COO 24/7: 01805020101</p>
          </div>
        </div>
        <Button onClick={fetchNumbers} variant="outline" className="border-white/10">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Total / Expected</p><p className="text-xl font-bold">{stats.total} / {stats.expected}</p></CardContent></Card>
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Connected</p><p className="text-xl font-bold text-emerald-400">{stats.connected}</p></CardContent></Card>
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Disconnected</p><p className="text-xl font-bold text-amber-400">{stats.disconnected}</p></CardContent></Card>
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Employee Pool</p><p className="text-xl font-bold">{stats.employeePool}</p></CardContent></Card>
        </div>
      )}

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Number Management (Auditable)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-[var(--alo-text-muted)]">Loading...</p> : numbers.map((num) => (
            <div key={num.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="col-span-2">
                <p className="font-mono text-sm font-bold">{num.phoneNumber}</p>
                <p className="text-[11px] text-[var(--alo-text-muted)]">{num.normalizedPhone}</p>
              </div>
              <div className="col-span-2"><Input value={num.displayName} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, displayName: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-text)] border-white/10" /></div>
              <div className="col-span-2"><Input value={num.ownerType} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, ownerType: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-text)] border-white/10" placeholder="ALO_MAIN/COO/EMPLOYEE" /></div>
              <div className="col-span-1"><Input value={num.branch} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, branch: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-text)] border-white/10" placeholder="Branch" /></div>
              <div className="col-span-2"><Input value={num.metaPhoneNumberId} onChange={(e) => setNumbers(prev => prev.map(n => n.id===num.id ? {...n, metaPhoneNumberId: e.target.value} : n))} className="h-8 text-xs bg-[var(--alo-text)] border-white/10" placeholder="Meta phone_number_id" /></div>
              <div className="col-span-2 flex items-center gap-2">
                <Badge className={num.connectionStatus==='connected' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}>{num.connectionStatus}</Badge>
                {num.isDefaultSender && <Badge className="bg-blue-500/20 text-blue-300 text-[11px]">DEFAULT</Badge>}
                {num.isSupport247 && <Badge className="bg-rose-500/20 text-rose-300 text-[11px]">24/7</Badge>}
              </div>
              <div className="col-span-1"><Button size="sm" onClick={() => handleSave(num)} className="h-8"><Save className="w-3 h-3 mr-1" />Save</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[var(--alo-text)] border-amber-500/20 text-white">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs text-[var(--alo-placeholder)]">
            <p className="font-bold text-amber-300">External Credential Blocker</p>
            <p>Numbers are considered Cloud API connected ONLY when official Meta phone_number_id and credentials are configured. Never spoof numbers. Use official Meta WhatsApp Cloud API only.</p>
            <p className="mt-1">Fallback: 01805020100 | Urgent: 01805020101 | Follow-up: 01805020100 | Complaint: 01805020100</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
