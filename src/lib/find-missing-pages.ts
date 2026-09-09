import fs from 'fs';
import path from 'path';

function scanAppDir(dir: string, base: string = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: { route: string; status: 'HAS_PAGE' | 'EMPTY_DIR' | 'NO_PAGE'; files: string[] }[] = [];

  const filesInDir = entries.filter((e) => !e.isDirectory()).map((e) => e.name);
  const subDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'api');

  if (base !== '' && !base.startsWith('/api')) {
    const hasPage = filesInDir.some((f) => f.startsWith('page.'));
    if (filesInDir.length === 0 && subDirs.length === 0) {
      results.push({ route: base, status: 'EMPTY_DIR', files: [] });
    } else if (!hasPage && subDirs.length === 0) {
      results.push({ route: base, status: 'NO_PAGE', files: filesInDir });
    } else if (hasPage) {
      results.push({ route: base, status: 'HAS_PAGE', files: filesInDir });
    }
  }

  for (const sub of subDirs) {
    const subPath = path.join(dir, sub.name);
    const subRoute = `${base}/${sub.name}`;
    results.push(...scanAppDir(subPath, subRoute));
  }

  return results;
}

const appPath = path.join(process.cwd(), 'src/app');
const scan = scanAppDir(appPath);

console.log(`\n=== APP ROUTE SCAN RESULTS ===\n`);
const empty = scan.filter((s) => s.status === 'EMPTY_DIR');
const noPage = scan.filter((s) => s.status === 'NO_PAGE');
const hasPage = scan.filter((s) => s.status === 'HAS_PAGE');

console.log(`Total Routes Scanned: ${scan.length}`);
console.log(`Routes with Valid page.tsx: ${hasPage.length}`);
console.log(`EMPTY DIRECTORIES (0 files): ${empty.length}`);
console.log(`DIRECTORIES WITHOUT page.tsx: ${noPage.length}\n`);

if (empty.length > 0) {
  console.log(`--- EMPTY DIRECTORIES ---`);
  empty.forEach((e) => console.log(`  [EMPTY] ${e.route}`));
}

if (noPage.length > 0) {
  console.log(`\n--- DIRECTORIES WITHOUT PAGE.TSX ---`);
  noPage.forEach((e) => console.log(`  [NO PAGE] ${e.route} (Files: ${e.files.join(', ')})`));
}
