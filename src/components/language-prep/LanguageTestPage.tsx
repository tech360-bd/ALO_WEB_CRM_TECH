import { notFound } from 'next/navigation';
import { getEnglishPrepTestBySlugFromDB } from '@/lib/language-prep/service';
import TestDetailView from './TestDetailView';

/** Shared server entry for existing named routes as well as future test pages. */
export default async function LanguageTestPage({ slug }: { slug: string }) {
  const test = await getEnglishPrepTestBySlugFromDB(slug);
  if (!test) notFound();
  return <TestDetailView slug={test.slug} initialTest={test} />;
}
