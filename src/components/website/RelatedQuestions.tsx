'use client';

// ============================================================================
// "You May Also Want to Know" — Related Questions (spec §10 Services,
// §38 Resources). Accessible accordion: click expands answer; optional
// "Read more" link opens the relevant article — never an irrelevant page.
// ============================================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { pickRelatedQuestions, questionTagsFor } from '@/lib/website/related-questions';

interface Props {
  type: 'service' | 'scholarship' | 'resource';
  context: string; // slug or category name
  title?: string;
  count?: number;
}

export default function RelatedQuestions({ type, context, title = 'You May Also Want to Know', count = 6 }: Props) {
  const questions = useMemo(
    () => pickRelatedQuestions(questionTagsFor(type, context), count),
    [type, context, count],
  );
  const [open, setOpen] = useState<number>(-1);

  if (questions.length === 0) return null;

  return (
    <section aria-label={title}>
      <h2 className="text-xl font-bold text-[#0F172A] mb-4">{title}</h2>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <Card key={q.id} className="bg-white border-[#E2E8F0] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left min-h-[48px] hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0057B8]"
            >
              <span className="text-sm font-semibold text-[#0F172A]">{q.question}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 text-[#0057B8] transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-gray-700 leading-relaxed border-t border-[#E2E8F0] pt-3">
                {q.answer}
                {q.href && (
                  <Link href={q.href} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0057B8] hover:underline">
                    Read the full guide <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
