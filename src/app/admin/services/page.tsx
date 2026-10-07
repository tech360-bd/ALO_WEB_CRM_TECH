import { Metadata } from 'next';
import AdminContentManager from '@/components/admin/AdminContentManager';

export const metadata: Metadata = {
  title: 'Admin — Services Content Management | ALO Education',
  robots: { index: false, follow: false },
};

export default function AdminServicesPage() {
  return <AdminContentManager />;
}
