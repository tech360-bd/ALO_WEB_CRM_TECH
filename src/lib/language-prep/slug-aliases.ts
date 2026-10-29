/**
 * Language-prep slug aliases.
 *
 * Several pages across the site link to a test using a shorthand or an older
 * name (`/language-prep/toefl`, `/language-prep/oietc-ellt`, `/language-prep/cae`).
 * The canonical catalogue slugs are the keys of `REQUIRED_TEST_SLUGS` plus
 * `oxford-ellt` and `moi`. Mapping the aliases at the data layer keeps every
 * existing inbound link working without adding redirect routes or changing any
 * URL the site already publishes.
 */
export const LANGUAGE_PREP_SLUG_ALIASES: Record<string, string> = {
  'ielts-academic': 'ielts',
  'ielts-general': 'ielts',
  ukvi: 'ielts-ukvi',
  'ielts-for-ukvi': 'ielts-ukvi',
  selt: 'ielts-ukvi',
  pte: 'pte-academic',
  pearson: 'pte-academic',
  toefl: 'toefl-ibt',
  'toefl-ibt-home': 'toefl-ibt',
  det: 'duolingo',
  'duolingo-english-test': 'duolingo',
  'oietc-ellt': 'oietc',
  ellt: 'oietc',
  'oxford-ellt': 'oxford-ellt',
  oietc: 'oietc',
  languagecert: 'languagecert',
  kaplan: 'kaplan',
  'kaplan-english-test': 'kaplan',
  kite: 'kaplan',
  cambridge: 'cambridge-english',
  'cae-cpe': 'cambridge-english',
  'c1-advanced': 'cambridge-english',
  'c2-proficiency': 'cambridge-english',
  cae: 'cambridge-english',
  cpe: 'cambridge-english',
  'cambridge-english': 'cambridge-english',
  oet: 'oet',
  password: 'password',
  'password-skills': 'password',
  'password-skills-plus': 'password',
  'password-english-test': 'password',
  'password-english-language-test': 'password',
  gre: 'gre',
  gmat: 'gmat',
  sat: 'sat',
  act: 'act',
  'moi-guidance': 'moi',
  moi: 'moi',
  'medium-of-instruction': 'moi',
};

/** Resolve a requested slug to its canonical catalogue slug. */
export function normalizeLanguagePrepSlug(slug: string): string {
  const clean = String(slug ?? '').toLowerCase().trim();
  return LANGUAGE_PREP_SLUG_ALIASES[clean] || clean;
}
