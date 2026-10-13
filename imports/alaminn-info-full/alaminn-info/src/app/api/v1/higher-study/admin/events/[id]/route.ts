/**
 * GET /api/v1/higher-study/admin/events/[id]
 * PUT /api/v1/higher-study/admin/events/[id]
 * DELETE /api/v1/higher-study/admin/events/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
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

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
