import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/contact-search?q=
// Auth: any staff member.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const q = req.nextUrl.searchParams.get("q");
    if (!q) {
      return NextResponse.json({ error: "q query param is required" }, { status: 400 });
    }

    const { searchContacts } = await import("@/lib/threecx-integration");
    const contacts = await searchContacts(q);
    return NextResponse.json({ query: q, contacts });
  } catch (err: any) {
    console.error("[3cx/contact-search] error", err);
    return NextResponse.json({ error: err?.message || "Search failed" }, { status: 500 });
  }
}
