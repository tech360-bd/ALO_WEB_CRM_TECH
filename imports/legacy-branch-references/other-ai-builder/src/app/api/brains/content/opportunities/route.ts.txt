import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/content/opportunities
// Lists content opportunities with optional filters.
// Query params: status?, source?, opportunityType?, universitySlug?, countrySlug?, limit?, offset?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const filters: any = {
      status: sp.get("status") || undefined,
      source: sp.get("source") || undefined,
      opportunityType: sp.get("opportunityType") || undefined,
      universitySlug: sp.get("universitySlug") || undefined,
      countrySlug: sp.get("countrySlug") || undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!, 10) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!, 10) : undefined,
    };

    const { getContentOpportunities } = await import("@/lib/brains/content-brain");
    const opportunities = await getContentOpportunities(filters);
    return NextResponse.json({ opportunities });
  } catch (err: any) {
    console.error("[brains/content/opportunities GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load opportunities" }, { status: 500 });
  }
}

// POST /api/brains/content/opportunities
// Collect content signals and create a new opportunity from a given signal.
// Body: { signal: ContentSignal } | { collectSignals: true } | { signalData: any }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { collectContentSignals, identifyContentOpportunity } = await import("@/lib/brains/content-brain");

    // Mode 1: collect-only — gather signals, return them without persisting opportunities.
    if (body?.collectSignals === true) {
      const signals = await collectContentSignals();
      return NextResponse.json({ signals });
    }

    // Mode 2: identify an opportunity from a single provided signal.
    const signal = body?.signal || body?.signalData;
    if (!signal || !signal.source || !signal.signalType) {
      return NextResponse.json(
        { error: "Body must include a 'signal' object with 'source' and 'signalType' fields, OR { collectSignals: true }" },
        { status: 400 }
      );
    }

    const result = await identifyContentOpportunity(signal);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[brains/content/opportunities POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create opportunity" }, { status: 500 });
  }
}
