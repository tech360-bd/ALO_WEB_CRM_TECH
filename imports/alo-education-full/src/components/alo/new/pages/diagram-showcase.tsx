'use client';

import React, { useState } from 'react';
import { COLORS, RADIUS } from '@/lib/design-system';
import { Flowchart, StudentApplicationFlow } from '@/components/diagrams/flowchart';
import { FunnelChart, LeadConversionFunnel } from '@/components/diagrams/funnel-chart';
import { TimelineDiagram, StudentJourneyTimeline } from '@/components/diagrams/timeline-diagram';
import { SwimlaneDiagram, ApplicationWorkflowSwimlane } from '@/components/diagrams/swimlane-diagram';
import { PyramidChart, ServiceTierPyramid } from '@/components/diagrams/pyramid-chart';
import { StatCard, StatChip, StatsGrid } from '@/components/diagrams/stat-card';
import { CtaBand, StudentCtaBand } from '@/components/diagrams/cta-band';
import { ScrollReveal } from '@/components/diagrams/scroll-reveal';
import { PageHero } from '@/components/diagrams/page-hero';
import { ArrowLeft, ChevronRight } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiagramShowcaseProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal animation="slide-up" className="mb-12">
      <div
        className="p-6 border rounded-[6px]"
        style={{ backgroundColor: COLORS.white, borderColor: COLORS.grayLight }}
      >
        <h3
          className="text-lg font-bold mb-1"
          style={{ color: COLORS.ink }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-sm mb-5"
            style={{ color: COLORS.gray }}
          >
            {description}
          </p>
        )}
        <div>{children}</div>
      </div>
    </ScrollReveal>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiagramShowcase({ onBack, onNavigate }: DiagramShowcaseProps) {
  const [flowStep, setFlowStep] = useState('application');
  const [funnelDir, setFunnelDir] = useState<'horizontal' | 'vertical'>('vertical');

  const flowSteps = ['inquiry', 'registration', 'documents', 'application', 'offer', 'visa', 'enrolment'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.paper }}>
      {/* Header */}
      <PageHero
        overline="Component Library"
        title="Diagram Showcase"
        subtitle="All 10 diagram components from the ALO Education design system — editorial style, paper backgrounds, ink strokes, coral accents."
        variant="ink"
        breadcrumbs={[
          { label: 'Home', href: '#' },
          { label: 'Diagram Showcase' },
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

        {/* Design system summary */}
        <ScrollReveal animation="fade-in" className="mb-10">
          <div
            className="p-5 border rounded-[6px] flex flex-wrap gap-4 items-center"
            style={{ backgroundColor: COLORS.white, borderColor: COLORS.grayLight }}
          >
            <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>Design System:</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[4px]" style={{ backgroundColor: COLORS.paper, border: `1px solid ${COLORS.grayLight}` }} />
              <span className="text-xs" style={{ color: COLORS.gray }}>Paper {COLORS.paper}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[4px]" style={{ backgroundColor: COLORS.ink }} />
              <span className="text-xs" style={{ color: COLORS.gray }}>Ink {COLORS.ink}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[4px]" style={{ backgroundColor: COLORS.coral }} />
              <span className="text-xs" style={{ color: COLORS.gray }}>Coral {COLORS.coral}</span>
            </div>
            <span className="text-xs" style={{ color: COLORS.gray }}>• No shadows • Max 10px radius • 1-2 coral focal nodes • Density 4/10</span>
          </div>
        </ScrollReveal>

        {/* 1. Flowchart */}
        <Section
          title="1. Flowchart"
          description="Configurable flowchart with nodes and edges. Student application flow with interactive step selection."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-xs font-medium" style={{ color: COLORS.gray }}>Current step:</span>
            {flowSteps.map(step => (
              <button
                key={step}
                onClick={() => setFlowStep(step)}
                className="px-3 py-1 text-xs font-medium rounded-[4px] border transition-all"
                style={{
                  backgroundColor: step === flowStep ? COLORS.coral : COLORS.white,
                  color: step === flowStep ? COLORS.white : COLORS.ink,
                  borderColor: step === flowStep ? COLORS.coral : COLORS.grayLight,
                }}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </button>
            ))}
          </div>
          <Flowchart currentStepId={flowStep} direction="horizontal" />
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Vertical Layout</h4>
            <Flowchart currentStepId={flowStep} direction="vertical" />
          </div>
        </Section>

        {/* 2. Funnel Chart */}
        <Section
          title="2. Funnel Chart"
          description="Lead conversion funnel with gradient from ink to coral, percentage labels, and horizontal/vertical variants."
        >
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setFunnelDir('vertical')}
              className="px-3 py-1 text-xs font-medium rounded-[4px] border"
              style={{
                backgroundColor: funnelDir === 'vertical' ? COLORS.coral : COLORS.white,
                color: funnelDir === 'vertical' ? COLORS.white : COLORS.ink,
                borderColor: funnelDir === 'vertical' ? COLORS.coral : COLORS.grayLight,
              }}
            >
              Vertical (Trapezoid)
            </button>
            <button
              onClick={() => setFunnelDir('horizontal')}
              className="px-3 py-1 text-xs font-medium rounded-[4px] border"
              style={{
                backgroundColor: funnelDir === 'horizontal' ? COLORS.coral : COLORS.white,
                color: funnelDir === 'horizontal' ? COLORS.white : COLORS.ink,
                borderColor: funnelDir === 'horizontal' ? COLORS.coral : COLORS.grayLight,
              }}
            >
              Horizontal (Bars)
            </button>
          </div>
          <FunnelChart direction={funnelDir} showPercentage />
        </Section>

        {/* 3. Timeline */}
        <Section
          title="3. Timeline Diagram"
          description="Student journey milestones with completed/current/upcoming states. Horizontal and vertical variants."
        >
          <h4 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Horizontal</h4>
          <TimelineDiagram direction="horizontal" />
          <h4 className="text-sm font-semibold mb-3 mt-6" style={{ color: COLORS.ink }}>Vertical</h4>
          <TimelineDiagram direction="vertical" />
        </Section>

        {/* 4. Swimlane */}
        <Section
          title="4. Swimlane Diagram"
          description="Multi-actor workflow with Student, Counselor, University, and Visa Office lanes. Shows handoffs with dashed arrows."
        >
          <SwimlaneDiagram />
        </Section>

        {/* 5. Pyramid Chart */}
        <Section
          title="5. Pyramid Chart"
          description="Service tier pyramid with decreasing widths and gradient colors from coral (top) to ink (bottom)."
        >
          <PyramidChart />
        </Section>

        {/* 6. Stat Cards */}
        <Section
          title="6. Stat Card & Stat Chip"
          description="Animated number counters with trend indicators. Full cards and compact inline chips."
        >
          <h4 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Stat Cards (Grid)</h4>
          <StatsGrid />
          <h4 className="text-sm font-semibold mb-3 mt-6" style={{ color: COLORS.ink }}>Stat Chips (Inline)</h4>
          <div className="flex flex-wrap gap-3">
            <StatChip label="Active Students" value={1250} format="number" trend={{ value: 8, direction: 'up' }} />
            <StatChip label="Avg. Processing" value={14} suffix=" days" trend={{ value: 3, direction: 'down' }} />
            <StatChip label="Success Rate" value={96} suffix="%" trend={{ value: 1, direction: 'up' }} />
          </div>
        </Section>

        {/* 7. CTA Band */}
        <Section
          title="7. CTA Band"
          description="Full-width CTA with marketing-optimized copy. Note: 'Start Your Application' not 'Submit' (CRO best practice)."
        >
          <CtaBand
            heading="Ready to Begin Your Journey?"
            description="Join 2,500+ students who have achieved their study abroad dreams with ALO Education."
            primaryLabel="Start Your Application"
            secondaryLabel="Book Free Consultation"
            variant="coral"
          />
          <div className="mt-4">
            <CtaBand
              heading="Explore Our Programs"
              description="Browse 500+ courses across 28 countries with expert guidance."
              primaryLabel="Find Your Program"
              variant="ink"
            />
          </div>
        </Section>

        {/* 8. Scroll Reveal */}
        <Section
          title="8. Scroll Reveal"
          description="Intersection Observer-based animations: fade-in, slide-up, slide-left, slide-right, scale-in. Staggered children support."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['fade-in', 'slide-up', 'slide-left', 'scale-in'] as const).map((anim, i) => (
              <ScrollReveal key={anim} animation={anim} delay={i * 150}>
                <div
                  className="p-4 border rounded-[6px] text-center"
                  style={{ backgroundColor: COLORS.paper, borderColor: COLORS.grayLight }}
                >
                  <div className="text-2xl mb-2">{['✨', '🚀', '←', '🎯'][i]}</div>
                  <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{anim}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Section>

        {/* 9. Page Hero */}
        <Section
          title="9. Page Hero"
          description="Hero section with overline, title, subtitle, breadcrumbs, and CTA buttons. Three variants: coral, ink, paper."
        >
          <PageHero
            overline="Example Overline"
            title="Ink Variant Hero"
            subtitle="This is the ink variant with white text on dark background. Ideal for primary landing pages."
            variant="ink"
            primaryLabel="Primary Action"
            secondaryLabel="Secondary Action"
          />
          <div className="mt-4">
            <PageHero
              overline="Paper Variant"
              title="Paper Variant Hero"
              subtitle="Light background with ink text. Great for content-heavy pages."
              variant="paper"
              primaryLabel="Get Started"
              secondaryLabel="Learn More"
              breadcrumbs={[
                { label: 'Home', href: '#' },
                { label: 'Section', href: '#' },
                { label: 'Current Page' },
              ]}
            />
          </div>
        </Section>

        {/* 10. Combined Example */}
        <Section
          title="10. Combined — Full Page Layout"
          description="All diagram components working together in a realistic page layout."
        >
          <div
            className="p-6 rounded-[6px]"
            style={{ backgroundColor: COLORS.paper }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.ink }}>Quick Stats</h3>
            <StatsGrid className="mb-8" />
            <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.ink }}>Application Progress</h3>
            <StudentApplicationFlow currentStepId="offer" className="mb-8" />
            <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.ink }}>Conversion Funnel</h3>
            <LeadConversionFunnel className="mb-8" />
          </div>
        </Section>
      </div>
    </div>
  );
}
