import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  className?: string;
  title?: string;
}

export function Button({
  onClick,
  children,
  disabled = false,
  type = "button",
  variant = "primary",
  className = "",
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`phoenix-button phoenix-button-${variant} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}
