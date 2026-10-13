/**
 * GET /api/v1/higher-study/admin/student-stories/[id]
 * PUT /api/v1/higher-study/admin/student-stories/[id]
 * DELETE /api/v1/higher-study/admin/student-stories/[id]
 */
import { db } from "@/lib/db";
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
  type EntityConfig,
} from "@/lib/higher-study/admin-factory";

const config: EntityConfig = {
  name: "student-story",
  pluralLabel: "Student stories",
  permissions: {
    view: "higher-study.student-stories.view",
    create: "higher-study.student-stories.create",
    update: "higher-study.student-stories.update",
    delete: "higher-study.student-stories.delete",
  },
  delegate: db.higherStudyStudentStory as unknown as EntityConfig["delegate"],
  searchFields: ["studentName", "universityName", "courseName", "country"],
  requiredFields: ["studentName"],
  nameField: "studentName",
  slugField: "slug",
  booleanFields: ["featured"],
  dateFields: ["publishedAt"],
  allowedFields: [
    "slug", "studentName", "universityName", "courseName", "country",
    "intake", "story", "advice", "imageUrl", "publishedAt", "featured",
  ],
};

export const GET = makeGetHandler(config);
export const PUT = makeUpdateHandler(config);
export const DELETE = makeDeleteHandler(config);
