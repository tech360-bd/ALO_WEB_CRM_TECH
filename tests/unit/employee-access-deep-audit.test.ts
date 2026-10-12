// Word-level deep acceptance: activation email, lifecycle state machine,
// deactivation revocations, notification events + leak guard, interview
// honesty disclaimers, ALO 7-Step Journey, post-offer requirement tiers,
// service-charge declaration. Static + unit-level checks (no db).

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

import {
  EMPLOYEE_ACCOUNT_STATUSES,
  EMPLOYEE_PROFILE_STATUSES,
  DEACTIVATION_REVOCATIONS,
  REASSIGNABLE_ENTITY_TYPES,
  canTransitionAccount,
  buildDeactivationPlan,
} from '@/lib/employees/lifecycle';
import {
  EMPLOYEE_NOTIFICATION_EVENTS,
  SUPER_ADMIN_NOTIFY_RULES,
  PARTNER_SUPER_ADMIN_NOTIFY_RULES,
  buildSafeEmployeeNotification,
  isNotificationLeakSafe,
} from '@/lib/notifications/employee-events';
import {
  INTERVIEW_DISCLAIMERS,
  INTERVIEW_FORBIDDEN_CLAIMS,
  INTERVIEW_RESEARCH_WINDOW_MONTHS,
  attachInterviewHonesty,
  validateInterviewGuidance,
} from '@/lib/interview/honesty';
import { ALO_JOURNEY_STEPS, buildJourneyVisualDocument } from '@/lib/course-finder/journey';
import {
  POST_OFFER_REQUIREMENT_TIERS,
  analyzePostOfferRequirements,
  checkPostOfferGate,
} from '@/lib/applications/post-offer-requirements';
import {
  SERVICE_CHARGE_DECLARATION_TEMPLATE,
  buildServiceChargeDeclaration,
  validateServiceChargeDeclaration,
} from '@/lib/finance/service-charge-declaration';

// ---------------------------------------------------------------------------
describe('activation email — spec-exact subject and 7 content items', () => {
  const src = read('src/lib/email-service.ts');
  it('subject is exactly the spec-mandated line', () => {
    expect(src).toContain("subject: 'Activate your ALO Education employee account'");
  });
  it('contains employee name, designation, company email, activation link, password instructions, expiry, support contact', () => {
    expect(src).toContain('${name}');                    // Employee Name
    expect(src).toContain('Designation');                // Designation
    expect(src).toContain('Company Email');              // Company Email
    expect(src).toContain('activationUrl');              // Activation Link
    expect(src).toContain('Password creation instructions'); // Password instructions
    expect(src).toContain('expiryHours');                // Activation Expiry
    expect(src).toMatch(/support@aloeducation/i);        // Support Contact
  });
  it('supports extra details without breaking old call-sites (optional 5th arg)', () => {
    expect(src).toMatch(/details\?: \{/);
  });
});

describe('account/profile status state machine', () => {
  it('defines exactly the 12 spec account statuses', () => {
    expect([...EMPLOYEE_ACCOUNT_STATUSES]).toEqual([
      'INVITED', 'PENDING_ACTIVATION', 'PENDING_PROFILE', 'PROFILE_SUBMITTED',
      'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'ACTIVE',
      'SUSPENDED', 'INACTIVE', 'TERMINATED', 'REJECTED',
    ]);
  });
  it('defines the 8 spec profile statuses', () => {
    expect(EMPLOYEE_PROFILE_STATUSES.length).toBe(8);
    expect(EMPLOYEE_PROFILE_STATUSES).toContain('Correction Required');
    expect(EMPLOYEE_PROFILE_STATUSES).toContain('Under Review');
  });
  it('enforces INVITED → PENDING_ACTIVATION only', () => {
    expect(canTransitionAccount('INVITED', 'PENDING_ACTIVATION').allowed).toBe(true);
    expect(canTransitionAccount('INVITED', 'ACTIVE').allowed).toBe(false);
  });
  it('TERMINATED/REJECTED are final — history is preserved, never revived', () => {
    expect(canTransitionAccount('TERMINATED', 'ACTIVE').allowed).toBe(false);
    expect(canTransitionAccount('REJECTED', 'ACTIVE').allowed).toBe(false);
  });
  it('UNDER_REVIEW branches only to APPROVED / CORRECTION_REQUIRED / REJECTED', () => {
    expect(canTransitionAccount('UNDER_REVIEW', 'APPROVED').allowed).toBe(true);
    expect(canTransitionAccount('UNDER_REVIEW', 'TERMINATED').allowed).toBe(false);
  });
});

describe('employee deactivation — nine revocations + reason + preserved history', () => {
  it('lists exactly the nine spec revocations', () => {
    expect([...DEACTIVATION_REVOCATIONS]).toEqual([
      'login', 'sessions', 'api_tokens', 'whatsapp_access', 'social_access',
      'email_integration_access', 'temporary_permissions', 'ai_permissions', 'device_access',
    ]);
  });
  it('reassignment covers students/applications/documents/tasks/messages/whatsapp/approvals/follow-ups/escalations', () => {
    expect(REASSIGNABLE_ENTITY_TYPES.length).toBe(9);
    expect(REASSIGNABLE_ENTITY_TYPES).toContain('pending_approval');
  });
  it('requires a real reason (auditable deactivation)', () => {
    const p = buildDeactivationPlan('e1', 'ACTIVE', 'short');
    expect(p.ok).toBe(false);
  });
  it('cannot deactivate from final statuses', () => {
    const p = buildDeactivationPlan('e1', 'TERMINATED', 'already terminated long reason');
    expect(p.ok).toBe(false);
  });
  it('plan from ACTIVE carries all revocations', () => {
    const p = buildDeactivationPlan('e1', 'ACTIVE', 'resignation — leaving on 2026-10-01');
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.revocations.length).toBe(9);
      expect(p.preservedHistories).toContain('audit_history');
      expect(p.preservedHistories).toContain('communication_history');
    }
  });
  it('deactivation route exists and executes every revocation key', () => {
    expect(existsSync(join(ROOT, 'src/app/api/admin/employees/[id]/deactivate/route.ts'))).toBe(true);
    const route = read('src/app/api/admin/employees/[id]/deactivate/route.ts');
    for (const key of ['login', 'sessions', 'api_tokens', 'whatsapp_access', 'social_access', 'email_integration_access', 'temporary_permissions', 'ai_permissions', 'device_access']) {
      expect(route).toContain(`executed.${key}`);
    }
    expect(route).toContain('EMPLOYEE_DEACTIVATED');
    // history preservation: no hard deletes of students/applications
    expect(route).not.toMatch(/db\.student\.delete/);
    expect(route).not.toMatch(/db\.application\.delete/);
  });
});

describe('notification engine — 21 events, guard against sensitive leak', () => {
  it('has exactly 21 lifecycle notification events', () => {
    expect(EMPLOYEE_NOTIFICATION_EVENTS.length).toBe(21);
    expect(EMPLOYEE_NOTIFICATION_EVENTS).toContain('employee_joining');
    expect(EMPLOYEE_NOTIFICATION_EVENTS).toContain('security_alert');
    expect(EMPLOYEE_NOTIFICATION_EVENTS).toContain('sla_breach');
  });
  it('super-admin + partner super-admin rule sets exist', () => {
    expect(SUPER_ADMIN_NOTIFY_RULES.length).toBeGreaterThanOrEqual(10);
    expect(PARTNER_SUPER_ADMIN_NOTIFY_RULES.length).toBeGreaterThanOrEqual(7);
  });
  it('correction message is the leak-safe example from the spec', () => {
    const r = buildSafeEmployeeNotification('correction_required');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.message).toBe('Your employee profile requires correction. Please review and resubmit.');
      expect(r.message).not.toMatch(/NID/i);
      expect(r.message).not.toMatch(/salary/i);
    }
  });
  it('rejects unknown events and detects smuggled secrets', () => {
    expect(buildSafeEmployeeNotification('not_a_real_event').ok).toBe(false);
    expect(isNotificationLeakSafe('Your salary is now 55000 BDT')).toBe(false);
    expect(isNotificationLeakSafe('Your employee profile requires correction.')).toBe(true);
  });
  it('notifications route serves the catalog', () => {
    const route = read('src/app/api/employee-access/notifications/route.ts');
    expect(route).toContain('notificationEvents');
    expect(route).toContain('buildSafeEmployeeNotification');
  });
});

describe('interview honesty — disclaimers + no fabricated guarantees', () => {
  it('research window is at least 6 months', () => {
    expect(INTERVIEW_RESEARCH_WINDOW_MONTHS).toBeGreaterThanOrEqual(6);
  });
  it('mandatory disclaimers include can-vary, no-guarantee, no-private-access, human-final', () => {
    const joined = INTERVIEW_DISCLAIMERS.join(' ').toLowerCase();
    expect(joined).toContain('vary');
    expect(joined).toContain('no interview outcome can be guaranteed');
    expect(joined).toContain('no access to private');
    expect(joined).toContain('human');
  });
  it('forbidden claims are blocked by validator', () => {
    const bad = validateInterviewGuidance('We have 100% visa success and exact questions from confidential interview records.');
    expect(bad.ok).toBe(false);
    expect(bad.violations.length).toBeGreaterThanOrEqual(2);
    expect(validateInterviewGuidance('Prepare themes; questions can vary.').ok).toBe(true);
  });
  it('attachInterviewHonesty decorates payloads', () => {
    const out = attachInterviewHonesty({ a: 1 });
    expect(out.a).toBe(1);
    expect(out.researchWindowMonths).toBe(6);
    expect(out.disclaimers.length).toBe(INTERVIEW_DISCLAIMERS.length);
  });
  it('interview route responses carry the honesty block', () => {
    const route = read('src/app/api/employee-access/interview/route.ts');
    expect(route).toContain('attachInterviewHonesty');
    expect(route).toContain('INTERVIEW_DISCLAIMERS');
  });
});

describe('ALO 7-Step Journey — course finder branded visual', () => {
  it('has exactly 7 steps in the spec example order', () => {
    expect(ALO_JOURNEY_STEPS.length).toBe(7);
    expect(ALO_JOURNEY_STEPS.map(s => s.title)).toEqual([
      'Counseling', 'Course & University Selection', 'Document Preparation',
      'Application', 'Offer / Conditions', 'Payment / Visa Preparation', 'Visa / Enrollment',
    ]);
  });
  it('visual document is ALO-branded with confidential notice', () => {
    const doc = buildJourneyVisualDocument();
    expect(doc.title).toBe('ALO 7-Step Journey');
    expect(doc.branding.documentType).toBe('ALO_JOURNEY_VISUAL');
    expect(doc.branding.confidentialNotice.toLowerCase()).toContain('confidential');
    expect(doc.stepCount).toBe(7);
  });
  it('public route exists and returns the configured journey', () => {
    expect(existsSync(join(ROOT, 'src/app/api/course-finder/journey/route.ts'))).toBe(true);
    expect(read('src/app/api/course-finder/journey/route.ts')).toContain('buildJourneyVisualDocument');
  });
});

describe('post-offer requirement system — MANDATORY/RECOMMENDED/OPTIONAL', () => {
  it('three tiers exactly, in spec order', () => {
    expect([...POST_OFFER_REQUIREMENT_TIERS]).toEqual(['MANDATORY', 'RECOMMENDED', 'OPTIONAL']);
  });
  it('university English condition becomes a MANDATORY with provenance', () => {
    const reqs = analyzePostOfferRequirements('Unconditional after IELTS 6.5 overall');
    const english = reqs.find(r => r.key === 'english_condition');
    expect(english?.tier).toBe('MANDATORY');
    expect(english?.sourceOrigin).toBe('UNIVERSITY_CONDITION');
  });
  it('always includes mandatory sponsor docs + offer verification', () => {
    const reqs = analyzePostOfferRequirements('');
    expect(reqs.some(r => r.key === 'sponsor_documents' && r.tier === 'MANDATORY')).toBe(true);
    expect(reqs.some(r => r.key === 'offer_verification' && r.tier === 'MANDATORY')).toBe(true);
    expect(reqs.some(r => r.tier === 'RECOMMENDED')).toBe(true);
    expect(reqs.some(r => r.tier === 'OPTIONAL')).toBe(true);
  });
  it('mandatory requirements block their stage until completed; optional never blocks', () => {
    const reqs = analyzePostOfferRequirements('Must pay deposit of £2000');
    const gate = checkPostOfferGate(reqs, [], 'visa');
    expect(gate.allowed).toBe(false);
    expect(gate.blockedBy).toContain('sponsor_documents');
    const gate2 = checkPostOfferGate(reqs, reqs.map(r => r.key), 'visa');
    expect(gate2.allowed).toBe(true);
    // OPTIONAL never in blockedBy
    const optGate = checkPostOfferGate(reqs, reqs.filter(r => r.tier !== 'OPTIONAL').map(r => r.key), 'visa');
    expect(optGate.blockedBy.every(k => reqs.find(r => r.key === k)!.tier === 'MANDATORY')).toBe(true);
  });
  it('offer-letters route can attach requirements + gates', () => {
    expect(read('src/app/api/employee-access/offer-letters/route.ts')).toContain('analyzePostOfferRequirements');
  });
});

describe('service-charge / money-back declaration', () => {
  it('template has application ref, policy, approval line, declaration number', () => {
    expect(SERVICE_CHARGE_DECLARATION_TEMPLATE).toContain('{applicationNumber}');
    expect(SERVICE_CHARGE_DECLARATION_TEMPLATE).toContain('Approved by (Authorized Management)');
    expect(SERVICE_CHARGE_DECLARATION_TEMPLATE).toContain('{declarationNumber}');
  });
  it('built declaration validates clean', () => {
    const d = buildServiceChargeDeclaration({
      studentName: 'Rahim Uddin', applicationNumber: 'ALO-UK-2026-000123',
      university: 'Coventry University', course: 'MSc CS', intake: 'Jan 2027',
      serviceChargePolicy: 'NO_SERVICE_CHARGE', managementApproverName: 'Chairman', date: '2026-10-03T00:00:00.000Z',
    });
    expect(validateServiceChargeDeclaration(d).ok).toBe(true);
    expect(d).toContain('ALO-DECL-ALO-UK-2026-000123-20261003');
  });
  it('unfilled template fails validation until management approval line present', () => {
    const v = validateServiceChargeDeclaration(SERVICE_CHARGE_DECLARATION_TEMPLATE);
    expect(v.ok).toBe(false);
    expect(v.issues.join(' ')).toContain('placeholders');
  });
  it('staff route exists for issuance with audit', () => {
    expect(existsSync(join(ROOT, 'src/app/api/employee-access/service-declaration/route.ts'))).toBe(true);
    expect(read('src/app/api/employee-access/service-declaration/route.ts')).toContain('SERVICE_DECLARATION_GENERATED');
  });
});
