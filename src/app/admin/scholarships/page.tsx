import { Metadata } from 'next';
import AdminContentManager from '@/components/admin/AdminContentManager';

export const metadata: Metadata = {
  title: 'Admin — Scholarships Content Management | ALO Education',
  robots: { index: false, follow: false },
};

export default function AdminScholarshipsPage() {
  return <AdminContentManager />;
}
