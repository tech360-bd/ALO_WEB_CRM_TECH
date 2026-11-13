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
  it('uses the master brand palette (Master §03)', () => {
    for (const token of [
      // Brand Blue family
      '--alo-brand: #0057B8', '--alo-brand-hover: #003F87',
      '--alo-brand-deep: #003F87',
      '--alo-brand-light: #EAF3FF', '--alo-brand-pale: #F4F8FF',
      // CTA Orange family. The *solid* fill is the approved Deep Orange so a
      // white label clears 4.5:1 (see the contrast test below).
      '--alo-cta: #C93D13', '--alo-cta-vivid: #E8501A',
      '--alo-cta-solid: #C93D13', '--alo-cta-solid-hover: #9E300B',
      '--alo-cta-soft: #FFF1EA',
      // Text hierarchy
      '--alo-text: #0F172A', '--alo-body: #334155',
      '--alo-text-secondary: #475569', '--alo-text-muted: #64748B',
      // Surfaces & semantics
      '--alo-border: #E2E8F0', '--alo-border-strong: #CBD5E1',
      '--alo-success: #10B981', '--alo-warning: #F59E0B', '--alo-error: #EF4444',
      '--alo-info: #0284C7',
    ]) expect(css).toContain(token);
  });

  it('retires the superseded palette hexes (no #0066CC / #F37021 / #FFB347)', () => {
    for (const hex of ['#0066CC', '#F37021', '#FFB347']) expect(css).not.toContain(hex);
  });

  it('keeps white CTA labels on an accessible orange (Master §07)', () => {
    // #E8501A + white is 3.75:1 — under the 4.5:1 floor for a 15–16px label.
    // The vivid orange must therefore never be a label background.
    expect(button).toContain('bg-alo-cta-solid text-white');
    expect(button).not.toContain('bg-alo-cta text-white');
    expect(button).not.toContain('bg-alo-cta text-black');
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
    // Slice on the function boundary rather than a prose comment so the
    // assertion keeps working when the hero's explanatory comments change.
    const heroBlock = hero.slice(hero.indexOf('function HeroSection'), hero.indexOf('/* Quick reference for missing icon'));
    expect(heroBlock.length).toBeGreaterThan(0);
    expect(heroBlock).not.toContain('from-black');
    expect(heroBlock).not.toContain('/95 via');
    expect(heroBlock).toContain('bg-white');
    // The accent is now expressed through the shared token rather than raw
    // hex, so the hero follows the theme layer (and any future palette swap).
    expect(heroBlock).toContain('var(--alo-brand)');
    expect(heroBlock).not.toMatch(/text-\[#0066CC\]/);
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

  it('public copy never leaks build instructions or database vocabulary', async () => {
    // Regression guard for the redesign pass: several public components were
    // rendering their own implementation notes ("Count from database — not
    // hardcoded", "Dynamic from DB", "ESTIMATE ONLY — Never present…",
    // "White card • Blue accent • Route: /language-prep").
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const patterns = [
      /\bcount from database\b/i,
      /\bnot hardcoded\b/i,
      /\bdynamic from db\b/i,
      /route:\s*\/[a-z-]+/i,
      /white card •/i,
    ];
    const offenders: string[] = [];
    for (const dir of ['src/app', 'src/components']) {
      const walk = (root: string) => {
        for (const name of readdirSync(root)) {
          const p = join(root, name);
          if (statSync(p).isDirectory()) { walk(p); continue; }
          if (!p.endsWith('.tsx')) continue;
          const text = readFileSync(p, 'utf8');
          if (patterns.some((re) => re.test(text))) offenders.push(p);
        }
      };
      walk(join(process.cwd(), dir));
    }
    expect(offenders).toEqual([]);
  });

  it('no hotlinked stock photography anywhere in src (local approved assets only)', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.tsx?$/.test(p)) continue;
        if (readFileSync(p, 'utf8').includes('images.unsplash.com')) offenders.push(p);
      }
    };
    walk(join(process.cwd(), 'src'));
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

/**
 * Redesign guardrails (2026-10-24).
 *
 * These lock in the invariants the visual pass established so a future edit
 * cannot silently regress them. They scan source text only — no rendering.
 */
describe('redesign guardrails', () => {
  const scan = (pattern: RegExp, roots = ['src']) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync, readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('node:path') as typeof import('node:path');
    const hits: { file: string; match: string }[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.tsx?$/.test(p)) continue;
        const text = readFileSync(p, 'utf8');
        const m = text.match(pattern);
        if (m) hits.push({ file: p.replace(process.cwd() + '/', ''), match: m[0] });
      }
    };
    for (const root of roots) walk(join(process.cwd(), root));
    return hits;
  };

  it('never renders type below the 11px metadata floor (Master §04)', () => {
    expect(scan(/\btext-\[(?:[0-9]|10)px\]/)).toEqual([]);
  });

  it('keeps the neutral scale on design tokens, not Tailwind greys (Master §03)', () => {
    expect(scan(/\btext-(?:gray|slate)-(?:400|500)\b/)).toEqual([]);
  });

  it('expresses the brand palette through tokens, not raw hex classes (Master §03)', () => {
    // Social brand colours and pure white are legitimately literal.
    const allowed = ['bg-[#FFFFFF]', 'bg-[#1877F2]', 'text-[#1877F2]'];
    const hits = scan(/\b(?:bg|text|border)-\[#0057B8\]|\b(?:bg|text|border)-\[#E8501A\]|\b(?:bg|text|border)-\[#FFB347\]/);
    expect(hits.filter((h) => !allowed.some((a) => h.match.startsWith(a)))).toEqual([]);
  });

  it('has no opaque near-black page or card panels outside the documented exceptions', async () => {
    // `dark:` variants and translucent scrims (bg-slate-900/60) are legitimate;
    // any other opaque slate-900/950 surface is a black block and must not exist.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync, readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('node:path') as typeof import('node:path');
    const allowedFiles = [
      'src/components/student/StudentSopCvStudio.tsx',            // "Modern" CV template preview swatch
      'src/components/website/YouTubeEmbed.tsx',                  // video letterbox behind the poster
      'src/components/crm/pages/CrmSocialPage.tsx',               // TikTok brand tile colour
      'src/components/marketing/hub/SocialMediaAutomationView.tsx',// TikTok brand tile colour
      'src/components/social/SocialMediaManagementHub.tsx',        // TikTok brand tile colour
    ];
    const offenders: { file: string; token: string }[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.tsx$/.test(p)) continue;
        const rel = p.replace(process.cwd() + '/', '');
        if (allowedFiles.includes(rel)) continue;
        const text = readFileSync(p, 'utf8');
        const re = /(dark:)?bg-(?:slate|gray|neutral)-(?:900|950)(\/\d+)?/g;
        let m;
        while ((m = re.exec(text))) {
          if (m[1] || m[2]) continue; // dark-mode variant or translucent scrim
          offenders.push({ file: rel, token: m[0] });
        }
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(offenders).toEqual([]);
  });

  it('gives every shared control a 48px touch target (Master §07)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('node:path') as typeof import('node:path');
    const button = readFileSync(join(process.cwd(), 'src/components/ui/button.tsx'), 'utf8');
    const input = readFileSync(join(process.cwd(), 'src/components/ui/input.tsx'), 'utf8');
    const tabs = readFileSync(join(process.cwd(), 'src/components/ui/tabs.tsx'), 'utf8');
    expect(button).not.toMatch(/(?:xs|sm|default|lg):\s*"h-(?:8|9|10|11)\b/);
    expect(input).toContain('h-12');
    expect(tabs).toContain('h-12');
  });

  it('defines the motion utilities the app relies on (no silent no-ops)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('node:path') as typeof import('node:path');
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
    for (const cls of [
      '.animate-in', '.animate-out', '.fade-in-0', '.zoom-in-95',
      '.slide-in-from-bottom-2', '.animate-accordion-down', '.animate-caret-blink',
      '.prose', '.alo-cap-track', '.no-scrollbar', '.bg-alo-hero',
    ]) {
      expect(css).toContain(cls);
    }
  });
});
