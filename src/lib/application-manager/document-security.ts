import { canViewB2B } from '@/lib/application-manager/service';

type DocumentActor = {
  userId: string;
  userType: string;
  roles: string[];
  permissions: string[];
  partnerId?: string;
};

export function isB2bConfidentialApplication(application: any): boolean {
  return application?.isB2b === true || application?.isB2bConfidential === true ||
    String(application?.applicationSource || '').toUpperCase().startsWith('B2B_') ||
    String(application?.stage || '').toUpperCase().includes('B2B');
}

export function isB2bConfidentialDocument(document: any): boolean {
  return document?.isB2bConfidential === true ||
    ['b2b_confidential', 'b2b_internal'].includes(String(document?.visibility || '').toLowerCase());
}

/**
 * Application Manager/Team can review ordinary application documents. Any
 * other reviewer must hold the explicit review permission and be assigned to
 * the application (unless they also hold application.view_all). B2B documents
 * require the separate B2B capability in addition to document-review access.
 */
export function canReviewApplicationDocument(actor: DocumentActor, application: any, document: any): boolean {
  const roles = actor.roles.map((role) => role.toLowerCase());
  if (actor.partnerId || actor.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')) ||
      actor.userType.toLowerCase() === 'student' || roles.includes('student')) return false;

  const globalReviewer = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role));
  if (!globalReviewer && !actor.permissions.includes('application.review_documents')) return false;
  if ((isB2bConfidentialApplication(application) || isB2bConfidentialDocument(document)) && !canViewB2B(actor.roles, actor.permissions)) return false;
  if (globalReviewer || actor.permissions.includes('application.view_all')) return true;
  return [application?.counselorId, application?.applicationOfficer, application?.appTeamOfficerId, application?.visaOfficerId]
    .includes(actor.userId);
}

/** Normal API responses contain identifiers and review metadata, never file paths, storage keys, or arbitrary URLs. */
export function sanitizeApplicationDocumentResponse<T extends Record<string, any>>(document: T): Partial<T> {
  const safe: Record<string, any> = {};
  for (const field of [
    'id', 'applicationId', 'documentType', 'fileName', 'status', 'reviewerId',
    'reviewerNote', 'visibility', 'version', 'isB2bConfidential', 'createdAt', 'updatedAt', 'reviewNote',
  ]) {
    if (Object.prototype.hasOwnProperty.call(document, field)) safe[field] = document[field];
  }
  return safe as Partial<T>;
}
