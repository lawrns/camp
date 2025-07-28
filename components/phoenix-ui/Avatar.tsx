import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, alt, name, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return <img src={src} alt={alt || name} className={`phoenix-avatar phoenix-avatar-${size}`} />;
  }

  return <div className={`phoenix-avatar phoenix-avatar-${size} phoenix-avatar-initials`}>{initials}</div>;
}
