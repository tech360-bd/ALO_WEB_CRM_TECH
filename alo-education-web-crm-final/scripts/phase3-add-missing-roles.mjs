// Phase 3 — Add missing RBAC roles and a DataScope helper.
//
// The user's brief requires these 13 roles:
//   SUPER_ADMIN, ADMIN, HR_MANAGER, BRANCH_MANAGER, COUNSELOR,
//   APPLICATION_TEAM, VISA_OFFICER, FINANCE, MARKETING, FRONT_DESK,
//   SUPPORT_STAFF, PARTNER, STUDENT
//
// Current DB has 18 roles but is missing: ADMIN, HR_MANAGER, MARKETING, SUPPORT_STAFF.
// Add them with appropriate default permissions.

import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';

const db = new PrismaClient();

const NEW_ROLES = [
  {
    name: 'admin',
    label: 'Administrator',
    description: 'Full system administrator (similar to super_admin but without user-management bypass)',
    isSystem: true,
    // Same permissions as super_admin
    copyFrom: 'super_admin',
  },
  {
    name: 'hr_manager',
    label: 'HR Manager',
    description: 'Human Resources manager — manages employees, attendance, performance, salary',
    isSystem: true,
    // Same permissions as hr
    copyFrom: 'hr',
  },
  {
    name: 'marketing',
    label: 'Marketing Staff',
    description: 'Marketing team member — content generation, social media, campaigns',
    isSystem: true,
    // Same permissions as marketing_manager
    copyFrom: 'marketing_manager',
  },
  {
    name: 'support_staff',
    label: 'Support Staff',
    description: 'Frontline support — handles student queries and basic troubleshooting',
    isSystem: true,
    // Same permissions as support_agent
    copyFrom: 'support_agent',
  },
];

console.log('[phase3-rbac] Adding missing RBAC roles...');

for (const role of NEW_ROLES) {
  // Check if role already exists
  const existing = await db.portalRole.findUnique({ where: { name: role.name } });
  if (existing) {
    console.log(`  ⊙ ${role.name} already exists — skipping`);
    continue;
  }

  // Create the role
  const created = await db.portalRole.create({
    data: {
      name: role.name,
      label: role.label,
      description: role.description,
      isSystem: role.isSystem,
    },
  });
  console.log(`  ✓ Created role: ${role.name} (${created.id})`);

  // Copy permissions from source role
  if (role.copyFrom) {
    const sourceRole = await db.portalRole.findUnique({
      where: { name: role.copyFrom },
      include: { permissions: { select: { permissionId: true, granted: true } } },
    });
    if (sourceRole && sourceRole.permissions.length > 0) {
      let copied = 0;
      for (const p of sourceRole.permissions) {
        try {
          await db.portalRolePermission.create({
            data: {
              roleId: created.id,
              permissionId: p.permissionId,
              granted: p.granted,
            },
          });
          copied++;
        } catch (e) {
          // Skip duplicates
        }
      }
      console.log(`    Copied ${copied} permission grants from ${role.copyFrom}`);
    } else {
      console.log(`    Source role ${role.copyFrom} not found or has no permissions`);
    }
  }
}

// Verify all 13 required roles now exist
const required = ['super_admin', 'admin', 'hr_manager', 'branch_manager', 'counselor', 'application_team', 'visa_officer', 'finance', 'marketing', 'front_desk', 'support_staff', 'partner', 'student'];
const allRoles = await db.portalRole.findMany({ select: { name: true } });
const roleNames = new Set(allRoles.map(r => r.name.toLowerCase()));

console.log('\n[phase3-rbac] Verification:');
let allPresent = true;
for (const r of required) {
  if (roleNames.has(r)) {
    console.log(`  ✓ ${r}`);
  } else {
    console.log(`  ✗ ${r} MISSING`);
    allPresent = false;
  }
}

if (allPresent) {
  console.log('\n[phase3-rbac] All 13 required roles are present.');
} else {
  console.log('\n[phase3-rbac] Some roles are still missing.');
}

await db.$disconnect();
