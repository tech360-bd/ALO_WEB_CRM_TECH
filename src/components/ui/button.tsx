import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer select-none",
  {
    variants: {
      variant: {
        /* Primary — SaaS Blue #2563EB */
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80",
        /* Brand Blue — #0057B8 */
        brand:
          "bg-alo-brand text-white shadow-sm hover:bg-alo-brand/90 active:bg-alo-brand/80",
        /* CTA Orange — #C2410C accessible with white text */
        cta:
          "bg-alo-cta text-white shadow-sm hover:bg-alo-cta-hover active:bg-alo-cta-hover/90",
        /* Outline */
        outline:
          "border border-border bg-white text-foreground shadow-sm hover:bg-secondary hover:text-secondary-foreground dark:bg-card dark:border-border dark:hover:bg-secondary",
        /* Ghost */
        ghost:
          "hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-secondary",
        /* Link */
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
        /* CRM Success */
        success:
          "bg-crm-success text-white shadow-sm hover:bg-crm-success/90 active:bg-crm-success/80",
        /* CRM Danger */
        danger:
          "bg-crm-danger text-white shadow-sm hover:bg-crm-danger/90 active:bg-crm-danger/80",
        /* Secondary muted */
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        /* Destructive */
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        /* Brand Outline */
        "brand-outline":
          "border-2 border-alo-brand text-alo-brand bg-transparent hover:bg-alo-brand-light",
        /* CTA Outline */
        "cta-outline":
          "border-2 border-alo-cta text-alo-cta bg-transparent hover:bg-alo-cta/5",
      },
      size: {
        sm: "h-8 rounded-md gap-1.5 px-3 text-[13px] has-[>svg]:px-2.5",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-11 rounded-lg px-6 text-[15px] has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
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