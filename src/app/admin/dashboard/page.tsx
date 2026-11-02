import SuperAdminOperatingDashboard from '@/components/admin/super-admin-operating/SuperAdminOperatingDashboard';

// /admin/dashboard is an alias of the single canonical Super Admin operating
// dashboard. It used to render a second, separately-maintained control centre
// (EnhancedSuperAdminControlCenter), which meant two dashboards could drift.
// The canonical surface is reused here instead of duplicated.
export default function AdminDashboardRoute() {
  return <SuperAdminOperatingDashboard />;
}
