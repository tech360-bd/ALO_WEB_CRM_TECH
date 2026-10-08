import type { Metadata } from 'next';
import PageGraphDashboard from '@/components/admin/PageGraphDashboard';

export const metadata: Metadata = {
  title: 'Internal Link Health | ALO Education Admin',
  description: 'Review unresolved internal-link targets and self-link candidates in published ALO content.',
};

export default function InternalLinkHealthPage() {
  return <PageGraphDashboard view="links" />;
}
