/**
 * /api/v1/english-learning/admin/courses/[id]
 * GET    — fetch single course
 * PUT    — update course
 * DELETE — delete course
 */
import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/english-learning/admin-factory";
import { courseConfig } from "../../_configs";

export const dynamic = "force-dynamic";

export const GET = makeGetHandler(courseConfig);
export const PUT = makeUpdateHandler(courseConfig);
export const DELETE = makeDeleteHandler(courseConfig);
