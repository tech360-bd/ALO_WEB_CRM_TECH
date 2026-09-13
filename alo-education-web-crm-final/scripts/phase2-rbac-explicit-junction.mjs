// Phase 2 — Convert PortalRole <-> PortalPermission from implicit M2M to explicit junction.
// The auth-middleware code expects: role.permissions[i].granted and role.permissions[i].permission.id
// Implicit M2M gives role.permissions[i].id directly (no granted, no nested permission).
// Explicit junction model PortalRolePermission supports the granted flag.
//
// Steps:
// 1. Read all role-permission assignments from current implicit M2M.
// 2. Patch prisma/schema.prisma:
//    - Replace PortalRole.permissions field type from PortalPermission[] to PortalRolePermission[]
//    - Replace PortalPermission.roles field type from PortalRole[] to PortalRolePermission[]
//    - Add new model PortalRolePermission with role+permission relations and `granted` flag
// 3. Run prisma db push (this drops the implicit _PortalRoleToPortalPermission table, creates PortalRolePermission)
// 4. Re-insert the assignments into the new PortalRolePermission table with granted=true.
// 5. Run prisma generate.

import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const SCHEMA = '/home/z/my-project/prisma/schema.prisma';

console.log('[phase2-rbac] Step 1: read existing role-permission assignments');
const assignments = JSON.parse(execSync('node -e "const { PrismaClient } = require(\'@prisma/client\'); const db = new PrismaClient(); (async () => { const roles = await db.portalRole.findMany({ select: { id: true, name: true, permissions: { select: { id: true } } } }); const out = []; for (const r of roles) for (const p of r.permissions) out.push({ roleId: r.id, permissionId: p.id }); console.log(JSON.stringify(out)); await db.\\$disconnect(); })();"', { encoding: 'utf8' }));
console.log(`  Read ${assignments.length} assignments`);
console.log(`  Sample: ${JSON.stringify(assignments[0])}`);

console.log('\n[phase2-rbac] Step 2: patch schema');
let schema = await readFile(SCHEMA, 'utf8');

// 1. Replace PortalRole.permissions type
const oldRolePerms = '  permissions   PortalPermission[]\n  userRoles     PortalUserRole[]';
const newRolePerms = '  permissions   PortalRolePermission[]\n  userRoles     PortalUserRole[]';
if (!schema.includes(oldRolePerms)) {
  console.error('  ✗ Could not find PortalRole.permissions declaration');
  process.exit(1);
}
schema = schema.replace(oldRolePerms, newRolePerms);
console.log('  ✓ PortalRole.permissions -> PortalRolePermission[]');

// 2. Replace PortalPermission.roles type
const oldPermRoles = '  roles       PortalRole[]';
const newPermRoles = '  rolePermissions PortalRolePermission[]';
if (!schema.includes(oldPermRoles)) {
  console.error('  ✗ Could not find PortalPermission.roles declaration');
  process.exit(1);
}
schema = schema.replace(oldPermRoles, newPermRoles);
console.log('  ✓ PortalPermission.roles -> rolePermissions PortalRolePermission[]');

// 3. Add the new PortalRolePermission model immediately AFTER PortalPermission model
// Find the end of PortalPermission model and insert after
const permModelEnd = schema.indexOf('model PortalUserRole {');
if (permModelEnd === -1) {
  console.error('  ✗ Could not find PortalUserRole model start');
  process.exit(1);
}

const newJunctionModel = `model PortalRolePermission {
  id           String   @id @default(cuid())
  roleId       String
  permissionId String
  granted      Boolean  @default(true)
  assignedAt   DateTime @default(now())
  assignedBy   String   @default("")

  role         PortalRole       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   PortalPermission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
}

`;

schema = schema.slice(0, permModelEnd) + newJunctionModel + schema.slice(permModelEnd);
console.log('  ✓ Added PortalRolePermission junction model');

await writeFile(SCHEMA, schema, 'utf8');
console.log('  ✓ Schema written');

console.log('\n[phase2-rbac] Step 3: validate schema');
try {
  execSync('npx prisma validate', { cwd: '/home/z/my-project', stdio: 'inherit' });
} catch (e) {
  console.error('  ✗ Schema validation failed');
  process.exit(1);
}

console.log('\n[phase2-rbac] Step 4: push schema (drops implicit join table, creates new junction)');
execSync('npx prisma db push --accept-data-loss', { cwd: '/home/z/my-project', stdio: 'inherit' });

console.log('\n[phase2-rbac] Step 5: re-insert role-permission assignments into new junction');
const insertScript = `
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const assignments = ${JSON.stringify(assignments)};
(async () => {
  let inserted = 0, skipped = 0;
  for (const a of assignments) {
    try {
      await db.portalRolePermission.create({
        data: { roleId: a.roleId, permissionId: a.permissionId, granted: true }
      });
      inserted++;
    } catch (e) {
      skipped++;
    }
  }
  console.log('Inserted:', inserted, 'Skipped (already existed):', skipped);
  await db.\\$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
`;
execSync(`node -e "${insertScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, { cwd: '/home/z/my-project', stdio: 'inherit' });

console.log('\n[phase2-rbac] Step 6: regenerate Prisma client');
execSync('npx prisma generate', { cwd: '/home/z/my-project', stdio: 'inherit' });

console.log('\n[phase2-rbac] DONE');
