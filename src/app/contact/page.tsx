import { PublicContactPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'Contact ALO Education | Free Study Abroad Consultation Bangladesh',
  description: 'Contact ALO Education for free study abroad counseling. Visit our Dhaka office, WhatsApp us at 01805020101, or fill out our online consultation form.',
  alternates: { canonical: 'https://aloeducation.com/contact' },
  openGraph: {
    title: 'Contact ALO Education | Free Consultation',
    description: 'Get in touch with our expert education advisors for a free study abroad consultation.',
    url: 'https://aloeducation.com/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return <PublicContactPage />;
}
