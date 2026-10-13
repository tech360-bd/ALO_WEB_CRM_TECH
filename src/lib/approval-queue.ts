
// ALO Education — Super Admin Field-Level Change Approval Queue Engine

export type ChangeType =
  | 'NEW_UNIVERSITY'
  | 'NEW_COURSE'
  | 'FEE_CHANGED'
  | 'ACADEMIC_REQUIREMENT_CHANGED'
  | 'ENGLISH_REQUIREMENT_CHANGED'
  | 'DEADLINE_CHANGED'
  | 'INTERNATIONAL_STATUS_CHANGED'
  | 'COURSE_CLOSED';

export type ChangeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ROLLED_BACK';

export type ApprovalAction =
  | 'APPROVE'
  | 'REJECT'
  | 'EDIT_AND_APPROVE'
  | 'ROLLBACK';

export interface ProposedFieldChange {
  id: string;
  entityType: 'University' | 'Course' | 'Requirement' | 'Fee';
  entityId: string;
  entityName: string;
  fieldName: string;
  currentValue: any;
  proposedValue: any;
  sourceUrl: string;
  aiConfidence: number;
  changeType: ChangeType;
  detectedAt: string;
  status: ChangeStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export function processApprovalDecision(
  change: ProposedFieldChange,
  action: ApprovalAction,
  reviewerId: string,
  editedValue?: any,
  rejectionReason?: string,
  isAuthorizedReviewer = false
): ProposedFieldChange {
  if (!isAuthorizedReviewer) {
    throw new Error(
      'Authorization required: SUPER_ADMIN or approved reviewer permission'
    );
  }

  if (!reviewerId?.trim()) {
    throw new Error('Valid reviewer identity required');
  }

  if (
    !Number.isFinite(change.aiConfidence) ||
    change.aiConfidence < 0 ||
    change.aiConfidence > 100
  ) {
    throw new Error('AI confidence must be between 0 and 100');
  }

  const timestamp = new Date().toISOString();

  // Handle rollback before finalized-state validation.
  if (action === 'ROLLBACK') {
    if (change.status !== 'APPROVED') {
      throw new Error('Rollback requires an APPROVED change');
    }

    // Database restoration must be performed by the caller.
    return {
      ...change,
      status: 'ROLLED_BACK',
      reviewedBy: reviewerId,
      reviewedAt: timestamp,
    };
  }

  // Only pending changes can be approved or rejected.
  if (change.status !== 'PENDING') {
    throw new Error(
      `State transition blocked: current status ${change.status}`
    );
  }

  const updated: ProposedFieldChange = {
    ...change,
    reviewedBy: reviewerId,
    reviewedAt: timestamp,
  };

  switch (action) {
    case 'APPROVE':
      updated.status = 'APPROVED';
      updated.rejectionReason = undefined;
      break;

    case 'EDIT_AND_APPROVE':
      if (editedValue === undefined) {
        throw new Error(
          'Edited value required for EDIT_AND_APPROVE'
        );
      }

      updated.status = 'APPROVED';
      updated.proposedValue = editedValue;
      updated.rejectionReason = undefined;
      break;

    case 'REJECT':
      updated.status = 'REJECTED';
      updated.rejectionReason =
        rejectionReason?.trim() ||
        'Rejected by Super Admin review.';
      break;

    default: {
      const exhaustive: never = action;
      throw new Error(`Unsupported action: ${exhaustive}`);
    }
  }

  return updated;
}
