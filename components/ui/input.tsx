import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-xl border border-input bg-background/90 px-3 py-1 text-base shadow-[inset_0_1px_2px_oklch(0.22_0.04_260_/_0.05)] outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-[var(--ease-out)] file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:shadow-[inset_0_1px_2px_oklch(0.22_0.04_260_/_0.06),0_0_0_3px_color-mix(in_oklch,var(--ring)_35%,transparent)] focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_1px_2px_oklch(0.22_0.04_260_/_0.05),0_0_0_3px_color-mix(in_oklch,var(--destructive)_25%,transparent)] aria-invalid:ring-0 md:text-sm dark:bg-input/25 dark:focus-visible:bg-input/35 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
