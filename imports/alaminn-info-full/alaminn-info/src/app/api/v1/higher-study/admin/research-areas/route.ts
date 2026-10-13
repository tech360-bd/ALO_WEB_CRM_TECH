/**
 * GET /api/v1/higher-study/admin/research-areas
 * POST /api/v1/higher-study/admin/research-areas
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "research-area",
  pluralLabel: "Research areas",
  permissions: {
    view: "higher-study.research-areas.view",
    create: "higher-study.research-areas.create",
    update: "higher-study.research-areas.update",
    delete: "higher-study.research-areas.delete",
  },
  delegate: db.higherStudyResearchArea as unknown as EntityConfig["delegate"],
  searchFields: ["name", "description"],
  requiredFields: ["name"],
  nameField: "name",
  include: {
    _count: { select: { researchProjects: true, supervisors: true } },
  },
  allowedFields: [
    "slug", "name", "description",
  ],
};

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
