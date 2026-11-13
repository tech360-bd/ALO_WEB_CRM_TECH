'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, EyeOff, Flag, UserPlus, Sparkles } from 'lucide-react';

export default function SocialMessageCard({ item, onAction }: { item: any; onAction: (action:string)=>void }) {
  return (
    <Card className="border border-[var(--alo-border)] bg-white">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px]">{item.platform}</Badge>
          <span className="text-xs font-bold">{item.senderName}</span>
          <span className="text-[11px] text-[var(--alo-text-muted)] ml-auto">{new Date(item.createdAt).toLocaleString()}</span>
        </div>
        <p className="text-xs text-[var(--alo-body)] mt-1.5 whitespace-pre-wrap">{item.messageText}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>onAction('reply')}><Send className="w-3 h-3 mr-1"/>Reply</Button>
          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>onAction('hide_comment')}><EyeOff className="w-3 h-3 mr-1"/>Hide</Button>
          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>onAction('mark_spam')}><Flag className="w-3 h-3 mr-1"/>Spam</Button>
          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>onAction('create_lead')}><UserPlus className="w-3 h-3 mr-1"/>Create Lead</Button>
          <Button size="sm" variant="outline" className="h-6 text-[11px] bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]" onClick={()=>onAction('ai_draft')}><Sparkles className="w-3 h-3 mr-1"/>AI Draft</Button>
        </div>
        <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Marketing can reply to public comments, draft DM, create lead from comment/DM, link to lead, assign counselor — no private visa advice without approval, no guaranteed visa claim, no testimonial without consent</p>
      </CardContent>
    </Card>
  );
}
