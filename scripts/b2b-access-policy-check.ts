/**
 * B2B PARTNER + EMPLOYEE ACCESS — POLICY CHECK
 * ============================================
 * Runnable acceptance check for the master-control rules: ALO Super Admin
 * authority, the 3-seat partner limit, the five partner role types, the
 * 15-image / 10-video / 30-second marketing rules, the student-benefit gate
 * (no active ALO application → no voucher), token masking and B2B visibility.
 *
 *   npx tsx scripts/b2b-access-policy-check.ts
 *
 * Needs no database, no provider credentials and no model. Failure exits non-zero.
 */

import {
  isAloMasterRole, canManageMasterControl, EMPLOYEE_DESIGNATIONS, EMPLOYEE_PROFILE_STATUSES,
  normaliseProfileStatus, canEmployeeLogin, EMPLOYEE_PRIVATE_FIELDS, canViewEmployeePrivateProfile,
  redactEmployeePrivateFields, PARTNER_PACKAGES, DEFAULT_PARTNER_USER_LIMIT, resolveEffectiveLimits,
  ALO_HARD_VIDEO_CEILING_SECONDS, canCreatePartnerUser, PARTNER_USER_ROLES, PARTNER_ASSIGNABLE_ROLES,
  ALO_ONLY_PERMISSIONS, validatePartnerUserCreation, checkMarketingQuota, quotaMessage,
  checkVideoDuration, decideMarketingPublish, usagePeriod, isNewQuotaPeriod,
  BENEFIT_TYPES, hasActiveAloApplication, canUseStudentBenefit, benefitLimitFor, planBenefitIssuance,
  formatVoucherCode, canUseVoucher, maskSocialToken, evaluateSocialAccountView, canViewB2BDetails,
  notificationsFor, quotaWarning, ACCESS_CONTROL_SECTIONS, accessControlFeatureKeys, accessControlSection,
} from '../src/lib/partner/entitlement-policy';
import { STARTER_SEAT_LIMIT, STARTER_IMAGE_LIMIT, STARTER_VIDEO_LIMIT, STARTER_VIDEO_DURATION_SECONDS } from '../src/lib/access-check-engine';

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { if (c) { pass++; console.log(`PASS  ${n}`); } else { fail++; console.log(`FAIL  ${n}${d ? '  ' + d : ''}`); } };

console.log('── ALO master control ──');
check('chairman and super admin hold master control', isAloMasterRole(['chairman']) && isAloMasterRole(['SUPER_ADMIN']));
check('a partner super admin does NOT hold ALO master control', !isAloMasterRole(['partner_super_admin']));
check('a counselor cannot manage master control', !canManageMasterControl(['counselor', 'employee']));
check('engine and policy agree on starter numbers (single source)',
  STARTER_SEAT_LIMIT === 3 && STARTER_IMAGE_LIMIT === 15 && STARTER_VIDEO_LIMIT === 10 && STARTER_VIDEO_DURATION_SECONDS === 30);

console.log('── employee catalogue + login gate ──');
check('all 17 designations exist', EMPLOYEE_DESIGNATIONS.length === 17 && EMPLOYEE_DESIGNATIONS.includes('Visa Officer') && EMPLOYEE_DESIGNATIONS.includes('Front Desk'));
check('all 8 profile statuses exist', EMPLOYEE_PROFILE_STATUSES.length === 8);
check('status normalisation accepts stored spellings', normaliseProfileStatus('Under Review') === 'under_review' && normaliseProfileStatus('CORRECTION-REQUIRED') === 'correction_required');
check('no login before the password is created', canEmployeeLogin({ passwordCreated: false, profileStatus: 'approved' }).allowed === false);
check('an activated employee can log in', canEmployeeLogin({ passwordCreated: true, profileStatus: 'under_review' }).allowed === true);
check('a terminated employee cannot log in', canEmployeeLogin({ passwordCreated: true, profileStatus: 'terminated' }).allowed === false);

console.log('── employee private profile privacy ──');
const emp = { id: 'E1', designation: 'Counselor' };
check('employee sees own profile', canViewEmployeePrivateProfile({ userId: 'u1', roles: ['employee'], employeeId: 'E1' }, emp).allowed === true);
check('super admin sees it', canViewEmployeePrivateProfile({ userId: 'u9', roles: ['super_admin'] }, emp).allowed === true);
check('HR manager WITH permission sees it', canViewEmployeePrivateProfile({ userId: 'u2', roles: ['hr_manager'], hasHrPermission: true }, emp).allowed === true);
check('HR manager WITHOUT permission is refused', canViewEmployeePrivateProfile({ userId: 'u2', roles: ['hr_manager'] }, emp).allowed === false);
check('a manager cannot view salary', canViewEmployeePrivateProfile({ userId: 'u3', roles: ['manager'] }, emp).allowed === false);
check('a colleague cannot view another employee', canViewEmployeePrivateProfile({ userId: 'u4', roles: ['employee'], employeeId: 'E2' }, emp).allowed === false);
check('salary/NID/bank/emergency/HR docs are private', ['salary', 'nid', 'bankDetails', 'emergencyContact', 'hrDocuments'].every((f) => (EMPLOYEE_PRIVATE_FIELDS as readonly string[]).includes(f)));
const redacted: any = redactEmployeePrivateFields({ id: 'E1', name: 'Rahim', salary: 90000, nid: '123', bankDetails: 'x' }, canViewEmployeePrivateProfile({ userId: 'u4', roles: ['employee'], employeeId: 'E2' }, emp));
check('private fields are stripped server-side', redacted.name === 'Rahim' && redacted.salary === undefined && redacted.nid === undefined && redacted.redacted.includes('salary'));

console.log('── partner packages, seats, users ──');
check('starter default user limit is 3 (1 super admin + 2 employees)', DEFAULT_PARTNER_USER_LIMIT === 3);
check('starter quotas: 15 images / 10 videos / 30s', PARTNER_PACKAGES.starter.monthlyImageLimit === 15 && PARTNER_PACKAGES.starter.monthlyVideoLimit === 10 && PARTNER_PACKAGES.starter.videoDurationLimitSeconds === 30);
check('three package types exist', Object.keys(PARTNER_PACKAGES).length === 3);
const withOverride = resolveEffectiveLimits({ packageSlug: 'starter', overrides: { userLimit: 7, monthlyImageLimit: 40 } });
check('ALO Super Admin overrides apply', withOverride.userLimit === 7 && withOverride.monthlyImageLimit === 40);
check('no override can exceed the ALO hard video ceiling', resolveEffectiveLimits({ overrides: { videoDurationLimitSeconds: 300 } }).videoDurationLimitSeconds === ALO_HARD_VIDEO_CEILING_SECONDS);
check('an unknown package falls back to starter', resolveEffectiveLimits({ packageSlug: 'nonsense' }).slug === 'starter');
check('2 of 3 seats used → one more allowed', canCreatePartnerUser({ currentUserCount: 2, userLimit: 3 }).allowed === true);
const fullSeats = canCreatePartnerUser({ currentUserCount: 3, userLimit: 3 });
check('3 of 3 seats used → refused with the extra-seat message', fullSeats.allowed === false && fullSeats.reason!.includes('request additional seats from ALO Education'));
check('six partner roles, five assignable', PARTNER_USER_ROLES.length === 6 && PARTNER_ASSIGNABLE_ROLES.length === 5 && !PARTNER_ASSIGNABLE_ROLES.includes('partner_super_admin'));
check('ALO-only permissions are enumerated', ALO_ONLY_PERMISSIONS.includes('alo_finance') && ALO_ONLY_PERMISSIONS.includes('audit_log_access'));

const base = { actorRoles: ['partner_super_admin'], actorPartnerId: 'PA', targetPartnerId: 'PA', approvedPermissions: ['students.view', 'leads.manage'] };
check('a valid partner user is allowed', validatePartnerUserCreation({ ...base, role: 'partner_counselor', requestedPermissions: ['students.view'] }).allowed === true);
check('partner cannot create inside another company', validatePartnerUserCreation({ ...base, targetPartnerId: 'PB', role: 'partner_counselor', requestedPermissions: [] }).code === 'TENANT_MISMATCH');
check('partner cannot create an ALO staff role', validatePartnerUserCreation({ ...base, role: 'counselor', requestedPermissions: [] }).code === 'INVALID_ROLE');
check('partner cannot appoint another Partner Super Admin', validatePartnerUserCreation({ ...base, role: 'partner_super_admin', requestedPermissions: [] }).code === 'SUPER_ADMIN_ASSIGNMENT_REQUIRED');
check('ALO-only permissions refused outright', validatePartnerUserCreation({ ...base, role: 'partner_counselor', requestedPermissions: ['alo_finance'] }).code === 'ALO_ONLY_PERMISSION');
check('permissions outside the approved package refused', validatePartnerUserCreation({ ...base, role: 'partner_counselor', requestedPermissions: ['payroll.manage'] }).code === 'OUTSIDE_APPROVED_PACKAGE');

console.log('── marketing quota + the 30-second video rule ──');
const limits = resolveEffectiveLimits({ packageSlug: 'starter' });
check('14 of 15 images → allowed', checkMarketingQuota({ asset: 'image', imagesUsed: 14, videosUsed: 0, limits }).allowed === true);
const imagesFull = checkMarketingQuota({ asset: 'image', imagesUsed: 15, videosUsed: 0, limits });
check('15 of 15 images → exact spec message', imagesFull.allowed === false && imagesFull.message === 'Monthly image quota finished. Request extra quota from ALO Education.');
const videosFull = checkMarketingQuota({ asset: 'video', imagesUsed: 0, videosUsed: 10, limits });
check('10 of 10 videos → exact spec message', videosFull.allowed === false && videosFull.message === 'Monthly video quota finished. Request extra quota from ALO Education.');
check('a zero limit never allows generation', checkMarketingQuota({ asset: 'video', imagesUsed: 0, videosUsed: 0, limits: { monthlyImageLimit: 15, monthlyVideoLimit: 0 } }).allowed === false);
check('30 seconds is accepted', checkVideoDuration({ requestedSeconds: 30, limits }).allowed === true);
const tooLong = checkVideoDuration({ requestedSeconds: 31, limits });
check('31 seconds is rejected', tooLong.allowed === false && tooLong.maxSeconds === 30);
check('an over-ceiling override still caps at 30', checkVideoDuration({ requestedSeconds: 45, limits: resolveEffectiveLimits({ overrides: { videoDurationLimitSeconds: 120 } }) }).allowed === false);
check('publishing needs an approved social account', decideMarketingPublish({ partnerApproved: true, limits, socialAccountApproved: false }).state === 'blocked');
check('publishing needs ALO approval when the package requires it', decideMarketingPublish({ partnerApproved: true, limits, socialAccountApproved: true }).state === 'awaiting_alo_approval');
check('partner approval is still required after ALO review', decideMarketingPublish({ partnerApproved: false, limits, socialAccountApproved: true, aloApproved: true }).state === 'awaiting_partner_approval');
check('auto-publish stays off unless ALO enables it', decideMarketingPublish({ partnerApproved: true, limits, socialAccountApproved: true, aloApproved: true }).state === 'ready_to_schedule');
check('auto-publish enabled by ALO → can publish', decideMarketingPublish({ partnerApproved: true, limits: resolveEffectiveLimits({ overrides: { autoPublishAllowed: true, requiresAloApproval: false } }), socialAccountApproved: true }).canPublish === true);
check('quota period is the real calendar month', usagePeriod(new Date('2026-10-31T23:00:00Z')) === '2026-10');
check('a new month resets the period', isNewQuotaPeriod('2026-09', new Date('2026-10-01T00:00:00Z')) === true && isNewQuotaPeriod('2026-10', new Date('2026-10-15T00:00:00Z')) === false);

console.log('── student benefits + vouchers (no application, no voucher) ──');
check('six benefit types', BENEFIT_TYPES.length === 6 && BENEFIT_TYPES.includes('UKVI_INTERVIEW_PREP') && BENEFIT_TYPES.includes('ENGLISH_MOCK_TEST'));
check('a draft application is NOT active', hasActiveAloApplication([{ stage: 'APPLICATION_DRAFT' }]) === false);
check('document review is NOT active', hasActiveAloApplication([{ stage: 'DOCUMENT_REVIEW' }]) === false);
check('submitted to ALO IS active', hasActiveAloApplication([{ stage: 'SUBMITTED_TO_ALO_APPLICATION_TEAM' }]) === true);
check('a CAS received IS active', hasActiveAloApplication([{ stage: 'CAS_RECEIVED' }]) === true);
check('closed is NOT active', hasActiveAloApplication([{ stage: 'CLOSED' }]) === false);
check('rejected BEFORE submission is not eligible', hasActiveAloApplication([{ stage: 'REJECTED' }]) === false);
check('rejected AFTER submission stays eligible (spec caveat)', hasActiveAloApplication([{ stage: 'REJECTED', submitted: true }]) === true);
check('an unknown stage is refused by default', hasActiveAloApplication([{ stage: 'SOMETHING_NEW' }]) === false);
check('vouchers are NOT issued for a draft', planBenefitIssuance({ application: { stage: 'APPLICATION_DRAFT' } }).length === 0);
const plan = planBenefitIssuance({ application: { stage: 'SUBMITTED_TO_UNIVERSITY' } });
check('an active application issues the full package', plan.length === 6 && plan.find((p) => p.benefitType === 'ENGLISH_MOCK_TEST')?.limitCount === 3);
const noApp = canUseStudentBenefit({ benefitType: 'ENGLISH_MOCK_TEST', applications: [{ stage: 'APPLICATION_DRAFT' }], entitlement: { limitCount: 3, usedCount: 0 } });
check('a draft application yields no benefit even with an entitlement row', noApp.allowed === false && noApp.reason!.includes('active application through ALO Education'));
const eligible = canUseStudentBenefit({ benefitType: 'ENGLISH_MOCK_TEST', applications: [{ stage: 'SUBMITTED_TO_UNIVERSITY' }], entitlement: { limitCount: 3, usedCount: 0, status: 'active', applicationId: 'A1' }, activeApplicationId: 'A1' });
check('eligible student gets 3 English mock vouchers', eligible.allowed === true && eligible.remaining === 3);
check('the 4th English mock is refused', canUseStudentBenefit({ benefitType: 'ENGLISH_MOCK_TEST', applications: [{ stage: 'SUBMITTED_TO_UNIVERSITY' }], entitlement: { limitCount: 3, usedCount: 3, status: 'active', applicationId: 'A1' }, activeApplicationId: 'A1' }).allowed === false);
check('one interview prep per application', benefitLimitFor('UNIVERSITY_INTERVIEW_PREP') === 1 && benefitLimitFor('UKVI_INTERVIEW_PREP') === 1);
check('a benefit tied to another application is refused', canUseStudentBenefit({ benefitType: 'UKVI_INTERVIEW_PREP', applications: [{ stage: 'SUBMITTED_TO_UNIVERSITY' }], entitlement: { limitCount: 1, usedCount: 0, status: 'active', applicationId: 'A9' }, activeApplicationId: 'A1' }).allowed === false);

const now = new Date('2026-10-13T10:00:00Z');
check('voucher code is readable and prefixed', formatVoucherCode({ testType: 'ENGLISH_MOCK_TEST', random: 'a1b2c3d4' }) === 'ALO-EMT-A1B2C3D4');
check('a fresh voucher is usable', canUseVoucher({ voucher: { studentId: 'S1', status: 'available', usedCount: 0, usageLimit: 1 }, studentId: 'S1', now }).allowed === true);
check('another student cannot use it', canUseVoucher({ voucher: { studentId: 'S2', status: 'available', usedCount: 0, usageLimit: 1 }, studentId: 'S1', now }).allowed === false);
check('an expired voucher is refused', canUseVoucher({ voucher: { studentId: 'S1', status: 'available', usedCount: 0, usageLimit: 1, expiresAt: '2026-09-01' }, studentId: 'S1', now }).allowed === false);
check('a used voucher is refused', canUseVoucher({ voucher: { studentId: 'S1', status: 'used', usedCount: 1, usageLimit: 1 }, studentId: 'S1', now }).allowed === false);
check('a cancelled voucher is refused', canUseVoucher({ voucher: { studentId: 'S1', status: 'cancelled', usedCount: 0, usageLimit: 1 }, studentId: 'S1', now }).allowed === false);

console.log('── social tokens + B2B visibility ──');
const masked = maskSocialToken('EAAG1234567890abcdefSECRET');
check('a token is never returned in full', !masked.includes('SECRET') && masked.endsWith('CRET'));
check('a short token is fully masked', maskSocialToken('abc') === '••••');
const soon = evaluateSocialAccountView({ connectionStatus: 'connected', approvedByAlo: true, tokenExpiresAt: '2026-10-16T00:00:00Z' }, now);
check('a soon-expiring token raises a rotate warning', soon.rotateWarning !== null && soon.rotateWarning.includes('expires in'));
const expired = evaluateSocialAccountView({ connectionStatus: 'connected', approvedByAlo: true, tokenExpiresAt: '2026-10-01T00:00:00Z' }, now);
check('an expired token blocks publishing and warns', expired.tokenExpired === true && expired.canPublish === false && expired.rotateWarning!.includes('expired'));
check('an unapproved account cannot publish', evaluateSocialAccountView({ connectionStatus: 'connected', approvedByAlo: false }, now).canPublish === false);
check('a healthy approved account can publish', evaluateSocialAccountView({ connectionStatus: 'connected', approvedByAlo: true, tokenExpiresAt: '2027-01-01T00:00:00Z' }, now).canPublish === true);

check('a partner sees its own application B2B details', canViewB2BDetails({ userId: 'p1', roles: ['partner_super_admin'], partnerId: 'PA' }, { partnerId: 'PA' }).allowed === true);
check('a partner cannot see another partner B2B details', canViewB2BDetails({ userId: 'p1', roles: ['partner_super_admin'], partnerId: 'PA' }, { partnerId: 'PB' }).allowed === false);
check('super admin sees full B2B detail', canViewB2BDetails({ userId: 'a', roles: ['chairman'] }, { partnerId: 'PB' }).scope === 'full');
check('an assigned counselor sees the relationship, not commercial terms', canViewB2BDetails({ userId: 'c1', roles: ['counselor'] }, { partnerId: 'PA', assignedCounselorId: 'c1' }).scope === 'assigned_only');
check('an unrelated counselor sees nothing', canViewB2BDetails({ userId: 'c9', roles: ['counselor'] }, { partnerId: 'PA', assignedCounselorId: 'c1' }).allowed === false);

console.log('── notifications ──');
check('a seat request notifies ALO Super Admin', notificationsFor('seat_request')[0].audience === 'alo_super_admin');
check('a quota decision notifies the partner', notificationsFor('quota_decision')[0].audience === 'partner_super_admin');
check('voucher generation notifies the partner', notificationsFor('voucher_generated')[0].audience === 'partner_super_admin');
check('an unknown event raises nothing', notificationsFor('nonsense').length === 0);
check('a near-limit warning fires around 20% remaining', quotaWarning(2, 15, 'image') !== null && quotaWarning(10, 15, 'image') === null);
check('an exhausted quota returns the finished message', quotaWarning(0, 15, 'image') === quotaMessage('image'));

console.log('── Super Admin Access Control Center ──');
check('all 12 spec-named sections exist', ACCESS_CONTROL_SECTIONS.length === 12);
check('every section names what it governs', ACCESS_CONTROL_SECTIONS.every((s) => s.rule.length > 20 && s.featureKeys.length > 0));
check('every section is backend-enforced, never a view toggle', ACCESS_CONTROL_SECTIONS.every((s) => s.backendEnforced === true));
const labels = ACCESS_CONTROL_SECTIONS.map((s) => s.label);
check('the spec section list is present verbatim', ['ALO Employee Roles', 'B2B Partner Packages', 'Partner User Seat Limits', 'Partner Marketing Quotas', 'Partner Student Benefit Rules', 'Mock Test Voucher Rules', 'Application / B2B Visibility', 'Document Access', 'Salary / HR Access', 'AI Feature Access', 'Social Media Posting Access', 'Email / SMS / WhatsApp Sending Limits'].every((l) => labels.includes(l)));
check('feature keys are de-duplicated', accessControlFeatureKeys().length === new Set(accessControlFeatureKeys()).size);
check('a section can be looked up by key', accessControlSection('salary_hr_access')?.label === 'Salary / HR Access');
check('an unknown section returns null', accessControlSection('nonsense') === null);

console.log(`\n${fail === 0 ? 'ALL B2B/EMPLOYEE CHECKS PASS' : 'FAILURES PRESENT'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
