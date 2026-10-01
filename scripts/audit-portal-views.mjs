// Offline AST supplements: legacy view declarations and rewrite aliases.
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
const source = (file) => ts.createSourceFile(file, readFileSync(file,'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const store=source('src/lib/stores/portal-store.ts'); const entry=source('src/app/page.tsx');
const rendered = new Map(); const rewrite=[];
function visit(n){
 if(ts.isPropertyAssignment(n)&&ts.isStringLiteral(n.name)&&(ts.isJsxSelfClosingElement(n.initializer)||ts.isJsxElement(n.initializer))) rendered.set(n.name.text,entry.getLineAndCharacterOfPosition(n.getStart(entry)).line+1);
 if(ts.isCaseClause(n)&&ts.isStringLiteral(n.expression))rendered.set(n.expression.text,entry.getLineAndCharacterOfPosition(n.getStart(entry)).line+1);
 ts.forEachChild(n,visit);
}
visit(entry);
let views=[];
for(const stmt of store.statements)if(ts.isTypeAliasDeclaration(stmt)&&stmt.name.text==='PortalView'&&ts.isUnionTypeNode(stmt.type))views=stmt.type.types.filter(ts.isLiteralTypeNode).filter(t=>ts.isStringLiteral(t.literal)).map(t=>({view:t.literal.text,entryLine:rendered.get(t.literal.text)||null,status:'NOT VERIFIED'}));
const cfg=source('next.config.ts');
function configVisit(n){if(ts.isObjectLiteralExpression(n)){
 const props=n.properties.filter(ts.isPropertyAssignment);const get=key=>props.find(p=>p.name.getText(cfg)===key)?.initializer;
 const s=get('source'), d=get('destination');if(s&&d&&ts.isStringLiteral(s)&&ts.isStringLiteral(d))rewrite.push({source:s.text,destination:d.text,status:'NOT VERIFIED'});
}ts.forEachChild(n,configVisit)}configVisit(cfg);
writeFileSync('docs/functionality/portal-views.json',JSON.stringify({note:'Static declarations, not proof of permission/entry/component hydration. Missing root mapping can be rendered in nested dispatch; do not delete as dead code.',views,rewrites:rewrite},null,2)+'\n');
const header='# SPA view and rewrite supplement\n\n'+views.length+' PortalView type literals; '+rewrite.length+' rewrite aliases. Canonical page and API matrices are separate. Missing root map is not dead-code proof; nested dispatch and URL-store synchronization require browser tests. All entries NOT VERIFIED.\n\n| VIEW | ROOT MAPPING LINE (src/app/page.tsx) | STATUS |\n|---|---|---|\n';
writeFileSync('docs/functionality/PORTAL_VIEWS.md',header+views.map(v=>`| ${v.view} | ${v.entryLine||'Not statically mapped here'} | NOT VERIFIED |`).join('\n')+'\n\n| SOURCE | DESTINATION | STATUS |\n|---|---|---|\n'+rewrite.map(v=>`| ${v.source} | ${v.destination} | NOT VERIFIED |`).join('\n')+'\n');
console.log({views:views.length,rootMappings:views.filter(v=>v.entryLine).length,rewrites:rewrite.length});
