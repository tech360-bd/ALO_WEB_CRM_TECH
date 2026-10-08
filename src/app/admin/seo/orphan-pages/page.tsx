import type { Metadata } from 'next';
import PageGraphDashboard from '@/components/admin/PageGraphDashboard';

export const metadata: Metadata = {
  title: 'Page Graph & Orphan Audit | ALO Education Admin',
  description: 'Audit published core pages for orphan links, missing parent breadcrumbs, missing related content, SEO gaps and media coverage.',
};

export default function OrphanPageAudit() {
  return <PageGraphDashboard view="graph" />;
}
