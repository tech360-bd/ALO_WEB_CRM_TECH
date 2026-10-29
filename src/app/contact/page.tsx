import { PublicContactPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'Contact ALO Education | Study Abroad Guidance in Bangladesh',
  description: 'Contact ALO Education to ask about study-abroad guidance, consultation availability, and applicable fees. Submit the online contact form.',
  alternates: { canonical: 'https://aloeducation.com/contact' },
  openGraph: {
    title: 'Contact ALO Education',
    description: 'Ask ALO Education about study-abroad guidance, consultation availability, and applicable fees.',
    url: 'https://aloeducation.com/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return <PublicContactPage />;
}
