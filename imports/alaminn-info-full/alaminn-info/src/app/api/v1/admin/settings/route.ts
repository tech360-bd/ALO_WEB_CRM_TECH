import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/settings — return all settings as key→value map */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "security_settings.view");
  if (guard.denied) return guard.response;
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return ok(map, "Settings loaded.");
}

/** PUT /api/v1/admin/settings — upsert settings (key→value map) */
export async function PUT(req: NextRequest) {
  const guard = await requirePermission(req, "security_settings.update");
  if (guard.denied) return guard.response;
  const body = await readJson<Record<string, string>>(req);
  if (!body || typeof body !== "object") return fail("Invalid JSON body.");
  try {
    const keys = Object.keys(body);
    await db.$transaction(
      keys.map((k) =>
        db.setting.upsert({
          where: { key: k },
          update: { value: String(body[k]) },
          create: { key: k, value: String(body[k]) },
        })
      )
    );
    await writeAudit(guard.session, "settings.update", "Setting", undefined, { keys });
    return ok({ updated: keys.length }, "Settings saved.");
  } catch (e) {
    return fail("Failed to save settings.", [(e as Error).message], 500);
  }
}
