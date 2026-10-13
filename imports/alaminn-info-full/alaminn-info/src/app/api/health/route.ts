import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Public, minimal, safe. Returns only application status + timestamp.
 * Never exposes: counts of private records, DB connection strings, secrets,
 * internal IPs, raw exceptions, schema details, or user data.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Alaminn.info is operational.",
    data: {
      application: "Alaminn.info",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    meta: {},
    errors: [],
  });
}
