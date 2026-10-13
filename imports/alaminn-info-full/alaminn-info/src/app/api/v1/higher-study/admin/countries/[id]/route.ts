/**
 * GET /api/v1/higher-study/admin/countries/[id]
 * PUT /api/v1/higher-study/admin/countries/[id]
 * DELETE /api/v1/higher-study/admin/countries/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "country",
  pluralLabel: "Countries",
  permissions: {
    view: "higher-study.countries.view",
    create: "higher-study.countries.create",
    update: "higher-study.countries.update",
    delete: "higher-study.countries.delete",
  },
  delegate: db.higherStudyCountry as unknown as EntityConfig["delegate"],
  searchFields: ["name", "officialName", "region"],
  requiredFields: ["name"],
  nameField: "name",
  include: {
    cities: { select: { id: true, slug: true, name: true } },
    _count: {
      select: {
        universities: true, courses: true, scholarships: true,
      },
    },
  },
  booleanFields: ["scholarshipsAvailable", "researchOpportunities"],
  dateFields: ["lastVerifiedAt"],
  allowedFields: [
    "slug", "name", "officialName", "region", "overview",
    "educationSystem", "studyLevels", "popularSubjects", "tuitionFeeRange",
    "livingCostRange", "majorStudentCities", "admissionRequirements",
    "englishRequirements", "availableIntakes", "applicationDeadlines",
    "scholarshipsAvailable", "researchOpportunities", "studentVisaOverview",
    "financialEvidence", "workRights", "postStudyOpportunities",
    "accommodation", "healthcare", "transport", "studentSafety",
    "culturalInfo", "applicationProcess", "requiredDocuments", "faq",
    "officialSources", "imageUrl", "flagEmoji", "status", "lastVerifiedAt",
    "lastVerifiedBy", "officialSourceUrl",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
