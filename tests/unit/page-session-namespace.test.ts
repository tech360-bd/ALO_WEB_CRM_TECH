import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const m=vi.hoisted(()=>({getToken:vi.fn()}));vi.mock('next-auth/jwt',()=>({getToken:m.getToken}));
import proxy from '@/proxy';
beforeEach(()=>vi.resetAllMocks());
it('unlabelled legacy JWT cannot authorize an API request',async()=>{m.getToken.mockResolvedValue({id:'collision',role:'ADMIN'});expect((await proxy(new NextRequest('https://alo.test/api/admin/test'))).status).toBe(401);});
it.each(['student','portal'])('foreign %s JWT in NextAuth cookie is not a canonical session',async identityDomain=>{m.getToken.mockImplementation(async({cookieName})=>cookieName?null:{id:'collision',identityDomain,role:'ADMIN'});expect((await proxy(new NextRequest('https://alo.test/api/admin/test'))).status).toBe(401);});
it('student navigation hint admits student page, not admin API',async()=>{m.getToken.mockImplementation(async({cookieName})=>cookieName==='alo_page_session'?{id:'student',identityDomain:'student',role:'STUDENT',status:'ACTIVE'}:null);expect((await proxy(new NextRequest('https://alo.test/student/dashboard'))).status).toBe(200);expect((await proxy(new NextRequest('https://alo.test/api/admin/test'))).status).toBe(403);});
it('canonical counselor token cannot authorize administrator API',async()=>{m.getToken.mockImplementation(async({cookieName})=>cookieName?null:{id:'counselor',identityDomain:'user',role:'COUNSELOR',status:'ACTIVE'});expect((await proxy(new NextRequest('https://alo.test/api/admin/test'))).status).toBe(403);});
