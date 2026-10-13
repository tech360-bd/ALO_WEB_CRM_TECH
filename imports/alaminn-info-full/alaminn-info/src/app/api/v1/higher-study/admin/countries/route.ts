/**
 * GET /api/v1/higher-study/admin/countries
 * POST /api/v1/higher-study/admin/countries
 */
import { db } from "@/lib/db";
import {
  makeListHandler,
  makeCreateHandler,
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
    _count: {
      select: {
        universities: true, courses: true, scholarships: true, cities: true,
      },
    },
  },
  booleanFields: ["scholarshipsAvailable", "researchOpportunities"],
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

export const GET = makeListHandler(config);
export const POST = makeCreateHandler(config);
