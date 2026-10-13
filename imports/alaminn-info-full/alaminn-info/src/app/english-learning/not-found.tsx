/**
 * English Learning — 404 page.
 */
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-purple-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-ink-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        The English Learning page you&apos;re looking for doesn&apos;t exist or
        has moved.
      </p>
      <Button
        asChild
        className="mt-6 gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
      >
        <Link href="/english-learning">
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to English Learning home
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
