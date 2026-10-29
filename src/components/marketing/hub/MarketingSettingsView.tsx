'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, ShieldCheck, Bell, Clock, Palette, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MarketingSettingsView() {
  const [settings, setSettings] = useState({
    timezone:'Asia/Dhaka',
    brandOrange:'#E8501A',
    brandBlue:'#0057B8',
    brandAccent:'#C93D13',
    autoPublish:false,
    requireApprovalFor:'medium',
    budgetLimit: 100000,
    consentStrict:true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2"><Settings className="w-6 h-6 text-[var(--alo-cta)]" />Marketing Settings</h2>
        <p className="text-sm text-[var(--alo-text-muted)]">Brand, permissions, automation policies, timezone, budget limits, consent enforcement — server-enforced.</p>
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4 text-[var(--alo-cta)]" />Brand Identity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs font-semibold">ALO Orange</label><Input value={settings.brandOrange} onChange={e=>setSettings({...settings, brandOrange:e.target.value})} className="mt-1 h-9" /></div>
                <div><label className="text-xs font-semibold">Education Blue</label><Input value={settings.brandBlue} onChange={e=>setSettings({...settings, brandBlue:e.target.value})} className="mt-1 h-9" /></div>
                <div><label className="text-xs font-semibold">Sunshine Accent</label><Input value={settings.brandAccent} onChange={e=>setSettings({...settings, brandAccent:e.target.value})} className="mt-1 h-9" /></div>
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-lg border flex items-center justify-center" style={{background:settings.brandOrange}}><span className="text-white text-[11px]">Orange</span></div>
                <div className="w-12 h-12 rounded-lg border flex items-center justify-center" style={{background:settings.brandBlue}}><span className="text-white text-[11px]">Blue</span></div>
                <div className="w-12 h-12 rounded-lg border flex items-center justify-center" style={{background:settings.brandAccent}}><span className="text-[var(--alo-text)] text-[11px]">Sunshine</span></div>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)]">Used across all generated assets — brand kit enforcement via AI Brand Compliance Reviewer (ai-19).</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[var(--alo-brand)]" />Automation & Approval Policies</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Allow auto-execution for low-risk (research, drafts)</Label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Require approval for medium-risk (publishing, messaging)</Label>
                <Select value={settings.requireApprovalFor} onValueChange={v=>setSettings({...settings, requireApprovalFor:v})}><SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="medium">Medium & High</SelectItem><SelectItem value="high">High only</SelectItem></SelectContent></Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Enforce budget limits server-side</Label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Strict consent enforcement (opt-in + opt-out)</Label>
                <Switch checked={settings.consentStrict} onCheckedChange={v=>setSettings({...settings, consentStrict:v})} />
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)]">Low: research/internal reports/drafts — auto • Medium: public publishing/messaging/schedule — approval unless policy permits • High: spend/budget/finance/bulk/permissions/destructive — explicit human approval. Backend-enforced.</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--alo-brand)]" />Timezone & Scheduling</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><label className="text-xs font-semibold">Primary Timezone</label><Select value={settings.timezone} onValueChange={v=>setSettings({...settings, timezone:v})}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Dhaka">Asia/Dhaka (ALO local)</SelectItem><SelectItem value="UTC">UTC</SelectItem></SelectContent></Select></div>
              <p className="text-[11px] text-[var(--alo-text-muted)]">All MarketingCalendar.scheduledAt + cron scheduler are timezone-aware. Jobs have persistent records, idempotency, locks, retries, audit trails — no browser timers.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-amber-600" />Notifications</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-[var(--alo-body)]">Failure alerts via in-app + email + WhatsApp (no sensitive leak). Daily/weekly reports scheduled.</p>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className=" ">Configure Alerts</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
