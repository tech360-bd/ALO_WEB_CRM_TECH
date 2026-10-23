'use client';

// EN | বাংলা language toggle for the public site. Uses the centralized i18n
// system (src/i18n) — no per-language page duplication.
//
// `onDark` renders the control for the brand-blue utility strip of the public
// header; the default (light) variant is used inside the white surfaces.

import { Languages } from 'lucide-react';
import { useI18n } from '@/i18n';
import { LOCALES, LOCALE_LABELS } from '@/i18n/dictionaries';

export default function LanguageToggle({
  compact = false,
  onDark = false,
}: {
  compact?: boolean;
  onDark?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('language.switchLabel')}
      className={
        onDark
          ? 'inline-flex items-center rounded-full border border-white/30 bg-white/10 p-0.5'
          : 'inline-flex items-center rounded-full border border-alo-border bg-white p-0.5 shadow-sm'
      }
    >
      {!compact && (
        <Languages
          className={`ml-1.5 h-3.5 w-3.5 ${onDark ? 'text-white/70' : 'text-[var(--alo-text-muted)]'}`}
          aria-hidden
        />
      )}
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={
            locale === l
              ? onDark
                ? 'rounded-full bg-white px-3 py-1 text-[11px] font-bold text-alo-brand'
                : 'rounded-full bg-alo-brand px-3 py-1 text-[11px] font-bold text-white'
              : onDark
                ? 'rounded-full px-3 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:text-white'
                : 'rounded-full px-3 py-1 text-[11px] font-semibold text-[var(--alo-body)] transition-colors hover:text-alo-brand'
          }
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
