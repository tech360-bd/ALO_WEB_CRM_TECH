import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/english-learning/admin-factory";
import { lessonConfig } from "../../_configs";

export const dynamic = "force-dynamic";

export const GET = makeGetHandler(lessonConfig);
export const PUT = makeUpdateHandler(lessonConfig);
export const DELETE = makeDeleteHandler(lessonConfig);
