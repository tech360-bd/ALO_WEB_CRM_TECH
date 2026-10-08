import type { Metadata } from 'next';
import AloShortFormBuilder from '@/components/admin/AloShortFormBuilder';

export const metadata: Metadata = {
  title: 'ALO AI Short-form Builder',
  description: 'Generate structured, source-aware study abroad pages with ALO Education’s human-approved content workflow.',
};

export default function AdminBuilderPage() {
  return <AloShortFormBuilder />;
}
