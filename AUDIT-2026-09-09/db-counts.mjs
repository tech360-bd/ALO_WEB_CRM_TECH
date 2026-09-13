import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const KEY_TABLES = ['User','Role','Permission','RolePermission','University','Course','Country','CourseIntake','Intake','Scholarship','Application','StudentProfile','PartnerProfile','EmployeeProfile','Consultation','CommunicationThread','CommunicationMessage','AuditLog','CounselorTask','Task','AgentDepartment','Agent','AgentSkill','Skill','Branch','Lead','VisaApplication','Payment'];
async function main(){
  const approx = await prisma.$queryRawUnsafe(`SELECT TABLE_NAME AS t, TABLE_ROWS AS r FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`);
  console.log('TABLE_COUNT:', approx.length);
  const names = approx.map(r=>r.t);
  const lower = new Map(names.map(n=>[n.toLowerCase(),n]));
  for (const key of KEY_TABLES){
    const m = lower.get(key.toLowerCase());
    if(!m){ console.log(`${key},NO_TABLE`); continue; }
    try{ const res = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM \`${m}\``); console.log(`${m},${Number(res[0].c)}`);}
    catch(e){ console.log(`${m},ERROR:${e.message.slice(0,60)}`);}
  }
}
main().catch(e=>{console.error('DB_CONNECT_FAIL:',e.message);process.exit(1);}).finally(()=>prisma.$disconnect());
