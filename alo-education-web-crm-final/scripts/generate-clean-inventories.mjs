import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const rootDir = process.cwd();

// Clean source file manifest generator
function getCleanSourceFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);
  files.forEach((file) => {
    if (['node_modules', '.next', '.git', '.gemini', 'verify_alo_extract', 'verify_alo_clean_extract'].includes(file)) return;
    if (file.endsWith('.zip') || file.endsWith('.gz') || file.endsWith('.log')) return;
    
    const fullPath = join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      getCleanSourceFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(relative(rootDir, fullPath));
    }
  });
  return arrayOfFiles;
}

const cleanFiles = getCleanSourceFiles(rootDir);

// 1. FILE_MANIFEST.csv
let fileManifestCsv = 'Relative_Path,File_Category,Size_Bytes\n';
cleanFiles.forEach((f) => {
  const size = statSync(join(rootDir, f)).size;
  let category = 'SOURCE';
  if (f.startsWith('src/')) category = 'SOURCE_CODE';
  else if (f.startsWith('prisma/')) category = 'DATABASE_SCHEMA';
  else if (f.startsWith('public/')) category = 'PUBLIC_ASSET';
  else if (f.endsWith('.md') || f.endsWith('.csv')) category = 'DOCUMENTATION';
  fileManifestCsv += `"${f}","${category}",${size}\n`;
});
writeFileSync(join(rootDir, 'FILE_MANIFEST.csv'), fileManifestCsv);

// 2. DATABASE_MODEL_INVENTORY.csv
const schemaContent = readFileSync(join(rootDir, 'prisma/schema.prisma'), 'utf8');
const modelMatches = schemaContent.match(/model\s+(\w+)\s+\{/g) || [];
const modelNames = modelMatches.map(m => m.replace(/model\s+/, '').replace(/\s+\{/, ''));
let modelCsv = 'Model_Name,Source_File,Category\n';
modelNames.forEach(m => {
  const isUcc = ['EmployeeCommunicationProfile', 'OcrJob', 'OcrFieldExtraction', 'FormFillSuggestion', 'ApprovalRequest', 'IntegrationAuditLog', 'CommunicationConsent', 'ProviderErrorLog', 'ContentApproval'].includes(m);
  modelCsv += `"${m}","prisma/schema.prisma","${isUcc ? 'UCC_GOVERNANCE_EXTENSION' : 'CRM_CORE'}"\n`;
});
writeFileSync(join(rootDir, 'DATABASE_MODEL_INVENTORY.csv'), modelCsv);

// 3. API_INVENTORY.csv
const apiFiles = cleanFiles.filter(f => f.startsWith('src/app/api/') && f.endsWith('route.ts'));
let apiCsv = 'Route_Path,HTTP_Methods,File_Path\n';
apiFiles.forEach(f => {
  const routePath = '/' + f.replace('src/app/', '').replace('/route.ts', '');
  const content = readFileSync(join(rootDir, f), 'utf8');
  const methods = [];
  if (content.includes('export async function GET') || content.includes('export function GET')) methods.push('GET');
  if (content.includes('export async function POST') || content.includes('export function POST')) methods.push('POST');
  if (content.includes('export async function PUT') || content.includes('export function PUT')) methods.push('PUT');
  if (content.includes('export async function DELETE') || content.includes('export function DELETE')) methods.push('DELETE');
  apiCsv += `"${routePath}","${methods.join('|') || 'ALL'}","${f}"\n`;
});
writeFileSync(join(rootDir, 'API_INVENTORY.csv'), apiCsv);

// 4. PAGE_ROUTE_INVENTORY.csv
const pageFiles = cleanFiles.filter(f => f.startsWith('src/app/') && (f.endsWith('page.tsx') || f.endsWith('page.jsx')));
let pageCsv = 'Page_Route,File_Path,Access_Control\n';
pageFiles.forEach(f => {
  let routePath = '/' + f.replace('src/app/', '').replace('/page.tsx', '').replace('/page.jsx', '');
  if (routePath === '/page') routePath = '/';
  const isGated = routePath.includes('admin') || routePath.includes('employee') || routePath.includes('crm') || routePath.includes('student') || routePath.includes('partner');
  pageCsv += `"${routePath}","${f}","${isGated ? 'AUTHENTICATED_RBAC_GATED' : 'PUBLIC_OPEN'}"\n`;
});
writeFileSync(join(rootDir, 'PAGE_ROUTE_INVENTORY.csv'), pageCsv);

// 5. DOCUMENTATION_INVENTORY.csv
const mdFiles = cleanFiles.filter(f => f.endsWith('.md'));
let docCsv = 'Document_Name,File_Path,Size_Bytes\n';
mdFiles.forEach(f => {
  const size = statSync(join(rootDir, f)).size;
  docCsv += `"${f}","${f}",${size}\n`;
});
writeFileSync(join(rootDir, 'DOCUMENTATION_INVENTORY.csv'), docCsv);

console.log(`Clean Source Files: ${cleanFiles.length}`);
console.log(`Models: ${modelNames.length}, APIs: ${apiFiles.length}, Pages: ${pageFiles.length}, Docs: ${mdFiles.length}`);
