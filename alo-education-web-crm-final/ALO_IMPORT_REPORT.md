> **HISTORICAL / UNVERIFIED — NOT A SOURCE OF TRUTH** (labelled 2026-10-12).
> Unsupported: Instructs operators to import ALO_UNIVERSITY_COURSE_DATA_PACKAGE.zip (generated, unverified catalogue data) with `npm run db:import` and to roll back with `npm run db:rollback`. Neither npm script exists in package.json. Real imports use /admin/data-import (preview, approval, Super Admin apply); see docs/catalogue-import/README.md.
> See AUDIT/historical-catalogue-reports-2026-10-12/README.md.

# ALO Education — CRM Database Import Guide

## Overview
This document provides instructions on how to import the relational database CSV files into the ALO Education CRM platform on an Ubuntu server environment.

## Import Steps
1. Transfer the `ALO_UNIVERSITY_COURSE_DATA_PACKAGE.zip` file to your Ubuntu server.
2. Unzip the file to extract the 18 relational and log CSV files:
   ```bash
   unzip ALO_UNIVERSITY_COURSE_DATA_PACKAGE.zip -d ./import-package
   ```
3. Run the database seed/import utility:
   ```bash
   npm run db:import -- --dir=./import-package
   ```

## Rollback Protocol
If any error occurs during import, run the rollback command to restore the previous database state:
```bash
npm run db:rollback -- --batch=LAST
```
