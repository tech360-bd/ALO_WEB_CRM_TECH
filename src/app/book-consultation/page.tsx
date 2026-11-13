import PublicConsultationPage from '@/components/website/public-pages/PublicConsultationPage';

export const metadata = {
  title: 'Request Consultation | ALO Education Study Abroad',
  description: 'Request study-abroad guidance from ALO Education. Share your goals and our team will review your enquiry; confirm availability and any applicable fee before booking.',
  alternates: { canonical: 'https://aloeducation.com/book-consultation' },
  openGraph: {
    title: 'Request Consultation | ALO Education',
    description: 'Request guidance on university applications, visa requirements, and scholarships. Confirm availability and any applicable fee before booking.',
    url: 'https://aloeducation.com/book-consultation',
    type: 'website',
  },
};

export default function BookConsultationPage() {
  return <PublicConsultationPage />;
}
