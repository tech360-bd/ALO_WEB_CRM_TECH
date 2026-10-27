import SuperAdminOperatingDashboard from '@/components/admin/super-admin-operating/SuperAdminOperatingDashboard';

// /crm/super-admin is an alias of the single canonical Super Admin dashboard.
// Keeping one component here means there is exactly one Super Admin dashboard
// to maintain, rather than two drifting implementations.
export default function CrmSuperAdminPage() {
  return <SuperAdminOperatingDashboard />;
}
