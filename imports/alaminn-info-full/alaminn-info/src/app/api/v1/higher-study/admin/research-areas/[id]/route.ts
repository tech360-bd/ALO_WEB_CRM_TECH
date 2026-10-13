/**
 * GET /api/v1/higher-study/admin/research-areas/[id]
 * PUT /api/v1/higher-study/admin/research-areas/[id]
 * DELETE /api/v1/higher-study/admin/research-areas/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
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

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
