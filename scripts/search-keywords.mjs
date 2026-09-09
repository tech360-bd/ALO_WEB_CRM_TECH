import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const keywords = ['Coming Soon', 'TODO', 'FIXME', 'placeholder', 'Lorem ipsum', 'dummy data', 'mock data'];

function walk(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'delivery-evidence-20260731-043211', 'backups'].includes(entry.name)) {
        files = files.concat(walk(res));
      }
    } else {
      files.push(res);
    }
  }
  return files;
}

const files = walk(root).filter((f) => /\.(tsx|ts|js|jsx|mjs|cjs|json|css|sql|html)$/.test(f));

const counts = {};
for (const kw of keywords) {
  counts[kw] = 0;
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const kw of keywords) {
    const regex = new RegExp(kw, 'gi');
    const matches = content.match(regex);
    if (matches) {
      counts[kw] += matches.length;
    }
  }
}

console.log('--- KEYWORD OCCURRENCES ---');
for (const [kw, count] of Object.entries(counts)) {
  console.log(`${kw}: ${count} matches`);
}
