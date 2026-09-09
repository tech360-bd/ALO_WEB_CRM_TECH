import AdminCountryBuilderView from '@/components/admin/AdminCountryBuilderView';

export const metadata = {
  title: 'Import Center - Countries | ALO Education Admin',
  description: 'CSV Import Center for country master records.',
};

export default function AdminImportCountriesPage() {
  return <AdminCountryBuilderView />;
}
