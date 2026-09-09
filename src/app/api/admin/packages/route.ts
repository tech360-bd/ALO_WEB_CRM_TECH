// ============================================================
// /api/admin/packages
// GET    — List all partner packages (super_admin only)
// POST   — Create a new package (super_admin only)
// PUT    — Update a package by id in body (super_admin only)
// DELETE — Deactivate a package — sets isActive=false (super_admin only)
// ============================================================

import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

// ------------------------------------------------------------
// Guard: super_admin only
// ------------------------------------------------------------
function superAdminOnly(auth: any): NextResponse | null {
  if (!auth.roles.includes('super_admin')) {
    return NextResponse.json(
      { success: false, status: 403, error: 'Super admin access required.' },
      { status: 403 }
    );
  }
  return null;
}

// ------------------------------------------------------------
// Helper: build slug from name
// ------------------------------------------------------------
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================
// GET: All packages
// ============================================================
async function handleGet(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;

    const packages = await db.partnerPackage.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Packages fetched successfully.',
      data: packages,
    });
  } catch (error: any) {
    console.error('Admin packages GET error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'PartnerPackage table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to fetch packages.' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: Create package
// ============================================================
async function handlePost(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const {
      name,
      slug: inputSlug,
      description,
      price,
      billingCycle,
      isActive,
      sortOrder,
      maxUsers,
      maxImages,
      maxVideos,
      videoMaxLength,
      maxLeads,
      features: inputFeatures,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, status: 400, error: 'Package name is required.' },
        { status: 400 }
      );
    }

    const slug = inputSlug || slugify(name);

    // Check for duplicate name or slug
    const existing = await db.partnerPackage.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, status: 409, error: 'A package with this name or slug already exists.' },
        { status: 409 }
      );
    }

    const pkg = await db.partnerPackage.create({
      data: {
        name,
        slug,
        description: description || '',
        price: price ?? 0,
        billingCycle: billingCycle || 'monthly',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ?? 0,
        maxUsers: maxUsers ?? 1,
        maxImages: maxImages ?? 0,
        maxVideos: maxVideos ?? 0,
        videoMaxLength: videoMaxLength ?? 0,
        maxLeads: maxLeads ?? 0,
        features: typeof inputFeatures === 'string' ? inputFeatures : JSON.stringify(inputFeatures || []),
      },
    });

    await logAuditAction(auth, 'create_package', 'PartnerPackage', pkg.id, {
      name: pkg.name,
      slug: pkg.slug,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Package created successfully.',
      data: pkg,
    });
  } catch (error: any) {
    console.error('Admin packages POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, status: 409, error: 'A package with this name or slug already exists.' },
        { status: 409 }
      );
    }
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'PartnerPackage table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to create package.' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT: Update package (id in body)
// ============================================================
async function handlePut(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, status: 400, error: 'id is required.' },
        { status: 400 }
      );
    }

    const existing = await db.partnerPackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, status: 404, error: 'Package not found.' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowed = [
      'name', 'slug', 'description', 'price', 'billingCycle',
      'isActive', 'sortOrder', 'maxUsers', 'maxImages', 'maxVideos',
      'videoMaxLength', 'maxLeads', 'features',
    ];

    for (const field of allowed) {
      if (fields[field] !== undefined) {
        if (field === 'slug') {
          updateData.slug = slugify(fields.slug);
        } else if (field === 'features') {
          updateData.features = typeof fields.features === 'string'
            ? fields.features
            : JSON.stringify(fields.features);
        } else {
          updateData[field] = fields[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, status: 400, error: 'No fields provided to update.' },
        { status: 400 }
      );
    }

    const updated = await db.partnerPackage.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction(auth, 'update_package', 'PartnerPackage', id, {
      name: updated.name,
      changedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Package updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Admin packages PUT error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, status: 409, error: 'A package with this name or slug already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to update package.' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE: Deactivate package (sets isActive=false)
// ============================================================
async function handleDelete(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, status: 400, error: 'id is required.' },
        { status: 400 }
      );
    }

    const existing = await db.partnerPackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, status: 404, error: 'Package not found.' },
        { status: 404 }
      );
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { success: false, status: 400, error: 'Package is already inactive.' },
        { status: 400 }
      );
    }

    const deactivated = await db.partnerPackage.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditAction(auth, 'deactivate_package', 'PartnerPackage', id, {
      name: deactivated.name,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Package deactivated successfully.',
      data: deactivated,
    });
  } catch (error: any) {
    console.error('Admin packages DELETE error:', error);
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to deactivate package.' },
      { status: 500 }
    );
  }
}

// ============================================================
// Route handlers
// ============================================================
export const GET = handleGet;
export const POST = handlePost;
export const PUT = handlePut;
export const DELETE = handleDelete;
