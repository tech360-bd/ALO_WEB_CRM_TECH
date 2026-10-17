import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.test', '.example', '.invalid'];
const ALLOWED_SOURCE_TYPES = new Set([
  'OFFICIAL_UNIVERSITY',
  'UNIVERSITY_OFFICIAL',
  'OFFICIAL_GOVERNMENT',
  'GOVERNMENT',
  'OFFICIAL_AUTHORITY',
  'AUTHORITY',
  'OFFICIAL_EDUCATION_AUTHORITY',
  'OFFICIAL_ADMISSIONS_PORTAL',
  'OFFICIAL_TEST_PROVIDER',
  'OFFICIAL_SCHOLARSHIP',
  'official_university',
  'official_government',
  'official_authority',
  'official_education_authority',
  'official_admissions_portal',
  'official_visa_authority',
  'official_test_provider',
  'official_scholarship',
]);

export const MONITORABLE_ENTITY_TYPES = new Set(['UNIVERSITY', 'COURSE', 'COUNTRY', 'GOVERNMENT', 'AUTHORITY']);

export interface OfficialSourceIdentity {
  sourceUrl: string;
  entityType: string;
  targetId?: string | null;
  targetSlug?: string | null;
  universitySlug?: string | null;
  courseSlug?: string | null;
  countrySlug?: string | null;
  dataSection?: string | null;
}

/**
 * Parse and canonicalize a source URL without performing network I/O.
 * Source registration never makes an assertion that the URL is official;
 * an authorized reviewer must explicitly verify the source before it can run.
 */
export function normalizeOfficialSourceUrl(input: unknown): string {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Source URL must be a string no longer than 2048 characters');
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('Source URL must be a valid absolute HTTPS URL');
  }
  if (url.protocol !== 'https:') throw new Error('Official monitoring sources must use HTTPS');
  if (url.username || url.password) throw new Error('Source URLs must not contain embedded credentials');
  if (url.port && url.port !== '443') throw new Error('Source URLs may use only the default HTTPS port');

  const hostname = unbracketHostname(url.hostname).toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new Error('Source URL host is local, reserved, or not publicly monitorable');
  }
  if (isIP(hostname) && !isPublicIp(hostname)) throw new Error('Source URL must not point to a private or reserved IP address');

  url.hash = '';
  return url.toString();
}

export function isOfficialMonitoringSourceType(sourceType: unknown): boolean {
  return typeof sourceType === 'string' && ALLOWED_SOURCE_TYPES.has(sourceType);
}

export function buildOfficialSourceFingerprint(identity: OfficialSourceIdentity): string {
  const canonicalUrl = normalizeOfficialSourceUrl(identity.sourceUrl);
  const target = [
    identity.entityType.trim().toUpperCase(),
    identity.targetId?.trim() || '',
    identity.targetSlug?.trim().toLowerCase() || '',
    identity.universitySlug?.trim().toLowerCase() || '',
    identity.courseSlug?.trim().toLowerCase() || '',
    identity.countrySlug?.trim().toLowerCase() || '',
    identity.dataSection?.trim().toLowerCase() || '',
  ].join('|');
  return createHash('sha256').update(`${canonicalUrl}|${target}`).digest('hex');
}

/** DNS check used immediately before every outbound request (including redirects). */
export async function assertPublicHttpsTarget(input: string | URL): Promise<URL> {
  const url = new URL(normalizeOfficialSourceUrl(String(input)));
  const hostname = unbracketHostname(url.hostname);
  const literalIpVersion = isIP(hostname);
  if (literalIpVersion) {
    if (!isPublicIp(hostname)) throw new Error('Outbound request to a private or reserved IP address is blocked');
    return url;
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Source host did not resolve');
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error('Source host resolves to a private or reserved IP address');
  }
  return url;
}

export function isPublicIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split('.').map(Number);
    const [a, b, c] = octets;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 0 || b === 168)) return false;
    if (a === 192 && b === 0 && c === 2) return false;
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return false;
    if (a === 203 && b === 0 && c === 113) return false;
    if (a === 192 && b === 88 && c === 99) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    return true;
  }
  if (version === 6) {
    const value = address.toLowerCase().split('%')[0];
    if (value.startsWith('::ffff:')) {
      const mapped = value.slice('::ffff:'.length);
      if (isIP(mapped) === 4) return isPublicIp(mapped);
      return false;
    }
    // This monitor only allows globally routable unicast IPv6 (2000::/3).
    // It excludes unspecified, loopback, ULA, link-local, multicast and
    // special-use/documentation/transition ranges inside the global prefix.
    if (!(value.startsWith('2') || value.startsWith('3'))) return false;
    if (value.startsWith('2001:db8:') || value.startsWith('2001:20:') || value.startsWith('2002:') || value.startsWith('3fff:')) return false;
    if (value.startsWith('2001:')) {
      const secondGroup = Number.parseInt(value.split(':')[1] || '0', 16);
      if (Number.isFinite(secondGroup) && secondGroup <= 0x01ff) return false; // IETF protocol assignments, Teredo, benchmarking
    }
    return true;
  }
  return false;
}

function unbracketHostname(value: string): string {
  return value.startsWith('[') && value.endsWith(']') ? value.slice(1, -1) : value;
}
