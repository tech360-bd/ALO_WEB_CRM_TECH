import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getLanguagePrepMetadata } from '@/lib/language-prep/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return getLanguagePrepMetadata('gre');
}

export default function Page() {
  return <LanguageTestPage slug="gre" />;
}
