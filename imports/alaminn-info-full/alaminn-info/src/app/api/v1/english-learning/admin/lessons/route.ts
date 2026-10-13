import {
  makeListHandler,
  makeCreateHandler,
} from "@/lib/english-learning/admin-factory";
import { lessonConfig } from "../_configs";

export const dynamic = "force-dynamic";

export const GET = makeListHandler(lessonConfig);
export const POST = makeCreateHandler(lessonConfig);
