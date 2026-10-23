import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

interface TestPreparationMiniCardProps {
  className?: string;
  contextTitle?: string;
  recommendedTest?: string;
  targetScore?: string;
  compact?: boolean;
}

export function TestPreparationMiniCard({
  className = '',
  contextTitle,
  recommendedTest = 'IELTS / PTE',
  targetScore = '6.5+ Overall',
  compact = false,
}: TestPreparationMiniCardProps) {
  if (compact) {
    // Compact sidebar version per spec
    return (
      <Card className={`p-5 bg-white border border-[var(--alo-brand)]/20 shadow-sm hover:shadow-md transition-all rounded-2xl ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--alo-brand)]">Test Preparation</span>
        </div>

        <h4 className="text-sm font-bold text-[var(--alo-text)] leading-tight">
          {contextTitle || 'Prepare for English proficiency tests'}
        </h4>

        <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
          <span className="text-[11px] font-bold bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-text)] px-2.5 py-1 rounded-full">IELTS</span>
          <span className="text-[11px] font-bold bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-text)] px-2.5 py-1 rounded-full">PTE</span>
          <span className="text-[11px] font-bold bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-text)] px-2.5 py-1 rounded-full">OIETC</span>
          <span className="text-[11px] font-bold bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-text)] px-2.5 py-1 rounded-full">Duolingo</span>
          <span className="text-[11px] font-bold bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-text)] px-2.5 py-1 rounded-full">TOEFL</span>
        </div>

        <p className="text-[11px] text-[var(--alo-body)] leading-relaxed mb-4">
          Find the right test for your university and destination. Acceptance varies by university, course and visa route.
        </p>

        <Button asChild className="w-full bg-white border border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand)] hover:text-white font-bold h-12 rounded-xl flex items-center justify-center gap-1.5 transition-all"><a href="/language-prep" className="block w-full">
            View All Test Prep <ArrowRight className="w-3.5 h-3.5" />
          </a></Button>
      </Card>
    );
  }

  return (
    <Card className={`p-5 bg-white border border-[var(--alo-brand)]/20 shadow-md hover:shadow-lg transition-all rounded-2xl ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--alo-brand)]">
            Test Preparation
          </span>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">
          Verified Guides
        </Badge>
      </div>

      <h4 className="text-sm font-bold text-[var(--alo-text)] mb-1.5 leading-tight">
        {contextTitle || 'Prepare for English proficiency tests'}
      </h4>
      <p className="text-xs text-[var(--alo-body)] mb-3 leading-relaxed">
        Master your target band score with ALO Education's certified test coaches, diagnostic assessments, and university score matching. Find the right test for your university and destination.
      </p>

      <div className="bg-[var(--alo-page)] p-3 rounded-xl border border-[var(--alo-border)] mb-3 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between text-[var(--alo-body)]">
          <span className="text-[var(--alo-text-muted)] font-medium">Accepted Tests:</span>
          <span className="font-bold text-[var(--alo-brand)]">{recommendedTest}</span>
        </div>
        <div className="flex items-center justify-between text-[var(--alo-body)]">
          <span className="text-[var(--alo-text-muted)] font-medium">Benchmark Score:</span>
          <span className="font-bold text-[var(--alo-text)]">{targetScore}</span>
        </div>
        <p className="text-[11px] text-[var(--alo-text-muted)] pt-1 border-t border-[var(--alo-border)] mt-1.5">Acceptance varies by university, course and visa route</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-[11px] font-semibold bg-[var(--alo-blue-soft)] text-[var(--alo-brand)] border border-[var(--alo-brand-border)] px-2.5 py-1 rounded-full">IELTS</span>
        <span className="text-[11px] font-semibold bg-[var(--alo-blue-soft)] text-[var(--alo-brand)] border border-[var(--alo-brand-border)] px-2.5 py-1 rounded-full">PTE</span>
        <span className="text-[11px] font-semibold bg-[var(--alo-blue-soft)] text-[var(--alo-brand)] border border-[var(--alo-brand-border)] px-2.5 py-1 rounded-full">OIETC</span>
        <span className="text-[11px] font-semibold bg-[var(--alo-blue-soft)] text-[var(--alo-brand)] border border-[var(--alo-brand-border)] px-2.5 py-1 rounded-full">Duolingo</span>
        <span className="text-[11px] font-semibold bg-[var(--alo-blue-soft)] text-[var(--alo-brand)] border border-[var(--alo-brand-border)] px-2.5 py-1 rounded-full">TOEFL</span>
      </div>

      <Button asChild className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"><a href="/language-prep" className="block w-full">
          View All Test Prep <ArrowRight className="h-3.5 w-3.5" />
        </a></Button>

    </Card>
  );
}

export default TestPreparationMiniCard;
