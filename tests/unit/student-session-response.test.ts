import { beforeEach, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m=vi.hoisted(()=>({db:{student:{findUnique:vi.fn()},user:{findUnique:vi.fn()},studentSession:{findUnique:vi.fn(),update:vi.fn()},application:{count:vi.fn()},document:{count:vi.fn()},communicationMessage:{count:vi.fn()}}}));
vi.mock('@/lib/db',()=>({db:m.db}));
import { authenticateStudentRequest } from '@/lib/student-auth';
import { GET } from '@/app/api/student/auth/me/route';
const row={id:'student-A',studentId:'AE-2026000001',userId:'user-A',name:'Synthetic student',email:'synthetic@example.test',phone:'',password:'must-not-leak',otpCode:'must-not-leak',otpExpiresAt:new Date(),status:'active',suspended:false};
const req=()=>new Request('https://alo.test/api/student/auth/me',{headers:{cookie:'alo_student_session=synthetic-session'}});
beforeEach(()=>{
  vi.resetAllMocks();m.db.studentSession.findUnique.mockResolvedValue({id:'session',studentId:'student-A',revokedAt:null,expiresAt:new Date(Date.now()+60000)});
  m.db.user.findUnique.mockResolvedValue({role:'STUDENT',status:'ACTIVE',emailVerified:true});
  m.db.student.findUnique.mockImplementation(async q=>q.select ? Object.fromEntries(Object.entries(row).filter(([k])=>q.select[k])) : row);
  m.db.application.count.mockResolvedValue(2);m.db.document.count.mockResolvedValue(1);m.db.communicationMessage.count.mockResolvedValue(3);
});
it('own HttpOnly session gives actual layout student contract and safe legacy alias',async()=>{
  const res=await GET(req());expect(res.status).toBe(200);const json=await res.json();
  expect(json).toMatchObject({student:{id:'student-A'},unreadMessages:3,data:{id:'student-A',applicationsCount:2}});
  expect(JSON.stringify(json)).not.toContain('must-not-leak');expect(json.student).not.toHaveProperty('otpExpiresAt');expect(json.data).not.toHaveProperty('password');
  expect(m.db.studentSession.update).not.toHaveBeenCalled();expect(res.headers.get('cache-control')).toContain('no-store');
});
it.each([{role:'ADMIN',status:'ACTIVE',emailVerified:true},{role:'STUDENT',status:'SUSPENDED',emailVerified:true},{role:'STUDENT',status:'ACTIVE',emailVerified:false}])('deactivated/nonstudent linked User invalidates existing StudentSession %o',async owner=>{
  m.db.user.findUnique.mockResolvedValue(owner);const result=await authenticateStudentRequest(req());expect(result).toBeInstanceOf(NextResponse);expect((result as NextResponse).status).toBe(403);
});
it('revoked session cannot read any student',async()=>{m.db.studentSession.findUnique.mockResolvedValue({revokedAt:new Date()});expect((await GET(req())).status).toBe(401);expect(m.db.student.findUnique).not.toHaveBeenCalled();});
it('inaccessible DB count is an explicit failure rather than fake zero totals',async()=>{m.db.application.count.mockRejectedValue(new Error('synthetic failure'));expect((await GET(req())).status).toBe(503);});
