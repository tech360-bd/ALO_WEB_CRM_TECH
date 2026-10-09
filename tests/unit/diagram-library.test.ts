// Diagram library integrity tests (editorial SVG system, src/components/diagrams).
// These tests pin the guarantees the design system relies on:
//   • every diagram renders valid SVG with no NaN geometry
//   • connectors are orthogonal with rounded arcs (never raw diagonals)
//   • the funnel keeps honest widths and signed drop-off labels
//   • the journey map renders named sentiment levels + trough highlight
//   • the process diagram renders every lane, step, and node
//
// Uses React.createElement (not JSX) so the file stays within the repo's
// vitest include convention: tests/unit/**/*.test.ts

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { roundedOrthoPath } from '@/components/diagrams/primitives';
import {
  ApplicationProcessDiagram,
  StudentJourneyMapDiagram,
  EligibilityFlowDiagram,
  MarketingFunnelDiagram,
  IntakeTimelineDiagram,
} from '@/components/diagrams/alo-diagrams';

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

describe('roundedOrthoPath (connector geometry)', () => {
  it('emits a straight line for two points', () => {
    expect(roundedOrthoPath([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toBe('M 0 0 L 10 0');
  });

  it('rounds orthogonal bends with arc commands, never diagonals', () => {
    const d = roundedOrthoPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 20 }]);
    expect(d).toContain('A ');
    // no diagonal line segments between the vertices
    expect(d).not.toContain('L 10 20');
    expect(d).toContain('M 0 0');
    expect(d).toContain('30 20');
  });

  it('clamps the radius to half the shortest segment', () => {
    const d = roundedOrthoPath([{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 6 }], 8);
    // radius clamped to 3 (half of the 6px segments)
    expect(d).toContain('A 3 3');
  });
});

describe('diagram compositions render valid SVG', () => {
  it('application process diagram: lanes, steps, nodes, no NaN', () => {
    const html = render(createElement(ApplicationProcessDiagram));
    expect(html).toContain('<svg');
    expect(html).not.toContain('NaN');
    expect(html).toContain('Student');
    expect(html).toContain('Counselor');
    expect(html).toContain('Match universities'); // focal node
    expect(html).toContain('who does what');
  });

  it('student journey map: sentiment levels, trough, pain markers, no NaN', () => {
    const html = render(createElement(StudentJourneyMapDiagram));
    expect(html).toContain('<svg');
    expect(html).not.toContain('NaN');
    expect(html).toContain('HIGH');
    expect(html).toContain('NEUTRAL');
    expect(html).toContain('LOW');
    expect(html).toContain('trough — Prepare'); // legend names the trough
    expect(html).toContain('visa-file stress'); // pain marker
    expect(html).toContain('sentiment by stage');
  });

  it('eligibility flow diagram: decision nodes, labeled branches, no NaN', () => {
    const html = render(createElement(EligibilityFlowDiagram));
    expect(html).toContain('<svg');
    expect(html).not.toContain('NaN');
    expect(html).toContain('Academic match?');
    expect(html).toContain('Eligible — book a');
    // every decision branch is labeled
    expect((html.match(/>yes</g) || []).length).toBe(3);
    expect((html.match(/>no</g) || []).length).toBe(3);
  });

  it('marketing funnel: honest widths and signed drop-off, no NaN', () => {
    const html = render(
      createElement(MarketingFunnelDiagram, {
        stages: [
          { label: 'Enquiries', value: 1240, sublabel: 'leads' },
          { label: 'Consultations', value: 486, sublabel: 'booked' },
          { label: 'Enrolled', value: 121, sublabel: 'students' },
        ],
      }),
    );
    expect(html).toContain('<svg');
    expect(html).not.toContain('NaN');
    expect(html).toContain('−61%'); // 1240 → 486
    expect(html).toContain('−75%'); // 486 → 121
    expect(html).toContain('1,240');
    expect(html).toContain('live CRM counts');
  });

  it('funnel clamps widths when a later stage exceeds the first', () => {
    const html = render(
      createElement(MarketingFunnelDiagram, {
        stages: [
          { label: 'Enquiries', value: 10 },
          { label: 'Consultations', value: 25 },
        ],
      }),
    );
    expect(html).not.toContain('NaN');
    expect(html).toContain('+150%'); // growth is shown honestly, not hidden
  });

  it('intake timeline: honest spacing, milestone accent, no NaN', () => {
    const html = render(createElement(IntakeTimelineDiagram));
    expect(html).toContain('<svg');
    expect(html).not.toContain('NaN');
    expect(html).toContain('Departure');
    expect(html).toContain('Month 5');
    expect(html).toContain('week 0');
    expect(html).toContain('to scale');
  });
});
