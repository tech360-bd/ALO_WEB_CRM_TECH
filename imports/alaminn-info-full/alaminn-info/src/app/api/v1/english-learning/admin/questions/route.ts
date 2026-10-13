import {
  makeListHandler,
  makeCreateHandler,
} from "@/lib/english-learning/admin-factory";
import { questionConfig } from "../_configs";

export const dynamic = "force-dynamic";

export const GET = makeListHandler(questionConfig);
export const POST = makeCreateHandler(questionConfig);
