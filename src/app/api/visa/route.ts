import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const visaCases = await db.visaCase.findMany({
    include: { student: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ visaCases });
}

// Update visa stage
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, visaStage, userId } = body;
  const visa = await db.visaCase.update({
    where: { id },
    data: { visaStage },
  });
  await db.timelineEvent.create({
    data: {
      studentId: visa.studentId,
      userId,
      type: "VISA_STATUS_CHANGED",
      title: "Visa stage updated",
      description: `Visa case ${visa.caseId} moved to ${visaStage.replace(/_/g, " ").toLowerCase()}`,
    },
  });
  await db.auditLog.create({
    data: {
      userId,
      action: "VISA_STATUS_CHANGE",
      resource: "VisaCase",
      resourceId: visa.id,
      details: JSON.stringify({ visaStage }),
    },
  });
  return NextResponse.json({ visaCase: visa });
}
