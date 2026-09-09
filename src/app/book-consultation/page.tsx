import PublicConsultationPage from '@/components/website/public-pages/PublicConsultationPage';

export const metadata = {
  title: 'Book Free Consultation | ALO Education Study Abroad',
  description: 'Book a free study abroad consultation with ALO Education. Tell us your goals and we\'ll match you to the right university, course, and country.',
  alternates: { canonical: 'https://aloeducation.com/book-consultation' },
  openGraph: {
    title: 'Book Free Consultation | ALO Education',
    description: 'Get expert guidance on university applications, visa requirements, and scholarships — completely free.',
    url: 'https://aloeducation.com/book-consultation',
    type: 'website',
  },
};

export default function BookConsultationPage() {
  return <PublicConsultationPage />;
}
