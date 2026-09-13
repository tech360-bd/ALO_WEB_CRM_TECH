import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const q = async (t) => { try { const r = await p.$queryRawUnsafe(`SELECT COUNT(*) c FROM \`${t}\``); return Number(r[0].c); } catch { return 'NO_TABLE'; } };
console.log('User:', await q('User'));
console.log('PortalUser:', await q('PortalUser'));
console.log('PortalRole:', await q('PortalRole'));
console.log('PortalPermission:', await q('PortalPermission'));
console.log('PortalRolePermission:', await q('PortalRolePermission'));
console.log('PortalUserRole:', await q('PortalUserRole'));
try {
  const users = await p.$queryRawUnsafe(`SELECT id,email,name,role,isActive FROM User LIMIT 10`);
  console.log('USERS:', JSON.stringify(users));
} catch (e) { console.log('User columns differ:', e.message.slice(0,100)); }
try {
  const pu = await p.$queryRawUnsafe(`SELECT id,email,portalType,isActive FROM PortalUser LIMIT 10`);
  console.log('PORTAL_USERS:', JSON.stringify(pu));
} catch (e) { console.log('PortalUser columns differ:', e.message.slice(0,100)); }
await p.$disconnect();
