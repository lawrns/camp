/**
 * Glass Morphism Components
 * Provides glass-like visual effects for modern UI
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "strong";
  blur?: "sm" | "md" | "lg";
}

export function GlassCard({ children, className, variant = "default", blur = "md" }: GlassCardProps) {
  const variantStyles = {
    default: "bg-white/10 border-white/20",
    subtle: "bg-white/5 border-white/10",
    strong: "bg-white/20 border-white/30",
  };

  const blurStyles = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  };

  return (
    <div className={cn("rounded-ds-lg border backdrop-saturate-150", variantStyles[variant], blurStyles[blur], className)}>
      {children}
    </div>
  );
}

export interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "secondary";
}

export function GlassButton({ children, className, onClick, disabled = false, variant = "default" }: GlassButtonProps) {
  const variantStyles = {
    default: "bg-white/10 border-white/20 hover:bg-white/20 text-white",
    primary: "bg-blue-500/20 border-[var(--fl-color-border-interactive)]/30 hover:bg-blue-500/30 text-blue-100",
    secondary: "bg-gray-500/20 border-[var(--fl-color-border-hover)]/30 hover:bg-gray-500/30 text-gray-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-ds-lg border px-4 py-2 backdrop-blur-md backdrop-saturate-150 transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export interface GlassModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function GlassModal({ children, isOpen, onClose, className }: GlassModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 rounded-ds-xl border border-white/20 bg-white/10 spacing-4 backdrop-blur-md backdrop-saturate-150",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
