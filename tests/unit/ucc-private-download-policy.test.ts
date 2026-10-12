/** Real download/assignment handlers; isolated auth/DB/storage doubles. No provider calls. */
import {beforeEach,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
const m=vi.hoisted(()=>({auth:vi.fn(),read:vi.fn(),attachment:vi.fn(),application:vi.fn(),audit:vi.fn(),transaction:vi.fn()}));
vi.mock('@/lib/auth-middleware',()=>({authenticateRequest:m.auth}));
vi.mock('@/lib/storage/private-file-store',()=>({readPrivateFile:m.read}));
vi.mock('@/lib/db',()=>({db:{uccAttachment:{findUnique:m.attachment},application:{findFirst:m.application,findUnique:m.application},$transaction:m.transaction}}));
import {GET as download} from '@/app/api/crm/ucc/documents/[id]/download/route';
import {POST as assign} from '@/app/api/crm/ucc/conversations/[id]/assign/route';
const admin={identityDomain:'user',authenticationMethod:'cookie',userId:'synthetic-admin',userType:'ADMIN',roles:['ADMIN'],permissions:[]};
const bytes=Buffer.from('Synthetic private fixture; not a real document');
const request=(id='attachment-A')=>new Request(`https://alo.test/api/crm/ucc/documents/${id}/download`);
const context=(id='attachment-A')=>({params:Promise.resolve({id})});
beforeEach(()=>{
 vi.resetAllMocks();m.auth.mockResolvedValue(admin);m.read.mockResolvedValue(bytes);m.application.mockResolvedValue(null);
 m.attachment.mockResolvedValue({id:'attachment-A',conversationId:'conversation-A',studentId:'student-A',applicationId:null,mimeType:'application/pdf',fileUrl:'',fileName:'synthetic.pdf',conversation:{id:'conversation-A',studentId:'student-A',assignedToUserId:'synthetic-admin'},ocrExtractedData:JSON.stringify({storagePath:'synthetic.pdf',fileHash:createHash('sha256').update(bytes).digest('hex'),originalName:'synthetic.pdf'})});
 m.transaction.mockImplementation(async fn=>fn({portalAuditLog:{create:m.audit}}));
});
it.each(['attachment-A','attachment-B','..%2Fprivate'])('anonymous URL substitution %s never reaches private storage',async id=>{m.auth.mockResolvedValue(NextResponse.json({error:'Unauthorized'},{status:401}));expect((await download(request(id),context(id))).status).toBe(401);expect(m.read).not.toHaveBeenCalled();expect(m.attachment).not.toHaveBeenCalled();});
it.each([
 {...admin,userType:'STUDENT',roles:['STUDENT']},
 {...admin,userType:'COUNSELOR',roles:['COUNSELOR']},
 {...admin,identityDomain:'portal'},
 {...admin,identityDomain:undefined},
])('role/domain denial holds for altered record IDs: %#',async actor=>{
 m.auth.mockResolvedValue(actor);for(const id of ['attachment-A','attachment-B'])expect((await download(request(id),context(id))).status).toBe(403);expect(m.read).not.toHaveBeenCalled();expect(m.attachment).not.toHaveBeenCalled();
});
it('missing attachment ID does not fall back to a path or a different document',async()=>{m.attachment.mockResolvedValue(null);expect((await download(request('missing'),context('missing'))).status).toBe(404);expect(m.read).not.toHaveBeenCalled();});
it('canonical admin receives bytes only after integrity check and durable audit',async()=>{const result=await download(request(),context());expect(result.status).toBe(200);expect(result.headers.get('cache-control')).toBe('private, no-store');expect(Buffer.from(await result.arrayBuffer())).toEqual(bytes);expect(m.audit).toHaveBeenCalledOnce();});
it('storage tampering never returns document bytes',async()=>{m.read.mockResolvedValue(Buffer.from('tampered'));expect((await download(request(),context())).status).toBe(500);expect(m.audit).not.toHaveBeenCalled();});
it('audit failure fails closed, not a successful unlogged download',async()=>{m.audit.mockRejectedValue(new Error('synthetic audit failure'));const response=await download(request(),context());expect(response.status).toBe(503);expect(await response.text()).not.toContain(bytes.toString());});
it('even canonical administrators cannot assign while ownership migration is pending',async()=>{const response=await assign(new Request('https://alo.test/api/crm/ucc/conversations/A/assign',{method:'POST',headers:{origin:'https://alo.test'}}),context('A'));expect(response.status).toBe(503);expect(await response.json()).toMatchObject({code:'UCC_ASSIGNMENT_NAMESPACE_PENDING'});expect(m.transaction).not.toHaveBeenCalled();});
