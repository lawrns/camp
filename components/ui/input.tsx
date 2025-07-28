import * as React from "react";
import { cn } from "@/lib/utils";
import type { InputProps } from "./types";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, error, label, helperText, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        className={cn(
          "text-sm file:text-sm flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={helperText || error ? `${props.id || props.name}-description` : undefined}
        {...props}
      />
    );

    if (!label && !helperText && !error) {
      return inputElement;
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        {inputElement}
        {(helperText || error) && (
          <p
            id={`${props.id || props.name}-description`}
            className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
