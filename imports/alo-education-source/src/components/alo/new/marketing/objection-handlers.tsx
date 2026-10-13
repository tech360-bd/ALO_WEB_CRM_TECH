'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Check, X, ChevronRight, Shield, Star, Quote
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const CORAL = '#bf4520';
const INK = '#2d3142';
const PAPER = '#f5f5f5';

// ── FAQ Accordion (Objection Handling) ─────────────────────────────────────
interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQAccordionProps {
  items?: FAQItem[];
  className?: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: 'Is ALO too expensive compared to applying on my own?',
    answer: 'We understand cost is a concern. However, students who apply independently often face costly mistakes — rejections, wrong program choices, and visa refusals that delay plans by months. ALO\'s guidance typically saves students both time and money by getting it right the first time. Plus, we offer a free initial consultation so you can see the value before committing.',
    category: 'Cost',
  },
  {
    question: 'Can I really trust an education consultancy with my future?',
    answer: 'Absolutely — and we don\'t ask you to take our word for it. ALO is British Council certified, has 500+ successful enrollments, and maintains a 98% visa success rate. We provide transparent pricing, no hidden fees, and a money-back guarantee. Every student gets a dedicated counselor with direct university relationships.',
    category: 'Trust',
  },
  {
    question: 'What if I don\'t get accepted to any university?',
    answer: 'This is extremely rare with ALO\'s approach, but we have safeguards: we always apply to multiple universities (safety, match, and reach), our eligibility checker ensures you only apply where you have a strong chance, and our money-back guarantee covers this scenario. We\'ve helped students with diverse profiles find their perfect program.',
    category: 'Risk',
  },
  {
    question: 'I can handle the visa process myself — why pay for help?',
    answer: 'While some students do succeed on their own, the UK visa process has become increasingly complex with frequent rule changes. Even a small document error can lead to refusal, which goes on your record. Our visa team has processed 500+ applications with a 98% success rate. The cost of a single visa refusal far exceeds our service fee.',
    category: 'DIY',
  },
  {
    question: 'How is ALO different from other consultancies?',
    answer: 'Three key differences: 1) AI-powered tools — we use intelligent matching, automated document checking, and smart eligibility assessments that others don\'t. 2) End-to-end support — from IELTS prep to post-arrival accommodation, not just admission. 3) Transparent pricing — no hidden fees, no commission from universities that limits your options. We work for YOU.',
    category: 'Comparison',
  },
  {
    question: 'The process seems too long — can I speed things up?',
    answer: 'We respect your timeline and work to accelerate every step. Our AI document checker reduces review time by 60%, our university relationships often mean faster offer decisions, and our priority application service can cut weeks off the standard timeline. We\'ll create a personalized timeline during your free consultation.',
    category: 'Time',
  },
];

export function FAQAccordion({ items = DEFAULT_FAQS, className = '' }: FAQAccordionProps) {
  return (
    <div className={`max-w-3xl mx-auto ${className}`}>
      <Accordion type="single" collapsible className="space-y-2">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-white border border-[#e5e7eb] rounded-[8px] px-4 data-[state=open]:border-[#bf4520]/30"
          >
            <AccordionTrigger className="text-left text-sm font-semibold text-[#2d3142] hover:text-[#bf4520] py-4">
              <span className="flex items-center gap-2">
                {item.category && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 bg-[#f5f5f5] text-[#9ca3af] shrink-0"
                    style={{ borderRadius: '4px' }}
                  >
                    {item.category}
                  </Badge>
                )}
                {item.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-[#6b7280] leading-relaxed pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// ── Comparison Table ───────────────────────────────────────────────────────
interface ComparisonTableProps {
  className?: string;
}

const COMPARISON_ROWS = [
  { feature: 'AI-Powered Matching', alo: true, others: false },
  { feature: 'End-to-End Support', alo: true, others: false },
  { feature: 'Transparent Pricing', alo: true, others: false },
  { feature: 'Money-Back Guarantee', alo: true, others: false },
  { feature: 'Post-Arrival Support', alo: true, others: false },
  { feature: 'Free Initial Consultation', alo: true, others: true },
  { feature: 'University Application', alo: true, others: true },
  { feature: 'Visa Assistance', alo: true, others: true },
  { feature: 'Dedicated Counselor', alo: true, others: true },
  { feature: 'Commission-Free Advice', alo: true, others: false },
];

export function ComparisonTable({ className = '' }: ComparisonTableProps) {
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white border border-[#e5e7eb] rounded-[8px] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 bg-[#2d3142] text-white text-xs font-semibold">
          <div className="p-3">Feature</div>
          <div className="p-3 text-center border-l border-white/10">ALO Education</div>
          <div className="p-3 text-center border-l border-white/10">Others</div>
        </div>
        {/* Rows */}
        {COMPARISON_ROWS.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-3 text-sm ${
              i % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'
            }`}
          >
            <div className="p-3 text-[#2d3142] font-medium">{row.feature}</div>
            <div className="p-3 text-center border-l border-[#e5e7eb]">
              {row.alo ? (
                <Check className="h-4 w-4 text-[#22c55e] mx-auto" />
              ) : (
                <X className="h-4 w-4 text-[#ef4444] mx-auto" />
              )}
            </div>
            <div className="p-3 text-center border-l border-[#e5e7eb]">
              {row.others ? (
                <Check className="h-4 w-4 text-[#22c55e] mx-auto" />
              ) : (
                <X className="h-4 w-4 text-[#9ca3af] mx-auto" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk Reversal ──────────────────────────────────────────────────────────
interface RiskReversalProps {
  className?: string;
}

export function RiskReversal({ className = '' }: RiskReversalProps) {
  return (
    <div className={`max-w-lg mx-auto ${className}`}>
      <Card className="bg-[#eff6ff] border border-[#bfdbfe]" style={{ borderRadius: '8px' }}>
        <CardContent className="p-6 text-center">
          <Shield className="h-10 w-10 text-[#3b82f6] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#1e40af] mb-2">
            Free Initial Consultation
          </h3>
          <p className="text-sm text-[#1e40af]/70 leading-relaxed mb-4">
            Start with a completely free, no-obligation consultation with our expert counselor.
            We\'ll assess your profile, discuss your goals, and show you exactly how ALO can help
            — before you commit to anything.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[#1e40af]/50">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> No credit card
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> No commitment
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> No pressure
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Social Proof Wall ──────────────────────────────────────────────────────
interface SuccessStory {
  name: string;
  flag: string;
  university: string;
  course: string;
  year: string;
}

interface SocialProofWallProps {
  stories?: SuccessStory[];
  className?: string;
}

const DEFAULT_STORIES: SuccessStory[] = [
  { name: 'Ahmed A.', flag: '🇦🇪', university: 'University of Manchester', course: 'MSc CS', year: '2024' },
  { name: 'Priya S.', flag: '🇮🇳', university: 'UCL', course: 'MSc Management', year: '2024' },
  { name: 'Carlos M.', flag: '🇲🇽', university: 'University of Edinburgh', course: 'MSc Data Science', year: '2024' },
  { name: 'Fatima H.', flag: '🇪🇬', university: 'King\'s College', course: 'MA Education', year: '2024' },
  { name: 'Yuki T.', flag: '🇯🇵', university: 'Imperial College', course: 'PhD Physics', year: '2024' },
  { name: 'Olga P.', flag: '🇷🇺', university: 'TU Delft', course: 'MSc Data Sci', year: '2023' },
  { name: 'Amara O.', flag: '🇳🇬', university: 'King\'s College', course: 'MSc Nursing', year: '2023' },
  { name: 'Minh N.', flag: '🇻🇳', university: 'ANU', course: 'BSc Finance', year: '2023' },
  { name: 'Leila K.', flag: '🇱🇧', university: 'McGill', course: 'MA PolSci', year: '2023' },
  { name: 'Raj P.', flag: '🇮🇳', university: 'University of Bristol', course: 'MSc Marketing', year: '2024' },
  { name: 'Chen W.', flag: '🇨🇳', university: 'University of Edinburgh', course: 'MSc AI', year: '2024' },
  { name: 'Kofi A.', flag: '🇬🇭', university: 'LMU Munich', course: 'BSc Biology', year: '2024' },
];

export function SocialProofWall({ stories = DEFAULT_STORIES, className = '' }: SocialProofWallProps) {
  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {stories.map((story, i) => (
          <div
            key={i}
            className="bg-white border border-[#e5e7eb] rounded-[6px] p-3 hover:border-[#bf4520]/20 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm bg-[#bf4520]/10 text-[#bf4520]" style={{ borderRadius: '4px' }}>
                  {story.flag}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#2d3142] truncate">{story.name}</div>
                <div className="text-[10px] text-[#9ca3af]">{story.year}</div>
              </div>
            </div>
            <div className="text-[11px] text-[#6b7280] truncate">{story.university}</div>
            <div className="text-[10px] text-[#9ca3af] truncate">{story.course}</div>
            <div className="flex items-center gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="h-2.5 w-2.5 text-[#f59e0b] fill-[#f59e0b]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
