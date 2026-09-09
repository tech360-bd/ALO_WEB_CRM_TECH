import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const users = await db.portalUser.count().catch(() => 0);
  const students = await db.portalStudentProfile.count().catch(() => 0);
  const countries = await db.country.count().catch(() => 0);
  const universities = await db.crmUniversity.count().catch(() => 0);
  const courses = await db.crmCourse.count().catch(() => 0);
  const scholarships = await db.crmScholarship.count().catch(() => 0);
  const leads = await db.marketingLead.count().catch(() => 0);
  const applications = await db.application.count().catch(() => 0);
  const mockTestPayments = await db.mockTestPayment.count().catch(() => 0);
  const aloPayments = await db.aloPayment.count().catch(() => 0);
  const employees = await db.employeeProfile.count().catch(() => 0);
  const partners = await db.partnerProfile.count().catch(() => 0);

  console.log('--- RECONCILED DATABASE RECORD COUNTS ---');
  console.log('Portal Users:', users);
  console.log('Student Profiles:', students);
  console.log('Countries:', countries);
  console.log('Universities:', universities);
  console.log('Courses:', courses);
  console.log('Scholarships:', scholarships);
  console.log('Leads:', leads);
  console.log('Applications:', applications);
  console.log('Mock Test Payments:', mockTestPayments);
  console.log('ALO Payments:', aloPayments);
  console.log('Employee Profiles:', employees);
  console.log('Partner Profiles:', partners);
}

main().then(() => db.$disconnect()).catch(console.error);
