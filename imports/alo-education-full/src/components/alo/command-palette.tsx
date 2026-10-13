"use client";

/**
 * ALO Education Command Palette
 * ==============================
 * Global Cmd+K / Ctrl+K command palette for instant navigation & actions.
 *
 * Inspired by Linear, Notion, Stripe, and Vercel command palettes.
 *
 * Features:
 *   - Opens with ⌘K (Mac) / Ctrl+K (Windows/Linux)
 *   - Fuzzy search across all views, actions, and quick links
 *   - Grouped results (Navigation / Actions / Communication / System)
 *   - Keyboard navigation (↑↓ to move, Enter to select, Esc to close)
 *   - Recently visited views
 *   - Quick actions (Create Lead, New Task, etc.)
 *
 * Usage:
 *   <CommandPalette role={role} onViewChange={onViewChange} />
 *
 * Place inside AppShell. Listens for keydown globally.
 */

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV_ITEMS, type ViewKey } from "@/lib/alo-types";
import { Icon } from "./shared";

export interface CommandAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  group: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  role: string;
  onViewChange: (v: ViewKey) => void;
  actions?: CommandAction[];
  /** External trigger to open (e.g. from a header button) */
  openSignal?: number;
}

export function CommandPalette({ role, onViewChange, actions = [], openSignal }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<ViewKey[]>([]);

  // Global Cmd+K / Ctrl+K listener
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // External open trigger
  React.useEffect(() => {
    if (openSignal !== undefined && openSignal > 0) {
      setOpen(true);
    }
  }, [openSignal]);

  // Filter nav items by role
  const visibleNav = React.useMemo(
    () => NAV_ITEMS.filter((n) => n.roles.includes("*") || n.roles.includes(role)),
    [role]
  );

  // Group nav items
  const navGroups = React.useMemo(() => {
    const groups: Record<string, typeof visibleNav> = {};
    for (const item of visibleNav) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [visibleNav]);

  const handleViewSelect = (v: ViewKey) => {
    setRecent((prev) => [v, ...prev.filter((p) => p !== v)].slice(0, 5));
    onViewChange(v);
    setOpen(false);
  };

  const handleActionSelect = (action: CommandAction) => {
    action.onSelect();
    setOpen(false);
  };

  // Default quick actions (can be extended via props)
  const defaultActions: CommandAction[] = [
    {
      id: "refresh",
      label: "Refresh current view",
      icon: "RotateCw",
      shortcut: "R",
      group: "Actions",
      onSelect: () => window.location.reload(),
    },
    {
      id: "scroll-top",
      label: "Scroll to top",
      icon: "ArrowUpToLine",
      group: "Actions",
      onSelect: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
  ];

  const allActions = [...defaultActions, ...actions];

  return (
    <>
      {/* Hidden trigger for accessibility — the actual button is in the header */}
      <button
        type="button"
        aria-label="Open command palette"
        className="sr-only"
        onClick={() => setOpen(true)}
      >
        Open command palette
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} className="max-w-2xl">
        <CommandInput placeholder="Search views, actions, or type a command..." />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent views */}
          {recent.length > 0 && (
            <>
              <CommandGroup heading="Recently Visited">
                {recent.map((v) => {
                  const item = NAV_ITEMS.find((n) => n.key === v);
                  if (!item) return null;
                  return (
                    <CommandItem
                      key={`recent-${v}`}
                      value={`${item.label} recent ${v}`}
                      onSelect={() => handleViewSelect(v)}
                      className="gap-2"
                    >
                      <Icon name={item.icon} className="size-4 text-[var(--alo-blue)]" />
                      <span>{item.label}</span>
                      <CommandShortcut>Recent</CommandShortcut>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation groups */}
          {Object.entries(navGroups).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${item.label} ${item.key} navigate`}
                  onSelect={() => handleViewSelect(item.key)}
                  className="gap-2"
                >
                  <Icon name={item.icon} className="size-4 text-[var(--alo-blue)]" />
                  <span>{item.label}</span>
                  <CommandShortcut>{group}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {/* Actions */}
          {allActions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                {allActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.id} action`}
                    onSelect={() => handleActionSelect(action)}
                    className="gap-2"
                  >
                    <Icon name={action.icon} className="size-4 text-[var(--alo-orange)]" />
                    <span>{action.label}</span>
                    {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Help */}
          <CommandSeparator />
          <CommandGroup heading="Tips">
            <CommandItem value="tip search" onSelect={() => {}} className="gap-2 opacity-70">
              <Icon name="Lightbulb" className="size-4 text-[var(--alo-sunshine)]" />
              <span>Type to search · ↑↓ to navigate · Enter to select · Esc to close</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

/**
 * CommandPaletteTrigger — a button styled for headers/toolbars
 * that opens the command palette via the openSignal prop.
 */
export function CommandPaletteTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-3 py-1.5 text-sm text-[var(--alo-muted)] transition-colors hover:border-[var(--alo-border-strong)] hover:bg-[var(--alo-surface)] hover:text-[var(--alo-text)] ${className || ""}`}
    >
      <Icon name="Search" className="size-4" />
      <span className="hidden sm:inline">Search or jump to...</span>
      <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-[var(--alo-border)] bg-[var(--alo-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--alo-muted)] sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
