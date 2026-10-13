import {
  makeGetHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/english-learning/admin-factory";
import { practiceTestConfig } from "../../_configs";

export const dynamic = "force-dynamic";

export const GET = makeGetHandler(practiceTestConfig);
export const PUT = makeUpdateHandler(practiceTestConfig);
export const DELETE = makeDeleteHandler(practiceTestConfig);
