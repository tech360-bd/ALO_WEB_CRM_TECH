// ============================================================
// Generate the UCC provider + capability matrices straight from the
// registry source of truth, so the docs can never drift from the code.
//
// Usage: node --experimental-strip-types scripts/generate-ucc-matrices.mjs
// Outputs: docs/integrations/PROVIDER-MATRIX.md
//          docs/integrations/CAPABILITY-MATRIX.md
// ============================================================

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROVIDER_REGISTRY,
  PROVIDER_ORDER,
} from '../src/lib/ucc/providers/registry.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/integrations');
mkdirSync(outDir, { recursive: true });

const CAPS = [
  'oauth', 'token_refresh', 'webhook', 'signature_validation',
  'receive_messages', 'send_messages', 'attachments', 'conversation',
  'comments', 'account_management', 'revocation', 'publishing',
  'advertising', 'analytics', 'live_test',
];

const stamp = new Date().toISOString().slice(0, 10);

// ---- PROVIDER-MATRIX.md -------------------------------------------------
const pm = [];
pm.push('# Provider Matrix — Unified Communication Center');
pm.push('');
pm.push(`> Generated from \`src/lib/ucc/providers/registry.ts\` on ${stamp}. Do not edit by hand.`);
pm.push('>');
pm.push('> **Status legend (mandate §109):** every provider below is at most');
pm.push('> `CODE_COMPLETE` / `CONFIGURATION_REQUIRED` / `PROVIDER_APPROVAL_REQUIRED` /');
pm.push('> `LIVE_TEST_PENDING`. **None are `LIVE_VERIFIED`** — no provider has completed');
pm.push('> live authorization + webhook + message verification in this environment.');
pm.push('');
pm.push('| Provider | Code | Credentials | OAuth | Webhook | Approval | Live Test | Overall Status |');
pm.push('|---|---|---|---|---|---|---|---|');
for (const code of PROVIDER_ORDER) {
  const def = PROVIDER_REGISTRY[code];
  const has = (c) => {
    const d = def.capabilities.find((x) => x.capability === c);
    return d ? d.provider : '—';
  };
  const approval = def.approvalRequired ? 'REQUIRED' : 'NOT_REQUIRED';
  // Overall status is the honest code-state ceiling; never LIVE_VERIFIED.
  const overall = def.approvalRequired
    ? 'PROVIDER_APPROVAL_REQUIRED'
    : 'CONFIGURATION_REQUIRED';
  pm.push(`| ${def.name} | \`${code}\` | CONFIGURATION_REQUIRED | ${has('oauth')} | ${has('webhook')} | ${approval} | LIVE_TEST_PENDING | ${overall} |`);
}
pm.push('');
pm.push('## What "Overall Status" means here');
pm.push('');
pm.push('It is the **computed** status (mandate §83), not a manual label. The full');
pm.push('chain is `configuration → credentials → provider approval → OAuth → webhook →');
pm.push('live message test`. A provider only reaches `LIVE_TEST_VERIFIED` when a real');
pm.push('provider interaction has been recorded as evidence. See');
pm.push('`src/lib/ucc/providers/status.ts`.');
pm.push('');
writeFileSync(resolve(outDir, 'PROVIDER-MATRIX.md'), pm.join('\n'));

// ---- CAPABILITY-MATRIX.md ----------------------------------------------
const cm = [];
cm.push('# Capability Matrix — Unified Communication Center');
cm.push('');
cm.push(`> Generated from \`src/lib/ucc/providers/registry.ts\` on ${stamp}. Do not edit by hand.`);
cm.push('>');
cm.push('> **Provider** = the official API\'s stance (verified against provider docs).');
cm.push('> **Impl** = our codebase\'s stance. `NOT_SUPPORTED` means the official API does');
cm.push('> not offer the capability — it is NEVER a missing implementation (mandate §53).');
cm.push('');
cm.push('Values: `YES` / `NO` / `PARTIAL` / `NOT_SUPPORTED` (provider) · `IMPL` / `PART` / `—` / `N/A` (implementation).');
cm.push('');
// Header
cm.push('| Capability | ' + PROVIDER_ORDER.map((c) => PROVIDER_REGISTRY[c].name.split(' ')[0]).join(' | ') + ' |');
cm.push('|---|' + PROVIDER_ORDER.map(() => '---|').join(''));
const implMark = { IMPLEMENTED: 'IMPL', PARTIAL: 'PART', NOT_IMPLEMENTED: '—', NOT_APPLICABLE: 'N/A' };
for (const cap of CAPS) {
  const cells = PROVIDER_ORDER.map((code) => {
    const d = PROVIDER_REGISTRY[code].capabilities.find((x) => x.capability === cap);
    if (!d) return '—';
    return `${d.provider}<br>${implMark[d.implementation]}`;
  });
  cm.push(`| \`${cap}\` | ` + cells.join(' | ') + ' |');
}
cm.push('');
cm.push('## NOT_SUPPORTED explanations (mandate §5, §53)');
cm.push('');
for (const code of PROVIDER_ORDER) {
  const def = PROVIDER_REGISTRY[code];
  const uns = def.capabilities.filter((c) => c.provider === 'NOT_SUPPORTED' || c.provider === 'NO');
  if (!uns.length) continue;
  cm.push(`### ${def.name} (\`${code}\`)`);
  for (const u of uns) {
    cm.push(`- \`${u.capability}\` — **${u.provider}**: ${u.note ?? 'no official endpoint'}`);
  }
  cm.push('');
}
writeFileSync(resolve(outDir, 'CAPABILITY-MATRIX.md'), cm.join('\n'));

console.log('Wrote docs/integrations/PROVIDER-MATRIX.md and CAPABILITY-MATRIX.md');
console.log(`Providers: ${PROVIDER_ORDER.length}, capabilities: ${CAPS.length}`);
