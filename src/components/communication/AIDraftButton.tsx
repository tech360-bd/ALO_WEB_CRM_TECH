'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldAlert } from 'lucide-react';

export default function AIDraftButton({
  communicationId, context, onDraft, onApprove
}: {
  communicationId: string; context?: string; onDraft?: (draft: string, riskFlags: string[]) => void; onApprove?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [risks, setRisks] = useState<string[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/communications/drafts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationId, promptContext: context || 'Generate helpful reply. Never guarantee visa/admission. Never expose B2B/internal data.' })
      });
      const json = await res.json();
      if (json.draftBody || json.draft) {
        setDraft(json.draftBody || json.draft);
        setRisks(json.riskFlags || []);
        onDraft?.(json.draftBody || json.draft, json.riskFlags || []);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" className="h-7 text-xs bg-purple-50 text-purple-700 border-purple-200" onClick={generate} disabled={loading}>
        <Sparkles className="w-3.5 h-3.5 mr-1" /> {loading ? 'Drafting…' : 'Generate AI Draft'}
      </Button>
      {draft && (
        <div className="border border-purple-200 rounded-lg bg-purple-50/40 p-3 space-y-2">
          <div className="text-xs text-[var(--alo-body)] whitespace-pre-wrap leading-relaxed">{draft}</div>
          {risks.length > 0 && <div className="flex flex-wrap gap-1">{risks.map((r:string)=><Badge key={r} variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-200"><ShieldAlert className="w-3 h-3 mr-1" />{r}</Badge>)}</div>}
          <div className="text-[11px] text-[var(--alo-text-muted)]">AI draft respects visibility, never exposes B2B/internal data, never guarantees visa/admission, never sends without human approval unless safe automation enabled.</div>
          {onApprove && <Button size="sm" className="h-7 text-xs bg-[var(--alo-brand)]" onClick={onApprove}>Approve & Send</Button>}
        </div>
      )}
    </div>
  );
}
