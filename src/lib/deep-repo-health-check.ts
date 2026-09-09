import fs from 'fs';
import path from 'path';

console.log(`\n=== DEEP REPOSITORY HEALTH & IMPORT SCANNER ===\n`);

const projectRoot = path.join(process.cwd(), 'src');
let totalFiles = 0;
let brokenImports: { file: string; importPath: string }[] = [];

function getAllFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) {
        files.push(...getAllFiles(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allTsFiles = getAllFiles(projectRoot);
totalFiles = allTsFiles.length;

console.log(`Total TypeScript Source Files Found: ${totalFiles}`);

// Check import resolution for @/ alias
for (const filePath of allTsFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importMatches = content.matchAll(/from\ ['"](@\/[^'"]+)['"]/g);

  for (const match of importMatches) {
    const aliasPath = match[1];
    const relativePath = aliasPath.replace(/^@\//, '');
    const possiblePaths = [
      path.join(projectRoot, relativePath),
      path.join(projectRoot, relativePath + '.ts'),
      path.join(projectRoot, relativePath + '.tsx'),
      path.join(projectRoot, relativePath, 'index.ts'),
      path.join(projectRoot, relativePath, 'index.tsx'),
      path.join(projectRoot, relativePath, 'page.tsx'),
      path.join(projectRoot, relativePath, 'route.ts'),
    ];

    const exists = possiblePaths.some((p) => fs.existsSync(p));
    if (!exists) {
      brokenImports.push({ file: path.relative(process.cwd(), filePath), importPath: aliasPath });
    }
  }
}

console.log(`\nImport Resolution Check Complete.`);
if (brokenImports.length === 0) {
  console.log(`[PASS] 0 Broken Imports Found across all ${totalFiles} source files!\n`);
} else {
  console.log(`[FAIL] Found ${brokenImports.length} Broken Imports:`);
  brokenImports.forEach((b) => console.log(`  File: ${b.file} -> Import: ${b.importPath}`));
}
