/**
 * /higher-study/research
 * --------------------------------------------------------------------
 * Redirect helper — the PhD & research listing has moved to
 * `/higher-study/phd-research`. Catches legacy nav links.
 *
 * Research project *detail* pages are at `/higher-study/research/[slug]`
 * and are NOT affected by this redirect.
 */
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyResearchRedirect({
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
  redirect(query ? `/higher-study/phd-research?${query}` : "/higher-study/phd-research");
}
