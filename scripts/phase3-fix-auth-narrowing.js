// Phase 3 fix script: Fix authenticateRequest narrowing.
//
// The broken pattern:
//   const auth = await authenticateRequest(request);
//   if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
//   auth.userId  // TS error: auth is NextResponse | AuthContext
//
// The fix:
//   const auth = await authenticateRequest(request);
//   if (auth instanceof NextResponse) return auth;
//   auth.userId  // OK — auth is narrowed to AuthContext
//
// `authenticateRequest` never returns null/undefined — it returns either an
// AuthContext (success) or a NextResponse (error). So `if (!auth)` is always
// false, and the subsequent `auth.userId` access is unsafe.

const fs = require('fs');
const path = require('path');

const API_DIR = '/home/z/my-project/remediation-work/src/app/api';

let filesChanged = 0;
let patternsFixed = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkDir(full));
    else if (e.name === 'route.ts' || e.name === 'route.tsx') files.push(full);
  }
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Only process files that import authenticateRequest
  if (!content.includes('authenticateRequest')) return false;

  // Pattern: `if (!auth) return NextResponse.json({ ... }, { status: 401 });`
  // Replace with: `if (auth instanceof NextResponse) return auth;`
  //
  // We match several variations of the error response.
  const patterns = [
    // Pattern A: `if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });`
    /if\s*\(\s*!auth\s*\)\s*return\s+NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*['"]Unauthorized['"]\s*\}\s*,\s*\{\s*status:\s*401\s*\}\s*\)\s*;?/g,
    // Pattern B: `if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`
    /if\s*\(\s*!auth\s*\)\s*return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\}\s*,\s*\{\s*status:\s*401\s*\}\s*\)\s*;?/g,
    // Pattern C: `if (!auth) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });`
    /if\s*\(\s*!auth\s*\)\s*return\s+NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*['"]Authentication required['"]\s*\}\s*,\s*\{\s*status:\s*401\s*\}\s*\)\s*;?/g,
    // Pattern D: generic — `if (!auth) return NextResponse.json({...}, { status: 401 });`
    /if\s*\(\s*!auth\s*\)\s*return\s+NextResponse\.json\(\s*\{[^}]+\}\s*,\s*\{\s*status:\s*401\s*\}\s*\)\s*;?/g,
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      content = content.replace(pattern, 'if (auth instanceof NextResponse) return auth;');
      changed = true;
      patternsFixed += matches.length;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    filesChanged++;
    console.log(`✓ ${path.relative(API_DIR, filePath)}`);
  }
  return changed;
}

const files = walkDir(API_DIR);
console.log(`Scanning ${files.length} route files for authenticateRequest narrowing issues...`);
console.log('');

for (const f of files) {
  fixFile(f);
}

console.log('');
console.log(`=== SUMMARY ===`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Patterns fixed: ${patternsFixed}`);
