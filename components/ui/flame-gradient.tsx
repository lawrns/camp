"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FlameGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function FlameGradient({ className, children, ...props }: FlameGradientProps) {
  return (
    <div
      className={cn("relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500", className)}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
