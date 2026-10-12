import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const m=vi.hoisted(()=>({db:{seoOpportunity:{findFirst:vi.fn(),create:vi.fn(),findMany:vi.fn(),count:vi.fn()},auditLog:{create:vi.fn()}}}));
vi.mock('@/lib/db',()=>({db:m.db}));
vi.mock('@/lib/auth-middleware',()=>({authenticateRequest:async()=>({identityDomain:'user',authenticationMethod:'bearer',userId:'synthetic-staff',userType:'MARKETING',roles:['MARKETING'],permissions:[]})}));
import {POST} from '@/app/api/seo/opportunities/route';
const request=(metrics:unknown)=>new NextRequest('https://alo.test/api/seo/opportunities',{method:'POST',body:JSON.stringify({metrics})});
beforeEach(()=>{vi.resetAllMocks();m.db.seoOpportunity.findFirst.mockResolvedValue(null);m.db.seoOpportunity.create.mockImplementation(async({data})=>({id:'synthetic-opportunity',...data}));});
it('supplied high-impression low-click data creates an actionable opportunity, not a made-up live rank',async()=>{
 const response=await POST(request([{query:'synthetic query',url:'https://alo.test/study',impressions:2000,clicks:10,position:8}]));expect(response.status).toBe(200);const data=await response.json();expect(data).toMatchObject({opportunitiesCreated:1,liveProviderVerified:false});expect(data.opportunities[0].suggestedAction.length).toBeGreaterThan(20);expect(m.db.seoOpportunity.create.mock.calls[0][0].data).toMatchObject({impressions:2000,clicks:10,position:8});
});
it.each([[],[{query:'synthetic',impressions:2,clicks:3,position:8}],[{query:'synthetic',impressions:-1,clicks:0,position:8}]])('invalid evidence %j is rejected before writes',async rows=>{expect((await POST(request(rows))).status).toBe(400);expect(m.db.seoOpportunity.create).not.toHaveBeenCalled();});
it('database failure cannot be displayed as analysis success',async()=>{m.db.seoOpportunity.findFirst.mockRejectedValue(new Error('synthetic failure'));expect((await POST(request([{query:'synthetic',impressions:2000,clicks:10,position:8}]))).status).toBe(503);});
