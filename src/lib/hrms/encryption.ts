// ALO HRMS — AES-256-GCM Encryption for sensitive fields (NID, bank, passport, TIN)
// Uses Node crypto, key from env HRMS_ENCRYPTION_KEY (32 bytes hex or utf8). Falls back to dev key (NOT for prod).
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const configured = process.env.HRMS_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!configured && process.env.NODE_ENV === 'production') throw new Error('HRMS encryption key is required');
  const raw = configured || 'alo-education-hrms-32b-dev-key-!';
  // derive 32 bytes via SHA256 if not exactly 32
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) return Buffer.from(raw, 'hex');
  if (raw.length >= 32) return Buffer.from(raw.slice(0,32));
  const hash = crypto.createHash('sha256').update(raw).digest();
  return hash;
}

export function encryptField(plain: string): string {
  if (!plain) return "";
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
  } catch (error) { throw error; }
}

export function decryptField(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const [ivHex, tagHex, dataHex] = cipherText.split(':');
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex,'hex'));
    decipher.setAuthTag(Buffer.from(tagHex,'hex'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex,'hex')), decipher.final()]);
    return dec.toString('utf8');
  } catch { return cipherText; }
}

// helpers for object encryption (bank, nid, passport, tin, driving)
export const SENSITIVE_FIELDS = ['nidNumber','passportNumber','tinNumber','drivingLicense','bankAccount','bankRouting','mobileBankingNumber'] as const;

export function encryptSensitive(obj: Record<string,any>): Record<string,any> {
  const out = {...obj};
  for (const f of SENSITIVE_FIELDS) if (out[f]) out[f] = encryptField(String(out[f]));
  return out;
}
export function decryptSensitive(obj: Record<string,any>): Record<string,any> {
  const out = {...obj};
  for (const f of SENSITIVE_FIELDS) if (out[f]) out[f] = decryptField(String(out[f]));
  return out;
}
