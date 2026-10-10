'use client';

// EN | বাংলা language toggle for the public site. Uses the centralized i18n
// system (src/i18n) — no per-language page duplication.

import { Languages } from 'lucide-react';
import { useI18n } from '@/i18n';
import { LOCALES, LOCALE_LABELS } from '@/i18n/dictionaries';

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('language.switchLabel')}
      className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white p-0.5 shadow-sm"
    >
      {!compact && <Languages className="ml-1.5 h-3.5 w-3.5 text-slate-400" aria-hidden />}
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={
            locale === l
              ? 'rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-bold text-white'
              : 'rounded-full px-3 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#2563EB]'
          }
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
