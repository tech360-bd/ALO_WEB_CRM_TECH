import {
  makeListHandler,
  makeCreateHandler,
} from "@/lib/english-learning/admin-factory";
import { practiceTestConfig } from "../_configs";

export const dynamic = "force-dynamic";

export const GET = makeListHandler(practiceTestConfig);
export const POST = makeCreateHandler(practiceTestConfig);
