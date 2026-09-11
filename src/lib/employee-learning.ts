// ============================================================
// EMPLOYEE LEARNING
// Auto-generates learning resources from source changes & content assets.
// ============================================================

import { db } from "@/lib/db";

// ─── Create from Source Change ───

/**
 * Auto-generate an EmployeeLearningResource (type=UNIVERSITY_UPDATE, status=DRAFT)
 * from a SourceChangeEvent. Useful for keeping counselors informed about
 * tuition/deadline changes at partner universities.
 */
export async function createLearningResourceFromChange(sourceChangeId: string) {
  const change = await db.sourceChangeEvent.findUnique({ where: { id: sourceChangeId } });
  if (!change) throw new Error("SourceChangeEvent not found");

  const title = `University Update: ${change.universitySlug || change.entityType} — ${change.fieldName || change.changeType}`;

  const content = [
    `# ${title}`,
    "",
    `**Source URL:** ${change.sourceUrl}`,
    `**Entity Type:** ${change.entityType}`,
    change.universitySlug ? `**University:** ${change.universitySlug}` : null,
    change.courseSlug ? `**Course:** ${change.courseSlug}` : null,
    `**Change Type:** ${change.changeType}`,
    change.fieldName ? `**Field Changed:** ${change.fieldName}` : null,
    "",
    "## Change Details",
    change.changedFrom ? `**Before:** ${change.changedFrom}` : null,
    change.changedTo ? `**After:** ${change.changedTo}` : null,
    "",
    `**AI Assessment:** ${change.aiAssessment || "(not yet assessed)"}`,
    `**Materiality:** ${change.materiality || "(unknown)"}`,
    `**Confidence:** ${(change.confidence * 100).toFixed(0)}%`,
    "",
    "## Action Items for Counselors",
    "- Verify the change on the official university website.",
    "- Update affected student applications & recommendations.",
    "- Communicate impact to students currently in pipeline.",
    "- Update internal knowledge base & course finder data.",
  ]
    .filter(Boolean)
    .join("\n");

  const resource = await db.employeeLearningResource.create({
    data: {
      title,
      resourceType: "UNIVERSITY_UPDATE",
      content,
      sourceChangeId,
      status: "DRAFT",
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "EmployeeLearningResource",
      resourceId: resource.id,
      details: JSON.stringify({
        action: "AUTO_GENERATED_FROM_SOURCE_CHANGE",
        sourceChangeId,
      }),
    },
  });

  return resource;
}

// ─── Create from Content Asset ───

export async function createLearningResourceFromContent(
  contentAssetId: string,
  resourceType: string
) {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error("ContentAsset not found");

  const title = `Training: ${asset.title}`;

  const resource = await db.employeeLearningResource.create({
    data: {
      title,
      resourceType,
      content: asset.body,
      contentAssetId,
      status: "DRAFT",
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "EmployeeLearningResource",
      resourceId: resource.id,
      details: JSON.stringify({
        action: "AUTO_GENERATED_FROM_CONTENT",
        contentAssetId,
        resourceType,
      }),
    },
  });

  return resource;
}

// ─── Publish ───

export async function publishLearningResource(resourceId: string, publisherId: string) {
  const resource = await db.employeeLearningResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new Error("EmployeeLearningResource not found");
  if (resource.status === "PUBLISHED") {
    return { resource, message: "Already published.", idempotent: true };
  }

  const updated = await db.employeeLearningResource.update({
    where: { id: resourceId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: publisherId,
      action: "PUBLIC_PUBLISH",
      resource: "EmployeeLearningResource",
      resourceId,
      details: JSON.stringify({ action: "PUBLISHED", title: resource.title }),
    },
  });

  return { resource: updated, message: "Learning resource published." };
}

// ─── List ───

export async function getEmployeeLearningResources(department?: string | null, role?: string | null) {
  const where: any = { status: "PUBLISHED" };
  if (department) {
    where.OR = [
      { department },
      { department: null }, // null department = "all departments"
    ];
  }
  if (role) {
    const existingOr = where.OR;
    const roleFilter = [{ role }, { role: null }];
    where.OR = existingOr ? [...existingOr, ...roleFilter] : roleFilter;
  }

  const resources = await db.employeeLearningResource.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return resources;
}
