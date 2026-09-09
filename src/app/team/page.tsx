import { PublicTeamPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'Our Team | ALO Education Study Abroad Advisors Bangladesh',
  description: 'Meet the ALO Education team — experienced education advisors, counselors, and visa specialists dedicated to helping Bangladeshi students achieve their international study goals.',
  alternates: { canonical: 'https://aloeducation.com/team' },
  openGraph: {
    title: 'Our Team | ALO Education',
    description: 'Meet our expert team of study abroad advisors and visa counselors.',
    url: 'https://aloeducation.com/team',
    type: 'website',
  },
};

export default function TeamPage() {
  return <PublicTeamPage />;
}
