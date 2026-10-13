/**
 * GET /api/v1/higher-study/admin/intakes
 * POST /api/v1/higher-study/admin/intakes
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
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

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
