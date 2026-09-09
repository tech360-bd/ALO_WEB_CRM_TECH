import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const rootDir = process.cwd();

// 1. FILE_MANIFEST.csv
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);
  files.forEach((file) => {
    if (['node_modules', '.next', '.git'].includes(file)) return;
    const fullPath = join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(relative(rootDir, fullPath));
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(rootDir);
let fileManifestCsv = 'Relative_Path,File_Type,Size_Bytes\n';
allFiles.forEach((f) => {
  const size = statSync(join(rootDir, f)).size;
  const ext = f.split('.').pop() || '';
  fileManifestCsv += `"${f}","${ext}",${size}\n`;
});
writeFileSync(join(rootDir, 'FILE_MANIFEST.csv'), fileManifestCsv);
console.log(`Generated FILE_MANIFEST.csv with ${allFiles.length} files.`);

// 2. DATABASE_MODEL_INVENTORY.csv
const schemaContent = readFileSync(join(rootDir, 'prisma/schema.prisma'), 'utf8');
const modelMatches = schemaContent.match(/model\s+(\w+)\s+\{/g) || [];
const modelNames = modelMatches.map(m => m.replace(/model\s+/, '').replace(/\s+\{/, ''));
let modelCsv = 'Model_Name,Source_File,Status\n';
modelNames.forEach(m => {
  modelCsv += `"${m}","prisma/schema.prisma","ACTIVE"\n`;
});
writeFileSync(join(rootDir, 'DATABASE_MODEL_INVENTORY.csv'), modelCsv);
console.log(`Generated DATABASE_MODEL_INVENTORY.csv with ${modelNames.length} models.`);

// 3. API_INVENTORY.csv
const apiFiles = allFiles.filter(f => f.startsWith('src/app/api/') && f.endsWith('route.ts'));
let apiCsv = 'Route_Path,HTTP_Methods,File_Path,Module\n';
apiFiles.forEach(f => {
  const routePath = '/' + f.replace('src/app/', '').replace('/route.ts', '');
  const content = readFileSync(join(rootDir, f), 'utf8');
  const methods = [];
  if (content.includes('export async function GET') || content.includes('export function GET')) methods.push('GET');
  if (content.includes('export async function POST') || content.includes('export function POST')) methods.push('POST');
  if (content.includes('export async function PUT') || content.includes('export function PUT')) methods.push('PUT');
  if (content.includes('export async function DELETE') || content.includes('export function DELETE')) methods.push('DELETE');
  if (content.includes('export async function PATCH') || content.includes('export function PATCH')) methods.push('PATCH');
  apiCsv += `"${routePath}","${methods.join('|') || 'ALL'}","${f}","CRM_UCC"\n`;
});
writeFileSync(join(rootDir, 'API_INVENTORY.csv'), apiCsv);
console.log(`Generated API_INVENTORY.csv with ${apiFiles.length} API endpoints.`);

// 4. PAGE_ROUTE_INVENTORY.csv
const pageFiles = allFiles.filter(f => f.startsWith('src/app/') && (f.endsWith('page.tsx') || f.endsWith('page.jsx')));
let pageCsv = 'Page_Route,File_Path,Access_Level\n';
pageFiles.forEach(f => {
  let routePath = '/' + f.replace('src/app/', '').replace('/page.tsx', '').replace('/page.jsx', '');
  if (routePath === '/page') routePath = '/';
  const isGated = routePath.includes('admin') || routePath.includes('employee') || routePath.includes('crm') || routePath.includes('student') || routePath.includes('partner');
  pageCsv += `"${routePath}","${f}","${isGated ? 'AUTHENTICATED_GATED' : 'PUBLIC'}"\n`;
});
writeFileSync(join(rootDir, 'PAGE_ROUTE_INVENTORY.csv'), pageCsv);
console.log(`Generated PAGE_ROUTE_INVENTORY.csv with ${pageFiles.length} page routes.`);

// 5. DOCUMENTATION_INVENTORY.csv
const mdFiles = allFiles.filter(f => f.endsWith('.md'));
let docCsv = 'Document_Name,File_Path,Size_Bytes\n';
mdFiles.forEach(f => {
  const size = statSync(join(rootDir, f)).size;
  docCsv += `"${f}","${f}",${size}\n`;
});
writeFileSync(join(rootDir, 'DOCUMENTATION_INVENTORY.csv'), docCsv);
console.log(`Generated DOCUMENTATION_INVENTORY.csv with ${mdFiles.length} markdown documents.`);
