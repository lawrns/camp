"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  return (
    <Image
      src="/images/flamey.png"
      alt="Campfire logo"
      width={size}
      height={size}
      className={cn("select-none object-contain", className)}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      priority
    />
  );
}
