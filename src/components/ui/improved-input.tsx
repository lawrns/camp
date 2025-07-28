import * as React from "react";
import { cn } from "@/lib/utils";

export interface ImprovedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const ImprovedInput = React.forwardRef<HTMLInputElement, ImprovedInputProps>(
  ({ className, label, error, hint, icon, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="text-foreground text-sm font-medium dark:text-neutral-300">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400">{icon}</div>}
          <input
            className={cn(
              "text-typography-sm file:text-typography-sm flex h-10 w-full rounded-ds-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-brand-mahogany-500 focus-visible:ring-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-tiny text-[var(--fl-color-text-muted)] dark:text-gray-400">{hint}</p>}
        {error && <p className="text-tiny text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);
ImprovedInput.displayName = "ImprovedInput";

export { ImprovedInput };
