import { APPLICATION_FORM_SECTIONS, type FormSectionKey } from './application-form-schema';

const aliases: Record<string, string> = {
  fullName: 'fullName', gender: 'personalGender', nationality: 'personalNationality',
  currentAddress: 'presentAddress', sameAsCurrent: 'sameAsPresent', visaRefusal: 'hasVisaRefusal',
  placeOfIssue: 'passportIssuePlace', issueDate: 'passportIssueDate', expiryDate: 'passportExpiry',
  passportNationality: 'personalNationality', testStatus: 'englishTestStatus', testType: 'englishTestName',
  testDate: 'englishTestDate', certificateId: 'englishCertId', overallScore: 'englishOverall',
  listening: 'englishListening', reading: 'englishReading', writing: 'englishWriting', speaking: 'englishSpeaking',
  company: 'companyName', refInstitution: 'refOrganization', sponsor: 'sponsorType', sourceOfFund: 'fundSources',
  enrollmentPriority: 'enrollmentChoice',
};
const normalisedValues: Record<string, string> = {
  'SSC/Grade 10': 'SSC/O Level', 'HSC/Grade 12': 'HSC/A Level',
  'Bachelor 3yr': 'Bachelor', 'Bachelor 4yr': 'Bachelor', Masters: 'Master', PGD: 'Diploma',
  'IELTS UKVI': 'IELTS-UKVI', 'OIETC ELLT': 'OIETC', 'DET Duolingo': 'Duolingo (DET)',
  'Self Funded': 'Self funded', 'Bank Loan': 'Education loan', 'Fully Sponsored': 'Sponsor', 'Partially Funded': 'Other',
  UK: 'United Kingdom', 'United States': 'USA', 'United Arab Emirates': 'Dubai',
};

const arrays: Partial<Record<FormSectionKey, string>> = {
  education: 'educations', work: 'workExperiences', admission: 'admissionPreferences', english: 'englishTests',
};

export function studentFormSections(form: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const section of APPLICATION_FORM_SECTIONS) {
    const convert = (source: Record<string, unknown>) => {
      const values: Record<string, unknown> = {};
      for (const field of section.fields) {
        let value = source[field.name] ?? source[aliases[field.name]] ?? (['hasWorkExp', 'hasReferral'].includes(field.name) ? form[field.name] : '') ?? '';
        if (field.name === 'fullName') value = [form.givenName, form.familyName].filter(Boolean).join(' ');
        if (field.name === 'expiryDate' && section.key === 'english') value = source.englishExpDate ?? form.englishExpDate ?? '';
        if (field.type === 'radio' && typeof value === 'string') value = value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value;
        if (field.name === 'testStatus' && value === 'Planning For') value = 'Planning';
        if (field.name === 'sourceOfFund' && Array.isArray(value)) value = value.join(', ');
        if (field.options && typeof value === 'string' && !field.options.includes(value)) {
          value = field.name === 'studyLevel' && value === 'Masters' ? 'Postgraduate' : normalisedValues[value] ?? value;
        }
        values[field.name] = value;
      }
      if (section.key === 'background') {
        const visa = Array.isArray(form.visas) ? form.visas[0] as Record<string, unknown> | undefined : undefined;
        const refusal = Array.isArray(form.visaRefusals) ? form.visaRefusals[0] as Record<string, unknown> | undefined : undefined;
        values.visaCountry ||= visa?.country || '';
        values.visaType ||= visa?.visaType || '';
        values.refusalCountry ||= refusal?.country || '';
        values.refusalDate ||= refusal?.rejectionDate || '';
        values.refusalReason ||= refusal?.reason || '';
      }
      return values;
    };
    const list = arrays[section.key] ? form[arrays[section.key]!] : undefined;
    result[section.key] = Array.isArray(list) ? { entries: list.map((row) => convert(row as Record<string, unknown>)) } : convert(form);
  }
  return result;
}

/** Store only UI fields, never caller-supplied status, ownership or review flags. */
export function sanitiseStudentForm(input: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set([
    ...APPLICATION_FORM_SECTIONS.flatMap((section) => section.fields.map((field) => field.name)),
    ...Object.values(aliases), ...Object.values(arrays), 'englishExpDate', 'visas', 'visaRefusals',
    'immigrations', 'hasMedical', 'hasCriminal', 'medicalDetails', 'criminalDetails',
  ]);
  const clean = (value: unknown, depth = 0): unknown => {
    if (typeof value === 'string') return value.slice(0, 10000);
    if (typeof value === 'number') return Number.isFinite(value) ? value : '';
    if (typeof value === 'boolean') return value;
    if (depth > 3) return '';
    if (Array.isArray(value)) return value.slice(0, 1000).map((row) => clean(row, depth + 1));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key)).map(([key, item]) => [key, clean(item, depth + 1)]));
    return '';
  };
  return Object.fromEntries(Object.entries(input).filter(([key]) => allowed.has(key)).map(([key, value]) => [key, clean(value)]));
}

/** Hydrate counselor-captured canonical sections into the existing student UI. */
export function studentFormFromSections(rows: Array<{ section: string; data: string }>): Record<string, unknown> {
  const form: Record<string, unknown> = {};
  for (const section of APPLICATION_FORM_SECTIONS) {
    const row = rows.find((item) => item.section === section.key);
    if (!row) continue;
    try {
      const data = JSON.parse(row.data);
      const convert = (entry: Record<string, unknown>) => Object.fromEntries(
        section.fields.filter((field) => entry[field.name] !== undefined).map((field) => {
          let value = entry[field.name];
          const key = field.name === 'expiryDate' && section.key === 'english' ? 'englishExpDate' : aliases[field.name] || field.name;
          if (field.type === 'radio' && typeof value === 'string' && ['Yes', 'No'].includes(value)) value = value.toLowerCase();
          return [key, value];
        }),
      );
      if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
      const entries = Array.isArray(data.entries) ? data.entries : [data];
      const first = entries[0] || {};
      Object.assign(form, convert(first));
      if (arrays[section.key]) form[arrays[section.key]!] = entries.map((entry: Record<string, unknown>, index: number) => ({ id: `saved-${section.key}-${index}`, ...convert(entry) }));
      if (section.key === 'personal' && typeof first.fullName === 'string') {
        form.givenName = first.fullName.split(' ')[0]; form.familyName = first.fullName.split(' ').slice(1).join(' ');
      }
    } catch { /* malformed records are not substituted with sample answers */ }
  }
  return form;
}
