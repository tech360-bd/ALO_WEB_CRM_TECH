import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register — ALO Education',
  description:
    'Create your ALO Education account to explore universities, courses, scholarships, and start your study abroad journey.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
