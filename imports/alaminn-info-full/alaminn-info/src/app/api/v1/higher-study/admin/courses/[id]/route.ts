/**
 * GET /api/v1/higher-study/admin/courses/[id]
 * PUT /api/v1/higher-study/admin/courses/[id]
 * DELETE /api/v1/higher-study/admin/courses/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "course",
  pluralLabel: "Courses",
  permissions: {
    view: "higher-study.courses.view",
    create: "higher-study.courses.create",
    update: "higher-study.courses.update",
    delete: "higher-study.courses.delete",
  },
  delegate: db.higherStudyCourse as unknown as EntityConfig["delegate"],
  searchFields: ["title", "specialisation", "qualification", "overview"],
  requiredFields: ["title", "universityId"],
  nameField: "title",
  hasVerificationStatus: true,
  include: {
    university: { select: { id: true, slug: true, officialName: true } },
    country: { select: { id: true, slug: true, name: true } },
    subject: { select: { id: true, slug: true, name: true } },
    intake: { select: { id: true, slug: true, name: true } },
  },
  booleanFields: [
    "scholarshipAvailable", "workExperienceRequired", "portfolioRequired",
    "interviewRequired", "featured",
  ],
  numberFields: ["tuitionFee"],
  allowedFields: [
    "slug", "title", "universityId", "countryId", "subjectId", "studyLevel",
    "qualification", "specialisation", "overview", "modules", "duration",
    "studyMode", "tuitionFee", "tuitionCurrency", "otherCosts",
    "scholarshipAvailable", "academicEntryRequirements",
    "countrySpecificRequirements", "englishRequirements",
    "workExperienceRequired", "portfolioRequired", "interviewRequired",
    "careerOutcomes", "placementInfo", "researchComponent",
    "applicationDeadline", "requiredDocuments", "intakeId",
    "officialSourceUrl", "verificationStatus", "publicationStatus",
    "featured", "lastVerifiedAt", "lastVerifiedBy",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
