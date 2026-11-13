// POST /api/super-admin/acting-as/stop
//
// Canonical Super Admin path for ending an Acting-As session. Re-export of the
// single implementation in /api/portal-auth/acting-as/stop so there is one
// place that revokes the session row, clears the cookie and audits the exit.

export { POST } from '@/app/api/portal-auth/acting-as/stop/route';
export const dynamic = 'force-dynamic';
