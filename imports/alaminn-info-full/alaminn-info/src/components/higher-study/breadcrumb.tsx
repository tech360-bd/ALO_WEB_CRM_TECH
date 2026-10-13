/**
 * Higher Study Breadcrumb — accessible breadcrumb with schema.org
 * BreadcrumbList JSON-LD structured data.
 *
 * Server component (no client interactivity needed) but is composed
 * inside the HigherStudyShell which itself is a client component —
 * that's fine because children of client components can be server-rendered
 * when they don't import client hooks.
 */
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HigherStudyBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Render a Higher Study breadcrumb with `Home` first, optional intermediate
 * links, and the final page label as the current page. Embeds a
 * schema.org BreadcrumbList JSON-LD script for SEO.
 */
export function HigherStudyBreadcrumb({
  items,
  className,
}: HigherStudyBreadcrumbProps) {
  const allItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Higher Study", href: "/higher-study" },
    ...items,
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      ...(item.href ? { item: `https://alaminn.info${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500 sm:gap-2 sm:text-sm">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;
          return (
            <li
              key={`${item.label}-${idx}`}
              className="inline-flex items-center gap-1.5"
            >
              {idx === 0 && <Home className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-ink-600 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-1 rounded-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-semibold text-ink-900"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-ink-300"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
}
