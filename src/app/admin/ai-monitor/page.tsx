'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, RefreshCw } from 'lucide-react';

export default function AiMonitorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/ai-intent');
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-page)] min-h-screen text-[var(--alo-text)]">
      <div className="flex items-center justify-between border-b border-[var(--alo-border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[var(--alo-text)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Monitor — Intent, Sentiment, Lead Scoring</h1>
            <p className="text-[var(--alo-text-muted)] text-sm">Language detection Bangla/English/Banglish • Intent 20 types • Sentiment positive/neutral/confused/frustrated/angry/urgent/high-risk • AI handover • Safe replies (no visa guarantee, no fabricate, no password/OTP/PIN)</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-[var(--alo-border)]"><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardHeader><CardTitle className="text-sm">Intents ({data?.intents?.length || 0})</CardTitle></CardHeader><CardContent className="space-y-1 max-h-96 overflow-y-auto">{(data?.intents || []).map((i: any) => (<div key={i.id} className="text-xs p-2 rounded bg-[var(--alo-surface-muted)] flex justify-between"><span>{i.intent} • {i.language} • conf {Math.round(i.confidence*100)}%</span><Badge className="bg-[var(--alo-info-bg)] text-[var(--alo-info-text)] text-[11px]">{i.decisionSource}</Badge></div>))}</CardContent></Card>
        <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardHeader><CardTitle className="text-sm">Sentiments ({data?.sentiments?.length || 0})</CardTitle></CardHeader><CardContent className="space-y-1 max-h-96 overflow-y-auto">{(data?.sentiments || []).map((s: any) => (<div key={s.id} className="text-xs p-2 rounded bg-[var(--alo-surface-muted)] flex justify-between"><span>{s.sentiment} {s.isHighRisk && '⚠️HIGH'} {s.isUrgent && '🚨URGENT'} • conf {Math.round(s.confidence*100)}%</span><Badge className={s.isHighRisk ? 'bg-crm-danger-bg text-crm-danger-text' : 'bg-crm-success-bg text-crm-success-text'}>{s.sentiment}</Badge></div>))}</CardContent></Card>
        <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]"><CardHeader><CardTitle className="text-sm">Lead Scores ({data?.leadScores?.length || 0})</CardTitle></CardHeader><CardContent className="space-y-1 max-h-96 overflow-y-auto">{(data?.leadScores || []).map((l: any) => (<div key={l.id} className="text-xs p-2 rounded bg-[var(--alo-surface-muted)]"><p className="font-bold">Score: {Math.round(l.score)}/100 • {l.studentId.slice(0,8)}</p><p className="text-[var(--alo-text-muted)] text-[11px]">{l.explanation}</p></div>))}</CardContent></Card>
      </div>

      <Card className="bg-[var(--alo-page)] border-crm-warning-border text-[var(--alo-text)]">
        <CardContent className="p-4 text-xs text-[var(--alo-placeholder)]">
          <p className="font-bold text-crm-warning-text">AI Safety Rules</p>
          <p>AI MUST NOT: guarantee visa approval, guarantee university admission, fabricate university info/fees/deadlines/scholarships, claim to be human, request passwords/OTP/card PIN/banking credentials, make unauthorized financial commitments.</p>
          <p className="mt-2"><strong>Handover Triggers:</strong> explicit human request, complaint, urgent, legal, visa refusal, payment dispute, sensitive doc, angry/high-risk sentiment, confidence below threshold, cannot answer safely.</p>
          <p className="mt-2"><strong>Intents:</strong> course, university, country, admission, scholarship, visa, documentation, application status, offer, CAS, payment, refund, complaint, urgent support, appointment, counselor request, portal help, partner, follow-up, general.</p>
        </CardContent>
      </Card>
    </div>
  );
}
