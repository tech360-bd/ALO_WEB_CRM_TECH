/**
 * Shared admission guard for every AI Workforce route.
 *
 * Authentication comes from the existing ALO auth middleware; the role is
 * re-read from the database (never trusted from the request body), and the
 * capability check is the same one the runtime uses. Errors are mapped onto
 * the project envelope without leaking internals.
 */
import type { NextResponse } from 'next/server';
import { fail } from '@/lib/ai-workforce/api';
import { can, resolveActor, type AwfCapability } from '@/lib/ai-workforce/rbac';
import type { ActorContext } from '@/lib/ai-workforce/types';

export interface GuardSuccess {
  actor: ActorContext;
}

export async function guard(request: Request, capability: AwfCapability): Promise<GuardSuccess | NextResponse> {
  const actor = await resolveActor(request);
  if (!actor) return fail('Authentication required', 401);
  if (!can(actor.role, capability)) return fail(`Your role does not permit ${capability}`, 403);
  return { actor };
}

export function isGuardFailure(result: GuardSuccess | NextResponse): result is NextResponse {
  return !(result as GuardSuccess).actor;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
