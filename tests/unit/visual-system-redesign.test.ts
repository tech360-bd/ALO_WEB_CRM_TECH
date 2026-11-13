import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Round-2 visual redesign regression contract (2026-11-03).
 *
 * The master design system is carried by shared tokens + shared primitives,
 * so these source-level assertions protect every public page, CRM screen and
 * portal at once. They guard the *actual project*, not a proposal document.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const css = read('src/app/globals.css');

function tsxFiles(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.tsx?$/.test(p)) continue;
      out.push({ path: p.replace(process.cwd() + '/', ''), text: readFileSync(p, 'utf8') });
    }
  };
  walk(join(process.cwd(), 'src'));
  return out;
}

describe('master design-system layer (§17)', () => {
  it('publishes the canonical alias tokens', () => {
    for (const token of [
      '--alo-blue-hover: var(--alo-brand-hover)',
      '--alo-blue-pale: var(--alo-brand-pale)',
      '--alo-orange-hover: var(--alo-cta-solid-hover)',
      '--alo-white: #FFFFFF',
      '--alo-background: var(--background)',
      '--alo-radius-card: 16px',
      '--alo-radius-feature: 20px',
      '--alo-shadow-card: var(--shadow-card)',
      '--alo-shadow-hover: var(--shadow-hover)',
      '--alo-transition: 180ms ease-out',
      '--alo-content-max: 1280px',
    ]) expect(css, token).toContain(token);
  });

  it('defines the reusable typography, surface, status and state utilities', () => {
    for (const cls of [
      '.alo-ds-container', '.alo-ds-section', '.alo-ds-eyebrow',
      '.alo-ds-h1', '.alo-ds-page-h1', '.alo-ds-h2', '.alo-ds-h3', '.alo-ds-h4',
      '.alo-ds-body-lg', '.alo-ds-body', '.alo-ds-support', '.alo-ds-meta', '.alo-ds-label',
      '.alo-ds-card', '.alo-ds-card-feature', '.alo-ds-card-crm', '.alo-ds-panel', '.alo-ds-table-wrap',
      '.alo-ds-interactive', '.alo-ds-focus',
      '.alo-ds-status-success', '.alo-ds-status-warning', '.alo-ds-status-danger',
      '.alo-ds-status-info', '.alo-ds-status-neutral',
      '.alo-ds-feedback-success', '.alo-ds-feedback-danger',
      '.alo-ds-state', '.alo-ds-spinner', '.alo-ds-reveal', '.alo-ds-stagger',
    ]) expect(css, cls).toContain(cls);
    expect(css).toContain(':lang(bn) .alo-ds-eyebrow');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});

describe('one styling system — no second dark theme (§02, §12, §17)', () => {
  it('rebinds the Enterprise Command Center to the light master palette', () => {
    expect(css).toContain('--cc-bg: var(--alo-page)');
    expect(css).toContain('--cc-card: var(--card)');
    expect(css).toContain('--cc-text: var(--alo-text)');
    expect(css).toContain('--cc-blue: var(--alo-brand)');
    expect(css).not.toContain('--cc-bg: #0a0e17');
    expect(css).not.toContain('--cc-card: #1a2036');
    expect(css).not.toContain('.cc-gradient-text {\n  background: linear-gradient');
  });

  it('uses the exact semantic badge tints for DCC / health states (§13)', () => {
    expect(css).toContain('.cc-badge-operational { background: var(--crm-success-bg)');
    expect(css).toContain('.cc-badge-offline { background: var(--crm-danger-bg)');
  });

  it('has no dark scrim, black block or off-palette gradient anywhere in src', () => {
    const offenders: string[] = [];
    for (const { path, text } of tsxFiles()) {
      if (/bg-black\/|from-black|to-black/.test(text)) offenders.push(`${path}: dark scrim`);
      if (/(?<!dark:)\bbg-(?:slate|gray|neutral|zinc)-(?:900|950)\b/.test(text)) {
        offenders.push(`${path}: near-black block`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('shared primitives carry one visual language (§06, §07, §12, §14)', () => {
  const input = read('src/components/ui/input.tsx');
  const textarea = read('src/components/ui/textarea.tsx');
  const selectTrigger = read('src/components/ui/select.tsx');
  const label = read('src/components/ui/label.tsx');
  const form = read('src/components/ui/form.tsx');
  const table = read('src/components/ui/table.tsx');
  const alert = read('src/components/ui/alert.tsx');
  const drawer = read('src/components/ui/drawer.tsx');
  const sheet = read('src/components/ui/sheet.tsx');

  it('gives textarea and select the same field treatment as input', () => {
    for (const text of [input, textarea, selectTrigger]) {
      expect(text).toContain('rounded-input');
      expect(text).toContain('border border-input');
      expect(text).toContain('bg-white');
      expect(text).toContain('focus-visible:border-alo-brand');
      expect(text).toContain('aria-invalid:border-crm-danger');
    }
    expect(input).toContain('placeholder:text-alo-placeholder');
    expect(textarea).toContain('placeholder:text-alo-placeholder');
    // Radix Select exposes the placeholder through a data attribute.
    expect(selectTrigger).toContain('data-[placeholder]:text-alo-placeholder');
    expect(textarea).not.toContain('bg-transparent');
    expect(selectTrigger).not.toContain('bg-transparent');
  });

  it('uses readable labels and accessible inline validation', () => {
    expect(label).toContain('font-semibold text-alo-body');
    expect(form).toContain('data-[error=true]:text-crm-danger-text');
    expect(form).toContain('text-crm-danger-text text-sm font-medium');
    expect(form).toContain('role="alert"');
    expect(form).toContain('text-alo-text-muted text-sm');
    expect(form).not.toContain('"text-destructive text-sm"');
  });

  it('styles tables as a bordered CRM surface with a readable text hierarchy', () => {
    expect(table).toContain('alo-ds-table-wrap');
    expect(table).toContain('text-alo-text-muted');
    expect(table).toContain('text-alo-body');
    expect(table).toContain('hover:bg-alo-brand-pale');
    expect(table).not.toContain('uppercase tracking-wider');
  });

  it('offers every semantic feedback variant on the shared Alert', () => {
    for (const v of ['success', 'warning', 'info', 'neutral', 'destructive']) {
      expect(alert).toContain(`${v}:`);
    }
    expect(alert).toContain('rounded-[14px]');
    expect(alert).toContain('bg-crm-success-bg');
    expect(alert).toContain('bg-crm-warning-bg');
  });

  it('keeps all overlays light and all floating surfaces at modal elevation', () => {
    expect(drawer).toContain('bg-white/70 backdrop-blur-[2px]');
    expect(drawer).toContain('bg-card border-border text-alo-text shadow-modal');
    expect(drawer).toContain('rounded-t-[20px]');
    expect(drawer).not.toContain('bg-black/50');
    expect(sheet).toContain('shadow-modal');
    expect(sheet).toContain('bg-white/70 backdrop-blur-[2px]');
  });
});

describe('shared loading / empty / error states (§14, §19)', () => {
  const panel = read('src/components/ui/state-panel.tsx');

  it('renders every state with an icon, text and semantic role', () => {
    for (const tone of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
      expect(panel).toContain(`${tone}: {`);
    }
    expect(panel).toContain('alo-ds-state');
    expect(panel).toContain('alo-ds-feedback');
    expect(panel).toContain('role={tone === "danger" ? "alert" : "status"}');
    expect(panel).toContain('aria-live="polite"');
  });

  it('is adopted by the three global state pages', () => {
    expect(read('src/app/error.tsx')).toContain('StatePanel');
    expect(read('src/app/loading.tsx')).toContain('LoadingState');
    expect(read('src/app/not-found.tsx')).toContain('StatePanel');
    expect(read('src/app/error.tsx')).not.toContain('text-2xl font-bold');
  });
});

describe('palette + icon hygiene (§03, §10)', () => {
  it('has no leftover Tailwind neutral greys or legacy brand hexes', () => {
    const offenders: string[] = [];
    for (const { path, text } of tsxFiles()) {
      if (/\btext-(?:slate|gray|zinc|neutral)-\d{3}\b/.test(text)) offenders.push(`${path}: grey text`);
      if (/#(?:0066CC|F37021|FFB347)/i.test(text)) offenders.push(`${path}: legacy hex`);
      if (/\btext-\[(?:[0-9]|10)(?:\.\d+)?px\]/.test(text)) offenders.push(`${path}: sub-11px text`);
    }
    expect(offenders).toEqual([]);
  });

  it('keeps only the two documented literal colours in arbitrary hex classes', () => {
    const allowed = new Set(['bg-[#FFFFFF]', 'bg-[#1877F2]']);
    const offenders: string[] = [];
    for (const { path, text } of tsxFiles()) {
      for (const m of text.matchAll(/\b(?:bg|text|border|from|to|via|ring|shadow)-\[#[0-9A-Fa-f]{3,8}\]/g)) {
        if (!allowed.has(m[0])) offenders.push(`${path}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('uses Lucide names, not emoji, for CRM catalogue and blueprint icons', () => {
    const pictograph = /[\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
    for (const p of [
      'src/components/admin/super-admin-command-center/catalog.ts',
      'src/components/admin/super-admin-command-center/ai-eos/data.ts',
      'src/components/admin/super-admin-command-center/ai-eos/AiEosMasterBlueprint.tsx',
      'src/components/admin/super-admin-command-center/SuperAdminCommandCenter.tsx',
      'src/components/admin/SuperAdminMasterCommandCenter.tsx',
      'src/components/admin/ManagedContentManager.tsx',
      'src/components/admin/SuperAdminWebsiteCmsHub.tsx',
    ]) expect(read(p), p).not.toMatch(pictograph);
  });

  it('does not render a fabricated notification count in the CRM top bar', () => {
    const bar = read('src/components/admin/super-admin-command-center/SuperAdminCommandCenter.tsx');
    expect(bar).toContain('name="Bell"');
    expect(bar).not.toContain('rounded-full flex items-center justify-center">3<');
  });
});
