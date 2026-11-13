const fs = require('fs');
const path = require('path');

const css = fs.readFileSync('src/app/globals.css', 'utf8');
const defined = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?)$/.test(e.name)) files.push(p);
  }
})('src');

const missing = new Map();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/var\(\s*(--[a-z0-9-]+)\s*[,)]/gi)) {
    const name = m[1];
    if (defined.has(name)) continue;
    if (name.startsWith('--radix-')) continue;
    if (!missing.has(name)) missing.set(name, new Set());
    missing.get(name).add(f);
  }
}

const real = [...missing.entries()].sort((a, b) => b[1].size - a[1].size);
console.log('undefined CSS variables still referenced:', real.length);
for (const [name, where] of real) {
  console.log(`${name}  (${where.size} files)  ${[...where].slice(0, 2).join(', ')}`);
}
