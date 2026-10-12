import {beforeEach,expect,it,vi} from 'vitest';
import {encode} from 'next-auth/jwt';
const m=vi.hoisted(()=>({session:vi.fn(),user:vi.fn()}));
vi.mock('@/lib/db',()=>({db:{user:{findUnique:m.user}}}));
vi.mock('next-auth',()=>({getServerSession:m.session}));
import {decodeCanonicalUserJwt} from '@/lib/auth/canonical-jwt';
import {authOptions} from '@/lib/auth';
import {authenticateRequest} from '@/lib/auth-middleware';
const secret='synthetic-test-only-signing-secret-32-plus';
beforeEach(()=>{vi.resetAllMocks();m.user.mockResolvedValue({id:'collision',status:'ACTIVE',emailVerified:true,role:'ADMIN',permissions:'[]'});});
it.each(['portal','student',undefined])('signed %s domain JWT cannot decode as User even when ID collides',async identityDomain=>{
 const token=await encode({secret,token:{identityDomain,id:'collision',role:'ADMIN'}});expect(await decodeCanonicalUserJwt({secret,token})).toBeNull();
});
it('valid signed canonical token passes, expired and tampered tokens fail cryptographic verification',async()=>{
 const token=await encode({secret,token:{id:'collision',identityDomain:'user'}});expect(await decodeCanonicalUserJwt({secret,token})).toMatchObject({id:'collision',identityDomain:'user'});
 const expired=await encode({secret,token:{id:'collision',identityDomain:'user'},maxAge:-120});await expect(decodeCanonicalUserJwt({secret,token:expired})).rejects.toThrow();
 const parts=token.split('.');parts[3]=(parts[3][0]==='a'?'b':'a')+parts[3].slice(1);await expect(decodeCanonicalUserJwt({secret,token:parts.join('.')})).rejects.toThrow();
});
it.each(['portal','student',undefined])('auth middleware rejects %s before even looking up the colliding User',async identityDomain=>{
 m.session.mockResolvedValue({user:{id:'collision',identityDomain}});const result=await authenticateRequest(new Request('https://alo.test/api/crm/ucc/analytics'));expect((result as Response).status).toBe(403);expect(m.user).not.toHaveBeenCalled();
});
it('credential callback alone stamps User domain; updates cannot forge identities',async()=>{
 const callback=authOptions.callbacks!.jwt!;const user={id:'real-user',role:'ADMIN',status:'ACTIVE'};
 expect(await callback({token:{},user,account:{provider:'credentials'}} as any)).toMatchObject({id:'real-user',identityDomain:'user'});
 expect(await callback({token:{id:'original',identityDomain:'portal'},trigger:'update',session:{id:'forged',identityDomain:'user'}} as any)).toMatchObject({id:'original',identityDomain:'portal'});
 expect(await callback({token:{},user,account:{provider:'other'}} as any)).not.toHaveProperty('identityDomain');
});
it('NextAuth uses the namespace-aware decoder and propagates domain without guessing',async()=>{
 expect(authOptions.jwt?.decode).toBe(decodeCanonicalUserJwt);const session=await authOptions.callbacks!.session!({session:{user:{}},token:{id:'canonical',identityDomain:'user'}} as any);expect(session.user).toMatchObject({id:'canonical',identityDomain:'user'});
});
