/**
 * ALO Education — official document letterhead + seal.
 *
 * Every official document the company issues (salary slip, offer letter,
 * employment contract, experience letter, partnership agreement) is produced on
 * the ALO Education letterhead supplied by the company, and carries the official
 * seal only when a Super Admin is the issuing authority.
 *
 * Two rules are enforced here rather than trusted to callers:
 *
 *   1. LETTERHEAD — the artwork (`ALO_BRAND_ASSETS.letterhead`) is always the
 *      page background. There is no "plain" mode, so a document cannot be
 *      produced off-letterhead by accident.
 *   2. SEAL — `isSealAuthorized()` is the only way to obtain `sealAuthorized`.
 *      It returns true for a Super Admin session only. Everyone else gets the
 *      letterhead plus an explicit "seal withheld" note, never a blank space
 *      that could later be filled in by someone else.
 *
 * Assets are inlined as data URIs so a downloaded document still renders the
 * letterhead and seal when it is opened from a file:// path or forwarded as an
 * email attachment.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ALO_BRAND_ALT, ALO_BRAND_ASSETS, OFFICIAL_SEAL, hasSuperAdminAuthority, type SealDocumentKind } from '@/lib/brand/brand-assets';
import { ALO_CONTACT, ALO_TAGLINE } from '@/lib/alo-site-info';

export interface IssuingAuthority {
  userType?: string | null;
  roles?: string[] | null;
  /** Acting-as (support/view-as) session id, when the actor is not acting as themselves. */
  actingAsSessionId?: string | null;
  actingAs?: boolean | null;
}

export function isSealAuthorized(authority: IssuingAuthority | null | undefined): boolean {
  if (!authority) return false;
  // The seal attests the Super Admin personally issued the document. An
  // acting-as / view-as session — where the actor is browsing as someone
  // else — can therefore never apply it, even for a Super Admin actor.
  if (authority.actingAs || (authority.actingAsSessionId && authority.actingAsSessionId.trim())) return false;
  return hasSuperAdminAuthority([authority.userType, ...(authority.roles || [])]);
}

export interface OfficialDocumentInput {
  /** Document family — controls the seal policy note. */
  kind: SealDocumentKind;
  /** Printed title, e.g. "Approved salary slip". */
  title: string;
  /** Reference/ID printed in the footer block. */
  reference?: string;
  /** Already-escaped HTML for the body of the document. */
  bodyHtml: string;
  /** Who the document is issued to (printed under the title). */
  issuedTo?: string;
  /** Extra rows printed in the document meta table. */
  meta?: Array<{ label: string; value: string }>;
  /** Issuing authority resolved from the server session. */
  authority: IssuingAuthority | null | undefined;
  /** Override for tests — never taken from a client payload in a route. */
  issuedAt?: string;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

const assetCache = new Map<string, string>();

/** Inline a /public asset as a data URI (cached for the process lifetime). */
export async function assetDataUri(publicUrl: string): Promise<string> {
  const cached = assetCache.get(publicUrl);
  if (cached) return cached;
  const relative = publicUrl.replace(/^\/+/, '');
  const filePath = path.join(process.cwd(), 'public', relative);
  const extension = path.extname(filePath).slice(1).toLowerCase();
  const mime = MIME_BY_EXTENSION[extension] || 'application/octet-stream';
  const buffer = await readFile(filePath);
  const uri = `data:${mime};base64,${buffer.toString('base64')}`;
  assetCache.set(publicUrl, uri);
  return uri;
}

/**
 * The official seal is a server-only asset: it must never sit under
 * `/public`, where anyone could download and reuse it without authorisation.
 * Only this module (and the audited seal route, through `getOfficialSealPng`)
 * may read it. Standalone route bundles trace the file via
 * `outputFileTracingIncludes` in next.config.ts.
 */
export const OFFICIAL_SEAL_SERVER_ASSET = 'src/lib/documents/assets/alo-official-seal.png';

let sealPngCache: Buffer | null = null;

/** Read the seal PNG from its server-only location (cached per process). */
export async function getOfficialSealPng(): Promise<Buffer> {
  if (sealPngCache) return sealPngCache;
  sealPngCache = await readFile(path.join(process.cwd(), OFFICIAL_SEAL_SERVER_ASSET));
  return sealPngCache;
}

async function officialSealDataUri(): Promise<string> {
  const cached = assetCache.get(OFFICIAL_SEAL_SERVER_ASSET);
  if (cached) return cached;
  const uri = `data:image/png;base64,${(await getOfficialSealPng()).toString('base64')}`;
  assetCache.set(OFFICIAL_SEAL_SERVER_ASSET, uri);
  return uri;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] as string));
}

function formatMoney(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return escapeHtml(value);
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Builds a complete, print-ready A4 HTML document on the ALO letterhead.
 * The body is caller-supplied HTML and MUST already be escaped.
 */
export async function buildOfficialDocumentHtml(input: OfficialDocumentInput): Promise<string> {
  const sealAuthorized = isSealAuthorized(input.authority);
  // Seal bytes are read only for an authorised Super Admin document; an
  // unauthorised document never touches the seal asset at all.
  const [letterhead, seal] = await Promise.all([
    assetDataUri(ALO_BRAND_ASSETS.letterhead),
    sealAuthorized ? officialSealDataUri() : Promise.resolve(''),
  ]);
  const issuedAt = input.issuedAt
    ? escapeHtml(input.issuedAt)
    : new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const metaRows = (input.meta || [])
    .map((row) => `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`)
    .join('');

  const sealBlock = sealAuthorized
    ? `<div class="seal" role="img" aria-label="${escapeHtml(ALO_BRAND_ALT.seal)}">
         <img src="${seal}" alt="${escapeHtml(ALO_BRAND_ALT.seal)}" />
         <span class="seal-caption">Authorised signatory — Super Admin</span>
       </div>`
    : `<div class="seal seal-withheld" role="note">
         <span>${escapeHtml(OFFICIAL_SEAL.withheldNotice)}</span>
       </div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(input.title)} — ALO Education</title>
<meta name="robots" content="noindex, nofollow" />
<style>
  :root { --blue: #0066CC; --orange: #F37021; --accent: #FFB347; --ink: #000000; --ink-soft: #555555; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #eef1f5; color: var(--ink); }
  body { font-family: 'Open Sans', 'Segoe UI', Arial, sans-serif; font-size: 12.5px; line-height: 1.5; }
  .sheet {
    position: relative; width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff;
    background-image: url('${letterhead}');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    box-shadow: 0 2px 14px rgba(0,0,0,.16);
  }
  .content { padding: 46mm 20mm 58mm; }
  h1 { font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif; font-size: 17px; margin: 0 0 2px; color: var(--blue); letter-spacing: .2px; }
  .kind { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #fff; background: var(--blue); padding: 3px 9px; border-radius: 999px; }
  .issued-to { margin: 10px 0 0; font-size: 12px; color: var(--ink-soft); }
  .issued-to strong { color: var(--ink); }
  .rule { height: 3px; width: 46px; background: var(--accent); border-radius: 999px; margin: 10px 0 14px; }
  table { width: 100%; border-collapse: collapse; }
  table.meta { margin: 0 0 16px; font-size: 12px; }
  table.meta th { text-align: left; width: 42%; color: var(--ink-soft); font-weight: 600; padding: 5px 0; border-bottom: 1px solid #e6eaf0; }
  table.meta td { padding: 5px 0; border-bottom: 1px solid #e6eaf0; font-weight: 600; }
  table.amounts td, table.amounts th { padding: 8px 10px; border-bottom: 1px solid #e6eaf0; }
  table.amounts th { text-align: left; color: var(--ink-soft); font-weight: 600; }
  table.amounts td.value { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  tfoot .total td { border-top: 2px solid var(--blue); font-weight: 800; color: var(--blue); }
  .note { margin-top: 18px; font-size: 11px; color: var(--ink-soft); }
  .sign { margin-top: 26px; display: flex; justify-content: space-between; gap: 24px; font-size: 11.5px; }
  .sign-line { flex: 1; border-top: 1px solid #9aa7b4; padding-top: 5px; color: var(--ink-soft); }
  .seal { position: absolute; right: 18mm; bottom: 44mm; width: 30mm; text-align: center; }
  .seal img { width: 30mm; height: auto; opacity: .92; }
  .seal-caption { display: block; font-size: 8px; color: var(--ink-soft); margin-top: 2px; }
  .seal-withheld {
    border: 1px dashed #b3bcc6; border-radius: 6px; padding: 6px 8px; width: 46mm;
    font-size: 8.5px; line-height: 1.35; color: #6b7785; background: rgba(255,255,255,.75);
  }
  .doc-foot { position: absolute; left: 20mm; right: 20mm; bottom: 20mm; font-size: 9px; color: #6b7785; display: flex; justify-content: space-between; gap: 12px; }
  @media print {
    html, body { background: #fff; }
    .sheet { margin: 0; box-shadow: none; width: auto; min-height: 0; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
  <main class="sheet">
    <div class="content">
      <span class="kind">Official document</span>
      <h1>${escapeHtml(input.title)}</h1>
      <div class="rule"></div>
      ${input.issuedTo ? `<p class="issued-to">Issued to: <strong>${escapeHtml(input.issuedTo)}</strong></p>` : ''}
      ${metaRows ? `<table class="meta"><tbody>${metaRows}</tbody></table>` : ''}
      ${input.bodyHtml}
      <div class="sign">
        <div class="sign-line">Prepared by ALO Education</div>
        <div class="sign-line">Authorised signature</div>
      </div>
      <p class="note">This document is issued on ALO Education letterhead. Verify its authenticity with ALO Education before relying on a copy: ${escapeHtml(ALO_CONTACT.email)} · ${escapeHtml(ALO_CONTACT.mobileDisplay)}.</p>
    </div>
    ${sealBlock}
    <div class="doc-foot">
      <span>${escapeHtml(ALO_TAGLINE)}</span>
      <span>${input.reference ? `Ref ${escapeHtml(input.reference)} · ` : ''}Issued ${issuedAt} (Asia/Dhaka)</span>
    </div>
  </main>
</body>
</html>`;
}

/** Row helper for money tables, used by the salary-slip and offer-letter builders. */
export function moneyRow(label: string, value: unknown, options: { total?: boolean } = {}): string {
  const numeric = Number(value);
  const rendered = Number.isFinite(numeric) ? formatMoney(numeric) : escapeHtml(value);
  return `<tr${options.total ? ' class="total"' : ''}><th scope="row">${escapeHtml(label)}</th><td class="value">${rendered}</td></tr>`;
}
