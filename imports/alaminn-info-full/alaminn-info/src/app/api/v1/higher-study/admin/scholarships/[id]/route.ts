/**
 * GET /api/v1/higher-study/admin/scholarships/[id]
 * PUT /api/v1/higher-study/admin/scholarships/[id]
 * DELETE /api/v1/higher-study/admin/scholarships/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "scholarship",
  pluralLabel: "Scholarships",
  permissions: {
    view: "higher-study.scholarships.view",
    create: "higher-study.scholarships.create",
    update: "higher-study.scholarships.update",
    delete: "higher-study.scholarships.delete",
  },
  delegate: db.higherStudyScholarship as unknown as EntityConfig["delegate"],
  searchFields: ["name", "provider", "fundingAmount", "otherBenefits"],
  requiredFields: ["name"],
  nameField: "name",
  hasVerificationStatus: true,
  include: {
    country: { select: { id: true, slug: true, name: true } },
    university: { select: { id: true, slug: true, officialName: true } },
  },
  booleanFields: [
    "tuitionCoverage", "livingCostCoverage", "travelSupport",
    "healthInsurance", "workExperienceRequired", "featured",
  ],
  dateFields: ["openingDate", "deadline"],
  allowedFields: [
    "slug", "name", "provider", "countryId", "universityId",
    "eligibleStudyLevels", "eligibleSubjects", "eligibleNationalities",
    "fundingType", "fundingAmount", "tuitionCoverage", "livingCostCoverage",
    "travelSupport", "healthInsurance", "otherBenefits",
    "eligibilityCriteria", "academicRequirement", "englishRequirement",
    "workExperienceRequired", "requiredDocuments", "openingDate", "deadline",
    "applicationProcess", "selectionProcess", "restrictions",
    "officialSourceUrl", "verificationStatus", "publicationStatus",
    "featured", "lastVerifiedAt", "lastVerifiedBy",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
