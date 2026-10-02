/**
 * ALO Deterministic Reasoning Engine.
 *
 * This is ALO-owned business logic, not a model. It turns facts retrieved by
 * ALO tools into the same validated structured output contract that a language
 * model runtime must produce, using explicit, auditable rules.
 *
 * Why it exists:
 *  - §3 requires every core workflow to run with NO paid AI API. This engine is
 *    the guaranteed-available terminal runtime of the model router (§10) and
 *    the deterministic workflow fallback of §11.
 *  - §2/§52 require the business logic to stay ALO-owned. Keeping scoring,
 *    eligibility and checklist rules here (rather than in a prompt) is what
 *    makes the workforce model-replaceable without rebuilding agents (§33).
 *
 * It never invents facts: every field it emits is derived from the `context`
 * that ALO tools retrieved from the ALO database.
 */
import {
  clampPercent,
  lexiconScore,
  overlapScore,
  parseDateLoose,
  parseNumber,
  tokenize,
  truncate,
} from './text';

type Facts = Record<string, any>;

export type DeterministicTask =
  | 'lead.qualify'
  | 'profile.analyze'
  | 'course.match'
  | 'scholarship.match'
  | 'application.checklist'
  | 'visa.checklist'
  | 'crm.cleanup'
  | 'content.draft'
  | 'qa.validate'
  | 'report.summary'
  | 'university.research';

export type LeadIntent = 'STUDY_ABROAD' | 'ENGLISH_TEST' | 'INFORMATION_ONLY' | 'SPAM' | 'UNKNOWN';

export class DeterministicUnsupportedTask extends Error {
  constructor(task: string) {
    super(`AWF_DETERMINISTIC_UNSUPPORTED: no ALO rule set implements task "${task}"`);
  }
}

// ───────────────────────────── lexicons ─────────────────────────────

const INTENT_LEXICON: Record<string, Record<string, number>> = {
  STUDY_ABROAD: {
    'study abroad': 4, university: 3, admission: 3, bachelor: 3, masters: 3, master: 3, phd: 3,
    scholarship: 2, intake: 3, visa: 2, tuition: 2, apply: 2, course: 2, 'student visa': 4, offer: 2,
  },
  ENGLISH_TEST: { ielts: 4, pte: 4, toefl: 4, duolingo: 3, 'english test': 4, 'mock test': 3, band: 2 },
  INFORMATION_ONLY: { brochure: 2, information: 1, 'just asking': 3, curious: 2, 'price list': 2 },
  SPAM: { loan: 2, crypto: 4, casino: 5, seo: 2, 'best offer': 2, bitcoin: 5, viagra: 5 },
};

const URGENCY_LEXICON: Record<string, number> = {
  urgent: 6, asap: 6, immediately: 5, 'this week': 4, deadline: 4, 'next intake': 3, ready: 2,
};

// ───────────────────────────── lead qualification ─────────────────────────────

const LEAD_REQUIRED_FIELDS = [
  'fullName', 'phone', 'email', 'preferredCountry', 'preferredCourse', 'preferredLevel',
  'currentQualification', 'englishTest', 'budget', 'preferredIntake',
];

function qualifyLead(facts: Facts) {
  const lead = (facts.lead || {}) as Facts;
  const text = [lead.notes, lead.preferredCourse, lead.sourceDetail, lead.rawSubmission].filter(Boolean).join(' ');

  const missingFields = LEAD_REQUIRED_FIELDS.filter((field) => {
    const value = lead[field];
    return value === null || value === undefined || String(value).trim() === '';
  });

  const rationale: string[] = [];
  let score = 0;

  const completeness = clampPercent(((LEAD_REQUIRED_FIELDS.length - missingFields.length) / LEAD_REQUIRED_FIELDS.length) * 100);
  const completenessPoints = Math.round(completeness * 0.4);
  score += completenessPoints;
  rationale.push(`Profile completeness ${completeness}% (+${completenessPoints})`);

  const SOURCE_WEIGHT: Record<string, number> = {
    REFERRAL: 18, WALK_IN: 16, EVENT: 14, WEBSITE: 12, PARTNER: 12, FACEBOOK: 8, WHATSAPP: 10, IMPORT: 4,
  };
  const sourcePoints = SOURCE_WEIGHT[String(lead.source || '').toUpperCase()] ?? 6;
  score += sourcePoints;
  rationale.push(`Source ${lead.source || 'UNKNOWN'} (+${sourcePoints})`);

  let intent: LeadIntent = 'UNKNOWN';
  let bestIntentScore = 0;
  for (const [candidate, lexicon] of Object.entries(INTENT_LEXICON)) {
    const { score: hit } = lexiconScore(text, lexicon);
    if (hit > bestIntentScore) {
      bestIntentScore = hit;
      intent = candidate as LeadIntent;
    }
  }
  if (bestIntentScore === 0 && (lead.preferredCountry || lead.preferredCourse)) {
    intent = 'STUDY_ABROAD';
    bestIntentScore = 3;
  }
  const intentPoints = intent === 'SPAM' ? -40 : Math.min(20, bestIntentScore * 3);
  score += intentPoints;
  rationale.push(`Intent ${intent} from lexical evidence (${intentPoints >= 0 ? '+' : ''}${intentPoints})`);

  const { score: urgency, matched: urgencyTerms } = lexiconScore(text, URGENCY_LEXICON);
  const urgencyPoints = Math.min(12, urgency);
  if (urgencyPoints) {
    score += urgencyPoints;
    rationale.push(`Urgency signals ${urgencyTerms.join(', ')} (+${urgencyPoints})`);
  }

  const englishScore = parseNumber(lead.englishScore);
  if (englishScore !== null && englishScore >= 6) {
    score += 10;
    rationale.push(`English score ${englishScore} meets common entry thresholds (+10)`);
  } else if (englishScore !== null) {
    rationale.push(`English score ${englishScore} below typical 6.0 entry threshold (+0)`);
  }

  const budget = parseNumber(lead.budget);
  if (budget !== null && budget > 0) {
    score += 8;
    rationale.push(`Declared budget ${budget} (+8)`);
  }

  const createdAt = parseDateLoose(lead.createdAt);
  if (createdAt) {
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
    if (ageDays <= 2) {
      score += 8;
      rationale.push(`Lead is ${ageDays} day(s) old — recency bonus (+8)`);
    } else if (ageDays > 30) {
      score -= 10;
      rationale.push(`Lead is ${ageDays} days old — ageing penalty (-10)`);
    }
  }

  if (!lead.phone && !lead.email) {
    score -= 25;
    rationale.push('No reachable contact channel (-25)');
  }

  score = clampPercent(score);

  let tier: 'HOT' | 'WARM' | 'COLD' | 'UNQUALIFIED';
  if (intent === 'SPAM' || (!lead.phone && !lead.email)) tier = 'UNQUALIFIED';
  else if (score >= 70) tier = 'HOT';
  else if (score >= 45) tier = 'WARM';
  else tier = 'COLD';

  let recommendedAction: 'CALL_NOW' | 'SCHEDULE_FOLLOW_UP' | 'REQUEST_INFORMATION' | 'NURTURE' | 'DISQUALIFY';
  if (tier === 'UNQUALIFIED') recommendedAction = 'DISQUALIFY';
  else if (tier === 'HOT') recommendedAction = 'CALL_NOW';
  else if (missingFields.length >= 4) recommendedAction = 'REQUEST_INFORMATION';
  else if (tier === 'WARM') recommendedAction = 'SCHEDULE_FOLLOW_UP';
  else recommendedAction = 'NURTURE';

  const confidence = bestIntentScore >= 6 && missingFields.length <= 4 ? 'HIGH' : missingFields.length >= 7 ? 'LOW' : 'MEDIUM';

  return { tier, score, intent, missingFields, rationale: rationale.slice(0, 12), recommendedAction, confidence };
}

// ───────────────────────────── student profile ─────────────────────────────

const PROFILE_REQUIRED = [
  'name', 'email', 'phone', 'currentCountry', 'education', 'englishTest', 'passport', 'funding', 'preferences',
];

function analyzeProfile(facts: Facts) {
  const student = (facts.student || {}) as Facts;
  const education = Array.isArray(facts.education) ? facts.education : [];
  const englishTests = Array.isArray(facts.englishTests) ? facts.englishTests : [];
  const documents = Array.isArray(facts.documents) ? facts.documents : [];
  const passport = facts.passport || null;
  const funding = facts.funding || null;
  const preferences = facts.preferences || null;

  const present: Record<string, boolean> = {
    name: Boolean(String(student.name || '').trim()),
    email: Boolean(String(student.email || '').trim()),
    phone: Boolean(String(student.phone || '').trim()),
    currentCountry: Boolean(String(student.currentCountry || '').trim()),
    education: education.length > 0,
    englishTest: englishTests.length > 0,
    passport: Boolean(passport),
    funding: Boolean(funding),
    preferences: Boolean(preferences),
  };
  const missingFields = PROFILE_REQUIRED.filter((field) => !present[field]);
  const completeness = clampPercent(((PROFILE_REQUIRED.length - missingFields.length) / PROFILE_REQUIRED.length) * 100);

  const strengths: string[] = [];
  const risks: string[] = [];

  const bestEnglish = englishTests
    .map((test: Facts) => parseNumber(test.overallScore ?? test.score ?? test.overall))
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a)[0];
  if (bestEnglish !== undefined) {
    if (bestEnglish >= 6.5) strengths.push(`English proficiency ${bestEnglish} meets most postgraduate entry requirements`);
    else if (bestEnglish >= 6) strengths.push(`English proficiency ${bestEnglish} meets common undergraduate entry requirements`);
    else risks.push(`English proficiency ${bestEnglish} is below the common 6.0 entry threshold`);
  } else {
    risks.push('No English test result on record — eligibility cannot be confirmed');
  }

  const bestGrade = education
    .map((row: Facts) => parseNumber(row.gpa ?? row.cgpa ?? row.grade ?? row.result))
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a)[0];
  if (bestGrade !== undefined) {
    const normalised = bestGrade > 5 ? bestGrade / 1 : (bestGrade / 4) * 5;
    if (normalised >= 3.5 || bestGrade >= 70) strengths.push(`Strong academic record on file (${bestGrade})`);
    else risks.push(`Academic record (${bestGrade}) may constrain selective programmes`);
  }

  const verifiedDocuments = documents.filter((doc: Facts) => ['VERIFIED', 'verified', 'APPROVED'].includes(String(doc.status)));
  if (verifiedDocuments.length) strengths.push(`${verifiedDocuments.length} verified document(s) already on file`);
  const rejected = documents.filter((doc: Facts) => String(doc.status).toUpperCase() === 'REJECTED');
  if (rejected.length) risks.push(`${rejected.length} document(s) previously rejected and must be replaced`);

  if (!present.passport) risks.push('No passport record — required before any application submission');
  if (!present.funding) risks.push('No funding evidence — visa-critical for most destinations');

  const counselorBriefing: string[] = [];
  counselorBriefing.push(`Profile completeness ${completeness}% (${PROFILE_REQUIRED.length - missingFields.length}/${PROFILE_REQUIRED.length} sections)`);
  if (missingFields.length) counselorBriefing.push(`Collect: ${missingFields.join(', ')}`);
  if (bestEnglish !== undefined) counselorBriefing.push(`Best English score on file: ${bestEnglish}`);
  if (risks.length) counselorBriefing.push(`Top risk: ${risks[0]}`);
  counselorBriefing.push(
    student.journeyStage ? `Current journey stage: ${student.journeyStage}` : 'Journey stage not set'
  );

  const summary = truncate(
    `Student ${student.name || student.studentId || 'record'} has a ${completeness}% complete profile. ` +
      `${strengths.length} strength(s) and ${risks.length} risk(s) were derived from ${education.length} education record(s), ` +
      `${englishTests.length} English test result(s) and ${documents.length} document(s). ` +
      (missingFields.length ? `Missing sections: ${missingFields.join(', ')}.` : 'No required sections are missing.'),
    1900
  );

  return {
    completeness,
    missingFields,
    strengths: strengths.slice(0, 12),
    risks: risks.slice(0, 12),
    summary,
    counselorBriefing: counselorBriefing.slice(0, 12),
    confidence: completeness >= 80 ? 'HIGH' : completeness >= 50 ? 'MEDIUM' : 'LOW',
  };
}

// ───────────────────────────── course matching ─────────────────────────────

const LEVEL_ORDER: Record<string, number> = {
  certificate: 1, diploma: 2, foundation: 2, bachelor: 3, bachelors: 3, undergraduate: 3,
  pgd: 4, postgraduate: 4, master: 5, masters: 5, msc: 5, mba: 5, phd: 6, doctorate: 6,
};

function levelRank(value: unknown): number {
  const text = String(value ?? '').toLowerCase();
  for (const [key, rank] of Object.entries(LEVEL_ORDER)) if (text.includes(key)) return rank;
  return 0;
}

function matchCourses(facts: Facts) {
  const profile = (facts.profile || {}) as Facts;
  const courses = Array.isArray(facts.courses) ? facts.courses : [];
  const requirements: Facts[] = Array.isArray(facts.requirements) ? facts.requirements : [];
  const requirementByCourse = new Map<string, Facts>();
  for (const row of requirements) requirementByCourse.set(String(row.courseId), row);

  const constraints: string[] = [];
  const wantedLevel = levelRank(profile.preferredLevel);
  const currentLevel = levelRank(profile.currentQualification);
  const english = parseNumber(profile.englishScore);
  const budget = parseNumber(profile.budget);
  const wantedCountry = String(profile.preferredCountry || '').toLowerCase().trim();
  const subjectTokens = tokenize(profile.preferredCourse || profile.subjectArea || '');

  if (english === null) constraints.push('No English score supplied — English requirements cannot be confirmed');
  if (budget === null) constraints.push('No budget supplied — affordability not evaluated');
  if (!subjectTokens.length) constraints.push('No subject preference supplied — subject fit not evaluated');

  const matches = courses.map((course: Facts) => {
    const blockers: string[] = [];
    const reasons: string[] = [];
    let score = 0;

    const courseLevel = levelRank(course.studyLevel || course.programLevel || course.qualification);
    if (wantedLevel && courseLevel) {
      if (courseLevel === wantedLevel) {
        score += 25;
        reasons.push('Study level matches the declared preference');
      } else {
        blockers.push(`Course level (${course.studyLevel || course.qualification || 'unknown'}) differs from preference`);
      }
    }
    if (currentLevel && courseLevel && courseLevel > currentLevel + 1) {
      blockers.push('Academic progression gap: course level is more than one step above the current qualification');
    }

    if (subjectTokens.length) {
      const similarity = overlapScore(subjectTokens, tokenize(`${course.courseTitle || ''} ${course.subjectArea || ''} ${course.disciplineArea || ''}`));
      const points = Math.round(similarity * 30);
      score += points;
      if (points > 0) reasons.push(`Subject similarity ${Math.round(similarity * 100)}%`);
      else blockers.push('No subject overlap with the declared preference');
    }

    if (wantedCountry) {
      if (String(course.country || '').toLowerCase().includes(wantedCountry)) {
        score += 15;
        reasons.push(`Located in preferred destination (${course.country})`);
      } else {
        blockers.push(`Destination ${course.country || 'unknown'} is not the preferred country`);
      }
    }

    const requirement = requirementByCourse.get(String(course.courseId ?? course.id));
    const requiredIelts = parseNumber(requirement?.ieltsOverall) ?? parseNumber(course.ieltsMin) ?? null;
    if (requiredIelts !== null && requiredIelts > 0) {
      if (english === null) {
        blockers.push(`Requires IELTS ${requiredIelts}; no student score on record`);
      } else if (english >= requiredIelts) {
        score += 20;
        reasons.push(`English ${english} meets the required IELTS ${requiredIelts}`);
      } else {
        blockers.push(`English ${english} is below the required IELTS ${requiredIelts}`);
      }
    }

    const tuition = parseNumber(course.tuitionFee);
    if (budget !== null && tuition !== null && tuition > 0) {
      if (tuition <= budget) {
        score += 10;
        reasons.push(`Tuition ${tuition} is within the declared budget ${budget}`);
      } else {
        blockers.push(`Tuition ${tuition} exceeds the declared budget ${budget}`);
      }
    }

    if (course.highAcceptance) {
      score += 5;
      reasons.push('Flagged as a high-acceptance programme');
    }

    return {
      courseId: String(course.courseId ?? course.id),
      courseTitle: String(course.courseTitle || course.name || 'Untitled course'),
      universityName: String(course.universityName || course.university?.name || ''),
      country: String(course.country || ''),
      score: clampPercent(score),
      eligible: blockers.length === 0,
      blockers: blockers.slice(0, 10),
      reasons: reasons.slice(0, 10),
    };
  });

  matches.sort((a, b) => (Number(b.eligible) - Number(a.eligible)) || b.score - a.score);

  return {
    matches: matches.slice(0, 20),
    evaluated: courses.length,
    constraints,
    confidence: courses.length === 0 ? 'LOW' : constraints.length >= 2 ? 'MEDIUM' : 'HIGH',
  };
}

// ───────────────────────────── scholarships ─────────────────────────────

function matchScholarships(facts: Facts) {
  const profile = (facts.profile || {}) as Facts;
  const scholarships = Array.isArray(facts.scholarships) ? facts.scholarships : [];
  const nationality = String(profile.nationality || profile.currentCountry || '').toLowerCase().trim();
  const level = String(profile.preferredLevel || '').toLowerCase().trim();
  const now = Date.now();

  const matches = scholarships.map((row: Facts) => {
    const blockers: string[] = [];
    let eligibleCountries: string[] = [];
    let eligibleLevels: string[] = [];
    try {
      eligibleCountries = JSON.parse(String(row.eligibleCountries || '[]'));
    } catch {
      eligibleCountries = [];
    }
    try {
      eligibleLevels = JSON.parse(String(row.eligibleLevels || '[]'));
    } catch {
      eligibleLevels = [];
    }

    if (nationality && eligibleCountries.length) {
      const allowed = eligibleCountries.some((country) => String(country).toLowerCase().includes(nationality) || String(country).toLowerCase() === 'all');
      if (!allowed) blockers.push(`Nationality ${profile.nationality || profile.currentCountry} is not in the eligible country list`);
    }
    if (level && eligibleLevels.length) {
      const allowed = eligibleLevels.some((item) => String(item).toLowerCase().includes(level) || String(item).toLowerCase() === 'all');
      if (!allowed) blockers.push(`Study level ${profile.preferredLevel} is not in the eligible level list`);
    }

    const deadline = parseDateLoose(row.deadline);
    let deadlineStatus: 'OPEN' | 'CLOSING_SOON' | 'EXPIRED' | 'UNKNOWN' = 'UNKNOWN';
    if (deadline) {
      const days = Math.floor((deadline.getTime() - now) / 86_400_000);
      if (days < 0) {
        deadlineStatus = 'EXPIRED';
        blockers.push(`Deadline ${row.deadline} has passed`);
      } else if (days <= 30) deadlineStatus = 'CLOSING_SOON';
      else deadlineStatus = 'OPEN';
    }

    return {
      scholarshipId: String(row.id),
      name: String(row.scholarshipName || 'Unnamed scholarship'),
      provider: String(row.provider || ''),
      amount: parseNumber(row.scholarshipAmount) ?? 0,
      currency: String(row.scholarshipCurrency || ''),
      eligible: blockers.length === 0,
      deadline: String(row.deadline || ''),
      deadlineStatus,
      blockers: blockers.slice(0, 10),
    };
  });

  matches.sort((a, b) => (Number(b.eligible) - Number(a.eligible)) || b.amount - a.amount);

  return {
    matches: matches.slice(0, 25),
    evaluated: scholarships.length,
    confidence: scholarships.length === 0 ? 'LOW' : nationality && level ? 'HIGH' : 'MEDIUM',
  };
}

// ───────────────────────────── checklists ─────────────────────────────

const APPLICATION_DOCUMENTS: Array<{ key: string; label: string; required: boolean }> = [
  { key: 'passport', label: 'Valid passport bio page', required: true },
  { key: 'academic_certificate', label: 'Academic certificates', required: true },
  { key: 'transcript', label: 'Academic transcripts', required: true },
  { key: 'english_test', label: 'English proficiency result', required: true },
  { key: 'cv', label: 'Curriculum vitae', required: false },
  { key: 'sop', label: 'Statement of purpose', required: true },
  { key: 'recommendation', label: 'Recommendation letter', required: false },
  { key: 'photo', label: 'Passport-size photograph', required: false },
];

const VISA_DOCUMENTS: Array<{ key: string; label: string; required: boolean }> = [
  { key: 'passport', label: 'Valid passport', required: true },
  { key: 'offer_letter', label: 'Unconditional offer / CAS / I-20 / CoE', required: true },
  { key: 'financial_evidence', label: 'Financial evidence (bank statement / sponsor)', required: true },
  { key: 'english_test', label: 'Approved English test result', required: true },
  { key: 'tuition_receipt', label: 'Tuition deposit receipt', required: true },
  { key: 'medical', label: 'Medical / TB certificate where required', required: false },
  { key: 'police_clearance', label: 'Police clearance where required', required: false },
  { key: 'accommodation', label: 'Accommodation evidence', required: false },
];

function buildChecklist(facts: Facts, definition: Array<{ key: string; label: string; required: boolean }>) {
  const provided = Array.isArray(facts.documents) ? facts.documents : [];
  const byType = new Map<string, Facts>();
  for (const doc of provided) {
    const type = String(doc.documentType || doc.category || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (type) byType.set(type, doc);
  }

  const items = definition.map((item) => {
    const doc = byType.get(item.key);
    let status: 'MISSING' | 'PENDING_REVIEW' | 'PROVIDED' | 'REJECTED' | 'NOT_REQUIRED' = item.required ? 'MISSING' : 'NOT_REQUIRED';
    let note = '';
    if (doc) {
      const docStatus = String(doc.status || '').toUpperCase();
      if (['REJECTED', 'EXPIRED'].includes(docStatus)) {
        status = 'REJECTED';
        note = `Document rejected: ${String(doc.reviewerNote || doc.rejectionReason || 'no reason recorded')}`;
      } else if (['VERIFIED', 'APPROVED'].includes(docStatus)) {
        status = 'PROVIDED';
        note = 'Verified';
      } else {
        status = 'PENDING_REVIEW';
        note = `Uploaded, current status ${docStatus || 'PENDING'}`;
      }
    }
    return { key: item.key, label: item.label, status, required: item.required, note };
  });

  const requiredItems = items.filter((item) => item.required);
  const satisfied = requiredItems.filter((item) => item.status === 'PROVIDED').length;
  const missingCount = requiredItems.filter((item) => item.status === 'MISSING' || item.status === 'REJECTED').length;
  const readiness = requiredItems.length ? clampPercent((satisfied / requiredItems.length) * 100) : 100;

  const nextActions: string[] = [];
  for (const item of items) {
    if (item.status === 'MISSING' && item.required) nextActions.push(`Request ${item.label} from the student`);
    if (item.status === 'REJECTED') nextActions.push(`Replace rejected ${item.label}`);
  }
  const deadline = parseDateLoose(facts.deadline);
  let escalate = false;
  if (deadline) {
    const days = Math.floor((deadline.getTime() - Date.now()) / 86_400_000);
    if (days <= 14 && missingCount > 0) {
      escalate = true;
      nextActions.unshift(`Escalate: ${missingCount} required document(s) outstanding with ${days} day(s) to the deadline`);
    }
  }

  return {
    items,
    missingCount,
    readiness,
    nextActions: nextActions.slice(0, 20),
    escalate,
    confidence: provided.length ? 'HIGH' : 'MEDIUM',
  };
}

// ───────────────────────────── CRM cleanup ─────────────────────────────

function analyzeCrm(facts: Facts) {
  const leads = Array.isArray(facts.leads) ? facts.leads : [];
  const issues: Array<{ entity: string; entityId: string; issue: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; proposedFix: string }> = [];
  const phoneIndex = new Map<string, string[]>();

  for (const lead of leads) {
    const id = String(lead.id);
    if (!String(lead.email || '').trim() && !String(lead.phone || '').trim()) {
      issues.push({ entity: 'Lead', entityId: id, issue: 'No reachable contact channel', severity: 'HIGH', proposedFix: 'Request a phone number or email before any outreach' });
    }
    if (!String(lead.counselorId || '').trim() && String(lead.status || '').toUpperCase() === 'NEW') {
      issues.push({ entity: 'Lead', entityId: id, issue: 'New lead has no counsellor assigned', severity: 'MEDIUM', proposedFix: 'Propose a counsellor assignment for human confirmation' });
    }
    const email = String(lead.email || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      issues.push({ entity: 'Lead', entityId: id, issue: `Malformed email "${truncate(email, 60)}"`, severity: 'MEDIUM', proposedFix: 'Flag for correction; do not send to this address' });
    }
    const createdAt = parseDateLoose(lead.createdAt);
    if (createdAt && String(lead.status || '').toUpperCase() === 'NEW') {
      const days = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
      if (days >= 7) {
        issues.push({ entity: 'Lead', entityId: id, issue: `Lead untouched for ${days} days in status NEW`, severity: 'HIGH', proposedFix: 'Create a follow-up task for the owning counsellor' });
      }
    }
    const phone = String(lead.phone || '').replace(/\D/g, '');
    if (phone.length >= 7) {
      const list = phoneIndex.get(phone) || [];
      list.push(id);
      phoneIndex.set(phone, list);
    }
  }
  for (const [phone, ids] of phoneIndex) {
    if (ids.length > 1) {
      issues.push({
        entity: 'Lead',
        entityId: ids[0],
        issue: `Phone ${phone.slice(-4).padStart(phone.length, '*')} is shared by ${ids.length} leads (${ids.join(', ')})`,
        severity: 'MEDIUM',
        proposedFix: 'Propose a de-duplication review; do not merge without human approval',
      });
    }
  }

  const bySeverity = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const issue of issues) bySeverity[issue.severity] += 1;

  return {
    issues: issues.slice(0, 200),
    scanned: leads.length,
    summary: `Scanned ${leads.length} CRM lead record(s); found ${issues.length} data-quality issue(s) (${bySeverity.HIGH} high, ${bySeverity.MEDIUM} medium, ${bySeverity.LOW} low).`,
    confidence: leads.length ? 'HIGH' : 'LOW',
  };
}

// ───────────────────────────── content ─────────────────────────────

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180) || 'alo-content';
}

function seoReview(payload: { title: string; metaTitle: string; metaDescription: string; body: string; keywords: string[] }) {
  const issues: string[] = [];
  let score = 100;
  const words = payload.body.split(/\s+/).filter(Boolean).length;

  if (payload.metaTitle.length < 30 || payload.metaTitle.length > 60) {
    issues.push(`Meta title length ${payload.metaTitle.length} is outside the 30–60 character range`);
    score -= 10;
  }
  if (payload.metaDescription.length < 70 || payload.metaDescription.length > 160) {
    issues.push(`Meta description length ${payload.metaDescription.length} is outside the 70–160 character range`);
    score -= 10;
  }
  if (words < 300) {
    issues.push(`Body is ${words} words; thin content below the 300-word threshold`);
    score -= 20;
  }
  const headings = (payload.body.match(/^##+\s/gm) || []).length;
  if (headings < 2) {
    issues.push(`Only ${headings} subheading(s); add structure for scannability`);
    score -= 10;
  }
  const primary = payload.keywords[0];
  if (primary) {
    const occurrences = (payload.body.toLowerCase().match(new RegExp(primary.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const density = words ? (occurrences / words) * 100 : 0;
    if (occurrences === 0) {
      issues.push(`Primary keyword "${primary}" does not appear in the body`);
      score -= 15;
    } else if (density > 3) {
      issues.push(`Primary keyword density ${density.toFixed(1)}% exceeds the 3% over-optimisation threshold`);
      score -= 10;
    }
    if (!payload.metaTitle.toLowerCase().includes(primary.toLowerCase())) {
      issues.push(`Primary keyword "${primary}" is missing from the meta title`);
      score -= 10;
    }
  } else {
    issues.push('No target keyword supplied');
    score -= 10;
  }
  return { seoScore: clampPercent(score), seoIssues: issues };
}

function draftContent(facts: Facts) {
  const brief = (facts.brief || {}) as Facts;
  const topic = String(brief.topic || '').trim();
  if (!topic) throw new Error('AWF_CONTENT_BRIEF_INVALID: a topic is required');
  const keywords: string[] = Array.isArray(brief.keywords) ? brief.keywords.map(String).filter(Boolean) : [];
  const sourceRows: Facts[] = Array.isArray(facts.sources) ? facts.sources : [];

  const title = String(brief.title || `${topic}: ALO Education guide`).slice(0, 190);
  const primary = keywords[0] || topic;
  const metaTitle = truncate(`${topic} | ALO Education`, 60);
  const outline = [
    `Overview of ${topic}`,
    'Verified facts from the ALO knowledge base',
    'Entry requirements and eligibility',
    'Costs, scholarships and funding',
    'How ALO Education supports applicants',
    'Frequently asked questions',
  ];

  const factLines = sourceRows.slice(0, 12).map((row) => {
    const parts = [row.label ?? row.name ?? row.title, row.value ?? row.detail].filter(Boolean).map(String);
    const citation = row.sourceUrl ? ` (source: ${row.sourceUrl})` : '';
    return `- ${parts.join(': ')}${citation}`;
  });

  const bodyParts: string[] = [];
  bodyParts.push(`# ${title}`);
  bodyParts.push(
    `This guide covers ${topic} for international students working with ALO Education. ` +
      `Every factual statement below is drawn from ${sourceRows.length} verified record(s) held in the ALO database; ` +
      `nothing is generated speculatively. Where a figure is not verified in the ALO database it is omitted rather than estimated.`
  );
  for (const section of outline) {
    bodyParts.push(`## ${section}`);
    if (section.includes('Verified facts') && factLines.length) {
      bodyParts.push(factLines.join('\n'));
    } else if (section.includes('Entry requirements')) {
      const reqs = sourceRows.filter((row) => String(row.kind || '').toLowerCase().includes('requirement'));
      bodyParts.push(
        reqs.length
          ? reqs.map((row) => `- ${row.label ?? row.name}: ${row.value ?? row.detail}`).join('\n')
          : `Entry requirements for ${topic} vary by institution. ALO counsellors confirm the exact requirement against the official university source before any application is submitted.`
      );
    } else if (section.includes('Costs')) {
      const fees = sourceRows.filter((row) => String(row.kind || '').toLowerCase().includes('fee') || String(row.kind || '').toLowerCase().includes('scholarship'));
      bodyParts.push(
        fees.length
          ? fees.map((row) => `- ${row.label ?? row.name}: ${row.value ?? row.detail}`).join('\n')
          : `Tuition and scholarship values for ${topic} are verified per programme in the ALO course database and confirmed with the institution before an offer is accepted.`
      );
    } else if (section.includes('ALO Education supports')) {
      bodyParts.push(
        'ALO Education provides counselling, course matching, application management, document preparation and visa support. ' +
          'Each step is tracked in the ALO CRM so applicants and counsellors share one status at all times.'
      );
    } else if (section.includes('Frequently asked')) {
      bodyParts.push(
        `**Is ${topic} suitable for international students?** ALO counsellors assess eligibility against the verified requirements held in the ALO database.\n\n` +
          `**How long does the process take?** Timelines depend on the intake and institution; ALO tracks every deadline inside the application record.`
      );
    } else {
      bodyParts.push(
        `${topic} is tracked inside the ALO Education platform with verified university, course, requirement and scholarship data. ` +
          `This section summarises what ALO currently holds and is regenerated whenever the underlying records change.`
      );
    }
  }
  const body = bodyParts.join('\n\n');
  const review = seoReview({ title, metaTitle, metaDescription: '', body, keywords: keywords.length ? keywords : [topic] });
  const metaDescription = truncate(
    `${topic} explained by ALO Education: verified entry requirements, costs, scholarships and application support for international students.`,
    158
  );
  const finalReview = seoReview({ title, metaTitle, metaDescription, body, keywords: keywords.length ? keywords : [topic] });

  return {
    title,
    slug: slugify(String(brief.slug || title)),
    metaTitle,
    metaDescription,
    body,
    outline,
    keywords: keywords.length ? keywords : [topic],
    seoScore: finalReview.seoScore,
    seoIssues: finalReview.seoIssues,
    sources: sourceRows.map((row) => String(row.sourceUrl || row.label || row.name || '')).filter(Boolean).slice(0, 30),
    confidence: sourceRows.length >= 3 ? 'HIGH' : sourceRows.length ? 'MEDIUM' : 'LOW',
    _reviewBaseline: review.seoScore,
  };
}

// ───────────────────────────── QA ─────────────────────────────

const UNSAFE_PATTERNS: Array<{ id: string; test: RegExp }> = [
  { id: 'GUARANTEED_VISA', test: /\b(guarantee[ds]?|100%\s*(success|approval))\b.*\bvisa\b/i },
  { id: 'GUARANTEED_ADMISSION', test: /\bguarantee[ds]?\b.*\b(admission|offer|scholarship)\b/i },
  { id: 'FABRICATED_RANKING', test: /\b(world'?s? (?:number one|#1|best))\b/i },
  { id: 'PAYMENT_INSTRUCTION', test: /\b(send|transfer)\s+(money|payment|cash)\b/i },
  { id: 'PII_EXPOSURE', test: /\b\d{9,}\b/ },
  { id: 'CREDENTIAL', test: /\b(api[_-]?key|password|secret|bearer)\b/i },
];

function validateOutput(facts: Facts) {
  const payload = (facts.payload || {}) as Facts;
  const requiredFields: string[] = Array.isArray(facts.requiredFields) ? facts.requiredFields.map(String) : [];
  const serialized = JSON.stringify(payload);

  const missingFields = requiredFields.filter((field) => {
    const value = field.split('.').reduce<any>((acc, part) => (acc == null ? acc : acc[part]), payload);
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
  });

  const contradictions: string[] = [];
  if (payload.eligible === true && Array.isArray(payload.blockers) && payload.blockers.length > 0) {
    contradictions.push('Marked eligible while blockers are present');
  }
  if (typeof payload.readiness === 'number' && typeof payload.missingCount === 'number' && payload.readiness === 100 && payload.missingCount > 0) {
    contradictions.push('Readiness is 100% while required items are still missing');
  }
  if (Array.isArray(payload.matches)) {
    for (const match of payload.matches as Facts[]) {
      if (match?.eligible === true && Array.isArray(match.blockers) && match.blockers.length) {
        contradictions.push(`Match ${match.courseId ?? match.scholarshipId ?? ''} is eligible but lists blockers`);
      }
    }
  }
  if (typeof payload.score === 'number' && (payload.score < 0 || payload.score > 100)) {
    contradictions.push(`Score ${payload.score} is outside the 0–100 range`);
  }

  const unsafeFlags = UNSAFE_PATTERNS.filter((pattern) => pattern.test.test(serialized)).map((pattern) => pattern.id);

  const penalty = missingFields.length * 10 + contradictions.length * 15 + unsafeFlags.length * 25;
  const score = clampPercent(100 - penalty);

  return {
    passed: missingFields.length === 0 && contradictions.length === 0 && unsafeFlags.length === 0,
    missingFields,
    contradictions: contradictions.slice(0, 30),
    unsafeFlags,
    score,
    confidence: requiredFields.length ? 'HIGH' : 'MEDIUM',
  };
}

// ───────────────────────────── reporting ─────────────────────────────

function summarizeReport(facts: Facts) {
  const metrics: Array<{ label: string; value: number; unit: string }> = Array.isArray(facts.metrics)
    ? facts.metrics
        .map((row: Facts) => ({ label: String(row.label || ''), value: Number(row.value) || 0, unit: String(row.unit || '') }))
        .filter((row: { label: string }) => row.label)
    : [];

  const highlights: string[] = [];
  const concerns: string[] = [];
  for (const metric of metrics) {
    const lower = metric.label.toLowerCase();
    if (lower.includes('fail') || lower.includes('error') || lower.includes('overdue') || lower.includes('escalat')) {
      if (metric.value > 0) concerns.push(`${metric.label}: ${metric.value}${metric.unit}`);
    } else if (lower.includes('rate')) {
      if (metric.value >= 70) highlights.push(`${metric.label} at ${metric.value}${metric.unit || '%'}`);
      else concerns.push(`${metric.label} at ${metric.value}${metric.unit || '%'} is below the 70% target`);
    } else if (metric.value > 0) {
      highlights.push(`${metric.label}: ${metric.value}${metric.unit}`);
    }
  }

  return {
    title: String(facts.title || 'ALO operational report'),
    period: String(facts.period || 'all time'),
    metrics: metrics.slice(0, 60),
    highlights: highlights.slice(0, 20),
    concerns: concerns.slice(0, 20),
    confidence: metrics.length ? 'HIGH' : 'LOW',
  };
}

// ───────────────────────────── university research ─────────────────────────────

function researchUniversities(facts: Facts) {
  const rows: Facts[] = Array.isArray(facts.universities) ? facts.universities : [];
  const citations: string[] = [];
  const universities = rows.slice(0, 50).map((row) => {
    const sourceUrl = String(row.officialUrl || row.sourceUrl || row.website || '');
    if (sourceUrl) citations.push(`${row.name}: ${sourceUrl}`);
    return {
      universityId: String(row.universityId || row.id),
      name: String(row.name || ''),
      country: String(row.country || ''),
      ranking: Number(row.worldRanking || row.ranking || 0) || 0,
      ieltsMin: Number(row.ieltsMin || 0) || 0,
      sourceUrl,
      lastVerifiedAt: String(row.lastVerifiedAt || ''),
      verificationStatus: String(row.verificationStatus || ''),
    };
  });
  const verified = universities.filter((row) => row.verificationStatus.toUpperCase() === 'VERIFIED').length;
  return {
    universities,
    evaluated: rows.length,
    citations: citations.slice(0, 60),
    confidence: rows.length === 0 ? 'LOW' : verified === universities.length ? 'HIGH' : 'MEDIUM',
  };
}

// ───────────────────────────── dispatcher ─────────────────────────────

const REASONERS: Record<string, (facts: Facts) => Record<string, unknown>> = {
  'lead.qualify': qualifyLead,
  'profile.analyze': analyzeProfile,
  'course.match': matchCourses,
  'scholarship.match': matchScholarships,
  'application.checklist': (facts) => buildChecklist(facts, APPLICATION_DOCUMENTS),
  'visa.checklist': (facts) => buildChecklist(facts, VISA_DOCUMENTS),
  'crm.cleanup': analyzeCrm,
  'content.draft': draftContent,
  'qa.validate': validateOutput,
  'report.summary': summarizeReport,
  'university.research': researchUniversities,
};

export function supportsTask(task: string): boolean {
  return Object.prototype.hasOwnProperty.call(REASONERS, task);
}

export function listDeterministicTasks(): string[] {
  return Object.keys(REASONERS).sort();
}

/** Execute an ALO rule set. Throws when the task has no ALO implementation. */
export function runDeterministic(task: string, facts: Facts): Record<string, unknown> {
  const reasoner = REASONERS[task];
  if (!reasoner) throw new DeterministicUnsupportedTask(task);
  const result = reasoner(facts || {});
  // Internal diagnostics never leave the engine.
  const clean = { ...result } as Record<string, unknown>;
  delete clean._reviewBaseline;
  return clean;
}
