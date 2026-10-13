/**
 * GET /api/v1/higher-study/admin/supervisors/[id]
 * PUT /api/v1/higher-study/admin/supervisors/[id]
 * DELETE /api/v1/higher-study/admin/supervisors/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "supervisor",
  pluralLabel: "Supervisors",
  permissions: {
    view: "higher-study.supervisors.view",
    create: "higher-study.supervisors.create",
    update: "higher-study.supervisors.update",
    delete: "higher-study.supervisors.delete",
  },
  delegate: db.higherStudySupervisor as unknown as EntityConfig["delegate"],
  searchFields: ["name", "department", "researchInterests"],
  requiredFields: ["name", "universityId"],
  nameField: "name",
  hasVerificationStatus: true,
  include: {
    university: { select: { id: true, slug: true, officialName: true } },
    researchArea: { select: { id: true, slug: true, name: true } },
  },
  booleanFields: ["acceptingStudents"],
  allowedFields: [
    "slug", "name", "academicTitle", "universityId", "department",
    "publicProfileUrl", "researchAreaId", "researchInterests",
    "selectedPublications", "currentProjects", "acceptingStudents",
    "applicationGuidance", "verificationStatus", "publicationStatus",
    "officialSourceUrl", "lastVerifiedAt", "lastVerifiedBy",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
