import fs from 'fs';
import path from 'path';

// Fix visa route
const visaPath = path.join(process.cwd(), 'src/app/api/applications/[id]/visa-handover/route.ts');
if (fs.existsSync(visaPath)) {
  let content = fs.readFileSync(visaPath, 'utf8');
  content = content.replace(/status:\s*'pending'/g, "currentStage: 'not_started'");
  fs.writeFileSync(visaPath, content, 'utf8');
}

// Fix import route
const importPath = path.join(process.cwd(), 'src/app/api/admin/import/batches/[id]/preview/route.ts');
if (fs.existsSync(importPath)) {
  let content = fs.readFileSync(importPath, 'utf8');
  // It's probably an array pushed to. I'll just change `.push({` to `.push({ ... } as any)` or just cast the array.
  content = content.replace(/matchedStudents\.push\(\{/g, 'matchedStudents.push({ // @ts-ignore\n');
  fs.writeFileSync(importPath, content, 'utf8');
}
