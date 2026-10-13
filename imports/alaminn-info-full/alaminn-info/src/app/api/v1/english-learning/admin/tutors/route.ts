import {
  makeListHandler,
  makeCreateHandler,
} from "@/lib/english-learning/admin-factory";
import { tutorConfig } from "../_configs";

export const dynamic = "force-dynamic";

export const GET = makeListHandler(tutorConfig);
export const POST = makeCreateHandler(tutorConfig);
