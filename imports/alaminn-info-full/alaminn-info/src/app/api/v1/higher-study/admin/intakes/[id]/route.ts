/**
 * GET /api/v1/higher-study/admin/intakes/[id]
 * PUT /api/v1/higher-study/admin/intakes/[id]
 * DELETE /api/v1/higher-study/admin/intakes/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "intake",
  pluralLabel: "Intakes",
  permissions: {
    view: "higher-study.intakes.view",
    create: "higher-study.intakes.create",
    update: "higher-study.intakes.update",
    delete: "higher-study.intakes.delete",
  },
  delegate: db.higherStudyIntake as unknown as EntityConfig["delegate"],
  searchFields: ["name", "slug"],
  requiredFields: ["name"],
  nameField: "name",
  include: {
    _count: { select: { courses: true } },
  },
  dateFields: ["startDate", "endDate", "applicationDeadline"],
  allowedFields: [
    "slug", "name", "startDate", "endDate", "applicationDeadline", "status",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
