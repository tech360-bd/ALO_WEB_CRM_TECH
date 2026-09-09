import { PublicLegalPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'Cookie Policy | ALO Education',
  description: 'ALO Education cookie policy — how we use cookies to improve your experience on our study abroad platform.',
  alternates: { canonical: 'https://aloeducation.com/cookies' },
};

export default function CookiesPage() {
  return <PublicLegalPage type="cookies" />;
}