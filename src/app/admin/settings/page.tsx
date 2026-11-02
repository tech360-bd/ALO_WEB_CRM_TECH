import SuperAdminOperatingDashboard from '@/components/admin/super-admin-operating/SuperAdminOperatingDashboard';

// Focused deep-link into the canonical Super Admin operating dashboard.
// One dashboard, one set of APIs, one audit trail — no duplicated admin panel.
export default function AdminFocusedRoute() {
  return <SuperAdminOperatingDashboard focus="settings" />;
}
