import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicReviewSubmit } from '@/components/alo/views/public-review-submit';

// Public, token-gated review submission page. The raw token in the URL is
// hashed server-side by /api/reviews/submit/[token] before lookup, so no
// database lookups happen here and nothing sensitive is rendered on the server.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Share Your Experience | ALO Education',
  description: 'Submit your review of ALO Education services.',
  robots: { index: false, follow: false },
};

const TOKEN_PATTERN = /^[a-f0-9]{32,128}$/i;

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!TOKEN_PATTERN.test(token)) notFound();

  return (
    <main className="min-h-screen bg-background">
      <PublicReviewSubmit token={token} />
    </main>
  );
}
