import crypto from "crypto";

// Token encryption for SocialIntegration / SocialAccount (Phase 6/8)
// Uses ENCRYPTION_KEY (64-hex = 32 bytes) for AES-256-GCM
// Never log tokens, never store plain in DB, decrypt only server-side

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY || "";
  if (!hex || hex.length < 64) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY must be 64-hex (32 bytes) in production");
    }
    // Dev fallback — not for prod PII
    return crypto.createHash("sha256").update("dev-fallback-not-for-prod-alo-education-enc-key").digest();
  }
  // If hex 64 chars, use as hex; else hash
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }
  return crypto.createHash("sha256").update(hex).digest();
}

export function encryptToken(plain: string): string {
  if (!plain) return "";
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:enc:tag (base64)
  return `${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`;
}

export function decryptToken(encrypted: string): string {
  if (!encrypted || !encrypted.includes(":")) return encrypted; // plain fallback for migration
  const key = getKey();
  const [ivB64, encB64, tagB64] = encrypted.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.split(":").length === 3 && value.length > 50;
}

// For DB migration — encrypt existing plain tokens
export async function migratePlainTokens() {
  const { db } = await import("@/lib/db");
  const integrations = await (db as any).socialIntegration.findMany({ where: { accessToken: { not: null } } }).catch(() => []);
  let migrated = 0;
  for (const row of integrations) {
    const plain = row.accessToken as string;
    if (plain && !isEncrypted(plain)) {
      const enc = encryptToken(plain);
      await (db as any).socialIntegration.update({ where: { id: row.id }, data: { accessToken: enc } }).catch(() => {});
      migrated++;
    }
    if (row.refreshToken && !isEncrypted(row.refreshToken)) {
      const enc = encryptToken(row.refreshToken);
      await (db as any).socialIntegration.update({ where: { id: row.id }, data: { refreshToken: enc } }).catch(() => {});
    }
  }
  return { migrated };
}
