// Scan client code for fetch/axios calls to /api/* and verify the route file exists.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
const ROOT = process.cwd();
const results = new Map();
function walk(dir, out=[]) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === '.next') continue; walk(p, out); }
    else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}
const files = [...walk(join(ROOT,'src/app')), ...walk(join(ROOT,'src/components')), ...walk(join(ROOT,'src/lib')), ...walk(join(ROOT,'src/hooks'))];
const routeExists = (apiPath) => {
  // apiPath like /api/crm/finance — try exact route.ts and dynamic segment matches
  const base = join(ROOT, 'src/app', apiPath);
  if (existsSync(join(base, 'route.ts'))) return true;
  const parts = apiPath.split('/').filter(Boolean);
  // walk with dynamic [x] alternatives
  let cur = join(ROOT, 'src/app');
  for (const part of parts) {
    if (existsSync(join(cur, part))) cur = join(cur, part);
    else {
      const dirs = readdirSync(cur, { withFileTypes: true }).filter(d => d.isDirectory() && /^\[.*\]$/.test(d.name)).map(d => d.name);
      if (dirs.length) cur = join(cur, dirs[0]); else return false;
    }
  }
  return existsSync(join(cur, 'route.ts'));
};
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const re = /["'`](\/api\/[a-zA-Z0-9\/_\-\[\]\.\$\{\}]*)["'`]/g;
  let m;
  while ((m = re.exec(src))) {
    const path = m[1].split('?')[0];
    // strip template-literal dynamic parts
    const staticPart = path.replace(/\$\{[^}]*\}/g, 'X');
    if (!staticPart.startsWith('/api/')) continue;
    if (!results.has(staticPart)) results.set(staticPart, { file: f.replace(ROOT+'/',''), missing: null });
    const rec = results.get(staticPart);
    if (rec.missing === null) {
      const checkPath = staticPart.replace(/X/g, '1'); // dynamic -> placeholder
      rec.missing = !routeExists(checkPath.replace(/\/1/g,'')) && !routeExists(staticPart.replace(/X/g,'[id]'));
    }
  }
}
let total=0, missing=0;
for (const [path, rec] of [...results.entries()].sort()) {
  total++;
  if (rec.missing) { missing++; console.log(`MISSING\t${path}\t(first seen: ${rec.file})`); }
}
console.log(`TOTAL_API_PATHS:${total}`);
console.log(`MISSING:${missing}`);
