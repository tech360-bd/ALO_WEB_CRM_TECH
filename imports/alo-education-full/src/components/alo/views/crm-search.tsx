"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon, PageHeader } from "@/components/alo/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ─────────────────────────────────────────────────────

type SearchType = "all" | "students" | "leads" | "applications" | "universities" | "courses";

interface SearchResultGroup {
  type: string;
  results: Record<string, unknown>[];
  total: number;
}

const TAB_CONFIG: { value: SearchType; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "Search" },
  { value: "students", label: "Students", icon: "GraduationCap" },
  { value: "leads", label: "Leads", icon: "UserPlus" },
  { value: "applications", label: "Applications", icon: "FileText" },
  { value: "universities", label: "Universities", icon: "Building2" },
  { value: "courses", label: "Courses", icon: "BookOpen" },
];

// ─── Column definitions per entity type ───────────────────────

const COLUMNS: Record<string, { key: string; label: string }[]> = {
  students: [
    { key: "studentId", label: "Student ID" },
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "studyDestination", label: "Destination" },
    { key: "status", label: "Status" },
  ],
  leads: [
    { key: "leadId", label: "Lead ID" },
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status" },
    { key: "leadTier", label: "Tier" },
  ],
  applications: [
    { key: "applicationId", label: "App ID" },
    { key: "university", label: "University" },
    { key: "course", label: "Course" },
    { key: "country", label: "Country" },
    { key: "stage", label: "Stage" },
    { key: "deadline", label: "Deadline" },
  ],
  universities: [
    { key: "name", label: "University" },
    { key: "city", label: "City" },
    { key: "countrySlug", label: "Country" },
  ],
  courses: [
    { key: "name", label: "Course" },
    { key: "level", label: "Level" },
    { key: "subject", label: "Subject" },
    { key: "universitySlug", label: "University" },
    { key: "countrySlug", label: "Country" },
  ],
};

// ─── Status color mapping ─────────────────────────────────────

function statusColor(status: string): string {
  const s = status?.toLowerCase() || "";
  if (["active", "paid", "enrolled", "published", "hot", "converted"].includes(s))
    return "bg-green-100 text-green-800";
  if (["pending", "new", "draft", "warm"].includes(s))
    return "bg-yellow-100 text-yellow-800";
  if (["inactive", "lost", "cancelled", "cold"].includes(s))
    return "bg-gray-100 text-gray-600";
  if (["overdue", "refused", "urgent", "at_risk"].includes(s))
    return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
}

// ─── Component ─────────────────────────────────────────────────

export function CrmSearch() {
  const [query, setQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<SearchType>("all");
  const [results, setResults] = React.useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const doSearch = React.useCallback(async (q: string, type: SearchType) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (type !== "all") params.set("type", type);
      params.set("limit", "50");

      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();

      if (json.success) {
        setResults(json.data || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value, activeTab);
    }, 400);
  };

  const handleTabChange = (tab: string) => {
    const t = tab as SearchType;
    setActiveTab(t);
    if (query.trim()) {
      doSearch(query, t);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const totalResults = results.reduce((sum, g) => sum + g.total, 0);

  // Filter results based on active tab
  const visibleResults =
    activeTab === "all"
      ? results
      : results.filter((g) => g.type === activeTab);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="Global Search"
        subtitle="Search across students, leads, applications, universities, and courses"
        icon="Search"
      />

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Icon
            name="Search"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5A7299]"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch(query, activeTab);
            }}
            placeholder="Search by name, email, ID, university, course..."
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7299] hover:text-[#0B2447]"
            >
              <Icon name="X" className="size-4" />
            </button>
          )}
        </div>
        <Button
          className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
          onClick={() => doSearch(query, activeTab)}
          disabled={loading || !query.trim()}
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Result Summary */}
      {searched && !loading && (
        <div className="flex items-center gap-3 text-sm text-[#5A7299]">
          <span>
            {totalResults === 0
              ? "No results found"
              : `Found ${totalResults} result${totalResults !== 1 ? "s" : ""}`}
            {query && ` for "${query}"`}
          </span>
          {results.length > 1 && (
            <div className="flex gap-2">
              {results.map((g) => (
                <Badge
                  key={g.type}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => setActiveTab(g.type as SearchType)}
                >
                  {g.type}: {g.total}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Filters */}
      {searched && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-[#F0F4F8]">
            {TAB_CONFIG.map((tab) => {
              const count =
                tab.value === "all"
                  ? totalResults
                  : results.find((r) => r.type === tab.value)?.total || 0;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0066CC] data-[state=active]:shadow-sm"
                >
                  {tab.label}
                  {searched && count > 0 && (
                    <span className="ml-1 rounded-full bg-[#EAF3FF] px-1.5 py-0.5 text-xs font-medium text-[#0066CC]">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          {TAB_CONFIG.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : visibleResults.filter((g) =>
                tab.value === "all" ? true : g.type === tab.value
              ).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon name="SearchX" className="mb-3 size-10 text-[#B0C4D8]" />
                    <p className="text-sm font-medium text-[#0B2447]">No results found</p>
                    <p className="mt-1 text-xs text-[#5A7299]">
                      Try adjusting your search query or changing the tab filter.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {visibleResults
                    .filter((g) =>
                      tab.value === "all" ? true : g.type === tab.value
                    )
                    .map((group) => {
                      const cols = COLUMNS[group.type] || [];
                      if (cols.length === 0) return null;
                      return (
                        <Card key={group.type}>
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between border-b px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Icon name={TAB_CONFIG.find((t) => t.value === group.type)?.icon || "FileText"} className="size-4 text-[#0066CC]" />
                                <span className="text-sm font-semibold capitalize text-[#0B2447]">
                                  {group.type}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {group.total} found
                              </Badge>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-[#DCE8F5] hover:bg-transparent">
                                    {cols.map((col) => (
                                      <TableHead
                                        key={col.key}
                                        className="whitespace-nowrap text-xs font-medium text-[#5A7299]"
                                      >
                                        {col.label}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.results.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={cols.length}
                                        className="py-8 text-center text-xs text-[#5A7299]"
                                      >
                                        No matching {group.type}
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    group.results.slice(0, 20).map((row, idx) => (
                                      <TableRow
                                        key={idx}
                                        className="border-[#DCE8F5] hover:bg-[#F7FAFE]"
                                      >
                                        {cols.map((col) => {
                                          const val = row[col.key];
                                          const isStatus =
                                            col.key === "status" ||
                                            col.key === "leadTier" ||
                                            col.key === "stage";
                                          return (
                                            <TableCell
                                              key={col.key}
                                              className="whitespace-nowrap text-sm"
                                            >
                                              {isStatus && val ? (
                                                <Badge
                                                  className={`text-xs ${statusColor(String(val))}`}
                                                >
                                                  {String(val)}
                                                </Badge>
                                              ) : val !== null && val !== undefined ? (
                                                String(val)
                                              ) : (
                                                <span className="text-[#B0C4D8]">—</span>
                                              )}
                                            </TableCell>
                                          );
                                        })}
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                            {group.results.length > 20 && (
                              <div className="border-t px-4 py-2 text-xs text-[#5A7299]">
                                Showing 20 of {group.total} results. Use filters for more specific results.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Empty State (no search yet) */}
      {!searched && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="Search" className="mb-4 size-12 text-[#B0C4D8]" />
            <p className="text-base font-medium text-[#0B2447]">
              Search the ALO Education CRM
            </p>
            <p className="mt-1 max-w-md text-sm text-[#5A7299]">
              Type a name, email, student/lead/application ID, university, or course
              to search across all CRM entities.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "students",
                "leads",
                "applications",
                "universities",
                "courses",
              ].map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="cursor-pointer capitalize text-[#5A7299]"
                  onClick={() => {
                    setActiveTab(type as SearchType);
                    inputRef.current?.focus();
                  }}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
