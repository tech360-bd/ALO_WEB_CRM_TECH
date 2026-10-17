import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/contact-lookup?phone=
// Auth: any staff member.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const phone = req.nextUrl.searchParams.get("phone");
    if (!phone) {
      return NextResponse.json({ error: "phone query param is required" }, { status: 400 });
    }

    const { lookupContactByPhone } = await import("@/lib/threecx-integration");
    const contact = await lookupContactByPhone(phone);
    return NextResponse.json({ phone, contact });
  } catch (err: any) {
    console.error("[3cx/contact-lookup] error", err);
    return NextResponse.json({ error: err?.message || "Lookup failed" }, { status: 500 });
  }
}
