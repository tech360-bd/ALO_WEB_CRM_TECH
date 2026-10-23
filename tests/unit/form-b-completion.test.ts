import { describe, expect, it, vi, beforeEach } from 'vitest';
import { APPLICATION_FORM_SECTIONS, type FormSectionKey } from '@/lib/forms/application-form-schema';
import { isFormSectionComplete } from '@/lib/forms/form-section-validation';
import { formBDocumentsComplete, requiredFormBDocumentCategories } from '@/lib/forms/form-b-documents';
import { sanitiseStudentForm, studentFormSections } from '@/lib/forms/student-form-adapter';

const m = vi.hoisted(() => ({ student: vi.fn(), sections: vi.fn(), documents: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  studentDocument: { findMany: m.documents },
  student: { findUnique: m.student }, studentProfileSection: { findMany: m.sections },
} }));
import { getFormBReadiness } from '@/lib/application-readiness';

beforeEach(() => { vi.resetAllMocks(); m.student.mockResolvedValue({ id: 'synthetic-student' }); m.sections.mockResolvedValue([]); m.documents.mockResolvedValue([]); });

describe('shared section validation', () => {
  it('never completes empty, malformed, or partial personal information', () => {
    for (const value of [null, {}, [], { fullName: 'Synthetic Student' }]) expect(isFormSectionComplete('personal', value)).toBe(false);
    expect(isFormSectionComplete('personal', { fullName: 'Synthetic Student', dateOfBirth: '2001-01-01', nationality: 'Bangladeshi' })).toBe(true);
  });
  it('validates every repeatable education row', () => {
    const entry = { academicLevel: 'Bachelor', institution: 'Synthetic Institute', resultScore: '3.4', endYear: '2025' };
    expect(isFormSectionComplete('education', { entries: [] })).toBe(false);
    expect(isFormSectionComplete('education', { entries: [entry, {}] })).toBe(false);
    expect(isFormSectionComplete('education', { entries: [entry, entry] })).toBe(true);
  });
  it('requires passport and test details only when applicable', () => {
    expect(isFormSectionComplete('passport', { hasPassport: 'No' })).toBe(true);
    expect(isFormSectionComplete('passport', { hasPassport: 'Yes', passportNumber: 'synthetic' })).toBe(false);
    expect(isFormSectionComplete('english', { testStatus: 'Planning' })).toBe(true);
    expect(isFormSectionComplete('english', { testStatus: 'Yes', testType: 'IELTS' })).toBe(false);
  });
  it('requires refusal details when a refusal is declared', () => {
    expect(isFormSectionComplete('background', { hasVisa: 'No', hasVisaRefusal: 'Yes' })).toBe(false);
    expect(isFormSectionComplete('background', { hasVisa: 'No', hasVisaRefusal: 'No' })).toBe(true);
  });
  it('does not accept invalid email addresses', () => {
    expect(isFormSectionComplete('contact', { primaryEmail: 'not-email', contactPhone: '+8801800000000' })).toBe(false);
  });
});

describe('student UI adapter', () => {
  it('normalises the existing UI vocabulary and retains repeatable rows', () => {
    const sections = studentFormSections({ givenName: 'Synthetic', familyName: 'Student', hasPassport: 'no', englishTestStatus: 'Planning For', fundingStatus: 'Self Funded',
      educations: [{ academicLevel: 'Bachelor 4yr', institution: 'Synthetic Institute', resultScore: '3.4', endYear: '2025' }] });
    expect(sections.personal.fullName).toBe('Synthetic Student');
    expect(isFormSectionComplete('passport', sections.passport)).toBe(true);
    expect(isFormSectionComplete('education', sections.education)).toBe(true);
    expect(isFormSectionComplete('english', sections.english)).toBe(true);
    expect(isFormSectionComplete('funding', sections.funding)).toBe(true);
  });
  it('strips ownership, credentials, statuses, and reviewer controls', () => {
    expect(sanitiseStudentForm({ givenName: 'Synthetic', studentId: 'someone-else', password: 'secret', status: 'verified', counselorComment: 'approved', profileCompletion: 100 })).toEqual({ givenName: 'Synthetic' });
  });
});

describe('server application readiness', () => {
  it('does not trust complete flags without actual section data', async () => {
    m.sections.mockResolvedValue(APPLICATION_FORM_SECTIONS.map((s) => ({ section: s.key, status: 'complete', data: '{}' })));
    expect(await getFormBReadiness('synthetic-student')).toMatchObject({ complete: false, percent: 0 });
  });
  it('fails closed on malformed saved JSON and unknown students', async () => {
    m.sections.mockResolvedValue([{ section: 'personal', status: 'complete', data: 'invalid-json' }]);
    expect((await getFormBReadiness('synthetic-student')).complete).toBe(false);
    m.student.mockResolvedValue(null);
    expect((await getFormBReadiness('missing')).percent).toBe(0);
  });
  it('completes only validated required sections, leaving optional work/reference optional', async () => {
    const rows: Record<FormSectionKey, unknown> = {
      personal: { fullName: 'Synthetic Student', dateOfBirth: '2001-01-01', nationality: 'Bangladeshi' },
      contact: { primaryEmail: 'synthetic@example.test', contactPhone: '+8801800000000' },
      passport: { hasPassport: 'No' }, english: { testStatus: 'Planning' },
      education: { academicLevel: 'Bachelor', institution: 'Synthetic Institute', resultScore: '3.4', endYear: '2025' },
      background: { hasVisa: 'No', hasVisaRefusal: 'No' }, funding: { fundingStatus: 'Self funded' },
      admission: { studyDestination: 'United Kingdom', studyLevel: 'Postgraduate', programTitle: 'Synthetic Course', instituteName: 'Synthetic University', intake: 'Sep 2027' },
      lead: {}, work: {}, reference: {}, notes: {},
    };
    m.sections.mockResolvedValue(Object.entries(rows).map(([section, data]) => ({ section, data: JSON.stringify(data) })));
    m.documents.mockResolvedValue(['NID', 'ACADEMIC_CERT', 'TRANSCRIPT', 'BANK_STATEMENT', 'SOP'].map((category) => ({ category, fileName: 'synthetic.pdf', storagePath: 'private/synthetic', status: 'pending', version: 1 })));
    expect(await getFormBReadiness('synthetic-student')).toMatchObject({ complete: true, percent: 100, missing: [] });
  });
});


describe('Form B document gate', () => {
  const base = ['NID', 'ACADEMIC_CERT', 'TRANSCRIPT', 'BANK_STATEMENT', 'SOP'].map((category) => ({ category, status: 'pending', fileName: 'synthetic.pdf', storagePath: 'private/synthetic', version: 1 }));
  it('requires actual stored files, allows pending review, and refuses rejected newer versions', () => {
    expect(formBDocumentsComplete({}, base)).toBe(true);
    expect(formBDocumentsComplete({}, base.map((doc) => ({ ...doc, storagePath: '' })))).toBe(false);
    expect(formBDocumentsComplete({}, [...base, { ...base[0], status: 'rejected', version: 2 }])).toBe(false);
  });
  it('requires passport, refusal and test evidence only when applicable', () => {
    expect(requiredFormBDocumentCategories({ hasPassport: 'No', testStatus: 'Planning' })).not.toContain('PASSPORT');
    expect(requiredFormBDocumentCategories({ hasPassport: 'Yes', hasVisaRefusal: 'yes', englishTestStatus: 'Yes' })).toEqual(expect.arrayContaining(['PASSPORT', 'REFUSAL_LETTER', 'IELTS_CERT']));
  });
  it('requires test evidence even when only a later repeatable test is recorded', () => {
    expect(requiredFormBDocumentCategories({ englishTests: [{ testStatus: 'Planning' }, { testStatus: 'Yes' }] })).toContain('IELTS_CERT');
  });
  it('does not let an empty additional preference inherit a completed first preference', () => {
    const sections = studentFormSections({ studyDestination: 'UK', studyLevel: 'Masters', programTitle: 'Synthetic Course', instituteName: 'Synthetic University', intake: 'Sep 2027', admissionPreferences: [{}] });
    expect(isFormSectionComplete('admission', sections.admission)).toBe(false);
  });
});
