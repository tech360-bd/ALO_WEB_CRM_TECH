import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m=vi.hoisted(()=>({auth:vi.fn(),db:{student:{findMany:vi.fn(),findFirst:vi.fn(),findUnique:vi.fn()},application:{findMany:vi.fn(),findFirst:vi.fn()},$transaction:vi.fn(),internalComment:{create:vi.fn()},studentVisibleComment:{create:vi.fn()},portalAuditLog:{create:vi.fn()}}}));
vi.mock('@/lib/db',()=>({db:m.db}));vi.mock('@/lib/auth-middleware',()=>({authenticateRequest:m.auth}));
import { GET as list } from '@/app/api/counselor/students/route';
import { GET as detail, POST as comment } from '@/app/api/counselor/students/[id]/route';
const auth={userId:'counselor-A',actorUserId:'counselor-A',identityDomain:'user',userType:'COUNSELOR',roles:['COUNSELOR'],permissions:[],authenticationMethod:'cookie'};
const ctx={params:Promise.resolve({id:'student-B'})};
const req=(post=false,origin='https://alo.test')=>new NextRequest('https://alo.test/api/counselor/students/student-B',post?{method:'POST',headers:{origin},body:JSON.stringify({type:'internal',body:'Synthetic comment',authorId:'forged'})}:undefined);
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('NEXTAUTH_URL','https://alo.test');m.auth.mockResolvedValue(auth);m.db.student.findMany.mockResolvedValue([]);m.db.student.findFirst.mockResolvedValue(null);m.db.$transaction.mockImplementation(cb=>cb(m.db));});
it.each(['STUDENT','PARTNER','MARKETING'])('denies %s directly at list/detail/mutation routes',async role=>{
  m.auth.mockResolvedValue({...auth,userType:role,roles:[role]});
  expect((await list(req())).status).toBe(403);expect((await detail(req(),ctx)).status).toBe(403);expect((await comment(req(true),ctx)).status).toBe(403);expect(m.db.student.findMany).not.toHaveBeenCalled();
});
it('Portal counselor and administrator IDs cannot impersonate canonical User assignments',async()=>{
  for(const role of ['COUNSELOR','ADMIN']){m.auth.mockResolvedValue({...auth,identityDomain:'portal',userType:role});expect((await detail(req(),ctx)).status).toBe(403);}
  expect(m.db.student.findFirst).not.toHaveBeenCalled();
});
it('preserves unauthenticated response',async()=>{m.auth.mockResolvedValue(NextResponse.json({},{status:401}));expect((await list(req())).status).toBe(401);});
it('counselor A query cannot become counselor B or an unscoped read',async()=>{
  expect((await list(new NextRequest('https://alo.test/api/counselor/students?counselorId=counselor-B'))).status).toBe(200);
  const query=m.db.student.findMany.mock.calls[0][0];expect(query.where.AND).toEqual([{counselorId:'counselor-A'},{counselorId:'counselor-B'}]);
  expect(query.select).not.toHaveProperty('password');expect(query.select).not.toHaveProperty('otpCode');
});
it('unassigned/other student is not readable or writable',async()=>{
  expect((await detail(req(),ctx)).status).toBe(404);expect((await comment(req(true),ctx)).status).toBe(404);
  expect(m.db.student.findFirst.mock.calls[0][0].where).toEqual({AND:[{id:'student-B'},{counselorId:'counselor-A'}]});expect(m.db.internalComment.create).not.toHaveBeenCalled();
});
it('B2B confidential student detail denied before document and comment queries',async()=>{
  m.db.student.findFirst.mockResolvedValue({id:'student-B'});m.db.application.findFirst.mockResolvedValue({id:'confidential'});
  expect((await detail(req(),ctx)).status).toBe(404);expect(m.db.student.findUnique).not.toHaveBeenCalled();
});
it('cross-origin comment fails before transaction',async()=>{
  expect((await comment(req(true,'https://attacker.test'),ctx)).status).toBe(403);expect(m.db.$transaction).not.toHaveBeenCalled();
});
it('independent administrator is permitted global list without impersonating counselor test',async()=>{
  m.auth.mockResolvedValue({...auth,userId:'admin-A',userType:'ADMIN',roles:['ADMIN']});expect((await list(req())).status).toBe(200);
  expect(m.db.student.findMany.mock.calls[0][0].where).toEqual({AND:[{},{}]});
});
it('comment author comes from authenticated actor, with serializable mutation and audit',async()=>{
  m.db.student.findFirst.mockResolvedValue({id:'student-B'});m.db.application.findFirst.mockResolvedValue(null);m.db.internalComment.create.mockResolvedValue({id:'comment-synthetic'});
  expect((await comment(req(true),ctx)).status).toBe(200);
  expect(m.db.internalComment.create.mock.calls[0][0].data.authorId).toBe('counselor-A');
  expect(m.db.$transaction.mock.calls[0][1]).toEqual({isolationLevel:'Serializable'});expect(m.db.portalAuditLog.create).toHaveBeenCalled();
});
