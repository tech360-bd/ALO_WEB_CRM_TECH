"use client";

/**
 * SearchBar — debounced search input with optional suggestion dropdown.
 *
 * Debounce: 300ms (so we don't fire onChange on every keystroke). The
 * suggestions dropdown appears when the user types at least 2 chars
 * and `suggestions` is non-empty.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchSuggestion {
  label: string;
  href?: string;
  description?: string;
  /** Optional small badge on the right (e.g. "University"). */
  badge?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: SearchSuggestion[];
  /** Loading state — shows a spinner inside the input. */
  loading?: boolean;
  /** Submit handler — fired on Enter or on suggestion click. */
  onSubmit?: (value: string) => void;
  className?: string;
  /** Input size — defaults to lg for hero usage. */
  size?: "default" | "lg";
  /** Accessible label. */
  ariaLabel?: string;
  /** Auto-focus the input on mount. */
  autoFocus?: boolean;
}

/**
 * Render a debounced search input with a suggestion dropdown.
 */
export function SearchBar({
  placeholder = "Search…",
  value,
  onChange,
  suggestions = [],
  loading = false,
  onSubmit,
  className,
  size = "default",
  ariaLabel = "Search",
  autoFocus = false,
}: SearchBarProps) {
  const [internal, setInternal] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value -> internal input (e.g. when URL changes).
  useEffect(() => {
    setInternal(value);
  }, [value]);

  // Debounced onChange.
  const debouncedChange = useCallback(
    (newValue: string) => {
      setInternal(newValue);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Open suggestions when input has >= 2 chars and suggestions exist.
  useEffect(() => {
    if (internal.trim().length >= 2 && suggestions.length > 0) {
      setOpen(true);
      setActiveIdx(-1);
    } else {
      setOpen(false);
    }
  }, [internal, suggestions.length]);

  // Click-outside to close.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx((idx) => Math.min(idx + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((idx) => Math.max(idx - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        const selected = suggestions[activeIdx];
        if (selected.href) {
          window.location.href = selected.href;
        } else if (selected.label) {
          setInternal(selected.label);
          onChange(selected.label);
          onSubmit?.(selected.label);
          setOpen(false);
        }
      } else {
        onSubmit?.(internal);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const clearInput = () => {
    setInternal("");
    onChange("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={internal}
          onChange={(e) => debouncedChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (internal.trim().length >= 2 && suggestions.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          role="combobox"
          autoFocus={autoFocus}
          autoComplete="off"
          className={cn(
            "h-11 w-full rounded-xl border-ink-200 bg-white pl-10 pr-10 text-sm text-ink-900 shadow-soft transition-colors placeholder:text-ink-400 focus-visible:border-orange-400 focus-visible:ring-orange-400/30",
            size === "lg" && "h-14 rounded-2xl pl-12 pr-12 text-base",
          )}
        />
        {loading ? (
          <Loader2
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-500"
            aria-hidden="true"
          />
        ) : internal ? (
          <button
            type="button"
            onClick={clearInput}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Suggestion dropdown */}
      {showSuggestions && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-ink-200 bg-white p-1.5 shadow-lg scroll-area"
        >
          {suggestions.map((s, idx) => (
            <li key={`${s.label}-${idx}`} role="option" aria-selected={idx === activeIdx}>
              <button
                type="button"
                onClick={() => {
                  if (s.href) {
                    window.location.href = s.href;
                  } else {
                    setInternal(s.label);
                    onChange(s.label);
                    onSubmit?.(s.label);
                    setOpen(false);
                  }
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none",
                  idx === activeIdx ? "bg-blue-50" : "hover:bg-blue-50",
                )}
              >
                <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink-900">
                      {s.label}
                    </span>
                    {s.badge && (
                      <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {s.description}
                    </p>
                  )}
                </div>
                <ArrowRight
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
