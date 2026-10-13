'use client';

import React from 'react';
import { COLORS } from '@/lib/design-system';
import { PageHero } from '@/components/diagrams/page-hero';
import { TimelineDiagram } from '@/components/diagrams/timeline-diagram';
import { SwimlaneDiagram } from '@/components/diagrams/swimlane-diagram';
import { Flowchart } from '@/components/diagrams/flowchart';
import { FunnelChart } from '@/components/diagrams/funnel-chart';
import { StatsGrid } from '@/components/diagrams/stat-card';
import { CtaBand } from '@/components/diagrams/cta-band';
import { ScrollReveal } from '@/components/diagrams/scroll-reveal';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentJourneyPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
  onLeadOpen?: () => void;
}

// ─── Journey Steps Detail ─────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  {
    step: 1,
    title: 'Initial Inquiry',
    duration: 'Day 1',
    status: 'completed' as const,
    description: 'Contact ALO Education to discuss your study abroad goals. Our team will respond within 24 hours with a personalized assessment.',
    tips: ['Prepare your academic history', 'List your target countries', 'Note your budget constraints'],
  },
  {
    step: 2,
    title: 'Registration & Profile Setup',
    duration: 'Days 1–3',
    status: 'completed' as const,
    description: 'Create your ALO student profile. This helps our counselors understand your background and match you with the right programs.',
    tips: ['Complete all profile fields', 'Upload a recent photo', 'Verify your email and phone'],
  },
  {
    step: 3,
    title: 'Document Preparation',
    duration: 'Weeks 1–2',
    status: 'completed' as const,
    description: 'Gather and upload all required documents. Our document checklist ensures nothing is missed for your target universities.',
    tips: ['Academic transcripts (attested)', 'English test scores (IELTS/TOEFL)', 'Letters of recommendation', 'Statement of Purpose draft'],
  },
  {
    step: 4,
    title: 'University Applications',
    duration: 'Weeks 2–6',
    status: 'current' as const,
    description: 'With your counselor\'s guidance, submit applications to your shortlisted universities. We track each application in real-time.',
    tips: ['Review application deadlines', 'Customize SOP per university', 'Double-check all documents', 'Submit before deadline'],
  },
  {
    step: 5,
    title: 'Offer Decision',
    duration: 'Weeks 6–10',
    status: 'upcoming' as const,
    description: 'Receive and evaluate admission offers. Your counselor helps compare options and negotiate scholarships where possible.',
    tips: ['Compare offers holistically', 'Consider scholarship packages', 'Review location and cost of living'],
  },
  {
    step: 6,
    title: 'Visa Application',
    duration: 'Weeks 10–14',
    status: 'upcoming' as const,
    description: 'Apply for your student visa with full document support from ALO. We provide visa-specific checklists and mock interviews.',
    tips: ['Prepare financial documents', 'Schedule visa interview early', 'Practice interview questions'],
  },
  {
    step: 7,
    title: 'Pre-Departure & Enrolment',
    duration: 'Weeks 14–16',
    status: 'upcoming' as const,
    description: 'Confirm enrolment, attend ALO\'s pre-departure orientation, and prepare for your new life abroad.',
    tips: ['Book flights after visa approval', 'Arrange accommodation', 'Attend pre-departure briefing', 'Set up international banking'],
  },
];

// ─── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: 'completed' | 'current' | 'upcoming' }) {
  if (status === 'completed') {
    return <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.ink }} />;
  }
  if (status === 'current') {
    return <Circle className="w-5 h-5" style={{ color: COLORS.coral }} strokeWidth={2.5} />;
  }
  return <Clock className="w-5 h-5" style={{ color: COLORS.gray }} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentJourneyPage({ onBack, onNavigate, onLeadOpen }: StudentJourneyPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.paper }}>
      {/* Hero */}
      <PageHero
        overline="Your Path to Global Education"
        title="The ALO Student Journey"
        subtitle="From your first inquiry to university enrolment — every step guided by expert counselors, proven processes, and personalized support. Our 7-step framework has helped 2,500+ students achieve their dreams."
        variant="ink"
        primaryLabel="Start Your Application"
        onPrimaryClick={onLeadOpen}
        secondaryLabel="Explore Programs"
        onSecondaryClick={() => onNavigate?.('course-finder')}
        breadcrumbs={[
          { label: 'Home', href: '#' },
          { label: 'Your Journey' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 hover:opacity-70 transition-opacity"
          style={{ color: COLORS.coral }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Quick Stats */}
        <ScrollReveal animation="slide-up" className="mb-12">
          <StatsGrid />
        </ScrollReveal>

        {/* Application Flow Overview */}
        <ScrollReveal animation="slide-up" className="mb-12">
          <div className="p-6 border rounded-[6px]" style={{ backgroundColor: COLORS.white, borderColor: COLORS.grayLight }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>Application Flow</h2>
            <p className="text-sm mb-6" style={{ color: COLORS.gray }}>Your 7-step journey from inquiry to enrolment</p>
            <Flowchart currentStepId="application" direction="horizontal" />
          </div>
        </ScrollReveal>

        {/* Detailed Timeline */}
        <ScrollReveal animation="slide-up" className="mb-12">
          <div className="p-6 border rounded-[6px]" style={{ backgroundColor: COLORS.white, borderColor: COLORS.grayLight }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>Detailed Timeline</h2>
            <p className="text-sm mb-6" style={{ color: COLORS.gray }}>Milestones with timing and status</p>
            <TimelineDiagram direction="vertical" />
          </div>
        </ScrollReveal>

        {/* Step-by-Step Guide */}
        <ScrollReveal animation="fade-in" className="mb-12">
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.ink }}>Step-by-Step Guide</h2>
          <div className="space-y-4">
            {JOURNEY_STEPS.map((step) => (
              <ScrollReveal key={step.step} animation="slide-up" delay={step.step * 50}>
                <div
                  className="p-5 border rounded-[6px]"
                  style={{
                    backgroundColor: step.status === 'current' ? COLORS.coralGhost : COLORS.white,
                    borderColor: step.status === 'current' ? COLORS.coral : COLORS.grayLight,
                    borderWidth: step.status === 'current' ? 2 : 1,
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Step number & status */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <StatusIcon status={step.status} />
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: step.status === 'current' ? COLORS.coral
                            : step.status === 'completed' ? COLORS.ink
                            : COLORS.gray,
                        }}
                      >
                        Step {step.step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3
                          className="text-base font-bold"
                          style={{ color: step.status === 'upcoming' ? COLORS.gray : COLORS.ink }}
                        >
                          {step.title}
                        </h3>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-[4px]"
                          style={{
                            backgroundColor: step.status === 'current' ? COLORS.coralLight : COLORS.grayGhost,
                            color: step.status === 'current' ? COLORS.coral : COLORS.gray,
                          }}
                        >
                          {step.duration}
                        </span>
                        {step.status === 'current' && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-[4px]"
                            style={{ backgroundColor: COLORS.coral, color: COLORS.white }}
                          >
                            You are here
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm mb-3"
                        style={{ color: COLORS.gray }}
                      >
                        {step.description}
                      </p>
                      {step.tips.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.ink, letterSpacing: '0.08em' }}>
                            Tips
                          </span>
                          <ul className="mt-1 space-y-1">
                            {step.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: COLORS.gray }}>
                                <span style={{ color: step.status === 'current' ? COLORS.coral : COLORS.ink }}>•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>

        {/* Swimlane: Multi-Actor Workflow */}
        <ScrollReveal animation="slide-up" className="mb-12">
          <div className="p-6 border rounded-[6px]" style={{ backgroundColor: COLORS.white, borderColor: COLORS.grayLight }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>Who Does What?</h2>
            <p className="text-sm mb-6" style={{ color: COLORS.gray }}>See how you, your counselor, the university, and the visa office work together</p>
            <SwimlaneDiagram />
          </div>
        </ScrollReveal>

        {/* Conversion Funnel */}
        <ScrollReveal animation="slide-up" className="mb-12">
          <div className="p-6 border rounded-[6px]" style={{ backgroundColor: COLORS.white, borderColor: COLORS.grayLight }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>How Students Progress</h2>
            <p className="text-sm mb-6" style={{ color: COLORS.gray }}>From initial lead to successful enrolment — our conversion rates</p>
            <FunnelChart direction="horizontal" showPercentage />
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal animation="slide-up">
          <CtaBand
            heading="Ready to Start Your Journey?"
            description="Book a free consultation with an ALO counselor and take the first step toward your global education."
            primaryLabel="Start Your Application"
            onPrimaryClick={onLeadOpen}
            secondaryLabel="Explore Programs"
            onSecondaryClick={() => onNavigate?.('course-finder')}
            variant="coral"
          />
        </ScrollReveal>
      </div>
    </div>
  );
}
