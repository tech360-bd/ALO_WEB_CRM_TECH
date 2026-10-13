/**
 * GET /api/v1/higher-study/admin/cities
 * POST /api/v1/higher-study/admin/cities
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "city",
  pluralLabel: "Cities",
  permissions: {
    view: "higher-study.cities.view",
    create: "higher-study.cities.create",
    update: "higher-study.cities.update",
    delete: "higher-study.cities.delete",
  },
  delegate: db.higherStudyCity as unknown as EntityConfig["delegate"],
  searchFields: ["name"],
  requiredFields: ["name", "countryId"],
  nameField: "name",
  include: {
    country: { select: { id: true, slug: true, name: true } },
    _count: { select: { universities: true } },
  },
  allowedFields: [
    "slug", "name", "countryId", "overview", "livingCost",
    "transport", "accommodation", "studentLife", "status",
  ],
};

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
