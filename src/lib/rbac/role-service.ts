// @ts-nocheck - Prisma stub requires VPS generation
import { db } from "@/lib/db";
import { PortalRole, PortalPermission, PortalUserRole } from "@prisma/client";

export class RoleService {
  /**
   * Retrieves all roles.
   */
  static async getAllRoles(): Promise<PortalRole[]> {
    return db.portalRole.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Gets a specific role by ID along with its permissions.
   */
  static async getRoleById(roleId: string) {
    return db.portalRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  /**
   * Assigns a role to a user.
   */
  static async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<PortalUserRole> {
    return db.portalUserRole.upsert({
      where: {
        userId_roleId: { userId, roleId },
      },
      update: {},
      create: {
        userId,
        roleId,
        assignedBy,
      },
    });
  }

  /**
   * Revokes a role from a user.
   */
  static async revokeRoleFromUser(userId: string, roleId: string) {
    return db.portalUserRole.deleteMany({
      where: { userId, roleId },
    });
  }

  /**
   * Gets all roles assigned to a specific user.
   */
  static async getUserRoles(userId: string) {
    return db.portalUserRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  /**
   * Checks if a user has a specific permission via their assigned roles.
   */
  static async userHasPermission(userId: string, action: string, feature?: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    if (userRoles.length === 0) return false;

    const roleIds = userRoles.map((ur) => ur.roleId);

    const permissionFilters: any = { action };
    if (feature) {
      permissionFilters.feature = feature;
    }

    const hasPermission = await db.portalRolePermission.findFirst({
      where: {
        roleId: { in: roleIds },
        granted: true,
        permission: {
          ...permissionFilters,
        },
      },
    });

    return !!hasPermission;
  }
}
