/**
 * Standardized component prop interfaces for consistent usage across the codebase
 */

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { type VariantProps } from "class-variance-authority";

// Base component props that all components should extend
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Button component standard props
export interface ButtonVariants {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseComponentProps>,
    BaseComponentProps,
    ButtonVariants {
  loading?: boolean;
  asChild?: boolean;
}

// Input component standard props
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseComponentProps>,
    BaseComponentProps {
  error?: string | boolean;
  label?: string;
  helperText?: string;
}

// Form component standard props
export interface FormProps extends Omit<HTMLAttributes<HTMLFormElement>, keyof BaseComponentProps>, BaseComponentProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  isLoading?: boolean;
  error?: Error | string | null;
}

// Card component standard props
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, keyof BaseComponentProps>, BaseComponentProps {
  variant?: "default" | "bordered" | "elevated";
}

// Select component standard props
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  label?: string;
}

// Modal/Dialog component standard props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  preventClose?: boolean;
}

// Common layout props
export interface LayoutProps extends BaseComponentProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

// Common state props
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
}

export interface ErrorState {
  error: Error | string | null;
  onRetry?: () => void;
}

export interface EmptyState {
  isEmpty: boolean;
  emptyText?: string;
  emptyIcon?: ReactNode;
}

// Composite state props
export type DataStateProps = LoadingState & ErrorState & EmptyState;

// Form field props
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

// List/Table props
export interface ListProps<T> extends BaseComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  error?: Error | string | null;
}

// Pagination props
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}
