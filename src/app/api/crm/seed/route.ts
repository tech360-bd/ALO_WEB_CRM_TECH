import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// ============================================================
// SEC-C fix (2026-09-18): this endpoint was previously a PUBLIC, completely
// unauthenticated POST that
//   * created 16 privileged accounts (SUPER_ADMIN, CEO, ADMIN, ...),
//   * stored their passwords as PLAIN TEXT in `passwordHash`, and
//   * returned every plaintext password in the JSON response body
//     (`credentials.users[].password`).
// Any anonymous caller could therefore obtain the full admin credential set.
//
// It is now:
//   * DISABLED unless NODE_ENV !== 'production'  (fail-closed default), AND
//   * DISABLED unless ENABLE_CRM_DEV_SEED === 'true' (explicit opt-in), AND
//   * hashing passwords with bcrypt (12 rounds, matching portal-auth), AND
//   * never returning any password or credential material.
// Returns 404 (not 403) when unavailable so the endpoint's existence is not
// disclosed in production. For real seeding use the reviewed CLI seeds:
//   npx prisma db seed  /  tsx prisma/seed-*.ts
// ============================================================

const BCRYPT_ROUNDS = 12;

function seedRouteUnavailable(): NextResponse {
  return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
}

function isDevSeedEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? 'production'; // fail closed
  if (nodeEnv === 'production') return false;
  return process.env.ENABLE_CRM_DEV_SEED === 'true';
}

/**
 * No password is hardcoded anywhere in this file. The operator supplies one
 * temporary bootstrap password for ALL dev-seed accounts via the
 * CRM_DEV_SEED_PASSWORD environment variable; it is bcrypt-hashed before
 * storage and is never returned in a response.
 */
function devSeedPassword(): string | null {
  const pw = process.env.CRM_DEV_SEED_PASSWORD;
  if (!pw || pw.length < 12) return null;
  return pw;
}

const CRM_USERS = [
  {
    email: 'admin@alo.edu.bd',
    name: 'Super Admin',
    phone: '01711-000001',
    userType: 'SUPER_ADMIN',
    crmRole: 'super_admin',
  },
  {
    email: 'ceo@alo.edu.bd',
    name: 'CEO',
    phone: '01711-000002',
    userType: 'SUPER_ADMIN',
    crmRole: 'ceo',
  },
  {
    email: 'bm@alo.edu.bd',
    name: 'Branch Manager',
    phone: '01711-000003',
    userType: 'ADMIN',
    crmRole: 'branch_manager',
  },
  {
    email: 'counselor@alo.edu.bd',
    name: 'Counselor',
    phone: '01711-000004',
    userType: 'ADMIN',
    crmRole: 'counselor',
  },
  {
    email: 'app@alo.edu.bd',
    name: 'Application Team',
    phone: '01711-000005',
    userType: 'ADMIN',
    crmRole: 'application_team',
  },
  {
    email: 'visa@alo.edu.bd',
    name: 'Visa Officer',
    phone: '01711-000006',
    userType: 'ADMIN',
    crmRole: 'visa_officer',
  },
  {
    email: 'finance@alo.edu.bd',
    name: 'Finance Officer',
    phone: '01711-000007',
    userType: 'ADMIN',
    crmRole: 'finance',
  },
  {
    email: 'marketing@alo.edu.bd',
    name: 'Marketing Manager',
    phone: '01711-000008',
    userType: 'ADMIN',
    crmRole: 'marketing_manager',
  },
  {
    email: 'frontdesk@alo.edu.bd',
    name: 'Front Desk',
    phone: '01711-000009',
    userType: 'ADMIN',
    crmRole: 'front_desk',
  },
  {
    email: 'hr@alo.edu.bd',
    name: 'HR Manager',
    phone: '01711-000010',
    userType: 'ADMIN',
    crmRole: 'hr',
  },
  {
    email: 'partner@alo.edu.bd',
    name: 'Partner Manager',
    phone: '01711-000011',
    userType: 'ADMIN',
    crmRole: 'partner_manager',
  },
  {
    email: 'doc@alo.edu.bd',
    name: 'Document Officer',
    phone: '01711-000012',
    userType: 'ADMIN',
    crmRole: 'document_officer',
  },
  {
    email: 'data@alo.edu.bd',
    name: 'Data Manager',
    phone: '01711-000013',
    userType: 'ADMIN',
    crmRole: 'data_manager',
  },
  {
    email: 'support@alo.edu.bd',
    name: 'Support Agent',
    phone: '01711-000014',
    userType: 'ADMIN',
    crmRole: 'support_agent',
  },
  {
    email: 'ai@alo.edu.bd',
    name: 'AI Manager',
    phone: '01711-000015',
    userType: 'ADMIN',
    crmRole: 'ai_manager',
  },
];

const STUDENT_USER = {
  email: 'student@test.com',
  name: 'Test Student',
  phone: '01711-000099',
  userType: 'STUDENT' as const,
  studentProfile: {
    studentId: 'ALO-STU-00001',
    fullName: 'Test Student',
    gender: 'Male',
    city: 'Dhaka',
    preferredCountry: 'United Kingdom',
    preferredIntake: 'September 2025',
    preferredSubject: 'Computer Science',
    preferredLevel: 'Masters',
    budget: '15-20 Lakh BDT',
    englishTestType: 'IELTS',
    englishScore: 7.0,
    sscResult: 'GPA 5.00',
    hscResult: 'GPA 5.00',
    bachelorResult: 'CGPA 3.7/4.0',
    currentEducation: 'BSc in CSE',
    profileCompletion: 75,
    journeyStage: 'counseling',
  },
};

export async function POST() {
  if (!isDevSeedEnabled()) return seedRouteUnavailable();
  const bootstrapPassword = devSeedPassword();
  if (!bootstrapPassword) {
    return NextResponse.json(
      { success: false, error: 'CRM_DEV_SEED_PASSWORD (>= 12 chars) must be set to use the dev seed' },
      { status: 400 }
    );
  }
  const passwordHash = await bcrypt.hash(bootstrapPassword, BCRYPT_ROUNDS);
  try {
    // Check if admin already exists (idempotent)
    const existingAdmin = await db.portalUser.findUnique({
      where: { email: 'admin@alo.edu.bd' },
    });

    if (existingAdmin) {
      const allCrmUsers = await db.portalUser.findMany({
        where: {
          email: {
            in: [...CRM_USERS.map(u => u.email), STUDENT_USER.email],
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        success: true,
        message: `Database already seeded with ${allCrmUsers.length} users. Skipping.`,
        count: allCrmUsers.length,
      });
    }

    // Seed CRM admin users
    type CreatedUser = { id: string; email: string; name: string; userType: string; crmRole: string };
    const createdUsers: CreatedUser[] = [];

    for (const userData of CRM_USERS) {
      const user = await db.portalUser.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          phone: userData.phone,
          userType: userData.userType,
          status: 'active',
          emailVerified: true,
        },
      });
      createdUsers.push({
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        crmRole: userData.crmRole,
      });
    }

    // Seed test student with profile
    const studentUser = await db.portalUser.create({
      data: {
        email: STUDENT_USER.email,
        passwordHash,
        name: STUDENT_USER.name,
        phone: STUDENT_USER.phone,
        userType: STUDENT_USER.userType,
        status: 'active',
        emailVerified: true,
        studentProfile: {
          create: STUDENT_USER.studentProfile,
        },
      },
    });

    createdUsers.push({
      id: studentUser.id,
      email: studentUser.email,
      name: studentUser.name,
      userType: studentUser.userType,
      crmRole: 'student',
    });

    // NOTE: no credential material is ever returned. Seeded accounts must be
    // given passwords out-of-band; see prisma/seed-*.ts for reviewed flows.
    return NextResponse.json({
      success: true,
      message: `Seeded ${createdUsers.length} users successfully.`,
      users: createdUsers.map(u => ({ id: u.id, email: u.email, name: u.name, userType: u.userType, crmRole: u.crmRole })),
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}