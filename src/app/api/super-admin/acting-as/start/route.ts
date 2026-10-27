// POST /api/super-admin/acting-as/start
//
// Canonical Super Admin path for starting an Acting-As session.
//
// This is a deliberate re-export of /api/portal-auth/acting-as/start rather than
// a second implementation: the security checks (non-acting Super Admin only,
// active + verified employee target, no admin/super_admin target, 30-minute
// lifetime, reason required, audited session row, ALO_ACTING_AS marker) live in
// exactly one place. Duplicating them here would be a second place to get wrong.

export { POST } from '@/app/api/portal-auth/acting-as/start/route';
export const dynamic = 'force-dynamic';
