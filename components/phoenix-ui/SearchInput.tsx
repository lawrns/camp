import React from "react";
import { Input } from "./Input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchInput({ value, onChange, placeholder = "Search conversations...", onClear }: SearchInputProps) {
  return (
    <div className="phoenix-search-container">
      <div className="phoenix-search-icon">🔍</div>
      <Input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="phoenix-search-input"
      />
      {value && (
        <button onClick={onClear || (() => onChange(""))} className="phoenix-search-clear" aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
