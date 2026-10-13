/**
 * Higher Study 404 page.
 *
 * Reaches the user where they expected to land on a Higher Study
 * sub-route (e.g. /higher-study/universities/non-existent) but the
 * resource wasn't found.
 */
import Link from "next/link";
import { Home, Search, Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HigherStudyNotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 mx-auto h-40 w-40 rounded-full bg-orange-100/60 blur-3xl" aria-hidden="true" />
        <div className="font-display text-[140px] font-extrabold leading-none text-grad-momentum">
          404
        </div>
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
        Page not found in Higher Study
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600">
        The page you were looking for doesn&apos;t exist, may have been
        archived, or the URL was mistyped. Try one of the paths below to
        continue exploring verified universities, courses, scholarships and
        PhD opportunities.
      </p>

      <div className="mt-8 grid w-full max-w-md gap-2 sm:grid-cols-2">
        <Button
          asChild
          className="h-11 gap-2 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
        >
          <Link href="/higher-study">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to Higher Study Home
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 gap-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Link href="/higher-study/courses">
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse the Course Finder
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-11 gap-2 rounded-xl text-ink-700 hover:bg-ink-100"
        >
          <Link href="/higher-study/universities">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Explore Universities
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-11 gap-2 rounded-xl text-ink-700 hover:bg-ink-100"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Alaminn.info Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
