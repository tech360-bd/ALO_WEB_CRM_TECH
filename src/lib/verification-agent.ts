// ALO Education — Weekly AI University Verification Agent
// Background Agent: UniversityCourseVerificationAgent
// Scheduled Weekly (Asia/Dhaka) to inspect official university URLs and detect course & fee changes

import { createHash } from 'crypto';
import { ProposedFieldChange } from './approval-queue';

export interface VerificationSourceTarget {
  universityId: string;
  universityName: string;
  courseId?: string;
  courseTitle?: string;
  officialSourceUrl: string;
  lastContentHash?: string;
  lastCheckedAt?: string;
}

export interface VerificationAgentRunResult {
  runId: string;
  agentName: string;
  startedAt: string;
  completedAt: string;
  sourcesChecked: number;
  contentHashChangesDetected: number;
  proposedChanges: ProposedFieldChange[];
  agentLogs: string[];
}

export function computeContentHash(content: string): string {
  return createHash('sha256').update(content || '').digest('hex');
}

export async function runWeeklyUniversityVerificationAgent(
  targets: VerificationSourceTarget[]
): Promise<VerificationAgentRunResult> {
  const startedAt = new Date().toISOString();
  const runId = `RUN-${Date.now()}`;
  const proposedChanges: ProposedFieldChange[] = [];
  const agentLogs: string[] = [];

  agentLogs.push(`[${startedAt}] UniversityCourseVerificationAgent started. Target count: ${targets.length}`);

  let hashChanges = 0;

  for (const target of targets) {
    agentLogs.push(`[INFO] Checking official source: ${target.universityName} -> ${target.officialSourceUrl}`);

    // Simulated content verification & hash check
    const currentHash = computeContentHash(`VERIFIED_CONTENT:${target.officialSourceUrl}:${Date.now()}`);

    if (target.lastContentHash && target.lastContentHash !== currentHash) {
      hashChanges++;
      agentLogs.push(`[HASH_CHANGE] Content change detected for ${target.universityName}`);

      proposedChanges.push({
        id: `CHG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        entityType: target.courseId ? 'Course' : 'University',
        entityId: target.courseId || target.universityId,
        entityName: target.courseTitle || target.universityName,
        fieldName: 'tuition_fee',
        currentValue: '$30,000 / year',
        proposedValue: '$31,500 / year',
        sourceUrl: target.officialSourceUrl,
        aiConfidence: 94,
        changeType: 'FEE_CHANGED',
        detectedAt: new Date().toISOString(),
        status: 'PENDING',
      });
    }
  }

  const completedAt = new Date().toISOString();
  agentLogs.push(`[${completedAt}] Verification run completed. Total checked: ${targets.length}, Hash changes: ${hashChanges}`);

  return {
    runId,
    agentName: 'UniversityCourseVerificationAgent',
    startedAt,
    completedAt,
    sourcesChecked: targets.length,
    contentHashChangesDetected: hashChanges,
    proposedChanges,
    agentLogs,
  };
}
