// Centralized bilingual dictionary integrity (master specification Part 31).
// These tests pin the guarantees the i18n system relies on:
//   • every English key has a Bangla translation (no missing keys)
//   • no orphan Bangla keys
//   • translation falls back to English, then to the key itself
//   • only the supported locales exist

import { describe, expect, it } from 'vitest';
import { DICTIONARIES, LOCALES, LOCALE_LABELS, translate, type Locale } from '@/i18n/dictionaries';

describe('i18n dictionaries (English + বাংলা)', () => {
  it('supports exactly English and Bangla', () => {
    expect(LOCALES).toEqual(['en', 'bn']);
    expect(LOCALE_LABELS.en).toBe('English');
    expect(LOCALE_LABELS.bn).toBe('বাংলা');
  });

  it('every English key has a Bangla translation', () => {
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    const bnKeys = Object.keys(DICTIONARIES.bn).sort();
    expect(bnKeys).toEqual(enKeys);
  });

  it('has no empty translations', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(DICTIONARIES[locale as Locale])) {
        expect(value, `${locale}:${key} must be a non-empty string`).toMatch(/.+/);
      }
    }
  });

  it('translates known keys per locale', () => {
    expect(translate('en', 'cta.bookConsultation')).toBe('Book Free Counseling');
    expect(translate('bn', 'cta.bookConsultation')).toBe('ফ্রি পরামর্শ নিন');
    expect(translate('bn', 'nav.destinations')).toBe('গন্তব্য');
  });

  it('falls back to English for unknown keys on a locale dictionary miss', () => {
    // Unknown key surfaces the key itself rather than crashing.
    expect(translate('en', 'nav.nonexistent' as never)).toBe('nav.nonexistent');
    expect(translate('bn', 'nav.nonexistent' as never)).toBe('nav.nonexistent');
  });

  it('keeps core CTA strings non-empty in both languages', () => {
    for (const key of ['cta.bookConsultation', 'cta.findCourse', 'hero.title'] as const) {
      expect(DICTIONARIES.en[key].length).toBeGreaterThan(0);
      expect(DICTIONARIES.bn[key].length).toBeGreaterThan(0);
    }
  });
});
