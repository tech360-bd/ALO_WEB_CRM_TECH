import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — single draft
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const draft = await db.communicationDraft.findUnique({ where: { id } });
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json({ draft });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch draft" }, { status: 500 });
  }
}

// PATCH — approve / edit / reject / send (status transitions)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, editedBody, approvedBy, sentById, mode, riskLevel, riskFlags } = body;

    const existing = await db.communicationDraft.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const validStatuses = ["DRAFT", "APPROVED", "SENT", "REJECTED", "EDITED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "APPROVED") {
        if (!approvedBy) {
          return NextResponse.json({ error: "approvedBy is required to approve" }, { status: 400 });
        }
        data.approvedBy = approvedBy;
        data.approvedAt = new Date();
      }
      if (status === "SENT") {
        if (!sentById) {
          return NextResponse.json({ error: "sentById is required to send" }, { status: 400 });
        }
        data.sentById = sentById;
        data.sentAt = new Date();
        // If not previously approved, auto-approve on send by sender
        if (!existing.approvedBy) {
          data.approvedBy = sentById;
          data.approvedAt = new Date();
        }
      }
    }
    if (editedBody !== undefined && editedBody !== existing.draftBody) {
      data.editedBody = editedBody;
      if (existing.status === "DRAFT") {
        data.status = "EDITED";
      }
    }
    if (mode) data.mode = mode;
    if (riskLevel) data.riskLevel = riskLevel;
    if (riskFlags !== undefined) data.riskFlags = typeof riskFlags === "string" ? riskFlags : JSON.stringify(riskFlags || []);

    const draft = await db.communicationDraft.update({ where: { id }, data });
    return NextResponse.json({ draft });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update draft" }, { status: 500 });
  }
}
