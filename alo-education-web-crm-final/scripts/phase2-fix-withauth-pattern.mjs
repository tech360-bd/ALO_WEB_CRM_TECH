// Phase 2 — Fix withAuth()() broken pattern.
// The withAuth helper returns a function (request: Request) => Promise<NextResponse>.
// Many routes call the returned function with zero arguments: withAuth(...)( ).
// Fix: pass the request argument that Next.js provided to the route handler.
//
// Strategy:
// 1. For each route file, find every `export async function METHOD(params) { ... }` block.
// 2. Determine the request parameter name (the param whose type is Request or NextRequest).
// 3. If no such param exists, add `request: Request` to the signature.
// 4. Replace `withAuth(...)\(\s*\)` with `withAuth(...)(requestParamName)`.
//
// We do NOT touch:
// - Files using `export const METHOD = withAuth(...)` (already correct).
// - Files where withAuth is called inside a non-route function.
//
// We DO touch dynamic params like [studentId] — the request param is still passed first.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
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

function findRequestParam(signature) {
  // signature looks like: (request: Request) or (request: NextRequest) or (req: Request, ctx: { params: ... }) or ()
  // Strip parens
  const inner = signature.replace(/^\(/, '').replace(/\)$/, '').trim();
  if (!inner) return null;
  // Split on commas at top level (no nesting for simplicity — params rarely have nested commas except ctx: { params: { id } })
  // We'll match: identifier ':' TypeExpression
  const params = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '{' || ch === '(' || ch === '<') depth++;
    if (ch === '}' || ch === ')' || ch === '>') depth--;
    if (ch === ',' && depth === 0) {
      params.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) params.push(current.trim());

  for (const p of params) {
    // Match: name: Type
    const m = p.match(/^(\w+)\s*:\s*(\w[\w<>{}]*)$/);
    if (!m) continue;
    const name = m[1];
    const type = m[2];
    if (type === 'Request' || type === 'NextRequest' || type === 'NextIncomingMessage' || type.startsWith('Request') || type.startsWith('NextRequest')) {
      return name;
    }
  }
  return null;
}

function fixRouteFile(content, filePath) {
  let newContent = content;
  let changes = 0;

  // Match: export async function METHOD(params) {
  // The params can span multiple lines and contain nested braces.
  const methodRegex = new RegExp(`export\\s+async\\s+function\\s+(${HTTP_METHODS.join('|')})\\s*\\(`, 'g');

  let m;
  const methodPositions = [];
  while ((m = methodRegex.exec(content)) !== null) {
    methodPositions.push({ methodName: m[1], start: m.index, paramsStart: m.index + m[0].length - 1 });
  }

  for (const { methodName, paramsStart } of methodPositions) {
    // Find matching close paren
    let depth = 1;
    let i = paramsStart + 1;
    while (i < content.length && depth > 0) {
      if (content[i] === '(') depth++;
      else if (content[i] === ')') depth--;
      i++;
    }
    const paramsEnd = i - 1; // index of closing paren
    const signature = content.slice(paramsStart, paramsEnd + 1); // includes parens

    // Find the function body start (next `{` after the closing paren)
    let bodyStart = paramsEnd + 1;
    while (bodyStart < content.length && content[bodyStart] !== '{') bodyStart++;
    bodyStart++; // skip the {

    // Find the matching close brace of the function body
    depth = 1;
    let bodyEnd = bodyStart;
    while (bodyEnd < content.length && depth > 0) {
      if (content[bodyEnd] === '{') depth++;
      else if (content[bodyEnd] === '}') depth--;
      bodyEnd++;
    }
    bodyEnd--; // index of closing brace

    const body = content.slice(bodyStart, bodyEnd);

    // Find all `withAuth(...)()` patterns in this body.
    // We need to find the OUTER closing paren of withAuth(...), then check if it's followed by ().
    // Strategy: walk the body, find "withAuth(", then find matching close, then check if next chars are `()`.

    const withAuthOccurrences = [];
    const withAuthRegex = /withAuth\s*\(/g;
    let wa;
    while ((wa = withAuthRegex.exec(body)) !== null) {
      const openParenIndex = wa.index + wa[0].length - 1; // index of (
      // Find matching close paren
      let d = 1;
      let j = openParenIndex + 1;
      while (j < body.length && d > 0) {
        if (body[j] === '(') d++;
        else if (body[j] === ')') d--;
        j++;
      }
      const closeParenIndex = j - 1; // index of outer )
      // Skip whitespace after close paren
      let k = closeParenIndex + 1;
      while (k < body.length && /\s/.test(body[k])) k++;
      // Check if next is `()` (empty call)
      if (body[k] === '(' && body[k + 1] === ')') {
        withAuthOccurrences.push({ openParenIndex, closeParenIndex, callOpenIndex: k, callCloseIndex: k + 1 });
      }
    }

    if (withAuthOccurrences.length === 0) continue;

    // Determine the request param name
    let requestParam = findRequestParam(signature);

    // If no request param, we need to add one
    let newSignature = signature;
    if (!requestParam) {
      requestParam = 'request';
      // Add request: Request as the first parameter
      const inner = signature.replace(/^\(/, '').replace(/\)$/, '').trim();
      if (inner) {
        newSignature = `(${requestParam}: Request, ${inner})`;
      } else {
        newSignature = `(${requestParam}: Request)`;
      }
    }

    // Now rebuild: new signature + new body (with `()` -> `(requestParam)`)
    // We must apply changes from last to first to keep indices valid.
    let newBody = body;
    for (let idx = withAuthOccurrences.length - 1; idx >= 0; idx--) {
      const occ = withAuthOccurrences[idx];
      // Replace the `()` at [callOpenIndex, callCloseIndex] with `(requestParam)`
      newBody = newBody.slice(0, occ.callOpenIndex) + `(${requestParam})` + newBody.slice(occ.callCloseIndex + 1);
    }

    // Reassemble
    const before = content.slice(0, paramsStart);
    const between = content.slice(paramsEnd + 1, bodyStart); // includes the ` {` or `{` etc.
    const after = content.slice(bodyEnd + 1);
    newContent = before + newSignature + between + newBody + after;
    // Update content so subsequent method fixes use the new content
    content = newContent;
    changes += withAuthOccurrences.length;
  }

  return { content: newContent, changes };
}

const files = await walk(API_DIR);
console.log(`[phase2-withauth] scanning ${files.length} route files`);

for (const f of files) {
  const content = await readFile(f, 'utf8');
  try {
    const { content: newContent, changes } = fixRouteFile(content, f);
    if (changes > 0) {
      await writeFile(f, newContent, 'utf8');
      changed.push({ file: relative(ROOT, f), changes });
    } else {
      skipped.push({ file: relative(ROOT, f), reason: 'no withAuth()() pattern' });
    }
  } catch (e) {
    errors.push({ file: relative(ROOT, f), error: e.message });
  }
}

console.log(`[phase2-withauth] CHANGED: ${changed.length} files, ${changed.reduce((s, c) => s + c.changes, 0)} total fixes`);
console.log(`[phase2-withauth] SKIPPED: ${skipped.length} files`);
console.log(`[phase2-withauth] ERRORS: ${errors.length} files`);
if (errors.length) {
  for (const e of errors) console.log(`  ERROR ${e.file}: ${e.error}`);
}

// Save report
import { writeFile as wf } from 'node:fs/promises';
const report = {
  changed: changed.sort((a, b) => b.changes - a.changes),
  skipped: skipped.length,
  errors,
};
await wf(join(ROOT, 'remediation-work', 'phase2-withauth-fixes.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(`[phase2-withauth] report saved to remediation-work/phase2-withauth-fixes.json`);
