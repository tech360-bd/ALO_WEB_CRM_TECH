import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const button = readFileSync(join(process.cwd(), 'src/components/ui/button.tsx'), 'utf8');
const hero = readFileSync(join(process.cwd(), 'src/components/website/HomepagePart1.tsx'), 'utf8');

/**
 * Master redesign contract (sections 03/06/07/08/13/15): the shared tokens
 * and primitives carry the design system to every page, so these assertions
 * guard the whole site + CRM, not just one screen.
 */
describe('ALO master design tokens', () => {
  it('uses the exact master brand palette', () => {
    for (const token of [
      '--alo-brand: #0057B8', '--alo-brand-hover: #003F87',
      '--alo-brand-light: #EAF3FF', '--alo-brand-pale: #F4F8FF',
      '--alo-cta: #E8501A', '--alo-cta-hover: #C93D13', '--alo-cta-soft: #FFF1EA',
      '--alo-text: #0F172A', '--alo-body: #334155', '--alo-text-muted: #64748B',
      '--alo-border: #E2E8F0', '--alo-border-strong: #CBD5E1',
      '--alo-success: #10B981', '--alo-warning: #F59E0B', '--alo-error: #EF4444',
      '--alo-info: #0284C7',
    ]) expect(css).toContain(token);
  });

  it('uses the Master section 13 semantic badge tints', () => {
    for (const token of [
      '--crm-success-bg: #ECFDF5', '--crm-success-text: #047857', '--crm-success-border: #A7F3D0',
      '--crm-warning-bg: #FFFBEB', '--crm-warning-text: #92400E', '--crm-warning-border: #FDE68A',
      '--crm-danger-bg: #FEF2F2', '--crm-danger-text: #B91C1C', '--crm-danger-border: #FECACA',
      '--crm-neutral-bg: #F1F5F9', '--crm-neutral-text: #475569',
      '--alo-info-bg: #EFF6FF', '--alo-info-text: #1D4ED8', '--alo-info-border: #BFDBFE',
    ]) expect(css).toContain(token);
  });

  it('carries the master shadow and radius scale', () => {
    expect(css).toContain('--shadow-card: 0 2px 8px rgba(15, 23, 42, 0.04)');
    expect(css).toContain('--shadow-hover: 0 10px 28px rgba(15, 23, 42, 0.08)');
    expect(css).toContain('--shadow-floating: 0 12px 32px rgba(15, 23, 42, 0.12)');
    expect(css).toContain('--shadow-modal: 0 24px 64px rgba(15, 23, 42, 0.16)');
    expect(css).toContain('--radius-input: 10px');
    expect(css).toContain('--radius-card: 16px');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('keeps every shared Button size at the 48px minimum (Master section 07)', () => {
    expect(button).not.toMatch(/xs: "h-(8|9|10|11)\b/);
    expect(button).not.toMatch(/sm: "h-(8|9|10|11)\b/);
    expect(button).not.toMatch(/default: "h-(8|9|10|11)\b/);
    expect(button).toContain('icon: "size-12"');
  });

  it('homepage hero is an editorial split with no dark photo overlay (Master section 08)', () => {
    const heroBlock = hero.slice(hero.indexOf('Country-specific hero'), hero.indexOf('Quick reference for missing icon'));
    expect(heroBlock).not.toContain('from-black');
    expect(heroBlock).not.toContain('/95 via');
    expect(heroBlock).toContain('bg-white');
    expect(heroBlock).toContain('text-[#0057B8]');
  });
});

describe('image asset integrity (redesign §6)', () => {
  it('every photographic destination card image exists locally', async () => {
    const { DESTINATION_CARD_IMAGES } = await import('@/components/website/ImageMapping');
    const { existsSync } = await import('node:fs');
    for (const src of new Set(Object.values(DESTINATION_CARD_IMAGES))) {
      expect(existsSync(join(process.cwd(), 'public', src)), src).toBe(true);
    }
  });

  it('legacy purple/violet/indigo utilities resolve to the master info-blue family', () => {
    expect(css).toContain('--color-purple-600: #0057B8');
    expect(css).toContain('--color-violet-500: #0284C7');
    expect(css).toContain('--color-indigo-600: #0057B8');
  });
});

describe('rendered-copy hygiene (feedback round)', () => {
  it('routed pages contain no dev-speak or leaked spec text', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { if (!p.includes('alo/views')) walk(p); continue; }
        if (!p.endsWith('.tsx')) continue;
        const text = readFileSync(p, 'utf8');
        if (/Real DB|Real API|No Fake|DO NOT GUESS|per spec section/.test(text)) offenders.push(p);
      }
    };
    walk(join(process.cwd(), 'src/app'));
    walk(join(process.cwd(), 'src/components'));
    expect(offenders).toEqual([]);
  });

  it('country pages use only local approved imagery (no hotlinked stock)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const text = readFileSync(join(process.cwd(), 'src/components/website/PremiumCountryPage.tsx'), 'utf8');
    expect(text).not.toContain('images.unsplash.com');
    expect(text).toContain('destinationCardImage');
  });
});
