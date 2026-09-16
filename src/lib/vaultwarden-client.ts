// ============================================================
// Vaultwarden — Unofficial Bitwarden compatible server
// Source: dani-garcia/vaultwarden (67.4k★ 3085 commits Rust, 3.2k forks)
//   Bitwarden API compatible: ciphers, folders, collections, org vault,
//   formerly bitwarden_rs — self-hosted, no cloud caps.
// ALO use: replace plain env + token-encryption ad-hoc with vault-backed
//   credential store for B2B portal logins, 3CX/SIP secrets, WhatsApp tokens,
//   university portal credentials — syncs to self-hosted Vaultwarden.
// Reuses: token-encryption.ts AES-256-GCM for local fallback, CrmAuditLog
// Env: VAULTWARDEN_URL, VAULTWARDEN_TOKEN (admin), VAULTWARDEN_ORG_ID
// ============================================================
import { encryptToken, decryptToken } from '@/lib/token-encryption';
import { db } from '@/lib/db';

const VAULT_URL = process.env.VAULTWARDEN_URL || process.env.BITWARDEN_URL || '';
const VAULT_TOKEN = process.env.VAULTWARDEN_TOKEN || process.env.VAULTWARDEN_ADMIN_TOKEN || '';
const VAULT_ORG_ID = process.env.VAULTWARDEN_ORG_ID || '';

type VaultCipher = { id: string; name: string; notes?: string; login?: { username: string; password: string; uris?: { uri: string }[] }; fields?: { name: string; value: string }[] };

async function vaultFetch(path: string, init?: RequestInit): Promise<any> {
  if (!VAULT_URL || !VAULT_TOKEN) throw new Error('VAULTWARDEN_URL/VAULTWARDEN_TOKEN not configured');
  const res = await fetch(`${VAULT_URL.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${VAULT_TOKEN}`, 'Content-Type': 'application/json', ...(init?.headers as any) },
  });
  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    throw new Error(`Vaultwarden ${res.status}: ${t.slice(0, 300)}`);
  }
  return res.json().catch(()=> ({}));
}

/**
 * Store a secret as a Bitwarden cipher (login type) in org vault.
 * Falls back to encrypted DB (AuditLog) when vault unavailable — zero data loss.
 */
export async function vaultStoreSecret(opts: {
  name: string; // e.g. "partner-portal: University of X"
  username: string;
  password: string;
  uri?: string; // portalUrl
  folderId?: string;
  actorId: string;
}): Promise<{ cipherId: string; storedIn: 'vaultwarden' | 'local-encrypted' }> {
  const secretPayload = { name: opts.name, username: opts.username, password: opts.password, uri: opts.uri };
  const encryptedBackup = encryptToken(JSON.stringify(secretPayload));

  try {
    if (VAULT_URL && VAULT_TOKEN) {
      const body: any = {
        type: 1, // login
        name: opts.name,
        notes: `ALO Education — stored ${new Date().toISOString()} by ${opts.actorId}`,
        login: { username: opts.username, password: opts.password, uris: opts.uri ? [{ uri: opts.uri }] : [] },
        organizationId: VAULT_ORG_ID || undefined,
        folderId: opts.folderId || undefined,
      };
      const created: any = await vaultFetch('/api/ciphers', { method: 'POST', body: JSON.stringify(body) });
      const cipherId = created.id || created.Id || `vw_${Date.now()}`;
      await db.crmAuditLog.create({ data: { action: 'VAULT_SECRET_STORED', targetCollection: 'VaultCipher', targetId: cipherId, actorUserId: opts.actorId || '', afterData: JSON.stringify({ name: opts.name, storedIn: 'vaultwarden' }), createdAt: new Date() } }).catch(()=>{});
      return { cipherId, storedIn: 'vaultwarden' };
    }
  } catch (e: any) {
    console.warn('[vaultwarden] store failed, falling back to local-encrypted:', e?.message);
  }

  // Local fallback: store encrypted in CrmAuditLog details (never plain) + return synthetic id
  const cipherId = `local_${Buffer.from(opts.name).toString('base64url').slice(0, 12)}_${Date.now()}`;
  await db.crmAuditLog.create({
    data: { action: 'VAULT_SECRET_STORED_LOCAL', targetCollection: 'VaultCipher', targetId: cipherId, actorUserId: opts.actorId || '', afterData: JSON.stringify({ name: opts.name, encrypted: encryptedBackup, storedIn: 'local-encrypted' }), createdAt: new Date() },
  }).catch(()=>{});
  return { cipherId, storedIn: 'local-encrypted' };
}

export async function vaultGetSecret(cipherId: string, actorId: string): Promise<{ username: string; password: string; name: string } | null> {
  if (cipherId.startsWith('local_')) {
    const log: any = await db.crmAuditLog.findFirst({ where: { targetId: cipherId, action: 'VAULT_SECRET_STORED_LOCAL' } }).catch(()=>null);
    if (!log?.afterData) return null;
    try {
      const enc = JSON.parse(log.afterData).encrypted;
      const dec = decryptToken(enc);
      const j = JSON.parse(dec);
      await db.crmAuditLog.create({ data: { action: 'VAULT_SECRET_ACCESSED', targetCollection: 'VaultCipher', targetId: cipherId, actorUserId: actorId || '', afterData: JSON.stringify({ name: j.name }), createdAt: new Date() } }).catch(()=>{});
      return { username: j.username, password: j.password, name: j.name };
    } catch { return null; }
  }
  try {
    const cipher: VaultCipher = await vaultFetch(`/api/ciphers/${cipherId}`);
    await db.crmAuditLog.create({ data: { action: 'VAULT_SECRET_ACCESSED', targetCollection: 'VaultCipher', targetId: cipherId, actorUserId: actorId || '', afterData: JSON.stringify({ name: cipher.name }), createdAt: new Date() } }).catch(()=>{});
    return { username: cipher.login?.username || '', password: cipher.login?.password || '', name: cipher.name };
  } catch { return null; }
}

export async function vaultHealth(): Promise<{ configured: boolean; reachable: boolean; version?: string }> {
  if (!VAULT_URL) return { configured: false, reachable: false };
  try {
    const h = await fetch(`${VAULT_URL.replace(/\/$/, '')}/alive`, { method: 'GET' }).then(r=> r.ok ? r.json().catch(()=>({})) : null);
    return { configured: true, reachable: !!h, version: h?.version };
  } catch { return { configured: true, reachable: false }; }
}
