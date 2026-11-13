/// <reference types="node" />
// ============================================================
// ALO EDUCATION — Full RBAC + Portal Account Provisioning Seed
// Idempotent: safe to re-run. Creates every system role, the
// complete permission catalog grants, one staff account per
// role, and demo student/partner accounts with profiles.
// Passwords come from env only (never hardcoded in repo).
// ============================================================
import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS, type RoleName } from '../src/lib/permissions';

const STAFF_DOMAIN = 'alo.edu.bd';

interface RoleSpec {
  name: string;
  label: string;
  description: string;
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'STUDENT' | 'PARTNER';
  department: string;
  grants?: string[] | 'ALL';
  grantModules?: string[];
  grantFrom?: RoleName;
}

const allIds = () => PERMISSION_CATALOG.map((p) => p.id);
const fromModules = (mods: string[], except: string[] = []) =>
  PERMISSION_CATALOG.filter((p) => mods.includes(p.module) && !except.includes(p.id)).map((p) => p.id);

const ROLES: RoleSpec[] = [
  { name: 'super_admin', label: 'Super Admin', description: 'Full platform control.', userType: 'SUPER_ADMIN', department: 'Administration', grants: 'ALL' },
  { name: 'admin', label: 'Administrator', description: 'Platform administration.', userType: 'ADMIN', department: 'Administration', grants: 'ALL' },
  { name: 'ceo', label: 'CEO / Executive', description: 'Executive oversight, full visibility.', userType: 'EMPLOYEE', department: 'Executive', grants: 'ALL' },
  { name: 'branch_manager', label: 'Branch Manager', description: 'Branch-scoped management.', userType: 'EMPLOYEE', department: 'Operations', grantFrom: 'branch_manager' },
  { name: 'counselor', label: 'Counselor', description: 'Assigned-student counseling.', userType: 'EMPLOYEE', department: 'Counseling', grantFrom: 'counselor' },
  { name: 'application_team', label: 'Application Manager', description: 'Application processing team.', userType: 'EMPLOYEE', department: 'Applications', grantFrom: 'application_officer' },
  { name: 'application_officer', label: 'Application Officer', description: 'Application processing officer.', userType: 'EMPLOYEE', department: 'Applications', grantFrom: 'application_officer' },
  { name: 'visa_officer', label: 'Visa Officer', description: 'Visa case processing.', userType: 'EMPLOYEE', department: 'Visa', grantFrom: 'visa_officer' },
  { name: 'visa_interview_officer', label: 'Visa Interview Officer', description: 'Assigned visa interview preparation and feedback.', userType: 'EMPLOYEE', department: 'Visa', grantFrom: 'visa_interview_officer' },
  { name: 'visa_team', label: 'Visa Team', description: 'Assigned visa operations team.', userType: 'EMPLOYEE', department: 'Visa', grantFrom: 'visa_team' },
  { name: 'finance', label: 'Finance Officer', description: 'Finance and payments.', userType: 'EMPLOYEE', department: 'Finance', grantFrom: 'finance_officer' },
  { name: 'finance_officer', label: 'Finance Officer (legacy)', description: 'Finance and payments (legacy alias).', userType: 'EMPLOYEE', department: 'Finance', grantFrom: 'finance_officer' },
  { name: 'marketing_manager', label: 'Marketing Manager', description: 'Marketing campaigns and content.', userType: 'EMPLOYEE', department: 'Marketing', grantFrom: 'marketing_manager' },
  { name: 'marketing', label: 'Marketing Staff', description: 'Marketing execution staff.', userType: 'EMPLOYEE', department: 'Marketing', grantFrom: 'marketing_manager' },
  { name: 'hr_manager', label: 'HR Manager', description: 'Human resources management.', userType: 'EMPLOYEE', department: 'Human Resources', grantFrom: 'hr_manager' },
  { name: 'hr', label: 'HR Staff', description: 'Human resources staff.', userType: 'EMPLOYEE', department: 'Human Resources', grantFrom: 'hr_manager' },
  { name: 'front_desk', label: 'Front Desk', description: 'Reception, walk-ins, appointments.', userType: 'EMPLOYEE', department: 'Operations', grantModules: ['student', 'communication', 'tasks'] },
  { name: 'support_staff', label: 'Support Staff', description: 'Student support desk.', userType: 'EMPLOYEE', department: 'Support', grantModules: ['communication', 'tasks'] },
  { name: 'support_agent', label: 'Support Agent', description: 'Support ticket agent.', userType: 'EMPLOYEE', department: 'Support', grantModules: ['communication', 'tasks'] },
  { name: 'partner_manager', label: 'Partner Manager', description: 'B2B partner management.', userType: 'EMPLOYEE', department: 'Partnerships', grantModules: ['partners'] },
  { name: 'document_officer', label: 'Document Officer', description: 'Document verification.', userType: 'EMPLOYEE', department: 'Documentation', grantModules: ['documents'] },
  { name: 'data_manager', label: 'Data Manager', description: 'Reporting and data exports.', userType: 'EMPLOYEE', department: 'Data & Analytics', grantModules: ['reports', 'admin'] },
  { name: 'ai_manager', label: 'AI Manager', description: 'AI automation oversight and approvals.', userType: 'EMPLOYEE', department: 'AI & Technology', grantModules: ['communication', 'reports', 'sop_cv', 'tasks'] },
  { name: 'employee', label: 'Employee (self-service)', description: 'Baseline employee self-service.', userType: 'EMPLOYEE', department: 'General', grantFrom: 'employee' },
  { name: 'student', label: 'Student', description: 'Student portal member.', userType: 'STUDENT', department: 'Students', grants: [] },
  { name: 'partner', label: 'Partner', description: 'B2B partner portal member.', userType: 'PARTNER', department: 'Partnerships', grants: [] },
  { name: 'partner_super_admin', label: 'Partner Super Admin', description: 'Partner organization head.', userType: 'PARTNER', department: 'Partnerships', grants: [] },
];

// Permission keys that code checks literally; granted to partner-facing roles.
const B2B_PERMISSION_ID = 'application.view_b2b';
const PARTNER_B2B_ROLES = ['partner', 'partner_super_admin', 'partner_manager', 'super_admin', 'admin', 'ceo', 'branch_manager'];

function resolveGrants(spec: RoleSpec): string[] {
  if (spec.grants === 'ALL') return allIds();
  if (Array.isArray(spec.grants)) return spec.grants;
  if (spec.grantFrom) return DEFAULT_ROLE_PERMISSIONS[spec.grantFrom] ?? [];
  if (spec.grantModules) return fromModules(spec.grantModules);
  return [];
}

async function seedRbac() {
  const staffPassword = process.env.SEED_PORTAL_PASSWORD || process.env.DEVELOPMENT_SAMPLE_PASSWORD;
  if (!staffPassword || staffPassword.length < 12) {
    throw new Error('SEED_PORTAL_PASSWORD (or DEVELOPMENT_SAMPLE_PASSWORD) must be set to a value with at least 12 characters.');
  }
  const hash = await bcrypt.hash(staffPassword, 12);

  console.log('[RBAC Seed] 1/5 permissions…');
  for (const p of PERMISSION_CATALOG) {
    await db.portalPermission.upsert({
      where: { id: p.id },
      update: { module: p.module, feature: p.feature, action: p.action, description: p.description },
      create: { id: p.id, module: p.module, feature: p.feature, action: p.action, description: p.description },
    });
  }
  await db.portalPermission.upsert({
    where: { id: B2B_PERMISSION_ID },
    update: {},
    create: { id: B2B_PERMISSION_ID, module: 'applications', feature: 'b2b', action: 'view_b2b', description: 'View B2B applications channel' },
  });

  console.log('[RBAC Seed] 2/5 roles…');
  const roleIds = new Map<string, string>();
  for (const spec of ROLES) {
    const role = await db.portalRole.upsert({
      where: { name: spec.name },
      update: { label: spec.label, description: spec.description, isSystem: true },
      create: { name: spec.name, label: spec.label, description: spec.description, isSystem: true },
    });
    roleIds.set(spec.name, role.id);
  }

  console.log('[RBAC Seed] 3/5 role-permission grants…');
  let grants = 0;
  for (const spec of ROLES) {
    const roleId = roleIds.get(spec.name)!;
    const ids = new Set(resolveGrants(spec));
    if (spec.userType === 'EMPLOYEE') ids.add('employee.dashboard.view');
    if (PARTNER_B2B_ROLES.includes(spec.name)) ids.add(B2B_PERMISSION_ID);
    for (const permissionId of ids) {
      await db.portalRolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: { granted: true },
        create: { roleId, permissionId, granted: true, assignedBy: 'seed-rbac' },
      });
      grants++;
    }
  }

  console.log('[RBAC Seed] 4/5 staff accounts…');
  const createdUsers: { email: string; role: string }[] = [];
  for (const spec of ROLES) {
    if (spec.userType === 'STUDENT' || spec.userType === 'PARTNER') continue;
    const email = spec.name === 'super_admin'
      ? (process.env.SEED_SUPER_ADMIN_EMAIL || `admin@${STAFF_DOMAIN}`).toLowerCase()
      : `${spec.name === 'admin' ? 'administrator' : spec.name}@${STAFF_DOMAIN}`;
    const user = await db.portalUser.upsert({
      where: { email },
      update: { userType: spec.userType, status: 'active', emailVerified: true },
      create: {
        email,
        passwordHash: hash,
        name: `${spec.label} (System)`,
        userType: spec.userType,
        status: 'active',
        emailVerified: true,
        firstLoginRequired: false,
      },
    });
    await db.portalUserRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleIds.get(spec.name)! } },
      update: {},
      create: { userId: user.id, roleId: roleIds.get(spec.name)!, assignedBy: 'seed-rbac' },
    });
    if (spec.userType === 'EMPLOYEE' || spec.userType === 'ADMIN' || spec.userType === 'SUPER_ADMIN') {
      const seq = spec.name.slice(0, 3).toUpperCase().padEnd(3, 'X');
      const employeeId = `EMP-${seq}-${user.id.slice(-6).toUpperCase()}`;
      await db.employee.upsert({
        where: { userId: user.id },
        update: { role: spec.name, department: spec.department, status: 'active' },
        create: {
          userId: user.id,
          employeeId,
          name: user.name,
          email,
          branch: 'Dhaka HQ',
          department: spec.department,
          designation: spec.label,
          role: spec.name,
          status: 'active',
        },
      });
      await db.employeeProfile.upsert({
        where: { userId: user.id },
        update: { department: spec.department, designation: spec.label, branch: 'Dhaka HQ' },
        create: {
          userId: user.id,
          employeeId,
          department: spec.department,
          designation: spec.label,
          branch: 'Dhaka HQ',
          joinDate: new Date().toISOString().slice(0, 10),
        },
      });
    }
    createdUsers.push({ email, role: spec.name });
  }

  console.log('[RBAC Seed] 5/5 demo student + partner accounts…');
  const student = await db.portalUser.upsert({
    where: { email: `student@${STAFF_DOMAIN}` },
    update: { userType: 'STUDENT', status: 'active', emailVerified: true },
    create: {
      email: `student@${STAFF_DOMAIN}`,
      passwordHash: hash,
      name: 'Demo Student',
      userType: 'STUDENT',
      status: 'active',
      emailVerified: true,
    },
  });
  const studentRole = roleIds.get('student')!;
  await db.portalUserRole.upsert({
    where: { userId_roleId: { userId: student.id, roleId: studentRole } },
    update: {},
    create: { userId: student.id, roleId: studentRole, assignedBy: 'seed-rbac' },
  });
  await db.portalStudentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      studentId: 'ALO-STU-DEMO-001',
      fullName: 'Demo Student',
      city: 'Dhaka',
      preferredCountry: 'United Kingdom',
      currentEducation: "Bachelor's",
    },
  });
  const partner = await db.portalUser.upsert({
    where: { email: `partner@${STAFF_DOMAIN}` },
    update: { userType: 'PARTNER', status: 'active', emailVerified: true },
    create: {
      email: `partner@${STAFF_DOMAIN}`,
      passwordHash: hash,
      name: 'Demo Partner',
      userType: 'PARTNER',
      status: 'active',
      emailVerified: true,
    },
  });
  await db.portalUserRole.upsert({
    where: { userId_roleId: { userId: partner.id, roleId: roleIds.get('partner')! } },
    update: {},
    create: { userId: partner.id, roleId: roleIds.get('partner')!, assignedBy: 'seed-rbac' },
  });
  await db.partnerProfile.upsert({
    where: { userId: partner.id },
    update: { approvalStatus: 'approved' },
    create: {
      userId: partner.id,
      partnerId: 'ALO-PTR-DEMO-001',
      companyName: 'Demo Partner Agency',
      contactPerson: 'Demo Partner',
      businessType: 'Education Consultancy',
      city: 'Dhaka',
      approvalStatus: 'approved',
    },
  });
  await db.portalUserRole.upsert({
    where: { userId_roleId: { userId: partner.id, roleId: roleIds.get('partner_super_admin')! } },
    update: {},
    create: { userId: partner.id, roleId: roleIds.get('partner_super_admin')!, assignedBy: 'seed-rbac' },
  });

  console.log(`[RBAC Seed] Done. roles=${ROLES.length} grants=${grants} staffUsers=${createdUsers.length} + demo student/partner.`);
}

seedRbac()
  .catch((error) => { console.error('[RBAC Seed Error]', error); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
