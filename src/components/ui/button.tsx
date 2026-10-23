import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-[15px] font-semibold leading-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-alo-brand focus-visible:ring-offset-2 cursor-pointer select-none",
  {
    variants: {
      variant: {
        /* PRIMARY ACTION — ALO Orange #F37021 (hover #D95D12, active #B64A0B); black text for contrast. */
        default:
          "bg-alo-cta text-black shadow-sm hover:bg-alo-cta-hover active:bg-alo-cta-active",
        /* Information / navigation / system actions — ALO Blue #0066CC */
        brand:
          "bg-alo-brand text-white shadow-sm hover:bg-alo-brand-hover active:bg-alo-brand-hover",
        /* Legacy alias of `brand` — kept so existing call sites stay valid. */
        alo:
          "bg-alo-brand text-white shadow-sm hover:bg-alo-brand-hover active:bg-alo-brand-hover",
        /* Legacy alias of `default` (orange primary). */
        cta:
          "bg-alo-cta text-black shadow-sm hover:bg-alo-cta-hover active:bg-alo-cta-active",
        /* SECONDARY (Master §07) — white, blue text, blue-tint border, pale-blue hover */
        outline:
          "border border-alo-brand-border bg-white text-alo-brand shadow-sm hover:bg-alo-brand-light dark:bg-card dark:text-foreground dark:hover:bg-secondary",
        /* TERTIARY (Master §07) — transparent, blue text, pale-blue hover */
        ghost:
          "text-alo-brand hover:bg-alo-brand-pale dark:hover:bg-secondary",
        /* Link — inline text action (blue) */
        link:
          "text-alo-brand underline-offset-4 hover:text-alo-brand-hover hover:underline p-0 h-auto min-h-0",
        /* SUCCESS — use sparingly (completed / verified) */
        success:
          "bg-alo-success text-white shadow-sm hover:bg-alo-success-dark active:bg-alo-success-dark",
        /* Secondary muted */
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        /* DANGER — destructive operations only */
        destructive:
          "bg-alo-error text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-alo-error/30 dark:bg-destructive/60",
        /* Danger (CRM alias) */
        danger:
          "bg-alo-error text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        /* Brand outline (blue information action) */
        "brand-outline":
          "border border-alo-brand text-alo-brand bg-white hover:bg-alo-brand-light",
        /* CTA outline (orange secondary primary) */
        "cta-outline":
          "border border-alo-cta text-alo-cta-active bg-white hover:bg-alo-cta-soft",
      },
      size: {
        /* Master §07: ALL buttons are at least 48px tall (touch-safe).
           xs/sm keep compact widths/typography for dense CRM toolbars
           without dropping below the 48px minimum height. */
        xs: "h-12 rounded-button gap-1 px-2.5 text-xs has-[>svg]:px-2",
        sm: "h-12 rounded-button gap-1.5 px-3.5 text-[13px] has-[>svg]:px-3",
        default: "h-12 px-5 py-2.5 has-[>svg]:px-4",
        lg: "h-12 rounded-button px-6 text-[15px] has-[>svg]:px-5",
        xl: "h-[52px] rounded-button px-7 text-[15px] has-[>svg]:px-6",
        icon: "size-12",
        "icon-sm": "size-12",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

/** Public type aliases for the design-system variants/sizes (used by AloCtaLink etc.) */
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

export { Button, buttonVariants }