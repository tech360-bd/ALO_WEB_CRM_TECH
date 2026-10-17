import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// ============================================================
// CONTENT EDITOR API - Save/Load Canvas Designs
// ============================================================

// ----------------------------------------------------------
// POST - Save a canvas design (create or update)
// ----------------------------------------------------------
export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, templateType, width, height, layers, designId, contentType } = body;

    if (!name || !templateType) {
      return NextResponse.json(
        { error: 'Name and templateType are required' },
        { status: 400 }
      );
    }

    // Store canvas dimensions in sizeTemplate as JSON string
    const sizeTemplate = JSON.stringify({ width: width || 1200, height: height || 630 });

    // If designId provided, update existing; otherwise create new
    if (designId) {
      // Delete old layers and recreate
      await db.contentEditorLayer.deleteMany({
        where: { contentId: designId },
      });

      const updated = await db.marketingContent.update({
        where: { id: designId },
        data: {
          title: name,
          platform: templateType,
          sizeTemplate,
          status: 'draft',
        },
      });

      // Create new layers using actual schema fields
      if (layers && Array.isArray(layers)) {
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          await db.contentEditorLayer.create({
            data: {
              contentId: updated.id,
              layerType: layer.type || 'text',
              text: layer.text || null,
              fontFamily: layer.fontFamily || null,
              fontSize: layer.fontSize ? parseInt(String(layer.fontSize)) : null,
              fontWeight: layer.fontWeight || null,
              fontColor: layer.color || layer.fontColor || null,
              bgColor: layer.fill || layer.bgColor || null,
              alignment: layer.textAlign || layer.alignment || null,
              x: layer.x ?? 0,
              y: layer.y ?? 0,
              width: layer.width ?? null,
              height: layer.height ?? null,
              rotation: layer.rotation ?? 0,
              zIndex: i,
              borderRadius: layer.borderRadius ?? null,
              textShadow: layer.textShadow || null,
              opacity: layer.opacity ?? 1,
              layerOrder: i,
            },
          });
        }
      }

      return NextResponse.json({
        message: 'Design updated successfully',
        designId: updated.id,
      });
    }

    // Create new design
    const newDesign = await db.marketingContent.create({
      data: {
        title: name,
        platform: templateType,
        contentType: contentType || 'social_post',
        sizeTemplate,
        status: 'draft',
      },
    });

    // Create layers using actual schema fields
    if (layers && Array.isArray(layers)) {
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        await db.contentEditorLayer.create({
          data: {
            contentId: newDesign.id,
            layerType: layer.type || 'text',
            text: layer.text || null,
            fontFamily: layer.fontFamily || null,
            fontSize: layer.fontSize ? parseInt(String(layer.fontSize)) : null,
            fontWeight: layer.fontWeight || null,
            fontColor: layer.color || layer.fontColor || null,
            bgColor: layer.fill || layer.bgColor || null,
            alignment: layer.textAlign || layer.alignment || null,
            x: layer.x ?? 0,
            y: layer.y ?? 0,
            width: layer.width ?? null,
            height: layer.height ?? null,
            rotation: layer.rotation ?? 0,
            zIndex: i,
            borderRadius: layer.borderRadius ?? null,
            textShadow: layer.textShadow || null,
            opacity: layer.opacity ?? 1,
            layerOrder: i,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Design saved successfully',
      designId: newDesign.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[Content Editor API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save design', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// GET - List or retrieve designs
// ----------------------------------------------------------
export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');
    const templateType = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (designId) {
      // Get specific design with layers
      const design = await db.marketingContent.findUnique({
        where: { id: designId },
        include: { layers: { orderBy: { layerOrder: 'asc' } } },
      });

      if (!design) {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 });
      }

      // Parse canvas dimensions from sizeTemplate
      let canvasData: { width?: number; height?: number } = {};
      if (design.sizeTemplate) {
        try {
          canvasData = JSON.parse(design.sizeTemplate);
        } catch {
          canvasData = {};
        }
      }

      // Reconstruct layers from actual model fields
      const parsedLayers = design.layers.map((layer) => ({
        id: layer.id,
        type: layer.layerType,
        zIndex: layer.zIndex,
        layerOrder: layer.layerOrder,
        text: layer.text,
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize,
        fontWeight: layer.fontWeight,
        color: layer.fontColor,
        bgColor: layer.bgColor,
        fill: layer.bgColor, // alias for canvas editor compatibility
        alignment: layer.alignment,
        textAlign: layer.alignment, // alias for canvas editor compatibility
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation,
        borderRadius: layer.borderRadius,
        textShadow: layer.textShadow,
        opacity: layer.opacity,
      }));

      return NextResponse.json({
        id: design.id,
        name: design.title,
        templateType: design.platform,
        width: canvasData.width || 1200,
        height: canvasData.height || 630,
        layers: parsedLayers,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt,
      });
    }

    // List designs
    const where: Record<string, unknown> = {};
    if (templateType) where.platform = templateType;

    const skip = (page - 1) * limit;
    const [designs, total] = await Promise.all([
      db.marketingContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          platform: true,
          status: true,
          sizeTemplate: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { layers: true } },
        },
      }),
      db.marketingContent.count({ where }),
    ]);

    return NextResponse.json({
      designs: designs.map((d) => ({
        id: d.id,
        name: d.title,
        templateType: d.platform,
        status: d.status,
        layerCount: d._count.layers,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Content Editor API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve designs' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// DELETE - Delete a design
// ----------------------------------------------------------
export async function DELETE(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');

    if (!designId) {
      return NextResponse.json({ error: 'Design ID required' }, { status: 400 });
    }

    // Delete layers first (though Cascade should handle this, explicit is safer)
    await db.contentEditorLayer.deleteMany({
      where: { contentId: designId },
    });

    // Delete design
    await db.marketingContent.delete({
      where: { id: designId },
    });

    return NextResponse.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('[Content Editor API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}
