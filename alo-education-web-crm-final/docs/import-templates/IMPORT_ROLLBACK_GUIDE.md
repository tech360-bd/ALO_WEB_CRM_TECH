# ALO EDUCATION — IMPORT ROLLBACK GUIDE

- Every import batch creates a tracking ID in `CrmImportBatch`.
- If an import is rejected or reversed, Super Admin can trigger batch rollback via `/admin/data-import/[batchId]`.
- Rollback deletes staged rows inside a database transaction without altering verified production records.
