import {beforeEach, expect, it, vi} from 'vitest';
const m=vi.hoisted(()=>({auth:vi.fn(),read:vi.fn()}));
vi.mock('@/lib/auth-middleware',()=>({authenticateRequest:m.auth,withAuth:(h:any)=>(req:Request)=>h(req,m.auth()),logAuditAction:vi.fn()}));
vi.mock('@/lib/db',()=>({db:{uccConversation:{count:m.read,findMany:m.read},ocrJob:{findMany:m.read},communicationThread:{findMany:m.read}}}));
import {GET as analytics} from '@/app/api/crm/ucc/analytics/route';
import {GET as summary} from '@/app/api/crm/ucc/morning-summary/route';
import {GET as sla} from '@/app/api/crm/ucc/sla/route';
import {GET as ocr} from '@/app/api/crm/ucc/ocr/process/route';
import {canUseUccCommunication,canAccessUccConversation} from '@/lib/ucc/document-access';
const actor={identityDomain:'user',userId:'same-id',userType:'COUNSELOR',roles:['COUNSELOR'],permissions:[]};
beforeEach(()=>vi.resetAllMocks());
it.each([{...actor},{...actor,identityDomain:'portal',userType:'ADMIN',roles:['ADMIN']},{...actor,identityDomain:undefined,userType:'ADMIN',roles:['ADMIN']},{...actor,userType:'STUDENT'}])('unmapped private UCC metrics and records are denied before DB: %o',async auth=>{
 m.auth.mockReturnValue(auth);expect(canUseUccCommunication(auth as any)).toBe(false);expect(canAccessUccConversation(auth as any,{assignedToUserId:auth.userId})).toBe(false);
 for(const handler of [analytics,summary,sla,ocr]) expect((await handler(new Request('https://alo.test/api/test') as any)).status).toBe(403);
 expect(m.read).not.toHaveBeenCalled();
});
it('canonical administrator containment is not counselor-scoped functionality',()=>{expect(canUseUccCommunication({...actor,userType:'ADMIN'} as any)).toBe(true);});
