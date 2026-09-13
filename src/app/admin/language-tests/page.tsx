import { Metadata } from 'next';
import AdminLanguageTestsView from '@/components/admin/AdminLanguageTestsView';

export const metadata: Metadata = {
  title: 'Language Tests Admin — CRUD | ALO Education',
  description: 'Admin CRUD for 15 English language tests — Basic, Format, Modules, Scoring, Acceptance, Requirements, Prep, FAQs, Resources, Success, SEO, Sources, Publish. Super Admin full access with source verification.',
};

export default function AdminLanguageTestsPage() {
  return <AdminLanguageTestsView />;
}
