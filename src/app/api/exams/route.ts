import { db } from "@/lib/db";

export async function GET() {
  const exams = await db.examPage.findMany({
    where: { approvalStatus: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: { slug: true, name: true, fullName: true, intro: true, freeQuota: true, pricing: true, lastVerifiedAt: true, verificationStatus: true },
  });
  return Response.json({ exams });
}
