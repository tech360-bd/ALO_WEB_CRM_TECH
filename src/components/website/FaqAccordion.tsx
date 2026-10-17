'use client';

import { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';

interface Props {
  targetType?: string;
  targetSlug?: string;
  category?: string;
  title?: string;
  limit?: number;
}

export default function FaqAccordion({ targetType = 'general', targetSlug = '', category, title = 'Frequently Asked Questions', limit = 10 }: Props) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (targetType) params.set('targetType', targetType);
    if (targetSlug) params.set('targetSlug', targetSlug);
    if (category) params.set('category', category);
    params.set('limit', (limit || 10).toString());

    fetch(`/api/faqs?${params.toString()}`)
      .then(r => r.json())
      .then(d => setFaqs(d.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, [targetType, targetSlug, category, limit]);

  if (loading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl animate-pulse" />)}</div>;
  }

  if (faqs.length === 0) {
    return (
      <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl">
        <p className="text-sm text-gray-600">No FAQs verified yet for this page. FAQs are database-driven with categories: Admission, Course, University, Scholarship, Visa, English Test, Application, Finance, Accommodation, Student Life.</p>
        <p className="text-xs text-gray-500 mt-2">Requirements vary by university and course. Check the specific course requirements.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-[#0057B8]" /><h3 className="text-lg font-bold text-[#0F172A]">{title}</h3><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{faqs.length} FAQs — DB-driven</Badge></div>
      <Card className="p-2 md:p-4 bg-white border-[#E2E8F0] rounded-2xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f: any, i: number) => (
            <AccordionItem key={f.id || i} value={`faq-${i}`} className="border-b border-[#E2E8F0]/60">
              <AccordionTrigger className="text-left font-semibold text-[#0F172A] text-sm hover:text-[#0057B8] py-4">
                <span className="flex items-center gap-2"><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px] hidden md:inline">{f.category || 'general'}</Badge>{f.question || f.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-700 leading-relaxed pb-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                  {f.answer || f.a}
                  {f.sourceUrl && <p className="text-[11px] text-gray-500 mt-3 border-t border-[#E2E8F0] pt-2">Source: <a href={f.sourceUrl} target="_blank" className="text-[#0057B8] underline">{f.sourceName || f.sourceUrl}</a> {f.lastVerifiedAt ? `• Last verified: ${new Date(f.lastVerifiedAt).toLocaleDateString()}` : ''}</p>}
                  {!f.sourceUrl && <p className="text-[11px] text-gray-500 mt-2">Requirements vary by university and course. Check the specific course requirements.</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
      {faqs.length > 0 && (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
          <h4 className="font-semibold text-sm text-[#0F172A] mb-2">Related Questions</h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {faqs.slice(0, 4).map((f: any, i: number) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs"><p className="font-medium text-[#0F172A] line-clamp-1">{f.question}</p><p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{(f.answer || '').substring(0, 80)}...</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
