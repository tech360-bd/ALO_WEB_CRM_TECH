/**
 * /higher-study/universities
 * --------------------------------------------------------------------
 * Redirect helper — the global universities listing has moved to
 * `/higher-study/global-universities` (clearer naming). This route
 * catches legacy links from the home page and nav and redirects.
 *
 * University *detail* pages are at `/higher-study/universities/[slug]`
 * and are NOT affected by this redirect (they're handled by a separate
 * future task).
 */
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyUniversitiesRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else if (value) {
      qs.set(key, value);
    }
  }
  const query = qs.toString();
  redirect(query ? `/higher-study/global-universities?${query}` : "/higher-study/global-universities");
}
