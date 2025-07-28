"use client";

import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Warning as AlertCircle, Info } from "@phosphor-icons/react";
import { useAnimation } from "framer-motion";
import React, { forwardRef, useEffect, useState } from "react";
import { TextAreaFieldProps } from "./types";
import { getTextAreaStyles } from "./utils";

export const AnimatedTextArea = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      onBlur,
      placeholder,
      rows = 4,
      error,
      success,
      required,
      disabled,
      helper,
      className,
      variant = "default",
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
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

    const styles = getTextAreaStyles(variant, error, success, disabled);

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

        {/* TextArea Field */}
        <OptimizedMotion.textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={isFloating ? "" : placeholder}
          disabled={disabled}
          rows={rows}
          className={styles.textarea}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.1 }}
        />

        {/* Character Count */}
        {!error && !helper && (
          <div className="mt-1 text-right text-tiny text-[var(--fl-color-text-muted)]">{value.length} characters</div>
        )}

        {/* Helper Text & Error Messages */}
        <OptimizedAnimatePresence>
          {(helper || error) && (
            <OptimizedMotion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="mt-1 flex items-start gap-ds-2 text-sm"
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

AnimatedTextArea.displayName = "AnimatedTextArea";
