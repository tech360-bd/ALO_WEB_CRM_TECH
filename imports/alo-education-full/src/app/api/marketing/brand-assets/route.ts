import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const assets = await db.brandAsset.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ assets });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { assetType, name, value } = body;

  if (assetType === "LOGO") {
    await db.brandAsset.updateMany({ where: { assetType: "LOGO", isActive: true }, data: { isActive: false } });
  }

  const asset = await db.brandAsset.create({
    data: { assetType, name, value: JSON.stringify(value || {}) },
  });

  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "BrandAsset", resourceId: asset.id, details: JSON.stringify({ assetType, name }) },
  }).catch(() => {});

  return NextResponse.json({ asset });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isActive } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const asset = await db.brandAsset.update({ where: { id }, data: { isActive: !!isActive } });
  return NextResponse.json({ asset });
}
