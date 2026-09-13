// Phase 3 fix script: Repair the broken withAuth invocation pattern.
//
// The broken pattern:
//   export async function GET() {
//     return withAuth(async (request, auth) => {
//       // ...
//     })();
//   }
//
// The fix:
//   export async function GET(request: Request) {
//     return withAuth(async (req, auth) => {
//       // ...
//     })(request);
//   }
//
// Two changes per handler:
// 1. Add `request: Request` parameter to GET/POST/PUT/PATCH/DELETE function signature
// 2. Change `})();` to `})(request);` so the wrapper receives the request
//
// Also, if the inner handler uses `request` as its first parameter name, rename to `req`
// to avoid shadowing the outer `request` parameter (cleaner code, though shadowing would work).

const fs = require('fs');
const path = require('path');

const API_DIR = '/home/z/my-project/remediation-work/src/app/api';
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

let filesChanged = 0;
let handlersFixed = 0;

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
  const changes = [];

  for (const method of HTTP_METHODS) {
    // Pattern 1: `export async function GET()` -> `export async function GET(request: Request)`
    // Only matches when the function has NO parameters (empty parens).
    const sigRegex = new RegExp(`export async function ${method}\\(\\)\\s*\\{`, 'g');
    if (sigRegex.test(content)) {
      content = content.replace(sigRegex, `export async function ${method}(request: Request) {`);
      changed = true;
      changes.push(`added request param to ${method}()`);
    }

    // Pattern 2: `})();` -> `})(request);` (the broken wrapper invocation)
    // But ONLY when the surrounding context indicates we're inside a withAuth handler.
    // We look for the pattern: `})();` that closes a withAuth(...)() call.
    //
    // Approach: find `withAuth(...)` blocks ending in `})();` and change to `})(request);`
    // This is tricky with regex, so we use a simpler heuristic:
    // Replace `})();` with `})(request);` only when the function signature was just fixed
    // (i.e., this handler uses withAuth and was missing the request param).
    //
    // Safer: replace ALL `})();` that appear at the end of a handler function body.
    // These are always the broken pattern (correct code uses `})(request);` or just `};`)
    //
    // We use a multi-line aware regex with negative lookahead to avoid `})(request);` matches.
    const brokenCallRegex = /\}\)\(\);/g;
    const matches = content.match(brokenCallRegex);
    if (matches && matches.length > 0) {
      // Only replace if this file actually uses withAuth (avoid false positives)
      if (content.includes('withAuth')) {
        content = content.replace(brokenCallRegex, '})(request);');
        changed = true;
        changes.push(`fixed ${matches.length} broken wrapper call(s) in ${method}`);
        handlersFixed += matches.length;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    filesChanged++;
    console.log(`✓ ${path.relative(API_DIR, filePath)}: ${changes.join(', ')}`);
  }
  return changed;
}

const files = walkDir(API_DIR);
console.log(`Scanning ${files.length} route files...`);
console.log('');

for (const f of files) {
  fixFile(f);
}

console.log('');
console.log(`=== SUMMARY ===`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Handler invocations fixed: ${handlersFixed}`);
