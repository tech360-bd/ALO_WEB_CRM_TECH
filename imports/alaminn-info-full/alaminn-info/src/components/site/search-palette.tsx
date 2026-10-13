"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Home,
  User,
  Briefcase,
  Workflow,
  Target,
  FolderKanban,
  BookOpen,
  FileText,
  Newspaper,
  Sparkles,
  Mail,
  Layers,
  ShieldCheck,
  Users2,
  Loader2,
  Clock,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaletteItem = {
  id: string;
  label: string;
  hint: string;
  group: "Navigate" | "Expertise" | "Content" | "Action";
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  // Either a hash anchor to scroll to, or an "action" id handled by parent.
  href?: string;
  action?: "open-command-center" | "schedule-meeting";
};

// ─── Live content result types ──────────────────────────────────────────

type LiveArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingMinutes: number;
};

type LiveProject = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category: string;
  status: string;
};

type LiveContentResult =
  | { type: "article"; data: LiveArticle }
  | { type: "project"; data: LiveProject };

const PALETTE_ITEMS: PaletteItem[] = [
  // Sections
  { id: "nav-home", label: "Home", hint: "Hero · Operating Constellation", group: "Navigate", icon: Home, href: "#home" },
  { id: "nav-about", label: "Executive Introduction", hint: "Growth requires an operating system", group: "Navigate", icon: User, href: "#about" },
  { id: "nav-expertise", label: "Expertise Command Grid", hint: "8 systems · 8 challenges", group: "Navigate", icon: Briefcase, href: "#expertise" },
  { id: "nav-work-system", label: "The Work System", hint: "8-stage Understand → Scale process", group: "Navigate", icon: Workflow, href: "#work-system" },
  { id: "nav-impact", label: "Selected Impact", hint: "Evidence-controlled outcomes", group: "Navigate", icon: Target, href: "#impact" },
  { id: "nav-projects", label: "Project Ecosystem", hint: "Connected platforms & briefs", group: "Navigate", icon: FolderKanban, href: "#projects" },
  { id: "nav-case-studies", label: "Featured Case Studies", hint: "Verified engagements", group: "Navigate", icon: BookOpen, href: "#case-studies" },
  { id: "nav-alo-labs", label: "ALO Labs Connection", hint: "Governed AI workflow", group: "Navigate", icon: Sparkles, href: "#alo-labs" },
  { id: "nav-insights", label: "Thought Leadership", hint: "Articles & analysis", group: "Navigate", icon: Newspaper, href: "#insights" },
  { id: "nav-resources", label: "Resources", hint: "Checklists · templates · guides", group: "Navigate", icon: FileText, href: "#resources" },
  { id: "nav-profile", label: "Executive Profile", hint: "Al Aminn · leadership principles", group: "Navigate", icon: User, href: "#profile" },
  { id: "nav-work-with-me", label: "Work With Me", hint: "8 engagement types", group: "Navigate", icon: Users2, href: "#work-with-me" },
  { id: "nav-newsletter", label: "Newsletter", hint: "Subscribe for authority briefings", group: "Navigate", icon: Mail, href: "#newsletter" },
  { id: "nav-contact", label: "Contact — Start an inquiry", hint: "Multi-step form", group: "Navigate", icon: Mail, href: "#contact" },

  // Expertise modules
  { id: "ex-ops", label: "Operations & Business Systems", hint: "Disconnected workflows", group: "Expertise", icon: Layers, href: "#expertise", keywords: ["operations", "workflow", "accountability"] },
  { id: "ex-sales", label: "Sales Strategy & Pipelines", hint: "Stage-based conversion", group: "Expertise", icon: Layers, href: "#expertise", keywords: ["sales", "pipeline", "crm"] },
  { id: "ex-edu", label: "International Education Operations", hint: "Counselling · applications · visas", group: "Expertise", icon: Layers, href: "#expertise", keywords: ["education", "student", "alo"] },
  { id: "ex-partners", label: "University Partnerships", hint: "Institutional collaboration", group: "Expertise", icon: Layers, href: "#expertise", keywords: ["university", "partnership", "institution"] },
  { id: "ex-ai", label: "AI Automation & Governance", hint: "ALO Labs · governed agents", group: "Expertise", icon: Sparkles, href: "#expertise", keywords: ["ai", "automation", "agent", "governance"] },
  { id: "ex-crm", label: "CRM & Digital Transformation", hint: "Architecture · adoption", group: "Expertise", icon: Layers, href: "#expertise", keywords: ["crm", "digital", "transformation"] },

  // Actions
  { id: "act-command-center", label: "Open Command Center", hint: "CRM · AI Workspace · Approvals", group: "Action", icon: ShieldCheck, action: "open-command-center" },
  { id: "act-schedule", label: "Schedule a Meeting", hint: "Pick a time that works for you", group: "Action", icon: Mail, action: "schedule-meeting" },
];

const GROUPS: PaletteItem["group"][] = ["Action", "Navigate", "Expertise", "Content"];

export function SearchPalette({
  open,
  onOpenChange,
  onAction,
  isAuthed = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAction?: (action: PaletteItem["action"]) => void;
  isAuthed?: boolean;
}) {
  // Body scroll lock when open — kept at the parent level so it persists
  // across the inner content's mount/unmount lifecycle.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <SearchPaletteContent
          onOpenChange={onOpenChange}
          onAction={onAction}
          isAuthed={isAuthed}
        />
      )}
    </AnimatePresence>
  );
}

function SearchPaletteContent({
  onOpenChange,
  onAction,
  isAuthed = false,
}: {
  onOpenChange: (v: boolean) => void;
  onAction?: (action: PaletteItem["action"]) => void;
  isAuthed?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ─── Live content search state ──────────────────────────────────────
  const [liveResults, setLiveResults] = useState<LiveContentResult[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live content fetch
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLiveResults([]);
      setLiveLoading(false);
      return;
    }

    setLiveLoading(true);

    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);

    liveTimerRef.current = setTimeout(async () => {
      try {
        const [articlesRes, projectsRes] = await Promise.all([
          fetch(`/api/v1/public/articles?q=${encodeURIComponent(q)}`),
          fetch(`/api/v1/public/projects?q=${encodeURIComponent(q)}`),
        ]);
        const articlesData = await articlesRes.json();
        const projectsData = await projectsRes.json();

        const results: LiveContentResult[] = [];

        if (articlesData.success && articlesData.data?.articles) {
          for (const a of articlesData.data.articles.slice(0, 5) as LiveArticle[]) {
            results.push({ type: "article", data: a });
          }
        }

        if (projectsData.success && projectsData.data?.projects) {
          for (const p of projectsData.data.projects.slice(0, 5) as LiveProject[]) {
            results.push({ type: "project", data: p });
          }
        }

        setLiveResults(results);
      } catch {
        setLiveResults([]);
      } finally {
        setLiveLoading(false);
      }
    }, 300);

    return () => {
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    };
  }, [query]);

  // Focus input on mount (when the palette opens).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Filtered items — the "Open Command Center" action is hidden from
  // unauthenticated visitors so the public search palette never advertises
  // the staff-only Command Center.
  const filtered = useMemo(() => {
    const base = isAuthed
      ? PALETTE_ITEMS
      : PALETTE_ITEMS.filter((i) => i.action !== "open-command-center");
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((item) => {
      const hay = [item.label, item.hint, item.group, ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((token) => hay.includes(token));
    });
  }, [query, isAuthed]);

  // Build total items list for keyboard navigation (static + live)
  const totalItems = useMemo(() => {
    return filtered.length + liveResults.length;
  }, [filtered, liveResults]);

  // Clamp activeIndex when the query changes so it never points past the end
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, totalItems - 1));
  const effectiveActiveIndex = totalItems === 0 ? 0 : safeActiveIndex;

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${effectiveActiveIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [effectiveActiveIndex]);

  // Handle clicking a live result
  const handleLiveResult = useCallback(
    (result: LiveContentResult) => {
      onOpenChange(false);
      if (result.type === "article") {
        // Scroll to insights section and dispatch event to open detail
        const section = document.querySelector("#insights");
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#insights");
        // Dispatch custom event for the Insights section to handle
        window.dispatchEvent(
          new CustomEvent("alaminn:open-article", { detail: { slug: result.data.slug } })
        );
      } else {
        // Scroll to projects section and dispatch event to open detail
        const section = document.querySelector("#projects");
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#projects");
        window.dispatchEvent(
          new CustomEvent("alaminn:open-project", { detail: { slug: result.data.slug } })
        );
      }
    },
    [onOpenChange]
  );

  const runItem = useCallback(
    (item: PaletteItem) => {
      onOpenChange(false);
      if (item.action) {
        onAction?.(item.action);
      } else if (item.href) {
        // Use location hash so we stay on the same route (single-route app)
        if (item.href.startsWith("#")) {
          const el = document.querySelector(item.href);
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          // Update hash without jumping
          history.replaceState(null, "", item.href);
        } else {
          router.push(item.href);
        }
      }
    },
    [onOpenChange, onAction, router]
  );

  // Keyboard handling — the child only mounts when open, so no need to guard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Check if the active index is in the static or live section
        if (effectiveActiveIndex < filtered.length) {
          const item = filtered[effectiveActiveIndex];
          if (item) runItem(item);
        } else {
          const liveIdx = effectiveActiveIndex - filtered.length;
          const result = liveResults[liveIdx];
          if (result) handleLiveResult(result);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, liveResults, effectiveActiveIndex, totalItems, onOpenChange, runItem, handleLiveResult]);

  // Build static grouped items for rendering
  const grouped = useMemo(() => {
    const map = new Map<PaletteItem["group"], PaletteItem[]>();
    for (const item of filtered) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return GROUPS.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [filtered]);

  // Determine if we should show the "Content" live results section
  const showLiveContent = query.trim().length >= 2;
  const noLiveResults = showLiveContent && !liveLoading && liveResults.length === 0;

  // Status badge colors for projects
  const PROJECT_STATUS_COLOR: Record<string, string> = {
    planned: "bg-blue-100 text-blue-700",
    "in-testing": "bg-amber-100 text-amber-700",
    connected: "bg-cyan-100 text-cyan-700",
    active: "bg-emerald-100 text-emerald-700",
    "on-hold": "bg-ink-100 text-ink-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-blue-900/10 bg-white shadow-2xl"
      >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search sections, expertise, content…"
                className="flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
              {liveLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              <kbd className="hidden items-center gap-1 rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 sm:inline-flex">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto scroll-area p-2">
              {grouped.length === 0 && !showLiveContent ? (
                <div className="px-3 py-10 text-center text-sm text-ink-400">
                  No results for &ldquo;{query}&rdquo;.
                </div>
              ) : (
                <>
                  {/* Static groups */}
                  {grouped.map(({ group, items }) => (
                    <div key={group} className="mb-2">
                      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                        {group}
                      </div>
                      {items.map((item) => {
                        const idx = filtered.indexOf(item);
                        const isActive = idx === effectiveActiveIndex;
                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => runItem(item)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              isActive ? "bg-blue-50" : "hover:bg-ink-50"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isActive
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-ink-100 text-ink-600"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-800">
                                {item.label}
                              </span>
                              <span className="block truncate text-xs text-ink-500">
                                {item.hint}
                              </span>
                            </span>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {/* Live Content group */}
                  {showLiveContent && (
                    <div className="mb-2">
                      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Content
                      </div>

                      {/* Loading state */}
                      {liveLoading && (
                        <div className="flex items-center gap-2 px-3 py-4 text-sm text-ink-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching content…
                        </div>
                      )}

                      {/* No results */}
                      {noLiveResults && (
                        <div className="px-3 py-3 text-xs text-ink-400 italic">
                          No articles or projects found for &ldquo;{query}&rdquo;.
                        </div>
                      )}

                      {/* Live results */}
                      {!liveLoading && liveResults.map((result, liveIdx) => {
                        const globalIdx = filtered.length + liveIdx;
                        const isActive = globalIdx === effectiveActiveIndex;

                        if (result.type === "article") {
                          const a = result.data;
                          return (
                            <button
                              key={`live-article-${a.id}`}
                              data-idx={globalIdx}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                              onClick={() => handleLiveResult(result)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                                isActive ? "bg-blue-50" : "hover:bg-ink-50"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  isActive
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-50 text-blue-600"
                                )}
                              >
                                <Newspaper className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-ink-800">
                                  {a.title}
                                </span>
                                <span className="flex items-center gap-2 text-xs text-ink-500">
                                  <span className="inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[9px] font-semibold text-ink-600">
                                    <Tag className="h-2.5 w-2.5" />
                                    {a.category.replace(/-/g, " ")}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {a.readingMinutes} min
                                  </span>
                                </span>
                              </span>
                              {isActive && (
                                <CornerDownLeft className="h-3.5 w-3.5 text-blue-600" />
                              )}
                            </button>
                          );
                        }

                        // Project result
                        const p = result.data;
                        return (
                          <button
                            key={`live-project-${p.id}`}
                            data-idx={globalIdx}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            onClick={() => handleLiveResult(result)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              isActive ? "bg-blue-50" : "hover:bg-ink-50"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isActive
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-emerald-50 text-emerald-600"
                              )}
                            >
                              <FolderKanban className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-800">
                                {p.name}
                              </span>
                              <span className="flex items-center gap-2 text-xs text-ink-500">
                                <span className={cn(
                                  "rounded px-1.5 py-0.5 text-[9px] font-semibold",
                                  PROJECT_STATUS_COLOR[p.status] ?? "bg-ink-100 text-ink-600"
                                )}>
                                  {p.status}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[9px]">
                                  <Tag className="h-2.5 w-2.5" />
                                  {p.category.replace(/-/g, " ")}
                                </span>
                              </span>
                            </span>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/40 px-4 py-2.5 text-[11px] text-ink-500">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" />
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" />
                  open
                </span>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="font-semibold text-ink-700">Al Aminn</span>
                <span className="text-ink-400">·</span>
                <span>Command palette</span>
              </div>
            </div>
      </motion.div>
    </motion.div>
  );
}
