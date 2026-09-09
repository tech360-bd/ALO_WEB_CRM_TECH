import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const team = await db.teamMember.findMany({ select: { name: true, role: true } });
console.log('Team members in DB:');
for (const t of team) console.log(`  - ${t.name} | ${t.role}`);
console.log(`Total: ${team.length}`);
const stats = {
  users: await db.portalUser.count(),
  roles: await db.portalRole.count(),
  perms: await db.portalPermission.count(),
  rolePerms: await db.portalRolePermission.count(),
  userRoles: await db.portalUserRole.count(),
  universities: await db.crmUniversity.count(),
  courses: await db.crmCourse.count(),
  scholarships: await db.crmScholarship.count(),
  countries: await db.country.count(),
  teamMembers: team.length,
  heroSlides: await db.homeHeroSlide.count(),
  faqs: await db.homepageFaq.count(),
  services: await db.homeService.count(),
  successStories: await db.successStory.count(),
  leads: await db.marketingLead.count(),
  students: await db.portalStudentProfile.count(),
  employees: await db.employeeProfile.count(),
  partners: await db.partnerProfile.count(),
  applications: await db.application.count(),
  appointments: await db.appointment.count(),
  notifications: await db.portalNotification.count(),
};
console.log('\nStats:', JSON.stringify(stats, null, 2));
await db.$disconnect();
