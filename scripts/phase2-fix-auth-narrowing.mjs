// Phase 2 — Fix authenticateRequest auth narrowing across all API routes.
//
// The broken pattern is:
//   const auth = await authenticateRequest(request);
//   if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
//   // use auth.userId  -- ERROR: auth is still AuthContext | NextResponse
//
// The correct pattern is:
//   const auth = await authenticateRequest(request);
//   if (auth instanceof NextResponse) return auth;
//   // use auth.userId  -- OK: auth is narrowed to AuthContext
//
// This script finds all files that use authenticateRequest and have the broken `if (!auth)` pattern,
// then replaces it with the correct `if (auth instanceof NextResponse) return auth;` pattern.
//
// If the file uses `if (!auth) return NextResponse.json(...)` we change it to:
//   if (auth instanceof NextResponse) return auth;
// (which returns the actual error response from authenticateRequest, not a generic one).

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = '/home/z/my-project';
const API_DIR = join(ROOT, 'src', 'app', 'api');

const changed = [];
const skipped = [];

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

const files = await walk(API_DIR);
console.log(`[phase2-auth-narrow] scanning ${files.length} route files`);

for (const f of files) {
  const content = await readFile(f, 'utf8');
  if (!content.includes('authenticateRequest')) {
    skipped.push({ file: relative(ROOT, f), reason: 'no authenticateRequest' });
    continue;
  }

  let newContent = content;
  let changes = 0;

  // Pattern 1: if (!auth) return NextResponse.json({...}, { status: 401 });
  // Capture the exact line and replace.
  // Be careful: the response body and status may vary. Use a regex that captures the structure.
  const patterns = [
    // Pattern 1a: if (!auth) return NextResponse.json({ success: false, error: '...' }, { status: 401 });
    /if \(!auth\) return NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*['"][^'"]+['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\);/g,
    // Pattern 1b: if (!auth) return NextResponse.json({ success: false, message: '...' }, { status: 401 });
    /if \(!auth\) return NextResponse\.json\(\s*\{\s*success:\s*false,\s*message:\s*['"][^'"]+['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\);/g,
    // Pattern 1c: if (!auth) { return NextResponse.json({...}, { status: 401 }); }
    /if \(!auth\)\s*\{\s*return NextResponse\.json\(\s*\{\s*success:\s*false,\s*(?:error|message):\s*['"][^'"]+['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\);\s*\}/g,
    // Pattern 1d: if (!auth) return new NextResponse(..., { status: 401 })
    /if \(!auth\) return new NextResponse\([^)]*\);/g,
  ];

  for (const pattern of patterns) {
    newContent = newContent.replace(pattern, (match) => {
      changes++;
      return 'if (auth instanceof NextResponse) return auth;';
    });
  }

  if (changes > 0) {
    await writeFile(f, newContent, 'utf8');
    changed.push({ file: relative(ROOT, f), changes });
  } else {
    skipped.push({ file: relative(ROOT, f), reason: 'no broken pattern found' });
  }
}

console.log(`[phase2-auth-narrow] CHANGED: ${changed.length} files, ${changed.reduce((s, c) => s + c.changes, 0)} total fixes`);
console.log(`[phase2-auth-narrow] SKIPPED: ${skipped.length} files`);

import { writeFile as wf } from 'node:fs/promises';
await wf(join(ROOT, 'remediation-work', 'phase2-auth-narrow-fixes.json'), JSON.stringify({ changed, skipped: skipped.length }, null, 2), 'utf8');
console.log(`[phase2-auth-narrow] report saved`);
