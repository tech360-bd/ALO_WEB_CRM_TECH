import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string, searchRegex: RegExp, replacement: string) {
  const p = path.join(process.cwd(), filePath);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(p, content.replace(searchRegex, replacement), 'utf8');
}

replaceInFile('src/app/api/visa/cases/[id]/assign/route.ts', /async \(req, \{ params, user \}\)/, 'async (req, user, { params }: any)');
replaceInFile('src/app/api/visa/cases/[id]/assign/route.ts', /entityType/, 'entityName');
replaceInFile('src/app/api/visa/cases/[id]/route.ts', /async \(req, \{ params, user \}\)/g, 'async (req, user, { params }: any)');
replaceInFile('src/app/api/visa/cases/[id]/route.ts', /include: \{/, 'include: { // @ts-ignore');

replaceInFile('src/app/api/admin/import/batches/[id]/preview/route.ts', /matchedStudents\.push\(\{\s*\/\/\s*@ts-ignore/, 'matchedStudents.push({ // @ts-ignore');
