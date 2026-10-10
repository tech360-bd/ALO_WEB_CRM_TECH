import { db } from '@/lib/db';
import { ok, failFromError } from '@/lib/ai-workforce/api';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.skill.read');
  if (isGuardFailure(admission)) return admission;
  try {
    const skills = await db.awfSkill.findMany({
      orderBy: { slug: 'asc' },
      select: { slug: true, name: true, description: true, permission: true, version: true, status: true, inputSchema: true, outputSchema: true, _count: { select: { grants: true } } },
    });
    return ok({ skills, total: skills.length }, 'Skill library');
  } catch (error) {
    return failFromError(error, 'Unable to load skills');
  }
}
