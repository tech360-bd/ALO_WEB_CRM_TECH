// Backward-compatible path. Authorization, ownership scope, audit, and workflow
// are shared with the secure employee-access leave API; do not duplicate logic.
export { GET, POST, PATCH, PATCH as PUT } from '@/app/api/employee-access/leave/route';
