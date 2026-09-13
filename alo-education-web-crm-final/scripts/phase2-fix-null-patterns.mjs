// Phase 2 — Fix common TS patterns across many files:
// 1. `let foo = null; try { foo = await db.X.findFirst(...) } catch {...}` → explicit type
// 2. `const results = [];` → `const results: SomeType[] = [];`
//
// We read each file, find these patterns, and patch them.
// This is a targeted, file-by-file fix — not a blind regex.

import { readFile, writeFile } from 'node:fs/promises';

const ROOT = '/home/z/my-project';

const fixes = [
  // employee/profile/route.ts:41 — `let employeeRecord = null` then await db.employee.findFirst
  {
    file: 'src/app/api/employee/profile/route.ts',
    find: /let employeeRecord = null;(\s*try \{\s*employeeRecord = await db\.employee\.findFirst)/,
    replace: (m, rest) => `let employeeRecord: Awaited<ReturnType<typeof db.employee.findFirst>> = null;${rest}`,
  },
  // employee/settings/route.ts:47 — same pattern
  {
    file: 'src/app/api/employee/settings/route.ts',
    find: /let employeeRecord = null;(\s*try \{\s*employeeRecord = await db\.employee\.findFirst)/,
    replace: (m, rest) => `let employeeRecord: Awaited<ReturnType<typeof db.employee.findFirst>> = null;${rest}`,
  },
];

for (const fix of fixes) {
  const filePath = `${ROOT}/${fix.file}`;
  const content = await readFile(filePath, 'utf8');
  const match = content.match(fix.find);
  if (!match) {
    console.log(`  ⊙ ${fix.file}: pattern not found`);
    continue;
  }
  const newContent = content.replace(fix.find, fix.replace);
  await writeFile(filePath, newContent, 'utf8');
  console.log(`  ✓ ${fix.file}: patched`);
}

console.log('Done.');
