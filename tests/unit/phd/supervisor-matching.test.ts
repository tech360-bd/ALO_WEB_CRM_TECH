import { describe, expect, it } from 'vitest';
import { buildOutreachEmail, matchSupervisor } from '@/lib/phd/supervisors/matching';

const topic = {
  title: 'Digital transformation and SME productivity in UK manufacturing',
  mainQuestion: 'How do manufacturing SMEs convert digital investment into measurable productivity gains?',
  keywords: ['digital transformation', 'SME', 'manufacturing', 'productivity'],
  methodology: 'INTERVIEWS_THEMATIC',
  theoryFramework: 'Dynamic capabilities',
};

function supervisor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sup-1',
    fullName: 'Dr Example Person',
    roleTitle: 'Senior Lecturer',
    department: 'Business and Management',
    universityName: 'Example University',
    researchInterests: 'Digital transformation in small firms, manufacturing productivity and technology adoption',
    methods: 'Qualitative interviews, thematic analysis, case study',
    expertise: ['digital transformation', 'SME', 'manufacturing'],
    publications: [
      { title: 'Digital adoption in manufacturing SMEs', venue: 'Journal of Small Business', year: 2024, verificationStatus: 'VERIFIED_OFFICIAL' },
    ],
    availabilityStatus: 'AVAILABILITY_UNCLEAR',
    verificationStatus: 'VERIFIED_OFFICIAL',
    profileUrl: 'https://www.example.ac.uk/staff/example',
    contactEmail: null,
    lastVerifiedAt: '2026-09-01',
    ...overrides,
  };
}

describe('supervisor matching', () => {
  it('produces an explainable fit score from evidenced overlap only', () => {
    const result = matchSupervisor({ supervisor: supervisor(), topic });
    expect(result.fitScore).toBeGreaterThanOrEqual(0);
    expect(result.fitScore).toBeLessThanOrEqual(100);
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(['digital', 'manufacturing']));
    expect(result.rationale.length).toBeGreaterThan(30);
    expect(result.fitLabel).toMatch(/LOW|MEDIUM|HIGH/);
    expect(result.keywordAlignment).toBeGreaterThan(0);
  });

  it('never treats availability as confirmed from a profile or match score', () => {
    const result = matchSupervisor({ supervisor: supervisor(), topic });
    expect(result.availabilityAtMatch).toBe('AVAILABILITY_UNCLEAR');
    expect(result.isAvailabilityConfirmed).toBe(false);
    expect(result.missingEvidence.join(' ')).toMatch(/availability/i);
  });

  it('marks unverified supervisor records and missing publication evidence', () => {
    const result = matchSupervisor({
      supervisor: supervisor({ verificationStatus: 'NOT_YET_VERIFIED', publications: [], lastVerifiedAt: null }),
      topic,
    });
    expect(result.missingEvidence.join(' ')).toMatch(/not been verified|unverified/i);
    expect(result.missingEvidence.join(' ')).toMatch(/publication/i);
  });

  it('scores unrelated interests low and lists the mismatch', () => {
    const result = matchSupervisor({
      supervisor: supervisor({
        researchInterests: 'Medieval poetry and manuscript transmission',
        department: 'English Literature',
        expertise: ['poetry'],
        publications: [],
      }),
      topic,
    });
    expect(result.fitScore).toBeLessThan(35);
    expect(result.mismatches.length).toBeGreaterThan(0);
  });

  it('does not reward seniority, title or publication count', () => {
    const professor = matchSupervisor({
      supervisor: supervisor({ fullName: 'Professor Very Senior', roleTitle: 'Professor', publications: Array(40).fill({ title: 'Unrelated paper', year: 2020 }) }),
      topic,
    });
    const lecturer = matchSupervisor({ supervisor: supervisor(), topic });
    expect(professor.fitScore).toBeLessThanOrEqual(lecturer.fitScore + 5);
  });
});

describe('outreach email drafts', () => {
  const baseEmail = {
    applicantName: 'Aisha Rahman',
    applicantBackground: 'MSc Management, three years in operations analytics.',
    universityName: 'Example University',
    programmeName: 'PhD Management',
    supervisorName: 'Dr Example Person',
    topicTitle: topic.title,
    mainQuestion: topic.mainQuestion,
    methodologyLabel: 'Semi-structured interviews with thematic analysis',
  };

  it('is individually written, cites only verified publications and warns that it is a draft', () => {
    const draft = buildOutreachEmail({
      ...baseEmail,
      verifiedPublications: [{ title: 'Digital adoption in manufacturing SMEs', year: 2024 }],
    });
    expect(draft.subject).toContain('Digital transformation');
    expect(draft.body).toContain('Dr Example Person');
    expect(draft.body).toContain('Digital adoption in manufacturing SMEs');
    expect(draft.body).toContain('Aisha Rahman');
    expect(draft.warnings.length).toBeGreaterThanOrEqual(3);
    expect(draft.warnings.join(' ')).toMatch(/draft only/i);
    expect(draft.attachments.length).toBeGreaterThan(0);
  });

  it('says plainly when no publication has been verified instead of inventing one', () => {
    const draft = buildOutreachEmail({ ...baseEmail, verifiedPublications: [] });
    expect(draft.body).not.toMatch(/your (paper|article|work) on/i);
    expect(draft.body).toMatch(/have not yet verified/i);
    expect(draft.warnings.join(' ')).toMatch(/no verified publication/i);
  });

  it('never claims the email was sent', () => {
    const draft = buildOutreachEmail(baseEmail);
    const serialised = JSON.stringify(draft).toLowerCase();
    expect(serialised).not.toContain('sent successfully');
    expect(serialised).not.toContain('delivered');
    expect(serialised).toContain('does not send email');
  });
});
