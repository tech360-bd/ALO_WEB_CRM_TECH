// ─── Centralized bilingual dictionaries (English + বাংলা) ────────────────────
// Master specification Part 31: support English and Bangla WITHOUT duplicating
// business logic per language. All public-facing UI strings that are localized
// must come through these dictionaries (single source of translation truth).
//
// Rules:
//   • Keys are stable identifiers (`nav.destinations`, `cta.bookConsultation`).
//   • English is the fallback for any missing key.
//   • Never fork pages or components per language — components read `t(key)`.

export type Locale = 'en' | 'bn';

export const LOCALES: Locale[] = ['en', 'bn'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
};

export const LOCALE_HTML_LANGS: Record<Locale, string> = {
  en: 'en',
  bn: 'bn',
};

const en = {
  'common.loading': 'Loading…',
  'common.viewAll': 'View All',
  'common.learnMore': 'Learn More',
  'common.search': 'Search',
  'common.close': 'Close',
  'common.submit': 'Submit',
  'nav.destinations': 'Destinations',
  'nav.universities': 'Universities',
  'nav.courses': 'Courses',
  'nav.courseFinder': 'Course Finder',
  'nav.scholarships': 'Scholarships',
  'nav.services': 'Services',
  'nav.languagePrep': 'Language Prep',
  'nav.englishTest': 'English Test',
  'nav.visaSupport': 'Visa Support',
  'nav.resources': 'Resources',
  'nav.successStories': 'Success Stories',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.blog': 'Blog',
  'nav.more': 'More',
  'cta.bookConsultation': 'Book Free Consultation',
  'cta.findCourse': 'Find Your Course',
  'cta.checkEligibility': 'Check Eligibility',
  'cta.applyNow': 'Apply Now',
  'cta.viewCourse': 'View Course',
  'cta.compare': 'Compare',
  'cta.save': 'Save',
  'cta.login': 'Login',
  'cta.register': 'Register',
  'cta.getStarted': 'Get Started',
  'hero.title': 'Your Future Starts Here',
  'hero.subtitle': 'Honest, verified guidance for Bangladeshi students — from course match to visa decision.',
  'footer.rights': 'All rights reserved.',
  'language.switchLabel': 'Language',
} as const;

export type TranslationKey = keyof typeof en;

const bn: Record<TranslationKey, string> = {
  'common.loading': 'লোড হচ্ছে…',
  'common.viewAll': 'সব দেখুন',
  'common.learnMore': 'আরও জানুন',
  'common.search': 'খুঁজুন',
  'common.close': 'বন্ধ করুন',
  'common.submit': 'জমা দিন',
  'nav.destinations': 'গন্তব্য',
  'nav.universities': 'বিশ্ববিদ্যালয়',
  'nav.courses': 'কোর্স',
  'nav.courseFinder': 'কোর্স খুঁজুন',
  'nav.scholarships': 'স্কলারশিপ',
  'nav.services': 'সেবাসমূহ',
  'nav.languagePrep': 'ভাষা প্রস্তুতি',
  'nav.englishTest': 'ইংরেজি পরীক্ষা',
  'nav.visaSupport': 'ভিসা সহায়তা',
  'nav.resources': 'রিসোর্স',
  'nav.successStories': 'সাফল্যের গল্প',
  'nav.about': 'আমাদের সম্পর্কে',
  'nav.contact': 'যোগাযোগ',
  'nav.blog': 'ব্লগ',
  'nav.more': 'আরও',
  'cta.bookConsultation': 'ফ্রি পরামর্শ নিন',
  'cta.findCourse': 'আপনার কোর্স খুঁজুন',
  'cta.checkEligibility': 'যোগ্যতা যাচাই করুন',
  'cta.applyNow': 'আবেদন করুন',
  'cta.viewCourse': 'কোর্স দেখুন',
  'cta.compare': 'তুলনা করুন',
  'cta.save': 'সংরক্ষণ করুন',
  'cta.login': 'লগইন',
  'cta.register': 'রেজিস্ট্রেশন',
  'cta.getStarted': 'শুরু করুন',
  'hero.title': 'আপনার ভবিষ্যৎ শুরু হচ্ছে এখানে',
  'hero.subtitle': 'বাংলাদেশি শিক্ষার্থীদের জন্য সৎ, যাচাইকৃত পথনির্দেশনা — কোর্স নির্বাচন থেকে ভিসা অনুমোদন পর্যন্ত।',
  'footer.rights': 'সর্বস্বত্ব সংরক্ষিত।',
  'language.switchLabel': 'ভাষা',
};

export const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = {
  en,
  bn,
};

export function translate(locale: Locale, key: TranslationKey): string {
  return DICTIONARIES[locale]?.[key] ?? DICTIONARIES.en[key] ?? key;
}
