import { db } from '@/lib/db';
import type { PhdActor } from '../auth';
import { canVerify } from '../auth';
import { assessDeadline } from '../deadlines';
import { ensureDefaultProject } from './projects';

/**
 * Dashboard metrics. Every value is a database count or an assessed date.
 * No sample supervisors, fabricated totals or placeholder analytics are shown.
 */
export async function getDashboard(actor: PhdActor) {
  const project = await ensureDefaultProject(actor);
  const projectFilter = actor.role === 'ADMINISTRATOR' ? {} : { projectId: project.id };

  const now = new Date();
  const [
    topics,
    verifiedSources,
    totalSources,
    proposals,
    pendingResponses,
    applications,
    unreadNotifications,
    allDeadlines,
    supervisorMatches,
    verifiedSupervisors,
    verifiedProgrammes,
    universities,
    verifiedResearchPages,
    pendingCommission,
    openVerification,
  ] = await Promise.all([
    db.phdTopicCandidate.count({ where: { projectId: project.id } }),
    db.phdLiteratureSource.count({ where: { projectId: project.id, verificationStatus: 'VERIFIED_OFFICIAL' } }),
    db.phdLiteratureSource.count({ where: { projectId: project.id } }),
    db.phdProposal.findMany({ where: { projectId: project.id }, select: { id: true, title: true, status: true, updatedAt: true, currentVersion: true }, orderBy: { updatedAt: 'desc' }, take: 5 }),
    db.phdSupervisorContact.count({ where: { projectId: project.id, status: { in: ['SENT', 'FOLLOW_UP_DUE'] } } }),
    db.phdApplication.findMany({ where: { projectId: project.id }, select: { status: true, fundingStatus: true, university: { select: { name: true } }, programme: { select: { name: true } }, nextAction: true, nextActionDueAt: true }, orderBy: { updatedAt: 'desc' }, take: 6 }),
    db.phdNotification.count({ where: { userId: actor.userId, readAt: null } }),
    db.phdDeadline.findMany({ where: { ...projectFilter, dueDate: { not: null } }, orderBy: { dueDate: 'asc' }, take: 25 }),
    db.phdSupervisorMatch.count({ where: { projectId: project.id } }),
    db.phdSupervisor.count({ where: { verificationStatus: 'VERIFIED_OFFICIAL' } }),
    db.phdProgramme.count({ where: { verificationStatus: 'VERIFIED_OFFICIAL' } }),
    db.phdUniversity.count(),
    db.phdUniversity.count({ where: { researchDegreesStatus: 'VERIFIED_OFFICIAL' } }),
    canVerify(actor)
      ? db.phdCommissionRecord.count({ where: { verificationStatus: { in: ['CONFIRMED_UNVERIFIED', 'UNVERIFIED'] } } })
      : Promise.resolve(0),
    canVerify(actor)
      ? db.phdSourceEvidence.count({ where: { verificationStatus: { in: ['NOT_YET_VERIFIED', 'SOURCE_UNAVAILABLE'] } } })
      : Promise.resolve(0),
  ]);

  const assessedDeadlines = allDeadlines
    .map((deadline) => ({
      id: deadline.id,
      title: deadline.title,
      kind: deadline.kind,
      dueDate: deadline.dueDate,
      sourceUrl: deadline.sourceUrl,
      verificationStatus: deadline.verificationStatus,
      assessment: assessDeadline({
        dueDate: deadline.dueDate,
        kind: deadline.kind,
        verificationStatus: deadline.verificationStatus,
        sourceUrl: deadline.sourceUrl,
        reminderDays: deadline.reminderDays,
      }, now),
    }))
    .filter((deadline) => !deadline.assessment.isExpired)
    .slice(0, 6);

  const expiredDeadlines = allDeadlines.filter((deadline) =>
    assessDeadline({ dueDate: deadline.dueDate, kind: deadline.kind, verificationStatus: deadline.verificationStatus }, now).isExpired,
  ).length;

  return {
    project: { id: project.id, title: project.title, createdAt: project.createdAt },
    metrics: {
      topics,
      verifiedSources,
      totalSources,
      proposals: proposals.length,
      pendingResponses,
      applications: applications.length,
      unreadNotifications,
      supervisorMatches,
      verifiedSupervisors,
      verifiedProgrammes,
      universities,
      verifiedResearchPages,
      pendingCommission,
      openVerification,
      expiredDeadlines,
    },
    proposals,
    applications,
    deadlines: assessedDeadlines,
    isEmpty: topics === 0 && totalSources === 0 && proposals.length === 0 && applications.length === 0,
  };
}
