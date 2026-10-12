import {beforeEach, expect, it, vi} from 'vitest';
const m=vi.hoisted(()=>({send:vi.fn(),media:vi.fn(),db:{uccConversation:{findUnique:vi.fn()},communicationThread:{findUnique:vi.fn()},student:{findUnique:vi.fn()},application:{findFirst:vi.fn()},uccMessage:{create:vi.fn()}}}));
vi.mock('@/lib/db',()=>({db:m.db}));
vi.mock('@/lib/auth-middleware',()=>({authenticateRequest:async()=>({identityDomain:'user',authenticationMethod:'bearer',userId:'synthetic-counselor',userType:'ADMIN',roles:['ADMIN'],permissions:[]}),withAuth:(h:any)=>(req:Request)=>h(req,{identityDomain:'user',authenticationMethod:'bearer',userId:'synthetic-counselor',userType:'ADMIN',roles:['ADMIN'],permissions:[]}),logAuditAction:vi.fn()}));
vi.mock('@/lib/whatsapp-cloud-api',()=>({sendWhatsAppMessage:m.send,sendWhatsAppPrivateMedia:m.media}));
import {POST as legacy} from '@/app/api/inbox/unified/route';
import {POST as ucc} from '@/app/api/crm/ucc/conversations/[id]/reply/route';
const request=()=>new Request('https://alo.test/api/reply',{method:'POST',body:JSON.stringify({threadId:'synthetic',channel:'whatsapp',content:'Synthetic test; must not send'})});
beforeEach(()=>{vi.resetAllMocks();m.db.communicationThread.findUnique.mockResolvedValue({id:'synthetic',assignedToId:'synthetic-counselor',channel:'whatsapp',studentId:'student-A'});m.db.student.findUnique.mockResolvedValue({phone:'+8801700000000'});m.db.application.findFirst.mockResolvedValue(null);m.send.mockResolvedValue({success:true,messageId:'would-accept'});});
it('legacy route blocks an otherwise provider-sendable request until policy verified',async()=>{
 m.db.uccConversation.findUnique.mockResolvedValue(null);const res=await legacy(request());expect(res.status).toBe(503);expect(await res.json()).toMatchObject({code:'OUTBOUND_REPLY_POLICY_UNVERIFIED'});expect(m.send).not.toHaveBeenCalled();
});
it('UCC external reply also cannot bypass the policy gate',async()=>{
 m.db.uccConversation.findUnique.mockResolvedValue({id:'synthetic',channel:'whatsapp',assignedToUserId:'synthetic-counselor',participantPhone:'+8801700000000'});
 const res=await ucc(request(),{params:Promise.resolve({id:'synthetic'})});expect(res.status).toBe(503);expect(await res.json()).toMatchObject({code:'OUTBOUND_REPLY_POLICY_UNVERIFIED'});expect(m.send).not.toHaveBeenCalled();expect(m.media).not.toHaveBeenCalled();expect(m.db.uccMessage.create).not.toHaveBeenCalled();
});
