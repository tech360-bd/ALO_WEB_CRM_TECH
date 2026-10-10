// Marketing kit library integrity (src/lib/marketing-kit).
// Pins the guarantees the kit panel relies on:
//   • every campaign kit has hook, copy, CTA, and at least one channel
//   • email sequences follow the welcome (7) / nurture (8) templates
//   • every email has subject, body, and a single CTA
//   • every SMS/WhatsApp template carries a compliance note and opt-out
//   • lead magnets name a deliverable and a follow-up sequence
//   • CRO items name a page, an action, and an experiment

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MARKETING_KITS,
  EMAIL_SEQUENCES,
  LEAD_MAGNETS,
  SMS_TEMPLATES,
  SOCIAL_CALENDAR,
  CRO_CHECKLIST,
  MARKETING_KIT_REVIEW_CHECKLIST,
  buildMarketingKitLibraryMarkdown,
} from '@/lib/marketing-kit';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarketingKitPanel from '@/components/marketing/MarketingKitPanel';

describe('campaign kits', () => {
  it('every kit is complete (hook, copy, CTA, channels)', () => {
    expect(DEFAULT_MARKETING_KITS.length).toBeGreaterThanOrEqual(8);
    for (const kit of DEFAULT_MARKETING_KITS) {
      expect(kit.id).toBeTruthy();
      expect(kit.hook.length).toBeGreaterThan(10);
      expect(kit.copy.length).toBeGreaterThan(20);
      expect(kit.cta).toBeTruthy();
      expect(kit.channels.length).toBeGreaterThan(0);
    }
  });

  it('kit ids are unique', () => {
    const ids = DEFAULT_MARKETING_KITS.map((kit) => kit.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('email sequences', () => {
  it('welcome sequence has 7 emails, nurture has 8', () => {
    const welcome = EMAIL_SEQUENCES.find((s) => s.id === 'welcome');
    const nurture = EMAIL_SEQUENCES.find((s) => s.id === 'nurture');
    expect(welcome?.emails.length).toBe(7);
    expect(nurture?.emails.length).toBe(8);
  });

  it('every email has timing, subject, body, and one CTA', () => {
    for (const sequence of EMAIL_SEQUENCES) {
      for (const email of sequence.emails) {
        expect(email.timing).toBeTruthy();
        expect(email.subject).toBeTruthy();
        expect(email.body.length).toBeGreaterThan(40);
        expect(email.cta).toBeTruthy();
      }
    }
  });
});

describe('lead magnets', () => {
  it('every magnet names deliverables and a valid sequence', () => {
    expect(LEAD_MAGNETS.length).toBeGreaterThanOrEqual(6);
    for (const magnet of LEAD_MAGNETS) {
      expect(magnet.deliverable.length).toBeGreaterThan(0);
      expect(['welcome', 'nurture']).toContain(magnet.sequence);
      expect(magnet.cta).toBeTruthy();
    }
  });
});

describe('SMS & WhatsApp templates', () => {
  it('every template has a trigger, timing, and compliance note', () => {
    expect(SMS_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    for (const template of SMS_TEMPLATES) {
      expect(template.trigger).toBeTruthy();
      expect(template.timing).toBeTruthy();
      expect(template.compliance).toBeTruthy();
      expect(template.body).toContain('{{');
    }
  });

  it('promotional templates carry an opt-out', () => {
    for (const template of SMS_TEMPLATES) {
      if (template.compliance.startsWith('Promotional')) {
        expect(template.body.toUpperCase()).toContain('STOP');
      }
    }
  });
});

describe('social calendar', () => {
  it('covers 14 days (15 posts) with platform, hook, copy, and CTA', () => {
    expect(SOCIAL_CALENDAR.length).toBe(15);
    const days = new Set(SOCIAL_CALENDAR.map((post) => post.day));
    expect(Math.min(...days)).toBe(1);
    expect(Math.max(...days)).toBe(14);
    for (const post of SOCIAL_CALENDAR) {
      expect(post.platform).toBeTruthy();
      expect(post.hook).toBeTruthy();
      expect(post.copy.length).toBeGreaterThan(20);
      expect(post.cta).toBeTruthy();
      expect(post.bestTime).toBeTruthy();
    }
  });
});

describe('CRO checklist', () => {
  it('every item names a page, an action, and an experiment', () => {
    expect(CRO_CHECKLIST.length).toBeGreaterThanOrEqual(8);
    for (const item of CRO_CHECKLIST) {
      expect(item.page).toBeTruthy();
      expect(item.action.length).toBeGreaterThan(20);
      expect(item.experiment).toBeTruthy();
    }
  });
});

describe('marketing library export and panel', () => {
  it('exports every library section with an explicit draft and review warning', () => {
    const markdown = buildMarketingKitLibraryMarkdown();

    expect(markdown).toContain('Draft/reference material only');
    expect(markdown).toContain(`## Campaign kits (${DEFAULT_MARKETING_KITS.length})`);
    expect(markdown).toContain(`## Email sequences (${EMAIL_SEQUENCES.length})`);
    expect(markdown).toContain(`## Lead magnets (${LEAD_MAGNETS.length})`);
    expect(markdown).toContain(`## SMS & WhatsApp templates (${SMS_TEMPLATES.length})`);
    expect(markdown).toContain(`## Social calendar (${SOCIAL_CALENDAR.length} posts)`);
    expect(markdown).toContain(`## CRO checklist (${CRO_CHECKLIST.length} items)`);
    expect(markdown).toContain('## Human review checklist');

    for (const kit of DEFAULT_MARKETING_KITS) expect(markdown).toContain(kit.name);
    for (const sequence of EMAIL_SEQUENCES) expect(markdown).toContain(sequence.name);
    for (const template of SMS_TEMPLATES) expect(markdown).toContain(template.compliance);
    for (const item of MARKETING_KIT_REVIEW_CHECKLIST) expect(markdown).toContain(item.label);
  });

  it('keeps review checklist identifiers unique and describes the human approval boundary', () => {
    const ids = MARKETING_KIT_REVIEW_CHECKLIST.map((item) => item.id);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of MARKETING_KIT_REVIEW_CHECKLIST) {
      expect(item.label).toBeTruthy();
      expect(item.detail).toBeTruthy();
    }
    expect(MARKETING_KIT_REVIEW_CHECKLIST.map((item) => `${item.label} ${item.detail}`).join(' ')).toMatch(/approv/i);
  });

  it('renders accurate counts, accessible roving tabs, a linked tab panel, and draft status', () => {
    const html = renderToStaticMarkup(createElement(MarketingKitPanel));

    expect(html).toContain(`${DEFAULT_MARKETING_KITS.length} campaign kits · ${EMAIL_SEQUENCES.length} sequences · ${LEAD_MAGNETS.length} magnets`);
    expect(html).not.toContain('6 kits');
    expect(html).toContain('role="tablist" aria-label="Marketing library categories"');
    expect((html.match(/aria-selected="true"/g) || []).length).toBe(1);
    expect((html.match(/aria-selected="false"/g) || []).length).toBe(5);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('Draft material — verify facts and get human approval before live use.');
    expect(html).toContain('Human review checklist');
    expect(html).toContain('does not create an approval record or schedule, send, or publish this campaign.');
  });

  it('gives each panel instance unique tab-panel ids and computes campaign counts from props', () => {
    const twoPanels = renderToStaticMarkup(
      createElement('div', null,
        createElement(MarketingKitPanel, { kits: DEFAULT_MARKETING_KITS.slice(0, 2) }),
        createElement(MarketingKitPanel, { kits: DEFAULT_MARKETING_KITS.slice(0, 3) }),
      ),
    );
    const panelIds = Array.from(twoPanels.matchAll(/id="([^"]+-tabpanel)"/g), (match) => match[1]);

    expect(panelIds).toHaveLength(2);
    expect(new Set(panelIds).size).toBe(2);
    expect(twoPanels).toContain('2 campaign kits');
    expect(twoPanels).toContain('3 campaign kits');
  });
});
