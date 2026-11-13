import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'English Language Preparation | ALO Education',
  description: 'Explore language-preparation guidance. Confirm current exam fees, formats, score requirements and visa evidence with official providers and receiving institutions.',
  alternates: { canonical: 'https://aloeducation.com/language-prep' },
};

/** Keep the legacy URL, but route visitors to the source-reviewed catalogue. */
export default function TestPrepDirectoryPage(): never {
  redirect('/language-prep');
}
