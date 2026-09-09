import { describe, it, expect } from 'vitest';
import { runWeeklyUniversityVerificationAgent, computeContentHash } from '../../src/lib/verification-agent';
import { processApprovalDecision, ProposedFieldChange } from '../../src/lib/approval-queue';

describe('Weekly AI University Verification Agent Suite', () => {

  it('Computes SHA-256 content hashes consistently', () => {
    const hash1 = computeContentHash('Hello World');
    const hash2 = computeContentHash('Hello World');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('Detects content hash change and creates approval queue items', async () => {
    const targets = [
      {
        universityId: 'UNI-001',
        universityName: 'University of Oxford',
        courseId: 'CRS-0001',
        courseTitle: 'MSc Data Science',
        officialSourceUrl: 'https://www.oxford.ac.uk/courses/msc-data-science',
        lastContentHash: 'OLD_HASH_VAL_12345',
      },
    ];

    const result = await runWeeklyUniversityVerificationAgent(targets);
    expect(result.sourcesChecked).toBe(1);
    expect(result.contentHashChangesDetected).toBe(1);
    expect(result.proposedChanges.length).toBe(1);
    expect(result.proposedChanges[0].aiConfidence).toBeGreaterThanOrEqual(90);
    expect(result.proposedChanges[0].status).toBe('PENDING');
  });

  it('Processes Super Admin Approve & Reject decisions on proposed changes', () => {
    const change: ProposedFieldChange = {
      id: 'CHG-1',
      entityType: 'Course',
      entityId: 'CRS-1',
      entityName: 'MSc Data Science',
      fieldName: 'tuition_fee',
      currentValue: '$30,000',
      proposedValue: '$32,000',
      sourceUrl: 'https://www.oxford.ac.uk',
      aiConfidence: 95,
      changeType: 'FEE_CHANGED',
      detectedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const approved = processApprovalDecision(change, 'APPROVE', 'SUPER_ADMIN_1');
    expect(approved.status).toBe('APPROVED');
    expect(approved.reviewedBy).toBe('SUPER_ADMIN_1');

    const rejected = processApprovalDecision(change, 'REJECT', 'SUPER_ADMIN_1', undefined, 'Incorrect fee.');
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('Incorrect fee.');
  });
});
