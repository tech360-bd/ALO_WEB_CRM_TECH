"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, TableSkeleton, ErrorState, EmptyState } from "./page-primitives";
import { adminFetch } from "./lib";
import { Search, RefreshCw, Plus } from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type CrudListProps<T> = {
  title: string;
  subtitle?: string;
  endpoint: string;
  columns: Column<T>[];
  searchFields?: string[]; // not used directly, just for the ?q= query
  filters?: { label: string; value: string; param: string }[];
  pageSize?: number;
  onCreate?: () => void;
  createLabel?: string;
  /** Optional extra actions rendered next to the Create button (e.g. upload). */
  extraActions?: React.ReactNode;
  rowActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  /**
   * Optional response-shape adapter. The default admin envelope returns
   * the array directly in `data` and pagination in `meta` (page, pageSize,
   * total, totalPages). The Higher Study and English Learning admin
   * factories use a different shape — `data.items` for the array and
   * `meta.pagination.{page,limit,total,totalPages}` for pagination.
   * Pass `"nested"` to use the nested shape.
   */
  responseShape?: "flat" | "nested";
  /**
   * Optional page-size query-param name. Defaults to "pageSize"
   * (admin-api.ts). The higher-study/english-learning factories use
   * "limit" — set this to "limit" when `responseShape === "nested"`.
   */
  pageSizeParam?: string;
};

/**
 * Reusable CRUD list view used by most admin pages.
 * - Search input (?q=) + filter select
 * - Server-side pagination (?page=, ?pageSize=)
 * - Refresh button
 * - Calls onCreate when the user clicks the create button
 */
export function CrudList<T extends { id: string }>({
  title, subtitle, endpoint, columns, filters = [], pageSize = 25,
  onCreate, createLabel = "Create", extraActions, rowActions, emptyMessage = "No records found.",
  responseShape = "flat", pageSizeParam = "pageSize",
}: CrudListProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const fetchPage = useCallback(async (p: number, query: string, filter: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("page", String(p));
      url.searchParams.set(pageSizeParam, String(pageSize));
      if (query) url.searchParams.set("q", query);
      if (filter !== "all" && filters[0]) url.searchParams.set(filters[0].param, filter);
      const env = await adminFetch<unknown>(url.pathname + url.search);
      // Normalize both response shapes into a single { items, total, page, totalPages } form.
      let arr: T[] = [];
      let metaTotal = 0;
      let metaPage = 1;
      let metaTotalPages = 1;
      if (responseShape === "nested") {
        const data = (env.data ?? {}) as { items?: T[] };
        arr = Array.isArray(data.items) ? data.items : [];
        const pag = (env.meta?.pagination ?? {}) as Record<string, unknown>;
        metaTotal = Number(pag.total ?? arr.length);
        metaPage = Number(pag.page ?? 1);
        metaTotalPages = Number(pag.totalPages ?? 1);
      } else {
        arr = Array.isArray(env.data) ? (env.data as T[]) : [];
        metaTotal = Number(env.meta.total ?? arr.length);
        metaPage = Number(env.meta.page ?? 1);
        metaTotalPages = Number(env.meta.totalPages ?? 1);
      }
      setItems(arr);
      setTotal(metaTotal);
      setPage(metaPage);
      setTotalPages(metaTotalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, pageSize, filters, responseShape, pageSizeParam]);

  useEffect(() => {
    const t = setTimeout(() => fetchPage(1, q, activeFilter), 250); // debounce search
    return () => clearTimeout(t);
  }, [q, activeFilter, fetchPage]);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => fetchPage(page, q, activeFilter)}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            {extraActions}
            {onCreate && (
              <Button size="sm" onClick={onCreate}>
                <Plus className="h-4 w-4 mr-1" /> {createLabel}
              </Button>
            )}
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {filters.length > 0 && (
          <select
            className="border rounded px-3 py-2 text-sm bg-background"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All</option>
            {filters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={6} /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} /></div>
        ) : items.length === 0 ? (
          <div className="p-4"><EmptyState message={emptyMessage} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={`text-left px-3 py-2 font-semibold text-muted-foreground ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                  {rowActions && <th className="text-right px-3 py-2 w-20">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-3 py-2 align-top ${c.className ?? ""}`}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                      </td>
                    ))}
                    {rowActions && <td className="px-3 py-2 text-right">{rowActions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {total} records · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => fetchPage(page - 1, q, activeFilter)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => fetchPage(page + 1, q, activeFilter)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
