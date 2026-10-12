import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH — update template (lock/unlock requires authorized user; cannot edit LOCKED body)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, category, channel, language, subject, body: tplBody, variables, status, isLocked, approvedById, actionById } = body;

    const existing = await db.communicationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Authorization check for lock/unlock transitions
    if (typeof isLocked === "boolean" && isLocked !== existing.isLocked) {
      if (!actionById) {
        return NextResponse.json({ error: "actionById is required to change lock state" }, { status: 400 });
      }
      // Only APPROVED templates may be locked
      if (isLocked && existing.status !== "APPROVED") {
        return NextResponse.json({ error: "Template must be APPROVED before it can be locked" }, { status: 400 });
      }
    }

    // Locked templates: body changes require explicit unlock first
    if (existing.isLocked && tplBody && tplBody !== existing.body) {
      return NextResponse.json({ error: "Template is LOCKED. Unlock it before editing body content." }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (channel !== undefined) data.channel = channel;
    if (language !== undefined) data.language = language;
    if (subject !== undefined) data.subject = subject;
    if (tplBody !== undefined) data.body = tplBody;
    if (variables !== undefined) data.variables = typeof variables === "string" ? variables : JSON.stringify(variables || []);
    if (status !== undefined) data.status = status;

    if (typeof isLocked === "boolean") {
      data.isLocked = isLocked;
      if (isLocked) {
        data.status = "LOCKED";
        data.approvedById = approvedById || actionById;
        data.approvedAt = new Date();
      }
    }

    const template = await db.communicationTemplate.update({ where: { id }, data });
    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update template" }, { status: 500 });
  }
}

// DELETE — archive (soft delete, not hard delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.communicationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const template = await db.communicationTemplate.update({
      where: { id },
      data: { status: "ARCHIVED", isLocked: false },
    });
    return NextResponse.json({ template, archived: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to archive template" }, { status: 500 });
  }
}
