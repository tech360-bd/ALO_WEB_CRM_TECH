/**
 * ALO Education diagram compositions — the site-specific content rendered
 * through the generic diagram library in this folder.
 *
 * Design language: cathrynlavery/diagram-design (44-type editorial system),
 * re-skinned to the ALO brand palette (see ./tokens.ts). Marketing content
 * frameworks: coreyhaines31/marketingskills. All copy is real ALO service
 * content — no invented metrics anywhere.
 */

import React from 'react';
import ProcessDiagram, { type ProcessArrow, type ProcessLane, type ProcessNodeSpec, type ProcessStep } from './ProcessDiagram';
import JourneyMapDiagram, { type JourneyStage } from './JourneyMapDiagram';
import FunnelDiagram, { type FunnelStage } from './FunnelDiagram';
import TimelineDiagram, { type TimelineEvent } from './TimelineDiagram';
import FlowDiagram, { type FlowLink, type FlowNode } from './FlowDiagram';

/* ------------------------------------------------------------------ */
/* Application process — who does what, across 3 actors × 6 steps      */
/* ------------------------------------------------------------------ */

const APPLICATION_PROCESS_LANES: ProcessLane[] = [
  { key: 'STU', name: ['Student'] },
  { key: 'ALO', name: ['ALO', 'Counselor'] },
  { key: 'UNI', name: ['University', '& Visa'] },
];

const APPLICATION_PROCESS_STEPS: ProcessStep[] = [
  { number: '1', label: 'Evaluate' },
  { number: '2', label: 'Shortlist', focal: true },
  { number: '3', label: 'Prepare' },
  { number: '4', label: 'Apply' },
  { number: '5', label: 'Offer' },
  { number: '6', label: 'Visa' },
];

const APPLICATION_PROCESS_NODES: ProcessNodeSpec[] = [
  { lane: 1, step: 0, titleLines: ['Profile evaluation'], sub: 'academics · goals' },
  { lane: 0, step: 0, titleLines: ['Share transcripts'], sub: '1–2 days' },
  { lane: 1, step: 1, titleLines: ['Match universities'], sub: 'up to 4 picks', focal: true },
  { lane: 0, step: 1, titleLines: ['Confirm choices'], sub: 'budget · goals' },
  { lane: 0, step: 2, titleLines: ['SOP · LORs · docs'], sub: '3–7 days' },
  { lane: 1, step: 2, titleLines: ['Verify & format'], sub: 'checklist' },
  { lane: 1, step: 3, titleLines: ['Submit applications'], sub: 'zero-error forms' },
  { lane: 2, step: 3, titleLines: ['Review & decide'], sub: '2–6 weeks' },
  { lane: 2, step: 4, titleLines: ['Issue offer'], sub: 'CAS · COE · I-20' },
  { lane: 0, step: 4, titleLines: ['Pay deposit'], sub: 'secure transfer' },
  { lane: 1, step: 5, titleLines: ['Pre-departure briefing'], sub: 'mock interview' },
  { lane: 0, step: 5, titleLines: ['Visa file & interview'], sub: '3–8 weeks' },
];

const APPLICATION_PROCESS_ARROWS: ProcessArrow[] = [
  { from: { lane: 1, step: 0 }, to: { lane: 1, step: 1 } },
  { from: { lane: 1, step: 1 }, to: { lane: 0, step: 1 } },
  { from: { lane: 0, step: 1 }, to: { lane: 0, step: 2 } },
  { from: { lane: 0, step: 2 }, to: { lane: 1, step: 2 } },
  { from: { lane: 1, step: 2 }, to: { lane: 1, step: 3 } },
  { from: { lane: 1, step: 3 }, to: { lane: 2, step: 3 } },
  { from: { lane: 2, step: 3 }, to: { lane: 2, step: 4 } },
  { from: { lane: 2, step: 4 }, to: { lane: 0, step: 4 } },
  { from: { lane: 0, step: 4 }, to: { lane: 1, step: 5 } },
  { from: { lane: 1, step: 5 }, to: { lane: 0, step: 5 } },
];

export function ApplicationProcessDiagram() {
  return (
    <ProcessDiagram
      idPrefix="alo-process"
      eyebrow="System map"
      title="Who does what — your application, end to end"
      lanes={APPLICATION_PROCESS_LANES}
      steps={APPLICATION_PROCESS_STEPS}
      nodes={APPLICATION_PROCESS_NODES}
      arrows={APPLICATION_PROCESS_ARROWS}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Student journey — sentiment curve across 6 stages                   */
/* ------------------------------------------------------------------ */

const STUDENT_JOURNEY_STAGES: JourneyStage[] = [
  {
    name: 'Discover',
    sentiment: 'HIGH',
    actions: ['Profile evaluation', 'Country & course pick'],
    touchpoints: 'website · call',
  },
  {
    name: 'Apply',
    sentiment: 'MED-HIGH',
    actions: ['Documents & SOP', 'Applications out'],
    touchpoints: 'portal · email',
    pain: 'document churn',
  },
  {
    name: 'Admit',
    sentiment: 'HIGH',
    actions: ['Offer comparison', 'Scholarship check'],
    touchpoints: 'portal · whatsapp',
  },
  {
    name: 'Prepare',
    sentiment: 'LOW',
    actions: ['Deposit & visa file', 'Financial proof'],
    touchpoints: 'portal · bank',
    pain: 'visa-file stress',
  },
  {
    name: 'Depart',
    sentiment: 'MED-HIGH',
    actions: ['Mock interview', 'Fly out'],
    touchpoints: 'office · airport',
  },
  {
    name: 'Succeed',
    sentiment: 'HIGH',
    actions: ['Campus support', 'Alumni network'],
    touchpoints: 'portal · events',
  },
];

export function StudentJourneyMapDiagram() {
  return (
    <JourneyMapDiagram
      idPrefix="alo-journey"
      eyebrow="System map"
      title="How the journey feels — stage by stage"
      stages={STUDENT_JOURNEY_STAGES}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Eligibility flow — decision logic behind the eligibility checker    */
/* ------------------------------------------------------------------ */

const ELIGIBILITY_NODES: FlowNode[] = [
  { id: 'start', kind: 'start', rect: { x: 210, y: 16, w: 180, h: 44 }, titleLines: ['Your profile'] },
  { id: 'd1', kind: 'decision', rect: { x: 190, y: 96, w: 220, h: 100 }, titleLines: ['Academic match?'] },
  { id: 'd2', kind: 'decision', rect: { x: 190, y: 236, w: 220, h: 100 }, titleLines: ['Destination', 'reqs met?'] },
  { id: 'd3', kind: 'decision', rect: { x: 190, y: 376, w: 220, h: 100 }, titleLines: ['Required test', 'score?'] },
  {
    id: 'win',
    kind: 'end',
    rect: { x: 170, y: 516, w: 260, h: 60 },
    titleLines: ['Eligible — book a', 'a consultation'],
  },
  {
    id: 'pathway',
    kind: 'end-muted',
    rect: { x: 560, y: 116, w: 250, h: 52 },
    titleLines: ['Foundation /', 'pathway options'],
  },
  {
    id: 'english',
    kind: 'end-muted',
    rect: { x: 560, y: 256, w: 250, h: 52 },
    titleLines: ['English prep', 'plan'],
  },
  {
    id: 'retake',
    kind: 'end-muted',
    rect: { x: 560, y: 396, w: 250, h: 52 },
    titleLines: ['Test retake', 'plan'],
  },
];

const ELIGIBILITY_LINKS: FlowLink[] = [
  { from: 'start', to: 'd1' },
  { from: 'd1', to: 'd2', label: 'yes' },
  { from: 'd2', to: 'd3', label: 'yes' },
  { from: 'd3', to: 'win', label: 'yes', tone: 'accent' },
  { from: 'd1', to: 'pathway', fromSide: 'right', toSide: 'left', label: 'no' },
  { from: 'd2', to: 'english', fromSide: 'right', toSide: 'left', label: 'no' },
  { from: 'd3', to: 'retake', fromSide: 'right', toSide: 'left', label: 'no' },
];

export function EligibilityFlowDiagram() {
  return (
    <FlowDiagram
      idPrefix="alo-eligibility"
      eyebrow="Decision logic"
      title="How the eligibility check decides"
      width={880}
      height={620}
      nodes={ELIGIBILITY_NODES}
      links={ELIGIBILITY_LINKS}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Marketing funnel — live counts, honest widths                       */
/* ------------------------------------------------------------------ */

export function MarketingFunnelDiagram({ stages }: { stages: FunnelStage[] }) {
  return (
    <FunnelDiagram
      idPrefix="alo-funnel"
      eyebrow="Conversion"
      title="Enquiry → enrollment funnel"
      stages={stages}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Intake timeline — honest time spacing over a 5-month intake         */
/* ------------------------------------------------------------------ */

const INTAKE_TIMELINE_EVENTS: TimelineEvent[] = [
  { label: 'Profile evaluation', date: 'Week 0–1', position: 0 },
  { label: 'Shortlist', date: 'Week 2', position: 2 / 22 },
  { label: 'Applications', date: 'Week 3–4', position: 3.5 / 22 },
  { label: 'Offer letter', date: 'Month 2–3', position: 10 / 22 },
  { label: 'Visa', date: 'Month 3–4', position: 14 / 22 },
  { label: 'Departure', date: 'Month 5', position: 20 / 22, milestone: true },
];

export function IntakeTimelineDiagram() {
  return (
    <TimelineDiagram
      idPrefix="alo-intake"
      eyebrow="To scale"
      title="Typical intake timeline — evaluation to departure"
      events={INTAKE_TIMELINE_EVENTS}
      startLabel="week 0"
      endLabel="month 5"
    />
  );
}
