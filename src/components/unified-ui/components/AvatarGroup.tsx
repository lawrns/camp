/**
 * Avatar Group Component
 * Displays multiple avatars in a group with overflow handling
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarGroupProps {
  avatars: {
    src?: string;
    alt?: string;
    name?: string;
    fallback?: string;
  }[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({ avatars, maxVisible = 3, size = "md", className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = avatars.length - maxVisible;

  const sizeStyles = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const Avatar = ({
    src,
    alt,
    name,
    fallback,
    className: avatarClassName,
  }: {
    src?: string;
    alt?: string;
    name?: string;
    fallback?: string;
    className?: string;
  }) => {
    const initials =
      fallback ||
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ||
      "?";

    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-ds-full border-2 border-background bg-muted",
          sizeStyles[size],
          avatarClassName
        )}
      >
        {src ? (
          <img src={src} alt={alt || name || "Avatar"} className="h-full w-full rounded-ds-full object-cover" />
        ) : (
          <span className="font-medium text-muted-foreground">{initials}</span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar key={avatar.src || avatar.name || avatar.alt || `avatar-${index}`} {...avatar} className="transition-all duration-200 hover:z-10" />
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            "inline-flex items-center justify-center rounded-ds-full border-2 border-background bg-muted",
            sizeStyles[size]
          )}
        >
          <span className="font-medium text-muted-foreground">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}

export default AvatarGroup;
