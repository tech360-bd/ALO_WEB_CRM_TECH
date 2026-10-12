// Read-only repository measurement. Never connects to a DB or reads file bytes
// from upload/storage directories. Historical summaries are NOT requirements.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const relative = p => path.relative(root, p).replaceAll(path.sep, '/');
function files(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : e.isFile() ? [path.join(dir,e.name)] : []);
}
const pages = files(path.join(root,'src/app')).filter(p=>/\/page\.(tsx?|jsx?)$/.test(p)&&!p.includes('/api/')).map(relative);
const api = files(path.join(root,'src/app/api')).filter(p=>/\/route\.(tsx?|jsx?)$/.test(p)).map(relative);
const route = file => '/'+file.replace(/^src\/app\//,'').replace(/\/(?:page|route)\.[jt]sx?$/,'').replace(/^(?:page|route)\.[jt]sx?$/,'').split('/').filter(p=>!/^\(.*\)$/.test(p)&&!p.startsWith('@')).join('/');
function inventory(paths) {
  const rows=paths.map(file=>({file,route:route(file)}));
  const counts={};const duplicates={};
  for(const row of rows) {
    const group=row.route.split('/').filter(Boolean)[paths===api?1:0]||'(root)';
    counts[group]=(counts[group]||0)+1;
    (duplicates[row.route]??=[]).push(row.file);
  }
  return {files:rows.length,uniquePaths:new Set(rows.map(r=>r.route)).size,groups:counts,duplicatePaths:Object.fromEntries(Object.entries(duplicates).filter(([,v])=>v.length>1)),rows};
}
const schema=readFileSync(path.join(root,'prisma/schema.prisma'),'utf8');
const models=[...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m=>m[1]);
const generated=require('@prisma/client').Prisma.dmmf.datamodel.models.map(m=>m.name);
const candidates=['MASTER-REQUIREMENT-REGISTER.md','SECURITY-AUDIT.md','API_INVENTORY.csv','PAGE_ROUTE_INVENTORY.csv','ROUTE_INVENTORY.csv',...files(path.join(root,'docs/final-master')).filter(p=>/FINAL_(REQUIREMENTS_TRACEABILITY|FRONTEND_ROUTE_AUDIT|API_ROUTE_AUDIT|DATABASE_AUDIT|SECURITY_AUDIT)\.md$/.test(p)).map(relative),...files(path.join(root,'docs/audit')).filter(p=>p.endsWith('.md')).map(relative)];
const result={date:'2026-10-11',scope:'current working tree; src/app only, excluding nested archived copy, route groups stripped, API counts files not HTTP methods; no completion inference',userTotals:{requirements:165,statusSum:155,routes:161,portalSum:189,api:86,apiStatusSum:85,models:132},exactOriginalFiveAudits:'NOT IDENTIFIED; source document paths or attachments required',pages:inventory(pages),api:inventory(api),database:{schemaModels:models.length,generatedModels:generated.length,namesMatch:models.length===generated.length&&models.every(m=>generated.includes(m)),enums:[...schema.matchAll(/^enum\s+\w+\s*\{/gm)].length,migrationFiles:files(path.join(root,'prisma/migrations')).filter(p=>p.endsWith('/migration.sql')).length,liveDatabase:'NOT ACCESSED'},auditsInspected:candidates.map(file=>({file,sha256:createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex')}))};
const output=path.join(root,'AUDIT/phase2-gates-2026-10-11/repository-counts.json');
writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pages:result.pages.files,uniquePagePaths:result.pages.uniquePaths,apiFiles:result.api.files,uniqueApiPaths:result.api.uniquePaths,database:result.database,output:relative(output)},null,2));
