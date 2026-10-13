/**
 * /api/v1/english-learning/admin/courses
 * GET  — list courses (paginated, filtered)
 * POST — create a course
 */
import {
  makeListHandler,
  makeCreateHandler,
} from "@/lib/english-learning/admin-factory";
import { courseConfig } from "../_configs";

export const dynamic = "force-dynamic";

export const GET = makeListHandler(courseConfig);
export const POST = makeCreateHandler(courseConfig);
