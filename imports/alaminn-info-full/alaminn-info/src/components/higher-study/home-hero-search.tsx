"use client";

/**
 * HigherStudyHomeHeroSearch — the hero search input on the Higher Study
 * home page. A single input that, on submit, routes to the course
 * finder with the query. Suggestions give quick links to the 4 main
 * search surfaces (universities / courses / scholarships / research).
 */
import { useRouter } from "next/navigation";
import { SearchBar, type SearchSuggestion } from "./search-bar";
import { Search, Award, FlaskConical, Building2 } from "lucide-react";

const DEFAULT_SUGGESTIONS: SearchSuggestion[] = [
  {
    label: "Universities",
    href: "/higher-study/universities",
    description: "Browse all universities across 30 destinations",
    badge: "Browse",
  },
  {
    label: "Courses & programmes",
    href: "/higher-study/courses",
    description: "Filter by study level, subject, tuition and intake",
    badge: "Browse",
  },
  {
    label: "Scholarships",
    href: "/higher-study/scholarships",
    description: "Fully-funded, partial, government and university funding",
    badge: "Browse",
  },
  {
    label: "PhD & research projects",
    href: "/higher-study/research",
    description: "PhD studentships, postdocs and research fellowships",
    badge: "Browse",
  },
];

export interface HigherStudyHomeHeroSearchProps {
  /** Optional initial query (from URL). */
  initialValue?: string;
  className?: string;
}

/**
 * Render the home hero search input.
 */
export function HigherStudyHomeHeroSearch({
  initialValue = "",
  className,
}: HigherStudyHomeHeroSearchProps) {
  const router = useRouter();

  const handleSubmit = (value: string) => {
    const q = value.trim();
    if (!q) {
      router.push("/higher-study/courses");
      return;
    }
    router.push(`/higher-study/courses?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={className}>
      <SearchBar
        value={initialValue}
        onChange={() => {
          // no-op — the search is submit-driven
        }}
        onSubmit={handleSubmit}
        suggestions={DEFAULT_SUGGESTIONS}
        placeholder="Search universities, courses, scholarships, PhDs…"
        ariaLabel="Search higher study opportunities"
        size="lg"
        className="w-full"
      />
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-blue-100/80">
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          Universities
        </span>
        <span className="opacity-50">·</span>
        <span className="inline-flex items-center gap-1">
          <Search className="h-3 w-3" aria-hidden="true" />
          Courses
        </span>
        <span className="opacity-50">·</span>
        <span className="inline-flex items-center gap-1">
          <Award className="h-3 w-3" aria-hidden="true" />
          Scholarships
        </span>
        <span className="opacity-50">·</span>
        <span className="inline-flex items-center gap-1">
          <FlaskConical className="h-3 w-3" aria-hidden="true" />
          PhD &amp; Research
        </span>
      </div>
    </div>
  );
}
