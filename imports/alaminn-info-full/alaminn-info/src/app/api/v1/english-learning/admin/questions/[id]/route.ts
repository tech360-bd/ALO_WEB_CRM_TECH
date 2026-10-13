import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/english-learning/admin-factory";
import { questionConfig } from "../../_configs";

export const dynamic = "force-dynamic";

export const GET = makeGetHandler(questionConfig);
export const PUT = makeUpdateHandler(questionConfig);
export const DELETE = makeDeleteHandler(questionConfig);
