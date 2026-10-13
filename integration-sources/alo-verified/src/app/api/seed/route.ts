import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/auth-rbac';

export async function POST(request: NextRequest) {
  // SECURITY: Only super_admin can seed the database. Never public.
  const authOrResponse = await requireRole(request, ['super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  // Block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_IN_PRODUCTION !== 'true') {
    return NextResponse.json(
      { error: 'Seeding is disabled in production. Set ALLOW_SEED_IN_PRODUCTION=true to override.' },
      { status: 403 }
    );
  }
  try {
    // Check if already seeded
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already seeded. Reset the database first.',
        existingRecords: existingUsers,
      }, { status: 400 });
    }

    const results: Record<string, number> = {};

    // Pre-hash the default password for all seeded users
    const defaultHashedPassword = await hashPassword('ChangeMe@12345');

    // ============================================================
    // 1. CREATE ROLES
    // ============================================================
    const roleDefinitions = [
      { name: 'super_admin', displayName: 'Super Admin', description: 'Full system control tower' },
      { name: 'ceo_director', displayName: 'CEO / Director', description: 'Executive decision-making dashboard' },
      { name: 'admin', displayName: 'Admin', description: 'Administrative access' },
      { name: 'branch_manager', displayName: 'Branch Manager', description: 'Branch-level team control' },
      { name: 'country_manager', displayName: 'Country Manager', description: 'Country-level management' },
      { name: 'office_manager', displayName: 'Office Manager', description: 'Office-level management' },
      { name: 'counselor', displayName: 'Counselor', description: 'Student counseling & conversion' },
      { name: 'junior_counselor', displayName: 'Junior Counselor', description: 'Junior student counseling' },
      { name: 'application_team', displayName: 'Application Team', description: 'Application processing' },
      { name: 'visa_officer', displayName: 'Visa Officer', description: 'Visa processing' },
      { name: 'finance', displayName: 'Finance', description: 'Money, deposits, commissions' },
      { name: 'marketing_manager', displayName: 'Marketing Manager', description: 'Growth cockpit' },
      { name: 'marketing_executive', displayName: 'Marketing Executive', description: 'Marketing execution' },
      { name: 'front_desk', displayName: 'Front Desk / Reception', description: 'Walk-in & first contact' },
      { name: 'hr_manager', displayName: 'HR Manager', description: 'Staff lifecycle control' },
      { name: 'partner_manager', displayName: 'Partner Manager', description: 'B2B partner network control' },
      { name: 'document_officer', displayName: 'Document Review Officer', description: 'Document verification queue' },
      { name: 'data_manager', displayName: 'Course & University Data Manager', description: 'Course database management' },
      { name: 'support_agent', displayName: 'Support / WhatsApp Agent', description: 'Communication & chat support' },
      { name: 'ai_manager', displayName: 'AI Command Center Manager', description: 'AI task approvals & operations' },
      { name: 'employee', displayName: 'Employee', description: 'Standard employee' },
      { name: 'partner_super_admin', displayName: 'Partner Super Admin', description: 'Partner full access' },
      { name: 'partner_staff', displayName: 'Partner Staff', description: 'Partner staff access' },
      { name: 'student', displayName: 'Student', description: 'Student access' },
      { name: 'read_only_auditor', displayName: 'Read Only Auditor', description: 'Audit read access' },
    ];

    const roles: Record<string, string> = {};
    for (const rd of roleDefinitions) {
      const role = await db.role.create({ data: rd });
      roles[rd.name] = role.id;
    }
    results.roles = roleDefinitions.length;

    // ============================================================
    // 2. CREATE PERMISSIONS
    // ============================================================
    const permissionDefinitions = [
      // Students
      { name: 'students.read', module: 'students', action: 'read', description: 'View students' },
      { name: 'students.create', module: 'students', action: 'create', description: 'Create students' },
      { name: 'students.update', module: 'students', action: 'update', description: 'Update students' },
      { name: 'students.delete', module: 'students', action: 'delete', description: 'Delete students' },
      // Leads
      { name: 'leads.read', module: 'leads', action: 'read', description: 'View leads' },
      { name: 'leads.create', module: 'leads', action: 'create', description: 'Create leads' },
      { name: 'leads.update', module: 'leads', action: 'update', description: 'Update leads' },
      { name: 'leads.delete', module: 'leads', action: 'delete', description: 'Delete leads' },
      // Applications
      { name: 'applications.read', module: 'applications', action: 'read', description: 'View applications' },
      { name: 'applications.create', module: 'applications', action: 'create', description: 'Create applications' },
      { name: 'applications.update', module: 'applications', action: 'update', description: 'Update applications' },
      { name: 'applications.approve', module: 'applications', action: 'approve', description: 'Approve applications' },
      // Partners
      { name: 'partners.read', module: 'partners', action: 'read', description: 'View partners' },
      { name: 'partners.create', module: 'partners', action: 'create', description: 'Create partners' },
      { name: 'partners.update', module: 'partners', action: 'update', description: 'Update partners' },
      // Commissions
      { name: 'commissions.read', module: 'commissions', action: 'read', description: 'View commissions' },
      { name: 'commissions.approve', module: 'commissions', action: 'approve', description: 'Approve commissions' },
      { name: 'commissions.pay', module: 'commissions', action: 'approve', description: 'Pay commissions' },
      // Employees
      { name: 'employees.read', module: 'employees', action: 'read', description: 'View employees' },
      { name: 'employees.create', module: 'employees', action: 'create', description: 'Create employees' },
      { name: 'employees.update', module: 'employees', action: 'update', description: 'Update employees' },
      // Finance
      { name: 'finance.read', module: 'finance', action: 'read', description: 'View finance' },
      { name: 'finance.create', module: 'finance', action: 'create', description: 'Create finance records' },
      { name: 'finance.approve', module: 'finance', action: 'approve', description: 'Approve finance' },
      // Marketing
      { name: 'marketing.read', module: 'marketing', action: 'read', description: 'View marketing' },
      { name: 'marketing.create', module: 'marketing', action: 'create', description: 'Create marketing content' },
      { name: 'marketing.approve', module: 'marketing', action: 'approve', description: 'Approve marketing' },
      // Visa
      { name: 'visa.read', module: 'visa', action: 'read', description: 'View visa files' },
      { name: 'visa.update', module: 'visa', action: 'update', description: 'Update visa files' },
      // Blog
      { name: 'blog.read', module: 'blog', action: 'read', description: 'View blog' },
      { name: 'blog.create', module: 'blog', action: 'create', description: 'Create blog posts' },
      { name: 'blog.approve', module: 'blog', action: 'approve', description: 'Approve blog posts' },
      // Settings
      { name: 'settings.read', module: 'settings', action: 'read', description: 'View settings' },
      { name: 'settings.update', module: 'settings', action: 'update', description: 'Update settings' },
      // Reports
      { name: 'reports.read', module: 'reports', action: 'read', description: 'View reports' },
      // AI
      { name: 'ai.use', module: 'ai', action: 'read', description: 'Use AI features' },
      // Universities
      { name: 'universities.read', module: 'universities', action: 'read', description: 'View universities' },
      { name: 'universities.create', module: 'universities', action: 'create', description: 'Create universities' },
      { name: 'universities.update', module: 'universities', action: 'update', description: 'Update universities' },
      // Courses
      { name: 'courses.read', module: 'courses', action: 'read', description: 'View courses' },
      { name: 'courses.create', module: 'courses', action: 'create', description: 'Create courses' },
      { name: 'courses.update', module: 'courses', action: 'update', description: 'Update courses' },
      // Scholarships
      { name: 'scholarships.read', module: 'scholarships', action: 'read', description: 'View scholarships' },
      { name: 'scholarships.create', module: 'scholarships', action: 'create', description: 'Create scholarships' },
    ];

    const permissions: Record<string, string> = {};
    for (const pd of permissionDefinitions) {
      const perm = await db.permission.create({ data: pd });
      permissions[pd.name] = perm.id;
    }
    results.permissions = permissionDefinitions.length;

    // ============================================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // ============================================================
    const rolePermissionMap: Record<string, string[]> = {
      'super_admin': Object.keys(permissions),
      'ceo_director': ['students.read', 'leads.read', 'applications.read', 'partners.read', 'employees.read', 'finance.read', 'commissions.read', 'reports.read', 'marketing.read', 'visa.read', 'ai.use'],
      'admin': Object.keys(permissions).filter(p => !p.startsWith('settings.')),
      'branch_manager': ['students.read', 'students.create', 'students.update', 'leads.read', 'leads.create', 'leads.update', 'applications.read', 'applications.create', 'applications.update', 'employees.read', 'finance.read', 'reports.read', 'ai.use'],
      'country_manager': ['students.read', 'students.create', 'students.update', 'leads.read', 'leads.create', 'leads.update', 'applications.read', 'applications.create', 'applications.update', 'partners.read', 'employees.read', 'finance.read', 'reports.read', 'ai.use'],
      'office_manager': ['students.read', 'students.create', 'students.update', 'leads.read', 'leads.create', 'leads.update', 'applications.read', 'applications.create', 'applications.update', 'employees.read', 'reports.read', 'ai.use'],
      'counselor': ['students.read', 'students.create', 'students.update', 'leads.read', 'leads.create', 'leads.update', 'applications.read', 'applications.create', 'applications.update', 'ai.use'],
      'junior_counselor': ['students.read', 'leads.read', 'leads.create', 'leads.update', 'applications.read', 'ai.use'],
      'application_team': ['applications.read', 'applications.create', 'applications.update', 'students.read', 'ai.use'],
      'visa_officer': ['visa.read', 'visa.update', 'applications.read', 'students.read', 'ai.use'],
      'finance': ['finance.read', 'finance.create', 'finance.approve', 'commissions.read', 'commissions.approve', 'commissions.pay', 'reports.read', 'ai.use'],
      'marketing_manager': ['marketing.read', 'marketing.create', 'marketing.approve', 'blog.read', 'blog.create', 'blog.approve', 'leads.read', 'ai.use'],
      'marketing_executive': ['marketing.read', 'marketing.create', 'blog.read', 'blog.create', 'leads.read', 'ai.use'],
      'front_desk': ['leads.read', 'leads.create', 'leads.update', 'students.read', 'students.create', 'applications.read', 'ai.use'],
      'hr_manager': ['employees.read', 'employees.create', 'employees.update', 'finance.read', 'reports.read', 'ai.use'],
      'partner_manager': ['partners.read', 'partners.create', 'partners.update', 'students.read', 'applications.read', 'commissions.read', 'reports.read', 'ai.use'],
      'document_officer': ['applications.read', 'students.read', 'ai.use'],
      'data_manager': ['universities.read', 'universities.create', 'universities.update', 'courses.read', 'courses.create', 'courses.update', 'scholarships.read', 'ai.use'],
      'support_agent': ['students.read', 'leads.read', 'leads.create', 'leads.update', 'applications.read', 'ai.use'],
      'ai_manager': ['ai.use', 'students.read', 'leads.read', 'applications.read', 'reports.read'],
      'employee': ['students.read', 'leads.read', 'applications.read', 'ai.use'],
      'partner_super_admin': ['students.read', 'applications.read', 'commissions.read', 'partners.read', 'ai.use'],
      'partner_staff': ['students.read', 'applications.read', 'commissions.read', 'ai.use'],
      'student': ['applications.read', 'blog.read', 'ai.use'],
      'read_only_auditor': ['students.read', 'leads.read', 'applications.read', 'partners.read', 'commissions.read', 'finance.read', 'employees.read', 'reports.read'],
    };

    let permCount = 0;
    for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
      const roleId = roles[roleName];
      if (!roleId) continue;
      for (const permName of permNames) {
        const permissionId = permissions[permName];
        if (!permissionId) continue;
        await db.rolePermission.create({
          data: { roleId, permissionId, granted: true }
        });
        permCount++;
      }
    }
    results.rolePermissions = permCount;

    // ============================================================
    // 4. CREATE BRANCHES
    // ============================================================
    const branchData = [
      { name: 'ALO Education Dhaka', code: 'DHK', address: 'Gulshan-2, Dhaka', city: 'Dhaka', country: 'Bangladesh', phone: '+880-2-8888888', email: 'dhaka@aloeducation.com' },
      { name: 'ALO Education Chattogram', code: 'CTG', address: 'Agrabad, Chattogram', city: 'Chattogram', country: 'Bangladesh', phone: '+880-31-7777777', email: 'ctg@aloeducation.com' },
      { name: 'ALO Education Sylhet', code: 'SYL', address: 'Zindabazar, Sylhet', city: 'Sylhet', country: 'Bangladesh', phone: '+880-821-666666', email: 'sylhet@aloeducation.com' },
      { name: 'ALO Education London', code: 'LON', address: 'Aldgate, London', city: 'London', country: 'United Kingdom', phone: '+44-20-5555555', email: 'london@aloeducation.com' },
    ];

    const branches: Record<string, string> = {};
    for (const b of branchData) {
      const branch = await db.branch.create({ data: b });
      branches[b.code] = branch.id;
    }
    results.branches = branchData.length;

    // ============================================================
    // 5. CREATE DEPARTMENTS
    // ============================================================
    const departmentData = [
      { name: 'Counseling', code: 'COUN', branchId: branches['DHK'] },
      { name: 'Application Processing', code: 'APPL', branchId: branches['DHK'] },
      { name: 'Visa Processing', code: 'VISA', branchId: branches['DHK'] },
      { name: 'Finance', code: 'FIN', branchId: branches['DHK'] },
      { name: 'Marketing', code: 'MKT', branchId: branches['DHK'] },
      { name: 'Human Resources', code: 'HR', branchId: branches['DHK'] },
      { name: 'IT', code: 'IT', branchId: branches['DHK'] },
      { name: 'Operations', code: 'OPS', branchId: branches['DHK'] },
    ];

    const departments: Record<string, string> = {};
    for (const d of departmentData) {
      const dept = await db.department.create({ data: d });
      departments[d.code] = dept.id;
    }
    results.departments = departmentData.length;

    // ============================================================
    // 6. CREATE DESIGNATIONS
    // ============================================================
    const designationData = [
      { name: 'CEO', level: 10 },
      { name: 'Director', level: 9 },
      { name: 'Branch Manager', level: 8 },
      { name: 'Country Manager', level: 7 },
      { name: 'Office Manager', level: 6 },
      { name: 'Senior Counselor', level: 5 },
      { name: 'Counselor', level: 4 },
      { name: 'Junior Counselor', level: 3 },
      { name: 'Application Officer', level: 3 },
      { name: 'Visa Officer', level: 3 },
      { name: 'Marketing Manager', level: 5 },
      { name: 'Marketing Executive', level: 3 },
      { name: 'Finance Manager', level: 5 },
      { name: 'HR Manager', level: 5 },
      { name: 'Executive', level: 2 },
      { name: 'Intern', level: 1 },
    ];

    const designations: Record<string, string> = {};
    for (const d of designationData) {
      const desig = await db.designation.create({ data: d });
      designations[d.name] = desig.id;
    }
    results.designations = designationData.length;

    // ============================================================
    // 7. CREATE SUPER ADMIN USER
    // ============================================================
    const adminUser = await db.user.create({
      data: {
        email: 'admin@aloeducation.com',
        password: defaultHashedPassword,
        name: 'Super Admin',
        phone: '+8801711111111',
        userType: 'employee',
        forcePasswordChange: false,
        status: 'active',
      }
    });

    await db.userRole.create({
      data: { userId: adminUser.id, roleId: roles['super_admin'] }
    });
    results.adminUser = 1;

    // ============================================================
    // 8. CREATE EMPLOYEES
    // ============================================================
    const employeeData = [
      { firstName: 'Rahim', lastName: 'Ahmed', email: 'rahim@aloeducation.com', phone: '+880171234567', role: 'branch_manager', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Branch Manager'], salary: 80000 },
      { firstName: 'Fatema', lastName: 'Begum', email: 'fatema@aloeducation.com', phone: '+880171234568', role: 'counselor', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Senior Counselor'], salary: 50000 },
      { firstName: 'Kamal', lastName: 'Hossain', email: 'kamal@aloeducation.com', phone: '+880171234569', role: 'counselor', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Counselor'], salary: 40000 },
      { firstName: 'Nusrat', lastName: 'Jahan', email: 'nusrat@aloeducation.com', phone: '+880171234570', role: 'junior_counselor', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Junior Counselor'], salary: 30000 },
      { firstName: 'Sakib', lastName: 'Al Hasan', email: 'sakib@aloeducation.com', phone: '+880171234571', role: 'application_team', branchId: branches['DHK'], departmentId: departments['APPL'], designationId: designations['Application Officer'], salary: 35000 },
      { firstName: 'Tasneem', lastName: 'Akter', email: 'tasneem@aloeducation.com', phone: '+880171234572', role: 'visa_officer', branchId: branches['DHK'], departmentId: departments['VISA'], designationId: designations['Visa Officer'], salary: 38000 },
      { firstName: 'Imran', lastName: 'Khan', email: 'imran@aloeducation.com', phone: '+880171234573', role: 'finance', branchId: branches['DHK'], departmentId: departments['FIN'], designationId: designations['Finance Manager'], salary: 55000 },
      { firstName: 'Mithila', lastName: 'Rahman', email: 'mithila@aloeducation.com', phone: '+880171234574', role: 'marketing_manager', branchId: branches['DHK'], departmentId: departments['MKT'], designationId: designations['Marketing Manager'], salary: 52000 },
      { firstName: 'Arif', lastName: 'Siddiqui', email: 'arif@aloeducation.com', phone: '+880171234575', role: 'marketing_executive', branchId: branches['DHK'], departmentId: departments['MKT'], designationId: designations['Marketing Executive'], salary: 32000 },
      { firstName: 'Shamima', lastName: 'Yasmin', email: 'shamima@aloeducation.com', phone: '+880171234576', role: 'hr_manager', branchId: branches['DHK'], departmentId: departments['HR'], designationId: designations['HR Manager'], salary: 50000 },
      { firstName: 'Jahid', lastName: 'Molla', email: 'jahid@aloeducation.com', phone: '+880171234577', role: 'counselor', branchId: branches['CTG'], departmentId: departments['COUN'], designationId: designations['Counselor'], salary: 38000 },
      { firstName: 'Rumi', lastName: 'Akter', email: 'rumi@aloeducation.com', phone: '+880171234578', role: 'counselor', branchId: branches['SYL'], departmentId: departments['COUN'], designationId: designations['Counselor'], salary: 38000 },
      { firstName: 'David', lastName: 'Wilson', email: 'david@aloeducation.com', phone: '+44207123456', role: 'country_manager', branchId: branches['LON'], departmentId: departments['COUN'], designationId: designations['Country Manager'], salary: 65000 },
      // New role-based demo users
      { firstName: 'Tanvir', lastName: 'Chowdhury', email: 'ceo@aloeducation.com', phone: '+880171234580', role: 'ceo_director', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Country Manager'], salary: 200000 },
      { firstName: 'Lubna', lastName: 'Karim', email: 'frontdesk@aloeducation.com', phone: '+880171234581', role: 'front_desk', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Junior Counselor'], salary: 25000 },
      { firstName: 'Hasibul', lastName: 'Islam', email: 'partner.mgr@aloeducation.com', phone: '+880171234582', role: 'partner_manager', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Branch Manager'], salary: 60000 },
      { firstName: 'Sumaiya', lastName: 'Akter', email: 'docs@aloeducation.com', phone: '+880171234583', role: 'document_officer', branchId: branches['DHK'], departmentId: departments['APPL'], designationId: designations['Application Officer'], salary: 30000 },
      { firstName: 'Fahim', lastName: 'Ahmed', email: 'data.mgr@aloeducation.com', phone: '+880171234584', role: 'data_manager', branchId: branches['DHK'], departmentId: departments['APPL'], designationId: designations['Application Officer'], salary: 42000 },
      { firstName: 'Nadia', lastName: 'Sharma', email: 'support@aloeducation.com', phone: '+880171234585', role: 'support_agent', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Junior Counselor'], salary: 28000 },
      { firstName: 'Rashed', lastName: 'Khan', email: 'ai.mgr@aloeducation.com', phone: '+880171234586', role: 'ai_manager', branchId: branches['DHK'], departmentId: departments['COUN'], designationId: designations['Senior Counselor'], salary: 70000 },
    ];

    const employeeIds: string[] = [];
    for (let i = 0; i < employeeData.length; i++) {
      const ed = employeeData[i];
      const emp = await db.employee.create({
        data: {
          employeeId: `EMP-2026${(i + 1).toString().padStart(4, '0')}`,
          firstName: ed.firstName,
          lastName: ed.lastName,
          email: ed.email,
          phone: ed.phone,
          branchId: ed.branchId,
          departmentId: ed.departmentId,
          designationId: ed.designationId,
          role: ed.role,
          salary: ed.salary,
          joiningDate: new Date('2024-01-15'),
          status: 'active',
        }
      });
      employeeIds.push(emp.id);

      // Create user for employee
      const empUser = await db.user.create({
        data: {
          email: ed.email,
          password: defaultHashedPassword,
          name: `${ed.firstName} ${ed.lastName}`,
          phone: ed.phone,
          userType: 'employee',
          referenceId: emp.id,
          forcePasswordChange: true,
        }
      });

      const roleId = roles[ed.role] || roles['employee'];
      await db.userRole.create({
        data: { userId: empUser.id, roleId }
      });

      await db.employee.update({
        where: { id: emp.id },
        data: { userId: empUser.id }
      });

      // Create salary structure
      await db.salaryStructure.create({
        data: {
          employeeId: emp.id,
          basicSalary: ed.salary * 0.6,
          houseRent: ed.salary * 0.2,
          medical: ed.salary * 0.05,
          transport: ed.salary * 0.05,
          food: ed.salary * 0.05,
          otherAllowance: ed.salary * 0.05,
        }
      });
    }
    results.employees = employeeData.length;

    // ============================================================
    // 9. CREATE PARTNERS
    // ============================================================
    const partnerDataList = [
      { companyName: 'EduBridge Bangladesh', contactPerson: 'Mizanur Rahman', email: 'info@edubridge.bd', phone: '+8801811111111', city: 'Dhaka', country: 'Bangladesh', businessType: 'agency', commissionRate: 15 },
      { companyName: 'Global Study Solutions', contactPerson: 'Anwar Hossain', email: 'anwar@globalstudy.bd', phone: '+8801822222222', city: 'Chattogram', country: 'Bangladesh', businessType: 'agency', commissionRate: 12 },
      { companyName: 'UK Pathway Consultancy', contactPerson: 'Sarah Johnson', email: 'sarah@ukpathway.co.uk', phone: '+442079990001', city: 'London', country: 'United Kingdom', businessType: 'consultant', commissionRate: 10 },
      { companyName: 'StudyLink International', contactPerson: 'Rafiq Islam', email: 'rafiq@studylink.bd', phone: '+8801833333333', city: 'Sylhet', country: 'Bangladesh', businessType: 'agency', commissionRate: 12 },
      { companyName: 'Bright Future Education', contactPerson: 'Nadia Karim', email: 'nadia@brightfuture.bd', phone: '+8801844444444', city: 'Dhaka', country: 'Bangladesh', businessType: 'agency', commissionRate: 10 },
    ];

    const partnerIds: string[] = [];
    for (let i = 0; i < partnerDataList.length; i++) {
      const pd = partnerDataList[i];
      const partner = await db.partner.create({
        data: {
          partnerId: `AEP-${(i + 1).toString().padStart(5, '0')}`,
          ...pd,
          status: 'active',
        }
      });
      partnerIds.push(partner.id);

      // Create user for partner
      const partnerUser = await db.user.create({
        data: {
          email: pd.email,
          password: defaultHashedPassword,
          name: pd.contactPerson,
          phone: pd.phone,
          userType: 'partner',
          referenceId: partner.id,
          forcePasswordChange: true,
        }
      });

      await db.userRole.create({
        data: { userId: partnerUser.id, roleId: roles['partner_super_admin'] }
      });

      await db.partner.update({
        where: { id: partner.id },
        data: { userId: partnerUser.id }
      });
    }
    results.partners = partnerDataList.length;

    // ============================================================
    // 10. CREATE STUDENTS
    // ============================================================
    const studentNames = [
      { firstName: 'Tanvir', lastName: 'Ahmed', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Sumaiya', lastName: 'Khan', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Rifat', lastName: 'Hossain', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Naima', lastName: 'Akter', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Shahriar', lastName: 'Islam', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Farzana', lastName: 'Mim', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Arman', lastName: 'Chowdhury', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Tasnia', lastName: 'Rahman', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Mehedi', lastName: 'Hasan', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Jannatul', lastName: 'Ferdous', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Shuvo', lastName: 'Das', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Nasrin', lastName: 'Sultana', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Imtiaz', lastName: 'Alam', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Sadia', lastName: 'Binte', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Rakib', lastName: 'Molla', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Afia', lastName: 'Naz', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Omar', lastName: 'Faruk', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Priya', lastName: 'Sen', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Zahid', lastName: 'Rana', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Lamia', lastName: 'Haque', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Faisal', lastName: 'Kabir', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Nusrat', lastName: 'Diba', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Sabbir', lastName: 'Talukder', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Maliha', lastName: 'Uddin', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
      { firstName: 'Rezwan', lastName: 'Arefin', nationality: 'Bangladeshi', preferredCountry: 'United Kingdom' },
    ];

    const studentIds: string[] = [];
    const testTypes = ['IELTS', 'PTE', 'TOEFL', 'Duolingo'];
    const educations = ['HSC', 'Bachelor', 'Master', 'Diploma'];
    const gpas = ['3.5', '3.2', '3.8', '3.0', '3.6', '3.4', '3.7', '3.1'];
    const courses = ['Computer Science', 'Business Administration', 'Engineering', 'Data Science', 'MBA', 'Public Health', 'Law', 'Architecture'];
    const intakes = ['September 2026', 'January 2027', 'September 2027'];

    for (let i = 0; i < studentNames.length; i++) {
      const s = studentNames[i];
      const source = i < 8 ? 'DIRECT' : (i < 16 ? 'PARTNER_INBOUND' : 'PARTNER_OUTBOUND');
      const partnerId = source !== 'DIRECT' ? partnerIds[i % partnerIds.length] : null;

      const student = await db.student.create({
        data: {
          studentId: `AE-2026${(i + 1).toString().padStart(4, '0')}`,
          firstName: s.firstName,
          lastName: s.lastName,
          email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@gmail.com`,
          phone: `+88017${(12345600 + i).toString()}`,
          whatsappNumber: `+88017${(12345600 + i).toString()}`,
          nationality: s.nationality,
          preferredCountry: s.preferredCountry,
          preferredCourse: courses[i % courses.length],
          preferredIntake: intakes[i % intakes.length],
          englishTestType: testTypes[i % testTypes.length],
          englishTestScore: (6 + (i % 3) * 0.5).toString(),
          highestEducation: educations[i % educations.length],
          gpa: gpas[i % gpas.length],
          source,
          partnerId,
          country: 'Bangladesh',
          city: ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi'][i % 4],
          assignedCounselor: i < 13 ? employeeIds[i % 5 + 1] : null, // Assign to counselors
          status: ['active', 'active', 'active', 'enrolled', 'active'][i % 5],
        }
      });
      studentIds.push(student.id);

      // Create user for first 10 students
      if (i < 10) {
        const studentUser = await db.user.create({
          data: {
            email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@gmail.com`,
            password: defaultHashedPassword,
            name: `${s.firstName} ${s.lastName}`,
            phone: `+88017${(12345600 + i).toString()}`,
            userType: 'student',
            referenceId: student.id,
            forcePasswordChange: true,
          }
        });

        await db.userRole.create({
          data: { userId: studentUser.id, roleId: roles['student'] }
        });

        await db.student.update({
          where: { id: student.id },
          data: { userId: studentUser.id }
        });
      }
    }
    results.students = studentNames.length;

    // ============================================================
    // 11. CREATE UNIVERSITIES
    // ============================================================
    const universityData = [
      // ── ALO Partner Universities (featured, listed first) ──
      { name: 'University of Greenwich', slug: 'university-of-greenwich', country: 'United Kingdom', city: 'London', ranking: 67, type: 'public', description: 'A modern UK university with historic roots, offering industry-focused programs across London campuses. Strong scholarship support for Bangladeshi students.' },
      { name: 'Coventry University', slug: 'coventry-university', country: 'United Kingdom', city: 'Coventry', ranking: 54, type: 'public', description: 'Top modern university in the UK, renowned for employability and industry connections. Offers generous scholarships up to £3,000 for international students.' },
      { name: 'University of East London', slug: 'university-of-east-london', country: 'United Kingdom', city: 'London', ranking: 112, type: 'public', description: 'One of the most diverse universities in the UK with strong industry links. Affordable tuition and excellent scholarship opportunities for Bangladeshi applicants.' },
      { name: 'De Montfort University', slug: 'de-montfort-university', country: 'United Kingdom', city: 'Leicester', ranking: 89, type: 'public', description: 'A vibrant, career-focused university known for its creative arts and professional programs. Strong Bangladeshi community and dedicated support services.' },
      { name: 'University of Roehampton', slug: 'university-of-roehampton', country: 'United Kingdom', city: 'London', ranking: 95, type: 'public', description: 'A beautiful parkland campus university in south-west London. Friendly community with high student satisfaction and scholarships up to £4,000.' },
      { name: 'BPP University', slug: 'bpp-university', country: 'United Kingdom', city: 'London', ranking: 130, type: 'private', description: 'Specialist professional university focused on law, business, finance, and health. Strong employability outcomes with industry-aligned curriculum.' },
      { name: 'Ulster University', slug: 'ulster-university', country: 'United Kingdom', city: 'Belfast', ranking: 72, type: 'public', description: 'Northern Ireland\'s largest university with a strong research profile. Affordable living costs and excellent post-study work opportunities.' },
      { name: 'University of Portsmouth', slug: 'university-of-portsmouth', country: 'United Kingdom', city: 'Portsmouth', ranking: 63, type: 'public', description: 'A progressive university with a coastal campus and strong industry links. Top-rated for student satisfaction and graduate employability.' },
      // ── Top Global Universities ──
      { name: 'University of Oxford', slug: 'university-of-oxford', country: 'United Kingdom', city: 'Oxford', ranking: 1, type: 'public', description: 'The oldest university in the English-speaking world, consistently ranked #1 globally.' },
      { name: 'Imperial College London', slug: 'imperial-college-london', country: 'United Kingdom', city: 'London', ranking: 3, type: 'public', description: 'World-leading university focused on science, engineering, medicine, and business.' },
      { name: 'University College London', slug: 'ucl-london', country: 'United Kingdom', city: 'London', ranking: 9, type: 'public', description: 'A global powerhouse of research and teaching in the heart of London.' },
      { name: 'University of Manchester', slug: 'university-of-manchester', country: 'United Kingdom', city: 'Manchester', ranking: 27, type: 'public', description: 'A prestigious Russell Group university known for research excellence.' },
      { name: 'University of Toronto', slug: 'university-of-toronto', country: 'Canada', city: 'Toronto', ranking: 18, type: 'public', description: 'Canada\'s top-ranked university, a global leader in research and innovation.' },
      { name: 'University of Melbourne', slug: 'university-of-melbourne', country: 'Australia', city: 'Melbourne', ranking: 14, type: 'public', description: 'Australia\'s #1 university, offering a Melbourne Model curriculum.' },
      { name: 'Harvard University', slug: 'harvard-university', country: 'United States', city: 'Cambridge', ranking: 2, type: 'private', description: 'America\'s oldest university and a global symbol of academic excellence.' },
      { name: 'University of Sydney', slug: 'university-of-sydney', country: 'Australia', city: 'Sydney', ranking: 19, type: 'public', description: 'Australia\'s first university, a member of the Group of Eight.' },
      { name: 'McGill University', slug: 'mcgill-university', country: 'Canada', city: 'Montreal', ranking: 30, type: 'public', description: 'Canada\'s most internationally diverse university, located in bilingual Montreal.' },
      { name: 'University of Leeds', slug: 'university-of-leeds', country: 'United Kingdom', city: 'Leeds', ranking: 86, type: 'public', description: 'A world-leading research university in the heart of Yorkshire.' },
      { name: 'University of Birmingham', slug: 'university-of-birmingham', country: 'United Kingdom', city: 'Birmingham', ranking: 90, type: 'public', description: 'A founding member of the Russell Group with a proud heritage.' },
      { name: 'University of Sheffield', slug: 'university-of-sheffield', country: 'United Kingdom', city: 'Sheffield', ranking: 96, type: 'public', description: 'A research-intensive university with a global reputation.' },
    ];

    const universityIds: string[] = [];
    for (const ud of universityData) {
      const uni = await db.university.create({
        data: {
          ...ud,
          scholarshipAvailable: true,
          status: 'active',
        }
      });
      universityIds.push(uni.id);
    }
    results.universities = universityData.length;

    // ============================================================
    // 12. CREATE COURSES
    // ============================================================
    const courseDataList = [
      // Greenwich (idx 0)
      { universityIdx: 0, name: 'BSc Computer Science', level: 'undergraduate', field: 'Computer Science', duration: '3 years', tuitionFee: 15000 },
      { universityIdx: 0, name: 'MSc Data Science', level: 'postgraduate', field: 'Data Science', duration: '1 year', tuitionFee: 17000 },
      { universityIdx: 0, name: 'BSc Business Management', level: 'undergraduate', field: 'Business', duration: '3 years', tuitionFee: 14500 },
      { universityIdx: 0, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '1 year', tuitionFee: 19000 },
      { universityIdx: 0, name: 'BEng Mechanical Engineering', level: 'undergraduate', field: 'Engineering', duration: '3 years', tuitionFee: 16000 },
      // Coventry (idx 1)
      { universityIdx: 1, name: 'MSc Cyber Security', level: 'postgraduate', field: 'IT', duration: '1 year', tuitionFee: 18500 },
      { universityIdx: 1, name: 'BEng Automotive Engineering', level: 'undergraduate', field: 'Engineering', duration: '4 years', tuitionFee: 16500 },
      { universityIdx: 1, name: 'BSc Business Management', level: 'undergraduate', field: 'Business', duration: '3 years', tuitionFee: 16000 },
      { universityIdx: 1, name: 'MSc Aerospace Engineering', level: 'postgraduate', field: 'Engineering', duration: '1 year', tuitionFee: 19500 },
      { universityIdx: 1, name: 'BA Graphic Design', level: 'undergraduate', field: 'Arts', duration: '3 years', tuitionFee: 15500 },
      // East London (idx 2)
      { universityIdx: 2, name: 'BSc Psychology', level: 'undergraduate', field: 'Psychology', duration: '3 years', tuitionFee: 14000 },
      { universityIdx: 2, name: 'MSc Civil Engineering', level: 'postgraduate', field: 'Engineering', duration: '1 year', tuitionFee: 15500 },
      { universityIdx: 2, name: 'LLB Law', level: 'undergraduate', field: 'Law', duration: '3 years', tuitionFee: 13500 },
      { universityIdx: 2, name: 'BSc Business Management', level: 'undergraduate', field: 'Business', duration: '3 years', tuitionFee: 14000 },
      // De Montfort (idx 3)
      { universityIdx: 3, name: 'BA Fashion Design', level: 'undergraduate', field: 'Arts', duration: '3 years', tuitionFee: 14500 },
      { universityIdx: 3, name: 'MSc Pharmacy', level: 'postgraduate', field: 'Health', duration: '1 year', tuitionFee: 17000 },
      { universityIdx: 3, name: 'BA Journalism', level: 'undergraduate', field: 'Arts', duration: '3 years', tuitionFee: 14000 },
      { universityIdx: 3, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '1 year', tuitionFee: 18000 },
      // Roehampton (idx 4)
      { universityIdx: 4, name: 'BA Education Studies', level: 'undergraduate', field: 'Education', duration: '3 years', tuitionFee: 15000 },
      { universityIdx: 4, name: 'MSc Business Management', level: 'postgraduate', field: 'Business', duration: '1 year', tuitionFee: 16500 },
      { universityIdx: 4, name: 'BSc Psychology', level: 'undergraduate', field: 'Psychology', duration: '3 years', tuitionFee: 15000 },
      // BPP (idx 5)
      { universityIdx: 5, name: 'LLB Law', level: 'undergraduate', field: 'Law', duration: '3 years', tuitionFee: 13000 },
      { universityIdx: 5, name: 'MSc Accounting & Finance', level: 'postgraduate', field: 'Finance', duration: '1 year', tuitionFee: 15000 },
      { universityIdx: 5, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '1 year', tuitionFee: 16000 },
      // Ulster (idx 6)
      { universityIdx: 6, name: 'BSc Nursing', level: 'undergraduate', field: 'Health', duration: '3 years', tuitionFee: 15500 },
      { universityIdx: 6, name: 'MSc Computer Science', level: 'postgraduate', field: 'Computer Science', duration: '1 year', tuitionFee: 17000 },
      { universityIdx: 6, name: 'BEng Engineering', level: 'undergraduate', field: 'Engineering', duration: '4 years', tuitionFee: 15500 },
      // Portsmouth (idx 7)
      { universityIdx: 7, name: 'MSc Maritime Engineering', level: 'postgraduate', field: 'Engineering', duration: '1 year', tuitionFee: 18000 },
      { universityIdx: 7, name: 'BSc Cyber Security', level: 'undergraduate', field: 'IT', duration: '3 years', tuitionFee: 16000 },
      { universityIdx: 7, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '1 year', tuitionFee: 19000 },
      // Oxford (idx 8)
      { universityIdx: 8, name: 'MBBS Medicine', level: 'undergraduate', field: 'Medicine', duration: '6 years', tuitionFee: 45000 },
      { universityIdx: 8, name: 'BA Philosophy, Politics and Economics', level: 'undergraduate', field: 'Social Science', duration: '3 years', tuitionFee: 33000 },
      // Imperial (idx 9)
      { universityIdx: 9, name: 'MEng Computer Science', level: 'undergraduate', field: 'Computer Science', duration: '4 years', tuitionFee: 38000 },
      { universityIdx: 9, name: 'MSc Finance', level: 'postgraduate', field: 'Finance', duration: '1 year', tuitionFee: 42000 },
      // UCL (idx 10)
      { universityIdx: 10, name: 'BSc Architecture', level: 'undergraduate', field: 'Architecture', duration: '3 years', tuitionFee: 29000 },
      { universityIdx: 10, name: 'MSc Data Science', level: 'postgraduate', field: 'Data Science', duration: '1 year', tuitionFee: 33000 },
      // Manchester (idx 11)
      { universityIdx: 11, name: 'MSc Computer Science', level: 'postgraduate', field: 'Computer Science', duration: '1 year', tuitionFee: 29000 },
      { universityIdx: 11, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '1.5 years', tuitionFee: 35000 },
      // Toronto (idx 12)
      { universityIdx: 12, name: 'MSc Computer Science', level: 'postgraduate', field: 'Computer Science', duration: '2 years', tuitionFee: 32000 },
      { universityIdx: 12, name: 'BSc Engineering', level: 'undergraduate', field: 'Engineering', duration: '4 years', tuitionFee: 30000 },
      // Melbourne (idx 13)
      { universityIdx: 13, name: 'MBBS Medicine', level: 'undergraduate', field: 'Medicine', duration: '6 years', tuitionFee: 40000 },
      { universityIdx: 13, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '2 years', tuitionFee: 45000 },
      // Harvard (idx 14)
      { universityIdx: 14, name: 'MBA', level: 'postgraduate', field: 'Business', duration: '2 years', tuitionFee: 73000 },
      { universityIdx: 14, name: 'LLM International Law', level: 'postgraduate', field: 'Law', duration: '1 year', tuitionFee: 68000 },
      // Sydney (idx 15)
      { universityIdx: 15, name: 'BSc Nursing', level: 'undergraduate', field: 'Health', duration: '3 years', tuitionFee: 33000 },
      { universityIdx: 15, name: 'MSc Engineering', level: 'postgraduate', field: 'Engineering', duration: '1.5 years', tuitionFee: 36000 },
      // McGill (idx 16)
      { universityIdx: 16, name: 'MSc Computer Science', level: 'postgraduate', field: 'Computer Science', duration: '2 years', tuitionFee: 28000 },
      { universityIdx: 16, name: 'LLB Law', level: 'undergraduate', field: 'Law', duration: '3 years', tuitionFee: 26000 },
      // Leeds (idx 17)
      { universityIdx: 17, name: 'MSc Artificial Intelligence', level: 'postgraduate', field: 'Computer Science', duration: '1 year', tuitionFee: 27000 },
      { universityIdx: 17, name: 'MSc Civil Engineering', level: 'postgraduate', field: 'Engineering', duration: '1 year', tuitionFee: 26000 },
      // Birmingham (idx 18)
      { universityIdx: 18, name: 'MSc Cyber Security', level: 'postgraduate', field: 'IT', duration: '1 year', tuitionFee: 26500 },
      { universityIdx: 18, name: 'MSc Public Health', level: 'postgraduate', field: 'Health', duration: '1 year', tuitionFee: 23000 },
      // Sheffield (idx 19)
      { universityIdx: 19, name: 'MSc Information Systems', level: 'postgraduate', field: 'IT', duration: '1 year', tuitionFee: 25500 },
      { universityIdx: 19, name: 'MEng Mechanical Engineering', level: 'undergraduate', field: 'Engineering', duration: '4 years', tuitionFee: 25000 },
    ];

    for (const cd of courseDataList) {
      await db.course.create({
        data: {
          universityId: universityIds[cd.universityIdx],
          name: cd.name,
          level: cd.level,
          field: cd.field,
          duration: cd.duration,
          tuitionFee: cd.tuitionFee,
          scholarshipAvailable: cd.tuitionFee > 25000,
          status: 'active',
        }
      });
    }
    results.courses = courseDataList.length;

    // ============================================================
    // 13. CREATE SCHOLARSHIPS
    // ============================================================
    const scholarshipData = [
      { universityIdx: 0, name: 'Manchester Excellence Scholarship', amount: '£5,000', type: 'merit', description: 'For outstanding international students' },
      { universityIdx: 1, name: 'Leeds International Research Scholarship', amount: 'Full Tuition', type: 'full', description: 'Full tuition for research students' },
      { universityIdx: 2, name: 'Birmingham Global Scholarship', amount: '£3,000', type: 'partial', description: 'Partial scholarship for global students' },
      { universityIdx: 4, name: 'Bristol Think Big Scholarship', amount: '£10,000', type: 'merit', description: 'For students with academic excellence' },
      { universityIdx: 5, name: 'Nottingham Developing Solutions Scholarship', amount: 'Full Tuition', type: 'full', description: 'For students from developing countries' },
      { universityIdx: 7, name: 'Glasgow International Leadership Scholarship', amount: '£5,000', type: 'merit', description: 'Leadership potential scholarship' },
    ];

    for (const sd of scholarshipData) {
      await db.scholarship.create({
        data: {
          universityId: universityIds[sd.universityIdx],
          name: sd.name,
          amount: sd.amount,
          type: sd.type,
          description: sd.description,
          country: 'United Kingdom',
          status: 'active',
        }
      });
    }
    results.scholarships = scholarshipData.length;

    // ============================================================
    // 14. CREATE LEADS
    // ============================================================
    const leadNames = [
      { firstName: 'Ashraf', lastName: 'Hossain' },
      { firstName: 'Tania', lastName: 'Islam' },
      { firstName: 'Rajib', lastName: 'Mia' },
      { firstName: 'Shimu', lastName: 'Akter' },
      { firstName: 'Parvez', lastName: 'Ahmed' },
      { firstName: 'Dipti', lastName: 'Rani' },
      { firstName: 'Masum', lastName: 'Bhuiyan' },
      { firstName: 'Laboni', lastName: 'Das' },
      { firstName: 'Shuvo', lastName: 'Kumar' },
      { firstName: 'Rupa', lastName: 'Begum' },
      { firstName: 'Taposh', lastName: 'Sarkar' },
      { firstName: 'Mitu', lastName: 'Khatun' },
      { firstName: 'Sanjoy', lastName: 'Barman' },
      { firstName: 'Nila', lastName: 'Rani' },
      { firstName: 'Habib', lastName: 'Molla' },
    ];

    const leadSources = ['website', 'facebook', 'instagram', 'referral', 'partner', 'walk_in', 'whatsapp', 'call'];
    const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost', 'recycled'];
    const temperatures = ['hot', 'warm', 'cold'];

    for (let i = 0; i < leadNames.length; i++) {
      const l = leadNames[i];
      await db.lead.create({
        data: {
          leadId: `LEAD-2026${(i + 1).toString().padStart(4, '0')}`,
          firstName: l.firstName,
          lastName: l.lastName,
          email: `${l.firstName.toLowerCase()}.${l.lastName.toLowerCase()}@gmail.com`,
          phone: `+88018${(50000000 + i).toString()}`,
          source: leadSources[i % leadSources.length],
          partnerId: i % 3 === 0 ? partnerIds[i % partnerIds.length] : null,
          preferredCountry: 'United Kingdom',
          preferredCourse: courses[i % courses.length],
          preferredIntake: intakes[i % intakes.length],
          highestEducation: educations[i % educations.length],
          status: leadStatuses[i % leadStatuses.length],
          temperature: temperatures[i % temperatures.length],
          assignedTo: i < 10 ? employeeIds[i % 5 + 1] : null,
          lastContactedAt: i < 8 ? new Date(Date.now() - i * 86400000) : null,
          nextFollowUp: i < 5 ? new Date(Date.now() + (i + 1) * 86400000) : null,
        }
      });
    }
    results.leads = leadNames.length;

    // ============================================================
    // 15. CREATE APPLICATIONS
    // ============================================================
    const applicationStatuses = ['draft', 'submitted', 'under_review', 'conditional_offer', 'unconditional_offer', 'deposit_paid', 'cas_received', 'visa_applied', 'visa_approved', 'enrolled', 'rejected'];

    for (let i = 0; i < 15; i++) {
      const studentIdx = i % studentIds.length;
      const uniIdx = i % universityIds.length;
      const status = applicationStatuses[i % applicationStatuses.length];

      await db.application.create({
        data: {
          applicationId: `APP-2026${(i + 1).toString().padStart(4, '0')}`,
          studentId: studentIds[studentIdx],
          universityId: universityIds[uniIdx],
          partnerId: i % 3 === 0 ? partnerIds[i % partnerIds.length] : null,
          counselorId: employeeIds[i % 5 + 1],
          source: i % 3 === 0 ? 'PARTNER_INBOUND' : 'DIRECT',
          intake: intakes[i % intakes.length],
          status,
          notes: `Application for ${courses[i % courses.length]}`,
        }
      });
    }
    results.applications = 15;

    // ============================================================
    // 16. CREATE COMMISSIONS
    // ============================================================
    const commissionStages = ['application_submitted', 'offer_received', 'deposit_paid', 'cas_received', 'visa_approved', 'enrollment_confirmed'];
    const commissionStatuses = ['not_requested', 'eligible', 'requested', 'under_review', 'approved', 'paid'];

    for (let i = 0; i < 8; i++) {
      await db.commission.create({
        data: {
          commissionId: `COM-2026${(i + 1).toString().padStart(4, '0')}`,
          partnerId: partnerIds[i % partnerIds.length],
          studentId: studentIds[i % studentIds.length],
          universityId: universityIds[i % universityIds.length],
          amount: 500 + i * 200,
          currency: 'GBP',
          triggerStage: commissionStages[i % commissionStages.length],
          status: commissionStatuses[i % commissionStatuses.length],
          requestedAt: i % 3 === 0 ? new Date() : null,
        }
      });
    }
    results.commissions = 8;

    // ============================================================
    // 17. CREATE WHATSAPP NUMBER POOL
    // ============================================================
    for (let i = 0; i < 20; i++) {
      const num = 1805020100 + i;
      const categories = ['main', 'counselor', 'marketing', 'follow_up', 'visa_support', 'partner_support', 'finance'];
      await db.whatsappNumberPool.create({
        data: {
          phoneNumber: `0${num.toString()}`,
          category: categories[i % categories.length],
          assignedTo: i < 5 ? employeeIds[i + 1] : null,
          status: 'active',
        }
      });
    }
    results.whatsappNumbers = 20;

    // ============================================================
    // 18. CREATE SOCIAL POST SIZES
    // ============================================================
    const socialSizes = [
      { platform: 'facebook', type: 'feed_square', width: 1080, height: 1080, label: 'Facebook Feed (Square)' },
      { platform: 'facebook', type: 'feed_portrait', width: 1080, height: 1350, label: 'Facebook Feed (Portrait)' },
      { platform: 'facebook', type: 'feed_landscape', width: 1200, height: 630, label: 'Facebook Feed (Landscape)' },
      { platform: 'facebook', type: 'reel', width: 1080, height: 1920, label: 'Facebook Reel' },
      { platform: 'facebook', type: 'story', width: 1080, height: 1920, label: 'Facebook Story' },
      { platform: 'instagram', type: 'feed_square', width: 1080, height: 1080, label: 'Instagram Feed (Square)' },
      { platform: 'instagram', type: 'feed_portrait', width: 1080, height: 1350, label: 'Instagram Feed (Portrait)' },
      { platform: 'instagram', type: 'story', width: 1080, height: 1920, label: 'Instagram Story' },
      { platform: 'instagram', type: 'reel', width: 1080, height: 1920, label: 'Instagram Reel' },
      { platform: 'tiktok', type: 'video', width: 1080, height: 1920, label: 'TikTok Video' },
      { platform: 'youtube', type: 'shorts', width: 1080, height: 1920, label: 'YouTube Shorts' },
      { platform: 'youtube', type: 'thumbnail', width: 1280, height: 720, label: 'YouTube Thumbnail' },
      { platform: 'youtube', type: 'channel_art', width: 2560, height: 1440, label: 'YouTube Channel Art' },
      { platform: 'linkedin', type: 'feed', width: 1200, height: 627, label: 'LinkedIn Feed' },
      { platform: 'linkedin', type: 'carousel', width: 1080, height: 1080, label: 'LinkedIn Carousel' },
      { platform: 'whatsapp', type: 'status', width: 1080, height: 1920, label: 'WhatsApp Status' },
    ];

    for (const ss of socialSizes) {
      await db.socialPostSize.create({ data: ss });
    }
    results.socialSizes = socialSizes.length;

    // ============================================================
    // 19. CREATE BLOG POSTS
    // ============================================================
    const blogPosts = [
      { title: 'Complete Guide to Studying in the UK for Bangladeshi Students', slug: 'guide-studying-uk-bangladeshi-students', category: 'Study Abroad', excerpt: 'Everything you need to know about studying in the UK, from choosing a university to visa application.', content: '<h2>Why Study in the UK?</h2><p>The UK is one of the most popular destinations for international students...</p>' },
      { title: 'Top 10 Scholarships for International Students in 2026', slug: 'top-scholarships-international-students-2026', category: 'Scholarships', excerpt: 'Discover the best scholarship opportunities available for international students.', content: '<h2>Top Scholarships</h2><p>Funding your education abroad can be challenging...</p>' },
      { title: 'UK Student Visa Application: Step-by-Step Guide', slug: 'uk-student-visa-step-by-step', category: 'Visa Guide', excerpt: 'A comprehensive guide to the UK student visa application process.', content: '<h2>UK Student Route Visa</h2><p>The UK Student Route (formerly Tier 4) visa...</p>' },
      { title: 'IELTS vs PTE: Which English Test Should You Take?', slug: 'ielts-vs-pte-which-test', category: 'English Tests', excerpt: 'Comparing IELTS and PTE to help you choose the right English proficiency test.', content: '<h2>IELTS vs PTE</h2><p>When applying to UK universities, you need to prove your English proficiency...</p>' },
      { title: 'How to Write a Winning Statement of Purpose', slug: 'winning-statement-of-purpose', category: 'Application Tips', excerpt: 'Tips and tricks for crafting a compelling SOP for your university application.', content: '<h2>What is an SOP?</h2><p>A Statement of Purpose is your chance to stand out...</p>' },
      { title: 'Living in Manchester: A Student Guide', slug: 'living-manchester-student-guide', category: 'Student Life', excerpt: 'Everything you need to know about living and studying in Manchester.', content: '<h2>Manchester for Students</h2><p>Manchester is a vibrant city with a large student population...</p>' },
    ];

    for (const bp of blogPosts) {
      await db.blogPost.create({
        data: {
          ...bp,
          status: 'published',
          publishedAt: new Date(Date.now() - Math.random() * 30 * 86400000),
          tags: 'uk,study abroad,education',
        }
      });
    }
    results.blogPosts = blogPosts.length;

    // ============================================================
    // 20. CREATE DEFAULT SETTINGS
    // ============================================================
    const defaultSettings = [
      { key: 'company_name', value: 'ALO Education', group: 'general' },
      { key: 'company_email', value: 'info@aloeducation.com', group: 'general' },
      { key: 'company_phone', value: '+880-2-8888888', group: 'general' },
      { key: 'company_website', value: 'https://aloeducation.com', group: 'general' },
      { key: 'company_address', value: 'Gulshan-2, Dhaka, Bangladesh', group: 'general' },
      { key: 'currency', value: 'GBP', group: 'general' },
      { key: 'timezone', value: 'Asia/Dhaka', group: 'general' },
      { key: 'date_format', value: 'DD/MM/YYYY', group: 'general' },
      { key: 'academic_year', value: '2026-2027', group: 'academic' },
      { key: 'default_intake', value: 'September', group: 'academic' },
      { key: 'working_hours_start', value: '09:00', group: 'attendance' },
      { key: 'working_hours_end', value: '18:00', group: 'attendance' },
      { key: 'late_threshold_minutes', value: '15', group: 'attendance' },
      { key: 'whatsapp_api_url', value: '', group: 'whatsapp' },
      { key: 'whatsapp_api_key', value: '', group: 'whatsapp' },
      { key: 'default_commission_rate', value: '10', group: 'finance' },
      { key: 'tax_rate', value: '0', group: 'finance' },
      { key: 'smtp_host', value: '', group: 'email' },
      { key: 'smtp_port', value: '587', group: 'email' },
      { key: 'smtp_user', value: '', group: 'email' },
      { key: 'openai_api_key', value: '', group: 'ai' },
      { key: 'ai_model', value: 'gpt-4', group: 'ai' },
    ];

    for (const s of defaultSettings) {
      await db.setting.create({ data: s });
    }
    results.settings = defaultSettings.length;

    // ============================================================
    // 21. CREATE MARKETING CONTENT
    // ============================================================
    const marketingContent = [
      { contentType: 'facebook_post', platform: 'facebook', title: 'Study in the UK - September 2026 Intake', caption: '🇬🇧 Start your UK study journey with ALO Education! Applications are now open for September 2026 intake. #StudyInUK #ALOEducation', status: 'published' },
      { contentType: 'instagram_post', platform: 'instagram', title: 'Scholarship Alert!', caption: '🎓 Up to £10,000 scholarships available at top UK universities! DM us to learn more. #Scholarship #StudyAbroad', status: 'published' },
      { contentType: 'instagram_story', platform: 'instagram', title: 'Student Success Story', caption: 'From Dhaka to Manchester! 🎉', status: 'draft' },
      { contentType: 'instagram_reel', platform: 'instagram', title: 'Day in the Life - UK Student', caption: 'A day in the life of a Bangladeshi student studying in the UK 🇬🇧', videoScript: 'Opening shot: University campus... Cut to: Library study session... Cut to: Student talking about their experience...', status: 'ai_generated' },
      { contentType: 'tiktok_video', platform: 'tiktok', title: '5 Tips for UK Visa Interview', caption: 'Ace your UK student visa interview with these 5 tips! 🎯 #UKVisa #StudyTips', videoScript: 'Tip 1: Know your course details. Tip 2: Show financial evidence. Tip 3: Be confident...', status: 'under_review' },
      { contentType: 'linkedin_post', platform: 'linkedin', title: 'Partnership Opportunities', caption: 'ALO Education is expanding its partner network across Bangladesh. Join us in helping students achieve their dreams of studying abroad.', status: 'approved' },
      { contentType: 'whatsapp_broadcast', platform: 'whatsapp', title: 'September Intake Reminder', caption: 'Hi {name}, applications for September 2026 intake at top UK universities are now open! Contact us to start your application.', status: 'draft' },
      { contentType: 'blog_article', title: 'Why Choose ALO Education', bodyContent: 'With over 5 years of experience in education consultancy, ALO Education has helped thousands of students achieve their study abroad dreams...', status: 'draft' },
    ];

    for (const mc of marketingContent) {
      await db.marketingContent.create({ data: mc });
    }
    results.marketingContent = marketingContent.length;

    // ============================================================
    // 22. CREATE AI AGENTS
    // ============================================================
    const aiAgents = [
      { name: 'CRM Router', agentType: 'crm_router', description: 'Routes queries to appropriate departments and agents', prompt: 'You are a CRM router for ALO Education. Analyze the query and route it to the appropriate department or agent.' },
      { name: 'Lead Qualifier', agentType: 'lead_qualifier', description: 'Qualifies leads based on criteria', prompt: 'You are a lead qualification expert for ALO Education. Assess leads based on their profile, test scores, financial capability, and academic background.' },
      { name: 'Course Recommender', agentType: 'course_recommender', description: 'Recommends courses based on student profile', prompt: 'You are a course recommendation expert for ALO Education. Recommend courses based on student profile, preferences, and academic background.' },
      { name: 'Visa Checker', agentType: 'visa_checker', description: 'Checks visa requirements and provides guidance', prompt: 'You are a UK visa expert for ALO Education. Provide guidance on UK student visa requirements, process, and timelines.' },
      { name: 'UKVI Practice', agentType: 'ukvi_practice', description: 'Helps students practice for UKVI interviews', prompt: 'You are a UKVI interview practice coach. Ask realistic UKVI interview questions and provide feedback on answers.' },
      { name: 'SOP Assistant', agentType: 'sop_assistant', description: 'Helps write Statements of Purpose', prompt: 'You are a Statement of Purpose writing assistant for ALO Education. Help students craft compelling SOPs for their university applications.' },
      { name: 'Email Writer', agentType: 'email_writer', description: 'Drafts professional emails', prompt: 'You are a professional email writer for ALO Education. Draft clear, professional emails for various purposes.' },
      { name: 'WhatsApp Writer', agentType: 'whatsapp_writer', description: 'Creates WhatsApp messages', prompt: 'You are a WhatsApp message writer for ALO Education. Create engaging yet professional WhatsApp messages.' },
      { name: 'Blog Writer', agentType: 'blog_writer', description: 'Writes blog articles', prompt: 'You are a blog content writer for ALO Education. Write engaging, SEO-optimized blog articles about studying abroad.' },
      { name: 'Social Media Writer', agentType: 'social_writer', description: 'Creates social media content', prompt: 'You are a social media content creator for ALO Education. Create engaging social media posts for various platforms.' },
      { name: 'Image Prompter', agentType: 'image_prompter', description: 'Generates image prompts', prompt: 'You generate detailed image prompts for ALO Education marketing materials.' },
      { name: 'Video Scripter', agentType: 'video_scripter', description: 'Writes video scripts', prompt: 'You are a video script writer for ALO Education. Write engaging scripts for promotional videos.' },
      { name: 'Reel Scripter', agentType: 'reel_scripter', description: 'Creates short reel scripts', prompt: 'You are a short-form video script writer for ALO Education. Create engaging scripts for Instagram/Facebook reels.' },
      { name: 'Campaign Planner', agentType: 'campaign_planner', description: 'Plans marketing campaigns', prompt: 'You are a campaign planner for ALO Education. Plan comprehensive marketing campaigns.' },
      { name: 'Student Analyzer', agentType: 'student_analyzer', description: 'Analyzes student profiles', prompt: 'You are a student profile analyzer for ALO Education. Analyze student profiles and provide insights.' },
      { name: 'Commission Analyzer', agentType: 'commission_analyzer', description: 'Analyzes commission data', prompt: 'You are a commission data analyzer for ALO Education. Analyze commission patterns and provide insights.' },
      { name: 'Finance Summarizer', agentType: 'finance_summarizer', description: 'Summarizes financial data', prompt: 'You are a finance summarizer for ALO Education. Provide clear summaries of financial data.' },
      { name: 'Report Generator', agentType: 'report_generator', description: 'Generates reports', prompt: 'You are a report generator for ALO Education. Generate comprehensive reports based on data.' },
      { name: 'Doc Finder', agentType: 'doc_finder', description: 'Finds relevant documents', prompt: 'You are a document finder for ALO Education. Help locate relevant documents and information.' },
    ];

    for (const aa of aiAgents) {
      await db.aiAgent.create({ data: { ...aa, model: 'gpt-4', status: 'active' } });
    }
    results.aiAgents = aiAgents.length;

    // ============================================================
    // 23. CREATE SAMPLE PAYMENTS
    // ============================================================
    for (let i = 0; i < 10; i++) {
      await db.payment.create({
        data: {
          studentId: studentIds[i % studentIds.length],
          amount: 1000 + i * 500,
          currency: 'GBP',
          paymentMethod: ['bank_transfer', 'card', 'cash', 'online'][i % 4],
          transactionRef: `TXN-${Date.now()}-${i}`,
          status: 'completed',
          paidAt: new Date(Date.now() - i * 7 * 86400000),
        }
      });
    }
    results.payments = 10;

    // ============================================================
    // 24. CREATE SAMPLE ATTENDANCE
    // ============================================================
    for (let day = 0; day < 5; day++) {
      for (let e = 0; e < Math.min(5, employeeIds.length); e++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);

        const clockIn = new Date(date);
        clockIn.setHours(9, Math.floor(Math.random() * 30), 0);
        const clockOut = new Date(date);
        clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

        await db.attendance.create({
          data: {
            employeeId: employeeIds[e],
            date,
            clockIn,
            clockOut,
            totalHours: Math.round(totalHours * 100) / 100,
            status: clockIn.getHours() >= 10 ? 'late' : 'present',
            source: 'self',
          }
        });
      }
    }
    results.attendance = 25;

    // ============================================================
    // 25. CREATE LEAVE TYPES
    // ============================================================
    const leaveTypes = [
      { name: 'Casual Leave', code: 'CL', daysAllowed: 12, isPaid: true },
      { name: 'Sick Leave', code: 'SL', daysAllowed: 10, isPaid: true },
      { name: 'Annual Leave', code: 'AL', daysAllowed: 15, isPaid: true },
      { name: 'Maternity Leave', code: 'ML', daysAllowed: 120, isPaid: true },
      { name: 'Paternity Leave', code: 'PL', daysAllowed: 10, isPaid: true },
      { name: 'Compensatory Off', code: 'CO', daysAllowed: 0, isPaid: true },
    ];

    for (const lt of leaveTypes) {
      await db.leaveType.create({ data: lt });
    }
    results.leaveTypes = leaveTypes.length;

    // ============================================================
    // 26. CREATE LEAD SOURCES
    // ============================================================
    const leadSourcesData = [
      { name: 'Website', type: 'online' },
      { name: 'Facebook', type: 'online' },
      { name: 'Instagram', type: 'online' },
      { name: 'Google Ads', type: 'online' },
      { name: 'WhatsApp', type: 'online' },
      { name: 'Walk-in', type: 'offline' },
      { name: 'Phone Call', type: 'offline' },
      { name: 'Education Fair', type: 'offline' },
      { name: 'Referral', type: 'referral' },
      { name: 'Partner Referral', type: 'partner' },
    ];

    for (const ls of leadSourcesData) {
      await db.leadSource.create({ data: ls });
    }
    results.leadSources = leadSourcesData.length;

    // ============================================================
    // 27. CREATE TESTIMONIALS
    // ============================================================
    const testimonials = [
      { studentName: 'Tanvir Ahmed', university: 'University of Manchester', country: 'United Kingdom', quote: 'ALO Education made my dream of studying in the UK come true. Their guidance was invaluable!', rating: 5 },
      { studentName: 'Sumaiya Khan', university: 'University of Leeds', country: 'United Kingdom', quote: 'From application to visa, ALO Education was with me every step of the way. Highly recommended!', rating: 5 },
      { studentName: 'Rifat Hossain', university: 'University of Birmingham', country: 'United Kingdom', quote: 'The counselors at ALO Education are extremely knowledgeable and supportive. Thank you!', rating: 4 },
      { studentName: 'Naima Akter', university: 'University of Sheffield', country: 'United Kingdom', quote: 'I got a scholarship thanks to ALO Education\'s guidance. Forever grateful!', rating: 5 },
    ];

    for (const t of testimonials) {
      await db.testimonial.create({ data: t });
    }
    results.testimonials = testimonials.length;

    // ============================================================
    // 28. CREATE WHATSAPP TEMPLATES
    // ============================================================
    const whatsappTemplates = [
      { name: 'Welcome Message', category: 'utility', body: 'Hello {{1}}, welcome to ALO Education! We are here to help you with your study abroad journey. How can we assist you today?', language: 'en' },
      { name: 'Application Update', category: 'utility', body: 'Hi {{1}}, your application to {{2}} has been updated. Current status: {{3}}. Please check your portal for details.', language: 'en' },
      { name: 'Appointment Reminder', category: 'utility', body: 'Hi {{1}}, this is a reminder about your appointment on {{2}} at {{3}}. Please confirm your attendance.', language: 'en' },
      { name: 'Document Request', category: 'utility', body: 'Hello {{1}}, we need the following documents for your application: {{2}}. Please upload them at your earliest convenience.', language: 'en' },
      { name: 'Visa Update', category: 'utility', body: 'Hi {{1}}, your visa application status has been updated: {{2}}. Contact us if you have any questions.', language: 'en' },
    ];

    for (const wt of whatsappTemplates) {
      await db.whatsappTemplate.create({ data: wt });
    }
    results.whatsappTemplates = whatsappTemplates.length;

    // ============================================================
    // 29. CREATE FAQS
    // ============================================================
    const faqs = [
      { question: 'How do I apply to a UK university?', answer: 'You can apply through UCAS for undergraduate programs or directly to the university for postgraduate programs. Our counselors will guide you through the entire process.', category: 'Applications', orderNum: 1 },
      { question: 'What are the English language requirements?', answer: 'Most UK universities require IELTS 6.0-7.0, PTE 50-65, or equivalent. Requirements vary by course and university.', category: 'Requirements', orderNum: 2 },
      { question: 'How long does the visa process take?', answer: 'The standard UK student visa processing time is 3-6 weeks. Priority service is available for faster processing.', category: 'Visa', orderNum: 3 },
      { question: 'What scholarships are available?', answer: 'There are various scholarships available including university-specific, government, and external scholarships. Our team will help you find the best options.', category: 'Scholarships', orderNum: 4 },
      { question: 'How much does it cost to study in the UK?', answer: 'Tuition fees range from £10,000 to £38,000 per year depending on the course and university. Living costs are approximately £1,000-£1,500 per month.', category: 'Finance', orderNum: 5 },
    ];

    for (const f of faqs) {
      await db.faq.create({ data: f });
    }
    results.faqs = faqs.length;

    // ============================================================
    // 30. CREATE SOME VISA FILES
    // ============================================================
    for (let i = 0; i < 5; i++) {
      const stages = ['document_collection', 'document_review', 'cas_received', 'visa_file_preparing', 'visa_submitted'];
      await db.visaFile.create({
        data: {
          studentId: studentIds[i],
          stage: stages[i],
          assignedTo: employeeIds[5], // Visa officer
          status: 'active',
        }
      });
    }
    results.visaFiles = 5;

    // ============================================================
    // 31. CREATE ACTIVITY LOGS
    // ============================================================
    const activities = [
      { action: 'student_created', description: 'New student Tanvir Ahmed registered', module: 'students' },
      { action: 'application_submitted', description: 'Application submitted to University of Manchester', module: 'applications' },
      { action: 'lead_assigned', description: 'Lead assigned to counselor Fatema Begum', module: 'leads' },
      { action: 'commission_approved', description: 'Commission of £500 approved for EduBridge Bangladesh', module: 'commissions' },
      { action: 'visa_file_created', description: 'Visa file created for student Rifat Hossain', module: 'visa' },
      { action: 'payment_received', description: 'Payment of £1,500 received from Sumaiya Khan', module: 'finance' },
      { action: 'blog_published', description: 'Blog post "Complete Guide to Studying in the UK" published', module: 'blog' },
      { action: 'employee_clocked_in', description: 'Rahim Ahmed clocked in at 9:05 AM', module: 'attendance' },
    ];

    for (let i = 0; i < activities.length; i++) {
      await db.activityLog.create({
        data: {
          ...activities[i],
          userId: i === 0 ? adminUser.id : null,
          createdAt: new Date(Date.now() - i * 3600000),
        }
      });
    }
    results.activityLogs = activities.length;

    return NextResponse.json({
      message: 'Database seeded successfully!',
      results,
      adminCredentials: {
        email: 'admin@aloeducation.com',
        password: 'ChangeMe@12345',
      },
      summary: {
        totalUsers: await db.user.count(),
        totalStudents: await db.student.count(),
        totalPartners: await db.partner.count(),
        totalEmployees: await db.employee.count(),
        totalLeads: await db.lead.count(),
        totalApplications: await db.application.count(),
        totalUniversities: await db.university.count(),
        totalCourses: await db.course.count(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
