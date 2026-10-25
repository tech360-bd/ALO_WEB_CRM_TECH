import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { getOrCreateProfile, saveProfile, toProfileView } from '@/lib/phd/services/profile';
import { profileUpdateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/profile — the signed-in applicant's own profile.
export const GET = phdRoute(async ({ actor }) => {
  const profile = await getOrCreateProfile(actor.userId);
  return phdJson({ success: true, profile: toProfileView(profile) });
});

// PUT /api/phd/profile — validated partial update. Unknown keys are stripped.
export const PUT = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, profileUpdateSchema);
  const profile = await saveProfile(actor, input);
  return phdJson({ success: true, profile: toProfileView(profile) });
});
