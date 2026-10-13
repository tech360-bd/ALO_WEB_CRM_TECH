import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/english-learning/admin-factory";
import { tutorConfig } from "../../_configs";

export const dynamic = "force-dynamic";

export const GET = makeGetHandler(tutorConfig);
export const PUT = makeUpdateHandler(tutorConfig);
export const DELETE = makeDeleteHandler(tutorConfig);
