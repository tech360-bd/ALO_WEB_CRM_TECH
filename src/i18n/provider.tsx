'use client';

// ─── I18n provider (English + বাংলা) ─────────────────────────────────────────
// Centralized, client-side locale context with persistence. No per-language
// routes, no duplicated business logic (master specification Part 31).
// Components consume `const { t, locale, setLocale } = useI18n()`.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DICTIONARIES,
  LOCALE_HTML_LANGS,
  translate,
  type Locale,
  type TranslationKey,
} from './dictionaries';

const STORAGE_KEY = 'alo-locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'bn') return stored;
  } catch {
    // localStorage unavailable (private mode etc.) — default below.
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Hydrate the persisted preference after mount (avoids SSR mismatch).
  useEffect(() => {
    setLocaleState(readInitialLocale());
  }, []);

  // Keep <html lang> in sync for accessibility and SEO.
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANGS[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the in-memory locale still applies.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey) => translate(locale, key),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider (tests,
    // storybook-style isolation) without crashing.
    return {
      locale: 'en',
      setLocale: () => undefined,
      t: (key: TranslationKey) => translate('en', key),
    };
  }
  return ctx;
}

export { DICTIONARIES };
export type { Locale, TranslationKey };
