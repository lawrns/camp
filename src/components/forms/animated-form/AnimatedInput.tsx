"use client";

import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { AlertTriangle as AlertCircle, CheckCircle as Check, Eye, EyeSlash as EyeOff, Info } from "lucide-react";
import { useAnimation } from "framer-motion";
import React, { forwardRef, useEffect, useState } from "react";
import { FormFieldProps } from "./types";
import { getInputStyles } from "./utils";

export const AnimatedInput = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      type = "text",
      placeholder,
      value,
      onChange,
      onBlur,
      error,
      success,
      required,
      disabled,
      icon: IconComponent,
      helper,
      className,
      variant = "default",
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const controls = useAnimation();
    const labelControls = useAnimation();

    const hasValue = value.length > 0;
    const isFloating = variant === "floating" || variant === "glass";
    const shouldFloatLabel = isFloating && (hasValue || isFocused);

    useEffect(() => {
      if (error) {
        controls.start({
          x: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 },
        });
      }
    }, [error, controls]);

    useEffect(() => {
      if (shouldFloatLabel) {
        labelControls.start({
          y: -20,
          scale: 0.8,
          color: isFocused ? "#3b82f6" : "#6b7280",
          transition: { duration: 0.2, ease: "easeOut" },
        });
      } else {
        labelControls.start({
          y: 0,
          scale: 1,
          color: "#6b7280",
          transition: { duration: 0.2, ease: "easeOut" },
        });
      }
    }, [shouldFloatLabel, isFocused, labelControls]);

    const styles = getInputStyles(variant, error, success, disabled);

    return (
      <OptimizedMotion.div animate={controls} className={cn(styles.container, className)}>
        {/* Label */}
        {isFloating ? (
          <OptimizedMotion.label htmlFor={id} animate={labelControls} className={styles.label}>
            {label}
            {required && <span className="text-brand-mahogany-500 ml-1">*</span>}
          </OptimizedMotion.label>
        ) : (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className="text-brand-mahogany-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Leading Icon */}
          {IconComponent && (
            <OptimizedMotion.div
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 transform"
              animate={{
                color: isFocused ? "#3b82f6" : "#6b7280",
                scale: isFocused ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <IconComponent className="h-5 w-5" />
            </OptimizedMotion.div>
          )}

          {/* Input Field */}
          <OptimizedMotion.input
            ref={ref}
            id={id}
            type={type === "password" && showPassword ? "text" : type}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={isFloating ? "" : placeholder}
            disabled={disabled}
            className={cn(styles.input, IconComponent && "pl-12", type === "password" && "pr-12")}
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.1 }}
          />

          {/* Password Toggle */}
          {type === "password" && (
            <OptimizedMotion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <Icon icon={EyeOff} className="h-5 w-5" /> : <Icon icon={Eye} className="h-5 w-5" />}
            </OptimizedMotion.button>
          )}

          {/* Success/Error Icons */}
          {(success || error) && (
            <OptimizedMotion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 transform"
            >
              {success && <Icon icon={Check} className="text-semantic-success h-5 w-5" />}
              {error && <Icon icon={AlertCircle} className="text-brand-mahogany-500 h-5 w-5" />}
            </OptimizedMotion.div>
          )}
        </div>

        {/* Helper Text & Error Messages */}
        <OptimizedAnimatePresence>
          {(helper || error) && (
            <OptimizedMotion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-ds-2 text-sm"
            >
              {error ? (
                <>
                  <Icon icon={AlertCircle} className="text-brand-mahogany-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-red-600">{error}</span>
                </>
              ) : helper ? (
                <>
                  <Icon icon={Info} className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="text-foreground">{helper}</span>
                </>
              ) : null}
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </OptimizedMotion.div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";
