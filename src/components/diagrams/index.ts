/**
 * ALO Education — Diagram Component Library
 *
 * Barrel export for all diagram components following the editorial design system:
 * - Paper bg (#f5f5f5), Ink text (#2d3142), Coral accent (#bf4520)
 * - No shadows, max 6-10px border-radius
 * - 1-2 coral focal nodes per diagram
 * - Density 4/10 (generous whitespace)
 */

// Flowchart
export { Flowchart, StudentApplicationFlow } from './flowchart';

// Funnel Chart
export { FunnelChart, LeadConversionFunnel } from './funnel-chart';

// Timeline Diagram
export { TimelineDiagram, StudentJourneyTimeline } from './timeline-diagram';

// Swimlane Diagram
export { SwimlaneDiagram, ApplicationWorkflowSwimlane } from './swimlane-diagram';

// Pyramid Chart
export { PyramidChart, ServiceTierPyramid } from './pyramid-chart';

// Stat Card & Chip
export { StatCard, StatChip, StatsGrid } from './stat-card';

// CTA Band
export { CtaBand, StudentCtaBand } from './cta-band';

// Scroll Reveal
export { ScrollReveal, StaggerReveal } from './scroll-reveal';

// Page Hero
export { PageHero, StudentJourneyHero } from './page-hero';
