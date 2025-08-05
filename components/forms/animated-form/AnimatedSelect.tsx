"use client";

import React, { useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { AlertTriangle as AlertCircle, CheckCircle as Check, ChevronDown as ChevronDown } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { SelectFieldProps } from "./types";
import { getSelectStyles } from "./utils";

export function AnimatedSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  error,
  success,
  required,
  disabled,
  className,
  variant = "default",
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const styles = getSelectStyles(variant, error, success, disabled);

  return (
    <div className={cn(styles.container, className)} ref={selectRef}>
      {/* Label */}
      <label htmlFor={id} className="text-foreground block text-sm font-medium">
        {label}
        {required && <span className="text-brand-mahogany-500 ml-1">*</span>}
      </label>

      {/* Select Trigger */}
      <OptimizedMotion.div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        className={styles.trigger}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedOption?.icon && (
              <OptimizedMotion.div
                animate={{
                  scale: isFocused ? 1.1 : 1,
                  color: isFocused ? "#3b82f6" : "#6b7280",
                }}
                transition={{ duration: 0.2 }}
              >
                <selectedOption.icon className="h-5 w-5" />
              </OptimizedMotion.div>
            )}
            <span className={selectedOption ? "text-gray-900" : "text-[var(--fl-color-text-muted)]"}>
              {selectedOption?.label || placeholder}
            </span>
          </div>

          <OptimizedMotion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <Icon icon={ChevronDown} className="h-5 w-5 text-gray-400" />
          </OptimizedMotion.div>
        </div>
      </OptimizedMotion.div>

      {/* Dropdown */}
      <OptimizedAnimatePresence>
        {isOpen && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={styles.dropdown}
          >
            <div className="max-h-60 overflow-y-auto py-2">
              {options.map((option, index) => (
                <OptimizedMotion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-neutral-100",
                    value === option.value && "bg-status-info-light text-blue-900"
                  )}
                  whileHover={{ x: 4 }}
                >
                  {option.icon && <option.icon className="h-4 w-4 text-[var(--fl-color-text-muted)]" />}
                  <span>{option.label}</span>
                  {value === option.value && (
                    <OptimizedMotion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                      <Icon icon={Check} className="h-4 w-4 text-blue-600" />
                    </OptimizedMotion.div>
                  )}
                </OptimizedMotion.button>
              ))}
            </div>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>

      {/* Error Message */}
      <OptimizedAnimatePresence>
        {error && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1 flex items-center gap-ds-2 text-sm text-red-600"
          >
            <Icon icon={AlertCircle} className="h-4 w-4" />
            <span>{error}</span>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>
    </div>
  );
}
