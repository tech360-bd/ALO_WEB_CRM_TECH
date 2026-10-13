/**
 * GET /api/v1/higher-study/admin/subjects/[id]
 * PUT /api/v1/higher-study/admin/subjects/[id]
 * DELETE /api/v1/higher-study/admin/subjects/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
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

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
