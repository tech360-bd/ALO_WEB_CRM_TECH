/**
 * /higher-study/universities/uk
 * --------------------------------------------------------------------
 * Redirect helper — the UK universities listing has moved to
 * `/higher-study/uk-universities`. This route catches the legacy nav
 * link from the HigherStudyShell.
 */
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyUkUniversitiesRedirect({
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
  redirect(query ? `/higher-study/uk-universities?${query}` : "/higher-study/uk-universities");
}
