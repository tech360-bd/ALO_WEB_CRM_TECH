-- Seed WhatsApp permissions + role mappings
-- Run after seed.sql

INSERT IGNORE INTO permissions (id, name, display_name, module) VALUES
(301, 'whatsapp.view',      'View WhatsApp Conversations',          'whatsapp'),
(302, 'whatsapp.send',      'Send WhatsApp Messages',               'whatsapp'),
(303, 'whatsapp.numbers',   'Manage WhatsApp Numbers (01805020100-019)', 'whatsapp'),
(304, 'whatsapp.assign',    'Assign WhatsApp Numbers to Employees','whatsapp'),
(305, 'whatsapp.sla',       'View SLA & Alarms',                    'whatsapp'),
(306, 'whatsapp.escalate',  'Escalate / Handover Conversations',    'whatsapp'),
(307, 'whatsapp.documents', 'View Private Documents',               'whatsapp'),
(308, 'whatsapp.analytics', 'View WhatsApp Analytics',              'whatsapp'),
(311, 'sla.view',           'View SLA Events',                      'sla'),
(312, 'sla.manage',         'Manage SLA',                           'sla');

-- super_admin gets all
INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions WHERE name LIKE 'whatsapp.%' OR name LIKE 'sla.%';
-- admin gets all whatsapp/sla except numbers manage?
INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT 2, id FROM permissions WHERE name IN ('whatsapp.view','whatsapp.send','whatsapp.numbers','whatsapp.assign','whatsapp.sla','whatsapp.escalate','whatsapp.documents','whatsapp.analytics','sla.view','sla.manage');
-- manager
INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT 3, id FROM permissions WHERE name IN ('whatsapp.view','whatsapp.send','whatsapp.sla','whatsapp.escalate','whatsapp.documents','whatsapp.analytics','sla.view');
-- counselor
INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT 4, id FROM permissions WHERE name IN ('whatsapp.view','whatsapp.send','whatsapp.documents','whatsapp.sla');

-- Verify
-- SELECT r.name as role, p.name as perm FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE p.module IN ('whatsapp','sla') ORDER BY r.id, p.name;
