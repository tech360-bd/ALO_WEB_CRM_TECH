import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-input border border-input bg-white px-3 text-base md:text-sm text-foreground transition-colors duration-150 outline-none",
        "placeholder:text-alo-placeholder",
        "focus-visible:border-alo-brand focus-visible:ring-alo-brand/20 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-card dark:border-border",
        "aria-invalid:border-crm-danger aria-invalid:ring-crm-danger/20 dark:aria-invalid:ring-crm-danger/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }