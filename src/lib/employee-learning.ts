/**
 * Employee Learning Resource Engine
 *
 * Auto-generates learning resources from source changes and content assets.
 */

import { db } from "@/lib/db";

export type LearningResourceType =
  | "UNIVERSITY_UPDATE"
  | "VISA_UPDATE"
  | "COURSE_UPDATE"
  | "SCHOLARSHIP_UPDATE"
  | "MARKETING_RESOURCE"
  | "KNOWLEDGE_ARTICLE"
  | "TRAINING_VIDEO";

export type LearningResourceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export async function createLearningResourceFromChange(
  sourceChangeId: string
): Promise<{ resourceId: string }> {
  const change = await db.sourceChangeEvent.findUnique({
    where: { id: sourceChangeId },
  }).catch(() => null);

  if (!change) return { resourceId: "" };

  const resource = await db.employeeLearningResource.create({
    data: {
      title: `${change.changeType}: ${change.fieldName || "University Update"}`,
      resourceType: "UNIVERSITY_UPDATE",
      content: `Source: ${change.sourceUrl}\nField: ${change.fieldName}\nChanged from: ${change.changedFrom}\nChanged to: ${change.changedTo}`,
      sourceChangeId,
      status: "DRAFT",
    },
  }).catch(() => null);

  return { resourceId: resource?.id || "" };
}

export async function createLearningResourceFromContent(
  contentAssetId: string,
  resourceType: LearningResourceType = "KNOWLEDGE_ARTICLE"
): Promise<{ resourceId: string }> {
  const asset = await db.contentAsset.findUnique({
    where: { id: contentAssetId },
    select: { title: true, body: true, excerpt: true },
  }).catch(() => null);

  if (!asset) return { resourceId: "" };

  const resource = await db.employeeLearningResource.create({
    data: {
      title: asset.title,
      resourceType,
      content: asset.body || asset.excerpt || "",
      contentAssetId,
      status: "DRAFT",
    },
  }).catch(() => null);

  return { resourceId: resource?.id || "" };
}

export async function publishLearningResource(
  resourceId: string,
  publisherId: string
): Promise<void> {
  await db.employeeLearningResource.update({
    where: { id: resourceId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  }).catch(() => {});
}

export async function getEmployeeLearningResources(
  department?: string,
  role?: string
): Promise<any[]> {
  return await db.employeeLearningResource.findMany({
    where: {
      status: "PUBLISHED",
      ...(department ? { department } : {}),
      ...(role ? { role } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  }).catch(() => []);
}
