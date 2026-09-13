<?php
/**
 * ALO Education CRM — Permission Definitions
 *
 * Returns a structured array of every permission defined in the system.
 * The keys mirror the seed.sql permissions table so that code can call
 * has_permission('students.view') etc.
 *
 * Structure:
 *   [
 *     '<module>' => [
 *       '<permission.name>' => '<Display Name>',
 *       ...
 *     ],
 *     ...
 *   ]
 *
 * @return array<string,array<string,string>>
 */
declare(strict_types=1);

return [
    'dashboard' => [
        'dashboard.view' => 'View Dashboard',
    ],

    'students' => [
        'students.view'   => 'View Students',
        'students.create' => 'Create Students',
        'students.edit'   => 'Edit Students',
        'students.delete' => 'Delete Students',
        'students.export' => 'Export Students',
    ],

    'leads' => [
        'leads.view'   => 'View Leads',
        'leads.create' => 'Create Leads',
        'leads.edit'   => 'Edit Leads',
        'leads.delete' => 'Delete Leads',
        'leads.assign' => 'Assign Leads',
        'leads.export' => 'Export Leads',
    ],

    'applications' => [
        'applications.view'   => 'View Applications',
        'applications.create' => 'Create Applications',
        'applications.edit'   => 'Edit Applications',
        'applications.delete' => 'Delete Applications',
    ],

    'universities' => [
        'universities.view'   => 'View Universities',
        'universities.create' => 'Create Universities',
        'universities.edit'   => 'Edit Universities',
        'universities.delete' => 'Delete Universities',
    ],

    'courses' => [
        'courses.view'   => 'View Courses',
        'courses.create' => 'Create Courses',
        'courses.edit'   => 'Edit Courses',
        'courses.delete' => 'Delete Courses',
    ],

    'documents' => [
        'documents.view'    => 'View Documents',
        'documents.upload'  => 'Upload Documents',
        'documents.verify'  => 'Verify Documents',
        'documents.delete'  => 'Delete Documents',
    ],

    'tasks' => [
        'tasks.view'   => 'View Tasks',
        'tasks.create' => 'Create Tasks',
        'tasks.edit'   => 'Edit Tasks',
        'tasks.delete' => 'Delete Tasks',
    ],

    'communications' => [
        'communications.view'    => 'View Communications',
        'communications.create'  => 'Send Communications',
        'communications.delete'  => 'Delete Communications',
    ],

    'marketing' => [
        'marketing.view'    => 'View Marketing',
        'marketing.create'  => 'Create Campaigns',
        'marketing.edit'    => 'Edit Campaigns',
        'marketing.delete'  => 'Delete Campaigns',
        'marketing.approve' => 'Approve Marketing Content',
    ],

    'finance' => [
        'finance.view'           => 'View Finance',
        'finance.create'         => 'Create Invoices/Payments',
        'finance.edit'           => 'Edit Invoices/Payments',
        'finance.delete'         => 'Delete Invoices/Payments',
        'commissions.manage'     => 'Manage Commissions',
    ],

    'reports' => [
        'reports.view'   => 'View Reports',
        'reports.export' => 'Export Reports',
    ],

    'users' => [
        'users.view'   => 'View Users',
        'users.create' => 'Create Users',
        'users.edit'   => 'Edit Users',
        'users.delete' => 'Delete Users',
    ],

    'settings' => [
        'settings.view' => 'View Settings',
        'settings.edit' => 'Edit Settings',
    ],

    'audit' => [
        'audit.view' => 'View Audit Logs',
    ],

    'branches' => [
        'branches.view'   => 'View Branches',
        'branches.create' => 'Create Branches',
        'branches.edit'   => 'Edit Branches',
        'branches.delete' => 'Delete Branches',
    ],

    'departments' => [
        'departments.view'   => 'View Departments',
        'departments.create' => 'Create Departments',
        'departments.edit'   => 'Edit Departments',
        'departments.delete' => 'Delete Departments',
    ],

    'activities' => [
        'activities.view' => 'View Activity Feed',
    ],

    'notifications' => [
        'notifications.view'   => 'View Notifications',
        'notifications.manage' => 'Manage Notifications',
    ],

    'whatsapp' => [
        'whatsapp.view'       => 'View WhatsApp Conversations',
        'whatsapp.send'       => 'Send WhatsApp Messages',
        'whatsapp.numbers'    => 'Manage WhatsApp Numbers (01805020100-019)',
        'whatsapp.assign'     => 'Assign WhatsApp Numbers to Employees',
        'whatsapp.sla'        => 'View SLA & Alarms',
        'whatsapp.escalate'   => 'Escalate / Handover Conversations',
        'whatsapp.documents'  => 'View Private Documents',
        'whatsapp.analytics'  => 'View WhatsApp Analytics',
    ],

    'sla' => [
        'sla.view'    => 'View SLA Events',
        'sla.manage'  => 'Manage SLA',
    ],
];
