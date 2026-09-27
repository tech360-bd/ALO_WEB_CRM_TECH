import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

// GET — training materials
async function listTraining(_req: Request, _auth: AuthContext) {
  const trainings = await db.trainingMaterial.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ trainings });
}

export const GET = withAuth(listTraining, { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "EMPLOYEE", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "ENGLISH_TRAINER"] });
