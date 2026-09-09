// ALO Education — Super Admin Field-Level Change Approval Queue Engine
// Manages staged AI/Import field changes, confidence scores, and rollback actions

export type ChangeType =
  | 'NEW_UNIVERSITY'
  | 'NEW_COURSE'
  | 'FEE_CHANGED'
  | 'ACADEMIC_REQUIREMENT_CHANGED'
  | 'ENGLISH_REQUIREMENT_CHANGED'
  | 'DEADLINE_CHANGED'
  | 'INTERNATIONAL_STATUS_CHANGED'
  | 'COURSE_CLOSED';

export interface ProposedFieldChange {
  id: string;
  entityType: 'University' | 'Course' | 'Requirement' | 'Fee';
  entityId: string;
  entityName: string;
  fieldName: string;
  currentValue: any;
  proposedValue: any;
  sourceUrl: string;
  aiConfidence: number; // 0 to 100
  changeType: ChangeType;
  detectedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ROLLED_BACK';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export function processApprovalDecision(
  change: ProposedFieldChange,
  action: 'APPROVE' | 'REJECT' | 'EDIT_AND_APPROVE' | 'ROLLBACK',
  reviewerId: string,
  editedValue?: any,
  rejectionReason?: string
): ProposedFieldChange {
  const timestamp = new Date().toISOString();
  const updated = { ...change, reviewedBy: reviewerId, reviewedAt: timestamp };

  switch (action) {
    case 'APPROVE':
      updated.status = 'APPROVED';
      break;
    case 'EDIT_AND_APPROVE':
      updated.status = 'APPROVED';
      if (editedValue !== undefined) {
        updated.proposedValue = editedValue;
      }
      break;
    case 'REJECT':
      updated.status = 'REJECTED';
      updated.rejectionReason = rejectionReason || 'Rejected by Super Admin review.';
      break;
    case 'ROLLBACK':
      updated.status = 'ROLLED_BACK';
      break;
  }

  return updated;
}
