"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Circle,
  ExternalLink,
  Filter,
  FolderKanban,
  Layers,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  Target,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { ECOSYSTEM } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { DetailModal, ModalField } from "../detail-modal";

const STATUS_COLOR: Record<string, string> = {
  active: "#12825C",
  connected: "#1677E8",
  "in-testing": "#D98A0A",
  planned: "#98A2B3",
};

export type ProjectItem = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category: string;
  shortDescription: string;
  status: string;
  approvedUrl: string | null;
  featured: boolean;
  approvedRole: string | null;
  businessProblem: string | null;
};

/** Display-friendly version of a category slug, e.g. "professional-brand" → "professional brand". */
function prettifyCategory(category: string): string {
  return category.replace(/-/g, " ");
}

/** A single pill-shaped category filter chip with a count badge. */
function FilterChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        isActive
          ? "bg-orange-600 text-white shadow-orange dark:shadow-none"
          : "border border-ink-200 bg-white text-ink-700 hover:border-orange-300 hover:text-orange-700 dark:border-blue-800/30 dark:bg-ink-900 dark:text-blue-300 dark:hover:border-orange-500/50 dark:hover:text-orange-300"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
          isActive
            ? "bg-white/25 text-white"
            : "bg-ink-100 text-ink-600 dark:bg-blue-900/40 dark:text-blue-200"
        )}
      >
        {count}
      </span>
    </motion.button>
  );
}

export function Ecosystem({ projects }: { projects: ProjectItem[] }) {
  // null = "All" (default, no filter applied)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(projects[0]?.slug ?? null);
  const [modalProject, setModalProject] = useState<ProjectItem | null>(null);

  // Derive the unique categories present in the projects prop, preserving encounter order,
  // with a live count per category (so the badges stay accurate if the prop changes).
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }, [projects]);

  // The visible subset after the active category filter is applied.
  const filteredProjects = useMemo(() => {
    if (!activeCategory) return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  // Active-project persistence: keep the previously selected slug if it is still
  // in the filtered set, otherwise fall back to the first visible project.
  const activeProject =
    filteredProjects.find((p) => p.slug === active) ?? filteredProjects[0];

  const handleCategoryChange = (next: string | null) => {
    setActiveCategory(next);
    const upcoming = next
      ? projects.filter((p) => p.category === next)
      : projects;
    // Only reset `active` when the previously selected slug is no longer visible.
    if (!active || !upcoming.some((p) => p.slug === active)) {
      setActive(upcoming[0]?.slug ?? null);
    }
  };

  // Try to enrich the modal with static ECOSYSTEM data (problem statement, role, status)
  const ecosystemMeta = modalProject
    ? ECOSYSTEM.find((e) => e.name === modalProject.name)
    : undefined;

  const isFiltered = activeCategory !== null;
  const totalCount = projects.length;
  const visibleCount = filteredProjects.length;

  return (
    <SectionWrap id="projects" className="bg-white dark:bg-ink-900/50">
      <SectionHeading
        eyebrow="Project Ecosystem"
        title={
          <>
            One connected ecosystem —{" "}
            <span className="text-grad-connected">multiple specialised platforms</span>.
          </>
        }
        description="A connected ecosystem of education, technology and AI initiatives Al Aminn works with. Click a node or 'View full brief' to learn more."
      />

      {/* Category filter chips — placed between the heading and the radial map / detail grid */}
      <div className="mt-8">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
          <Filter className="h-3.5 w-3.5" />
          Filter by category
        </div>
        <motion.div
          layout
          role="group"
          aria-label="Filter projects by category"
          className="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:flex-wrap sm:overflow-visible sm:whitespace-normal sm:pb-0"
        >
          <FilterChip
            label="All"
            count={totalCount}
            isActive={activeCategory === null}
            onClick={() => handleCategoryChange(null)}
          />
          {categories.map(({ category, count }) => (
            <FilterChip
              key={category}
              label={prettifyCategory(category)}
              count={count}
              isActive={activeCategory === category}
              onClick={() => handleCategoryChange(category)}
            />
          ))}
        </motion.div>

        {/* Showing X of Y platforms + optional "Filtered" badge */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          <span>
            Showing{" "}
            <strong className="font-semibold tabular-nums text-ink-700 dark:text-ink-200">
              {visibleCount}
            </strong>{" "}
            of{" "}
            <strong className="font-semibold tabular-nums text-ink-700 dark:text-ink-200">
              {totalCount}
            </strong>{" "}
            platforms
          </span>
          <AnimatePresence>
            {isFiltered && (
              <motion.span
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
              >
                <Filter className="h-2.5 w-2.5" />
                Filtered
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeProject ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Map / radial list */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square max-w-[420px]">
              {/* rings */}
              <div className="absolute inset-0 rounded-full border border-blue-100" />
              <div className="absolute inset-[12%] rounded-full border border-blue-100" />
              {/* Dashed ring with slow rotation */}
              <div className="absolute inset-[24%] animate-orbit-slow rounded-full border border-dashed border-blue-200" />

              {/* center node with subtle pulse */}
              <div className="animate-center-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full grad-intelligence blur-md opacity-60" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full grad-intelligence text-white shadow-blue">
                    <div className="text-center">
                      <div className="font-display text-[11px] font-extrabold">Al Aminn</div>
                      <div className="text-[8px] uppercase tracking-widest text-blue-200">Center</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orbiting project nodes — re-positioned evenly around the circle based on
                  the filtered set so there are no gaps where filtered-out projects used to be.
                  AnimatePresence with popLayout fades removed nodes out while remaining nodes
                  fade into their new positions. */}
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((p, i) => {
                  const angle = (i / filteredProjects.length) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const r = 42; // % of half
                  const x = 50 + r * Math.cos(rad);
                  const y = 50 + r * Math.sin(rad);
                  const isActive = activeProject.slug === p.slug;
                  return (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.4 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setActive(p.slug)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 hover:scale-105"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      aria-label={p.name}
                    >
                      {/* connecting line to center with dash flow animation */}
                      <svg
                        className="absolute left-1/2 top-1/2 overflow-visible"
                        style={{
                          width: `${42}%`,
                          height: '1px',
                          transform: `rotate(${angle + 180}deg)`,
                          transformOrigin: '0 0',
                        }}
                        aria-hidden="true"
                      >
                        <line
                          x1="0" y1="0" x2="100%" y2="0"
                          className={isActive ? "animate-dash-flow" : ""}
                          stroke={isActive ? "#FF751F" : "rgba(11,99,206,0.3)"}
                          strokeWidth={isActive ? 2 : 1}
                          strokeDasharray={isActive ? "8 12" : "none"}
                        />
                        {/* Fallback solid line for non-active state */}
                        {!isActive && (
                          <line
                            x1="0" y1="0" x2="100%" y2="0"
                            stroke="rgba(11,99,206,0.3)"
                            strokeWidth={1}
                          />
                        )}
                      </svg>
                      <span
                        className={cn(
                          "inline-flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white dark:bg-ink-900 font-display text-xs font-extrabold transition-all",
                          isActive
                            ? "border-orange-500 text-orange-600 shadow-orange dark:shadow-none scale-110"
                            : "border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-500"
                        )}
                      >
                        {p.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-7">
            <motion.div
              key={activeProject.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-6 shadow-card dark:shadow-none sm:p-8 hover:shadow-lg dark:hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${STATUS_COLOR[activeProject.status] ?? "#98A2B3"}15`,
                        color: STATUS_COLOR[activeProject.status] ?? "#98A2B3",
                      }}
                    >
                      <Circle className="h-2 w-2 fill-current" />
                      {activeProject.status.replace("-", " ")}
                    </span>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      {activeProject.category.replace("-", " ")}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-extrabold text-ink-900">
                    {activeProject.name}
                  </h3>
                  {activeProject.subtitle && (
                    <p className="mt-1 text-sm text-ink-500">{activeProject.subtitle}</p>
                  )}
                </div>
                {activeProject.approvedUrl && (
                  <a
                    href={activeProject.approvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                    aria-label="Visit approved URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-600">
                {activeProject.shortDescription}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-blue-50/60 dark:bg-blue-900/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Al Aminn's approved role
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-200">
                    {activeProject.approvedRole ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-orange-50/50 dark:bg-orange-900/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                    Problem being solved
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-200">
                    {activeProject.businessProblem ?? "—"}
                  </div>
                </div>
              </div>

              {/* mini status legend + open brief */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 dark:border-blue-800/20 pt-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-500 dark:text-ink-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Showing {visibleCount} of {totalCount} platforms
                  </span>
                </div>
                <button
                  onClick={() => setModalProject(activeProject)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:shadow-sm btn-sheen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  View full brief
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* Defensive empty state — shown only if a category somehow yields zero projects. */
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center dark:border-blue-800/30 dark:bg-ink-900">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No projects in this category.
          </p>
          <button
            type="button"
            onClick={() => handleCategoryChange(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filter
          </button>
        </div>
      )}

      {/* Project detail modal */}
      <DetailModal
        open={!!modalProject}
        onClose={() => setModalProject(null)}
        eyebrow="Project Brief"
        accent="intelligence"
        title={modalProject?.name ?? ""}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            {modalProject?.approvedUrl ? (
              <a
                href={modalProject.approvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/30 px-4 text-sm font-semibold text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50 btn-sheen"
              >
                <ExternalLink className="h-4 w-4" />
                Visit approved URL
              </a>
            ) : (
              <span className="text-xs text-ink-500">No public URL approved for this project.</span>
            )}
            <a
              href="#contact"
              onClick={() => setModalProject(null)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              <ArrowUpRight className="h-4 w-4" />
              Discuss this project
            </a>
          </div>
        }
      >
        {modalProject && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${STATUS_COLOR[modalProject.status] ?? "#98A2B3"}15`,
                  color: STATUS_COLOR[modalProject.status] ?? "#98A2B3",
                }}
              >
                <Circle className="h-2 w-2 fill-current" />
                {modalProject.status.replace("-", " ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <FolderKanban className="h-3 w-3" />
                {modalProject.category.replace("-", " ")}
              </span>
              {modalProject.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                  Featured
                </span>
              )}
            </div>

            {modalProject.subtitle && (
              <p className="text-sm font-medium text-ink-500">{modalProject.subtitle}</p>
            )}

            <p className="text-base leading-relaxed text-ink-700">{modalProject.shortDescription}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField
                label="Al Aminn's approved role"
                accent="blue"
                value={modalProject.approvedRole ?? "—"}
              />
              <ModalField
                label="Problem being solved"
                accent="orange"
                value={modalProject.businessProblem ?? "—"}
              />
            </div>

            {ecosystemMeta && (
              <div className="grid gap-3 sm:grid-cols-2">
                <ModalField
                  label="Relation to ecosystem"
                  accent="blue"
                  value={
                    <span className="inline-flex items-start gap-2">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                      {ecosystemMeta.relation}
                    </span>
                  }
                />
                <ModalField
                  label="Ecosystem positioning"
                  accent="ink"
                  value={ecosystemMeta.role}
                />
              </div>
            )}

            <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-900/20 p-4 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <strong className="inline-flex items-center gap-1.5 font-semibold text-ink-800 dark:text-ink-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Ownership governance.
              </strong>{" "}
              Roles stated here are approved by the project owner. Ownership or equity is never
              implied or suggested without explicit written approval.
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}
