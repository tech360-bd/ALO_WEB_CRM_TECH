import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function walk(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        files = files.concat(walk(res));
      }
    } else {
      files.push(res);
    }
  }
  return files;
}

const allFiles = walk(path.join(root, 'src'));

let pageCount = 0;
let apiRouteCount = 0;
let apiHandlerCount = 0;
let layoutCount = 0;
let componentCount = 0;
let serverActionCount = 0;

for (const file of allFiles) {
  const rel = path.relative(root, file);
  if (rel.startsWith('src/app/')) {
    if (path.basename(file) === 'page.tsx' || path.basename(file) === 'page.ts') {
      pageCount++;
    }
    if (path.basename(file) === 'route.ts' || path.basename(file) === 'route.tsx') {
      apiRouteCount++;
      const content = fs.readFileSync(file, 'utf8');
      const methods = [...content.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1]);
      apiHandlerCount += methods.length ? methods.length : 1; // Default to 1 if no explicit export pattern detected
    }
    if (path.basename(file) === 'layout.tsx' || path.basename(file) === 'layout.ts') {
      layoutCount++;
    }
  }
  if (rel.startsWith('src/components/') && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
    componentCount++;
  }
  
  // Detect server actions
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('"use server"') || content.includes("'use server'")) {
    serverActionCount++;
  }
}

console.log('FINAL_PAGE_COUNT:', pageCount);
console.log('FINAL_API_ROUTE_COUNT:', apiRouteCount);
console.log('FINAL_API_HANDLER_COUNT:', apiHandlerCount);
console.log('FINAL_LAYOUT_COUNT:', layoutCount);
console.log('FINAL_COMPONENT_COUNT:', componentCount);
console.log('FINAL_SERVER_ACTION_COUNT:', serverActionCount);
