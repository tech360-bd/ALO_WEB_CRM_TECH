import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — ALO Education',
  description:
    'Sign in to your ALO Education account to access universities, courses, scholarships, and application tracking.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
