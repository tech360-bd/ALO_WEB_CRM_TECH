import { db } from "@/lib/db";

export async function GET() {
  const campaigns = await db.campaign.findMany({ orderBy: { updatedAt: "desc" } });
  return Response.json({ campaigns });
}
