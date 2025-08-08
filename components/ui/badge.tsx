import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClass =
    variant === "secondary"
      ? "bg-gray-100 text-gray-800"
      : variant === "outline"
      ? "border border-gray-300 text-gray-800"
      : variant === "destructive"
      ? "bg-red-100 text-red-800"
      : variant === "success"
      ? "bg-green-100 text-green-800"
      : "bg-gray-900 text-white";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        variantClass,
        className
      )}
      {...props}
    />
  );
}
