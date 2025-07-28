import React from "react";

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  onKeyDown,
  className = "",
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={`phoenix-input ${className}`}
    />
  );
}
