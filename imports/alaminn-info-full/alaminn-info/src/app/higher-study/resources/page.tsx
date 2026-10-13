/**
 * /higher-study/resources
 * --------------------------------------------------------------------
 * Redirect helper — the study resources listing has moved to
 * `/higher-study/study-resources`. Catches legacy nav links.
 *
 * Resource *detail* pages are at `/higher-study/resources/[slug]` and
 * are NOT affected by this redirect.
 */
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyResourcesRedirect({
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
  redirect(query ? `/higher-study/study-resources?${query}` : "/higher-study/study-resources");
}
