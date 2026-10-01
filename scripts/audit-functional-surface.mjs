/** Offline inventory only. Does not import app code, access a database, or request a URL.
 * Lexical/AST evidence is NOT functional verification. Never copies source literals,
 * env values or payloads into reports. Framework roots != reachability proof.
 */
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = process.cwd();
const auditBase = '9e504ad2'; // Existing repository before this audit; avoid recursive indexing of generated outputs.
const listed = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', auditBase], { encoding: 'utf8', maxBuffer: 20e6 }).split('\0').filter(Boolean);
const additions = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8', maxBuffer: 20e6 }).split('\0').filter(p => /^(src|tests|scripts)\//.test(p));
const paths = [...new Set([...listed, ...additions])].filter(p => existsSync(p) && statSync(p).isFile()).sort();
const fileSet = new Set(paths); const ext = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '/index.ts', '/index.tsx', '/index.js'];
const methods = new Set(['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD']);
const dbMethods = new Set(['findMany','findUnique','findUniqueOrThrow','findFirst','findFirstOrThrow','create','createMany','update','updateMany','upsert','delete','deleteMany','count','aggregate','groupBy']);
const guards = new Set(['authenticateUnified','authenticateStudentRequest','requireStudentAccess','withAuth','authenticateRequest','getServerSession','requireCron','authorizeCronRequest','requireAuth','requireStudentAuth','withStudentAuth','canDecideApproval','checkPermission','hasPermission','validateRequestAccess']);
const records=[], routes=[], apis=[], surfaces=[];
function resolveImport(file, spec) {
 const base = spec.startsWith('@/') ? 'src/'+spec.slice(2) : spec.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)) : '';
 if (!base) return null;
 return [base,...ext.map(e=>base+e)].find(p=>fileSet.has(p)) || null;
}
function routeOf(file) {
 const match = file.match(/^(?:src\/)?app\/(.*)\/(page|route)\.[^.]+$/) || file.match(/^(?:src\/)?app\/()(page|route)\.[^.]+$/);
 if (!match) return null;
 return '/'+match[1].split('/').filter(s=>s && !s.startsWith('(') && !s.startsWith('@')).join('/');
}
function classification(file) {
 if (file.startsWith('src/app/')) return /\/route\./.test(file)?'App Router API handler':/\/page\./.test(file)?'App Router page':'App Router supporting source';
 if (file.startsWith('src/components/')) return 'UI component (purpose/reachability require semantic review)';
 if (file.startsWith('src/')) return 'Application support module';
 if (/^(alo-education-web-crm-final|deploy-build|alo-cpanel|public_html|\.repair-backup)/.test(file)) return 'Legacy/exported copy; not assumed active in Next root or deployed ZIP';
 if (/^prisma\/migrations/.test(file)) return 'Historical migration; applied history unknown';
 if (/^prisma\//.test(file)) return /seed/.test(file)?'Operator seed, NOT approved for production execution':'Database schema/support';
 if (/^(scripts|\.zscripts)\//.test(file)) return 'Operator utility; do not execute merely to audit';
 if (/^tests\//.test(file)) return 'Test source (not evidence of production pass)';
 if (/^public\//.test(file)) return 'Public static asset';
 if (/^storage\//.test(file)) return 'Tracked storage/content artifact; privacy/reachability requires review';
 if (/\.(md|txt|log|csv|jsonl)$/i.test(file)||/^(docs|documentation|AUDIT|evidence)/i.test(file)) return 'Documentation/data/evidence; not app execution proof';
 if (/^(backend|mini-services)\//.test(file)) return 'Auxiliary service; runtime/deployment connection unverified';
 return 'Configuration/asset/other tracked file; role requires review';
}
for(const file of paths) {
 const buf=readFileSync(file), textLike=!buf.subarray(0,8192).includes(0) && buf.length<8e6;
 const text=textLike?buf.toString('utf8'):''; const source=/\.[cm]?[jt]sx?$/.test(file);
 const r={file,bytes:buf.length,sha256:createHash('sha256').update(buf).digest('hex'),purpose:classification(file),scan:textLike?(source?'TypeScript AST + lexical':'Lexical text scan'):'Metadata only (binary/large artifact)',imports:[],usedBy:[],route:routeOf(file),methods:[],environment:[],db:[],guards:[],policy:[],inputs:[],responses:[],signals:[],ui:[],apiCalls:[],serverActions:[],status:'NOT VERIFIED',requiredTest:source?'Reachability + role/input/error/empty + DB/provider persistence + frontend journey':'Content/config/runtime consumer review',result:'Inventoried only; not functionally executed'};
 const markers=[['TODO',/\bTODO\b/],['FIXME',/\bFIXME\b/],['placeholder/mock/demo/simulation',/\b(mock|fake|demo|placeholder|simulat(?:ed|ion|e)|not implemented)\b/i],['silent catch',/catch\s*(?:\([^)]*\))?\s*(?:=>\s*)?\{\s*\}/],['return null',/\breturn\s+null\b/],['console error',/console\.error\s*\(/],['type suppression',/@ts-(?:nocheck|ignore)|as any/],['disabled marker',/\bdisabled\b|enabled:\s*false/]];
 text.split('\n').forEach((line,i)=>{for(const [kind,regex] of markers)if(regex.test(line))r.signals.push({line:i+1,kind});});
 if(source){
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,/x$/.test(file)?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const line=n=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
  const namedArrays = new Map();
  for(const stmt of sf.statements)if(ts.isVariableStatement(stmt))for(const d of stmt.declarationList.declarations)if(ts.isIdentifier(d.name)&&d.initializer&&ts.isArrayLiteralExpression(d.initializer))namedArrays.set(d.name.text,d.initializer);

  function addImport(spec) {if(!/^(?:@?[a-zA-Z0-9_.\/-]+)$/.test(spec))return;r.imports.push({specifier:spec,resolved:resolveImport(file,spec)});}
  function visit(n){
   if((ts.isImportDeclaration(n)||ts.isExportDeclaration(n))&&n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier))addImport(n.moduleSpecifier.text);
   if(ts.isCallExpression(n)) {
    const expr=n.expression; const called=ts.isIdentifier(expr)?expr.text:ts.isPropertyAccessExpression(expr)?expr.name.text:'';
    if((called==='require'||expr.kind===ts.SyntaxKind.ImportKeyword)&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0]))addImport(n.arguments[0].text);
    if(guards.has(called)||/^(?:require|assert|verify|check|authenticate|authorize|can).*(?:Auth|Role|Permission|Access|Owner|Signature|Scope)/.test(called))r.guards.push({name:called,line:line(n)});
    if(['json','formData','text','safeParse','parse'].includes(called))r.inputs.push({kind:called,line:line(n)});
    if(ts.isPropertyAccessExpression(expr)&&/searchParams$/.test(expr.expression.getText(sf))&&called==='get'&&ts.isStringLiteral(n.arguments[0]))r.inputs.push({kind:'query',name:n.arguments[0].text,line:line(n)});

    if(ts.isPropertyAccessExpression(expr)) {
     const receiver=expr.expression.getText(sf).replace(/\s+/g,' ');
     const match=receiver.match(/^(?:db|prisma|tx|transaction)(?:\s+as\s+any)?\)?\.(\w+)$/)||receiver.match(/^\((?:db|prisma|tx) as any\)\.(\w+)$/);
     if(match&&dbMethods.has(called))r.db.push({modelDelegate:match[1],operation:called,line:line(n)});
     if(/^\$transaction$|^\$(queryRaw|executeRaw)/.test(called))r.db.push({modelDelegate:'(client)',operation:called,line:line(n)});
    }
    if(called==='fetch'||['get','post','put','patch','delete'].includes(called)) {
     const arg=n.arguments[0];if(arg&&(ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg)||ts.isTemplateExpression(arg))){
      const val=ts.isTemplateExpression(arg)?arg.head.text:arg.text;
      if(val.startsWith('/api/'))r.apiCalls.push({path:val.split('?')[0],dynamic:ts.isTemplateExpression(arg),line:line(n)});
     }
    }
   }
   if(ts.isPropertyAssignment(n)){
    const name=n.name.getText(sf).replaceAll("'",'').replaceAll('"','');
    const policyArray = ts.isArrayLiteralExpression(n.initializer)?n.initializer:ts.isIdentifier(n.initializer)?namedArrays.get(n.initializer.text):null;
    if(['requireRoles','requireUserTypes','roles','allowRoles','userTypes'].includes(name)&&policyArray)r.policy.push({name,values:policyArray.elements.filter(ts.isStringLiteral).map(e=>e.text),line:line(n)});
    if(name==='status'&&ts.isNumericLiteral(n.initializer)&&Number(n.initializer.text)>=100&&Number(n.initializer.text)<=599)r.responses.push({httpStatus:Number(n.initializer.text),line:line(n)});
  }
   if(ts.isPropertyAccessExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.getText(sf)==='process.env')r.environment.push({name:n.name.text,line:line(n)});
   if(ts.isVariableDeclaration(n)&&n.initializer?.getText(sf)==='process.env'&&ts.isObjectBindingPattern(n.name))for(const el of n.name.elements)r.environment.push({name:(el.propertyName||el.name).getText(sf),line:line(el)});
   if(ts.isExpressionStatement(n)&&ts.isStringLiteral(n.expression)&&n.expression.text==='use server')r.serverActions.push({line:line(n),scope:n.parent===sf?'module':'function'});
   if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
    const tag=n.tagName.getText(sf),attrs=n.attributes.properties.filter(ts.isJsxAttribute).map(a=>a.name.getText(sf));
    let kind=tag.toLowerCase()==='form'?'Forms':tag==='button'||tag==='Button'||attrs.some(a=>/^on(Click|Submit|Select|Change|ValueChange|CheckedChange|Drop)$/.test(a))?'Buttons/actions':null;
    if(kind)r.ui.push({kind,tag,line:line(n),handlers:attrs.filter(a=>/^on[A-Z]/.test(a)),disabledAttribute:attrs.includes('disabled')});
   }
   ts.forEachChild(n,visit);
  }
  visit(sf);
  for(const stmt of sf.statements){
   const exported=stmt.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword);
   if(exported&&ts.isFunctionDeclaration(stmt)&&stmt.name&&methods.has(stmt.name.text))r.methods.push(stmt.name.text);
   if(exported&&ts.isVariableStatement(stmt))for(const d of stmt.declarationList.declarations)if(ts.isIdentifier(d.name)&&methods.has(d.name.text))r.methods.push(d.name.text);
   if(ts.isExportDeclaration(stmt)&&stmt.exportClause&&ts.isNamedExports(stmt.exportClause))for(const e of stmt.exportClause.elements)if(methods.has(e.name.text))r.methods.push(e.name.text);
  }
 }
 r.imports=[...new Map(r.imports.map(x=>[x.specifier,x])).values()]; r.methods=[...new Set(r.methods)];
 if(file.startsWith('src/')){
  for(const u of r.ui)surfaces.push({file,...u,status:'NOT VERIFIED'});
  for(const q of r.db)surfaces.push({file,kind:'CRUD/query call sites',...q,status:'NOT VERIFIED'});
  for(const a of r.serverActions)surfaces.push({file,kind:'Server action directives',...a,status:'NOT VERIFIED'});
 }
 records.push(r);
 if(r.route!==null&&file.startsWith('src/app/')){
  if(/\/page\./.test(file))routes.push({route:r.route,file,status:'NOT VERIFIED',reason:'No full role/data/browser/DB journey evidence; not a claim the route is broken'});
  if(/\/route\./.test(file))for(const method of r.methods.length?r.methods:['UNRESOLVED EXPORT'])apis.push({method,endpoint:r.route,file,status:['/api/cron/weekly-university-scan','/api/cron/weekly-ai-agent','/api/storage/upload'].includes(r.route)?'DISABLED':['/api/student-portal/payments','/api/crm/finance','/api/crm/ceo/dashboard','/api/documents'].includes(r.route)?'PARTIAL':'NOT VERIFIED',reason:'Source inventoried; legitimate+unauthorized persistence/response tests not complete for this endpoint'});
 }
}
const byFile=new Map(records.map(r=>[r.file,r]));
for(const r of records)for(const i of r.imports)if(i.resolved)byFile.get(i.resolved)?.usedBy.push(r.file);
for(const r of records) r.usedBy=[...new Set(r.usedBy)];
mkdirSync('docs/functionality',{recursive:true});
const write=(p,s)=>writeFileSync(p,s+'\n');
write('docs/functionality/files.jsonl',records.map(r=>JSON.stringify(r)).join('\n'));
write('docs/functionality/surfaces.jsonl',surfaces.map(r=>JSON.stringify(r)).join('\n'));
const esc=v=>String(v).replaceAll('|','\\|').replaceAll('\n',' ');
const short=(a,n=5)=>a.length?a.slice(0,n).join(', ')+(a.length>n?` (+${a.length-n}; full index)`:''):'None statically resolved';
const table=(headers,rows)=>'| '+headers.join(' | ')+' |\n|'+headers.map(()=> '---').join('|')+'|\n'+rows.map(row=>'| '+row.map(esc).join(' | ')+' |').join('\n');
write('docs/FULL_FUNCTIONALITY_INVENTORY.md',`# Full functionality inventory — discovery index\n\nSource checkpoint: ${execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()} plus current local repairs. Generated offline by scripts/audit-functional-surface.mjs.\n\nScope: every tracked file at pre-audit ${auditBase}, read at current working-tree contents, plus current source/tests/scripts additions. New derived reports are deliverables, not recursively rescanned as application source. Generated output hashes would otherwise be self-referential.\n\n**${records.length} tracked/source files inventoried; no claim all files were semantically reviewed or executed.** Every file in that explicit scope is indexed, including legacy exported copies, storage, data, config, PHP/auxiliary services and assets. Binary/large files have metadata only. No source literals/secrets reproduced. AST scans resolve static imports, DB calls, env names, JSX controls, server directives and risk markers; indirect/re-export/dynamic dispatch, PHP calls, routes created by rewrites and runtime role tables need further review. No-import is NOT dead-code proof. TODO/mock markers are candidates, not automatic defects.\n\nFull unabridged dependencies, used-by, line-number findings: [files.jsonl](functionality/files.jsonl). UI/form/action/query occurrences: [surfaces.jsonl](functionality/surfaces.jsonl). Tables below abbreviate lists only, not files.\n\n`+table(['FILE','PURPOSE','DEPENDENCIES','USED BY','ROUTES','DATABASE IMPACT','EXTERNAL DEPENDENCIES','CURRENT STATUS','REQUIRED TEST','RESULT'],records.map(r=>[r.file,r.purpose,short(r.imports.map(i=>i.specifier)),short(r.usedBy),r.route??'Not a canonical route file',short(r.db.map(q=>q.modelDelegate+'.'+q.operation)),short([...new Set(r.environment.map(e=>e.name))]),r.status,r.requiredTest,r.result])));
write('docs/ROUTE_FUNCTIONALITY_MATRIX.md',`# Route functionality matrix\n\n${routes.length} canonical src/app page declarations. Runtime rewrites, API routes, metadata endpoints and legacy snapshot files remain in the full inventory/config index; dynamic routes are templates, not tested concrete IDs. Every route is NOT VERIFIED for full journey execution (not a claim every page is broken). CI build is not browser/data/action proof. Dependencies are static, role boundary includes ancestor layouts/proxy. No production form or mutation submitted.\n\n`+table(['ROUTE','ROLE','LOAD','DATA','ACTIONS','AUTH','API','RESULT','FIX'],routes.map(r=>{const f=byFile.get(r.file);return [r.route,short(f.policy.map(p=>p.name+': '+p.values.join(','))),'Not executed; see public probe evidence','DB/provider connection not verified',`${f.ui.length} direct controls; imported controls in index`,short(f.guards.map(g=>g.name)),short(f.apiCalls.map(a=>a.path)),r.status,`${r.file}; staged desktop/mobile valid/invalid/empty/error journey required`]})));
write('docs/API_FUNCTIONALITY_MATRIX.md',`# API functionality matrix\n\n${apis.length} explicitly exported method/endpoint pairs in ${new Set(apis.map(a=>a.file)).size} canonical route files. Implicit framework HEAD/OPTIONS behavior requires runtime testing; not silently counted as explicit implementations. File-level auth/query signals do NOT prove method-level enforcement. Static source coverage is complete for enumerated files, functional execution coverage is not. Actual production response remains unobserved except bounded probes in runtime audit. NOT VERIFIED means not fully executed/reviewed; PARTIAL means named source-path repairs have isolated tests but not end-to-end verification; DISABLED is source quarantine, not deployed artifact proof. Known unresolved source defects are listed separately in FUNCTIONALITY_REPAIR_LOG.md; these are not concealed by the general default.\n\n`+table(['METHOD','ENDPOINT','AUTH','ROLE','INPUT','DATABASE','TRANSACTION','EXPECTED RESPONSE','ACTUAL RESPONSE','STATUS','FIX'],apis.map(a=>{const f=byFile.get(a.file);return [a.method,a.endpoint,short(f.guards.map(g=>g.name)),short(f.policy.map(p=>p.name+': '+p.values.join(','))),short(f.inputs.map(i=>i.kind+(i.name?':'+i.name:''))),short(f.db.map(q=>q.modelDelegate+'.'+q.operation)),f.db.some(q=>q.operation==='$transaction')?'Transaction signal in file; boundary must be traced':'No direct transaction signal (indirection possible)',short([...new Set(f.responses.map(p=>String(p.httpStatus)))])+ '; default Response 200/other helpers need method tracing','Not executed against production/test DB',a.status,`${a.file}; callers: ${short(records.filter(r=>r.apiCalls.some(c=>c.path===a.endpoint)).map(r=>r.file),3)}`]})));
const summary={auditBase,files:records.length,activeSourceFiles:records.filter(r=>r.file.startsWith('src/')).length,textScanned:records.filter(r=>r.scan!=='Metadata only (binary/large artifact)').length,metadataOnly:records.filter(r=>r.scan==='Metadata only (binary/large artifact)').length,pages:routes.length,apiFiles:new Set(apis.map(a=>a.file)).size,apiMethods:apis.length,forms:surfaces.filter(s=>s.kind==='Forms').length,actions:surfaces.filter(s=>s.kind==='Buttons/actions').length,querySites:surfaces.filter(s=>s.kind==='CRUD/query call sites').length,serverActionDirectives:surfaces.filter(s=>s.kind==='Server action directives').length,riskSignals:records.reduce((n,r)=>n+r.signals.length,0)};
write('docs/functionality/summary.json',JSON.stringify(summary,null,2));console.log(summary);
