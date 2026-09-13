import { describe, it, expect } from 'vitest';
import { normalizeCourseRecord, normalizeText, normalizeQualification, normalizeCountryIso, normalizeCurrency } from '../../src/lib/data-normalizer';
import { detectUniversityDuplicate, detectCourseDuplicate } from '../../src/lib/duplicate-detector';

describe('Data Normalization & Duplicate Detection Unit Suite', () => {

  it('Normalizes degree qualification aliases (M.Sc. -> MSc, Bachelor of Science -> BSc)', () => {
    expect(normalizeQualification('M.Sc.')).toBe('MSc');
    expect(normalizeQualification('Master of Science')).toBe('MSc');
    expect(normalizeQualification('Bachelor of Science')).toBe('BSc');
    expect(normalizeQualification('phd')).toBe('PhD');
  });

  it('Normalizes country names to ISO codes (United Kingdom -> GB, United States -> US)', () => {
    expect(normalizeCountryIso('United Kingdom')).toBe('GB');
    expect(normalizeCountryIso('UK')).toBe('GB');
    expect(normalizeCountryIso('United States')).toBe('US');
    expect(normalizeCountryIso('Australia')).toBe('AU');
  });

  it('Normalizes currencies (Pound Sterling -> GBP, Euro -> EUR)', () => {
    expect(normalizeCurrency('Pound Sterling')).toBe('GBP');
    expect(normalizeCurrency('Euro')).toBe('EUR');
    expect(normalizeCurrency('US Dollar')).toBe('USD');
  });

  it('Prevents CSV formula injection by prepending single quote to =, +, -, @', () => {
    expect(normalizeText('=SUM(1+1)')).toBe("'=SUM(1+1)");
    expect(normalizeText('+12345')).toBe("'+12345");
    expect(normalizeText('@cmd')).toBe("'@cmd");
  });

  it('Detects exact duplicate universities by domain', () => {
    const existing = [{ id: 'UNI-1', name: 'University of Oxford', websiteUrl: 'https://www.oxford.ac.uk', country: 'GB' }];
    const incoming = { name: 'Oxford University', websiteUrl: 'www.oxford.ac.uk', country: 'GB' };
    const res = detectUniversityDuplicate(incoming, existing);
    expect(res.outcome).toBe('EXACT_DUPLICATE');
    expect(res.confidenceScore).toBeGreaterThanOrEqual(95);
  });

  it('Detects probable duplicate universities by name & country', () => {
    const existing = [{ id: 'UNI-1', name: 'University of Oxford', websiteUrl: 'https://www.oxford.ac.uk', country: 'GB' }];
    const incoming = { name: 'University of Oxford', websiteUrl: 'https://other-domain.com', country: 'GB' };
    const res = detectUniversityDuplicate(incoming, existing);
    expect(res.outcome).toBe('PROBABLE_DUPLICATE');
  });

  it('Detects new university record when no match exists', () => {
    const existing = [{ id: 'UNI-1', name: 'University of Oxford', websiteUrl: 'https://www.oxford.ac.uk', country: 'GB' }];
    const incoming = { name: 'Harvard University', websiteUrl: 'https://www.harvard.edu', country: 'US' };
    const res = detectUniversityDuplicate(incoming, existing);
    expect(res.outcome).toBe('NEW_RECORD');
  });
});
