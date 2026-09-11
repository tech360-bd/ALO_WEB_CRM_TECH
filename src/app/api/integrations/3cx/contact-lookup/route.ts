import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lookupContactByPhone } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/contact-lookup?phone=018XXXXXXXX
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const result = await lookupContactByPhone(phone);
  return NextResponse.json(result);
}
