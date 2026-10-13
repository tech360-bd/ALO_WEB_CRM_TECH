import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/english-learning/admin-factory";
import { resourceConfig } from "../../_configs";

export const dynamic = "force-dynamic";

export const GET = makeGetHandler(resourceConfig);
export const PUT = makeUpdateHandler(resourceConfig);
export const DELETE = makeDeleteHandler(resourceConfig);
