/**
 * GET /api/v1/higher-study/admin/subjects
 * POST /api/v1/higher-study/admin/subjects
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "subject",
  pluralLabel: "Subjects",
  permissions: {
    view: "higher-study.subjects.view",
    create: "higher-study.subjects.create",
    update: "higher-study.subjects.update",
    delete: "higher-study.subjects.delete",
  },
  delegate: db.higherStudySubject as unknown as EntityConfig["delegate"],
  searchFields: ["name", "category", "description"],
  requiredFields: ["name"],
  nameField: "name",
  include: {
    _count: { select: { courses: true } },
  },
  allowedFields: [
    "slug", "name", "category", "description", "iconUrl",
  ],
};

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
