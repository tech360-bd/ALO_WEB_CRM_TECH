-- ALO Education Platform — Core System Seed SQL
-- Production-safe idempotency using INSERT ... ON DUPLICATE KEY UPDATE
-- Bypasses Prisma Rust Engine panics on CloudLinux / cPanel Jailshell

-- 1. DeploymentSequence
INSERT INTO `DeploymentSequence` (`name`, `createdAt`)
VALUES ('complete-production-seed', NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. User Table (Initial Super Admin)
INSERT INTO `User` (`id`, `email`, `name`, `role`, `permissions`, `createdAt`, `updatedAt`)
VALUES ('usr_initial_super_admin', 'engr.alaminn@gmail.com', 'Initial Super Admin', 'SUPER_ADMIN', '["ALL"]', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `role` = 'SUPER_ADMIN', `permissions` = VALUES(`permissions`), `updatedAt` = VALUES(`updatedAt`);

-- 3. PortalRole Table (SUPER_ADMIN)
INSERT INTO `PortalRole` (`id`, `name`, `label`, `description`, `isSystem`, `createdAt`, `updatedAt`)
VALUES ('role_super_admin', 'SUPER_ADMIN', 'Super Admin', 'Initial system administrator role.', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `label` = 'Super Admin', `isSystem` = 1, `updatedAt` = VALUES(`updatedAt`);

-- 4. PortalPermission Table (system.all.manage)
INSERT INTO `PortalPermission` (`id`, `module`, `feature`, `action`, `description`, `createdAt`, `updatedAt`)
VALUES ('perm_system_all_manage', 'system', 'all', 'manage', 'Full system administration permission.', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `updatedAt` = VALUES(`updatedAt`);

-- 5. PortalRolePermission Table
INSERT INTO `PortalRolePermission` (`id`, `roleId`, `permissionId`, `granted`, `assignedBy`, `createdAt`, `updatedAt`)
VALUES ('prp_role_super_admin_perm_system_all_manage', 'role_super_admin', 'perm_system_all_manage', 1, 'complete-production-seed', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `granted` = 1, `updatedAt` = VALUES(`updatedAt`);

-- 6. PortalUser Table (Super Admin Portal Account)
-- Email: engr.alaminn@gmail.com | Password: AloAdminSecure2026!Pass
INSERT INTO `PortalUser` (`id`, `email`, `passwordHash`, `name`, `userType`, `status`, `firstLoginRequired`, `emailVerified`, `createdAt`, `updatedAt`)
VALUES ('pu_initial_super_admin', 'engr.alaminn@gmail.com', '$2b$10$LvgDsWYIdwwdOl8FeklT4evlt3M2flT6NpBlxg/lH1BcurAEfLtSO', 'Initial Super Admin', 'SUPER_ADMIN', 'active', 0, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `passwordHash` = VALUES(`passwordHash`), `userType` = 'SUPER_ADMIN', `status` = 'active', `updatedAt` = VALUES(`updatedAt`);

-- 7. PortalUserRole Table
INSERT INTO `PortalUserRole` (`id`, `userId`, `roleId`, `assignedBy`, `createdAt`, `updatedAt`)
VALUES ('pur_pu_initial_super_admin_role_super_admin', 'pu_initial_super_admin', 'role_super_admin', 'complete-production-seed', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `assignedBy` = VALUES(`assignedBy`), `updatedAt` = VALUES(`updatedAt`);

-- 8. EmployeeCommunicationProfile Table
INSERT INTO `EmployeeCommunicationProfile` (`id`, `employeeId`, `employeeName`, `officialEmail`, `officialPhone`, `whatsappAccess`, `facebookAccess`, `instagramAccess`, `emailAccess`, `assignedBranch`, `assignedDepartments`, `channelPermissions`, `workingHoursStart`, `workingHoursEnd`, `createdAt`, `updatedAt`)
VALUES ('ecp_system_initial_admin', 'system-initial-admin', 'Initial Super Admin', 'engr.alaminn@gmail.com', '', 0, 0, 0, 1, 'unassigned', '["Administration"]', '{"email":true}', '10:00', '18:00', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `officialEmail` = VALUES(`officialEmail`), `updatedAt` = VALUES(`updatedAt`);
