import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_MARKETING_KITS } from '@/lib/marketing-kit';
import { buildCreativeSvg, buildCreativeBrief, creativeFromKit, CREATIVE_FORMATS, validateCreative } from '@/lib/marketing-kit/creative';
import CampaignCreativeComposer from '@/components/marketing/CampaignCreativeComposer';
import BrandAssetsPostCreatorView from '@/components/marketing/hub/BrandAssetsPostCreatorView';
import KanbanPipeline from '@/components/crm/KanbanPipeline';
import { Button } from '@/components/ui/button';
import FunnelDiagram from '@/components/diagrams/FunnelDiagram';
import { EligibilityFlowDiagram } from '@/components/diagrams/alo-diagrams';
import { roundedOrthoPath } from '@/components/diagrams/primitives';

describe('original branded draft assets', () => {
  it('exports all supplied ALO kits at four platform sizes with a permanent draft watermark', () => {
    for (const kit of DEFAULT_MARKETING_KITS) for (const [format, size] of Object.entries(CREATIVE_FORMATS)) {
      const content = creativeFromKit(kit);
      expect(validateCreative(content)).toEqual([]);
      const svg = buildCreativeSvg(content, format as keyof typeof CREATIVE_FORMATS);
      expect(svg).toContain(`viewBox="0 0 ${size.width} ${size.height}"`);
      expect(svg).toContain('DRAFT · HUMAN REVIEW REQUIRED');
      expect(svg).toContain('ALO EDUCATION');
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('<image'); // no remote image dependencies
      expect(svg).not.toContain('<script');
      expect(buildCreativeBrief(content, format as keyof typeof CREATIVE_FORMATS)).toContain('not approved, scheduled or published');
    }
  });
  it('escapes SVG content and validates dimensions, copy lengths and destination URLs', () => {
    const content = { headline: '<script>alert(1)</script>', body: 'A & B', cta: '"Book"', destination: 'https://example.com' };
    const svg = buildCreativeSvg(content, 'square');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('A &amp; B');
    expect(validateCreative({ ...content, destination: 'javascript:alert(1)' }).length).toBeGreaterThan(0);
    expect(validateCreative({ ...content, headline: 'x'.repeat(111) }).length).toBeGreaterThan(0);
    expect(() => buildCreativeSvg({ ...content, body: '' }, 'square')).toThrow();
  });
  it('renders linked editable labels, four formats and explicit download actions', () => {
    const html = renderToStaticMarkup(createElement(CampaignCreativeComposer, { kit: DEFAULT_MARKETING_KITS[0] }));
    expect(html).toContain('Visual campaign composer');
    expect(html).toContain('Verified destination URL');
    expect(html).toContain('SVG'); expect(html).toContain('PNG'); expect(html).toContain('Copy brief');
    expect(html.match(/<option /g)).toHaveLength(4);
    expect(html).toContain('role="status"');
  });
});

describe('honest diagram geometry and IDs', () => {
  const render = (values: number[]) => renderToStaticMarkup(createElement(FunnelDiagram, { title: 'Actual counts', idPrefix: 'funnel', stages: values.map((value, i) => ({ label: `Stage ${i}`, value })) }));
  it('scales every stage to the largest, preserves zero/small counts and growing stages', () => {
    const html = render([10, 25, 0]);
    const points = [...html.matchAll(/<polygon points="([^"]+)"/g)].filter((m) => m[1].includes(",40") || m[1].includes(",110") || m[1].includes(",180")).map((m) => m[1].split(' ').map((p) => p.split(',').map(Number)));
    expect(points[0][1][0] - points[0][0][0]).toBe(152); // 10/25 * 380
    expect(points[1][1][0] - points[1][0][0]).toBe(380);
    expect(points[2][1][0] - points[2][0][0]).toBe(0);
    expect(html).toContain('+150%');
    expect(html).toContain('stage counts');
    expect(render([10000, 1])).toContain('249.981'); // no artificial 96px floor
  });
  it('empty, zero, negative, NaN and infinite values never produce invalid SVG', () => {
    for (const values of [[], [0, 0], [-1, 2], [NaN, 1], [Infinity]]) {
      const html = render(values);
      expect(html).not.toContain('NaN'); expect(html).not.toContain('Infinity');
    }
    expect(render([])).toContain('No funnel counts');
    expect(render([-1])).toContain('Counts unavailable');
  });
  it('has unique arrow and accessible title/description IDs for duplicate compositions', () => {
    const html = renderToStaticMarkup(createElement('div', null, createElement(EligibilityFlowDiagram), createElement(EligibilityFlowDiagram)));
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(html).toContain('aria-describedby='); expect(html).toContain('<title'); expect(html).toContain('<desc');
  });
  it('rounds immediately before a bend, not near the start of the preceding segment', () => {
    expect(roundedOrthoPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }])).toBe('M 0 0 L 92 0 A 8 8 0 0 1 100 8 L 100 100');
  });
});
describe('shared ALO button contracts', () => {
  it('retains native disabled state, visible focus and CTA/outline variants', () => {
    const html = renderToStaticMarkup(createElement(Button, { type: 'button', variant: 'outline', disabled: true }, 'Download'));
    expect(html).toContain('disabled='); expect(html).toContain('focus-visible:'); expect(html).toContain('type="button"');
  });
});


describe('main marketing hub and pipeline are not demo placeholders', () => {
  it('main brand view exposes the actual composer, no fake posts/approvals/contacts', () => {
    const html = renderToStaticMarkup(createElement(BrandAssetsPostCreatorView));
    expect(html).toContain('Visual campaign composer');
    expect(html).toContain('Stored brand asset inventory');
    for (const fabricated of ['248', 'Approved Templates', '+8801700000000', 'alo.edu.bd', 'FREE consultation']) expect(html).not.toContain(fabricated);
  });
  it('renders stage selector and enabled named drag handle only when persistence is available', () => {
    const items = [{ id: 'app1', title: 'Example application', stage: 'APPLICATION_DRAFT' }, { id: 'app2', title: 'Unknown stage still visible', stage: 'LEGACY' }];
    const readOnly = renderToStaticMarkup(createElement(KanbanPipeline, { items }));
    expect(readOnly).toContain('aria-label="Stage for Example application"');
    expect(readOnly).toContain('disabled=');
    expect(readOnly).toContain('Unknown stage still visible');
    const writable = renderToStaticMarkup(createElement(KanbanPipeline, { items, onStageChange: async () => {} }));
    expect(writable).toContain('aria-label="Move Example application"');
    expect(writable).toContain('Drop here');
    expect(writable).toContain('only after the persistence callback succeeds');
  });
});


describe('application board is reachable from the actual CRM screen', () => {
  it('uses the live API records and leaves editing unavailable until a transition API is audited', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('../../src/components/crm/pages/CrmApplicationsPage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('<KanbanPipeline');
    expect(source).toContain('Read-only board of the loaded records');
    expect(source).toContain('onOpen={setSelectedId}');
    expect(source).not.toContain('onStageChange=');
  });
});
