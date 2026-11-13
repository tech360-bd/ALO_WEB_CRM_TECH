import RolePermissionMatrix from '@/components/admin/super-admin-operating/RolePermissionMatrix';

// /admin/role-permissions renders the real RBAC control surface. It previously
// rendered CrmPermissionsPage, a hardcoded grid (DEFAULT_PERMS) whose Save
// button only set local React state — no API call, no audit, no persistence.
export default function RolePermissionsRoute() {
  return (
    <div className="min-h-screen p-3 sm:p-5" style={{ backgroundColor: 'var(--alo-page, #F8FAFC)' }}>
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-4">
        <RolePermissionMatrix />
      </div>
    </div>
  );
}
