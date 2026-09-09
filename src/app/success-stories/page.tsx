import { PublicSuccessStoriesPage } from '@/components/website/public-pages/PublicPages';

export const metadata = {
  title: 'Student Success Stories | ALO Education Bangladesh',
  description: 'Real success stories from Bangladeshi students who secured admissions in top universities in the UK, USA, Canada, Australia, and more with ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/success-stories' },
  openGraph: {
    title: 'Student Success Stories | ALO Education',
    description: 'See how ALO Education helped students achieve their study abroad dreams.',
    url: 'https://aloeducation.com/success-stories',
    type: 'website',
  },
};

export default function SuccessStoriesPage() {
  return <PublicSuccessStoriesPage />;
}
