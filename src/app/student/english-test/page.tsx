import type { Metadata } from 'next';
import EnglishTestNotice from '@/components/student/EnglishTestNotice';

export const metadata: Metadata = {
  title: 'English Tests | ALO Education Student Portal',
  description: 'Continue to the English Test Platform and review your English preparation progress.',
};

export default function StudentEnglishTestPage() {
  return <EnglishTestNotice />;
}
