/**
 * GET /api/v1/higher-study/admin/resources
 * POST /api/v1/higher-study/admin/resources
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "resource",
  pluralLabel: "Resources",
  permissions: {
    view: "higher-study.resources.view",
    create: "higher-study.resources.create",
    update: "higher-study.resources.update",
    delete: "higher-study.resources.delete",
  },
  delegate: db.higherStudyResource as unknown as EntityConfig["delegate"],
  searchFields: ["title", "summary", "content"],
  requiredFields: ["title"],
  nameField: "title",
  hasVerificationStatus: true,
  booleanFields: ["featured"],
  numberFields: ["readingTimeMinutes"],
  dateFields: ["publishedAt", "lastVerifiedAt"],
  allowedFields: [
    "slug", "title", "category", "summary", "content", "author",
    "reviewer", "publishedAt", "lastVerifiedAt", "readingTimeMinutes",
    "tableOfContents", "relatedUniversitySlugs", "relatedCourseSlugs",
    "relatedScholarshipSlugs", "officialSourceUrl", "verificationStatus",
    "publicationStatus", "featured",
  ],
};

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
