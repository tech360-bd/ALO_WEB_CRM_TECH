import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

const CRM_USERS = [
  {
    email: 'admin@alo.edu.bd',
    password: 'admin123',
    name: 'Super Admin',
    phone: '01711-000001',
    userType: 'SUPER_ADMIN',
    crmRole: 'super_admin',
  },
  {
    email: 'ceo@alo.edu.bd',
    password: 'ceo123',
    name: 'CEO',
    phone: '01711-000002',
    userType: 'SUPER_ADMIN',
    crmRole: 'ceo',
  },
  {
    email: 'bm@alo.edu.bd',
    password: 'bm123',
    name: 'Branch Manager',
    phone: '01711-000003',
    userType: 'ADMIN',
    crmRole: 'branch_manager',
  },
  {
    email: 'counselor@alo.edu.bd',
    password: 'coun123',
    name: 'Counselor',
    phone: '01711-000004',
    userType: 'ADMIN',
    crmRole: 'counselor',
  },
  {
    email: 'app@alo.edu.bd',
    password: 'app123',
    name: 'Application Team',
    phone: '01711-000005',
    userType: 'ADMIN',
    crmRole: 'application_team',
  },
  {
    email: 'visa@alo.edu.bd',
    password: 'visa123',
    name: 'Visa Officer',
    phone: '01711-000006',
    userType: 'ADMIN',
    crmRole: 'visa_officer',
  },
  {
    email: 'finance@alo.edu.bd',
    password: 'fin123',
    name: 'Finance Officer',
    phone: '01711-000007',
    userType: 'ADMIN',
    crmRole: 'finance',
  },
  {
    email: 'marketing@alo.edu.bd',
    password: 'mkt123',
    name: 'Marketing Manager',
    phone: '01711-000008',
    userType: 'ADMIN',
    crmRole: 'marketing_manager',
  },
  {
    email: 'frontdesk@alo.edu.bd',
    password: 'fd123',
    name: 'Front Desk',
    phone: '01711-000009',
    userType: 'ADMIN',
    crmRole: 'front_desk',
  },
  {
    email: 'hr@alo.edu.bd',
    password: 'hr123',
    name: 'HR Manager',
    phone: '01711-000010',
    userType: 'ADMIN',
    crmRole: 'hr',
  },
  {
    email: 'partner@alo.edu.bd',
    password: 'pm123',
    name: 'Partner Manager',
    phone: '01711-000011',
    userType: 'ADMIN',
    crmRole: 'partner_manager',
  },
  {
    email: 'doc@alo.edu.bd',
    password: 'doc123',
    name: 'Document Officer',
    phone: '01711-000012',
    userType: 'ADMIN',
    crmRole: 'document_officer',
  },
  {
    email: 'data@alo.edu.bd',
    password: 'dm123',
    name: 'Data Manager',
    phone: '01711-000013',
    userType: 'ADMIN',
    crmRole: 'data_manager',
  },
  {
    email: 'support@alo.edu.bd',
    password: 'sup123',
    name: 'Support Agent',
    phone: '01711-000014',
    userType: 'ADMIN',
    crmRole: 'support_agent',
  },
  {
    email: 'ai@alo.edu.bd',
    password: 'ai123',
    name: 'AI Manager',
    phone: '01711-000015',
    userType: 'ADMIN',
    crmRole: 'ai_manager',
  },
];

const STUDENT_USER = {
  email: 'student@test.com',
  password: 'test123',
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

// Email → crmRole mapping for login API reference
const EMAIL_ROLE_MAP: Record<string, string> = {
  'admin@alo.edu.bd': 'super_admin',
  'ceo@alo.edu.bd': 'ceo',
  'bm@alo.edu.bd': 'branch_manager',
  'counselor@alo.edu.bd': 'counselor',
  'app@alo.edu.bd': 'application_team',
  'visa@alo.edu.bd': 'visa_officer',
  'finance@alo.edu.bd': 'finance',
  'marketing@alo.edu.bd': 'marketing_manager',
  'frontdesk@alo.edu.bd': 'front_desk',
  'hr@alo.edu.bd': 'hr',
  'partner@alo.edu.bd': 'partner_manager',
  'doc@alo.edu.bd': 'document_officer',
  'data@alo.edu.bd': 'data_manager',
  'support@alo.edu.bd': 'support_agent',
  'ai@alo.edu.bd': 'ai_manager',
};

export async function POST() {
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
        users: allCrmUsers,
        emailRoleMap: EMAIL_ROLE_MAP,
      });
    }

    // Seed CRM admin users
    type CreatedUser = { id: string; email: string; name: string; userType: string; crmRole: string };
    const createdUsers: CreatedUser[] = [];

    for (const userData of CRM_USERS) {
      const user = await db.portalUser.create({
        data: {
          email: userData.email,
          passwordHash: userData.password,
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
        passwordHash: STUDENT_USER.password,
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

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdUsers.length} users successfully.`,
      users: createdUsers,
      emailRoleMap: EMAIL_ROLE_MAP,
      credentials: {
        note: 'Dev mode — passwords stored as plain text',
        users: CRM_USERS.map(u => ({
          email: u.email,
          password: u.password,
          role: u.crmRole,
          portalType: u.userType === 'SUPER_ADMIN' ? 'admin' : 'admin',
        })).concat([{
          email: STUDENT_USER.email,
          password: STUDENT_USER.password,
          role: 'student',
          portalType: 'student',
        }]),
      },
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