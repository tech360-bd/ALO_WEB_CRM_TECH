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
