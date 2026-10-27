/**
 * ALO EDUCATION — SUPER ADMIN OPERATING SEED
 *
 * Idempotent. Safe to run repeatedly; it never duplicates a row.
 *
 *   npx tsx prisma/seed-super-admin-agent-network.ts
 *
 * 1. Materialises the "ALO 2000 Protected Self-Learning Agent Network":
 *    40 departments × 50 logical agents = 2000 `ai_agents` rows, with stable
 *    codes (ALO-<DEPARTMENT>-001 … 050) so a re-run updates instead of
 *    inserting again.
 * 2. Materialises the 24 permission groups from the shipped catalogue into
 *    `permission_groups`.
 * 3. Writes the default `system_settings` rows only when absent, so an
 *    operator's existing values are never overwritten.
 *
 * This script does NOT create demo students, fake leads or sample dashboards.
 */

import { PrismaClient } from '@prisma/client';
import { AGENT_DEPARTMENTS, AGENTS_PER_DEPARTMENT, logicalAgentCode } from '../src/lib/super-admin/agent-network';
import { PERMISSION_GROUP_CATALOG } from '../src/lib/super-admin/permission-groups';
import { DEFAULT_SETTINGS } from '../src/app/api/super-admin/settings/route';

const db = new PrismaClient();

const AGENT_ROLES = [
  'intake', 'classification', 'drafting', 'verification', 'routing',
  'summarisation', 'monitoring', 'scoring', 'scheduling', 'escalation',
] as const;

async function seedAgentNetwork(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const department of AGENT_DEPARTMENTS) {
    for (let index = 1; index <= AGENTS_PER_DEPARTMENT; index += 1) {
      const agentCode = logicalAgentCode(department.key, index);
      // Deterministic name so the roster is reproducible rather than random.
      const role = AGENT_ROLES[(index - 1) % AGENT_ROLES.length];
      const agentName = `${department.name.replace(' Agents', '')} ${role} agent ${String(index).padStart(2, '0')}`;

      const existing = await db.aiAgent.findFirst({ where: { agentCode } });
      if (existing) {
        await db.aiAgent.update({
          where: { id: existing.id },
          data: { agentName, department: department.key },
        });
        updated += 1;
        continue;
      }

      await db.aiAgent.create({
        data: {
          department: department.key,
          agentName,
          agentCode,
          agentType: 'PROTECTED_MICRO_AGENT',
          description:
            'Protected logical micro-agent. Sandbox-first, permission-aware, human approval required for risky work.',
          status: 'ACTIVE',
        },
      });
      created += 1;
    }
  }

  return { created, updated };
}

async function seedPermissionGroups(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const group of PERMISSION_GROUP_CATALOG) {
    const existing = await db.permissionGroup.findUnique({ where: { key: group.key } });
    const data = {
      name: group.name,
      description: group.description,
      department: group.department,
      riskLevel: group.riskLevel,
      permissions: JSON.stringify(group.permissions),
      isSystem: true,
    };
    if (existing) {
      await db.permissionGroup.update({ where: { key: group.key }, data });
      updated += 1;
    } else {
      await db.permissionGroup.create({ data: { ...data, key: group.key } });
      created += 1;
    }
  }

  return { created, updated };
}

async function seedSettings(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const setting of DEFAULT_SETTINGS) {
    const existing = await db.systemSetting.findUnique({ where: { key: setting.key } });
    if (existing) {
      // Never overwrite an operator's configured value.
      skipped += 1;
      continue;
    }
    await db.systemSetting.create({
      data: {
        key: setting.key,
        value: setting.value,
        valueType: setting.valueType,
        category: setting.category,
        label: setting.label,
        description: '',
      },
    });
    created += 1;
  }

  return { created, skipped };
}

async function main() {
  const agents = await seedAgentNetwork();
  const groups = await seedPermissionGroups();
  const settings = await seedSettings();

  const totalAgents = await db.aiAgent.count();

  console.log('Super Admin operating seed complete');
  console.log(`  agents:            ${agents.created} created, ${agents.updated} updated (total in DB: ${totalAgents})`);
  console.log(`  permission groups: ${groups.created} created, ${groups.updated} updated`);
  console.log(`  system settings:   ${settings.created} created, ${settings.skipped} existing left untouched`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
