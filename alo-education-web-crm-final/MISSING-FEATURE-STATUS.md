# Missing Feature Status

## Blocking items
- Prisma migrate deploy fails with schema engine error.
- Prisma db push fails with schema engine error.
- Safe seed fails because tables are not created.
- Production MySQL/MySQL/MariaDB migration not verified; schema currently uses MySQL.
- AI Command Center persistent command execution, approval, rollback and database evidence not verified.
- Full RBAC/ownership matrix automation not implemented for every role and scope.
- Live provider OAuth/webhook/API verification not performed.
- Clean-extract gate not passed.

## Completed in this pass
- Corrected project snapshot and inventories.
- Fixed React lint blockers in communication components.
- Added real Playwright config and browser smoke/auth tests.
- Verified production build and standalone source-tree startup.
- Added disposable MySQL backup/restore scripts and test.
