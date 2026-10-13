/**
 * /higher-study/courses
 * --------------------------------------------------------------------
 * Redirect helper — the course finder has moved to
 * `/higher-study/course-finder`. Catches legacy nav links.
 *
 * Course *detail* pages are at `/higher-study/courses/[slug]` and are
 * NOT affected by this redirect.
 */
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyCoursesRedirect({
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
  redirect(query ? `/higher-study/course-finder?${query}` : "/higher-study/course-finder");
}
