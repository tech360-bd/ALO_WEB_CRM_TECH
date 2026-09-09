import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface TestPreparationMiniCardProps {
  className?: string;
  contextTitle?: string;
  recommendedTest?: string;
  targetScore?: string;
}

export function TestPreparationMiniCard({
  className = '',
  contextTitle,
  recommendedTest = 'IELTS / PTE',
  targetScore = '6.5+ Overall',
}: TestPreparationMiniCardProps) {
  return (
    <Card className={`p-5 bg-white border border-[#0057B8]/20 shadow-md hover:shadow-lg transition-all rounded-2xl ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057B8]">
            Test Preparation
          </span>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
          Verified Guides
        </Badge>
      </div>

      <h4 className="text-sm font-bold text-[#0F172A] mb-1.5">
        {contextTitle || 'Prepare for English Proficiency Tests'}
      </h4>
      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        Master your target band score with ALO Education's certified test coaches, diagnostic assessments, and university score matching.
      </p>

      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-700">
          <span className="text-slate-500 font-medium">Accepted Tests:</span>
          <span className="font-bold text-[#0057B8]">{recommendedTest}</span>
        </div>
        <div className="flex items-center justify-between text-slate-700">
          <span className="text-slate-500 font-medium">Benchmark Score:</span>
          <span className="font-bold text-slate-900">{targetScore}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3.5">
        <span className="text-[10px] font-semibold bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-md">IELTS</span>
        <span className="text-[10px] font-semibold bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-md">PTE</span>
        <span className="text-[10px] font-semibold bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-md">Duolingo</span>
        <span className="text-[10px] font-semibold bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-md">TOEFL</span>
        <span className="text-[10px] font-semibold bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-md">OIETC</span>
      </div>

      <a href="/language-prep" className="block w-full">
        <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
          View All Test Prep <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </a>
    </Card>
  );
}

export default TestPreparationMiniCard;
