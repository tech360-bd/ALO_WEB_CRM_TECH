/**
 * GET /api/v1/higher-study/admin/research/[id]
 * PUT /api/v1/higher-study/admin/research/[id]
 * DELETE /api/v1/higher-study/admin/research/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "research",
  pluralLabel: "Research projects",
  permissions: {
    view: "higher-study.research.view",
    create: "higher-study.research.create",
    update: "higher-study.research.update",
    delete: "higher-study.research.delete",
  },
  delegate: db.higherStudyResearchProject as unknown as EntityConfig["delegate"],
  searchFields: ["title", "projectSummary", "researchObjectives", "candidateProfile"],
  requiredFields: ["title", "universityId"],
  nameField: "title",
  hasVerificationStatus: true,
  include: {
    university: { select: { id: true, slug: true, officialName: true } },
    researchArea: { select: { id: true, slug: true, name: true } },
    supervisor: { select: { id: true, slug: true, name: true } },
  },
  booleanFields: ["tuitionCoverage", "featured"],
  dateFields: ["startDate", "applicationDeadline"],
  allowedFields: [
    "slug", "title", "universityId", "department", "researchGroupId",
    "researchAreaId", "supervisorId", "coSupervisorId", "projectSummary",
    "researchObjectives", "methodologySummary", "candidateProfile",
    "academicRequirements", "englishRequirements", "fundingStatus",
    "tuitionCoverage", "stipend", "additionalFunding", "duration",
    "startDate", "applicationDeadline", "requiredDocuments",
    "applicationProcess", "officialSourceUrl", "verificationStatus",
    "publicationStatus", "featured", "lastVerifiedAt", "lastVerifiedBy",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
