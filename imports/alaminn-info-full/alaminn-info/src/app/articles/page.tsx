import { redirect } from "next/navigation";

/**
 * /articles → /insights
 *
 * Articles, Resources and Updates have been merged into a single "Insights"
 * hub per the premium navigation simplification. Individual articles remain
 * accessible at /articles/[slug]. This list route redirects to the hub.
 */
export default function ArticlesRedirect() {
  redirect("/insights");
}
