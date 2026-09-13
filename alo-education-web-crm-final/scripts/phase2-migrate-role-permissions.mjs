// Phase 2 — Migrate role-permission assignments to new PortalRolePermission junction.
// Parses DEFAULT_ROLE_PERMISSIONS from src/lib/permissions.ts using a simple state machine.

import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const existing = await db.portalRolePermission.count();
console.log(`Existing PortalRolePermission rows: ${existing}`);
// Don't exit early — the unique constraint on (roleId, permissionId) will skip duplicates.
// This lets us re-run to fill in roles that weren't migrated on the first pass.

const permsContent = await readFile('/home/z/my-project/src/lib/permissions.ts', 'utf8');

// Find DEFAULT_ROLE_PERMISSIONS block
const startMarker = 'export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, string[]> = {';
const startIdx = permsContent.indexOf(startMarker);
if (startIdx === -1) {
  console.error('Could not find DEFAULT_ROLE_PERMISSIONS');
  process.exit(1);
}
const blockStart = startIdx + startMarker.length;
// Find matching closing brace (depth-based)
let depth = 1;
let i = blockStart;
while (i < permsContent.length && depth > 0) {
  if (permsContent[i] === '{') depth++;
  else if (permsContent[i] === '}') depth--;
  i++;
}
const blockEnd = i - 1;
const block = permsContent.slice(blockStart, blockEnd);
console.log(`Block length: ${block.length} chars`);

// Parse: roleName: [ "id1", "id2", ... ]
const rolePerms = {};
const lines = block.split('\n');
let currentRole = null;
let inArray = false;
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  // Match role name declaration: roleName: [
  const roleMatch = trimmed.match(/^(\w+):\s*\[/);
  if (roleMatch) {
    currentRole = roleMatch[1];
    rolePerms[currentRole] = [];
    inArray = true;
    // Check if there are ids on the same line
    const ids = trimmed.match(/"([^"]+)"/g);
    if (ids) {
      for (const id of ids) rolePerms[currentRole].push(id.replace(/"/g, ''));
    }
    // Check if array ends on same line
    if (trimmed.includes(']')) {
      inArray = false;
    }
    continue;
  }

  // If we're inside an array, extract ids
  if (inArray && currentRole) {
    const ids = trimmed.match(/"([^"]+)"/g);
    if (ids) {
      for (const id of ids) rolePerms[currentRole].push(id.replace(/"/g, ''));
    }
    if (trimmed.includes(']')) {
      inArray = false;
    }
  }

  // Special case: super_admin: PERMISSION_CATALOG.map((p) => p.id),
  if (trimmed.startsWith('super_admin:') && trimmed.includes('PERMISSION_CATALOG')) {
    currentRole = 'super_admin';
    rolePerms[currentRole] = '__ALL__';
    inArray = false;
  }
}

// Resolve super_admin = ALL
if (rolePerms.super_admin === '__ALL__') {
  // Read all permission IDs from DB
  const allPerms = await db.portalPermission.findMany({ select: { id: true } });
  rolePerms.super_admin = allPerms.map(p => p.id);
  console.log(`super_admin: ${rolePerms.super_admin.length} permissions (ALL)`);
}

console.log(`Parsed ${Object.keys(rolePerms).length} roles`);
for (const [r, ids] of Object.entries(rolePerms)) {
  console.log(`  ${r}: ${Array.isArray(ids) ? ids.length : '?'} permissions`);
}

// Look up role IDs by name
const roles = await db.portalRole.findMany();
console.log(`\nFound ${roles.length} PortalRole rows in DB:`);
for (const r of roles) console.log(`  ${r.name} (${r.id})`);
const roleByName = new Map(roles.map(r => [r.name, r.id]));

// Look up permission IDs by their catalog id
const perms = await db.portalPermission.findMany();
console.log(`\nFound ${perms.length} PortalPermission rows in DB`);
const permByCatalogId = new Map(perms.map(p => [p.id, p.id]));

let inserted = 0, skipped = 0, roleMissing = 0, permMissing = 0;
// Map catalog role names to DB role names
const ROLE_NAME_MAP = {
  super_admin: 'super_admin',
  branch_manager: 'branch_manager',
  counselor: 'counselor',
  application_officer: 'application_team',
  visa_officer: 'visa_officer',
  finance_officer: 'finance',
  marketing_manager: 'marketing_manager',
  hr_manager: 'hr',
  employee: 'EMPLOYEE',
};
for (const [roleName, permIds] of Object.entries(rolePerms)) {
  const dbRoleName = ROLE_NAME_MAP[roleName] || roleName;
  const roleId = roleByName.get(dbRoleName);
  if (!roleId) {
    roleMissing++;
    console.log(`  ⚠ Role not found in DB: ${roleName} (looked for ${dbRoleName})`);
    continue;
  }
  for (const permId of permIds) {
    const dbPermId = permByCatalogId.get(permId);
    if (!dbPermId) {
      permMissing++;
      continue;
    }
    try {
      await db.portalRolePermission.create({
        data: { roleId, permissionId: dbPermId, granted: true }
      });
      inserted++;
    } catch (e) {
      skipped++;
    }
  }
}
console.log(`\nInserted: ${inserted}, Skipped: ${skipped}, Roles missing: ${roleMissing}, Perms missing: ${permMissing}`);

await db.$disconnect();
console.log('DONE');
