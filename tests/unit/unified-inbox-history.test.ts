import { beforeEach, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m=vi.hoisted(()=>({auth:vi.fn(),send:vi.fn(),attachments:vi.fn(),db:{communicationThread:{findMany:vi.fn()},uccConversation:{findMany:vi.fn()},student:{findMany:vi.fn()},lead:{findMany:vi.fn()},application:{findMany:vi.fn()}}}));
vi.mock('@/lib/db',()=>({db:m.db}));
vi.mock('@/lib/auth-middleware',()=>({withAuth:(h:(req:Request,auth:any)=>Promise<Response>)=>async(req:Request)=>{const auth=await m.auth();return auth instanceof NextResponse?auth:h(req,auth);}}));
vi.mock('@/lib/whatsapp-cloud-api',()=>({sendWhatsAppMessage:m.send}));
vi.mock('@/lib/ucc/visible-attachments',()=>({visibleUccAttachmentsByMessage:m.attachments}));
import { GET } from '@/app/api/inbox/unified/route';
const auth={userId:'counselor-A',identityDomain:'user',userType:'ADMIN',roles:['ADMIN'],permissions:[]};
const date=new Date('2026-10-11T00:00:00Z');
const message=(id:string)=>({id,createdAt:date,content:id,attachments:[]});
beforeEach(()=>{
 vi.resetAllMocks();m.auth.mockResolvedValue(auth);m.attachments.mockResolvedValue(new Map());m.db.student.findMany.mockResolvedValue([{id:'student-A',phone:'01700000000',name:'Synthetic student'}]);m.db.lead.findMany.mockResolvedValue([]);m.db.application.findMany.mockResolvedValue([]);
 m.db.communicationThread.findMany.mockResolvedValue([{id:'same-id',studentId:'student-A',channel:'whatsapp',assignedToId:'counselor-A',lastMessageAt:date,messages:[message('new-legacy'),message('old-legacy')]}]);
 m.db.uccConversation.findMany.mockResolvedValue([{id:'same-id',studentId:'student-A',channel:'whatsapp',assignedToUserId:'counselor-A',lastMessageAt:date,messages:[message('new-ucc'),message('old-ucc')]}]);
});
it('does not discard independent legacy history when UCC shares a contact/channel; namespaced keys and ascending messages',async()=>{
 const response=await GET(new Request('https://alo.test/api/inbox/unified?channel=WHATSAPP'));expect(response.status).toBe(200);
 const data=await response.json();expect(data.conversations.map((c:any)=>c.key)).toEqual(['communication_thread:same-id','ucc_conversation:same-id']);
 expect(data.conversations[0].messages.map((v:any)=>v.id)).toEqual(['old-legacy','new-legacy']);expect(data.conversations[1].messages.map((v:any)=>v.id)).toEqual(['old-ucc','new-ucc']);
 expect(m.db.communicationThread.findMany.mock.calls[0][0].where).toEqual({channel:'whatsapp'});expect(m.db.uccConversation.findMany.mock.calls[0][0].where).toEqual({channel:'whatsapp'});
 expect(data.historyComplete).toBe(false);expect(m.send).not.toHaveBeenCalled();
});
it('private attachments use authorized download handler, not persisted raw file URLs',async()=>{
 m.attachments.mockResolvedValue(new Map([['new-ucc',[{id:'attachment-A',fileName:'synthetic.pdf',mimeType:'application/pdf',fileSize:1}]]]));
 const data=await (await GET(new Request('https://alo.test/api/inbox/unified'))).json();
 expect(JSON.parse(data.conversations[1].messages[1].attachmentsJson)[0].url).toBe('/api/crm/ucc/documents/attachment-A/download');
});
it('student cannot enumerate inbox rows',async()=>{
 m.auth.mockResolvedValue({...auth,userType:'STUDENT',roles:['STUDENT']});expect((await GET(new Request('https://alo.test/api/inbox/unified'))).status).toBe(403);expect(m.db.communicationThread.findMany).not.toHaveBeenCalled();
});
it('query failure is a failure, not an empty success',async()=>{
 m.db.uccConversation.findMany.mockRejectedValue(new Error('synthetic failure'));expect((await GET(new Request('https://alo.test/api/inbox/unified'))).status).toBe(503);
});

it.each([{identityDomain:'portal',userType:'ADMIN'},{identityDomain:'user',userType:'COUNSELOR'},{identityDomain:undefined,userType:'ADMIN'}])('denies ambiguous/unsupported ownership even when assignee ID matches: %o',async actor=>{
 m.auth.mockResolvedValue({...auth,...actor});expect((await GET(new Request('https://alo.test/api/inbox/unified'))).status).toBe(403);expect(m.db.communicationThread.findMany).not.toHaveBeenCalled();expect(m.db.uccConversation.findMany).not.toHaveBeenCalled();
});
