'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, EyeOff, Flag, UserPlus, Sparkles, Send } from 'lucide-react';

export default function SocialInboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const res = await fetch('/api/crm/communications/social-inbox');
    const j = await res.json();
    setItems(j.data || []);
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: string) => {
    await fetch('/api/crm/communications/social-inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, replyText: action === 'reply' ? 'Thanks for your interest! Please inbox your phone, preferred country & intake — our counselor will send course finder link.' : undefined }) });
    load();
  };

  return (
    <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#0057B8]" /> Social Inbox — Facebook & Instagram</h1>
        <p className="text-xs text-gray-500">Facebook comments • Facebook Messenger • Instagram comments • Instagram DM — Reply • Hide comment placeholder • Mark spam • Create lead • Link to lead/student • Assign counselor • AI draft reply • Course finder link • Consultation link — If token not configured, show “Integration not connected”</p>
      </div>

      <Card className="border border-gray-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Social Inbox ({items.length}) — Integration status: {process.env.NEXT_PUBLIC_FB_CONNECTED ? 'Connected' : 'Integration not connected (placeholder mode)'}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <div className="text-xs text-gray-400 py-8 text-center">No social messages — Facebook/Instagram webhooks will populate here. Actions available: Reply, Hide, Spam, Create Lead, Assign, AI Draft.</div> :
          items.map(it => (
            <div key={it.id} className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{it.platform}</Badge>
                    <span className="text-xs font-bold">{it.senderName || 'Unknown'}</span>
                    <span className="text-[11px] text-gray-500">{it.messageText?.substring(0, 100)}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">{it.attachmentUrl ? `Attachment: ${it.attachmentUrl}` : '—'} • Intent: {it.intent} • {new Date(it.createdAt).toLocaleString()}</div>
                </div>
                <Badge className={`text-[10px] ${it.status==='replied'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{it.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>act(it.id,'reply')}><Send className="w-3 h-3 mr-1"/>Reply</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>act(it.id,'hide_comment')}><EyeOff className="w-3 h-3 mr-1"/>Hide</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>act(it.id,'mark_spam')}><Flag className="w-3 h-3 mr-1"/>Spam</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>act(it.id,'create_lead')}><UserPlus className="w-3 h-3 mr-1"/>Create Lead</Button>
                <Button size="sm" variant="outline" className="h-6 text-[11px] bg-purple-50 text-purple-700" onClick={()=>act(it.id,'ai_draft')}><Sparkles className="w-3 h-3 mr-1"/>AI Draft</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
