/**
 * DOCUMENT ACCESS, LIFECYCLE & PROFILE-SECTION CHECK
 * ==================================================
 * Executable proof of the rules that were broken or missing, so they can be
 * re-verified after any later change:
 *
 *   • IDOR: an unassigned or unknown student must DENY (the original defect was to
 *     allow), and a counselor must not reach another counselor's student.
 *   • Only reviewer roles may approve/reject; only admin/super-admin may delete.
 *   • A partner student without an ALO application is not visible to internal staff.
 *   • Both document tables normalise into one shape, and never expose storage paths.
 *   • Three (and more) uploads are retained; a replacement is created as PENDING and
 *     the previous verified version survives until the replacement is verified.
 *   • Retry of the same bytes in the same slot is detected as a duplicate.
 *   • Student Profile repeatable sections validate and stay independent.
 *
 *   npx tsx scripts/document-access-policy-check.ts
 *
 * No database, no credentials, no model required. Failure exits non-zero.
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  canReviewDocuments, canDeleteDocuments, canStaffAccessStudentDocuments, normaliseReviewState,
  fromStudentDocument, fromPortalDocument, mergeDocumentViews, nextVersionFor,
  initialStatusForReplacement, versionReviewImpact, isDuplicateUpload,
} from '../src/lib/documents/document-access';
import {
  validateEducation, validateWork, validateEnglishTest, validateVisaRefusal, validatePersonalInfo,
  normaliseQualificationType, normaliseEnglishTestName, visaRefusalConsistency, redactSensitivePersonal,
  isIsoDate, missingProfileSections, QUALIFICATION_TYPES, ENGLISH_TEST_NAMES,
} from '../src/lib/student-profile/profile-sections';

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { if (c) { pass++; console.log(`PASS  ${n}`); } else { fail++; console.log(`FAIL  ${n}${d ? '  ' + d : ''}`); } };

console.log('── role policy: review and delete ──');
check('application team / visa officer / admin may review', canReviewDocuments(['application_team']) && canReviewDocuments(['visa_officer']) && canReviewDocuments(['admin']));
check('counselor, viewer and partner roles may NOT review',
  !canReviewDocuments(['counselor']) && !canReviewDocuments(['viewer']) && !canReviewDocuments(['partner_super_admin']) && !canReviewDocuments(['partner_counselor']));
check('only admin/super admin may delete', canDeleteDocuments(['admin']) && canDeleteDocuments(['super_admin']));
check('counselor, partner, viewer and finance may NOT delete',
  !canDeleteDocuments(['counselor']) && !canDeleteDocuments(['partner_super_admin']) && !canDeleteDocuments(['viewer']) && !canDeleteDocuments(['finance_officer']));

console.log('── IDOR: unassigned / unknown student must DENY ──');
const unassigned = canStaffAccessStudentDocuments({ userId: 'staff-1', roles: ['counselor'] }, { studentId: 'S1', counselorId: '', found: true });
check('a counselor cannot read an UNASSIGNED student', unassigned.allowed === false);
check('an unknown student is denied', canStaffAccessStudentDocuments({ userId: 'staff-1', roles: ['counselor'] }, { found: false }).allowed === false);
check('a counselor cannot read another counselor\'s student', canStaffAccessStudentDocuments({ userId: 'staff-1', roles: ['counselor'] }, { studentId: 'S1', counselorId: 'staff-9', found: true }).allowed === false);
const assigned = canStaffAccessStudentDocuments({ userId: 'staff-1', roles: ['counselor'] }, { studentId: 'S1', counselorId: 'staff-1', found: true });
check('the assigned counselor IS allowed', assigned.allowed === true && assigned.via === 'assigned_counselor');
check('being assigned grants neither review nor delete', assigned.canReview === false && assigned.canDelete === false);
check('a viewer role is refused even when named as counselor', canStaffAccessStudentDocuments({ userId: 'v1', roles: ['viewer'] }, { studentId: 'S1', counselorId: 'v1', found: true }).allowed === false);
check('an application-team reviewer is allowed and may review', canStaffAccessStudentDocuments({ userId: 's2', roles: ['application_team'] }, { studentId: 'S1', found: true }).canReview === true);
check('admin is allowed and may delete', canStaffAccessStudentDocuments({ userId: 'a1', roles: ['admin'] }, { studentId: 'S1', found: true }).canDelete === true);
check('a partner student with no ALO application is refused to internal staff',
  canStaffAccessStudentDocuments({ userId: 's3', roles: ['finance_officer'] }, { studentId: 'S1', isPartnerStudent: true, hasActiveAloApplication: false, found: true }).allowed === false);
check('the same student is accessible once an application exists',
  canStaffAccessStudentDocuments({ userId: 's3', roles: ['application_team'] }, { studentId: 'S1', isPartnerStudent: true, hasActiveAloApplication: true, found: true }).allowed === true);
check('admin oversight still reaches a partner student without an application',
  canStaffAccessStudentDocuments({ userId: 'a1', roles: ['super_admin'] }, { studentId: 'S1', isPartnerStudent: true, hasActiveAloApplication: false, found: true }).allowed === true);

console.log('── cross-portal normalisation ──');
check('both status vocabularies map to one review state',
  normaliseReviewState('verified') === 'verified' && normaliseReviewState('approved') === 'verified' &&
  normaliseReviewState('needs_update') === 'rejected' && normaliseReviewState('pending') === 'pending');
const studentDoc = fromStudentDocument({ id: 'd1', studentId: 'S1', category: 'PASSPORT', fileName: 'p.pdf', storagePath: '/private/x', status: 'verified', version: 2, createdAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-02') });
check('a StudentDocument keeps its version and hides the storage path', studentDoc.version === 2 && !('storagePath' in studentDoc) && studentDoc.hasFile === true);
const portalDoc = fromPortalDocument({ id: 'p1', studentProfileId: 'PP1', name: 'Bank Statement', fileName: 'b.pdf', storagePath: '/private/y', status: 'approved', createdAt: new Date('2026-10-03'), updatedAt: new Date('2026-10-03') }, 'S1');
check('a PortalStudentDocument lands on the same shape', portalDoc.source === 'portal_student_document' && portalDoc.reviewState === 'verified' && portalDoc.studentId === 'S1');
const merged = mergeDocumentViews({ studentDocuments: [{ id: 'd1', studentId: 'S1', category: 'PASSPORT', fileName: 'p.pdf', createdAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-01') }], portalDocuments: [{ id: 'p1', studentProfileId: 'PP1', name: 'Bank', fileName: 'b.pdf', createdAt: new Date('2026-10-03'), updatedAt: new Date('2026-10-03') }], studentIdForProfile: () => 'S1' });
check('both portals appear in ONE staff list', merged.length === 2 && merged[0].id === 'p1');
check('the merged list is newest-first', merged[0].createdAt > merged[1].createdAt);

console.log('── versioning: three uploads retained, never overwritten ──');
check('first upload is v1 with no predecessor', nextVersionFor({ existingVersions: [] }).version === 1);
check('resubmission after rejection is v2 chained to v1', nextVersionFor({ existingVersions: [{ id: 'a', version: 1, reviewState: 'rejected' }] }).previousVersionId === 'a');
const v3 = nextVersionFor({ existingVersions: [{ id: 'a', version: 1, reviewState: 'rejected' }, { id: 'b', version: 2, reviewState: 'rejected' }] });
check('a third upload is v3 with BOTH prior versions retained', v3.version === 3 && v3.previousVersionId === 'b');
const v4 = nextVersionFor({ existingVersions: [{ id: 'a', version: 1, reviewState: 'rejected' }, { id: 'b', version: 2, reviewState: 'rejected' }, { id: 'c', version: 3, reviewState: 'verified' }] });
check('NO hard maximum — a fourth correction is allowed', v4.version === 4 && v4.priorVerifiedVersionId === 'c');
check('a replacement is created as PENDING, never auto-verified', initialStatusForReplacement() === 'pending');
check('the previous verified version survives until the replacement is verified', versionReviewImpact(true).supersedePreviousVerified === true && versionReviewImpact(true).message.includes('stays available until'));
check('a duplicate retry in the same slot is detected', isDuplicateUpload({ fileHash: 'abc', category: 'PASSPORT', existing: [{ fileHash: 'ABC', category: 'passport', reviewState: 'pending' }] }) === true);
check('re-uploading identical bytes after REJECTION is allowed', isDuplicateUpload({ fileHash: 'abc', category: 'PASSPORT', existing: [{ fileHash: 'abc', category: 'PASSPORT', reviewState: 'rejected' }] }) === false);

console.log('── Student Profile: education ──');
check('all five qualification types exist', QUALIFICATION_TYPES.length === 5);
check('qualification spellings normalise', normaliseQualificationType('SSC / O Level') === 'SSC_O_LEVEL' && normaliseQualificationType('HSC') === 'HSC_A_LEVEL' && normaliseQualificationType('Postgraduate') === 'MASTER');
check('an unknown qualification is refused', normaliseQualificationType('PhD by coursework') === null);
check('institution is required', validateEducation({ qualificationType: 'BACHELOR', institution: '' }).valid === false);
check('a valid qualification passes', validateEducation({ qualificationType: 'BACHELOR', institution: 'BUET', endYear: '2024', resultScore: '3.75' }).valid === true);
check('a GPA is accepted and a percentage is accepted', validateEducation({ qualificationType: 'HSC_A_LEVEL', institution: 'NDC', endYear: '2019', resultScore: '5.00' }).valid && validateEducation({ qualificationType: 'HSC_A_LEVEL', institution: 'NDC', endYear: '2019', resultScore: '78%' }).valid);
check('a bad result value is rejected', validateEducation({ qualificationType: 'HSC_A_LEVEL', institution: 'NDC', endYear: '2019', resultScore: 'excellent' }).valid === false);
check('passing year before start year is rejected', validateEducation({ qualificationType: 'MASTER', institution: 'DU', startYear: '2020', endYear: '2018' }).valid === false);
check('a non-year passing value is rejected', validateEducation({ qualificationType: 'SSC_O_LEVEL', institution: 'X', endYear: '24' }).valid === false);
check('two qualifications produce two independent values', validateEducation({ qualificationType: 'SSC_O_LEVEL', institution: 'A' }).value.institution !== validateEducation({ qualificationType: 'HSC_A_LEVEL', institution: 'B' }).value.institution);

console.log('── Student Profile: work experience ──');
const now = new Date('2026-10-13T00:00:00Z');
check('company name is required', validateWork({ companyName: '' }, now).valid === false);
check('a current position with no end date is ALLOWED', validateWork({ companyName: 'ALO', startDate: '2024-01', currentlyWorking: true }, now).valid === true);
check('a current position WITH an end date is rejected', validateWork({ companyName: 'ALO', startDate: '2024-01', endDate: '2025-01', currentlyWorking: true }, now).valid === false);
check('a past position needs an end date', validateWork({ companyName: 'ALO', startDate: '2020-01' }, now).valid === false);
check('end before start is rejected', validateWork({ companyName: 'ALO', startDate: '2024-01', endDate: '2023-01' }, now).valid === false);
check('a future start date is rejected', validateWork({ companyName: 'ALO', startDate: '2030-01', currentlyWorking: true }, now).valid === false);
check('responsibilities are preserved into the job role column', String(validateWork({ companyName: 'ALO', startDate: '2020-01', endDate: '2021-01', responsibilities: 'Managed student files' }, now).value.jobRole) === 'Managed student files');

console.log('── Student Profile: English proficiency ──');
check('all six test names exist', ENGLISH_TEST_NAMES.length === 6);
check('IELTS UKVI is NOT flattened into IELTS', normaliseEnglishTestName('IELTS UKVI') === 'IELTS_UKVI' && normaliseEnglishTestName('IELTS') === 'IELTS');
check('Duolingo, TOEFL, PTE and Kaplan are recognised', normaliseEnglishTestName('Duolingo') === 'DUOLINGO' && normaliseEnglishTestName('TOEFL') === 'TOEFL' && normaliseEnglishTestName('PTE') === 'PTE' && normaliseEnglishTestName('Kaplan') === 'KAPLAN');
check('a valid IELTS record passes', validateEnglishTest({ testName: 'IELTS', testDate: '2026-01-10', expirationDate: '2028-01-10', overallScore: 7.5 }, now).valid === true);
check('individual scores are optional', validateEnglishTest({ testName: 'DUOLINGO', overallScore: 120 }, now).valid === true);
check('expiry before the test date is rejected', validateEnglishTest({ testName: 'IELTS', testDate: '2026-01-10', expirationDate: '2025-01-10', overallScore: 6 }, now).valid === false);
check('a future test date is rejected', validateEnglishTest({ testName: 'IELTS', testDate: '2027-01-10', overallScore: 6 }, now).valid === false);
check('an out-of-range score is rejected', validateEnglishTest({ testName: 'IELTS', overallScore: 200 }, now).valid === false);
check('NO assumption is made about an expiry window the provider did not state', validateEnglishTest({ testName: 'PTE', testDate: '2020-01-01', overallScore: 60 }, now).valid === true);
check('two test records stay independent', validateEnglishTest({ testName: 'IELTS', overallScore: 6 }, now).value.testName !== validateEnglishTest({ testName: 'TOEFL', overallScore: 90 }, now).value.testName);

console.log('── Student Profile: visa refusal + personal info ──');
check('refusal country is required', validateVisaRefusal({ appliedCountry: '' }).valid === false);
check('a valid refusal passes', validateVisaRefusal({ appliedCountry: 'Canada', rejectionDate: '2024-06', reason: 'Funds' }).valid === true);
check('a malformed refusal date is rejected', validateVisaRefusal({ appliedCountry: 'Canada', rejectionDate: 'June 2024' }).valid === false);
check('Yes with no records is flagged', visaRefusalConsistency('yes', 0).consistent === false);
check('No with records present is flagged', visaRefusalConsistency('no', 2).consistent === false);
check('No with no records is consistent', visaRefusalConsistency('no', 0).consistent === true);
check('a future date of birth is rejected', validatePersonalInfo({ dateOfBirth: '2030-01-01' }, now).valid === false);
check('a malformed date of birth is rejected', validatePersonalInfo({ dateOfBirth: '13/10/1999' }, now).valid === false);
check('a bad gender value is rejected', validatePersonalInfo({ gender: 'unspecified' }, now).valid === false);
check('a bad passport number is rejected', validatePersonalInfo({ passportNumber: 'BAD#PASSPORT' }, now).valid === false);
check('a valid passport number passes', validatePersonalInfo({ passportNumber: 'BX1234567' }, now).valid === true);
const redacted: any = redactSensitivePersonal({ fullName: 'Rahim', passportNumber: 'BX1', immigrationHistory: 'x', nid: '1' }, { isOwner: false, isAuthorisedStaff: false });
check('passport/NID/immigration are stripped for unauthorised viewers', redacted.passportNumber === undefined && redacted.nid === undefined && redacted.fullName === 'Rahim');
const own: any = redactSensitivePersonal({ passportNumber: 'BX1' }, { isOwner: true, isAuthorisedStaff: false });
check('the owner still sees their own passport', own.passportNumber === 'BX1');
check('ISO date validation is strict', isIsoDate('2026-10') && isIsoDate('2026-10-13') && !isIsoDate('2026/10/13'));
check('missing sections are reported in portal order', missingProfileSections({ hasPersonalInfo: true, educationCount: 0, englishTestCount: 0, hasEmergencyContact: false, documentCount: 0 }).join('|') === 'Educational background|English proficiency|Emergency contact|Documents');

console.log('── Document send enforcement (spec §34) ──');
{
  const root = path.join(__dirname, '..');
  const securitySource = fs.readFileSync(path.join(root, 'src/lib/document-security.ts'), 'utf8');
  const replySource = fs.readFileSync(path.join(root, 'src/app/api/crm/ucc/conversations/[id]/reply/route.ts'), 'utf8');
  const guardAt = replySource.indexOf('resolveAuthorizedDocumentRecipient(');
  const sendAt = replySource.indexOf('sendWhatsAppPrivateMedia(');

  check('the recipient resolver is exported', securitySource.includes('export async function resolveAuthorizedDocumentRecipient'));
  check('the resolver denies by default', /allowed: false,[\s\S]{0,120}severity: 'high'/.test(securitySource));
  check('the resolver recognises official ALO numbers', securitySource.includes('OFFICIAL_NUMBERS'));
  check('the resolver only trusts contacts linked to the student', securitySource.includes('contact.studentId === studentId'));
  check('a contact belonging to another student is refused as critical', securitySource.includes("severity: 'critical'"));
  check('the resolver reads the student record as a last resort', securitySource.includes('normalizeBdPhone(student.phone)'));
  check('the real send path calls the resolver', guardAt > -1);
  check('authorization happens before any provider call', guardAt > -1 && sendAt > -1 && guardAt < sendAt);
  check('a refused send creates a security incident', /createSecurityIncident\(\{[\s\S]{0,600}blocked: true/.test(replySource));
  check('a refused send reports an explicit code', replySource.includes('DOCUMENT_RECIPIENT_NOT_AUTHORIZED'));
  check('a refused send answers 403', /DOCUMENT_RECIPIENT_NOT_AUTHORIZED[\s\S]{0,300}status: 403/.test(replySource));
  check('a refused send is audited', replySource.includes('DOCUMENT_SEND_BLOCKED'));
  check('an accepted send is audited with its decision', replySource.includes('DOCUMENT_SENT'));
  check('an attachment without a student is refused', replySource.includes('not linked to a student and cannot be sent'));
  check('the advisory check_share endpoint still exists', fs.readFileSync(path.join(root, 'src/app/api/documents/security/route.ts'), 'utf8').includes('check_share'));
  check('the document send path verifies private file integrity', replySource.includes("createHash('sha256')") && replySource.includes('integrity check failed'));
}

console.log(`\n${fail === 0 ? 'ALL DOCUMENT & PROFILE CHECKS PASS' : 'FAILURES PRESENT'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
