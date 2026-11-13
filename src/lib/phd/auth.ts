import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { authenticateRequest as authenticatePortal } from '@/lib/auth-middleware';
import { authenticateStudentRequest } from '@/lib/student-auth';
import {
  PHD_PERMISSIONS,
  type PhdRole,
} from './constants';

/**
 * PhD module identity and authorisation.
 *
 * Reuses the application's existing authentication (NextAuth cookie, student
 * portal session and employee portal session). Every API route resolves the
 * actor server-side; no client-supplied user id or role is ever trusted.
 */

export interface PhdActor {
  userId: string;
  email: string;
  name: string;
  role: PhdRole;
  permissions: string[];
  roles: string[];
  authentication: 'NEXTAUTH' | 'STUDENT_SESSION' | 'PORTAL_SESSION';
  studentId?: string;
}

export class PhdAccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'superadmin', 'administrator', 'owner']);
const VERIFIER_ROLES = new Set(['data_verifier', 'verifier', 'data_quality', 'research_verifier']);
const ADVISER_ROLES = new Set(['research_adviser', 'adviser', 'supervisor', 'academic_adviser']);
const APPLICANT_ROLES = new Set(['student', 'applicant', 'user', 'partner', 'counselor']);

function normaliseRoles(values: Array<string | null | undefined>): string[] {
  return values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function mapPhdRole(roles: string[], permissions: string[]): PhdRole {
  const perms = permissions.map((permission) => permission.toLowerCase());
  if (perms.includes(PHD_PERMISSIONS.ADMIN) || roles.some((role) => ADMIN_ROLES.has(role))) return 'ADMINISTRATOR';
  if (perms.includes(PHD_PERMISSIONS.VERIFY) || roles.some((role) => VERIFIER_ROLES.has(role))) return 'DATA_VERIFIER';
  if (perms.includes(PHD_PERMISSIONS.ADVISER) || roles.some((role) => ADVISER_ROLES.has(role))) return 'RESEARCH_ADVISER';
  return 'APPLICANT';
}

function parsePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function fromUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions?: string | null;
  status?: string | null;
}, authentication: PhdActor['authentication'], extraRoles: string[] = [], studentId?: string): Promise<PhdActor | null> {
  if (user.status && user.status !== 'ACTIVE') return null;
  const permissions = parsePermissions(user.permissions);
  const roles = normaliseRoles([user.role, ...extraRoles]);
  const role = mapPhdRole(roles, permissions);
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role,
    permissions,
    roles,
    authentication,
    studentId,
  };
}

export async function resolvePhdActor(req?: Request): Promise<PhdActor | null> {
  // 1. NextAuth session (main application login).
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; email?: string; role?: string; studentId?: string } | undefined;
    if (sessionUser?.id) {
      const user = await db.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, email: true, name: true, role: true, permissions: true, status: true },
      });
      if (user) {
        return await fromUser(user, 'NEXTAUTH', [], sessionUser.studentId);
      }
    }
  } catch {
    // NextAuth is unavailable during some CLI/test contexts; continue to the
    // session-cookie paths rather than failing the request outright.
  }

  if (req) {
    // 2. Student portal session cookie / bearer.
    try {
      const student = await authenticateStudentRequest(req);
      if (!(student instanceof NextResponse)) {
        const account = await db.student.findUnique({
          where: { id: student.studentId },
          select: { userId: true, email: true, name: true },
        });
        if (account?.userId) {
          const user = await db.user.findUnique({
            where: { id: account.userId },
            select: { id: true, email: true, name: true, role: true, permissions: true, status: true },
          });
          if (user) return await fromUser(user, 'STUDENT_SESSION', ['student'], student.studentId);
        }
      }
    } catch {
      // ignore and try portal
    }

    // 3. Employee portal session cookie / bearer.
    try {
      const portal = await authenticatePortal(req);
      if (!(portal instanceof NextResponse)) {
        const user = await db.user.findUnique({
          where: { id: portal.userId },
          select: { id: true, email: true, name: true, role: true, permissions: true, status: true },
        });
        if (user) return await fromUser(user, 'PORTAL_SESSION', portal.roles);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function requirePhdActor(req: Request): Promise<PhdActor | NextResponse> {
  const actor = await resolvePhdActor(req);
  if (!actor) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Sign in to the ALO portal to use the PhD workspace.' },
      { status: 401 },
    );
  }
  return actor;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function hasRole(actor: PhdActor, ...roles: PhdRole[]): boolean {
  return roles.includes(actor.role);
}

export function canVerify(actor: PhdActor): boolean {
  return actor.role === 'DATA_VERIFIER' || actor.role === 'ADMINISTRATOR';
}

export function canAdminister(actor: PhdActor): boolean {
  return actor.role === 'ADMINISTRATOR';
}

export function canAdvise(actor: PhdActor): boolean {
  return actor.role === 'RESEARCH_ADVISER' || actor.role === 'ADMINISTRATOR';
}

export interface ProjectAccessRecord {
  id: string;
  userId: string;
  adviserId?: string | null;
}

/**
 * Central ownership rule. A denial returns null so routes can answer 404 rather
 * than leaking the existence of another applicant's project.
 */
export function canAccessProject(actor: PhdActor, project: ProjectAccessRecord, mode: 'read' | 'write' = 'read'): boolean {
  if (actor.role === 'ADMINISTRATOR') return true;
  if (project.userId === actor.userId) return true;
  if (mode === 'read' && actor.role === 'RESEARCH_ADVISER' && project.adviserId === actor.userId) return true;
  return false;
}

export function assertProjectAccess(actor: PhdActor, project: ProjectAccessRecord | null, mode: 'read' | 'write' = 'read'): ProjectAccessRecord {
  if (!project || !canAccessProject(actor, project, mode)) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return project;
}

export function requireVerifier(actor: PhdActor): void {
  if (!canVerify(actor)) throw new PhdAccessError('Data verifier or administrator role required.', 403);
}

export function requireAdministrator(actor: PhdActor): void {
  if (!canAdminister(actor)) throw new PhdAccessError('Administrator role required.', 403);
}

export function describeActor(actor: PhdActor): { email: string; role: PhdRole; authentication: PhdActor['authentication'] } {
  return { email: actor.email, role: actor.role, authentication: actor.authentication };
}

export { APPLICANT_ROLES, ADMIN_ROLES, VERIFIER_ROLES, ADVISER_ROLES };
