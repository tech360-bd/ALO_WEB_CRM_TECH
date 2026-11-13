import Image from 'next/image';
import Link from 'next/link';
import type { EnglishTest } from '@/lib/language-prep/types';
import { REQUIRED_TEST_SLUGS } from '@/lib/language-prep/editorial';
import { Button } from '@/components/ui/button';

/**
 * Language-prep section photography.
 *
 * Every entry carries a literal, factual alt description of what the picture
 * actually shows — nothing here implies a named ALO student, a result, or a
 * visa outcome. The people pictured are models, not ALO success stories.
 */
export const LANGUAGE_PREP_PHOTOS = [
  { src: '/images/language-prep/computer-based-test.webp', alt: 'Students taking a computer-based English test at individual workstations in a bright test centre' },
  { src: '/images/language-prep/counsellor-score-review.webp', alt: 'An education counsellor and a student reviewing a practice test score report together' },
  { src: '/images/language-prep/study-group-prep.webp', alt: 'Students preparing for an English exam around a table with books, laptops and practice papers' },
  { src: '/images/language-prep/speaking-practice.webp', alt: 'Two students practising a spoken English interview while a counsellor observes' },
  { src: '/images/landing/Copy of pexels-yankrukov-8199166.webp', alt: 'Students participating in a classroom discussion' },
  { src: '/images/landing/Copy of brooke-cagle-g1Kr4Ozfoac-unsplash.webp', alt: 'A study group sharing ideas around laptops' },
  { src: '/images/landing/Copy of pexels-rdne-7683897.webp', alt: 'Students talking together outside an academic building' },
] as const;

/**
 * Section media band. `compact` is used on the shorter supporting sections so
 * the illustration never outweighs the copy it sits above.
 */
export function LanguageSectionVisual({ index = 0, priority = false, compact = false }: { index?: number; priority?: boolean; compact?: boolean }) {
  const photo = LANGUAGE_PREP_PHOTOS[index % LANGUAGE_PREP_PHOTOS.length];
  return <figure className={`relative mb-7 overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] ${compact ? 'h-28 sm:h-36' : 'h-40 sm:h-48'}`}>
    <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover object-center" priority={priority} />
  </figure>;
}

/**
 * Test card — one shared design for every language and academic test
 * (Master §13): white surface, ALO blue border, ALO orange title, ALO orange
 * primary action, blue-tint hover. The only thing that changes between cards is
 * the content.
 */
export function LanguageTestCard({ test, index }: { test: EnglishTest; index: number }) {
  const photo = LANGUAGE_PREP_PHOTOS[index % LANGUAGE_PREP_PHOTOS.length];
  return <article data-testid="language-test-card" className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--alo-brand)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--alo-brand)] hover:shadow-lg focus-within:border-[var(--alo-brand)]">
    <div className="relative h-36 overflow-hidden bg-[var(--alo-brand-pale)]">
      <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
    </div>
    <div className="flex flex-1 flex-col gap-4 p-5">
      <p className="text-xs font-semibold text-[var(--alo-brand)]">{test.testType === 'academic' ? 'Academic / Aptitude Test' : test.testType === 'moi_guidance' ? 'Language Waiver Guidance' : 'English Language Test'}</p>
      <h3 className="font-heading text-xl font-bold text-[var(--alo-cta)]">{test.name}</h3>
      <p className="text-sm leading-relaxed text-[var(--alo-body)]">{test.shortDescription}</p>
      <dl className="space-y-3 text-sm text-[var(--alo-body)]">
        {[['Duration', test.durationDisplay], ['Results', test.resultTimeline], ['Scoring', test.scoringSystem], ['Cost', test.costSummary]].map(([name, value]) => <div key={name}><dt className="font-semibold text-[var(--alo-text)]">{name}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
      </dl>
      <p className="text-sm leading-relaxed text-[var(--alo-body)]">{test.acceptanceSummary}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <Button asChild className="flex-1"><Link href={`/language-prep/${test.slug}`} aria-label={`Learn More about ${test.name}`}>Learn More</Link></Button>
        <Button asChild variant="outline"><Link href={`/language-prep/comparison?tests=${test.slug}`} aria-label={`Compare ${test.name}`}>Compare</Link></Button>
      </div>
      {(test.sourceUrl || test.officialUrl).startsWith('https://') && <a href={test.sourceUrl || test.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--alo-brand)] underline underline-offset-4">Official source · {test.lastVerifiedAt ? `reviewed ${test.lastVerifiedAt}` : 'view current guidance'}</a>}
    </div>
  </article>;
}

export function LanguageTestComparison({ tests }: { tests: EnglishTest[] }) {
  const main = tests.filter(test => REQUIRED_TEST_SLUGS.some(slug => slug === test.slug));
  return <div className="overflow-x-auto rounded-2xl border border-[var(--alo-brand)] bg-white" role="region" aria-label="All language and academic test comparison" tabIndex={0}>
    <table className="w-full min-w-[960px] text-left text-sm">
      <caption className="p-4 text-left text-[var(--alo-body)]">Compare duration, result delivery, scoring, cost and acceptance. Fees and entry rules must be confirmed before booking. Scroll horizontally on smaller screens.</caption>
      <thead className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]"><tr>{['Test', 'Duration', 'Results', 'Scoring', 'Cost', 'University & visa acceptance'].map(label => <th key={label} scope="col" className="p-4 font-bold">{label}</th>)}</tr></thead>
      <tbody>{main.map(test => <tr key={test.slug} className="border-t border-[var(--alo-border)] align-top hover:bg-[var(--alo-brand-pale)]">
        <th scope="row" className="p-4"><Link href={`/language-prep/${test.slug}`} className="font-bold text-[var(--alo-brand)] underline underline-offset-4">{test.name}</Link></th>
        {[test.durationDisplay, test.resultTimeline, test.scoringSystem, test.costSummary, test.acceptanceSummary].map((value, i) => <td key={i} className="min-w-36 p-4 leading-relaxed text-[var(--alo-body)]">{value}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
