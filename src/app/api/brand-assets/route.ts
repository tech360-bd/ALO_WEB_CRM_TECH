import { NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function listBrandAssets(_req: Request, _auth: AuthContext) {
  const assets = await db.brandAsset.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ assets });
}

async function createBrandAsset(req: Request, _auth: AuthContext) {
  const body = await req.json().catch(() => ({}));
  const { assetType, name, value } = body;
  if (typeof assetType !== "string" || !assetType.trim() || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "assetType and name are required" }, { status: 400 });
  }
  if (assetType === "LOGO") {
    await db.brandAsset.updateMany({ where: { assetType: "LOGO", isActive: true }, data: { isActive: false } });
  }
  const asset = await db.brandAsset.create({ data: { assetType: assetType.trim(), name: name.trim(), value: JSON.stringify(value || {}) } });
  return NextResponse.json({ asset }, { status: 201 });
}

async function updateBrandAsset(req: Request, _auth: AuthContext) {
  const body = await req.json().catch(() => ({}));
  const { id, isActive } = body;
  if (typeof id !== "string" || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "id and boolean isActive required" }, { status: 400 });
  }
  const asset = await db.brandAsset.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ asset });
}

export const GET = withAuth(listBrandAssets, { requireUserTypes: ADMIN_ROLES });
export const POST = withAuth(createBrandAsset, { requireUserTypes: ADMIN_ROLES });
export const PATCH = withAuth(updateBrandAsset, { requireUserTypes: ADMIN_ROLES });
