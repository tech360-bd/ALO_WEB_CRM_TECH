import type { Prisma } from '@prisma/client';
/** Explicit allowlist: no passwords, OTPs, session or linked credential data. */
export const safeStudentSelect = {
  id:true, studentId:true, name:true, email:true, phone:true, userType:true,
  status:true, profileComplete:true, journeyStage:true, currentCountry:true,
  currentCity:true, counselorId:true, counselorName:true, suspended:true,
  createdAt:true, updatedAt:true, leadId:true,
} satisfies Prisma.StudentSelect;
