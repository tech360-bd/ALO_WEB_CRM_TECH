import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { generateTimeline, type TimelinePlan } from '../timeline';
import { recordPhdAudit } from '../audit';

type PlannerDiscipline = 'BUSINESS' | 'ENGINEERING' | 'UNDECIDED';

function plannerDiscipline(...candidates: Array<string | null | undefined>): PlannerDiscipline {
  for (const candidate of candidates) {
    if (candidate === 'BUSINESS' || candidate === 'ENGINEERING') return candidate;
  }
  return 'UNDECIDED';
}

export async function buildTimelineForProject(
  actor: PhdActor,
  input: {
    projectId: string;
    startDate: string;
    mode: 'FULL_TIME' | 'PART_TIME';
    totalMonths?: number;
    methodology?: string;
  },
) {
  const project = await db.phdProject.findUnique({ where: { id: input.projectId } });
  if (!project || !canAccessProject(actor, project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const profile = await db.phdProfile.findUnique({ where: { userId: project.userId } });

  const plan = generateTimeline({
    startDate: input.startDate,
    mode: input.mode,
    discipline: plannerDiscipline(profile?.primaryDiscipline, project.discipline),
    methodology: input.methodology,
    totalMonths: input.totalMonths,
    holidays: profile?.personalDeadlines || undefined,
  });

  const timeline = await db.$transaction(async (tx) => {
    const created = await tx.phdTimeline.create({
      data: {
        projectId: input.projectId,
        name: `${plan.mode === 'PART_TIME' ? 'Part-time' : 'Full-time'} PhD plan (${plan.totalMonths} months)`,
        mode: plan.mode,
        startDate: plan.startDate,
        totalMonths: plan.totalMonths,
        discipline: plannerDiscipline(profile?.primaryDiscipline, project.discipline),
        notes: JSON.stringify({ assumptions: plan.assumptions, warnings: plan.warnings }),
      },
    });

    // Milestones are inserted in dependency order so `dependsOnId` can point at
    // the real row id. The planner only ever emits dependencies that appear
    // earlier in the array, so a single forward pass is sufficient.
    const idByKey = new Map<string, string>();
    for (const [index, milestone] of plan.milestones.entries()) {
      const dependsOnId = milestone.dependsOnKey ? idByKey.get(milestone.dependsOnKey) ?? null : null;
      const row = await tx.phdTimelineMilestone.create({
        data: {
          timelineId: created.id,
          name: milestone.name,
          category: milestone.category,
          sortOrder: index,
          startDate: milestone.startDate,
          endDate: milestone.endDate,
          dependsOnId,
          status: 'PLANNED',
          isOfficialDeadline: false,
          notes: milestone.notes,
        },
      });
      idByKey.set(milestone.key, row.id);
    }

    return tx.phdTimeline.findUniqueOrThrow({
      where: { id: created.id },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  });

  await recordPhdAudit({
    actor,
    action: 'TIMELINE_GENERATED',
    entityType: 'PhdTimeline',
    entityId: timeline.id,
    projectId: input.projectId,
    details: { months: plan.totalMonths, mode: plan.mode, milestones: plan.milestones.length },
  });

  return {
    timeline: { ...timeline, notes: parsePlanNotes(timeline.notes) },
    plan: serialisePlan(plan),
    disclaimer:
      'Suggested project plan only. It is not an official university deadline and does not guarantee completion within the programme’s maximum registration period.',
  };
}

export async function listTimelines(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'read')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const timelines = await db.phdTimeline.findMany({
    where: { projectId },
    include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return timelines.map((timeline) => ({ ...timeline, notes: parsePlanNotes(timeline.notes) }));
}

export async function updateMilestone(
  actor: PhdActor,
  milestoneId: string,
  input: { status?: string; startDate?: string; endDate?: string; notes?: string },
) {
  const milestone = await db.phdTimelineMilestone.findUnique({
    where: { id: milestoneId },
    include: { timeline: true },
  });
  if (!milestone) throw new PhdAccessError('Milestone not found.', 404);
  const project = await db.phdProject.findUnique({ where: { id: milestone.timeline.projectId } });
  if (!project || !canAccessProject(actor, project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  if (milestone.isOfficialDeadline) {
    throw new PhdAccessError(
      'This milestone is linked to an institutional deadline. Change the deadline record instead so provenance is preserved.',
      422,
    );
  }
  const updated = await db.phdTimelineMilestone.update({
    where: { id: milestoneId },
    data: {
      status: input.status ?? milestone.status,
      startDate: input.startDate ? new Date(input.startDate) : milestone.startDate,
      endDate: input.endDate ? new Date(input.endDate) : milestone.endDate,
      notes: input.notes ?? milestone.notes,
    },
  });
  await recordPhdAudit({
    actor,
    action: 'TIMELINE_MILESTONE_UPDATED',
    entityType: 'PhdTimelineMilestone',
    entityId: milestoneId,
    projectId: project.id,
    details: { status: updated.status },
  });
  return updated;
}

function parsePlanNotes(value: string): { assumptions?: string[]; warnings?: string[] } {
  try {
    const parsed = JSON.parse(value) as { assumptions?: string[]; warnings?: string[] };
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function serialisePlan(plan: TimelinePlan) {
  return {
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    totalMonths: plan.totalMonths,
    mode: plan.mode,
    assumptions: plan.assumptions,
    warnings: plan.warnings,
    milestones: plan.milestones.map((milestone, index) => ({
      index,
      key: milestone.key,
      name: milestone.name,
      category: milestone.category,
      startDate: milestone.startDate.toISOString(),
      endDate: milestone.endDate.toISOString(),
      dependsOnKey: milestone.dependsOnKey,
      notes: milestone.notes,
      isOfficialDeadline: milestone.isOfficialDeadline,
    })),
  };
}
