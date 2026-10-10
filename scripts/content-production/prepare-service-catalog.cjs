// Produce a reviewable, additive publication script. This never connects to a database.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const modulePath=path.resolve(__dirname,'../../src/lib/website/spec-services.ts');
const javascript=ts.transpileModule(fs.readFileSync(modulePath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const compiled={exports:{}};new Function('module','exports',javascript)(compiled,compiled.exports);
const {SPEC_SERVICES,specServiceToPayload}=compiled.exports;
const quote=value=>value===null?'NULL':typeof value==='number'?String(value):`CONVERT(0x${Buffer.from(String(value),'utf8').toString('hex')||'00'} USING utf8mb4) COLLATE utf8mb4_unicode_ci`;
// Empty strings must remain empty, not a NUL character.
const sqlValue=value=>value===''?"''":quote(value);
const statements=['-- ALO production editorial services. Additive, idempotent, no overwrite or delete.','SET NAMES utf8mb4;','START TRANSACTION;'];
for(const [index,service] of SPEC_SERVICES.entries()){
 const payload=specServiceToPayload(service);
 const {category,fees,whoNeedsItCategories,hasStartApplication,...fields}=payload;
 const id=`alo_service_${service.slug}`;
 const row={...fields,id,status:'PUBLISHED',description:service.whatIs,longDescription:service.whatIs,
  content:JSON.stringify({overview:service.whatIs,process:service.processSteps}),sortOrder:index,
  seoTitle:`${service.title} | ALO Education`,seoDescription:service.shortDescription,
  canonicalUrl:`https://aloeducation.com/services/${service.slug}`,faqEnabled:1};
 const columns=Object.keys(row).map(key=>'`'+key+'`').join(',');
 statements.push(`INSERT INTO services (${columns},createdAt,updatedAt) SELECT ${Object.values(row).map(sqlValue).join(',')},UTC_TIMESTAMP(3),UTC_TIMESTAMP(3) FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug=${sqlValue(service.slug)});`);
 const faqs=[
  ['What information should I prepare?',`For ${service.title.toLowerCase()}, bring ${service.documentsNeeded.join(', ')}. A counselor will confirm which items apply to your situation; do not share sensitive documents publicly.`],
  ['How long does the process take?',payload.timeline],
  ['What does this service cost?','Ask ALO for a written scope and itemized quote before agreeing to paid support. University, test-provider and government charges are separate and should be checked with their official sources.'],
  ['Does this service guarantee an outcome?',payload.whatNotGuaranteed],
 ];
 for(const [i,[question,answer]] of faqs.entries()){
  const faqId=`${id}_faq_${i}`;
  statements.push(`INSERT INTO service_faqs (id,serviceId,question,answer,sortOrder,createdAt,updatedAt) SELECT ${[faqId,id,question,answer,i].map(sqlValue).join(',')},UTC_TIMESTAMP(3),UTC_TIMESTAMP(3) FROM DUAL WHERE EXISTS (SELECT 1 FROM services WHERE id=${sqlValue(id)}) AND NOT EXISTS (SELECT 1 FROM service_faqs WHERE id=${sqlValue(faqId)});`);
 }
}
statements.push(`INSERT INTO PortalAuditLog (id,actorUserId,action,entityType,entityId,metadata,createdAt) SELECT 'alo_services_editorial_publication_20261009','deployment','SERVICE_CATALOG_PUBLICATION','Service','alo-services-14',${sqlValue(JSON.stringify({source:'Existing ALO editorial catalog',count:14,verificationStatus:'pending',overwriteExisting:false,includesDemoData:false}))},UTC_TIMESTAMP(3) FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM PortalAuditLog WHERE id='alo_services_editorial_publication_20261009');`,'COMMIT;');
const output=process.argv[2];if(!output)throw new Error('Output .sql path required');fs.writeFileSync(output,statements.join('\n')+'\n');console.log(`Prepared ${SPEC_SERVICES.length} services and 56 FAQs for review: ${output}`);
