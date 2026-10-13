/**
 * Admin route configs for the English Learning entities.
 * --------------------------------------------------------------------
 * Each export is an `EntityConfig` consumed by the generic admin CRUD
 * factory in `src/lib/english-learning/admin-factory.ts`. Defined here
 * so the collection + detail route files can both import the same
 * config without duplication.
 */
import { db } from "@/lib/db";
import type { EntityConfig } from "@/lib/english-learning/admin-factory";

// ─── Courses ─────────────────────────────────────────────────────────

export const courseConfig: EntityConfig = {
  name: "course",
  pluralLabel: "Courses",
  permissions: {
    view: "english-learning.courses.view",
    create: "english-learning.courses.create",
    update: "english-learning.courses.update",
    delete: "english-learning.courses.delete",
  },
  delegate: db.englishLearningCourse as unknown as EntityConfig["delegate"],
  searchFields: ["title", "summary", "description"],
  requiredFields: ["title"],
  allowedFields: [
    "title",
    "summary",
    "description",
    "level",
    "durationWeeks",
    "hoursPerWeek",
    "priceUsd",
    "currency",
    "isFeatured",
    "isPublished",
    "verificationStatus",
    "publicationStatus",
    "officialSourceUrl",
    "createdByUserId",
    "metaTitle",
    "metaDescription",
    "keywords",
    "tags",
    "heroImageUrl",
    "introVideoUrl",
    "syllabus",
    "prerequisites",
    "targetAudience",
    "learningOutcomes",
    "certificationType",
    "passScore",
    "enrollmentCount",
  ],
  booleanFields: [
    "isFeatured",
    "isPublished",
  ],
  numberFields: [
    "durationWeeks",
    "hoursPerWeek",
    "priceUsd",
    "passScore",
    "enrollmentCount",
  ],
  jsonFields: [
    "keywords",
    "tags",
    "syllabus",
    "prerequisites",
    "targetAudience",
    "learningOutcomes",
  ],
  slugField: "slug",
  nameField: "title",
  hasVerificationStatus: true,
  orderBy: { updatedAt: "desc" },
};

// ─── Lessons ─────────────────────────────────────────────────────────

export const lessonConfig: EntityConfig = {
  name: "lesson",
  pluralLabel: "Lessons",
  permissions: {
    view: "english-learning.lessons.view",
    create: "english-learning.lessons.create",
    update: "english-learning.lessons.update",
    delete: "english-learning.lessons.delete",
  },
  delegate: db.englishLearningLesson as unknown as EntityConfig["delegate"],
  searchFields: ["title", "summary"],
  requiredFields: ["title", "courseId"],
  allowedFields: [
    "title",
    "summary",
    "content",
    "courseId",
    "orderIndex",
    "durationMinutes",
    "lessonType",
    "videoUrl",
    "transcript",
    "isFreePreview",
    "isPublished",
  ],
  booleanFields: ["isFreePreview", "isPublished"],
  numberFields: ["orderIndex", "durationMinutes"],
  slugField: "slug",
  nameField: "title",
  orderBy: { orderIndex: "asc" },
  include: { course: { select: { id: true, slug: true, title: true } } },
};

// ─── Practice Tests ──────────────────────────────────────────────────

export const practiceTestConfig: EntityConfig = {
  name: "practice-test",
  pluralLabel: "Practice tests",
  permissions: {
    view: "english-learning.practice-tests.view",
    create: "english-learning.practice-tests.create",
    update: "english-learning.practice-tests.update",
    delete: "english-learning.practice-tests.delete",
  },
  delegate: db.englishLearningPracticeTest as unknown as EntityConfig["delegate"],
  searchFields: ["title", "description"],
  requiredFields: ["title"],
  allowedFields: [
    "title",
    "description",
    "testType",
    "level",
    "durationMinutes",
    "totalQuestions",
    "passingScore",
    "isPublished",
    "isFeatured",
  ],
  booleanFields: ["isPublished", "isFeatured"],
  numberFields: ["durationMinutes", "totalQuestions", "passingScore"],
  slugField: "slug",
  nameField: "title",
  orderBy: { updatedAt: "desc" },
};

// ─── Questions ───────────────────────────────────────────────────────

export const questionConfig: EntityConfig = {
  name: "question",
  pluralLabel: "Questions",
  permissions: {
    view: "english-learning.questions.view",
    create: "english-learning.questions.create",
    update: "english-learning.questions.update",
    delete: "english-learning.questions.delete",
  },
  delegate: db.englishLearningQuestion as unknown as EntityConfig["delegate"],
  searchFields: ["questionText"],
  requiredFields: ["testId", "questionText"],
  allowedFields: [
    "testId",
    "questionType",
    "questionText",
    "options",
    "correctAnswer",
    "explanation",
    "points",
    "orderIndex",
    "skillArea",
  ],
  numberFields: ["points", "orderIndex"],
  jsonFields: ["options"],
  slugField: "id",
  nameField: "questionText",
  orderBy: { orderIndex: "asc" },
  include: {
    test: { select: { id: true, slug: true, title: true } },
  },
};

// ─── Tutors ──────────────────────────────────────────────────────────

export const tutorConfig: EntityConfig = {
  name: "tutor",
  pluralLabel: "Tutors",
  permissions: {
    view: "english-learning.tutors.view",
    create: "english-learning.tutors.create",
    update: "english-learning.tutors.update",
    delete: "english-learning.tutors.delete",
  },
  delegate: db.englishLearningTutor as unknown as EntityConfig["delegate"],
  searchFields: ["name", "bio"],
  requiredFields: ["name"],
  allowedFields: [
    "name",
    "bio",
    "avatarUrl",
    "specialties",
    "qualifications",
    "yearsExperience",
    "hourlyRateUsd",
    "currency",
    "rating",
    "reviewCount",
    "isAvailable",
    "isPublished",
    "verificationStatus",
    "officialProfileUrl",
  ],
  booleanFields: ["isAvailable", "isPublished"],
  numberFields: ["yearsExperience", "hourlyRateUsd", "reviewCount"],
  jsonFields: ["specialties", "qualifications"],
  slugField: "slug",
  nameField: "name",
  hasVerificationStatus: true,
  orderBy: { updatedAt: "desc" },
};

// ─── Resources ───────────────────────────────────────────────────────

export const resourceConfig: EntityConfig = {
  name: "resource",
  pluralLabel: "Resources",
  permissions: {
    view: "english-learning.resources.view",
    create: "english-learning.resources.create",
    update: "english-learning.resources.update",
    delete: "english-learning.resources.delete",
  },
  delegate: db.englishLearningResource as unknown as EntityConfig["delegate"],
  searchFields: ["title", "summary"],
  requiredFields: ["title"],
  allowedFields: [
    "title",
    "summary",
    "description",
    "resourceType",
    "url",
    "durationMinutes",
    "readingTimeMinutes",
    "level",
    "isPublished",
    "isFeatured",
    "authorName",
    "sourceName",
  ],
  booleanFields: ["isPublished", "isFeatured"],
  numberFields: ["durationMinutes", "readingTimeMinutes"],
  slugField: "slug",
  nameField: "title",
  orderBy: { updatedAt: "desc" },
};
