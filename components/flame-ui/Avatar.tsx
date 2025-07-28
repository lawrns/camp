import React from "react";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ name = "", src, size = "md", className = "", children }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (children) {
    return <div className={`rounded-ds-full ${sizeClasses[size]} ${className}`}>{children}</div>;
  }

  if (src) {
    return <img src={src} alt={name} className={`rounded-ds-full object-cover ${sizeClasses[size]} ${className}`} />;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-ds-full bg-gray-300 font-semibold text-gray-700 ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt, className = "", ...props }, ref) => (
    <img ref={ref} src={src} alt={alt} className={`h-full w-full rounded-ds-full object-cover ${className}`} {...props} />
  )
);
AvatarImage.displayName = "AvatarImage";

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export const AvatarFallback = ({ children, className = "" }: AvatarFallbackProps) => (
  <div
    className={`flex h-full w-full items-center justify-center rounded-ds-full bg-gray-300 font-semibold text-gray-700 ${className}`}
  >
    {children}
  </div>
);

export default Avatar;
