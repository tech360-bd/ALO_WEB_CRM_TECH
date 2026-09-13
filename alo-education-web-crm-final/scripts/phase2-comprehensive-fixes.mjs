// Phase 2 — Comprehensive fixes for remaining 46 TS errors.
// Each fix is targeted at a specific file and a specific pattern.
// No blind regex — each fix is verified by reading the file first.

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const ROOT = '/home/z/my-project';

async function patch(file, find, replace, label) {
  const filePath = `${ROOT}/${file}`;
  const content = await readFile(filePath, 'utf8');
  if (!content.includes(find)) {
    console.log(`  ✗ ${label}: pattern not found in ${file}`);
    return false;
  }
  const newContent = content.replace(find, replace);
  await writeFile(filePath, newContent, 'utf8');
  console.log(`  ✓ ${label}`);
  return true;
}

console.log('[phase2-comprehensive] applying fixes...');

// 1. seed-complete.ts: cast msg to typed shape so isAiGenerated/isInternal are recognized
await patch(
  'prisma/seed-complete.ts',
  `          senderName: msg.senderName,
          content: msg.content,
          messageType: msg.messageType,
          isAiGenerated: msg.isAiGenerated || false,
          isRead: Math.random() > 0.3,
          isInternal: msg.isInternal || false,`,
  `          senderName: msg.senderName,
          content: msg.content,
          messageType: msg.messageType,
          isAiGenerated: Boolean((msg as { isAiGenerated?: boolean }).isAiGenerated),
          isRead: Math.random() > 0.3,
          isInternal: Boolean((msg as { isInternal?: boolean }).isInternal),`,
  'seed-complete.ts: cast msg fields'
);

// 2. admin/access-control-center: roles -> rolePermissions
await patch(
  'src/app/api/admin/access-control-center/route.ts',
  `          where: { roles: { some: { id: role.id } } },`,
  `          where: { rolePermissions: { some: { roleId: role.id } } },`,
  'access-control-center: roles -> rolePermissions'
);

// 3. admin/access-control: select permission.* instead of flat fields on junction
await patch(
  'src/app/api/admin/access-control/route.ts',
  `        permissions: {
          select: {
            id: true,
            module: true,
            feature: true,
            action: true,
            description: true,
          },
        },`,
  `        permissions: {
          select: {
            id: true,
            granted: true,
            permission: {
              select: {
                id: true,
                module: true,
                feature: true,
                action: true,
                description: true,
              },
            },
          },
        },`,
  'access-control: nest permission select'
);

// 4. crm/course-import/stats: replace aggregate({ _sum: { id: true } }) with count()
await patch(
  'src/app/api/crm/course-import/stats/route.ts',
  `      db.crmImportError.aggregate({ _sum: { id: true } }),`,
  `      db.crmImportError.count(),`,
  'course-import/stats: use count() instead of aggregate'
);
await patch(
  'src/app/api/crm/course-import/stats/route.ts',
  `      failedRows: failedRowsAgg._sum.id || 0,`,
  `      failedRows: failedRowsAgg || 0,`,
  'course-import/stats: simplify failedRows'
);

// 5. crm/roles: use portalRolePermission instead of portalPermission for role-permission mapping
await patch(
  'src/app/api/crm/roles/route.ts',
  `        await db.portalPermission.deleteMany({ where: { roleId } });
        for (const pid of permissionIds) {
          await db.portalPermission.create({ data: { roleId, permissionId: pid } });
        }`,
  `        await db.portalRolePermission.deleteMany({ where: { roleId } });
        for (const pid of permissionIds) {
          await db.portalRolePermission.create({ data: { roleId, permissionId: pid, granted: true } });
        }`,
  'crm/roles: use portalRolePermission junction'
);

// 6. marketing/comments/convert-lead: convertedToLead should be lead ID (string), not boolean
await patch(
  'src/app/api/marketing/comments/convert-lead/route.ts',
  `        leadId: lead.id,
        convertedToLead: true,
        status: 'converted',`,
  `        leadId: lead.id,
        convertedToLead: lead.id,
        status: 'converted',`,
  'convert-lead: convertedToLead is lead ID string'
);

// 7. partner/referrals: referredStudentEmail -> referredEmail; referredByName -> referredName
await patch(
  'src/app/api/partner/referrals/route.ts',
  `      where: {
        referrerId: auth.userId,
        referredStudentEmail,
        status: { not: 'rejected' },
      },`,
  `      where: {
        referrerId: auth.userId,
        referredEmail: referredStudentEmail,
        status: { not: 'rejected' },
      },`,
  'partner/referrals: referredStudentEmail -> referredEmail'
);
await patch(
  'src/app/api/partner/referrals/route.ts',
  `      data: {
        referrerId: auth.userId,
        referredByName: referredByName || partner.companyName,
        referredStudentEmail,
        destinationCountry,
        status: 'pending',
        reward: 0,
      },`,
  `      data: {
        referrerId: auth.userId,
        referredName: referredByName || partner.companyName,
        referredEmail: referredStudentEmail,
        destinationCountry,
        status: 'pending',
        reward: 0,
      },`,
  'partner/referrals: referredByName -> referredName'
);

// 8. permissions/route.ts: RolePermission needs @@unique([roleId, permissionId]) in schema.
// The code uses roleId_permissionId composite key.
// Add the unique constraint to the schema.

// 9. portal-auth/forgot-password: add tokenHash (SHA-256 of token)
await patch(
  'src/app/api/portal-auth/forgot-password/route.ts',
  `      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetExpires,
          used: false,
        },
      });`,
  `      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          tokenHash: createHash('sha256').update(resetToken).digest('hex'),
          expiresAt: resetExpires,
          used: false,
        },
      });`,
  'forgot-password: add tokenHash'
);
// Add the createHash import if not present
{
  const filePath = `${ROOT}/src/app/api/portal-auth/forgot-password/route.ts`;
  const content = await readFile(filePath, 'utf8');
  if (!content.includes('import { createHash }') && !content.includes('createHash')) {
    // Add import at the top after the first import
    const newContent = content.replace(
      /^(import [^;]+;)/m,
      `$1\nimport { createHash } from 'node:crypto';`
    );
    await writeFile(filePath, newContent, 'utf8');
    console.log('  ✓ forgot-password: added createHash import');
  } else if (content.includes('createHash') && !content.includes("import { createHash }")) {
    // Already used but not imported — add import
    const newContent = content.replace(
      /^(import [^;]+;)/m,
      `$1\nimport { createHash } from 'node:crypto';`
    );
    await writeFile(filePath, newContent, 'utf8');
    console.log('  ✓ forgot-password: added createHash import');
  } else {
    console.log('  ⊙ forgot-password: createHash already imported');
  }
}

// 10. student-portal/mock-tests: use findFirst instead of findUnique (studentId not unique)
await patch(
  'src/app/api/student-portal/mock-tests/route.ts',
  `        const creditRecord = await db.mockTestCredit.findUnique({
          where: { studentId: profile.id },
        });`,
  `        const creditRecord = await db.mockTestCredit.findFirst({
          where: { studentId: profile.id },
        });`,
  'mock-tests: findUnique -> findFirst (1)'
);

// 11. website/lead: import withAuth
await patch(
  'src/app/api/website/lead/route.ts',
  `import { NextResponse } from 'next/server';`,
  `import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';`,
  'website/lead: import withAuth'
);

// 12. access-check-engine: remove status filter (PortalStudentApplication may not have status field)
await patch(
  'src/lib/access-check-engine.ts',
  `      where: {
        studentProfileId: studentId,
        stage: { notIn: ['withdrawn', 'rejected'] },
        status: { notIn: ['cancelled', 'closed', 'rejected'] },
      },`,
  `      where: {
        studentProfileId: studentId,
        stage: { notIn: ['withdrawn', 'rejected'] },
      },`,
  'access-check-engine: drop status filter'
);

console.log('[phase2-comprehensive] done.');
