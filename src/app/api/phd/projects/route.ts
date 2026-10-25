import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { createProject, ensureDefaultProject, listProjects } from '@/lib/phd/services/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  create: z.boolean().optional(),
});

// GET /api/phd/projects — the actor's projects (admins see all).
export const GET = phdRoute(async ({ actor }) => {
  const projects = await listProjects(actor);
  return phdJson({ success: true, projects });
});

// POST /api/phd/projects — ensures the default project, or creates an additional one.
export const POST = phdRoute(async ({ actor, req }) => {
  const body = await readPhdJson(req, createSchema);
  const project =
    body.create && body.title
      ? await createProject(actor, body.title)
      : await ensureDefaultProject(actor, body.title);
  return phdJson({ success: true, project }, body.create && body.title ? 201 : 200);
});
