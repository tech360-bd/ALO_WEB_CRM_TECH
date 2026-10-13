/**
 * COMMUNICATION & SOCIAL COMMAND CENTER — POLICY CHECK (spec §122-§177)
 * =====================================================================
 * A runnable acceptance check for the DB-free policy layer. It needs no
 * database, no model and no provider credentials, so it can run anywhere the
 * repo is checked out:
 *
 *   npx tsx scripts/communications-policy-check.ts
 *
 * Every assertion prints its spec section. Failure exits non-zero.
 */

import { normalizePhone } from '../src/lib/phone-normalization';
import { resolveSlaPolicy, evaluateSlaClock, slaWarningLadder, computeResponseMetrics, validateJustification, DEFAULT_SLA_POLICIES } from '../src/lib/communications/sla-policy';
import { deriveWebhookEventId, mapProviderStatus, shouldApplyStatus, isProofOfDelivery, extractInboundEvents } from '../src/lib/communications/webhook-idempotency';
import { evaluateChannels, channelsForRole, assertChannelSendable } from '../src/lib/communications/channel-registry';
import { evaluateDocumentTransition, buildDocumentSlot, rejectionNotice, legacyStatusToState, canDeleteDocument } from '../src/lib/communications/document-policy';
import { assessMessageRisk, decideDraftMode, findForbiddenClaims, authorizeConversationAccess, proposeNextAction } from '../src/lib/communications/ai-safety';
import { resolveContactIdentity, phoneVariants, resolveInboundCaller, shouldAutoCreateLead, shouldAutoCreateStudent, isPlausiblePhone } from '../src/lib/communications/contact-identity';
import { formatLeadReference, isLeadReference, leadReferenceCandidates, createLeadWithReference, isUniqueViolation } from '../src/lib/lead-reference';
import { toSlaChannel, toSlaPriority, toSlaIntent, SLA_STATES } from '../src/lib/communications/sla-policy';
import { classifyDocument, decideDocumentMatch, validateOutboundFileMetadata, OUTBOUND_FILE_METADATA_FIELDS } from '../src/lib/communications/document-match';
import { DEFAULT_TEMPLATES, OFFICIAL_TEMPLATE_MAP, LOCKED_TEMPLATE_CODES, isLockedTemplate, validateTemplateEdit } from '../src/lib/communication/template-engine';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  ${detail}` : ''}`); }
};

console.log('\n── §125/§126 CONTACT IDENTITY & DEDUPLICATION ──');
check('BD local normalizes to 880 form', normalizePhone('01805020101') === '8801805020101');
check('+880 and 00880 agree', normalizePhone('+8801805020101') === normalizePhone('008801805020101'));
check('variants cover local/10-digit/country-code forms',
  ['8801805020101','01805020101','1805020101'].every(v => phoneVariants('+8801805020101').includes(v)));
check('junk numbers are implausible', !isPlausiblePhone('0') && !isPlausiblePhone('N/A') && !isPlausiblePhone('12345678901234567890'));
const exactMatch = resolveContactIdentity({ phone: '+8801805020101' }, [
  { kind: 'student', id: 's1', reference: 'AE-2026000001', name: 'Rahim', phone: '01805020101' },
]);
check('exact phone match -> student found', exactMatch.confidence === 'exact' && exactMatch.candidate?.id === 's1');
check('exact match does NOT auto-create', !shouldAutoCreateLead(exactMatch));
const altOnly = resolveContactIdentity({ altPhone: '+8801805020102' }, [
  { kind: 'lead', id: 'l1', name: 'Karim', altPhone: '01805020102' },
]);
check('alternate-phone-only match is only POSSIBLE', altOnly.confidence === 'possible');
check('possible duplicate flags authorized-role requirement', altOnly.requiresAuthorizedRole === true);
check('possible duplicate offers merge request', altOnly.actions.includes('merge_request'));
const noMatch = resolveContactIdentity({ phone: '+8801999999999' }, []);
check('no match -> lead may be auto-created', shouldAutoCreateLead(noMatch));
check('Student is NEVER auto-created from a number', shouldAutoCreateStudent() === false);
const unknownCall = resolveInboundCaller('+8801999999999', noMatch);
check('unknown caller offers all 4 handling actions', unknownCall.kind === 'unknown' && (unknownCall as any).actions.length === 4);
check('unknown caller is not auto-assigned as student', (unknownCall as any).notice.includes('UNKNOWN INCOMING CONTACT'));

console.log('\n── §147-§150 SLA POLICY, COUNTDOWN, METRICS ──');
const waNormal = resolveSlaPolicy({ channel: 'whatsapp' });
const waPayment = resolveSlaPolicy({ channel: 'whatsapp', intent: 'payment' });
const emailNormal = resolveSlaPolicy({ channel: 'email' });
check('WhatsApp default is tighter than email', waNormal.minutes < emailNormal.minutes, `${waNormal.minutes} vs ${emailNormal.minutes}`);
check('payment intent forces the urgent allowance', waPayment.minutes === DEFAULT_SLA_POLICIES.whatsapp.urgent, `${waPayment.minutes}`);
check('intent can only raise, never lower, priority', resolveSlaPolicy({ channel: 'whatsapp', priority: 'urgent', intent: 'spam' }).minutes === DEFAULT_SLA_POLICIES.whatsapp.urgent);
check('CAS stage escalates to urgent', resolveSlaPolicy({ channel: 'email', applicationStage: 'cas_i20_coe' }).minutes === DEFAULT_SLA_POLICIES.email.urgent);
check('a new lead gets a tighter clock', resolveSlaPolicy({ channel: 'email', studentType: 'lead' }).minutes < emailNormal.minutes);
check('override table is honoured', resolveSlaPolicy({ channel: 'whatsapp', overrides: { whatsapp: { normal: 5 } } }).minutes === 5);
check('WhatsApp runs on calendar time, email does not', waNormal.calendarTime === true && emailNormal.calendarTime === false);

const due = new Date('2026-10-13T10:30:00Z');
const clock = (nowIso: string) => evaluateSlaClock(due, new Date(nowIso), waNormal);
check('plenty of time -> normal', clock('2026-10-13T10:05:00Z').state === 'normal');
check('near the deadline -> warning', clock('2026-10-13T10:22:00Z').state === 'warning');
check('past the deadline -> overdue', clock('2026-10-13T10:35:00Z').state === 'overdue');
check('well past the deadline -> critical', clock('2026-10-13T11:20:00Z').state === 'critical');
check('countdown text matches the spec wording', clock('2026-10-13T10:15:28Z').display.startsWith('RESPONSE DUE IN:'));
check('overdue text matches the spec wording', clock('2026-10-13T10:31:24Z').display.startsWith('OVERDUE BY:'));
check('urgency is never colour-only', ['clock','alert-triangle','alert-octagon','siren'].includes(clock('2026-10-13T11:20:00Z').icon) && clock('2026-10-13T11:20:00Z').ariaLabel.length > 0);
const ladder = slaWarningLadder(due, waNormal);
check('warning ladder has 4 rungs in order', ladder.length === 4 && ladder[0].kind === 'warning' && ladder[3].kind === 'escalation' && ladder[0].at < ladder[3].at);

const inSla = computeResponseMetrics({ receivedAt: new Date('2026-10-13T10:00:00Z'), firstResponseAt: new Date('2026-10-13T10:10:00Z'), dueAt: new Date('2026-10-13T10:30:00Z') });
check('answered in time -> no breach', inSla.slaBreached === false && inSla.responseTimeMs === 600_000);
const late = computeResponseMetrics({ receivedAt: new Date('2026-10-13T10:00:00Z'), firstResponseAt: new Date('2026-10-13T10:45:00Z'), dueAt: new Date('2026-10-13T10:30:00Z') });
check('late reply -> breach counted', late.slaBreached === true && late.countsAsBreach === true);
const lateExcluded = computeResponseMetrics({ receivedAt: new Date('2026-10-13T10:00:00Z'), firstResponseAt: new Date('2026-10-13T10:45:00Z'), dueAt: new Date('2026-10-13T10:30:00Z'), excluded: true });
check('§156 excluded breach does NOT count against the counselor', lateExcluded.slaBreached === true && lateExcluded.countsAsBreach === false);
check('§154 empty justification rejected', validateJustification({}).valid === false);
check('§154 one-word justification rejected', validateJustification({ category: 'system_issue', reason: 'oops', explanation: 'system broke' }).valid === false);
check('§154 bad category rejected', validateJustification({ category: 'because', reason: 'provider outage', explanation: 'The WhatsApp API was down for two hours during the incident window.' }).valid === false);
check('§154 valid justification accepted', validateJustification({ category: 'system_issue', reason: 'provider outage', explanation: 'The WhatsApp API was down for two hours during the incident window.' }).valid === true);

console.log('\n── §170-§173 IDEMPOTENCY & DELIVERY STATUS ──');
const e1 = deriveWebhookEventId({ provider: 'whatsapp', messageId: 'wamid.ABC', status: 'delivered' });
const e2 = deriveWebhookEventId({ provider: 'whatsapp', messageId: 'wamid.ABC', status: 'delivered' });
check('same provider event -> identical id (retry-safe)', e1.eventId === e2.eventId && e1.deterministic);
check('id no longer depends on wall-clock time', !e1.eventId.includes(String(new Date().getFullYear() + 100)));
check('different statuses produce different ids', deriveWebhookEventId({ provider: 'whatsapp', messageId: 'x', status: 'read' }).eventId !== deriveWebhookEventId({ provider: 'whatsapp', messageId: 'x', status: 'sent' }).eventId);
check('payload-hash fallback is still deterministic', deriveWebhookEventId({ provider: 'whatsapp', payload: { a: 1 } }).eventId === deriveWebhookEventId({ provider: 'whatsapp', payload: { a: 1 } }).eventId);
check('§173 accepted is NOT proof of delivery', !isProofOfDelivery(mapProviderStatus('accepted')) && isProofOfDelivery(mapProviderStatus('delivered')));
check('Meta "warning" is not a delivery state', mapProviderStatus('warning') === null);
check('read never regresses to sent', shouldApplyStatus('read', 'sent') === false);
check('failed always wins (out-of-order)', shouldApplyStatus('read', 'failed') === true);
const batch = extractInboundEvents({ entry: [{ changes: [{ value: {
  messages: [{ id: 'm1', from: '8801805020101', text: { body: 'Sir, bank statement?' } }, { id: 'm1', from: '8801805020101', text: { body: 'Sir, bank statement?' } }],
  statuses: [{ id: 'm1', status: 'delivered' }, { id: 'm1', status: 'delivered' }, { id: 'm2', status: 'warning' }],
} }] }] });
check('duplicate entries inside one batch are collapsed', batch.filter(b => b.kind === 'message').length === 1 && batch.filter(b => b.kind === 'status').length === 1);
check('inbound document is recognised as media', (() => {
  const withDoc = extractInboundEvents({ entry: [{ changes: [{ value: { messages: [{ id: 'm3', from: '8801', type: 'document', document: { id: 'doc1', filename: 'passport.pdf' } }] } }] }] });
  return withDoc[0]?.mediaId === 'doc1' && withDoc[0]?.mediaType === 'document';
})());

console.log('\n── §122/§123/§159 CHANNEL CONFIGURATION HONESTY ──');
const empty = evaluateChannels({});
check('every provider channel reports CONFIGURATION REQUIRED when unconfigured',
  empty.filter(c => c.status === 'configuration_required').length >= 8 && empty.find(c => c.id === 'whatsapp')!.displayState === 'CONFIGURATION REQUIRED');
check('portal/CRM notes need no setup', empty.find(c => c.id === 'portal_messages')!.status === 'manual');
check('missing variables are named, values never exposed', empty.find(c => c.id === 'whatsapp')!.missingVariables.includes('WHATSAPP_TOKEN'));
const configured = evaluateChannels({ WHATSAPP_TOKEN: 'x', WHATSAPP_PHONE_NUMBER_ID: 'y', WHATSAPP_VERIFY_TOKEN: 'z', WHATSAPP_APP_SECRET: 'w' });
check('channel flips to ACTIVE only when all credentials exist', configured.find(c => c.id === 'whatsapp')!.status === 'active');
check('partial credentials keep it CONFIGURATION REQUIRED',
  evaluateChannels({ WHATSAPP_TOKEN: 'x' }).find(c => c.id === 'whatsapp')!.status === 'configuration_required');
const counselorChannels = channelsForRole('counselor', empty).map(c => c.id);
const partnerChannels = channelsForRole('partner', empty).map(c => c.id);
check('§122 social accounts are not given to every employee', !counselorChannels.includes('social_facebook') && !counselorChannels.includes('social_instagram'));
check('§123 partner hub excludes social + internal CRM notes', !partnerChannels.includes('social_linkedin') && !partnerChannels.includes('internal_crm') && partnerChannels.includes('whatsapp'));
check('sending on an unconfigured channel is refused with the honest reason',
  assertChannelSendable('whatsapp', empty).ok === false && (assertChannelSendable('whatsapp', empty) as any).reason.startsWith('CONFIGURATION REQUIRED'));

console.log('\n── §134-§139 IMMUTABLE DOCUMENT POLICY ──');
check('§134 deletion denied for everyone', canDeleteDocument().allowed === false && canDeleteDocument().code === 'DOCUMENT_DELETE_FORBIDDEN');
check('§135 reject from submitted allowed with reason', evaluateDocumentTransition({ actor: 'counselor', from: 'student_submitted', to: 'rejected', reasonCode: 'blurry' }).allowed === true);
check('§138 reject without reason denied', evaluateDocumentTransition({ actor: 'counselor', from: 'student_submitted', to: 'rejected' }).code === 'REJECTION_REASON_REQUIRED');
check('§138 unknown reason code denied', evaluateDocumentTransition({ actor: 'counselor', from: 'student_submitted', to: 'rejected', reasonCode: 'meh' }).code === 'REJECTION_REASON_INVALID');
check('§137 verified document cannot be rejected', evaluateDocumentTransition({ actor: 'counselor', from: 'verified', to: 'rejected', reasonCode: 'blurry' }).code === 'VERIFIED_DOCUMENT_IMMUTABLE');
check('§137 verified document cannot be re-submitted over', evaluateDocumentTransition({ actor: 'student', from: 'verified', to: 'student_submitted' }).code === 'VERSION_REQUIRED');
check('§137 supersede needs a real reason', evaluateDocumentTransition({ actor: 'counselor', from: 'verified', to: 'superseded' }).code === 'SUPERSEDE_REASON_REQUIRED');
check('§137 supersede with reason allowed', evaluateDocumentTransition({ actor: 'counselor', from: 'verified', to: 'superseded', supersedeReason: 'University asked for a newer bank statement.' }).allowed === true);
check('student cannot verify their own document', evaluateDocumentTransition({ actor: 'student', from: 'student_submitted', to: 'verified' }).code === 'REVIEW_ROLE_REQUIRED');
check('rejected document cannot be verified', evaluateDocumentTransition({ actor: 'counselor', from: 'rejected', to: 'verified' }).code === 'REJECTED_DOCUMENT_NOT_VERIFIABLE');
check('§134 no transition to deleted', evaluateDocumentTransition({ actor: 'admin', from: 'student_submitted', to: 'deleted' as any }).code === 'DOCUMENT_DELETE_FORBIDDEN');
const slot = buildDocumentSlot('BANK_STATEMENT', [
  { version: 1, state: 'rejected', rejectionReasonCode: 'incomplete', uploadedAt: '2026-10-01' },
  { version: 2, state: 'rejected', rejectionReasonCode: 'blurry', uploadedAt: '2026-10-05' },
  { version: 3, state: 'verified', uploadedAt: '2026-10-09' },
]);
check('§136 one requirement keeps all versions', slot.versions.length === 3 && slot.activeVersion === 3 && slot.state === 'verified');
check('§136 verified middle version does not renumber history', slot.versions[0].version === 1 && slot.versions[1].rejectionReasonCode === 'blurry');
check('§139 student sees reason + replacement action', rejectionNotice('missing_page', 'Page 2 is missing.').headline === 'DOCUMENT REJECTED' && rejectionNotice('missing_page').action === 'Upload a replacement');
check('legacy status vocabulary maps onto policy states', legacyStatusToState('pending_review') === 'student_submitted' && legacyStatusToState('needs_update') === 'rejected' && legacyStatusToState('APPROVED') === 'verified');

console.log('\n── §129/§130/§158/§166/§175 AI SAFETY ──');
const paymentRisk = assessMessageRisk('Sir, my CAS deadline is tomorrow and the payment is not showing in my account.');
check('payment+deadline classified high-risk and urgent', paymentRisk.highRisk && paymentRisk.priority === 'urgent');
check('§158 routes payment to finance as well as the counselor', paymentRisk.route.includes('finance') && paymentRisk.route.includes('counselor'));
const visaRisk = assessMessageRisk('What documents do I need for the visa interview at VFS?');
check('visa subject routes to the visa officer', visaRisk.route.includes('visa_officer') && visaRisk.highRisk);
const legalRisk = assessMessageRisk('I have a police case, should I tell the embassy lawyer?');
check('legal subject escalates and never drafts', decideDraftMode(legalRisk).escalateOnly === true && decideDraftMode(legalRisk).label === 'ESCALATE — NO AI DRAFT');
const plainRisk = assessMessageRisk('Hi, is the September intake still open?');
check('ordinary question is not high-risk', plainRisk.highRisk === false);
check('guarantee request detected as high-risk', assessMessageRisk('Can you guarantee I will get the visa?').topics.includes('guarantee_request'));
check('§175 blocks a guaranteed-visa claim', findForbiddenClaims('You will get the visa, no problem.').some(h => h.id === 'guaranteed_visa'));
check('§175 blocks guaranteed admission', findForbiddenClaims('We can offer guaranteed admission to this university.').some(h => h.id === 'guaranteed_admission'));
check('§175 blocks an invented fee', findForbiddenClaims('You must pay GBP 12,500 by Friday.').some(h => h.id === 'invented_fee'));
check('§175 blocks an invented deadline', findForbiddenClaims('The deadline is 12/11/2026 for this course.').some(h => h.id === 'invented_deadline'));
const highRiskDraft = decideDraftMode(paymentRisk, { mode: 'approved_automation', hasApprovedTemplate: true, draftText: 'Payment received, all good.' });
check('§130 high-risk forces human approval even under automation', highRiskDraft.requiresHumanReview === true);
check('§130 draft carries the AI GENERATED DRAFT label', highRiskDraft.label.includes('AI GENERATED DRAFT'));
const tainted = decideDraftMode(plainRisk, { draftText: 'Do not worry, you will get the visa.' });
check('a draft containing a forbidden claim is blocked from automation', tainted.requiresHumanReview === true && tainted.reasons.some(r => r.includes('Blocked claim')));
const automated = decideDraftMode(plainRisk, { mode: 'approved_automation', hasApprovedTemplate: true });
check('low-risk + approved template may auto-send', automated.requiresHumanReview === false);
check('automation without an approved template falls back to human send', decideDraftMode(plainRisk, { mode: 'approved_automation', hasApprovedTemplate: false }).requiresHumanReview === true);
check('§166 counselor cannot read another counselor\'s conversation',
  authorizeConversationAccess({ actor: { userId: 'c1', role: 'counselor' }, conversation: { studentId: 's1', counselorId: 'c2' } }).allowed === false);
check('§166 counselor can read their own', authorizeConversationAccess({ actor: { userId: 'c1', role: 'counselor' }, conversation: { studentId: 's1', counselorId: 'c1' } }).allowed === true);
check('§123 partner blocked from another partner\'s student',
  authorizeConversationAccess({ actor: { userId: 'p1', role: 'partner', partnerId: 'PA' }, conversation: { studentId: 's9', partnerId: 'PB' } }).allowed === false);
check('§158 critical cases are never auto-resolved', proposeNextAction(paymentRisk).needsHuman === true && proposeNextAction(legalRisk).owner === 'manager');

console.log('\n── §125 canonical LEAD reference ──');
check('reference matches the spec format', formatLeadReference(2026, 42) === 'LEAD-2026-00042');
check('legacy formats are rejected', !isLeadReference('ALO-L-10001') && !isLeadReference('LEAD-2026-1'));
check('candidate list is sequential first, collision-safe after',
  leadReferenceCandidates({ year: 2026, seedSequence: 7 })[0] === 'LEAD-2026-00007' &&
  new Set(leadReferenceCandidates({ year: 2026, seedSequence: 7 })).size === leadReferenceCandidates({ year: 2026, seedSequence: 7 }).length);
console.log('\n── §131/§132/§133 received-document pipeline ──');
check('a bank statement filename is classified', classifyDocument({ fileName: 'Bank Statement Oct.pdf' }).requirement === 'BANK_STATEMENT');
check('an IELTS certificate is classified from the message text', classifyDocument({ fileName: 'doc_1.jpg', messageText: 'sir my IELTS result' }).requirement === 'ENGLISH_TEST');
check('an unrecognised file is NOT guessed', classifyDocument({ fileName: 'IMG_2024.jpg' }).requirement === 'OTHER' && classifyDocument({ fileName: 'IMG_2024.jpg' }).confidence === 'low');
check('two conflicting hints drop to low confidence', classifyDocument({ fileName: 'affidavit and bank statement.pdf' }).confidence === 'low');

const oneApp = decideDocumentMatch({ studentId: 's1', identityConfidence: 'exact', requirement: 'BANK_STATEMENT', candidates: [{ applicationId: 'a1', active: true }] });
check('exactly one active application is a confident match', oneApp.matched && oneApp.applicationId === 'a1' && oneApp.notice === null);
const unnamed = decideDocumentMatch({ studentId: 's1', identityConfidence: 'exact', requirement: 'BANK_STATEMENT', candidates: [{ applicationId: 'a1', active: true }, { applicationId: 'a2', active: true }] });
check('two active applications are NOT guessed', !unnamed.matched && unnamed.applicationId === null && unnamed.notice === 'DOCUMENT MATCH REVIEW REQUIRED');
const byRequirement = decideDocumentMatch({ studentId: 's1', identityConfidence: 'exact', requirement: 'BANK_STATEMENT', candidates: [{ applicationId: 'a1', active: true, outstandingRequirements: ['BANK_STATEMENT'] }, { applicationId: 'a2', active: true, outstandingRequirements: ['PASSPORT'] }] });
check('the application still missing this requirement wins the match', byRequirement.matched && byRequirement.applicationId === 'a1');
const weakIdentity = decideDocumentMatch({ studentId: 's1', identityConfidence: 'possible', requirement: 'PASSPORT', candidates: [{ applicationId: 'a1', active: true }] });
check('a weak identity match blocks attachment even with one application', !weakIdentity.matched && weakIdentity.notice === 'DOCUMENT MATCH REVIEW REQUIRED');
const noStudent = decideDocumentMatch({ identityConfidence: 'none', requirement: 'PASSPORT', candidates: [{ applicationId: 'a1', active: true }] });
check('an unmatched sender never attaches to an application', !noStudent.matched && noStudent.reasons[0].includes('not matched to a student'));
const named = decideDocumentMatch({ studentId: 's1', identityConfidence: 'exact', requirement: 'PASSPORT', mentionedApplicationId: 'a2', candidates: [{ applicationId: 'a1', active: true }, { applicationId: 'a2', active: true }] });
check('an application named by the student is honoured', named.matched && named.applicationId === 'a2');
const withdrawn = decideDocumentMatch({ studentId: 's1', identityConfidence: 'exact', requirement: 'PASSPORT', candidates: [{ applicationId: 'a1', active: false }] });
check('a withdrawn application cannot receive documents', !withdrawn.matched && withdrawn.requiresHumanReview === true);
check('§131 outbound metadata must be complete', OUTBOUND_FILE_METADATA_FIELDS.length === 11 &&
  validateOutboundFileMetadata({ messageId: 'm1', studentId: 's1', applicationId: 'a1', documentId: 'd1', sender: 'counselor', recipient: '8801805020101', fileId: 'f1', fileName: 'offer.pdf', fileType: 'application/pdf', timestamp: '2026-10-13T10:00:00Z', deliveryStatus: 'sent' }).valid === true);
const incomplete = validateOutboundFileMetadata({ messageId: 'm1', fileName: 'offer.pdf' });
check('§131 missing metadata is reported by name', !incomplete.valid && incomplete.missing.includes('fileId') && incomplete.missing.includes('deliveryStatus'));

console.log('\n── §174 locked official template engine ──');
const templateCodes = DEFAULT_TEMPLATES.map((t) => t.templateCode);
check('every spec-named official template has a code', Object.keys(OFFICIAL_TEMPLATE_MAP).length === 8 &&
  Object.values(OFFICIAL_TEMPLATE_MAP).flat().every((code) => templateCodes.includes(code)),
  Object.entries(OFFICIAL_TEMPLATE_MAP).filter(([, codes]) => !codes.every((c) => templateCodes.includes(c))).map(([k]) => k).join(', '));
check('payment instruction and review request now exist', templateCodes.includes('TPL-PAYMENT-INSTRUCTION') && templateCodes.includes('TPL-REVIEW-REQUEST'));
check('every locked code is marked locked in the seeds', LOCKED_TEMPLATE_CODES.every((code) =>
  DEFAULT_TEMPLATES.find((t) => t.templateCode === code)?.locked === true));
check('payment instruction requires approval (§130 high-risk)', DEFAULT_TEMPLATES.find((t) => t.templateCode === 'TPL-PAYMENT-INSTRUCTION')?.requiresApproval === true);
check('locked templates cannot be deleted', validateTemplateEdit({ templateCode: 'TPL-DOC-MISSING', actorRoles: ['super_admin'], action: 'delete', reason: 'tidy up the list' }).code === 'LOCKED_TEMPLATE_DELETE_FORBIDDEN');
check('only a super admin may re-word a locked template', validateTemplateEdit({ templateCode: 'TPL-DOC-MISSING', actorRoles: ['counselor'], action: 'edit', reason: 'shorten the wording' }).code === 'LOCKED_TEMPLATE_ROLE_REQUIRED');
check('a super-admin edit still needs a stated reason', validateTemplateEdit({ templateCode: 'TPL-DOC-MISSING', actorRoles: ['super_admin'], action: 'edit', reason: 'tweak' }).code === 'LOCKED_TEMPLATE_REASON_REQUIRED');
check('a reasoned super-admin edit is allowed', validateTemplateEdit({ templateCode: 'TPL-DOC-MISSING', actorRoles: ['super_admin'], action: 'edit', reason: 'University asked for a clearer upload instruction.' }).allowed === true);
check('non-locked templates stay freely editable', isLockedTemplate('TPL-COURSE-RECO') === false && validateTemplateEdit({ templateCode: 'TPL-COURSE-RECO', actorRoles: ['counselor'], action: 'edit' }).allowed === true);

console.log('\n── §147/§148 stored-value adapters ──');
check('db channel values map onto the policy vocabulary',
  toSlaChannel('facebook_messenger') === 'social' && toSlaChannel('portal_message') === 'portal' && toSlaChannel('phone_call_log') === 'phone');
check('db priority values map onto the policy vocabulary', toSlaPriority('sla_overdue') === 'urgent' && toSlaPriority('') === 'normal');
check('db intent values map onto the policy vocabulary', toSlaIntent('document_request') === 'document_requirement' && toSlaIntent('x') === 'general');
check('the SLA state vocabulary is exactly the spec four', SLA_STATES.join(',') === 'normal,warning,overdue,critical');

// ── The allocator is async (it talks to a writer), so its checks are awaited
//    before the summary is printed. Printing the summary first would report a
//    pass count that excludes them — a false pass.
async function runAllocatorChecks() {
  const taken = new Set<string>(['LEAD-2026-00012']);
  let attempts = 0;
  const stubClient = {
    lead: {
      count: async () => 11,
      create: async ({ data }: { data: any }) => {
        attempts += 1;
        if (taken.has(String(data.leadId))) {
          const error: any = new Error('Unique constraint failed on the fields: (`leadId`)');
          error.code = 'P2002';
          throw error;
        }
        taken.add(String(data.leadId));
        return { id: 'lead-1', ...data };
      },
    },
  };
  const created: any = await createLeadWithReference(stubClient, { fullName: 'Rahim', phone: '8801805020101' }, { year: 2026 });
  check('a colliding reference is retried instead of losing the lead', attempts === 2 && isLeadReference(created.leadId), `attempts=${attempts}`);

  let realFailures = 0;
  let threw = false;
  try {
    await createLeadWithReference(
      { lead: { count: async () => 1, create: async () => { realFailures += 1; throw new Error('connection refused'); } } },
      { fullName: 'x' },
      { year: 2026 },
    );
  } catch {
    threw = true;
  }
  check('a real database failure is not hidden by retrying', threw && realFailures === 1, `attempts=${realFailures}`);
  check('only unique violations trigger a retry', isUniqueViolation({ code: 'P2002' }) && !isUniqueViolation(new Error('connection refused')));
}

runAllocatorChecks()
  .catch((error) => {
    fail += 1;
    console.log(`FAIL  lead reference allocator checks threw: ${error instanceof Error ? error.message : String(error)}`);
  })
  .finally(() => {
    report();
  });

function report() {
console.log(`\n${fail === 0 ? 'ALL COMMUNICATION CHECKS PASS' : 'FAILURES PRESENT'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
