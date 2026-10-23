'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, EyeOff, Flag, UserPlus, Sparkles, FileText } from 'lucide-react';

export default function SocialInboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/crm/communications/social-inbox');
    const j = await res.json();
    setItems(j.data || []);
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: string) => {
    const item = items.find((entry) => entry.id === id);
    const contact = action === 'create_lead' ? window.prompt('Enter the contact phone or email provided by this person:') : null;
    if (action === 'create_lead' && !contact?.trim()) return;
    setBusyId(id);
    try {
      const res = await fetch('/api/crm/communications/social-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          replyText: action === 'reply' ? 'Thanks for contacting ALO Education. Please share your preferred country, study level and intake; a counselor can help with general course information.' : undefined,
          ...(action === 'create_lead' ? (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contact || '') ? { email: contact } : { phone: contact }) : {}),
          name: item?.senderName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Action failed.');
      setNotice(json.message || (json.sent ? 'Sent.' : 'Saved.'));
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-[var(--alo-page)] min-h-screen space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--alo-text)] flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[var(--alo-brand)]" /> Social Inbox — Facebook & Instagram</h1>
        <p className="text-xs text-[var(--alo-text-muted)]">Assigned Facebook/Instagram inbox records. Reply actions save a draft for review only; no official provider send or comment moderation is configured here. Lead records retain consent=false until opt-in is verified.</p>
      </div>

      {notice && <div role="status" className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] px-3 py-2 text-xs text-[var(--alo-brand-deep)]">{notice}</div>}
      <Card className="border border-[var(--alo-border)]"><CardHeader className="pb-2"><CardTitle className="text-sm">Social Inbox ({items.length}) — CRM assignment scope only; provider delivery unverified</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <div className="text-xs text-[var(--alo-text-muted)] py-8 text-center">No assigned social messages. Only conversations assigned in ALO are visible to ordinary staff.</div> :
          items.map(it => (
            <div key={it.id} className="border border-[var(--alo-border)] rounded-lg p-3 bg-white hover:bg-[var(--alo-page)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">{it.platform}</Badge>
                    <span className="text-xs font-bold">{it.senderName || 'Unknown'}</span>
                    <span className="text-[11px] text-[var(--alo-text-muted)]">{it.messageText?.substring(0, 100)}</span>
                  </div>
                  <div className="text-[11px] text-[var(--alo-text-muted)] mt-1">{it.attachmentUrl ? `Attachment: ${it.attachmentUrl}` : '—'} • Intent: {it.intent} • {new Date(it.createdAt).toLocaleString()}</div>
                </div>
                <Badge className={`text-[11px] ${it.status==='replied'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{it.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={busyId === it.id} onClick={()=>act(it.id,'reply')}><FileText className="w-3 h-3 mr-1"/>Save Reply Draft</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled title="Official provider moderation is not configured"><EyeOff className="w-3 h-3 mr-1"/>Hide (Unavailable)</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={busyId === it.id} onClick={()=>act(it.id,'mark_spam')}><Flag className="w-3 h-3 mr-1"/>Mark CRM Spam</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={busyId === it.id} onClick={()=>act(it.id,'create_lead')}><UserPlus className="w-3 h-3 mr-1"/>Create Lead</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px] bg-purple-50 text-purple-700" disabled title="No verified AI provider is configured"><Sparkles className="w-3 h-3 mr-1"/>AI Draft (Unavailable)</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
