'use client';

/**
 * Preserves the original Enhanced Super Admin Control Center (acting-as,
 * global search, emergency lockdown, etc.) as a sibling of the new
 * Command Center dashboard so no capability is lost.
 */
import EnhancedSuperAdminControlCenter from '@/components/admin/EnhancedSuperAdminControlCenter';

export default function SuperAdminControlCenterRoute() {
  return <EnhancedSuperAdminControlCenter />;
}
