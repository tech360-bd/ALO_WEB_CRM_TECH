/**
 * GET /api/v1/higher-study/admin/events
 * POST /api/v1/higher-study/admin/events
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "event",
  pluralLabel: "Events",
  permissions: {
    view: "higher-study.events.view",
    create: "higher-study.events.create",
    update: "higher-study.events.update",
    delete: "higher-study.events.delete",
  },
  delegate: db.higherStudyEvent as unknown as EntityConfig["delegate"],
  searchFields: ["title", "description", "location"],
  requiredFields: ["title", "eventDate"],
  nameField: "title",
  dateFields: ["eventDate", "endDate"],
  allowedFields: [
    "slug", "title", "description", "eventDate", "endDate",
    "location", "organiser", "registrationUrl", "imageUrl", "status",
  ],
};

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
