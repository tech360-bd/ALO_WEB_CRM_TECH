import SuperAdminOperatingDashboard from '@/components/admin/super-admin-operating/SuperAdminOperatingDashboard';

// The canonical Super Admin surface. Access is enforced by every
// /api/super-admin/* endpoint (SUPER_ADMIN role required server-side) and by
// the portal layout guard; this page renders no privileged data of its own.
export default function SuperAdminDashboardRoute() {
  return <SuperAdminOperatingDashboard />;
}
