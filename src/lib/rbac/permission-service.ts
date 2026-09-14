// @ts-nocheck - Prisma stub requires VPS generation
import { db } from "@/lib/db";
import { PortalPermission } from "@prisma/client";

export class PermissionService {
  /**
   * Retrieves all available permissions.
   */
  static async getAllPermissions(): Promise<PortalPermission[]> {
    return db.portalPermission.findMany({
      orderBy: [
        { module: "asc" },
        { feature: "asc" },
        { action: "asc" },
      ],
    });
  }

  /**
   * Retrieves permissions grouped by module.
   */
  static async getPermissionsGroupedByModule() {
    const permissions = await this.getAllPermissions();
    const grouped: Record<string, PortalPermission[]> = {};

    permissions.forEach((perm) => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });

    return grouped;
  }

  /**
   * Assigns a permission to a role.
   */
  static async assignPermissionToRole(roleId: string, permissionId: string, assignedBy: string) {
    return db.portalRolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      update: {
        granted: true,
      },
      create: {
        roleId,
        permissionId,
        granted: true,
        assignedBy,
      },
    });
  }

  /**
   * Revokes a permission from a role.
   */
  static async revokePermissionFromRole(roleId: string, permissionId: string) {
    return db.portalRolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }
}
