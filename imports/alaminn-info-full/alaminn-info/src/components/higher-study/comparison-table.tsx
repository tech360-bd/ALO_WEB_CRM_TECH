/**
 * ComparisonTable — server component that renders a side-by-side
 * comparison table for up to 4 entities of the same type.
 *
 * Shows "—" honestly for missing data (never invents values).
 * Each column header links to the entity's detail page.
 * Each row has a dimension label on the left + one cell per entity.
 */
import Link from "next/link";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import type { ComparisonRow, ComparisonDimension } from "@/app/higher-study/compare/_lib/compare-helpers";
import { getEntityDetailPrefix } from "@/app/higher-study/compare/_lib/compare-helpers";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  rows: ComparisonRow[];
  dimensions: ComparisonDimension[];
  entityType: "universities" | "courses" | "scholarships";
}

function formatValue(
  value: string | number | boolean | null,
  format?: ComparisonDimension["format"],
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "boolean") {
    return value === true ? "✓ Yes" : value === false ? "✗ No" : "—";
  }
  if (format === "currency") {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `$${n.toLocaleString()}`;
    }
  }
  if (format === "date") {
    const d = new Date(value as string);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return String(value);
}

/**
 * Render the side-by-side comparison table.
 */
export function ComparisonTable({
  rows,
  dimensions,
  entityType,
}: ComparisonTableProps) {
  const detailPrefix = getEntityDetailPrefix(entityType);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-ink-400" aria-hidden="true" />
        <p className="mt-3 font-display text-base font-bold text-ink-900">
          No entities to compare
        </p>
        <p className="mt-1 text-sm text-ink-600">
          Add some entities first using the &ldquo;Add to Compare&rdquo; button
          on any card.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Comparison of {rows.length} {entityType}
          </caption>
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/60">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[160px] bg-ink-50/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500"
              >
                Dimension
              </th>
              {rows.map((row) => (
                <th
                  key={row.slug}
                  scope="col"
                  className="min-w-[200px] border-l border-ink-100 px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-extrabold text-ink-900">
                        <Link
                          href={`${detailPrefix}/${row.slug}`}
                          className="hover-underline"
                        >
                          {row.name}
                        </Link>
                      </p>
                      {row.verifiedAt && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                          {new Date(row.verifiedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`${detailPrefix}/${row.slug}`}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      aria-label={`View ${row.name} details`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dim, idx) => (
              <tr
                key={dim.key}
                className={cn(
                  "border-b border-ink-100 last:border-b-0",
                  idx % 2 === 1 && "bg-ink-50/30",
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-[160px] bg-inherit px-4 py-2.5 text-left text-xs font-semibold text-ink-700"
                >
                  {dim.label}
                </th>
                {rows.map((row) => {
                  const value = row.fields[dim.key] ?? null;
                  const isMissing = value === null || value === undefined || value === "";
                  return (
                    <td
                      key={`${row.slug}-${dim.key}`}
                      className="border-l border-ink-100 px-4 py-2.5 align-top"
                    >
                      {isMissing ? (
                        <span className="text-ink-400" aria-label="No data available">
                          —
                        </span>
                      ) : dim.format === "boolean" ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-semibold",
                            value === true
                              ? "text-emerald-700"
                              : value === false
                                ? "text-ink-500"
                                : "text-ink-700",
                          )}
                        >
                          {value === true ? "✓ Yes" : value === false ? "✗ No" : String(value)}
                        </span>
                      ) : (
                        <span className="text-ink-800">
                          {formatValue(value, dim.format)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honesty footer */}
      <div className="border-t border-ink-200 bg-ink-50/40 p-4">
        <p className="flex items-start gap-2 text-xs text-ink-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-ink-700">About this comparison:</strong>{" "}
            Cells showing &ldquo;—&rdquo; mean the data is not verified in our
            database. We never invent values — always cross-check critical
            information (deadlines, fees, requirements) on the official
            university or scholarship page before applying.
          </span>
        </p>
      </div>
    </div>
  );
}
