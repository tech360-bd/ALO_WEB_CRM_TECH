import { PublicFaqsPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'Frequently Asked Questions | ALO Education Study Abroad FAQ',
  description: 'Find answers to the most common questions about studying abroad — visa requirements, university applications, IELTS scores, tuition fees, scholarships, and more.',
  alternates: { canonical: 'https://aloeducation.com/faqs' },
  openGraph: {
    title: 'FAQs | ALO Education',
    description: 'Answers to 50+ study abroad questions covering visa, applications, scholarships, and more.',
    url: 'https://aloeducation.com/faqs',
    type: 'website',
  },
};

export default function FaqsPage() {
  return <PublicFaqsPage />;
}
