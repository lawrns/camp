/**
 * Form Validation System - TEAM2-P4-005
 * Animated validation with real-time feedback and progress tracking
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Warning as AlertCircle,
  CheckCircle as Check,
  Clock,
  Eye,
  Lock,
  Shield,
  Star,
  TrendUp as TrendingUp,
  X,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

export interface ValidationRule {
  id: string;
  test: (value: string, formData?: Record<string, any>) => boolean;
  message: string;
  level: "error" | "warning" | "info";
  strength?: number; // For password strength (0-100)
}

export interface FieldValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
  strength?: number | undefined;
  score?: number | undefined;
}

export interface FormValidationState {
  [fieldId: string]: FieldValidation;
}

// Common validation rules
export const ValidationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    id: "required",
    test: (value) => value.trim().length > 0,
    message,
    level: "error",
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    id: "email",
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
    level: "error",
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    id: "minLength",
    test: (value) => value.length >= length,
    message: message || `Must be at least ${length} characters`,
    level: "error",
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    id: "maxLength",
    test: (value) => value.length <= length,
    message: message || `Must be no more than ${length} characters`,
    level: "error",
  }),

  phone: (message = "Please enter a valid phone number"): ValidationRule => ({
    id: "phone",
    test: (value) => /^[\+]?[\d\s\-\(\)]{10,}$/.test(value),
    message,
    level: "error",
  }),

  url: (message = "Please enter a valid URL"): ValidationRule => ({
    id: "url",
    test: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
    level: "error",
  }),

  // Password strength rules
  passwordLength: (): ValidationRule => ({
    id: "passwordLength",
    test: (value) => value.length >= 8,
    message: "At least 8 characters",
    level: "error",
    strength: 20,
  }),

  passwordUppercase: (): ValidationRule => ({
    id: "passwordUppercase",
    test: (value) => /[A-Z]/.test(value),
    message: "At least one uppercase letter",
    level: "warning",
    strength: 15,
  }),

  passwordLowercase: (): ValidationRule => ({
    id: "passwordLowercase",
    test: (value) => /[a-z]/.test(value),
    message: "At least one lowercase letter",
    level: "warning",
    strength: 15,
  }),

  passwordNumber: (): ValidationRule => ({
    id: "passwordNumber",
    test: (value) => /\d/.test(value),
    message: "At least one number",
    level: "warning",
    strength: 15,
  }),

  passwordSpecial: (): ValidationRule => ({
    id: "passwordSpecial",
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    message: "At least one special character",
    level: "info",
    strength: 20,
  }),

  passwordCommon: (): ValidationRule => ({
    id: "passwordCommon",
    test: (value) => {
      const common = ["password", "123456", "qwerty", "admin", "welcome"];
      return !common.some((p) => value.toLowerCase().includes(p));
    },
    message: "Avoid common passwords",
    level: "warning",
    strength: 15,
  }),

  confirmPassword: (originalField: string, message = "Passwords do not match"): ValidationRule => ({
    id: "confirmPassword",
    test: (value, formData) => value === formData?.[originalField],
    message,
    level: "error",
  }),
};

export function useFormValidation(fields: Record<string, ValidationRule[]>, formData: Record<string, string>) {
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    async (fieldId: string, value: string, debounceMs = 300): Promise<FieldValidation> => {
      const rules = fields[fieldId] || [];

      return new Promise((resolve) => {
        setIsValidating((prev) => ({ ...prev, [fieldId]: true }));

        setTimeout(() => {
          const errors: string[] = [];
          const warnings: string[] = [];
          const infos: string[] = [];
          let totalStrength = 0;
          let maxStrength = 0;

          rules.forEach((rule: any) => {
            if (rule.strength) {
              maxStrength += rule.strength;
            }

            const isValid = rule.test(value, formData);

            if (!isValid) {
              switch (rule.level) {
                case "error":
                  errors.push(rule.message);
                  break;
                case "warning":
                  warnings.push(rule.message);
                  break;
                case "info":
                  infos.push(rule.message);
                  break;
              }
            } else if (rule.strength) {
              totalStrength += rule.strength;
            }
          });

          const strength = maxStrength > 0 ? Math.round((totalStrength / maxStrength) * 100) : undefined;
          const score = Math.max(0, 100 - errors.length * 30 - warnings.length * 15 - infos.length * 5);

          const validation: FieldValidation = {
            isValid: errors.length === 0,
            errors,
            warnings,
            infos,
            ...(strength !== undefined && { strength }),
            score,
          };

          setValidationState((prev) => ({
            ...prev,
            [fieldId]: validation,
          }));

          setIsValidating((prev) => ({ ...prev, [fieldId]: false }));

          resolve(validation);
        }, debounceMs);
      });
    },
    [fields, formData]
  );

  const validateForm = useCallback((): boolean => {
    let isFormValid = true;

    Object.keys(fields).forEach((fieldId: any) => {
      const validation = validationState[fieldId];
      if (!validation?.isValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }, [fields, validationState]);

  const getFormProgress = useCallback((): number => {
    const totalFields = Object.keys(fields).length;
    if (totalFields === 0) return 100;

    const validFields = Object.values(validationState).filter((v: any) => v.isValid).length;
    return Math.round((validFields / totalFields) * 100);
  }, [fields, validationState]);

  return {
    validationState,
    isValidating,
    validateField,
    validateForm,
    getFormProgress,
  };
}

interface ValidationDisplayProps {
  fieldId: string;
  validation?: FieldValidation;
  isValidating?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function ValidationDisplay({
  fieldId,
  validation,
  isValidating,
  showProgress = false,
  className,
}: ValidationDisplayProps) {
  if (!validation && !isValidating) return null;

  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-2", className)}
    >
      {/* Validation Messages */}
      <OptimizedAnimatePresence>
        {validation?.errors.map((error, index) => (
          <OptimizedMotion.div
            key={`error-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-ds-2 text-sm text-red-600"
          >
            <Icon icon={X} className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </OptimizedMotion.div>
        ))}
      </OptimizedAnimatePresence>

      <OptimizedAnimatePresence>
        {validation?.warnings.map((warning, index) => (
          <OptimizedMotion.div
            key={`warning-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-ds-2 text-sm text-orange-600"
          >
            <Icon icon={AlertCircle} className="h-4 w-4 flex-shrink-0" />
            <span>{warning}</span>
          </OptimizedMotion.div>
        ))}
      </OptimizedAnimatePresence>

      <OptimizedAnimatePresence>
        {validation?.infos.map((info, index) => (
          <OptimizedMotion.div
            key={`info-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-ds-2 text-sm text-blue-600"
          >
            <Icon icon={Shield} className="h-4 w-4 flex-shrink-0" />
            <span>{info}</span>
          </OptimizedMotion.div>
        ))}
      </OptimizedAnimatePresence>

      {/* Validation Status */}
      {validation?.isValid && validation.errors.length === 0 && (
        <OptimizedMotion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-semantic-success-dark flex items-center gap-ds-2 text-sm"
        >
          <OptimizedMotion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <Check className="h-4 w-4" />
          </OptimizedMotion.div>
          <span>Looks good!</span>
        </OptimizedMotion.div>
      )}

      {/* Loading State */}
      {isValidating && (
        <OptimizedMotion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-ds-2 text-sm text-[var(--fl-color-text-muted)]"
        >
          <OptimizedMotion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Icon icon={Clock} className="h-4 w-4" />
          </OptimizedMotion.div>
          <span>Validating...</span>
        </OptimizedMotion.div>
      )}

      {/* Progress Indicators */}
      {showProgress && validation && (
        <div className="space-y-spacing-sm">
          {/* Field Score */}
          {validation.score !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-tiny">
                <span className="text-foreground">Field Quality</span>
                <span
                  className={cn(
                    "font-medium",
                    validation.score >= 80
                      ? "text-semantic-success-dark"
                      : validation.score >= 60
                        ? "text-orange-600"
                        : "text-red-600"
                  )}
                >
                  {validation.score}%
                </span>
              </div>
              <Progress
                value={validation.score}
                className={cn(
                  "h-2",
                  validation.score >= 80
                    ? "bg-[var(--fl-color-success-subtle)]"
                    : validation.score >= 60
                      ? "bg-orange-100"
                      : "bg-[var(--fl-color-danger-subtle)]"
                )}
              />
            </div>
          )}

          {/* Password Strength */}
          {validation.strength !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-tiny">
                <span className="text-foreground">Password Strength</span>
                <span
                  className={cn(
                    "font-medium",
                    validation.strength >= 80
                      ? "text-semantic-success-dark"
                      : validation.strength >= 60
                        ? "text-orange-600"
                        : "text-red-600"
                  )}
                >
                  {validation.strength >= 80 ? "Strong" : validation.strength >= 60 ? "Medium" : "Weak"}
                </span>
              </div>
              <OptimizedMotion.div className="relative">
                <Progress
                  value={validation.strength}
                  className={cn(
                    "h-2",
                    validation.strength >= 80
                      ? "bg-[var(--fl-color-success-subtle)]"
                      : validation.strength >= 60
                        ? "bg-orange-100"
                        : "bg-[var(--fl-color-danger-subtle)]"
                  )}
                />
                {/* Animated strength indicator */}
                <OptimizedMotion.div
                  className="absolute left-0 top-0 h-2 rounded-ds-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${validation.strength}%`,
                    backgroundColor:
                      validation.strength >= 80 ? "#10b981" : validation.strength >= 60 ? "#f59e0b" : "#ef4444",
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </OptimizedMotion.div>
            </div>
          )}
        </div>
      )}
    </OptimizedMotion.div>
  );
}

interface FormProgressProps {
  progress: number;
  totalFields: number;
  validFields: number;
  className?: string;
}

export function FormProgress({ progress, totalFields, validFields, className }: FormProgressProps) {
  const getProgressColor = () => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 75) return "text-blue-600";
    if (progress >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressIcon = () => {
    if (progress >= 100) return Check;
    if (progress >= 75) return Star;
    if (progress >= 50) return TrendingUp;
    return Zap;
  };

  const Icon = getProgressIcon();

  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-ds-lg bg-neutral-50 spacing-4", className)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-ds-2">
          <OptimizedMotion.div
            animate={{
              scale: progress >= 100 ? [1, 1.2, 1] : 1,
              rotate: progress >= 100 ? [0, 360, 0] : 0,
            }}
            transition={{ duration: 0.6 }}
            className={getProgressColor()}
          >
            <Icon className="h-5 w-5" />
          </OptimizedMotion.div>
          <span className="font-medium text-gray-900">Form Progress</span>
        </div>

        <Badge
          variant={progress >= 100 ? "default" : "secondary"}
          className={cn(progress >= 100 && "bg-status-success-light text-green-800")}
        >
          {validFields}/{totalFields} complete
        </Badge>
      </div>

      <div className="space-y-spacing-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Completion</span>
          <span className={cn("font-medium", getProgressColor())}>{progress}%</span>
        </div>

        <OptimizedMotion.div className="relative">
          <Progress value={progress} className="h-3" />
          <OptimizedMotion.div
            className="absolute left-0 top-0 h-3 rounded-ds-full"
            initial={{ width: 0 }}
            animate={{
              width: `${progress}%`,
              backgroundColor:
                progress >= 100 ? "#10b981" : progress >= 75 ? "#3b82f6" : progress >= 50 ? "#f59e0b" : "#ef4444",
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </OptimizedMotion.div>
      </div>

      {progress >= 100 && (
        <OptimizedMotion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 rounded-ds-lg bg-[var(--fl-color-success-subtle)] p-spacing-sm"
        >
          <div className="flex items-center gap-ds-2 text-sm text-green-800">
            <Check className="h-4 w-4" />
            <span>Form is ready to submit!</span>
          </div>
        </OptimizedMotion.div>
      )}
    </OptimizedMotion.div>
  );
}

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const rules = [
      ValidationRules.passwordLength(),
      ValidationRules.passwordUppercase(),
      ValidationRules.passwordLowercase(),
      ValidationRules.passwordNumber(),
      ValidationRules.passwordSpecial(),
      ValidationRules.passwordCommon(),
    ];

    let score = 0;
    const newFeedback: string[] = [];

    rules.forEach((rule: any) => {
      if (rule.test(password)) {
        score += rule.strength || 0;
      } else if (password.length > 0) {
        newFeedback.push(rule.message);
      }
    });

    setStrength(Math.min(100, score));
    setFeedback(newFeedback);
  }, [password]);

  const getStrengthLabel = () => {
    if (strength >= 80) return "Very Strong";
    if (strength >= 60) return "Strong";
    if (strength >= 40) return "Medium";
    if (strength >= 20) return "Weak";
    return "Very Weak";
  };

  const getStrengthColor = () => {
    if (strength >= 80) return "#10b981";
    if (strength >= 60) return "#22c55e";
    if (strength >= 40) return "#f59e0b";
    if (strength >= 20) return "#f97316";
    return "#ef4444";
  };

  if (!password) return null;

  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("space-y-3", className)}
    >
      <div className="space-y-spacing-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Password Strength</span>
          <OptimizedMotion.span animate={{ color: getStrengthColor() }} className="font-medium">
            {getStrengthLabel()}
          </OptimizedMotion.span>
        </div>

        <div className="relative h-2 overflow-hidden rounded-ds-full bg-gray-200">
          <OptimizedMotion.div
            className="absolute left-0 top-0 h-full rounded-ds-full"
            initial={{ width: 0 }}
            animate={{
              width: `${strength}%`,
              backgroundColor: getStrengthColor(),
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Requirements */}
      <OptimizedAnimatePresence>
        {feedback.length > 0 && (
          <OptimizedMotion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {feedback.slice(0, 3).map((item, index) => (
              <OptimizedMotion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-foreground flex items-center gap-ds-2 text-tiny"
              >
                <div className="h-1 w-1 rounded-ds-full bg-neutral-400" />
                <span>{item}</span>
              </OptimizedMotion.div>
            ))}
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>
    </OptimizedMotion.div>
  );
}
