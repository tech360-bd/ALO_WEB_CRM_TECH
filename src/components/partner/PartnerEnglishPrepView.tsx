'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Eye, Globe, Award, MapPin } from 'lucide-react';

export default function PartnerEnglishPrepView() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/language-prep/tests')
      .then(r => r.json())
      .then(d => {
        if (d.success) setTests(d.tests || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--alo-brand)] text-white flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--alo-text)]">English Prep — Partner Read-Only</h1>
          <p className="text-xs text-[var(--alo-text-muted)]">Partner read-only access — view tests, acceptance, requirements — no edit, no fake</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--alo-text-muted)]">Loading tests — database-driven...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t: any) => (
            <Card key={t.id || t.slug} className="p-5 bg-white border border-[var(--alo-border)] rounded-2xl hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-sm text-[var(--alo-text)]">{t.name}</h3>
                <Badge className="bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-body)] text-[11px]">{t.testType || 'english_proficiency'}</Badge>
              </div>
              <p className="text-xs text-[var(--alo-body)] line-clamp-3 leading-relaxed">{t.description || t.acceptanceSummary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-1 rounded-full bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border border-[var(--alo-border)]">{t.scoringSystem?.slice(0,20) || 'Scoring'}</span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-[var(--alo-page)] border border-[var(--alo-border)]">{t.durationDisplay || 'Duration'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-bold rounded-xl "><a href={`/language-prep/${t.slug}`} className="flex-1"><Eye className="w-3.5 h-3.5 mr-1" /> View Guide</a></Button>
                <a href={t.officialUrl || t.sourceUrl} target="_blank"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="bg-white border-[var(--alo-border)] rounded-xl ">Official ↗</Button></a>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Source: {t.sourceName || 'Check official'} • Verified: {t.lastVerifiedAt || 'Information requires verification'}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5 bg-crm-warning-bg border-crm-warning-border rounded-2xl">
        <h4 className="font-bold text-xs text-crm-warning-text">Partner Read-Only Notice</h4>
        <p className="text-[11px] text-crm-warning-text mt-1.5 leading-relaxed">Partners can view English test guides, acceptance, requirements, visa relevance — but cannot edit. Acceptance varies by university, course and visa route. Check official provider information where not verified. No fake pricing, result time, acceptance.</p>
      </Card>
    </div>
  );
}
