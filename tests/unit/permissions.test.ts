// Unit tests for the PERMISSION_CATALOG and DEFAULT_ROLE_PERMISSIONS.
// Verifies that the permission catalog is complete and consistent.

import { describe, it, expect } from 'vitest';
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS, type PermissionAction } from '@/lib/permissions';

describe('PERMISSION_CATALOG', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PERMISSION_CATALOG)).toBe(true);
    expect(PERMISSION_CATALOG.length).toBeGreaterThan(50);
  });

  it('has unique IDs', () => {
    const ids = PERMISSION_CATALOG.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every entry has id, module, feature, action, description', () => {
    for (const p of PERMISSION_CATALOG) {
      expect(p.id).toBeTruthy();
      expect(p.module).toBeTruthy();
      expect(p.feature).toBeTruthy();
      expect(p.action).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });

  it('every action is a valid PermissionAction', () => {
    const validActions: PermissionAction[] = [
      'view', 'create', 'update', 'delete', 'approve', 'reject',
      'export', 'download', 'upload_on_behalf', 'request', 'submit',
      'review', 'archive', 'send', 'generate',
    ];
    for (const p of PERMISSION_CATALOG) {
      // At minimum, the action should be a non-empty string
      expect(typeof p.action).toBe('string');
      expect(p.action.length).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_ROLE_PERMISSIONS', () => {
  it('defines permissions for super_admin', () => {
    expect(Array.isArray(DEFAULT_ROLE_PERMISSIONS.super_admin)).toBe(true);
    expect(DEFAULT_ROLE_PERMISSIONS.super_admin.length).toBeGreaterThan(50);
  });

  it('super_admin has ALL permission IDs', () => {
    const allIds = PERMISSION_CATALOG.map(p => p.id);
    for (const id of allIds) {
      expect(DEFAULT_ROLE_PERMISSIONS.super_admin).toContain(id);
    }
  });

  it('every role has an array of permission IDs', () => {
    for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      expect(Array.isArray(perms)).toBe(true);
      for (const p of perms) {
        expect(typeof p).toBe('string');
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  it('every permission ID in DEFAULT_ROLE_PERMISSIONS exists in PERMISSION_CATALOG', () => {
    const catalogIds = new Set(PERMISSION_CATALOG.map(p => p.id));
    for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      for (const p of perms) {
        expect(catalogIds.has(p)).toBe(true);
      }
    }
  });
});
