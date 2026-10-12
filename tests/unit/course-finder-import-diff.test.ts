import { describe, it, expect } from 'vitest';
import {
  classifyImportRow,
  canonicalValue,
  combineRowActions,
  findProbableDuplicate,
  normalizeInstitutionName,
  UNIVERSITY_IMPORT_FIELDS,
  INTAKE_FEE_IMPORT_FIELDS,
} from '../../src/lib/course-finder/import-diff';

const storedUni = {
  universityId: 'UNI-1',
  name: 'University of Example',
  country: 'United Kingdom',
  city: 'Exampleton',
  website: 'https://www.example.ac.uk',
  officialUrl: 'https://www.example.ac.uk/international',
  sourceUrl: 'https://www.example.ac.uk/international',
  ranking: 0,
  verificationStatus: 'VERIFIED',
  publicationStatus: 'published',
};

describe('same-data import rule', () => {
  it('identical values → SKIP', () => {
    const r = classifyImportRow({ incoming: { university_name: 'University of Example', country: 'United Kingdom', website: 'https://www.example.ac.uk' }, existing: storedUni, specs: UNIVERSITY_IMPORT_FIELDS });
    expect(r.action).toBe('SKIP');
  });

  it('harmless formatting (case, spacing, trailing slash, www) → NORMALIZE', () => {
    const r = classifyImportRow({ incoming: { university_name: '  university of  example ', website: 'http://example.ac.uk/' }, existing: storedUni, specs: UNIVERSITY_IMPORT_FIELDS });
    expect(r.action).toBe('NORMALIZE');
    expect(r.changes.every((c) => c.kind === 'format')).toBe(true);
  });

  it('material change on a verified/published record → PENDING_CHANGE requiring Super Admin; public value is not touched', () => {
    const r = classifyImportRow({ incoming: { city: 'Otherton' }, existing: storedUni, specs: UNIVERSITY_IMPORT_FIELDS });
    expect(r.action).toBe('PENDING_CHANGE');
    expect(r.protectedRecord).toBe(true);
    expect(r.requiresSuperAdmin).toBe(true);
    expect(r.changes[0]).toMatchObject({ field: 'city', oldValue: 'Exampleton', newValue: 'Otherton', kind: 'material' });
    expect(storedUni.city).toBe('Exampleton');
  });

  it('blank incoming cells never clear stored values', () => {
    const r = classifyImportRow({ incoming: { city: '', university_name: 'University of Example' }, existing: storedUni, specs: UNIVERSITY_IMPORT_FIELDS });
    expect(r.action).toBe('SKIP');
  });

  it('number formatting: "20,000" equals 20000; stored 0 means no value', () => {
    expect(canonicalValue('20,000', 'number')).toBe(canonicalValue(20000, 'number'));
    expect(canonicalValue(0, 'number')).toBe('');
    const r = classifyImportRow({ incoming: { yearly_tuition: '20,000', intake_month: 'Sept' }, existing: { yearlyTuition: 20000, intakeMonth: 'September', verificationStatus: 'VERIFIED' }, specs: INTAKE_FEE_IMPORT_FIELDS });
    expect(r.action).toBe('NORMALIZE');
    const fee = classifyImportRow({ incoming: { yearly_tuition: '21000' }, existing: { yearlyTuition: 20000, verificationStatus: 'VERIFIED' }, specs: INTAKE_FEE_IMPORT_FIELDS });
    expect(fee.action).toBe('PENDING_CHANGE');
  });

  it('new record → NEW_PENDING_REVIEW; probable duplicate (same website host or same normalised name+country) → BLOCK_DUPLICATE', () => {
    const pool = [{ id: 'UNI-1', name: 'University of Example', country: 'United Kingdom', website: 'https://www.example.ac.uk' }];
    const fresh = classifyImportRow({ incoming: {}, existing: null, specs: UNIVERSITY_IMPORT_FIELDS, duplicateCheck: { candidate: { id: 'UNI-9', name: 'Another University', country: 'United Kingdom', website: 'https://another.ac.uk' }, pool } });
    expect(fresh.action).toBe('NEW_PENDING_REVIEW');
    const byHost = classifyImportRow({ incoming: {}, existing: null, specs: UNIVERSITY_IMPORT_FIELDS, duplicateCheck: { candidate: { id: 'UNI-2', name: 'Example Uni', website: 'http://example.ac.uk/' }, pool } });
    expect(byHost).toMatchObject({ action: 'BLOCK_DUPLICATE', duplicateOf: 'UNI-1' });
    const byName = classifyImportRow({ incoming: {}, existing: null, specs: UNIVERSITY_IMPORT_FIELDS, duplicateCheck: { candidate: { id: 'UNI-3', name: 'The University of Example', country: 'united kingdom' }, pool } });
    expect(byName.action).toBe('BLOCK_DUPLICATE');
    expect(findProbableDuplicate({ id: 'UNI-4', name: 'University of Example', country: 'Australia' }, pool)).toBeNull();
  });

  it('name normalisation and row-level combination', () => {
    expect(normalizeInstitutionName('King’s College London & Partners')).toBe(normalizeInstitutionName("King's College London and Partners"));
    expect(combineRowActions([
      { action: 'SKIP', changes: [], protectedRecord: false, requiresSuperAdmin: false, reason: '' },
      { action: 'PENDING_CHANGE', changes: [], protectedRecord: true, requiresSuperAdmin: true, reason: '' },
      { action: 'NORMALIZE', changes: [], protectedRecord: false, requiresSuperAdmin: false, reason: '' },
    ])).toBe('PENDING_CHANGE');
  });
});
