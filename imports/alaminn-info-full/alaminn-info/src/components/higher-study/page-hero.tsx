/**
 * PageHero — shared hero section for Higher Study list/detail pages.
 *
 * Renders a gradient hero with eyebrow, title, description and
 * optional children (e.g. a stats strip or a call-to-action).
 *
 * Server component — no client interactivity needed.
 */
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Hero variant — "default" (blue gradient) or "warm" (orange gradient). */
  variant?: "default" | "warm" | "split";
  className?: string;
}

/**
 * Render a Higher Study page hero.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  variant = "default",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variant === "default" && "bg-gradient-to-br from-blue-50 via-white to-orange-50",
        variant === "warm" && "bg-gradient-to-br from-orange-50 via-white to-blue-50",
        variant === "split" && "grad-intelligence text-white",
        className,
      )}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {eyebrow && (
          <div
            className={cn(
              "eyebrow",
              variant === "split" ? "text-white/80" : "text-blue-600",
            )}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className={cn(
            "mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl",
            variant === "split" ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-4 max-w-3xl text-sm leading-relaxed sm:text-base",
              variant === "split" ? "text-white/90" : "text-ink-600",
            )}
          >
            {description}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

/**
 * StatsStrip — small grid of stat tiles often used in the hero.
 */
export interface StatsStripProps {
  stats: Array<{ label: string; value: string | number }>;
  className?: string;
}

export function StatsStrip({ stats, className }: StatsStripProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-4",
        className,
      )}
    >
      {stats.map((s, idx) => (
        <div
          key={`${s.label}-${idx}`}
          className="rounded-2xl border border-ink-200 bg-white/80 p-4 shadow-soft backdrop-blur"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {s.label}
          </dt>
          <dd className="mt-1 font-display text-2xl font-extrabold text-ink-900">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * SectionCard — content card with title, optional icon, and children.
 */
export interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  icon,
  children,
  className,
  actions,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-soft sm:p-6",
        className,
      )}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h2 className="font-display text-lg font-extrabold text-ink-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-ink-600">{description}</p>
              )}
            </div>
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * ProseSection — render a long-form prose block with the project's
 * typography. Used by detail pages for description sections.
 */
export function ProseSection({
  content,
  className,
}: {
  content?: string | null;
  className?: string;
}) {
  if (!content) return null;
  // Render paragraph breaks (double newline) as separate <p>.
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed text-ink-700 sm:text-base",
        className,
      )}
    >
      {paragraphs.map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </div>
  );
}
