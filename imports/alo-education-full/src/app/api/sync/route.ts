import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';

// ─── Validation Schemas ─────────────────────────────────────

const operationSchema = z.object({
  entity: z.enum(['students', 'leads', 'applications', 'notes', 'tasks']),
  entityId: z.string().min(1),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.record(z.unknown()).optional(),
  clientTimestamp: z.string().datetime(),
});

const syncBodySchema = z.object({
  operations: z.array(operationSchema).min(1).max(50),
});

type SyncOperation = z.infer<typeof operationSchema>;
type SyncResult = {
  entity: string;
  entityId: string;
  status: 'applied' | 'skipped' | 'conflict' | 'error';
  data?: unknown;
  conflict?: { serverData: unknown };
  error?: string;
};

// ─── Entity Handlers ────────────────────────────────────────

async function handleStudent(op: SyncOperation, userId: string): Promise<SyncResult> {
  switch (op.operation) {
    case 'CREATE': {
      // Check for duplicate email
      const payload = op.payload ?? {};
      if (payload.email) {
        const existing = await db.student.findFirst({ where: { email: payload.email as string } });
        if (existing) {
          return { entity: 'students', entityId: op.entityId, status: 'skipped', data: existing, error: 'Duplicate email' };
        }
      }
      const created = await db.student.create({
        data: {
          studentId: op.entityId,
          firstName: (payload.firstName as string) ?? '',
          lastName: (payload.lastName as string) ?? '',
          fullName: (payload.fullName as string) ?? `${(payload.firstName as string) ?? ''} ${(payload.lastName as string) ?? ''}`.trim(),
          email: (payload.email as string) ?? '',
          mobile: (payload.mobile as string) ?? '',
          nationality: (payload.nationality as string) ?? 'Bangladeshi',
          studyDestination: payload.studyDestination as string | undefined,
          programTitle: payload.programTitle as string | undefined,
          studyLevel: payload.studyLevel as string | undefined,
          studyArea: payload.studyArea as string | undefined,
          intake: payload.intake as string | undefined,
          profileCompletion: (payload.profileCompletion as number) ?? 0,
          status: (payload.status as string) ?? 'ACTIVE',
        },
      });
      return { entity: 'students', entityId: op.entityId, status: 'applied', data: created };
    }

    case 'UPDATE': {
      const existing = await db.student.findUnique({ where: { id: op.entityId } });
      if (!existing) {
        return { entity: 'students', entityId: op.entityId, status: 'error', error: 'Not found' };
      }
      // Conflict check
      const clientTs = new Date(op.clientTimestamp);
      if (clientTs < existing.updatedAt) {
        return { entity: 'students', entityId: op.entityId, status: 'conflict', data: existing, conflict: { serverData: existing } };
      }
      const payload = op.payload ?? {};
      const updateData: Record<string, unknown> = {};
      const allowedFields = ['firstName', 'lastName', 'fullName', 'email', 'mobile', 'nationality', 'studyDestination', 'programTitle', 'studyLevel', 'studyArea', 'intake', 'profileCompletion', 'status'];
      for (const field of allowedFields) {
        if (payload[field] !== undefined) {
          updateData[field] = payload[field];
        }
      }
      const updated = await db.student.update({ where: { id: op.entityId }, data: updateData });
      return { entity: 'students', entityId: op.entityId, status: 'applied', data: updated };
    }

    case 'DELETE': {
      const existing = await db.student.findUnique({ where: { id: op.entityId } });
      if (!existing) {
        return { entity: 'students', entityId: op.entityId, status: 'error', error: 'Not found' };
      }
      await db.student.delete({ where: { id: op.entityId } });
      return { entity: 'students', entityId: op.entityId, status: 'applied' };
    }
  }
}

async function handleLead(op: SyncOperation, userId: string): Promise<SyncResult> {
  switch (op.operation) {
    case 'CREATE': {
      const payload = op.payload ?? {};
      if (payload.phone) {
        const existing = await db.lead.findFirst({ where: { phone: payload.phone as string } });
        if (existing) {
          return { entity: 'leads', entityId: op.entityId, status: 'skipped', data: existing, error: 'Duplicate phone' };
        }
      }
      const created = await db.lead.create({
        data: {
          leadId: op.entityId,
          fullName: (payload.fullName as string) ?? '',
          email: (payload.email as string) ?? null,
          phone: (payload.phone as string) ?? '',
          source: (payload.source as string) ?? 'WEBSITE',
          preferredCountry: payload.preferredCountry as string | undefined,
          preferredCourse: payload.preferredCourse as string | undefined,
          notes: payload.notes as string | undefined,
          status: (payload.status as string) ?? 'NEW',
          aiScore: (payload.aiScore as number) ?? 0,
          leadScore: (payload.leadScore as number) ?? 0,
        },
      });
      return { entity: 'leads', entityId: op.entityId, status: 'applied', data: created };
    }

    case 'UPDATE': {
      const existing = await db.lead.findUnique({ where: { id: op.entityId } });
      if (!existing) {
        return { entity: 'leads', entityId: op.entityId, status: 'error', error: 'Not found' };
      }
      const clientTs = new Date(op.clientTimestamp);
      if (clientTs < existing.updatedAt) {
        return { entity: 'leads', entityId: op.entityId, status: 'conflict', data: existing, conflict: { serverData: existing } };
      }
      const payload = op.payload ?? {};
      const updateData: Record<string, unknown> = {};
      const allowedFields = ['fullName', 'email', 'phone', 'source', 'preferredCountry', 'preferredCourse', 'notes', 'status', 'aiScore', 'leadScore'];
      for (const field of allowedFields) {
        if (payload[field] !== undefined) {
          updateData[field] = payload[field];
        }
      }
      const updated = await db.lead.update({ where: { id: op.entityId }, data: updateData });
      return { entity: 'leads', entityId: op.entityId, status: 'applied', data: updated };
    }

    case 'DELETE': {
      const existing = await db.lead.findUnique({ where: { id: op.entityId } });
      if (!existing) {
        return { entity: 'leads', entityId: op.entityId, status: 'error', error: 'Not found' };
      }
      await db.lead.delete({ where: { id: op.entityId } });
      return { entity: 'leads', entityId: op.entityId, status: 'applied' };
    }
  }
}

async function handleApplication(op: SyncOperation, userId: string): Promise<SyncResult> {
  switch (op.operation) {
    case 'CREATE': {
      const payload = op.payload ?? {};
      const created = await db.application.create({
        data: {
          applicationId: op.entityId,
          studentId: (payload.studentId as string) ?? '',
          university: (payload.university as string) ?? '',
          course: (payload.course as string) ?? '',
          country: (payload.country as string) ?? '',
          intake: (payload.intake as string) ?? '',
          studyLevel: (payload.studyLevel as string) ?? '',
          stage: (payload.stage as string) ?? 'COUNSELING',
          priority: (payload.priority as string) ?? 'NORMAL',
          notes: payload.notes as string | undefined,
        },
      });
      return { entity: 'applications', entityId: op.entityId, status: 'applied', data: created };
    }

    case 'UPDATE': {
      const existing = await db.application.findUnique({ where: { id: op.entityId } });
      if (!existing) {
        return { entity: 'applications', entityId: op.entityId, status: 'error', error: 'Not found' };
      }
      const clientTs = new Date(op.clientTimestamp);
      if (clientTs < existing.updatedAt) {
        return { entity: 'applications', entityId: op.entityId, status: 'conflict', data: existing, conflict: { serverData: existing } };
      }
      const payload = op.payload ?? {};
      const updateData: Record<string, unknown> = {};
      const allowedFields = ['studentId', 'university', 'course', 'country', 'intake', 'studyLevel', 'stage', 'priority', 'notes'];
      for (const field of allowedFields) {
        if (payload[field] !== undefined) {
          updateData[field] = payload[field];
        }
      }
      const updated = await db.application.update({ where: { id: op.entityId }, data: updateData });
      return { entity: 'applications', entityId: op.entityId, status: 'applied', data: updated };
    }

    case 'DELETE': {
      const existing = await db.application.findUnique({ where: { id: op.entityId } });
      if (!existing) {
        return { entity: 'applications', entityId: op.entityId, status: 'error', error: 'Not found' };
      }
      await db.application.delete({ where: { id: op.entityId } });
      return { entity: 'applications', entityId: op.entityId, status: 'applied' };
    }
  }
}

function handleUnsupported(entity: string, op: SyncOperation): SyncResult {
  return {
    entity,
    entityId: op.entityId,
    status: 'error',
    error: `Entity '${entity}' is not supported for sync operations`,
  };
}

// ─── Route Handler ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  // Parse & validate body
  let body: z.infer<typeof syncBodySchema>;
  try {
    const raw = await req.json();
    body = syncBodySchema.parse(raw);
  } catch (e: unknown) {
    const msg = e instanceof z.ZodError ? e.errors.map((err) => err.message).join(', ') : 'Invalid request body';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const results: SyncResult[] = [];

  for (const op of body.operations) {
    let result: SyncResult;
    try {
      switch (op.entity) {
        case 'students':
          result = await handleStudent(op, auth.user.id);
          break;
        case 'leads':
          result = await handleLead(op, auth.user.id);
          break;
        case 'applications':
          result = await handleApplication(op, auth.user.id);
          break;
        case 'notes':
        case 'tasks':
          result = handleUnsupported(op.entity, op);
          break;
        default:
          result = { entity: op.entity, entityId: op.entityId, status: 'error', error: `Unknown entity: ${op.entity}` };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal error';
      result = { entity: op.entity, entityId: op.entityId, status: 'error', error: message };
    }

    results.push(result);

    // Audit log for each operation
    await auditLog({
      userId: auth.user.id,
      action: `SYNC_${op.operation}`,
      resource: op.entity,
      resourceId: op.entityId,
      details: {
        status: result.status,
        conflict: result.status === 'conflict',
        ...(result.error ? { error: result.error } : {}),
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    });
  }

  // If any result has conflict status, return 409
  const hasConflict = results.some((r) => r.status === 'conflict');
  const statusCode = hasConflict ? 409 : 200;

  return NextResponse.json(
    { success: !hasConflict, results },
    { status: statusCode },
  );
}
