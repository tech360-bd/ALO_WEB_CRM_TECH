import { PublicAboutPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'About ALO Education | Study Abroad Consultancy Bangladesh',
  description: 'Learn about ALO Education — founded in February 2023 in Dhaka. Our mission, vision, values, team, and transparent student-first approach to study abroad guidance.',
  alternates: { canonical: 'https://aloeducation.com/about' },
  openGraph: {
    title: 'About ALO Education | Study Abroad Consultancy Bangladesh',
    description: 'ALO Education — honest, verified study abroad guidance from Dhaka. Meet our team and learn our process.',
    url: 'https://aloeducation.com/about',
    type: 'website',
  },
};

export default function AboutPage() {
  return <PublicAboutPage />;
}
