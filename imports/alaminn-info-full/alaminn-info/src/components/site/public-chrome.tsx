"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WhatsAppChatWidget } from "@/components/site/whatsapp/whatsapp-chat-widget";
import { NAV_LINKS } from "@/lib/site-data";

/**
 * Simplified premium public-site navigation for multi-page routes.
 * Uses the centralized NAV_LINKS (6 destinations + Schedule CTA).
 * No "Home" item — the logo links to "/".
 */
export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/about") {
      return pathname === "/about" || pathname === "/expertise";
    }
    if (href === "/insights") {
      return pathname === "/insights" || pathname === "/articles" || pathname?.startsWith("/articles/");
    }
    if (href === "/work-with-me") {
      return pathname === "/work-with-me" || pathname === "/contact";
    }
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        {/* Logo → "/" */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg grad-intelligence shadow-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          </span>
          <span className="font-display">Al Aminn</span>
        </Link>

        {/* Desktop nav — 6 links */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive(l.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="hidden sm:inline-flex gap-1.5"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("alaminn:open-schedule-meeting"));
              }
            }}
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="lg:hidden border-t bg-background">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md",
                  isActive(l.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {l.label}
              </Link>
            ))}
            <Button
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => {
                setOpen(false);
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("alaminn:open-schedule-meeting"));
                }
              }}
            >
              <Calendar className="h-4 w-4" />
              Schedule a Meeting
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

/**
 * Compact public footer — used on all multi-page public routes.
 */
export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="container mx-auto max-w-7xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-bold text-lg mb-2">Al Aminn</div>
          <p className="text-sm text-muted-foreground">
            Transforming strategy into scalable operations, growth and intelligent systems.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Platform</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About &amp; Expertise</Link></li>
            <li><Link href="/impact" className="hover:text-foreground">Impact</Link></li>
            <li><Link href="/projects" className="hover:text-foreground">Projects</Link></li>
            <li><Link href="/ecosystem" className="hover:text-foreground">Ecosystem</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Explore</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/insights" className="hover:text-foreground">Insights</Link></li>
            <li><Link href="/higher-study" className="hover:text-foreground">Higher Study</Link></li>
            <li><Link href="/media" className="hover:text-foreground">Media</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Connect</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/work-with-me" className="hover:text-foreground">Work with me</Link></li>
            <li><a href="mailto:hello@alaminn.info" className="hover:text-foreground">hello@alaminn.info</a></li>
            <li>
              <a
                href="https://wa.me/8801716609554?text=Hi%20Alaminn%20AI%2C%20I%27d%20like%20to%20explore%20study-abroad%20options."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp: 01716 609 554
              </a>
            </li>
            <li><Link href="/admin" className="hover:text-foreground">Admin login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Al Aminn. All rights reserved. · Based in Dhaka, Bangladesh.
      </div>
    </footer>
  );
}

/** Page wrapper for public routes — applies nav + footer + min-height layout. */
export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main id="main-content" className="flex-1">{children}</main>
      <PublicFooter />
      <WhatsAppChatWidget />
    </div>
  );
}
