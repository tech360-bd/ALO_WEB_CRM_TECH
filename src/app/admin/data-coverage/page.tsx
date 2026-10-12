import type { Metadata } from 'next';
import DataCoverageDashboard from '@/components/admin/DataCoverageDashboard';

export const metadata: Metadata = {
  title: 'Data Coverage Intelligence | ALO Education Admin',
  description: 'Live university, course, source and intake data completeness from the ALO database.',
};

export default function AdminDataCoveragePage() {
  return <DataCoverageDashboard />;
}
