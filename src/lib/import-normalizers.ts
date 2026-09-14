// ALO — Student Import Normalizers (Part 1: Data Normalization)
// Canonicalizes phone/whatsapp/email/passport/name/country/university/course/date
// Preserves original where needed for audit; never overwrites immutable without approval.

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let p = String(raw).trim().replace(/[\s\-\(\)\.]/g, '');
  // Remove leading + then ensure 880 prefix for BD, otherwise keep intl
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('880')) return '+' + p;
  if (p.startsWith('01') && p.length === 11) return '+880' + p.slice(1);
  if (/^1\d{9}$/.test(p)) return '+880' + p; // 1XXXXXXXXX → BD
  if (/^\d{8,15}$/.test(p)) return '+' + p; // already intl without +
  return p.startsWith('+') ? p : '+' + p;
}

export function normalizeEmail(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

export function normalizePassport(raw: string): string {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

export function normalizeName(raw: string): string {
  return String(raw || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
export function normalizedNameKey(raw: string): string {
  return String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function normalizeCountryName(raw: string): string {
  const m: Record<string,string> = { uk:'United Kingdom','united kingdom':'United Kingdom', usa:'United States','united states':'United States', uae:'United Arab Emirates', dubai:'United Arab Emirates' };
  const k = String(raw||'').trim().toLowerCase();
  return m[k] || normalizeName(raw);
}

export function normalizeUniversityAlias(raw: string): string {
  return String(raw||'').trim().replace(/\s+/g,' ').toLowerCase();
}

export function normalizeDate(raw: string): string {
  if (!raw) return '';
  const s = String(raw).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
  // try DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) { const dd=m[1].padStart(2,'0'), mm=m[2].padStart(2,'0'), yy=m[3].length===2?'20'+m[3]:m[3]; return `${yy}-${mm}-${dd}`; }
  return s;
}

export interface NormalizedStudentRecord {
  oldCrmId: string; studentName: string; firstName: string; lastName: string; normalizedNameKey: string;
  phone: string; whatsapp: string; email: string; passportNumber: string; dateOfBirth: string;
  countryInterest: string; courseInterest: string; universityInterest: string;
}

export function normalizeStudentRow(row: Record<string,string>): NormalizedStudentRecord {
  const studentName = normalizeName(row.studentName || row.name || '');
  const parts = studentName.split(' ');
  const email = normalizeEmail(row.email || '');
  const phone = normalizePhone(row.phone || '');
  const whatsapp = normalizePhone(row.whatsapp || row.phone || '');
  const passportNumber = normalizePassport(row.passportNumber || row.passport || '');
  return {
    oldCrmId: String(row.oldCrmId || row.id || '').trim(),
    studentName, firstName: parts[0]||'', lastName: parts.slice(1).join(' ')||'',
    normalizedNameKey: normalizedNameKey(studentName),
    phone, whatsapp, email, passportNumber,
    dateOfBirth: normalizeDate(row.dateOfBirth || row.dob || ''),
    countryInterest: normalizeCountryName(row.countryInterest || row.country || ''),
    courseInterest: String(row.courseInterest||row.course||'').trim(),
    universityInterest: String(row.universityInterest||row.university||'').trim(),
  };
}
