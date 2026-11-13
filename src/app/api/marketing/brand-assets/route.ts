import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

// Brand kit values are internal-approved copy, not channel credentials.
export const GET = withMarketingAccess(async (_req: Request, _auth: AuthContext) => {
  try {
    const assets = await db.brandAsset.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    const kitAsset = assets.find((asset) => asset.assetType === 'BRAND_KIT');
    let brandKit: Record<string, unknown> | null = null;
    try { brandKit = kitAsset ? JSON.parse(kitAsset.value || '{}') : null; } catch { brandKit = {}; }
    const logoAsset = assets.find((asset) => asset.assetType === 'LOGO');
    let logoVal: Record<string, unknown> | null = null;
    try { logoVal = logoAsset ? JSON.parse(logoAsset.value || '{}') : null; } catch { logoVal = {}; }
    return NextResponse.json({ success: true, assets, brandKit, logoVal });
  } catch (error) {
    console.error('[marketing.brand-assets] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load approved brand assets.' }, { status: 503 });
  }
}, 'brand-read');

// Only a Marketing Manager/Super Admin can change official brand assets.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  const assetType = String(body.assetType || body.type || 'LOGO').trim().toUpperCase();
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  let value: Record<string, unknown>;
  const suppliedValue = body.value && typeof body.value === 'object' && !Array.isArray(body.value)
    ? body.value as Record<string, unknown>
    : null;
  if (assetType === 'LOGO') {
    const fileUrl = suppliedValue?.fileUrl ?? body.fileUrl ?? body.url;
    if (!validHttpsUrl(fileUrl)) return NextResponse.json({ success: false, error: 'Logo must use a valid HTTPS asset URL.' }, { status: 400 });
    value = { fileUrl };
  } else if (assetType === 'BRAND_KIT') {
    if (!suppliedValue) return NextResponse.json({ success: false, error: 'Brand kit values are required.' }, { status: 400 });
    const textFields = ['logoName', 'address', 'phone', 'whatsapp', 'website'] as const;
    value = {};
    for (const field of textFields) {
      const input = suppliedValue[field];
      if (input !== undefined && typeof input !== 'string') return NextResponse.json({ success: false, error: `Invalid ${field}.` }, { status: 400 });
      if (typeof input === 'string' && input.length > 500) return NextResponse.json({ success: false, error: `${field} is too long.` }, { status: 400 });
      if (typeof input === 'string') value[field] = input.trim();
    }
    for (const colorField of ['primary', 'cta']) {
      const color = suppliedValue[colorField];
      if (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))) {
        return NextResponse.json({ success: false, error: `Invalid ${colorField} color.` }, { status: 400 });
      }
      if (typeof color === 'string') value[colorField] = color.toUpperCase();
    }
    if (value.website && !validHttpsUrl(value.website)) return NextResponse.json({ success: false, error: 'Website must use HTTPS.' }, { status: 400 });
    if (suppliedValue.logoUrl !== undefined) {
      if (!validHttpsUrl(suppliedValue.logoUrl)) return NextResponse.json({ success: false, error: 'Brand kit logo must use a valid HTTPS asset URL.' }, { status: 400 });
      value.logoUrl = suppliedValue.logoUrl;
    }
  } else {
    return NextResponse.json({ success: false, error: 'Only LOGO and BRAND_KIT assets can be managed here.' }, { status: 400 });
  }

  try {
    const created = await db.$transaction(async (tx) => {
      await tx.brandAsset.updateMany({ where: { assetType, isActive: true }, data: { isActive: false } });
      if (assetType === 'BRAND_KIT' && typeof value.logoUrl === 'string') {
        await tx.brandAsset.updateMany({ where: { assetType: 'LOGO', isActive: true }, data: { isActive: false } });
        await tx.brandAsset.create({ data: { assetType: 'LOGO', name: String(value.logoName || 'ALO Logo'), value: JSON.stringify({ fileUrl: value.logoUrl }), createdById: auth.userId } });
      }
      return tx.brandAsset.create({
        data: { assetType, name: name || (assetType === 'BRAND_KIT' ? 'ALO Brand Kit' : 'ALO Logo'), value: JSON.stringify(value), createdById: auth.userId },
      });
    });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'BrandAsset', resourceId: created.id, details: JSON.stringify({ assetType, name: created.name }) } });
    return NextResponse.json({ success: true, asset: created, message: 'Brand asset saved internally. This does not upload or publish to a social provider.' }, { status: 201 });
  } catch (error) {
    console.error('[marketing.brand-assets] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to save brand asset.' }, { status: 503 });
  }
}, 'manager');

export const PATCH = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as { id?: unknown; isActive?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id || typeof body?.isActive !== 'boolean') return NextResponse.json({ success: false, error: 'id and boolean isActive are required.' }, { status: 400 });
  try {
    const existing = await db.brandAsset.findUnique({ where: { id }, select: { id: true, assetType: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Brand asset not found.' }, { status: 404 });
    const asset = await db.brandAsset.update({ where: { id }, data: { isActive: body.isActive } });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'PERMISSION_CHANGE', resource: 'BrandAsset', resourceId: id, details: JSON.stringify({ assetType: existing.assetType, isActive: body.isActive }) } });
    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('[marketing.brand-assets] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update brand asset.' }, { status: 503 });
  }
}, 'manager');
