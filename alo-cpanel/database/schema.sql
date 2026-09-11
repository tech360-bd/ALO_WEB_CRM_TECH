-- ============================================================
-- ALO Education CRM — MySQL Schema
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- Reverse-order drops so re-running is safe ------------------
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS commissions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS marketing_content;
DROP TABLE IF EXISTS marketing_campaigns;
DROP TABLE IF EXISTS communications;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS universities;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Roles & Permissions
-- ============================================================

CREATE TABLE roles (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(50)  NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    description   VARCHAR(255) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    display_name  VARCHAR(150) NOT NULL,
    module        VARCHAR(50)  NOT NULL DEFAULT 'general',
    PRIMARY KEY (id),
    UNIQUE KEY uq_permissions_name (name),
    KEY idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id       INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    KEY idx_rp_permission (permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id)
        REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Users
-- ============================================================

CREATE TABLE users (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(190) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('super_admin','admin','manager','counselor','marketing','finance','documentation','agent','student') NOT NULL DEFAULT 'counselor',
    phone           VARCHAR(30) NULL DEFAULT NULL,
    status          ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    last_login_at   DATETIME NULL DEFAULT NULL,
    remember_token  VARCHAR(100) NULL DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_permissions (
    user_id        BIGINT UNSIGNED NOT NULL,
    permission_id  INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, permission_id),
    KEY idx_up_permission (permission_id),
    CONSTRAINT fk_up_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_up_permission FOREIGN KEY (permission_id)
        REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Organization: Branches & Departments
-- ============================================================

CREATE TABLE branches (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name      VARCHAR(150) NOT NULL,
    code      VARCHAR(20)  NOT NULL,
    address   VARCHAR(255) NULL DEFAULT NULL,
    phone     VARCHAR(30)  NULL DEFAULT NULL,
    status    ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_branches_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150) NOT NULL,
    code       VARCHAR(20)  NOT NULL,
    branch_id  INT UNSIGNED NULL DEFAULT NULL,
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_departments_code (code),
    KEY idx_departments_branch (branch_id),
    CONSTRAINT fk_dept_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Leads
-- ============================================================

CREATE TABLE leads (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crm_id         VARCHAR(50) NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    email          VARCHAR(190) NULL DEFAULT NULL,
    phone          VARCHAR(30)  NULL DEFAULT NULL,
    alt_phone      VARCHAR(30)  NULL DEFAULT NULL,
    source         VARCHAR(50)  NULL DEFAULT NULL,
    status         ENUM('NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED','LOST') NOT NULL DEFAULT 'NEW',
    counselor_id   BIGINT UNSIGNED NULL DEFAULT NULL,
    country        VARCHAR(100) NULL DEFAULT NULL,
    course         VARCHAR(150) NULL DEFAULT NULL,
    intake          VARCHAR(50)  NULL DEFAULT NULL,
    budget          DECIMAL(12,2) NULL DEFAULT NULL,
    ielts_score     DECIMAL(4,1) NULL DEFAULT NULL,
    notes           TEXT NULL,
    lead_score      INT NOT NULL DEFAULT 0,
    follow_up_date  DATE NULL DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_leads_crm_id (crm_id),
    KEY idx_leads_status (status),
    KEY idx_leads_counselor (counselor_id),
    KEY idx_leads_source (source),
    KEY idx_leads_follow_up (follow_up_date),
    KEY idx_leads_created (created_at),
    CONSTRAINT fk_leads_counselor FOREIGN KEY (counselor_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Students
-- ============================================================

CREATE TABLE students (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crm_id             VARCHAR(50) NOT NULL,
    lead_id            BIGINT UNSIGNED NULL DEFAULT NULL,
    user_id            BIGINT UNSIGNED NULL DEFAULT NULL,
    full_name          VARCHAR(150) NOT NULL,
    email              VARCHAR(190) NULL DEFAULT NULL,
    phone              VARCHAR(30)  NULL DEFAULT NULL,
    alt_phone          VARCHAR(30)  NULL DEFAULT NULL,
    date_of_birth      DATE NULL DEFAULT NULL,
    gender             ENUM('male','female','other') NULL DEFAULT NULL,
    nationality        VARCHAR(80)  NULL DEFAULT NULL,
    passport_number   VARCHAR(60)  NULL DEFAULT NULL,
    passport_expiry    DATE NULL DEFAULT NULL,
    present_address    VARCHAR(255) NULL DEFAULT NULL,
    permanent_address  VARCHAR(255) NULL DEFAULT NULL,
    guardian_name      VARCHAR(150) NULL DEFAULT NULL,
    guardian_phone     VARCHAR(30)  NULL DEFAULT NULL,
    ssc_result         VARCHAR(30)  NULL DEFAULT NULL,
    hsc_result         VARCHAR(30)  NULL DEFAULT NULL,
    ielts_score        DECIMAL(4,1) NULL DEFAULT NULL,
    preferred_country  VARCHAR(100) NULL DEFAULT NULL,
    preferred_university VARCHAR(190) NULL DEFAULT NULL,
    preferred_course   VARCHAR(150) NULL DEFAULT NULL,
    preferred_intake   VARCHAR(50)  NULL DEFAULT NULL,
    status             ENUM('PROSPECT','LEAD','APPLICANT','OFFERED','ENROLLED','GRADUATED','WITHDRAWN','REJECTED') NOT NULL DEFAULT 'PROSPECT',
    counselor_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_students_crm_id (crm_id),
    KEY idx_students_lead (lead_id),
    KEY idx_students_user (user_id),
    KEY idx_students_status (status),
    KEY idx_students_counselor (counselor_id),
    KEY idx_students_email (email),
    KEY idx_students_phone (phone),
    CONSTRAINT fk_students_lead FOREIGN KEY (lead_id)
        REFERENCES leads(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_students_counselor FOREIGN KEY (counselor_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Universities & Courses
-- ============================================================

CREATE TABLE universities (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(190) NOT NULL,
    slug        VARCHAR(190) NOT NULL,
    country     VARCHAR(100) NULL DEFAULT NULL,
    city        VARCHAR(100) NULL DEFAULT NULL,
    logo        VARCHAR(255) NULL DEFAULT NULL,
    ranking     INT UNSIGNED NULL DEFAULT NULL,
    website     VARCHAR(255) NULL DEFAULT NULL,
    description TEXT NULL,
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_universities_slug (slug),
    KEY idx_universities_country (country),
    KEY idx_universities_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    university_id      INT UNSIGNED NOT NULL,
    name               VARCHAR(190) NOT NULL,
    slug               VARCHAR(190) NOT NULL,
    level              VARCHAR(50)  NULL DEFAULT NULL,
    duration           VARCHAR(50)  NULL DEFAULT NULL,
    tuition_fee        DECIMAL(12,2) NULL DEFAULT NULL,
    currency           VARCHAR(10)  NULL DEFAULT 'USD',
    intake              VARCHAR(100) NULL DEFAULT NULL,
    entry_requirement  TEXT NULL,
    ielts_requirement  DECIMAL(4,1) NULL DEFAULT NULL,
    description        TEXT NULL,
    status             ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_courses_slug (slug),
    KEY idx_courses_university (university_id),
    KEY idx_courses_level (level),
    CONSTRAINT fk_courses_university FOREIGN KEY (university_id)
        REFERENCES universities(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Applications
-- ============================================================

CREATE TABLE applications (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crm_id          VARCHAR(50) NOT NULL,
    student_id      BIGINT UNSIGNED NOT NULL,
    university_id   INT UNSIGNED NULL DEFAULT NULL,
    course_id       INT UNSIGNED NULL DEFAULT NULL,
    intake           VARCHAR(50)  NULL DEFAULT NULL,
    application_date DATE NOT NULL,
    status          ENUM('DRAFT','SUBMITTED','UNDER_REVIEW','CONDITIONAL_OFFER','UNCONDITIONAL_OFFER','CAS_PENDING','CAS_ISSUED','VISA_PENDING','VISA_GRANTED','VISA_REFUSED','ENROLLED','WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    reference_number VARCHAR(80)  NULL DEFAULT NULL,
    offer_date      DATE NULL DEFAULT NULL,
    cas_date        DATE NULL DEFAULT NULL,
    visa_date       DATE NULL DEFAULT NULL,
    notes           TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_applications_crm_id (crm_id),
    KEY idx_applications_student (student_id),
    KEY idx_applications_university (university_id),
    KEY idx_applications_course (course_id),
    KEY idx_applications_status (status),
    KEY idx_applications_date (application_date),
    CONSTRAINT fk_app_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_app_university FOREIGN KEY (university_id)
        REFERENCES universities(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_app_course FOREIGN KEY (course_id)
        REFERENCES courses(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Countries
-- ============================================================

CREATE TABLE countries (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    flag        VARCHAR(20)  NULL DEFAULT NULL,
    capital     VARCHAR(100) NULL DEFAULT NULL,
    currency    VARCHAR(30)  NULL DEFAULT NULL,
    description TEXT NULL,
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    PRIMARY KEY (id),
    UNIQUE KEY uq_countries_slug (slug),
    KEY idx_countries_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Documents
-- ============================================================

CREATE TABLE documents (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id        BIGINT UNSIGNED NULL DEFAULT NULL,
    application_id    BIGINT UNSIGNED NULL DEFAULT NULL,
    document_type     ENUM('PASSPORT','PHOTO','ACADEMIC_CERT','TRANSCRIPT','ENGLISH_CERT','CV','PERSONAL_STATEMENT','RECOMMENDATION','OFFER_LETTER','CAS','VISA','FINANCIAL','OTHER') NOT NULL,
    file_name         VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    file_size         INT UNSIGNED NOT NULL DEFAULT 0,
    mime_type         VARCHAR(100) NULL DEFAULT NULL,
    uploaded_by       BIGINT UNSIGNED NULL DEFAULT NULL,
    status            ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
    rejection_reason  VARCHAR(255) NULL DEFAULT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_documents_student (student_id),
    KEY idx_documents_application (application_id),
    KEY idx_documents_type (document_type),
    KEY idx_documents_status (status),
    KEY idx_documents_uploaded_by (uploaded_by),
    CONSTRAINT fk_doc_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doc_application FOREIGN KEY (application_id)
        REFERENCES applications(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doc_uploader FOREIGN KEY (uploaded_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tasks
-- ============================================================

CREATE TABLE tasks (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title         VARCHAR(190) NOT NULL,
    description   TEXT NULL,
    assigned_to   BIGINT UNSIGNED NULL DEFAULT NULL,
    student_id    BIGINT UNSIGNED NULL DEFAULT NULL,
    lead_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    crm_id        VARCHAR(50)  NULL DEFAULT NULL,
    priority      ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
    status        ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    due_date      DATETIME NULL DEFAULT NULL,
    completed_at  DATETIME NULL DEFAULT NULL,
    created_by    BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tasks_assigned_to (assigned_to),
    KEY idx_tasks_student (student_id),
    KEY idx_tasks_lead (lead_id),
    KEY idx_tasks_status (status),
    KEY idx_tasks_priority (priority),
    KEY idx_tasks_due_date (due_date),
    KEY idx_tasks_created_by (created_by),
    CONSTRAINT fk_task_assignee FOREIGN KEY (assigned_to)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_task_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_task_lead FOREIGN KEY (lead_id)
        REFERENCES leads(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_task_creator FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Communications
-- ============================================================

CREATE TABLE communications (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crm_id        VARCHAR(50)  NULL DEFAULT NULL,
    student_id    BIGINT UNSIGNED NULL DEFAULT NULL,
    lead_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    user_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    channel       ENUM('WHATSAPP','EMAIL','SMS','MESSENGER','PHONE','INTERNAL_NOTE') NOT NULL,
    direction     ENUM('INBOUND','OUTBOUND') NOT NULL DEFAULT 'OUTBOUND',
    subject       VARCHAR(255) NULL DEFAULT NULL,
    message       TEXT NOT NULL,
    attachment    VARCHAR(500) NULL DEFAULT NULL,
    status        ENUM('PENDING','SENT','DELIVERED','READ','FAILED') NOT NULL DEFAULT 'PENDING',
    external_id   VARCHAR(190) NULL DEFAULT NULL,
    sent_at       DATETIME NULL DEFAULT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comm_crm_id (crm_id),
    KEY idx_comm_student (student_id),
    KEY idx_comm_lead (lead_id),
    KEY idx_comm_user (user_id),
    KEY idx_comm_channel (channel),
    KEY idx_comm_status (status),
    KEY idx_comm_created (created_at),
    CONSTRAINT fk_comm_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comm_lead FOREIGN KEY (lead_id)
        REFERENCES leads(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comm_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Marketing
-- ============================================================

CREATE TABLE marketing_campaigns (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(190) NOT NULL,
    platform     ENUM('FACEBOOK','INSTAGRAM','WHATSAPP','MESSENGER','EMAIL','SMS') NOT NULL,
    status       ENUM('DRAFT','ACTIVE','PAUSED','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    start_date   DATE NULL DEFAULT NULL,
    end_date     DATE NULL DEFAULT NULL,
    budget       DECIMAL(12,2) NULL DEFAULT NULL,
    spent        DECIMAL(12,2) NOT NULL DEFAULT 0,
    reach        INT UNSIGNED NOT NULL DEFAULT 0,
    engagement   INT UNSIGNED NOT NULL DEFAULT 0,
    leads        INT UNSIGNED NOT NULL DEFAULT 0,
    conversions  INT UNSIGNED NOT NULL DEFAULT 0,
    created_by   BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mc_status (status),
    KEY idx_mc_platform (platform),
    KEY idx_mc_created_by (created_by),
    CONSTRAINT fk_mc_creator FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE marketing_content (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    campaign_id   BIGINT UNSIGNED NOT NULL,
    title         VARCHAR(190) NOT NULL,
    content       TEXT NOT NULL,
    platform      VARCHAR(50)  NULL DEFAULT NULL,
    language      VARCHAR(10)  NOT NULL DEFAULT 'en',
    status        ENUM('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    approved_by   BIGINT UNSIGNED NULL DEFAULT NULL,
    approved_at   DATETIME NULL DEFAULT NULL,
    published_at  DATETIME NULL DEFAULT NULL,
    created_by    BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mcontent_campaign (campaign_id),
    KEY idx_mcontent_status (status),
    KEY idx_mcontent_approved_by (approved_by),
    CONSTRAINT fk_mcontent_campaign FOREIGN KEY (campaign_id)
        REFERENCES marketing_campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mcontent_approver FOREIGN KEY (approved_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_mcontent_creator FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Finance: Invoices, Payments, Commissions
-- ============================================================

CREATE TABLE invoices (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    invoice_number  VARCHAR(50)  NOT NULL,
    student_id      BIGINT UNSIGNED NOT NULL,
    application_id  BIGINT UNSIGNED NULL DEFAULT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(10)  NOT NULL DEFAULT 'BDT',
    status          ENUM('PENDING','PARTIAL','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
    issue_date      DATE NOT NULL,
    due_date        DATE NULL DEFAULT NULL,
    paid_date       DATE NULL DEFAULT NULL,
    notes           TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_number (invoice_number),
    KEY idx_invoices_student (student_id),
    KEY idx_invoices_application (application_id),
    KEY idx_invoices_status (status),
    KEY idx_invoices_issue_date (issue_date),
    CONSTRAINT fk_inv_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inv_application FOREIGN KEY (application_id)
        REFERENCES applications(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    invoice_id      BIGINT UNSIGNED NOT NULL,
    student_id      BIGINT UNSIGNED NULL DEFAULT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(10)  NOT NULL DEFAULT 'BDT',
    payment_method  VARCHAR(50)  NULL DEFAULT NULL,
    transaction_id  VARCHAR(190) NULL DEFAULT NULL,
    status          ENUM('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    paid_at         DATETIME NULL DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_payments_invoice (invoice_id),
    KEY idx_payments_student (student_id),
    KEY idx_payments_status (status),
    KEY idx_payments_paid_at (paid_at),
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pay_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commissions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id        BIGINT UNSIGNED NULL DEFAULT NULL,
    student_id      BIGINT UNSIGNED NULL DEFAULT NULL,
    application_id  BIGINT UNSIGNED NULL DEFAULT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(10)  NOT NULL DEFAULT 'USD',
    status          ENUM('PENDING','APPROVED','PAID') NOT NULL DEFAULT 'PENDING',
    approved_by     BIGINT UNSIGNED NULL DEFAULT NULL,
    approved_at     DATETIME NULL DEFAULT NULL,
    paid_at         DATETIME NULL DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_commissions_agent (agent_id),
    KEY idx_commissions_student (student_id),
    KEY idx_commissions_application (application_id),
    KEY idx_commissions_status (status),
    CONSTRAINT fk_comm_agent FOREIGN KEY (agent_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_comm_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_comm_application FOREIGN KEY (application_id)
        REFERENCES applications(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_comm_approver FOREIGN KEY (approved_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Audit Logs
-- ============================================================

CREATE TABLE audit_logs (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(80)  NOT NULL,
    entity_id     BIGINT UNSIGNED NULL DEFAULT NULL,
    before_values TEXT NULL,
    after_values  TEXT NULL,
    ip_address    VARCHAR(45)  NULL DEFAULT NULL,
    user_agent    VARCHAR(255) NULL DEFAULT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_user (user_id),
    KEY idx_audit_entity_type (entity_type),
    KEY idx_audit_entity_id (entity_id),
    KEY idx_audit_action (action),
    KEY idx_audit_created (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Settings
-- ============================================================

CREATE TABLE settings (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    setting_key   VARCHAR(100) NOT NULL,
    setting_value TEXT NULL,
    description   VARCHAR(255) NULL DEFAULT NULL,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Notifications
-- ============================================================

CREATE TABLE notifications (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(190) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'info',
    is_read     TINYINT(1) NOT NULL DEFAULT 0,
    link        VARCHAR(255) NULL DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notifications_user (user_id),
    KEY idx_notifications_is_read (is_read),
    KEY idx_notifications_created (created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Activities (feed)
-- ============================================================

CREATE TABLE activities (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    student_id    BIGINT UNSIGNED NULL DEFAULT NULL,
    lead_id       BIGINT UNSIGNED NULL DEFAULT NULL,
    crm_id        VARCHAR(50)  NULL DEFAULT NULL,
    type          VARCHAR(80)  NOT NULL,
    description   TEXT NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activities_user (user_id),
    KEY idx_activities_student (student_id),
    KEY idx_activities_lead (lead_id),
    KEY idx_activities_type (type),
    KEY idx_activities_created (created_at),
    CONSTRAINT fk_act_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_act_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_act_lead FOREIGN KEY (lead_id)
        REFERENCES leads(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- End of schema
-- ============================================================
