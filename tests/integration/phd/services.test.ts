import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { db } from '@/lib/db';
import type { PhdActor } from '@/lib/phd/auth';
import { getOrCreateProfile, saveProfile, toProfileView } from '@/lib/phd/services/profile';
import { ensureDefaultProject, listProjects } from '@/lib/phd/services/projects';
import {
  applyEvaluationOverrides,
  ensureCatalogueSeeded,
  generateAndSaveTopics,
  getTopicDetail,
  selectTopic,
} from '@/lib/phd/services/topics';
import { addEvidenceClaim, addLiteratureSource, listLiteratureSources } from '@/lib/phd/services/literature';
import { createSupervisor, draftOutreach, runSupervisorMatching } from '@/lib/phd/services/supervisors';
import {
  attachCitation,
  createProposal,
  exportProposal,
  loadProposal,
  qualityReportForProposal,
  restoreProposalVersion,
  updateProposal,
} from '@/lib/phd/services/proposals';
import { addApplicationTask, applicationChecklist, createApplication, getApplication, updateTaskStatus } from '@/lib/phd/services/applications';
import { downloadDocument, deleteDocument, listDocuments, uploadDocument } from '@/lib/phd/services/documents';
import { commissionSummary, createCommissionRecord, reviewCommissionRecord, uploadCommissionDocument, upsertCommissionAgreement, calculateCommissionForRecord } from '@/lib/phd/services/commission';
import { buildTimelineForProject } from '@/lib/phd/services/timeline';
import { createDeadline, listDeadlines } from '@/lib/phd/services/funding';
import { getDashboard } from '@/lib/phd/services/dashboard';
import { buildPdf } from '@/lib/phd/exports/pdf';
import {
  createSop,
  exportSop,
  generateForSop,
  getSop,
  listSops,
  reviewSop,
  transitionSop,
  updateSections,
  updateSop,
} from '@/lib/phd/services/sop';

const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

/**
 * These contracts need a real relational database with the PhD tables. In the
 * repository's default `npm test` run no database is configured, so the suite
 * is skipped instead of failing the whole run (the same convention as the other
 * tests in tests/integration). Run it explicitly with:
 *
 *   ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.phd-tmp/phd-test.db" \
 *     npx vitest run tests/integration/phd
 */
const HAS_PHD_DB =
  process.env.ALO_DB_DRIVER === 'sqlite' && (process.env.DATABASE_URL ?? '').startsWith('file:');
const describeDb = describe.skipIf(!HAS_PHD_DB);

function actorFor(user: { id: string; email: string; name: string | null }, role: PhdActor['role']): PhdActor {
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role,
    permissions: [],
    roles: [role === 'DATA_VERIFIER' ? 'data_verifier' : role === 'ADMINISTRATOR' ? 'admin' : 'student'],
    authentication: 'NEXTAUTH',
  };
}

let applicantUser: { id: string; email: string; name: string | null };
let otherUser: { id: string; email: string; name: string | null };
let verifierUser: { id: string; email: string; name: string | null };
let applicant: PhdActor;
let otherActor: PhdActor;
let verifier: PhdActor;

let universityId = '';
let programmeId = '';
let projectId = '';
const state: {
  topicId?: string;
  proposalId?: string;
  versionOneId?: string;
  applicationId?: string;
  documentId?: string;
  supervisorId?: string;
  commissionDocumentId?: string;
  commissionRecordId?: string;
  feeId?: string;
  pdfBuffer?: Buffer;
} = {};

beforeAll(async () => {
  if (!HAS_PHD_DB) return;
  // Keep uploaded fixtures out of the repository's runtime document store.
  process.env.PHD_STORAGE_ROOT = path.join(process.cwd(), '.phd-tmp', 'storage');
  const [applicantRow, otherRow, verifierRow] = await Promise.all([
    db.user.create({ data: { email: `phd-applicant-${runId}@example.com`, name: 'Integration Applicant', role: 'student' } }),
    db.user.create({ data: { email: `phd-other-${runId}@example.com`, name: 'Other Applicant', role: 'student' } }),
    db.user.create({ data: { email: `phd-verifier-${runId}@example.com`, name: 'Data Verifier', role: 'data_verifier', permissions: '["phd.verify"]' } }),
  ]);
  applicantUser = applicantRow;
  otherUser = otherRow;
  verifierUser = verifierRow;
  applicant = actorFor(applicantRow, 'APPLICANT');
  otherActor = actorFor(otherRow, 'APPLICANT');
  verifier = actorFor(verifierRow, 'DATA_VERIFIER');

  const university = await db.phdUniversity.create({
    data: {
      registerId: `TEST-${runId}`,
      slug: `test-university-${runId}`,
      name: `Test University ${runId}`,
      officialDomain: `test-${runId}.ac.uk`,
      officialHomepage: `https://test-${runId}.ac.uk`,
      researchDegreesUrl: `https://test-${runId}.ac.uk/research-degrees`,
      researchDegreesPageTitle: 'Research degrees',
      researchDegreesStatus: 'NOT_YET_VERIFIED',
      targetListRank: null,
      notes: 'Integration-test fixture. Not part of the verified 27-institution register.',
    },
  });
  universityId = university.id;
  const programme = await db.phdProgramme.create({
    data: {
      universityId,
      name: 'PhD Business and Management',
      discipline: 'BUSINESS',
      officialUrl: `https://test-${runId}.ac.uk/phd/business`,
      description: '',
      specialisms: '',
      applicationRequirements: '',
      proposalFormat: '',
      requiredHeadings: '',
      requiredDocuments: '',
      englishRequirements: '',
      intakes: '',
      applicationInstructions: '',
      verificationStatus: 'NOT_YET_VERIFIED',
    },
  });
  programmeId = programme.id;
}, 60000);

afterAll(async () => {
  if (!HAS_PHD_DB) return;
  await db.$disconnect();
});

describeDb('Profile and project provisioning', () => {
  it('creates an empty profile without inventing qualifications', async () => {
    const profile = await getOrCreateProfile(applicant.userId);
    expect(profile.userId).toBe(applicant.userId);
    expect(profile.highestQualification).toBe('');
    expect(profile.degreeSubject).toBe('');
    expect(profile.awardingInstitution).toBe('');
    // The only populated value is the default application stage; no academic
    // data is ever pre-filled.
    expect(toProfileView(profile).completion).toBeLessThanOrEqual(10);
  });

  it('saves profile fields, privacy acceptance and completion', async () => {
    const updated = await saveProfile(applicant, {
      highestQualification: 'MSc',
      degreeSubject: 'Business Analytics',
      awardingInstitution: 'Example University',
      classification: 'Merit',
      primaryDiscipline: 'BUSINESS',
      preferredMethods: ['SURVEY_STATISTICS', 'INTERVIEWS_THEMATIC'],
      studyMode: 'FULL_TIME',
      fundingRequirement: 'REQUIRED',
      currentStage: 'TOPIC_DISCOVERY',
      researchSetting: 'UK small retailers',
      existingResearchIdea: 'How small retailers adopt AI decision tools',
      methodsExperience: 'Regression analysis and interviews',
      relevantModules: 'operations analytics, digital transformation',
      privacyAccepted: true,
      onboardingStep: 3,
    });
    expect(updated.privacyAcceptedAt).not.toBeNull();
    expect(updated.preferredMethods).toContain('SURVEY_STATISTICS');
    expect(toProfileView(updated).completion).toBeGreaterThanOrEqual(80);
  });

  it('provisions exactly one active default project per applicant', async () => {
    const first = await ensureDefaultProject(applicant);
    const second = await ensureDefaultProject(applicant);
    expect(second.id).toBe(first.id);
    projectId = first.id;
    const projects = await listProjects(applicant);
    expect(projects).toHaveLength(1);
    expect(projects[0].userId).toBe(applicant.userId);
  });
});

describeDb('Topic catalogue and generation', () => {
  it('seeds 24 catalogue areas and is idempotent', async () => {
    const before = await db.phdTopicArea.count();
    const first = await ensureCatalogueSeeded();
    expect(first.areas).toBe(24);
    expect(first.created).toBe(24 - before);
    const second = await ensureCatalogueSeeded();
    expect(second.areas).toBe(24);
    expect(second.created).toBe(0);
    expect(await db.phdTopicArea.count()).toBe(24);
  });

  it('generates and stores at least five evidence-labelled topics', async () => {
    const result = await generateAndSaveTopics(applicant, projectId, { discipline: 'BUSINESS', maxCandidates: 6 });
    expect(result.topics.length).toBeGreaterThanOrEqual(5);
    for (const topic of result.topics) {
      expect(topic.noveltyStatus).toBe('PROVISIONAL_UNVERIFIED');
      expect(topic.id).toBeTruthy();
      expect(topic.scores.length).toBe(10);
    }
    state.topicId = result.topics[0].id;
    const stored = await db.phdTopicCandidate.count({ where: { projectId } });
    expect(stored).toBeGreaterThanOrEqual(5);
  });

  it('selects a topic and records it on the project', async () => {
    await selectTopic(applicant, state.topicId!);
    const topic = await db.phdTopicCandidate.findUniqueOrThrow({ where: { id: state.topicId! } });
    expect(topic.isSelected).toBe(true);
    const project = await db.phdProject.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.selectedTopicId).toBe(topic.id);
  });

  it('denies another applicant access to the topic', async () => {
    await expect(getTopicDetail(otherActor, state.topicId!)).rejects.toMatchObject({ status: 404 });
  });

  it('stores user assessment overrides separately from automated scores', async () => {
    await applyEvaluationOverrides(applicant, state.topicId!, [
      { criterion: 'motivation', score: 5, explanation: 'Applicant has direct retail analytics experience.' },
    ]);
    const evaluations = await db.phdTopicEvaluation.findMany({ where: { topicId: state.topicId!, criterion: 'motivation' } });
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].evidenceStatus).toBe('USER_ASSESSED');
  });
});

describeDb('Evidence library', () => {
  let sourceId = '';
  it('stores a source with a valid DOI and rejects duplicates', async () => {
    const first = await addLiteratureSource(applicant, projectId, {
      title: 'Artificial intelligence adoption in small retail operations',
      authors: 'Doe, J.; Smith, A.',
      year: 2024,
      venue: 'Journal of Retail Operations',
      doi: 'https://doi.org/10.1234/jro.2024.001',
      url: 'https://doi.org/10.1234/jro.2024.001',
      sourceType: 'JOURNAL_ARTICLE',
      verificationStatus: 'NOT_YET_VERIFIED',
    });
    expect(first.duplicate).toBe(false);
    expect(first.source.doi).toBe('10.1234/jro.2024.001');
    sourceId = first.source.id;

    const duplicate = await addLiteratureSource(applicant, projectId, {
      title: 'Artificial intelligence adoption in small retail operations',
      authors: 'Doe, J.; Smith, A.',
      year: 2024,
      venue: 'Journal of Retail Operations',
      doi: '10.1234/jro.2024.001',
      sourceType: 'JOURNAL_ARTICLE',
    });
    expect(duplicate.duplicate).toBe(true);
  });

  it('refuses a “verified fact” claim without a source', async () => {
    await expect(addEvidenceClaim(applicant, projectId, {
      claim: 'Adoption is universal among small retailers.',
      supportType: 'VERIFIED_FACT',
    })).rejects.toMatchObject({ status: 422 });
  });

  it('stores a hypothesis claim labelled as such', async () => {
    const claim = await addEvidenceClaim(applicant, projectId, {
      claim: 'Artificial intelligence adoption may be concentrated among retailers with existing analytics capacity.',
      supportType: 'HYPOTHESIS',
    });
    expect(claim.supportType).toBe('HYPOTHESIS');
    expect(claim.verificationStatus).toBe('NOT_YET_VERIFIED');
    state.pdfBuffer = buildPdf({ title: 'Evidence note', sections: [{ heading: 'Note', paragraphs: ['Draft placeholder content.'] }] }).buffer;
    expect(sourceId).toBeTruthy();
  });

  it('denies another applicant both read and write access to the evidence library', async () => {
    const listed = await listLiteratureSources(applicant, projectId);
    expect(listed.sources.length).toBeGreaterThanOrEqual(1);
    await expect(listLiteratureSources(otherActor, projectId)).rejects.toMatchObject({ status: 404 });
    await expect(addLiteratureSource(otherActor, projectId, {
      title: 'Unauthorised source insertion attempt',
      authors: 'Attacker, A.',
      year: 2024,
      sourceType: 'JOURNAL_ARTICLE',
    })).rejects.toMatchObject({ status: 404 });
  });
});

describeDb('Supervisor directory and matching', () => {
  it('blocks applicants from creating supervisor records', async () => {
    await expect(createSupervisor(applicant, {
      universityId,
      fullName: 'Dr Example Person',
      profileUrl: `https://test-${runId}.ac.uk/staff/person`,
      researchInterests: 'artificial intelligence adoption in retail operations',
      availabilityStatus: 'AVAILABILITY_UNCLEAR',
      verificationStatus: 'NOT_YET_VERIFIED',
    })).rejects.toMatchObject({ status: 403 });
  });

  it('refuses an “accepting students” claim without evidence', async () => {
    await expect(createSupervisor(verifier, {
      universityId,
      fullName: 'Dr Example Person',
      profileUrl: `https://test-${runId}.ac.uk/staff/person`,
      researchInterests: 'artificial intelligence adoption in retail operations',
      availabilityStatus: 'ACCEPTING_STUDENTS',
      verificationStatus: 'VERIFIED_OFFICIAL',
    })).rejects.toMatchObject({ status: 422 });
  });

  it('refuses an email address without its official source page', async () => {
    await expect(createSupervisor(verifier, {
      universityId,
      fullName: 'Dr Example Person',
      profileUrl: `https://test-${runId}.ac.uk/staff/person`,
      researchInterests: 'artificial intelligence adoption in retail operations',
      contactEmail: 'person@test.ac.uk',
      availabilityStatus: 'AVAILABILITY_UNCLEAR',
      verificationStatus: 'VERIFIED_OFFICIAL',
    })).rejects.toMatchObject({ status: 422 });
  });

  it('creates a verified supervisor and finds a fit without claiming availability', async () => {
    const created = await createSupervisor(verifier, {
      universityId,
      fullName: 'Dr Example Person',
      roleTitle: 'Senior Lecturer',
      department: 'Operations and Analytics',
      profileUrl: `https://test-${runId}.ac.uk/staff/person`,
      researchInterests: 'artificial intelligence adoption in retail operations and small business analytics',
      methods: 'survey statistics, regression, interviews',
      availabilityStatus: 'AVAILABILITY_UNCLEAR',
      verificationStatus: 'VERIFIED_OFFICIAL',
      expertise: ['artificial intelligence', 'retail operations'],
      publications: [{
        title: 'Artificial intelligence adoption in small retail operations',
        year: 2024,
        venue: 'Journal of Retail Operations',
        verificationStatus: 'VERIFIED_OFFICIAL',
      }],
    });
    expect(created.duplicate).toBe(false);
    state.supervisorId = created.supervisor.id;

    const matching = await runSupervisorMatching(applicant, projectId);
    const match = matching.matches.find((entry) => entry.supervisorName === 'Dr Example Person');
    expect(match).toBeTruthy();
    expect(match!.fitScore).toBeGreaterThanOrEqual(0);
    expect(match!.isAvailabilityConfirmed).toBe(false);
    expect(match!.availabilityAtMatch).toBe('AVAILABILITY_UNCLEAR');
    expect(matching.note.toLowerCase()).toContain('not an offer');
  });

  it('creates an outreach draft but never sends it', async () => {
    const { contact, draft } = await draftOutreach(applicant, projectId, state.supervisorId!);
    expect(contact.status).toBe('DRAFTED');
    expect(contact.sentAt).toBeNull();
    expect(contact.approvedAt).toBeNull();
    expect(draft.warnings.join(' ').toLowerCase()).toContain('does not send');
    expect(draft.body).not.toMatch(/sent successfully/i);
  });
});

describeDb('Proposal builder', () => {
  it('creates a 20-section general draft with an initial snapshot', async () => {
    const created = await createProposal(applicant, {
      projectId,
      topicId: state.topicId,
      title: 'Artificial intelligence adoption and operational performance in UK small retailers',
    });
    expect(created.proposal.sections).toHaveLength(20);
    expect(created.proposal.isGeneralDraft).toBe(true);
    expect(created.proposal.requirementsVerificationStatus).toBe('NOT_YET_VERIFIED');
    state.proposalId = created.proposal.id;
    const versions = await db.phdProposalVersion.findMany({ where: { proposalId: created.proposal.id } });
    expect(versions).toHaveLength(1);
    state.versionOneId = versions[0].id;
  });

  it('saves content as a new version and reports quality findings', async () => {
    const sections = await db.phdProposalSection.findMany({ where: { proposalId: state.proposalId! }, orderBy: { sortOrder: 'asc' } });
    const problem = sections.find((section) => section.sectionKey === 'problem')!;
    const aim = sections.find((section) => section.sectionKey === 'aim')!;
    const methodology = sections.find((section) => section.sectionKey === 'methodology')!;
    await updateProposal(applicant, state.proposalId!, {
      createVersion: true,
      changeSummary: 'Filled the problem statement, aim and methodology.',
      sections: [
        { sectionKey: 'problem', content: `${problem.content} Small retailers report uneven access to artificial intelligence tools. The operational consequences remain poorly evidenced in the United Kingdom, which makes resourcing decisions difficult for owner-managers.`.repeat(3) },
        { sectionKey: 'aim', content: aim.content || 'To examine how UK small retailers adopt artificial intelligence decision tools and with what operational effects.' },
        { sectionKey: 'methodology', content: 'A sequential mixed-methods design is proposed. A representative survey of 300 small retailers will estimate adoption prevalence, followed by 15 semi-structured interviews that explain the mechanisms behind the patterns. The design is justified because neither method alone can both measure prevalence and explain operational consequences. An exclusively qualitative design was rejected as it could not estimate prevalence, while an exclusively quantitative design would miss managerial reasoning.'.repeat(2) },
      ],
    });
    const proposal = await loadProposal(applicant, state.proposalId!);
    expect(proposal.currentVersion).toBe(2);
    expect(proposal.sections.find((section) => section.sectionKey === 'problem')!.content.length).toBeGreaterThan(300);

    const { report } = await qualityReportForProposal(applicant, state.proposalId!);
    expect(report.checks.length).toBeGreaterThan(10);
    expect(report.wordCount).toBeGreaterThan(100);
    expect(report.draftLabel.toLowerCase()).toContain('not yet verified');
  });

  it('restores the first version and records a new version', async () => {
    const restored = await restoreProposalVersion(applicant, state.proposalId!, state.versionOneId!);
    expect(restored.currentVersion).toBe(3);
    expect(restored.versions[0].changeSummary).toContain('Restored from version 1');
  });

  it('links a citation to a project source and flags an unknown section', async () => {
    const source = await db.phdLiteratureSource.findFirst({ where: { projectId } });
    const { citation, validation } = await attachCitation(applicant, state.proposalId!, {
      sourceId: source!.id,
      sectionKey: 'problem',
      rawText: '(Doe, 2024)',
      claimText: 'Adoption effects in retail operations',
    });
    expect(citation.isValid).toBe(validation.valid);
    await expect(attachCitation(applicant, state.proposalId!, {
      sourceId: source!.id,
      sectionKey: 'not-a-section',
      rawText: '(Doe, 2024)',
    })).rejects.toMatchObject({ status: 422 });
  });

  it('blocks another applicant from reading the proposal', async () => {
    await expect(loadProposal(otherActor, state.proposalId!)).rejects.toMatchObject({ status: 404 });
  });

  it('exports a DOCX and PDF from saved data with draft labelling', async () => {
    const docx = await exportProposal(applicant, state.proposalId!, 'docx');
    expect(docx.buffer.subarray(0, 2).toString('latin1')).toBe('PK');
    expect(docx.report.draftLabel.toLowerCase()).toContain('not yet verified');
    const pdf = await exportProposal(applicant, state.proposalId!, 'pdf');
    expect(pdf.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.filename.endsWith('.pdf')).toBe(true);
  });
});

describeDb('Applications, checklists and documents', () => {
  it('creates an application and labels unverified requirements as suggested only', async () => {
    const application = await createApplication(applicant, {
      projectId,
      programmeId,
      topicId: state.topicId,
      status: 'RESEARCHING',
    });
    state.applicationId = application.id;
    expect(application.universityId).toBe(universityId);

    const checklist = await applicationChecklist(applicant, state.applicationId!);
    expect(checklist.verified).toBe(false);
    expect(checklist.label.toLowerCase()).toContain('suggested');
    expect(checklist.items.length).toBeGreaterThan(5);
    expect(checklist.items.every((item: { mandatory: boolean }) => item.mandatory === false)).toBe(true);
  });

  it('adds and completes an application task', async () => {
    const task = await addApplicationTask(applicant, state.applicationId!, {
      title: 'Request an academic reference',
      category: 'DOCUMENT',
    });
    expect(task.status).toBe('OPEN');
    const done = await updateTaskStatus(applicant, task.id, 'DONE');
    expect(done.status).toBe('DONE');
  });

  it('uploads a private document, serves it only to the owner, and soft-deletes it', async () => {
    const pdf = buildPdf({ title: 'Academic CV', sections: [{ heading: 'Profile', paragraphs: ['Draft CV content for testing.'] }] }).buffer;
    const uploaded = await uploadDocument(applicant, {
      projectId,
      documentType: 'ACADEMIC_CV',
      filename: 'academic-cv.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
      applicationId: state.applicationId,
    });
    expect(uploaded.storageKey).toMatch(/^phd\/documents\//);
    state.documentId = uploaded.id;

    const downloaded = await downloadDocument(applicant, state.documentId!);
    expect(downloaded.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    await expect(downloadDocument(otherActor, state.documentId!)).rejects.toMatchObject({ status: 404 });
    const deleted = await deleteDocument(applicant, state.documentId!);
    expect(deleted.deleted).toBe(true);
    const listed = await listDocuments(applicant, projectId);
    expect(listed.find((document) => document.id === state.documentId)).toBeUndefined();
  });

  it('rejects a file whose signature does not match its declared type', async () => {
    await expect(uploadDocument(applicant, {
      projectId,
      documentType: 'ACADEMIC_CV',
      filename: 'fake.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not a pdf'),
    })).rejects.toMatchObject({ status: 415 });
  });
});

describeDb('Research timeline and deadlines', () => {
  it('generates a suggested plan without official deadlines', async () => {
    const { timeline, plan } = await buildTimelineForProject(applicant, {
      projectId,
      startDate: '2026-01-15',
      mode: 'FULL_TIME',
      totalMonths: 36,
    });
    expect(timeline.milestones.length).toBe(11);
    expect(timeline.milestones.every((milestone) => milestone.isOfficialDeadline === false)).toBe(true);
    expect(plan.assumptions.join(' ').toLowerCase()).toContain('not official');
    expect(timeline.milestones.find((milestone) => milestone.name.toLowerCase().includes('ethics'))).toBeTruthy();
  });

  it('keeps an unverified institutional deadline out of the "open" state', async () => {
    const deadline = await createDeadline(verifier, {
      title: 'Round 1 applications close',
      kind: 'APPLICATION',
      dueDate: '2027-01-15',
      sourceUrl: `https://test-${runId}.ac.uk/phd/business/deadlines`,
      reminderDays: 21,
    });
    expect(deadline.verificationStatus).toBe('NOT_YET_VERIFIED');
    const deadlines = await listDeadlines(applicant, projectId);
    const found = deadlines.find((entry) => entry.id === deadline.id);
    expect(found).toBeTruthy();
    expect(found!.assessment.isOpen).toBe(false);
    expect(found!.assessment.status).toBe('NEEDS_VERIFICATION');
  });

  it('refuses an institutional deadline without a source URL', async () => {
    await expect(createDeadline(verifier, {
      title: 'Uncited institutional deadline',
      kind: 'APPLICATION',
      dueDate: '2027-02-01',
    })).rejects.toMatchObject({ status: 422 });
  });
});

describeDb('Commission tracker isolation and guards', () => {
  it('extracts real PDF pages and validates quoted wording', async () => {
    const pdf = buildPdf({
      title: 'Commission Structure United Kingdom Spring 2027 (test fixture)',
      sections: [{
        heading: 'Test University',
        paragraphs: ['15% of gross first-year tuition fee for new PhD enrolments, payable on enrolment. Excludes continuing students.'],
      }],
    });
    const uploaded = await uploadCommissionDocument(verifier, {
      filename: 'commission-structure-test.pdf',
      mimeType: 'application/pdf',
      buffer: pdf.buffer,
      title: 'Test fixture commission structure',
      versionLabel: 'TEST FIXTURE',
    });
    expect(uploaded.extraction?.extractable).toBe(true);
    state.commissionDocumentId = uploaded.document.id;

    const pageText = uploaded.document.pages[0].text;
    expect(pageText).toContain('15% of gross first-year tuition fee');

    const record = await createCommissionRecord(verifier, {
      documentId: uploaded.document.id,
      universityId,
      universityNameRaw: `Test University ${runId}`,
      pageNumber: 1,
      exactWording: '15% of gross first-year tuition fee for new PhD enrolments, payable on enrolment.',
      commissionType: 'PERCENTAGE',
      percentageBasisPoints: 1500,
      basisGrossNet: 'GROSS',
      eligibleCategory: 'PhD',
    });
    expect(record.pageValidation?.matches).toBe(true);
    expect(record.record.extractionStatus).toBe('EXTRACTED');
    state.commissionRecordId = record.record.id;
  });

  it('rejects a quote that cannot be found on the cited page', async () => {
    await expect(createCommissionRecord(verifier, {
      documentId: state.commissionDocumentId!,
      universityId,
      universityNameRaw: `Test University ${runId}`,
      pageNumber: 1,
      exactWording: '30% of all tuition fees for every research degree, paid in advance.',
      commissionType: 'PERCENTAGE',
      percentageBasisPoints: 3000,
      basisGrossNet: 'GROSS',
    })).rejects.toMatchObject({ status: 422 });
  });

  it('does not calculate a payable amount before the agreement is confirmed', async () => {
    const result = await calculateCommissionForRecord(verifier, state.commissionRecordId!);
    expect(result.calculation.status).not.toBe('CALCULATED');
    expect(result.calculation.amountMinor).toBeNull();
    expect(result.calculation.requiresManualVerification).toBe(true);
  });

  it('verifies a record and calculates only when a verified fee exists', async () => {
    const reviewed = await reviewCommissionRecord(verifier, state.commissionRecordId!, {
      verificationStatus: 'VERIFIED_OFFICIAL',
      notes: 'Test fixture reviewed against page 1.',
    });
    expect(reviewed.verificationStatus).toBe('VERIFIED_OFFICIAL');

    const fee = await db.phdTuitionFee.create({
      data: {
        universityId,
        programmeId,
        academicYear: '2026/27',
        studentStatus: 'INTERNATIONAL',
        feeBasis: 'FULL_TIME',
        amountMinor: 2_000_000,
        currency: 'GBP',
        sourceUrl: `https://test-${runId}.ac.uk/fees`,
        verificationStatus: 'VERIFIED_OFFICIAL',
        notes: '',
      },
    });
    state.feeId = fee.id;

    await upsertCommissionAgreement(verifier, {
      universityId,
      universityNameRaw: `Test University ${runId}`,
      phdCommissionStatus: 'ELIGIBLE_CONFIRMED',
      sourcePage: 1,
      exactWording: '15% of gross first-year tuition fee for new PhD enrolments',
      documentId: state.commissionDocumentId,
      recordId: state.commissionRecordId,
    });

    const calculated = await calculateCommissionForRecord(verifier, state.commissionRecordId!, { feeId: fee.id });
    expect(calculated.calculation.status).toBe('CALCULATED');
    expect(calculated.calculation.amountMinor).toBe(300_000);
    expect(calculated.disclaimer.toLowerCase()).toContain('not academic');
  });

  it('blocks Regent’s University London from confirmed commission eligibility', async () => {
    await expect(upsertCommissionAgreement(verifier, {
      universityNameRaw: "Regent's University London",
      phdCommissionStatus: 'ELIGIBLE_CONFIRMED',
      sourcePage: 1,
      exactWording: 'test fixture',
      documentId: state.commissionDocumentId,
    })).rejects.toMatchObject({ status: 422 });

    const summary = await commissionSummary();
    expect(summary.sourceDocumentPresent).toBe(true);
    expect(summary.note).toBeNull();
  });

  it('keeps commission data out of the academic proposal quality report', async () => {
    const { report } = await qualityReportForProposal(applicant, state.proposalId!);
    const serialised = JSON.stringify(report);
    expect(serialised.toLowerCase()).not.toContain('commission');
  });
});

describeDb('Dashboard metrics are real counts only', () => {
  it('reports database-derived counts and no placeholder analytics', async () => {
    const dashboard = await getDashboard(applicant);
    expect(dashboard.metrics.topics).toBeGreaterThanOrEqual(5);
    expect(dashboard.metrics.proposals).toBeGreaterThanOrEqual(1);
    expect(dashboard.metrics.applications).toBeGreaterThanOrEqual(1);
    expect(dashboard.isEmpty).toBe(false);
    const serialised = JSON.stringify(dashboard).toLowerCase();
    expect(serialised).not.toContain('sample supervisor');
    expect(serialised).not.toContain('lorem ipsum');
  });

  it('does not leak another applicant’s records', async () => {
    const otherDashboard = await getDashboard(otherActor);
    expect(otherDashboard.metrics.topics).toBe(0);
    expect(otherDashboard.metrics.proposals).toBe(0);
    expect(otherDashboard.metrics.applications).toBe(0);
  });

  it('writes audit records for consequential actions without private content', async () => {
    const logs = await db.phdAuditLog.findMany({ where: { actorId: applicant.userId } });
    expect(logs.length).toBeGreaterThan(5);
    const actions = logs.map((log) => log.action);
    expect(actions).toContain('PROPOSAL_CREATED');
    expect(actions).toContain('DOCUMENT_UPLOADED');
    const details = logs.map((log) => log.details).join(' ');
    expect(details).not.toContain('Dear Dr');
    expect(details).not.toContain('@example.com');
  });
});

describeDb('Statement of purpose builder', () => {
  const state: { sopId?: string; adviser?: PhdActor } = {};

  beforeAll(async () => {
    // A reviewer must be attached to the project: statements are personal, so a
    // data verifier is deliberately not allowed to read them.
    const adviserRow = await db.user.create({
      data: { email: `phd-adviser-${runId}@example.com`, name: 'Research Adviser', role: 'research_adviser' },
    });
    state.adviser = actorFor(adviserRow, 'RESEARCH_ADVISER');
    await db.phdProject.update({ where: { id: projectId }, data: { adviserId: adviserRow.id } });
  });

  const sections = [
    {
      sectionKey: 'programme_fit',
      content:
        'I am applying for the PhD Business and Management programme at the integration test university because its analytics group studies exactly the decision processes I work with.',
    },
    {
      sectionKey: 'research_interest',
      content:
        'My proposed area of research is how small retailers adopt AI decision tools, and the question I intend to pursue is which organisational routines change first.',
    },
    {
      sectionKey: 'academic_background',
      content:
        'I hold an MSc in Business Analytics from Example University with a Merit, including modules in operations analytics and digital transformation.',
    },
    {
      sectionKey: 'research_experience',
      content:
        'My dissertation examined how small retailers adopt AI decision tools, using regression analysis and interviews with twelve store managers.',
    },
    {
      sectionKey: 'methods',
      content: 'I can work with survey statistics and thematic interviews, and the proposed design would use a two-stage mixed-method study.',
    },
    {
      sectionKey: 'motivation',
      content:
        'I have spent five years helping independent retailers choose stock systems, and I keep meeting the same gap between the software and the way decisions are actually made.',
    },
    {
      sectionKey: 'field_engagement',
      content:
        'Sources I have recorded and read for this project include Smith and Ahmed (2021), “Maintenance strategy in small firms”, which I use for the adoption framework.',
    },
    {
      sectionKey: 'contribution',
      content:
        'If the project proceeds as planned, it would contribute evidence on how routines change during adoption, addressing the question I set out above.',
    },
    {
      sectionKey: 'career_plan',
      content: 'I intend to return to retail operations as a research lead responsible for technology adoption.',
    },
    {
      sectionKey: 'ai_disclosure',
      content: 'I used a drafting assistant to structure this statement and rewrote every sentence myself.',
      },
  ];

  it('creates one statement per programme and refuses a duplicate', async () => {
    const sop = await createSop(applicant, { projectId, programmeId, universityId });
    state.sopId = sop.id;
    expect(sop.status).toBe('DRAFT');
    await expect(createSop(applicant, { projectId, programmeId })).rejects.toMatchObject({ status: 409 });
    const list = await listSops(applicant, projectId);
    expect(list).toHaveLength(1);
    expect(list[0].universityName).toContain('Test University');
  });

  it('keeps the statement private to its owner', async () => {
    await expect(getSop(otherActor, state.sopId!)).rejects.toMatchObject({ status: 404 });
    await expect(listSops(otherActor, projectId)).rejects.toMatchObject({ status: 404 });
  });

  it('saves personal facts and refuses another student as editor', async () => {
    await updateSop(applicant, state.sopId!, {
      personalFacts: {
        motivation: 'I have spent five years helping independent retailers choose stock systems.',
        careerPlan: 'I intend to return to retail operations as a research lead.',
        achievements: ['Ran a stock-system pilot across six stores'],
      },
    });
    await expect(
      updateSop(otherActor, state.sopId!, { personalFacts: { motivation: 'Not mine' } }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('generates a draft and preserves text the student already wrote', async () => {
    await updateSections(applicant, state.sopId!, [{ sectionKey: 'career_plan', content: 'Hand-written career plan.' }]);
    const result = await generateForSop(applicant, state.sopId!, { overwrite: false });
    expect(result.generated.sections).toHaveLength(10);
    expect(result.sectionsPreserved).toBeGreaterThanOrEqual(1);
    const detail = await getSop(applicant, state.sopId!);
    const career = detail.sections.find((section) => section.sectionKey === 'career_plan');
    expect(career?.content).toBe('Hand-written career plan.');
  });

  it('reports blocking issues while sections are empty', async () => {
    const all = await getSop(applicant, state.sopId!);
    await updateSections(
      applicant,
      state.sopId!,
      all.sections.map((section) => ({ sectionKey: section.sectionKey, content: '' })),
    );
    const review = await reviewSop(applicant, state.sopId!);
    expect(review.report.errorCount).toBeGreaterThan(0);
    expect(review.report.readiness).toBe('NOT_READY');
    expect(review.report.detectorStatement).toContain('No AI-detector score');
    await expect(transitionSop(applicant, state.sopId!, 'STUDENT_REVIEWED')).rejects.toMatchObject({ status: 422 });
  });

  it('requires a human other than the author to approve the final version', async () => {
    await updateSections(applicant, state.sopId!, sections, 'Complete draft for review');
    const review = await reviewSop(applicant, state.sopId!);
    expect(review.report.errorCount).toBe(0);

    const reviewed = await transitionSop(applicant, state.sopId!, 'STUDENT_REVIEWED');
    expect(reviewed?.status).toBe('STUDENT_REVIEWED');

    await expect(transitionSop(applicant, state.sopId!, 'FINAL_APPROVED')).rejects.toMatchObject({ status: 403 });
    await expect(transitionSop(verifier, state.sopId!, 'FINAL_APPROVED')).rejects.toMatchObject({ status: 404 });
    await expect(exportSop(applicant, state.sopId!, 'docx')).rejects.toMatchObject({ status: 409 });

    const approved = await transitionSop(state.adviser!, state.sopId!, 'FINAL_APPROVED', 'Reviewed at integration test');
    expect(approved?.status).toBe('FINAL_APPROVED');
    expect(approved?.approvedAt).not.toBeNull();
  });

  it('returns an edited statement to draft so an old approval cannot cover new text', async () => {
    const result = await updateSections(applicant, state.sopId!, [
      { sectionKey: 'career_plan', content: 'Updated career plan after approval.' },
    ]);
    expect(result.status).toBe('DRAFT');
    const detail = await getSop(applicant, state.sopId!);
    expect(detail.approvedAt).toBeNull();
  });

  it('exports the final documents and review report from saved content', async () => {
    await transitionSop(applicant, state.sopId!, 'STUDENT_REVIEWED');
    await transitionSop(state.adviser!, state.sopId!, 'FINAL_APPROVED');
    await transitionSop(state.adviser!, state.sopId!, 'REQUIREMENTS_VERIFIED');

    const docx = await exportSop(applicant, state.sopId!, 'docx');
    expect(docx.filename).toBe('Student_SOP_Final.docx');
    expect(docx.buffer.byteLength).toBeGreaterThan(1000);
    expect(docx.buffer.subarray(0, 2).toString()).toBe('PK');

    const pdf = await exportSop(applicant, state.sopId!, 'pdf');
    expect(pdf.filename).toBe('Student_SOP_Final.pdf');
    expect(pdf.buffer.subarray(0, 4).toString()).toBe('%PDF');

    const report = await exportSop(applicant, state.sopId!, 'report');
    expect(report.filename).toBe('Student_SOP_Review_Report.pdf');
    expect(report.buffer.subarray(0, 4).toString()).toBe('%PDF');

    const detail = await getSop(applicant, state.sopId!);
    expect(detail.status).toBe('EXPORT_VERIFIED');
    expect(detail.exportVerifiedAt).not.toBeNull();
  });

  it('keeps the review trail and audit log without private content', async () => {
    const detail = await getSop(applicant, state.sopId!);
    expect(detail.reviews.map((row) => row.decision)).toContain('FINAL_APPROVED');
    expect(detail.reviews.map((row) => row.decision)).toContain('EXPORT_VERIFIED');
    const logs = await db.phdAuditLog.findMany({ where: { entityId: state.sopId!, entityType: 'PhdStatementOfPurpose' } });
    expect(logs.length).toBeGreaterThan(3);
    const details = logs.map((log) => log.details).join(' ');
    expect(details).not.toContain('retailers choose stock systems');
  });

  it('does not leak a statement into another applicant’s dashboard', async () => {
    const otherDashboard = await getDashboard(otherActor);
    expect(otherDashboard.metrics.topics).toBe(0);
    expect(otherDashboard.metrics.proposals).toBe(0);
  });
});
