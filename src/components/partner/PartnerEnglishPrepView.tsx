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
        <div className="w-10 h-10 rounded-xl bg-[#0B5ED7] text-white flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A]">English Prep — Partner Read-Only</h1>
          <p className="text-xs text-slate-500">Partner read-only access — view tests, acceptance, requirements — no edit, no fake</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading tests — database-driven...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t: any) => (
            <Card key={t.id || t.slug} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-sm text-[#0F172A]">{t.name}</h3>
                <Badge className="bg-[#F8FAFC] border border-[#E2E8F0] text-slate-700 text-[10px]">{t.testType || 'english_proficiency'}</Badge>
              </div>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{t.description || t.acceptanceSummary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-[#0B5ED7] border border-blue-100">{t.scoringSystem?.slice(0,20) || 'Scoring'}</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">{t.durationDisplay || 'Duration'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={`/language-prep/${t.slug}`} className="flex-1"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full bg-[#0B5ED7] hover:bg-[#004494] text-white font-bold h-9 rounded-xl text-xs"><Eye className="w-3.5 h-3.5 mr-1" /> View Guide</Button></a>
                <a href={t.officialUrl || t.sourceUrl} target="_blank"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="bg-white border-[#E2E8F0] h-9 rounded-xl text-xs">Official ↗</Button></a>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Source: {t.sourceName || 'Check official'} • Verified: {t.lastVerifiedAt || 'Information requires verification'}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5 bg-amber-50 border-amber-200 rounded-2xl">
        <h4 className="font-bold text-xs text-amber-900">Partner Read-Only Notice</h4>
        <p className="text-[11px] text-amber-800 mt-1.5 leading-relaxed">Partners can view English test guides, acceptance, requirements, visa relevance — but cannot edit. Acceptance varies by university, course and visa route. Check official provider information where not verified. No fake pricing, result time, acceptance.</p>
      </Card>
    </div>
  );
}
