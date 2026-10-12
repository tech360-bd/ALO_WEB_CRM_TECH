"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "./shared";
import { CommandPalette, CommandPaletteTrigger } from "./command-palette";
import { NAV_ITEMS, ROLES, type ViewKey } from "@/lib/alo-types";

interface AppShellProps {
  view: ViewKey;
  role: string;
  onViewChange: (v: ViewKey) => void;
  onRoleChange: (r: string) => void;
  children: React.ReactNode;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gradient text-white alo-shadow">
        <span className="text-lg font-black tracking-tight">A</span>
      </div>
      <div className="leading-tight">
        <p className="text-base font-black text-[#2563EB]">ALO Education</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Study Abroad OS</p>
      </div>
    </div>
  );
}

function NavList({ view, onViewChange, role, onNavigate }: { view: ViewKey; onViewChange: (v: ViewKey) => void; role: string; onNavigate?: () => void }) {
  const groups = Array.from(new Set(NAV_ITEMS.map((n) => n.group)));
  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {groups.map((group) => {
        const items = NAV_ITEMS.filter((n) => n.group === group && (n.roles.includes("*") || n.roles.includes(role)));
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group}</p>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = view === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onViewChange(item.key);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      active ? "bg-alo-gradient text-white shadow-md" : "text-foreground hover:bg-[#EAF3FF] hover:text-[#2563EB]"
                    )}
                  >
                    <Icon name={item.icon} className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ view, onViewChange, role, onRoleChange, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteSignal, setPaletteSignal] = React.useState(0);
  const currentRole = ROLES.find((r) => r.value === role);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc]">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-[#2563EB]/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="lg:hidden">
                  <Icon name="Menu" className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="px-4 py-4">
                  <SheetTitle asChild>
                    <div><Logo /></div>
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto alo-scroll">
                  <NavList view={view} onViewChange={onViewChange} role={role} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <Logo />
            {/* Command Palette trigger */}
            <CommandPaletteTrigger
              onClick={() => setPaletteSignal((s) => s + 1)}
              className="ml-2 hidden md:flex"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile command palette trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setPaletteSignal((s) => s + 1)}
              aria-label="Search"
            >
              <Icon name="Search" className="size-5" />
            </Button>
            {/* Role switcher */}
            <div className="hidden items-center gap-2 rounded-xl border border-[#2563EB]/15 bg-[#EAF3FF]/60 px-3 py-1.5 sm:flex">
              <Icon name="ShieldCheck" className="size-4 text-[#2563EB]" />
              <Select value={role} onValueChange={onRoleChange}>
                <SelectTrigger className="h-7 w-[170px] border-0 bg-transparent p-0 text-xs font-semibold text-[#2563EB] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Mobile role switcher */}
            <Select value={role} onValueChange={onRoleChange}>
              <SelectTrigger className="h-9 w-[130px] border-[#2563EB]/15 text-xs font-semibold text-[#2563EB] sm:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="relative">
              <Icon name="Bell" className="size-5 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#F97316]" />
            </Button>
            <div className="flex size-9 items-center justify-center rounded-full bg-alo-gradient text-sm font-bold text-white">
              {currentRole?.label?.[0] ?? "U"}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#2563EB]/10 bg-white lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto alo-scroll">
            <NavList view={view} onViewChange={onViewChange} role={role} />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-[#2563EB]/10 bg-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row lg:px-8">
          <p>
            <span className="font-semibold text-[#2563EB]">ALO Education</span> — Complete Student Management, CRM, Admission & Visa Workflow System
          </p>
          <p className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            System operational · {new Date().getFullYear()} · Bangladesh-focused
          </p>
        </div>
      </footer>

      {/* Command Palette — global Cmd+K / Ctrl+K */}
      <CommandPalette
        role={role}
        onViewChange={onViewChange}
        openSignal={paletteSignal}
      />
    </div>
  );
}
