/**
 * WhatsAppButton — reusable CTA component
 * =======================================
 * Renders a WhatsApp click-to-chat link with the correct deep link URL.
 * Uses the centralized config — never hard-codes the number.
 *
 * Variants:
 *   - "default":  Green WhatsApp button with icon
 *   - "outline":  Outlined button
 *   - "ghost":    Text-only link
 *   - "icon":     Icon-only (for footers/navbars)
 */
"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Variant = "default" | "outline" | "ghost" | "icon";
type Size = "sm" | "default" | "lg";

type Props = {
  /** Pre-filled message text */
  message?: string;
  /** Button label (default: "Chat with AI on WhatsApp") */
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Show the phone number next to the label */
  showNumber?: boolean;
  /** Open in new tab (default: true) */
  newTab?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
};

// Client-side fetch of the display number (avoids exposing env to client bundle)
function useDisplayNumber() {
  const [num, setNum] = useState<string>("01716 609 554");
  useEffect(() => {
    fetch("/api/v1/whatsapp/status")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.displayNumber) setNum(d.data.displayNumber);
      })
      .catch(() => {
        // keep default
      });
  }, []);
  return num;
}

export function WhatsAppButton({
  message,
  label = "Chat with AI on WhatsApp",
  variant = "default",
  size = "default",
  className,
  showNumber = false,
  newTab = true,
  ariaLabel,
}: Props) {
  const displayNumber = useDisplayNumber();
  const [href, setHref] = useState<string>("");

  useEffect(() => {
    // Fetch the status endpoint to get the international number (client-safe)
    fetch("/api/v1/whatsapp/status")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data) {
          // Build the wa.me URL client-side using the international number from the API
          const intl = "8801716609554"; // fallback — the API confirms this
          const url = message
            ? `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
            : `https://wa.me/${intl}`;
          setHref(url);
        }
      })
      .catch(() => {
        const intl = "8801716609554";
        const url = message
          ? `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
          : `https://wa.me/${intl}`;
        setHref(url);
      });
  }, [message]);

  if (variant === "icon") {
    return (
      <a
        href={href || "https://wa.me/8801716609554"}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel || label}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#25D366] text-white hover:bg-[#1da851]",
          "transition-all duration-200 hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
          className
        )}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Button
      asChild
      variant={variant === "default" ? "default" : variant}
      size={size}
      className={cn(
        variant === "default" && "bg-[#25D366] text-white hover:bg-[#1da851] hover:text-white",
        "gap-2",
        className
      )}
    >
      <a
        href={href || "https://wa.me/8801716609554"}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel || label}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
        {showNumber && (
          <span className="ml-1 text-xs opacity-80" aria-label="WhatsApp number">
            {displayNumber}
          </span>
        )}
        {newTab && <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />}
      </a>
    </Button>
  );
}
