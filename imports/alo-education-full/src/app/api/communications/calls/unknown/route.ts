import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list unknown incoming contacts (matchedToStudent=false by default)
export async function GET(req: NextRequest) {
  try {
    const includeResolved = req.nextUrl.searchParams.get("includeResolved") === "true";
    const source = req.nextUrl.searchParams.get("source");

    const where: any = {};
    if (!includeResolved) where.matchedToStudent = false;
    if (source) where.source = source;

    const unknown = await db.unknownIncomingContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contacts: unknown });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch unknown contacts" }, { status: 500 });
  }
}

// POST — resolve an unknown incoming contact
// Body: { id, action, actionById }
// action: CREATE_LEAD | LINK_EXISTING | CREATE_PARTNER_CONTACT | MARK_SPAM
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, actionById } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }
    const validActions = ["CREATE_LEAD", "LINK_EXISTING", "CREATE_PARTNER_CONTACT", "MARK_SPAM"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `action must be one of: ${validActions.join(", ")}` }, { status: 400 });
    }

    const existing = await db.unknownIncomingContact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "UnknownIncomingContact not found" }, { status: 404 });
    }

    const updated = await db.unknownIncomingContact.update({
      where: { id },
      data: {
        action,
        actionById,
        actionAt: new Date(),
        matchedToStudent: action === "LINK_EXISTING" ? true : existing.matchedToStudent,
      },
    });
    return NextResponse.json({ contact: updated, resolved: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to resolve unknown contact" }, { status: 500 });
  }
}
