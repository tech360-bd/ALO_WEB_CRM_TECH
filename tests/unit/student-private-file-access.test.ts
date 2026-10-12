/** Real auth + route + isolated filesystem; only the database is mocked.
 * No actual student accounts, production data or database writes.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const {db}=vi.hoisted(()=>({db:{studentSession:{findUnique:vi.fn()},student:{findUnique:vi.fn()},studentDocument:{findFirst:vi.fn()},studentEvent:{create:vi.fn()},documentAudit:{create:vi.fn()},$transaction:vi.fn()}}));
vi.mock('@/lib/db',()=>({db}));
import { GET } from '@/app/api/student/documents/[id]/download/route';
import { storePrivateFile } from '@/lib/storage/private-file-store';
let directory:string;
let document:Record<string,unknown>;
const bytes=Buffer.from('%PDF-1.4\nSYNTHETIC GATE2 DOCUMENT ONLY\n%%EOF');
const request=(token?:string)=>new Request('https://synthetic.invalid/api/student/documents/doc-a/download',{headers:token?{authorization:`Bearer ${token}`}:{}});
const download=(token?:string)=>GET(request(token),{params:Promise.resolve({id:'doc-a'})});
beforeEach(async()=>{
  vi.resetAllMocks();
  directory=await mkdtemp(path.join(tmpdir(),'alo-student-access-fixture-'));
  vi.stubEnv('STORAGE_POOL_C',directory);
  const stored=await storePrivateFile(bytes,'synthetic.pdf');
  document={id:'doc-a',studentId:'student-a',category:'synthetic',fileName:'synthetic.pdf',mimeType:'application/pdf',...stored};
  db.studentSession.findUnique.mockImplementation(async({where})=>{
    const studentId=where.token==='synthetic-a'?'student-a':where.token==='synthetic-b'?'student-b':null;
    return studentId?{id:`session-${studentId}`,studentId,expiresAt:new Date(Date.now()+60000),revokedAt:null}:null;
  });
  db.student.findUnique.mockImplementation(async({where})=>({id:where.id,name:'Synthetic fixture',status:'active',suspended:false,userId:null}));
  db.studentDocument.findFirst.mockImplementation(async({where})=>where.studentId===document.studentId&&where.id===document.id?document:null);
  db.$transaction.mockImplementation(async callback=>callback(db));
});
afterEach(async()=>{vi.unstubAllEnvs();await rm(directory,{recursive:true,force:true});});
it('authorized owner receives identical synthetic bytes, safe headers and audit writes',async()=>{
  const res=await download('synthetic-a');expect(res.status).toBe(200);
  expect(Buffer.from(await res.arrayBuffer())).toEqual(bytes);
  expect(res.headers.get('cache-control')).toBe('private, no-store');
  expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  expect(res.headers.get('content-disposition')).toContain('attachment;');
  expect(db.documentAudit.create).toHaveBeenCalledOnce();expect(db.studentEvent.create).toHaveBeenCalledOnce();
});
it.each([undefined,'invalid'])('denies missing or invalid session %s before document lookup',async token=>{
  expect((await download(token)).status).toBe(401);expect(db.studentDocument.findFirst).not.toHaveBeenCalled();
});
it('independent student B cannot download student A document',async()=>{
  const res=await download('synthetic-b');expect(res.status).toBe(404);expect(await res.text()).not.toContain('SYNTHETIC');
  expect(db.studentDocument.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{id:'doc-a',studentId:'student-b'}}));
  expect(db.documentAudit.create).not.toHaveBeenCalled();
});
it.each(['../outside.pdf','/outside.pdf','nested/file.pdf','nested\\file.pdf','..%2foutside.pdf'])('refuses malicious stored path %s',async storagePath=>{
  document.storagePath=storagePath;const res=await download('synthetic-a');expect(res.status).toBe(503);expect(await res.text()).not.toContain('SYNTHETIC');
});
it('refuses leaf symlink with synthetic target outside root',async()=>{
  // Target deliberately within the test sandbox's parent; only synthetic bytes.
  const outside=await mkdtemp(path.join(tmpdir(),'alo-outside-fixture-'));
  try {await writeFile(path.join(outside,'target.pdf'),bytes);await symlink(path.join(outside,'target.pdf'),path.join(directory,'link.pdf'));
    document.storagePath='link.pdf';expect((await download('synthetic-a')).status).toBe(503);
  } finally {await rm(outside,{recursive:true,force:true});}
});
it('does not stream tampered bytes',async()=>{
  await writeFile(path.join(directory,String(document.storagePath)),'tampered synthetic');
  expect((await download('synthetic-a')).status).toBe(500);expect(db.documentAudit.create).not.toHaveBeenCalled();
});
it('does not stream bytes when required audit transaction fails',async()=>{
  db.$transaction.mockRejectedValue(new Error('synthetic audit failure'));
  const res=await download('synthetic-a');expect(res.status).toBe(503);expect(await res.text()).not.toContain('SYNTHETIC');
});
