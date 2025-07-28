import React from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "search";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  success?: boolean;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  helper?: string;
  className?: string;
  variant?: "default" | "glass" | "floating" | "minimal";
}

export interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  placeholder?: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "glass" | "floating";
}

export interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  success?: boolean;
  required?: boolean;
  disabled?: boolean;
  helper?: string;
  className?: string;
  variant?: "default" | "glass" | "floating";
}

export interface FileUploadFieldProps {
  id: string;
  label: string;
  onChange: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  helper?: string;
  className?: string;
  variant?: "default" | "glass" | "dropzone";
}

export interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helper?: string;
  className?: string;
  variant?: "default" | "glass" | "toggle";
}

export interface RadioGroupProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; helper?: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "glass" | "cards";
}

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "card";
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface SubmitButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "glass" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export type FormVariant = "default" | "glass" | "floating" | "minimal";
