"use client";

/**
 * FilterPanel — advanced filter sidebar for Higher Study list pages.
 *
 * Renders collapsible filter groups, multi-select chips, range sliders
 * and boolean toggles. Uses shadcn Accordion, Checkbox, Select, Slider,
 * Input components. Fully keyboard accessible.
 *
 * The `filters` prop describes the schema; `values` is the current state
 * and `onChange` updates a single filter value.
 */
import { useCallback, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FilterType =
  | "text"
  | "select"
  | "multiselect"
  | "range"
  | "boolean";

export interface FilterOption {
  value: string;
  label: string;
  /** Optional facet count shown next to the label. */
  count?: number;
}

export interface FilterDefinition {
  name: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  /** Show "All" / "Any" as the first select option (default true). */
  allowAll?: boolean;
  /** Display the filter in a collapsible accordion (default true). */
  collapsible?: boolean;
  /** Default to collapsed (default false — expanded by default). */
  defaultCollapsed?: boolean;
}

export type FilterValues = Record<
  string,
  string | string[] | number[] | boolean | null
>;

export interface FilterPanelProps {
  filters: FilterDefinition[];
  values: FilterValues;
  onChange: (name: string, value: FilterValues[string]) => void;
  onReset?: () => void;
  className?: string;
  /** Compact mode — smaller padding, denser layout. */
  compact?: boolean;
  /** Show the "Reset filters" button (default true). */
  showReset?: boolean;
  /** Active filter count badge — shown in the header. */
  activeCount?: number;
}

/**
 * Render an advanced filter sidebar.
 */
export function FilterPanel({
  filters,
  values,
  onChange,
  onReset,
  className,
  compact = false,
  showReset = true,
  activeCount = 0,
}: FilterPanelProps) {
  // Default-open accordion items = those without `defaultCollapsed`.
  const defaultOpen = filters
    .filter((f) => !f.defaultCollapsed)
    .map((f) => f.name);

  return (
    <aside
      className={cn(
        "rounded-2xl border border-ink-200 bg-white shadow-soft",
        compact ? "p-3" : "p-4",
        className,
      )}
      aria-label="Filters"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink-500" aria-hidden="true" />
          <h3 className="font-display text-sm font-extrabold text-ink-900">
            Filters
          </h3>
          {activeCount > 0 && (
            <Badge className="bg-orange-600 text-[10px] font-bold uppercase tracking-wider text-white">
              {activeCount}
            </Badge>
          )}
        </div>
        {showReset && onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-7 gap-1 rounded-lg px-2 text-xs text-ink-600 hover:bg-ink-100 hover:text-ink-900"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className="w-full"
      >
        {filters.map((filter) => (
          <AccordionItem
            key={filter.name}
            value={filter.name}
            className="border-b border-ink-100 last:border-b-0"
          >
            <AccordionTrigger
              className={cn(
                "py-3 text-sm font-semibold text-ink-800 hover:no-underline",
                compact && "py-2 text-xs",
              )}
            >
              {filter.label}
            </AccordionTrigger>
            <AccordionContent>
              <FilterControl
                filter={filter}
                value={values[filter.name]}
                onChange={(v) => onChange(filter.name, v)}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}

// ─── Single filter control renderer ──────────────────────────────────

interface FilterControlProps {
  filter: FilterDefinition;
  value: FilterValues[string];
  onChange: (value: FilterValues[string]) => void;
}

function FilterControl({ filter, value, onChange }: FilterControlProps) {
  switch (filter.type) {
    case "text":
      return (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Search ${filter.label.toLowerCase()}…`}
            aria-label={filter.label}
            className="h-9 rounded-lg border-ink-200 pl-9 text-sm focus-visible:border-orange-400 focus-visible:ring-orange-400/30"
          />
        </div>
      );

    case "select":
      return (
        <Select
          value={(value as string) ?? "__all__"}
          onValueChange={(v) => onChange(v === "__all__" ? null : v)}
        >
          <SelectTrigger
            className="h-9 w-full rounded-lg border-ink-200 text-sm focus-visible:ring-orange-400/30"
            aria-label={filter.label}
          >
            <SelectValue placeholder={`All ${filter.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(filter.allowAll ?? true) && (
              <SelectItem value="__all__">All</SelectItem>
            )}
            {(filter.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
                {typeof opt.count === "number" && (
                  <span className="ml-1 text-xs text-ink-400">({opt.count})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multiselect":
      return (
        <MultiSelectControl
          filter={filter}
          value={value}
          onChange={onChange}
        />
      );

    case "range":
      return (
        <RangeControl filter={filter} value={value} onChange={onChange} />
      );

    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-blue-50">
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v === true)}
            aria-label={filter.label}
          />
          <span className="text-sm text-ink-700">
            {value ? "Yes" : "Any"}
          </span>
        </label>
      );

    default:
      return null;
  }
}

// ─── Multi-select (chips) ────────────────────────────────────────────

function MultiSelectControl({
  filter,
  value,
  onChange,
}: FilterControlProps) {
  const options = filter.options ?? [];
  const selected = useMemo(() => (Array.isArray(value) ? (value as string[]) : []), [value]);

  const toggle = useCallback(
    (val: string) => {
      const next = selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val];
      onChange(next);
    },
    [selected, onChange],
  );

  if (options.length === 0) {
    return (
      <p className="text-xs text-ink-500">No options available.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-blue-50",
              isSelected && "bg-blue-50",
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggle(opt.value)}
              aria-label={opt.label}
            />
            <span className="flex-1 text-ink-700">{opt.label}</span>
            {typeof opt.count === "number" && (
              <span className="text-xs font-medium text-ink-400">
                {opt.count}
              </span>
            )}
            {isSelected && (
              <button
                type="button"
                onClick={() => toggle(opt.value)}
                aria-label={`Remove ${opt.label}`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </label>
        );
      })}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1.5">
          {selected.map((s) => {
            const opt = options.find((o) => o.value === s);
            return (
              <Badge
                key={s}
                className="gap-1 bg-blue-600 text-[10px] font-semibold text-white"
              >
                {opt?.label ?? s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  aria-label={`Remove ${opt?.label ?? s}`}
                  className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-white/20"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Range slider ────────────────────────────────────────────────────

function RangeControl({
  filter,
  value,
  onChange,
}: FilterControlProps) {
  const min = filter.min ?? 0;
  const max = filter.max ?? 100;
  const step = filter.step ?? 1;
  const initial: number[] = Array.isArray(value)
    ? (value as number[])
    : [min, max];

  const [range, setRange] = useState<number[]>(initial);

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between text-xs text-ink-700">
        <span className="font-medium">
          {filter.min?.toLocaleString() ?? min}
        </span>
        <span className="font-semibold text-blue-700">
          {range[0]?.toLocaleString() ?? min} – {range[1]?.toLocaleString() ?? max}
        </span>
        <span className="font-medium">
          {filter.max?.toLocaleString() ?? max}
        </span>
      </div>
      <Slider
        value={range}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => {
          setRange(v as unknown as number[]);
        }}
        onValueCommit={(v) => {
          onChange(v as unknown as number[]);
        }}
        className="py-2"
        aria-label={filter.label}
      />
    </div>
  );
}
