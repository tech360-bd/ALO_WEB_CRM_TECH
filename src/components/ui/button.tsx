import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * ALO Education Button
 *
 * Variants follow the ALO Design Language:
 *   - default  → Education Blue (workhorse, primary action)
 *   - alo      → alias for default (blue)
 *   - cta      → ALO Orange strong (accessible white-text CTA, identity)
 *   - orange   → ALO Orange decorative
 *   - outline  → bordered surface
 *   - ghost    → transparent hover
 *   - subtle   → soft-tinted background (blue-soft)
 *   - secondary→ muted surface
 *   - destructive → danger red
 *   - link     → inline link
 *
 * Sizes: xs | sm | default | lg | xl | icon | icon-sm | icon-lg
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--alo-blue)] text-white shadow-[var(--alo-shadow-sm)] hover:bg-[var(--alo-blue-hover)] hover:shadow-[var(--alo-shadow-md)]",
        alo:
          "bg-[var(--alo-blue)] text-white shadow-[var(--alo-shadow-sm)] hover:bg-[var(--alo-blue-hover)] hover:shadow-[var(--alo-shadow-md)]",
        cta:
          "bg-[var(--alo-orange-strong)] text-white shadow-[var(--alo-shadow-sm)] hover:bg-[#B84F0F] hover:shadow-[var(--alo-shadow-orange)]",
        orange:
          "bg-[var(--alo-orange)] text-white shadow-[var(--alo-shadow-sm)] hover:bg-[var(--alo-orange-hover)] hover:shadow-[var(--alo-shadow-orange)]",
        outline:
          "border border-[var(--alo-border)] bg-[var(--alo-surface)] text-[var(--alo-text)] shadow-[var(--alo-shadow-xs)] hover:bg-[var(--alo-surface-muted)] hover:border-[var(--alo-border-strong)] dark:bg-[var(--alo-surface)] dark:border-[var(--alo-border)] dark:hover:bg-[var(--alo-surface-muted)]",
        "outline-blue":
          "border border-[var(--alo-blue)] bg-[var(--alo-blue-soft)] text-[var(--alo-blue-strong)] hover:bg-[var(--alo-blue)] hover:text-white",
        "outline-orange":
          "border border-[var(--alo-orange)] bg-[var(--alo-orange-soft)] text-[var(--alo-orange-strong)] hover:bg-[var(--alo-orange)] hover:text-white",
        subtle:
          "bg-[var(--alo-blue-soft)] text-[var(--alo-blue-strong)] hover:bg-[var(--alo-blue)] hover:text-white",
        "subtle-orange":
          "bg-[var(--alo-orange-soft)] text-[var(--alo-orange-strong)] hover:bg-[var(--alo-orange)] hover:text-white",
        secondary:
          "bg-[var(--alo-surface-muted)] text-[var(--alo-text)] shadow-[var(--alo-shadow-xs)] hover:bg-[var(--alo-border)]",
        ghost:
          "text-[var(--alo-text)] hover:bg-[var(--alo-surface-muted)] hover:text-[var(--alo-text)] dark:hover:bg-[var(--alo-surface-muted)]",
        destructive:
          "bg-[var(--alo-danger)] text-white shadow-[var(--alo-shadow-sm)] hover:bg-[var(--alo-danger-strong)] focus-visible:ring-[var(--alo-danger)]/20 dark:bg-[var(--alo-danger)]/80",
        link: "text-[var(--alo-blue)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs gap-1 has-[>svg]:px-2",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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

export { Button, buttonVariants }
