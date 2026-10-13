"use client";

/**
 * HomeHeroSearch — hero search input for the English Learning home page.
 * On submit, routes to `/english-learning/courses?q=...`. Suggestions give
 * quick links to the main search surfaces.
 */
import { useRouter } from "next/navigation";
import { Search, ClipboardCheck, UserSearch, BookOpen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  {
    label: "Courses",
    href: "/english-learning/courses",
    description: "Browse all English courses by level and test prep",
    icon: BookOpen,
  },
  {
    label: "Practice tests",
    href: "/english-learning/practice-tests",
    description: "IELTS, TOEFL, PTE, Duolingo, GRE & GMAT mock tests",
    icon: ClipboardCheck,
  },
  {
    label: "Tutors",
    href: "/english-learning/tutors",
    description: "1:1 English tutors with verified qualifications",
    icon: UserSearch,
  },
];

export interface HomeHeroSearchProps {
  className?: string;
}

export function HomeHeroSearch({ className }: HomeHeroSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/english-learning/courses");
      return;
    }
    router.push(`/english-learning/courses?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search English courses, practice tests, tutors…"
          aria-label="Search English Learning"
          className="h-14 w-full rounded-2xl border-white/20 bg-white/95 pl-12 pr-32 text-base text-ink-900 shadow-2xl backdrop-blur placeholder:text-ink-400 focus-visible:ring-orange-400/40"
        />
        <Button
          type="submit"
          className="absolute right-2 top-1/2 h-10 -translate-y-1/2 gap-1.5 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => router.push(s.href)}
              className="group flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/5 p-3 text-left backdrop-blur transition-colors hover:bg-white/10"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">{s.label}</div>
                <div className="text-[11px] leading-snug text-blue-100/80">
                  {s.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
