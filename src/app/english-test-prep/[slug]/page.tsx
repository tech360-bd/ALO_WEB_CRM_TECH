import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'English Test Preparation | ALO Education',
    description: 'Language-test requirements vary by provider, course and immigration route. Check current information with official sources.',
    alternates: { canonical: 'https://aloeducation.com/language-prep' },
  };
}

/** Preserve the legacy path while sending users to the current reviewed catalogue. */
export default async function LegacyTestPrepDetailPage({ params }: Props): Promise<never> {
  const { slug } = await params;
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  redirect(safeSlug ? `/language-prep/${safeSlug}` : '/language-prep');
}
