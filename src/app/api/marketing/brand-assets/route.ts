import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const assets = await db.brandAsset.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  // include brandKit for new UI (logo + address + phone + whatsapp + website + colors)
  const kitAsset = assets.find(a => a.assetType === "BRAND_KIT");
  let brandKit: any = null;
  if (kitAsset) { try { brandKit = JSON.parse(kitAsset.value || "{}"); } catch { brandKit = {}; } }
  // extract logo helper
  const logoAsset = assets.find(a => a.assetType === "LOGO");
  let logoVal: any = null;
  if (logoAsset) { try { logoVal = JSON.parse(logoAsset.value || "{}"); } catch {} }
  return NextResponse.json({ assets, brandKit, logoVal });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // support both new {assetType,value} and legacy {type,fileUrl} from dashboard
  const assetType = body.assetType || body.type || "LOGO";
  const name = body.name;
  let value: any = body.value;
  if (!value) {
    // legacy: {type:"LOGO", fileUrl, name}
    if (body.fileUrl || body.url) value = { fileUrl: body.fileUrl || body.url };
    else value = body;
  }

  if (assetType === "LOGO") {
    await db.brandAsset.updateMany({ where: { assetType: "LOGO", isActive: true }, data: { isActive: false } });
  }
  if (assetType === "BRAND_KIT") {
    // single active kit — archive previous
    await db.brandAsset.updateMany({ where: { assetType: "BRAND_KIT", isActive: true }, data: { isActive: false } });
    // also keep logo in sync if logoUrl provided
    if (value?.logoUrl) {
      await db.brandAsset.updateMany({ where: { assetType: "LOGO", isActive: true }, data: { isActive: false } }).catch(()=>{});
      await db.brandAsset.create({ data: { assetType: "LOGO", name: value.logoName || "ALO Logo", value: JSON.stringify({ fileUrl: value.logoUrl }) } }).catch(()=>{});
    }
  }

  const asset = await db.brandAsset.create({
    data: { assetType, name: name || (assetType === "BRAND_KIT" ? "ALO Brand Kit" : assetType), value: JSON.stringify(value || {}) },
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
