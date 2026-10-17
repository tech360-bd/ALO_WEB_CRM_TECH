import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingAccess, requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Brand assets manager.
 * - GET: any marketing access.
 * - POST/PUT/DELETE: marketing_manager / super_admin.
 * - DELETE: soft-delete (status='deleted') and audit `brand_asset.logo_deleted`.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const assets = await db.brandAsset.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    const primaryLogo = assets.find((a) => a.assetType === 'logo' && a.isPrimary);
    const brandColors = assets.filter((a) => a.assetType === 'color_palette');
    return NextResponse.json({ assets, primaryLogo, brandColors });
  } catch (error) {
    console.error('Brand assets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    if (!body.assetType || !body.name) {
      return NextResponse.json(
        { error: 'assetType and name are required' },
        { status: 400 }
      );
    }
    // If setting as primary, unset other primaries of same type
    if (body.isPrimary) {
      await db.brandAsset.updateMany({
        where: { assetType: body.assetType, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    const asset = await db.brandAsset.create({
      data: {
        assetType: body.assetType,
        name: body.name,
        fileUrl: body.fileUrl || null,
        value: body.value || null,
        isPrimary: body.isPrimary || false,
        uploadedBy: body.uploadedBy || auth.user.id,
        status: 'active',
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'brand_asset.created',
      module: 'marketing',
      recordId: asset.id,
      newData: asset,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('Brand assets POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const existing = await db.brandAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (updateData.isPrimary) {
      await db.brandAsset.updateMany({
        where: { assetType: existing.assetType, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }
    const asset = await db.brandAsset.update({ where: { id }, data: updateData });

    await logAudit({
      userId: auth.user.id,
      action: 'brand_asset.updated',
      module: 'marketing',
      recordId: asset.id,
      oldData: existing,
      newData: asset,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('Brand assets PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.brandAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Soft delete by marking status='deleted'
    await db.brandAsset.update({
      where: { id },
      data: { status: 'deleted', isPrimary: false },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'brand_asset.logo_deleted',
      module: 'marketing',
      recordId: id,
      oldData: existing,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Brand assets DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
