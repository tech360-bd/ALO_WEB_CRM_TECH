-- ============================================================
-- ALO Education CRM — Seed Data
-- Run AFTER schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- Clean previous seed data (idempotent) ----------------------
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE user_permissions;
TRUNCATE TABLE permissions;
TRUNCATE TABLE roles;
TRUNCATE TABLE settings;
TRUNCATE TABLE countries;
TRUNCATE TABLE universities;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. Roles
-- ============================================================
INSERT INTO roles (id, name, display_name, description) VALUES
(1, 'super_admin',   'Super Admin',    'Full access to every module and setting'),
(2, 'admin',         'Admin',          'Full access except critical system settings'),
(3, 'manager',       'Manager',        'Manage operations across modules'),
(4, 'counselor',     'Counselor',      'Manage leads, students, applications and documents'),
(5, 'marketing',    'Marketing',      'Manage campaigns, leads and content'),
(6, 'finance',       'Finance',        'Manage invoices, payments and commissions'),
(7, 'documentation', 'Documentation',  'Manage documents and application files'),
(8, 'agent',         'Agent',          'External agent — limited access to own referrals'),
(9, 'student',       'Student',         'Student portal — view own records');

-- ============================================================
-- 2. Permissions
-- ============================================================
INSERT INTO permissions (id, name, display_name, module) VALUES
-- Students
(101, 'students.view',   'View Students',      'students'),
(102, 'students.create', 'Create Students',    'students'),
(103, 'students.edit',   'Edit Students',      'students'),
(104, 'students.delete', 'Delete Students',   'students'),
(105, 'students.export', 'Export Students',    'students'),
-- Leads
(111, 'leads.view',   'View Leads',     'leads'),
(112, 'leads.create', 'Create Leads',   'leads'),
(113, 'leads.edit',   'Edit Leads',     'leads'),
(114, 'leads.delete', 'Delete Leads',   'leads'),
(115, 'leads.assign', 'Assign Leads',   'leads'),
(116, 'leads.export', 'Export Leads',   'leads'),
-- Applications
(121, 'applications.view',   'View Applications',     'applications'),
(122, 'applications.create', 'Create Applications',   'applications'),
(123, 'applications.edit',   'Edit Applications',     'applications'),
(124, 'applications.delete', 'Delete Applications',   'applications'),
-- Universities
(131, 'universities.view',   'View Universities',     'universities'),
(132, 'universities.create', 'Create Universities',   'universities'),
(133, 'universities.edit',   'Edit Universities',     'universities'),
(134, 'universities.delete', 'Delete Universities',   'universities'),
-- Courses
(141, 'courses.view',   'View Courses',     'courses'),
(142, 'courses.create', 'Create Courses',   'courses'),
(143, 'courses.edit',   'Edit Courses',     'courses'),
(144, 'courses.delete', 'Delete Courses',   'courses'),
-- Documents
(151, 'documents.view',    'View Documents',     'documents'),
(152, 'documents.upload',  'Upload Documents',   'documents'),
(153, 'documents.verify',  'Verify Documents',   'documents'),
(154, 'documents.delete',  'Delete Documents',   'documents'),
-- Tasks
(161, 'tasks.view',   'View Tasks',     'tasks'),
(162, 'tasks.create', 'Create Tasks',   'tasks'),
(163, 'tasks.edit',   'Edit Tasks',     'tasks'),
(164, 'tasks.delete', 'Delete Tasks',   'tasks'),
-- Communications
(171, 'communications.view',    'View Communications',     'communications'),
(172, 'communications.create',  'Send Communications',     'communications'),
(173, 'communications.delete', 'Delete Communications',   'communications'),
-- Marketing
(181, 'marketing.view',     'View Marketing',           'marketing'),
(182, 'marketing.create',   'Create Campaigns',         'marketing'),
(183, 'marketing.edit',     'Edit Campaigns',           'marketing'),
(184, 'marketing.delete',   'Delete Campaigns',         'marketing'),
(185, 'marketing.approve',  'Approve Marketing Content', 'marketing'),
-- Finance
(191, 'finance.view',    'View Finance',           'finance'),
(192, 'finance.create',  'Create Invoices/Payments','finance'),
(193, 'finance.edit',    'Edit Invoices/Payments',  'finance'),
(194, 'finance.delete',  'Delete Invoices/Payments','finance'),
(195, 'commissions.manage', 'Manage Commissions',   'finance'),
-- Reports
(201, 'reports.view',   'View Reports',     'reports'),
(202, 'reports.export', 'Export Reports',   'reports'),
-- Users
(211, 'users.view',   'View Users',     'users'),
(212, 'users.create', 'Create Users',   'users'),
(213, 'users.edit',   'Edit Users',     'users'),
(214, 'users.delete', 'Delete Users',   'users'),
-- Settings
(221, 'settings.view', 'View Settings', 'settings'),
(222, 'settings.edit', 'Edit Settings', 'settings'),
-- Audit
(231, 'audit.view', 'View Audit Logs', 'audit'),
-- Branches & Departments
(241, 'branches.view',   'View Branches',     'branches'),
(242, 'branches.create', 'Create Branches',   'branches'),
(243, 'branches.edit',   'Edit Branches',     'branches'),
(244, 'branches.delete', 'Delete Branches',   'branches'),
(251, 'departments.view',   'View Departments',     'departments'),
(252, 'departments.create', 'Create Departments',   'departments'),
(253, 'departments.edit',   'Edit Departments',     'departments'),
(254, 'departments.delete', 'Delete Departments',   'departments'),
-- Activities & Notifications
(261, 'activities.view',       'View Activity Feed',  'activities'),
(262, 'notifications.view',    'View Notifications',  'notifications'),
(263, 'notifications.manage',  'Manage Notifications','notifications'),
-- Dashboard
(271, 'dashboard.view', 'View Dashboard', 'dashboard');

-- ============================================================
-- 3. Role-Permission mappings
-- ============================================================

-- Super Admin (1) = ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin (2) = all except settings.edit (still can view)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name <> 'settings.edit';

-- Manager (3)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
    'dashboard.view',
    'students.view','students.create','students.edit','students.export',
    'leads.view','leads.create','leads.edit','leads.assign','leads.export',
    'applications.view','applications.create','applications.edit',
    'universities.view',
    'courses.view',
    'documents.view','documents.upload','documents.verify',
    'tasks.view','tasks.create','tasks.edit','tasks.delete',
    'communications.view','communications.create',
    'marketing.view','marketing.create','marketing.edit',
    'finance.view',
    'reports.view','reports.export',
    'users.view',
    'branches.view','departments.view',
    'activities.view','notifications.view',
    'audit.view'
);

-- Counselor (4)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN (
    'dashboard.view',
    'students.view','students.create','students.edit','students.export',
    'leads.view','leads.create','leads.edit','leads.assign',
    'applications.view','applications.create','applications.edit',
    'universities.view',
    'courses.view',
    'documents.view','documents.upload','documents.verify',
    'tasks.view','tasks.create','tasks.edit','tasks.delete',
    'communications.view','communications.create',
    'reports.view',
    'activities.view','notifications.view'
);

-- Marketing (5)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE name IN (
    'dashboard.view',
    'leads.view','leads.create','leads.edit','leads.export',
    'students.view',
    'universities.view',
    'communications.view','communications.create',
    'marketing.view','marketing.create','marketing.edit','marketing.delete','marketing.approve',
    'reports.view','reports.export',
    'activities.view','notifications.view'
);

-- Finance (6)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE name IN (
    'dashboard.view',
    'students.view',
    'applications.view',
    'finance.view','finance.create','finance.edit','finance.delete','commissions.manage',
    'reports.view','reports.export',
    'activities.view','notifications.view'
);

-- Documentation (7)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, id FROM permissions WHERE name IN (
    'dashboard.view',
    'students.view',
    'applications.view','applications.edit',
    'documents.view','documents.upload','documents.verify','documents.delete',
    'tasks.view','tasks.create','tasks.edit',
    'communications.view',
    'activities.view','notifications.view'
);

-- Agent (8) — external, limited
INSERT INTO role_permissions (role_id, permission_id)
SELECT 8, id FROM permissions WHERE name IN (
    'dashboard.view',
    'students.view','students.create',
    'leads.view','leads.create',
    'applications.view',
    'universities.view',
    'courses.view',
    'documents.view','documents.upload',
    'reports.view',
    'activities.view','notifications.view'
);

-- Student (9) — portal only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 9, id FROM permissions WHERE name IN (
    'dashboard.view',
    'applications.view',
    'documents.view',
    'communications.view',
    'notifications.view',
    'activities.view'
);

-- ============================================================
-- 4. Default Settings
-- ============================================================
INSERT INTO settings (setting_key, setting_value, description) VALUES
('APP_NAME',             'ALO Education',                 'Application display name'),
('APP_URL',              'https://aloeducation.com',      'Public base URL'),
('CURRENCY',             'BDT',                           'Default currency code'),
('CURRENCY_SYMBOL',      '৳',                              'Currency symbol'),
('DATE_FORMAT',          'M d, Y',                        'PHP date() format for dates'),
('DATETIME_FORMAT',      'M d, Y H:i',                    'PHP date() format for timestamps'),
('TIMEZONE',             'Asia/Dhaka',                    'Application default timezone'),
('LANGUAGE',             'en',                            'Default UI language'),
('ITEMS_PER_PAGE',       '25',                            'Default rows per page in lists'),
('COMPANY_NAME',         'ALO Education',                 'Legal company name'),
('COMPANY_PHONE',        '+880 1700-000000',             'Main contact phone'),
('COMPANY_EMAIL',        'info@aloeducation.com',         'Main contact email'),
('COMPANY_ADDRESS',      'Dhaka, Bangladesh',            'Office address'),
('COMPANY_LOGO',         '/assets/img/logo.png',         'Company logo path'),
('CRM_ID_PREFIX',        'ALO-CRM',                       'Default CRM ID prefix'),
('LEAD_SOURCE_DEFAULT',  'Website',                       'Default lead source'),
('DEFAULT_COUNSELOR_ID', '',                              'Auto-assigned counselor ID'),
('ALLOW_REGISTRATION',   'false',                         'Allow public student self-registration'),
('SESSION_LIFETIME',     '7200',                          'Session lifetime in seconds'),
('MAIL_FROM_NAME',       'ALO Education',                'Outgoing email from name'),
('ENABLE_WHATSAPP',      'false',                         'Enable WhatsApp integration'),
('ENABLE_SMS',           'false',                         'Enable SMS integration'),
('FOOTER_TEXT',          '© ALO Education. All rights reserved.', 'Footer copyright text'),
('BRAND_PRIMARY_COLOR',  '#4f46e5',                       'Primary brand color'),
('MAINTENANCE_MODE',     'false',                         'Maintenance mode flag');

-- ============================================================
-- 5. Sample Countries
-- ============================================================
INSERT INTO countries (id, name, slug, flag, capital, currency, description, status) VALUES
(1, 'United Kingdom', 'united-kingdom', '🇬🇧', 'London',      'GBP', 'Study in the UK — world-class universities and 2-year post-study work visa.', 'active'),
(2, 'United States',  'united-states',  '🇺🇸', 'Washington',  'USD', 'Study in the USA — diverse programs and OPT opportunities.',                  'active'),
(3, 'Canada',         'canada',         '🇨🇦', 'Ottawa',      'CAD', 'Study in Canada — friendly immigration and post-graduation work permits.',   'active'),
(4, 'Australia',      'australia',      '🇦🇺', 'Canberra',    'AUD', 'Study in Australia — high quality of life and graduate work streams.',       'active'),
(5, 'Ireland',        'ireland',        '🇮🇪', 'Dublin',      'EUR', 'Study in Ireland — English-speaking EU nation with strong tech sector.',     'active');

-- ============================================================
-- 6. Sample Universities
-- ============================================================
INSERT INTO universities (id, name, slug, country, city, logo, ranking, website, description, status, created_at, updated_at) VALUES
(1, 'University of Oxford',           'university-of-oxford',           'United Kingdom', 'Oxford',   NULL, 1,  'https://www.ox.ac.uk',           'The oldest university in the English-speaking world.',                                'active', NOW(), NOW()),
(2, 'University of Cambridge',        'university-of-cambridge',        'United Kingdom', 'Cambridge',NULL, 2,  'https://www.cam.ac.uk',          'A collegiate public research university founded in 1209.',                          'active', NOW(), NOW()),
(3, 'University of Toronto',         'university-of-toronto',          'Canada',         'Toronto',  NULL, 18, 'https://www.utoronto.ca',        'Canada''s leading research university.',                                            'active', NOW(), NOW()),
(4, 'University of Melbourne',        'university-of-melbourne',        'Australia',      'Melbourne',NULL, 33, 'https://www.unimelb.edu.au',     'Australia''s number one university and a leading research institution.',           'active', NOW(), NOW()),
(5, 'Trinity College Dublin',         'trinity-college-dublin',         'Ireland',        'Dublin',   NULL, 98, 'https://www.tcd.ie',             'Ireland''s premier university, founded in 1592.',                                  'active', NOW(), NOW()),
(6, 'Harvard University',             'harvard-university',             'United States',  'Cambridge',NULL, 3,  'https://www.harvard.edu',        'A private Ivy League research university in Cambridge, Massachusetts.',            'active', NOW(), NOW()),
(7, 'Stanford University',            'stanford-university',            'United States',  'Stanford', NULL, 6,  'https://www.stanford.edu',       'A private research university in Stanford, California.',                            'active', NOW(), NOW()),
(8, 'University of British Columbia', 'university-of-british-columbia', 'Canada',         'Vancouver',NULL, 47, 'https://www.ubc.ca',             'A public research university in British Columbia, Canada.',                       'active', NOW(), NOW());

-- ============================================================
-- 7. Sample courses (for the universities above)
-- ============================================================
INSERT INTO courses (university_id, name, slug, level, duration, tuition_fee, currency, intake, entry_requirement, ielts_requirement, description, status) VALUES
(1, 'BSc Computer Science',       'bsc-computer-science-oxford',        'Bachelor', '3 years',  37510.00, 'GBP', 'October',  'A*AA at A-level',                       7.5, 'A rigorous computer science programme at Oxford.', 'active'),
(1, 'MSc Advanced Computer Science', 'msc-advanced-computer-science-oxford', 'Masters', '1 year',  47000.00, 'GBP', 'October', 'First-class undergraduate degree',      7.5, 'Advanced computer science masters at Oxford.',     'active'),
(2, 'BA Economics',               'ba-economics-cambridge',             'Bachelor', '3 years',  37293.00, 'GBP', 'October',  'A*A*A at A-level',                       7.5, 'A leading economics programme at Cambridge.',     'active'),
(3, 'MEng Computer Engineering',  'meng-computer-engineering-toronto',  'Masters',  '2 years',  58160.00, 'CAD', 'September','Strong undergraduate engineering degree', 7.0, 'Professional engineering masters at U of T.',      'active'),
(4, 'Bachelor of Commerce',       'bachelor-of-commerce-melbourne',    'Bachelor', '3 years',  44760.00, 'AUD', 'February', 'ATAR 88+',                              6.5, 'Top-ranked commerce programme at Unimelb.',        'active'),
(5, 'MSc Data Science',           'msc-data-science-tcd',               'Masters',  '1 year',  24500.00, 'EUR', 'September','2:1 honours degree',                    6.5, 'Modern data science masters at Trinity Dublin.',  'active'),
(6, 'MBA',                        'mba-harvard',                         'Masters',  '2 years',  73440.00, 'USD', 'September','GMAT/GRE + work experience',              7.5, 'The Harvard MBA — global business leadership.',    'active'),
(7, 'MS Computer Science',        'ms-computer-science-stanford',        'Masters',  '2 years',  56480.00, 'USD', 'September','Strong CS background',                    7.0, 'Stanford CS masters at the heart of Silicon Valley.','active'),
(8, 'BSc Data Science',           'bsc-data-science-ubc',                'Bachelor', '4 years',  42000.00, 'CAD', 'September','High school graduation',                 6.5, 'UBC undergraduate data science programme.',         'active');

-- ============================================================
-- End of seed data
-- ============================================================
