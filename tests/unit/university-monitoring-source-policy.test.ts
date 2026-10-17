import { describe, expect, it } from 'vitest';
import {
  assertPublicHttpsTarget,
  buildOfficialSourceFingerprint,
  isOfficialMonitoringSourceType,
  isPublicIp,
  normalizeOfficialSourceUrl,
} from '@/lib/university-monitoring-source-policy';

describe('official monitoring source policy', () => {
  it('canonicalizes HTTPS URLs without fragments and rejects unsafe URL forms', () => {
    expect(normalizeOfficialSourceUrl(' HTTPS://WWW.Example.edu.au/catalogue#fees ')).toBe('https://www.example.edu.au/catalogue');
    for (const url of [
      'http://www.example.edu.au',
      'https://user:password@www.example.edu.au',
      'https://www.example.edu.au:8443/catalogue',
      'https://localhost/private',
      'https://service.internal/private',
      'https://127.0.0.1/admin',
      'https://169.254.169.254/latest/meta-data',
      'https://192.0.2.1/docs',
      'not a URL',
    ]) expect(() => normalizeOfficialSourceUrl(url), url).toThrow();
  });

  it('rejects reserved or non-public IPs while allowing public unicast addresses', () => {
    for (const ip of ['0.0.0.0', '10.0.0.1', '127.0.0.1', '169.254.1.2', '172.20.0.1', '192.168.1.1', '198.51.100.9', '203.0.113.8', '::1', 'fc00::1', 'fe80::1', '2001:db8::1', '2002::1']) {
      expect(isPublicIp(ip), ip).toBe(false);
    }
    for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) {
      expect(isPublicIp(ip), ip).toBe(true);
    }
  });

  it('validates a literal IP immediately and never performs DNS for local hosts', async () => {
    await expect(assertPublicHttpsTarget('https://127.0.0.1')).rejects.toThrow(/private or reserved/i);
    await expect(assertPublicHttpsTarget('https://localhost')).rejects.toThrow(/local, reserved/i);
  });

  it('allows only known official-source types and fingerprints the normalized target identity', () => {
    expect(isOfficialMonitoringSourceType('UNIVERSITY_OFFICIAL')).toBe(true);
    expect(isOfficialMonitoringSourceType('official_government')).toBe(true);
    expect(isOfficialMonitoringSourceType('other')).toBe(false);
    const base = {
      sourceUrl: 'https://www.example.edu/path#section',
      entityType: 'COURSE',
      universitySlug: 'example-university',
      courseSlug: 'msc-data',
      countrySlug: 'uk',
      dataSection: 'FEES',
    };
    expect(buildOfficialSourceFingerprint(base)).toBe(buildOfficialSourceFingerprint({ ...base, sourceUrl: 'https://www.example.edu/path' }));
    expect(buildOfficialSourceFingerprint(base)).not.toBe(buildOfficialSourceFingerprint({ ...base, courseSlug: 'msc-ai' }));
  });
});
