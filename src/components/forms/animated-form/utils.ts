import { cn } from "@/lib/utils";

export const getInputStyles = (variant: string, error?: string, success?: boolean, disabled?: boolean) => {
  switch (variant) {
    case "glass":
      return {
        container: "relative",
        input: cn(
          "w-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md",
          "rounded-ds-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          "transition-all duration-200 focus:border-brand-blue-500/50",
          "placeholder-gray-400",
          error && "border-brand-mahogany-500/50 focus:ring-red-500/50",
          success && "border-[var(--fl-color-success)]/50 focus:ring-green-500/50",
          disabled && "cursor-not-allowed opacity-50"
        ),
        label: "absolute left-4 top-3 text-gray-600 pointer-events-none origin-left",
      };
    case "floating":
      return {
        container: "relative",
        input: cn(
          "w-full rounded-ds-lg border-2 border-[var(--fl-color-border)] px-4 py-3",
          "transition-all duration-200 focus:border-brand-blue-500 focus:outline-none",
          "placeholder-transparent",
          error && "border-brand-mahogany-500 focus:border-[var(--fl-color-danger)]",
          success && "border-[var(--fl-color-success)] focus:border-[var(--fl-color-success)]",
          disabled && "cursor-not-allowed bg-neutral-50 opacity-50"
        ),
        label: "absolute left-4 top-3 text-gray-600 pointer-events-none origin-left transition-all duration-200",
      };
    case "minimal":
      return {
        container: "relative",
        input: cn(
          "w-full border-0 border-b-2 border-[var(--fl-color-border)] bg-transparent px-0 py-2",
          "transition-all duration-200 focus:border-brand-blue-500 focus:outline-none",
          "placeholder-gray-400",
          error && "border-brand-mahogany-500 focus:border-[var(--fl-color-danger)]",
          success && "border-[var(--fl-color-success)] focus:border-[var(--fl-color-success)]",
          disabled && "cursor-not-allowed opacity-50"
        ),
        label: "absolute left-0 top-2 text-gray-600 pointer-events-none origin-left",
      };
    default:
      return {
        container: "space-y-2",
        input: cn(
          "w-full rounded-ds-lg border border-[var(--fl-color-border)] px-4 py-3",
          "focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "placeholder-gray-400 transition-all duration-200",
          error && "border-brand-mahogany-500 focus:border-[var(--fl-color-danger)] focus:ring-red-500",
          success && "border-[var(--fl-color-success)] focus:border-[var(--fl-color-success)] focus:ring-green-500",
          disabled && "cursor-not-allowed bg-neutral-50 opacity-50"
        ),
        label: "block text-sm font-medium text-gray-700",
      };
  }
};

export const getSelectStyles = (variant: string, error?: string, success?: boolean, disabled?: boolean) => {
  switch (variant) {
    case "glass":
      return {
        container: "relative",
        trigger: cn(
          "w-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md",
          "rounded-ds-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          "cursor-pointer transition-all duration-200",
          error && "border-brand-mahogany-500/50",
          success && "border-[var(--fl-color-success)]/50",
          disabled && "cursor-not-allowed opacity-50"
        ),
        dropdown:
          "absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md border border-white/20 rounded-ds-lg shadow-lg z-50",
      };
    case "floating":
      return {
        container: "relative",
        trigger: cn(
          "w-full rounded-ds-lg border-2 border-[var(--fl-color-border)] px-4 py-3",
          "cursor-pointer transition-all duration-200 focus:border-brand-blue-500 focus:outline-none",
          error && "border-brand-mahogany-500",
          success && "border-[var(--fl-color-success)]",
          disabled && "cursor-not-allowed bg-neutral-50 opacity-50"
        ),
        dropdown:
          "absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--fl-color-border)] rounded-ds-lg shadow-lg z-50",
      };
    default:
      return {
        container: "space-y-2",
        trigger: cn(
          "w-full rounded-ds-lg border border-[var(--fl-color-border)] px-4 py-3",
          "focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "cursor-pointer transition-all duration-200",
          error && "border-brand-mahogany-500 focus:ring-red-500",
          success && "border-[var(--fl-color-success)] focus:ring-green-500",
          disabled && "cursor-not-allowed bg-neutral-50 opacity-50"
        ),
        dropdown:
          "absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--fl-color-border)] rounded-ds-lg shadow-lg z-50",
      };
  }
};

export const getTextAreaStyles = (variant: string, error?: string, success?: boolean, disabled?: boolean) => {
  switch (variant) {
    case "glass":
      return {
        container: "relative",
        textarea: cn(
          "w-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md",
          "rounded-ds-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          "resize-none transition-all duration-200 focus:border-brand-blue-500/50",
          "placeholder-gray-400",
          error && "border-brand-mahogany-500/50 focus:ring-red-500/50",
          success && "border-[var(--fl-color-success)]/50 focus:ring-green-500/50",
          disabled && "cursor-not-allowed opacity-50"
        ),
        label: "absolute left-4 top-3 text-gray-600 pointer-events-none origin-left",
      };
    case "floating":
      return {
        container: "relative",
        textarea: cn(
          "w-full rounded-ds-lg border-2 border-[var(--fl-color-border)] px-4 py-3",
          "resize-none transition-all duration-200 focus:border-brand-blue-500 focus:outline-none",
          "placeholder-transparent",
          error && "border-brand-mahogany-500 focus:border-[var(--fl-color-danger)]",
          success && "border-[var(--fl-color-success)] focus:border-[var(--fl-color-success)]",
          disabled && "cursor-not-allowed bg-neutral-50 opacity-50"
        ),
        label: "absolute left-4 top-3 text-gray-600 pointer-events-none origin-left transition-all duration-200",
      };
    default:
      return {
        container: "space-y-2",
        textarea: cn(
          "w-full rounded-ds-lg border border-[var(--fl-color-border)] px-4 py-3",
          "focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "resize-none placeholder-gray-400 transition-all duration-200",
          error && "border-brand-mahogany-500 focus:border-[var(--fl-color-danger)] focus:ring-red-500",
          success && "border-[var(--fl-color-success)] focus:border-[var(--fl-color-success)] focus:ring-green-500",
          disabled && "cursor-not-allowed bg-neutral-50 opacity-50"
        ),
        label: "block text-sm font-medium text-gray-700",
      };
  }
};
