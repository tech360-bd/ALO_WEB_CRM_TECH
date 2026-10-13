import {
  makeListHandler,
  makeCreateHandler,
} from "@/lib/english-learning/admin-factory";
import { resourceConfig } from "../_configs";

export const dynamic = "force-dynamic";

export const GET = makeListHandler(resourceConfig);
export const POST = makeCreateHandler(resourceConfig);
