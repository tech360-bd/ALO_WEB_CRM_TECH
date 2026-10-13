/**
 * Root not-found.tsx — shown when a visitor hits a URL that does not
 * match any route under src/app/ (e.g. /nonexistent). Replaces the
 * Next.js default 404 with a branded experience that surfaces the most
 * useful next destinations on the site.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Compass, Mail } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 mx-auto h-40 w-40 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <p className="font-display text-[120px] font-extrabold leading-none text-primary sm:text-[160px]">
          404
        </p>
      </div>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you were looking for doesn&apos;t exist, may have been moved,
        or the URL was mistyped. Try one of the destinations below to keep
        exploring.
      </p>

      <div className="mt-8 grid w-full max-w-md gap-2 sm:grid-cols-2">
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/expertise">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Explore expertise
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/articles">
            Read articles
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/contact">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact Al Aminn
          </Link>
        </Button>
      </div>
    </div>
  );
}
