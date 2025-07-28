// Unified UI Types

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface VariantProps {
  variant?: string;
  size?: string;
}

export interface ButtonProps extends ComponentProps, VariantProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

export interface InputProps extends ComponentProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}

export interface CardProps extends ComponentProps {
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
}

// Legacy type exports for backward compatibility
export type { ComponentProps as FlameUIComponentProps };
export type { ComponentProps as PhoenixUIComponentProps };
