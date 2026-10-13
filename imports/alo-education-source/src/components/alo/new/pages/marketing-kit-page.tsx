'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

// Marketing kit components
import { PrimaryCTA, SecondaryCTA, TertiaryCTA, UrgencyCTA, ValuePropCTA } from '@/components/alo/new/marketing/cta-patterns';
import { TrustBar, TestimonialCarousel, StatsBar, CertificationBadge, GuaranteeSeal } from '@/components/alo/new/marketing/trust-signals';
import { FAQAccordion, ComparisonTable, RiskReversal, SocialProofWall } from '@/components/alo/new/marketing/objection-handlers';
import { DownloadGuide, ScholarshipAlert, EligibilityChecker, VisaChecklist } from '@/components/alo/new/marketing/lead-magnet';
import { WelcomeEmail, FollowUpEmail, OfferEmail, VisaUpdateEmail } from '@/components/alo/new/marketing/email-templates';

interface MarketingKitPageProps {
  onBack?: () => void;
}

export function MarketingKitPage({ onBack }: MarketingKitPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-[#2d3142] text-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold">Marketing Kit</h1>
              <p className="text-xs text-white/50">CRO-optimized components & templates</p>
            </div>
          </div>
          <Badge className="text-xs bg-[#bf4520] text-white" style={{ borderRadius: '4px' }}>
            6 Component Groups
          </Badge>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="cta" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              {[
                { value: 'cta', label: 'CTA Patterns' },
                { value: 'trust', label: 'Trust Signals' },
                { value: 'objections', label: 'Objections' },
                { value: 'lead-magnets', label: 'Lead Magnets' },
                { value: 'emails', label: 'Email Templates' },
                { value: 'all', label: 'Full Preview' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#bf4520] data-[state=active]:text-[#2d3142] data-[state=active]:font-semibold text-[#6b7280] h-10 rounded-none px-3 text-xs whitespace-nowrap"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="cta" className="m-0 p-6">
            <CTASection />
          </TabsContent>

          <TabsContent value="trust" className="m-0 p-6">
            <TrustSection />
          </TabsContent>

          <TabsContent value="objections" className="m-0 p-6">
            <ObjectionsSection />
          </TabsContent>

          <TabsContent value="lead-magnets" className="m-0 p-6">
            <LeadMagnetsSection />
          </TabsContent>

          <TabsContent value="emails" className="m-0 p-6">
            <EmailsSection />
          </TabsContent>

          <TabsContent value="all" className="m-0 p-6 space-y-12">
            <CTASection />
            <Separator className="bg-[#e5e7eb]" />
            <TrustSection />
            <Separator className="bg-[#e5e7eb]" />
            <ObjectionsSection />
            <Separator className="bg-[#e5e7eb]" />
            <LeadMagnetsSection />
            <Separator className="bg-[#e5e7eb]" />
            <EmailsSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Section: CTA Patterns ──────────────────────────────────────────────────
function CTASection() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionHeader
        title="CTA Patterns"
        description="CRO-optimized call-to-action buttons designed for maximum conversion"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PreviewCard title="Primary CTA" description="High-intent action button">
          <PrimaryCTA />
        </PreviewCard>

        <PreviewCard title="Secondary CTA" description="Lower commitment, outlined style">
          <SecondaryCTA />
        </PreviewCard>

        <PreviewCard title="Tertiary CTA" description="Text-link style for low-pressure contexts">
          <TertiaryCTA />
        </PreviewCard>

        <PreviewCard title="Urgency CTA" description="Deadline-driven with live countdown">
          <UrgencyCTA deadline={deadline} />
        </PreviewCard>

        <PreviewCard title="Value Prop CTA" description="Social proof number + action" className="md:col-span-2">
          <ValuePropCTA />
        </PreviewCard>
      </div>
    </div>
  );
}

// ── Section: Trust Signals ─────────────────────────────────────────────────
function TrustSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionHeader
        title="Trust Signals"
        description="Build credibility and reduce anxiety at key decision points"
      />

      <PreviewCard title="Trust Bar" description="Partner university logos">
        <TrustBar />
      </PreviewCard>

      <PreviewCard title="Stats Bar" description="Key metrics in dark bar format">
        <StatsBar />
      </PreviewCard>

      <PreviewCard title="Testimonial Carousel" description="Auto-rotating student testimonials">
        <TestimonialCarousel />
      </PreviewCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PreviewCard title="Certification Badge" description="Accreditation display">
          <CertificationBadge />
        </PreviewCard>

        <PreviewCard title="Guarantee Seal" description="Money-back guarantee">
          <GuaranteeSeal />
        </PreviewCard>
      </div>
    </div>
  );
}

// ── Section: Objection Handlers ────────────────────────────────────────────
function ObjectionsSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionHeader
        title="Objection Handlers"
        description="Address concerns and overcome hesitations empathetically"
      />

      <PreviewCard title="FAQ Accordion" description="Common objections with empathetic answers">
        <FAQAccordion />
      </PreviewCard>

      <PreviewCard title="Comparison Table" description="Why ALO vs other consultancies">
        <ComparisonTable />
      </PreviewCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PreviewCard title="Risk Reversal" description="Free consultation guarantee">
          <RiskReversal />
        </PreviewCard>

        <PreviewCard title="Social Proof Wall" description="Student success stories grid">
          <SocialProofWall />
        </PreviewCard>
      </div>
    </div>
  );
}

// ── Section: Lead Magnets ──────────────────────────────────────────────────
function LeadMagnetsSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Lead Magnets"
        description="Capture leads with valuable free resources"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DownloadGuide />
        <ScholarshipAlert />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EligibilityChecker />
        <VisaChecklist />
      </div>
    </div>
  );
}

// ── Section: Email Templates ───────────────────────────────────────────────
function EmailsSection() {
  const [activeEmail, setActiveEmail] = useState<'welcome' | 'followup' | 'offer' | 'visa'>('welcome');

  const emails = [
    { key: 'welcome' as const, label: 'Welcome', color: '#22c55e' },
    { key: 'followup' as const, label: 'Follow-Up', color: '#f59e0b' },
    { key: 'offer' as const, label: 'Offer', color: '#3b82f6' },
    { key: 'visa' as const, label: 'Visa Update', color: '#8b5cf6' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Email Templates"
        description="Pre-built email sequences with desktop/mobile preview"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {emails.map(e => (
          <button
            key={e.key}
            onClick={() => setActiveEmail(e.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
              activeEmail === e.key
                ? 'text-white'
                : 'bg-[#f5f5f5] text-[#6b7280] hover:text-[#2d3142]'
            }`}
            style={activeEmail === e.key ? { backgroundColor: e.color } : undefined}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="bg-[#f5f5f5] border border-[#e5e7eb] rounded-[8px] p-6">
        {activeEmail === 'welcome' && <WelcomeEmail />}
        {activeEmail === 'followup' && <FollowUpEmail />}
        {activeEmail === 'offer' && <OfferEmail />}
        {activeEmail === 'visa' && <VisaUpdateEmail />}
      </div>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#2d3142]">{title}</h2>
      <p className="text-sm text-[#6b7280] mt-0.5">{description}</p>
    </div>
  );
}

function PreviewCard({ title, description, children, className = '' }: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`bg-white border border-[#e5e7eb] ${className}`} style={{ borderRadius: '8px' }}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-[#2d3142]">{title}</CardTitle>
        <p className="text-xs text-[#9ca3af]">{description}</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {children}
      </CardContent>
    </Card>
  );
}
