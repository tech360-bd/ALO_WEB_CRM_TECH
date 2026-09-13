// Phase 2 — Fix withAuth()() broken pattern. (Rewrite — surgical, no body rebuild.)
//
// The broken pattern is: `withAuth(...)()`  (empty parens after the outer close paren)
// We replace it with:    `withAuth(...)(requestParamName)`
//
// To find the request param name, we walk backwards from the withAuth call
// to find the enclosing `export async function METHOD(...) {` signature.
//
// If the function has no request param, we add `request: Request` to its signature.
//
// We never rebuild file content from scratch — only string-replace specific spans.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = '/home/z/my-project';
const API_DIR = join(ROOT, 'src', 'app', 'api');
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const changed = [];
const skipped = [];
const errors = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.name === 'route.ts' || e.name === 'route.js') {
      files.push(full);
    }
  }
  return files;
}

function findMatchingCloseParen(content, openIndex) {
  // content[openIndex] === '('
  let depth = 1;
  let i = openIndex + 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '(') depth++;
    else if (content[i] === ')') depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
}

function findMatchingCloseBrace(content, openIndex) {
  let depth = 1;
  let i = openIndex + 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
}

function findEnclosingRouteSignature(content, withAuthIndex) {
  // Walk backwards to find `export async function METHOD(...) {`
  // The signature's open brace must come before withAuthIndex, and the matching close brace must come after.
  // Strategy: find all `export async function METHOD` occurrences in the file, then for each, check if withAuthIndex is within its body.
  const methodRegex = new RegExp(`export\\s+async\\s+function\\s+(${HTTP_METHODS.join('|')})\\b`, 'g');
  const candidates = [];
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    const methodName = m[1];
    const nameEnd = m.index + m[0].length;
    // Find the parameter list open paren
    let i = nameEnd;
    while (i < content.length && /\s/.test(content[i])) i++;
    if (content[i] !== '(') continue;
    const paramsOpen = i;
    const paramsClose = findMatchingCloseParen(content, paramsOpen);
    if (paramsClose === -1) continue;
    // Find the body open brace
    let j = paramsClose + 1;
    while (j < content.length && /\s/.test(content[j])) j++;
    if (content[j] !== '{') continue;
    const bodyOpen = j;
    const bodyClose = findMatchingCloseBrace(content, bodyOpen);
    if (bodyClose === -1) continue;
    if (withAuthIndex > bodyOpen && withAuthIndex < bodyClose) {
      candidates.push({ methodName, paramsOpen, paramsClose, bodyOpen, bodyClose });
    }
  }
  // Return the innermost (smallest body containing withAuthIndex)
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.bodyClose - a.bodyOpen) - (b.bodyClose - b.bodyOpen));
  return candidates[0];
}

function findRequestParam(signature) {
  // signature is the content between ( and ), exclusive
  const inner = signature.trim();
  if (!inner) return null;
  const params = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '{' || ch === '(' || ch === '<' || ch === '[') depth++;
    if (ch === '}' || ch === ')' || ch === '>' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      params.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) params.push(current.trim());
  for (const p of params) {
    const m = p.match(/^(\w+)\s*:\s*(\w[\w<>{}|]*)$/);
    if (!m) continue;
    if (m[2] === 'Request' || m[2] === 'NextRequest' || m[2].startsWith('Request') || m[2].startsWith('NextRequest')) {
      return m[1];
    }
  }
  return null;
}

function fixRouteFile(content, filePath) {
  // Find all `withAuth(` occurrences
  const withAuthRegex = /withAuth\s*\(/g;
  const occurrences = [];
  let m;
  while ((m = withAuthRegex.exec(content)) !== null) {
    const openParen = m.index + m[0].length - 1;
    const closeParen = findMatchingCloseParen(content, openParen);
    if (closeParen === -1) continue;
    // Skip whitespace after close paren
    let k = closeParen + 1;
    while (k < content.length && /\s/.test(content[k])) k++;
    // Check for empty call: ( )
    if (content[k] === '(' && content[k + 1] === ')') {
      occurrences.push({ withAuthIndex: m.index, callOpen: k, callClose: k + 1 });
    }
  }

  if (occurrences.length === 0) return { content, changes: 0 };

  // Apply changes from last to first to keep indices valid
  // For each occurrence, find the enclosing signature, determine the request param name,
  // and replace `()` with `(requestParamName)`.
  // If the signature has no request param, we need to add one — but we can only do that once per function.
  // So group occurrences by their enclosing signature.

  // First pass: find enclosing signature for each occurrence
  const planned = [];
  for (const occ of occurrences) {
    const sig = findEnclosingRouteSignature(content, occ.withAuthIndex);
    if (!sig) {
      errors.push({ file: relative(ROOT, filePath), error: `no enclosing route signature for withAuth at index ${occ.withAuthIndex}` });
      continue;
    }
    const paramsInner = content.slice(sig.paramsOpen + 1, sig.paramsClose);
    let requestParam = findRequestParam(paramsInner);
    planned.push({ occ, sig, requestParam, paramsInner });
  }

  if (planned.length === 0) return { content, changes: 0 };

  // Group by signature (use bodyOpen as unique key)
  const bySig = new Map();
  for (const p of planned) {
    const key = p.sig.bodyOpen;
    if (!bySig.has(key)) bySig.set(key, { sig: p.sig, requestParam: p.requestParam, occurrences: [] });
    bySig.get(key).occurrences.push(p.occ);
    // If any occurrence has no request param, mark the group as needing one added
    if (!p.requestParam) bySig.get(key).requestParam = null;
  }

  // Apply changes from last to first
  let newContent = content;
  let totalChanges = 0;

  // Sort groups by bodyOpen descending so we can apply changes without affecting earlier indices
  const sortedGroups = [...bySig.values()].sort((a, b) => b.sig.bodyOpen - a.sig.bodyOpen);

  for (const group of sortedGroups) {
    let requestParam = group.requestParam;
    let sig = group.sig;

    // If no request param, add one to the signature
    if (!requestParam) {
      requestParam = 'request';
      // We need to modify the signature: insert `request: Request, ` after the open paren (if there are other params) or `request: Request` if empty
      const paramsInner = newContent.slice(sig.paramsOpen + 1, sig.paramsClose);
      let newParamsInner;
      if (paramsInner.trim()) {
        newParamsInner = `${requestParam}: Request, ${paramsInner.trimStart()}`;
      } else {
        newParamsInner = `${requestParam}: Request`;
      }
      // Replace the params inner content
      newContent = newContent.slice(0, sig.paramsOpen + 1) + newParamsInner + newContent.slice(sig.paramsClose);
      // The paramsClose index has shifted by the delta
      const delta = newParamsInner.length - paramsInner.length;
      // The bodyOpen also shifts by delta
      sig = { ...sig, paramsClose: sig.paramsClose + delta, bodyOpen: sig.bodyOpen + delta, bodyClose: sig.bodyClose + delta };
    }

    // Sort occurrences in this group descending by callOpen
    const occs = group.occurrences.sort((a, b) => b.callOpen - a.callOpen);
    for (const occ of occs) {
      // Recompute callOpen/callClose relative to newContent (they may have shifted if we modified the signature)
      // Since we're going descending and only modifying content AFTER the signature's bodyOpen,
      // and occurrences are within the body, we need to adjust their indices by the delta if bodyOpen moved.
      // But since we modified the signature (which is BEFORE the body), all occurrences after the bodyOpen shift by delta.
      // Actually — we already updated sig.bodyOpen above. The occurrences' original indices were relative to the original content.
      // We need to re-find them. Let's just re-search for the pattern within the new body.

      // Simpler: just re-find the withAuth()() pattern starting from a known offset.
      // For now, since we sorted groups descending and apply changes from last to first within each group,
      // and within a group the signature change has already been applied, we just need to adjust occ indices by the sig delta.
      const delta = sig.bodyOpen - group.sig.bodyOpen;
      const adjustedCallOpen = occ.callOpen + delta;
      const adjustedCallClose = occ.callClose + delta;
      // Verify it's still `()`
      if (newContent[adjustedCallOpen] !== '(' || newContent[adjustedCallClose] !== ')') {
        errors.push({ file: relative(ROOT, filePath), error: `expected () at index ${adjustedCallOpen} but found ${newContent.slice(adjustedCallOpen, adjustedCallClose + 1)}` });
        continue;
      }
      newContent = newContent.slice(0, adjustedCallOpen) + `(${requestParam})` + newContent.slice(adjustedCallClose + 1);
      totalChanges++;
    }
  }

  return { content: newContent, changes: totalChanges };
}

const files = await walk(API_DIR);
console.log(`[phase2-withauth-v2] scanning ${files.length} route files`);

for (const f of files) {
  const content = await readFile(f, 'utf8');
  try {
    const { content: newContent, changes } = fixRouteFile(content, f);
    if (changes > 0) {
      await writeFile(f, newContent, 'utf8');
      changed.push({ file: relative(ROOT, f), changes });
    } else {
      skipped.push({ file: relative(ROOT, f) });
    }
  } catch (e) {
    errors.push({ file: relative(ROOT, f), error: e.message });
  }
}

console.log(`[phase2-withauth-v2] CHANGED: ${changed.length} files, ${changed.reduce((s, c) => s + c.changes, 0)} total fixes`);
console.log(`[phase2-withauth-v2] SKIPPED: ${skipped.length} files`);
console.log(`[phase2-withauth-v2] ERRORS: ${errors.length} files`);
if (errors.length) {
  for (const e of errors.slice(0, 20)) console.log(`  ERROR ${e.file}: ${e.error}`);
}

import { writeFile as wf } from 'node:fs/promises';
await wf(join(ROOT, 'remediation-work', 'phase2-withauth-fixes-v2.json'), JSON.stringify({ changed, skipped: skipped.length, errors }, null, 2), 'utf8');
console.log(`[phase2-withauth-v2] report saved`);
