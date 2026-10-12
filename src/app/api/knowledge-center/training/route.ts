import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — training materials
export async function GET() {
  const trainings = await db.trainingMaterial.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ trainings });
}
