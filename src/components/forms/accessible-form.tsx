import React, { forwardRef, useId } from "react";
import { AlertTriangle as AlertCircle, CheckCircle } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// Accessible Form Field Wrapper
interface FormFieldProps {
  children: React.ReactNode;
  error?: string | undefined;
  success?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}

export const FormField: React.FC<FormFieldProps> = ({ children, error, success, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {error && (
        <div role="alert" aria-live="polite" className="flex items-center gap-ds-2 text-sm text-red-600">
          <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="status" aria-live="polite" className="text-semantic-success-dark flex items-center gap-ds-2 text-sm">
          <Icon icon={CheckCircle} className="h-4 w-4" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

// Accessible Label
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean | undefined;
  children: React.ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ required, children, className, ...props }, ref) => {
  return (
    <label ref={ref} className={cn("text-typography-sm block font-medium text-neutral-700", className)} {...props}>
      {children}
      {required && (
        <span className="text-brand-mahogany-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
});

Label.displayName = "Label";

// Accessible Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      required,
      className,
      id: providedId,
      "aria-describedby": providedAriaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const successId = `${id}-success`;

    const ariaDescribedBy = [providedAriaDescribedBy, error && errorId, helperText && helperId, success && successId]
      .filter(Boolean)
      .join(" ");

    const inputElement = (
      <input
        ref={ref}
        id={id}
        className={cn(
          "block w-full rounded-ds-md border-[var(--fl-color-border-strong)] shadow-sm",
          "focus:border-primary focus:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500",
          error && "focus:border-brand-mahogany-500 border-[var(--fl-color-danger-muted)] focus:ring-red-500",
          success && "border-[var(--fl-color-success-muted)] focus:border-[var(--fl-color-success)] focus:ring-green-500",
          className
        )}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy || undefined}
        {...props}
      />
    );

    if (!label) return inputElement;

    return (
      <FormField error={error} success={success}>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        {inputElement}
        {helperText && (
          <p id={helperId} className="text-sm text-[var(--fl-color-text-muted)]">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="sr-only">
            Error: {error}
          </p>
        )}
        {success && (
          <p id={successId} className="sr-only">
            Success: {success}
          </p>
        )}
      </FormField>
    );
  }
);

Input.displayName = "Input";

// Accessible Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      required,
      className,
      id: providedId,
      "aria-describedby": providedAriaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const ariaDescribedBy = [providedAriaDescribedBy, error && errorId, helperText && helperId]
      .filter(Boolean)
      .join(" ");

    const textareaElement = (
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "block w-full rounded-ds-md border-[var(--fl-color-border-strong)] shadow-sm",
          "focus:border-primary focus:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500",
          error && "focus:border-brand-mahogany-500 border-[var(--fl-color-danger-muted)] focus:ring-red-500",
          success && "border-[var(--fl-color-success-muted)] focus:border-[var(--fl-color-success)] focus:ring-green-500",
          className
        )}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy || undefined}
        {...props}
      />
    );

    if (!label) return textareaElement;

    return (
      <FormField error={error} success={success}>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        {textareaElement}
        {helperText && (
          <p id={helperId} className="text-sm text-[var(--fl-color-text-muted)]">
            {helperText}
          </p>
        )}
      </FormField>
    );
  }
);

Textarea.displayName = "Textarea";

// Accessible Select
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      required,
      options,
      placeholder,
      className,
      id: providedId,
      "aria-describedby": providedAriaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const ariaDescribedBy = [providedAriaDescribedBy, error && errorId, helperText && helperId]
      .filter(Boolean)
      .join(" ");

    const selectElement = (
      <select
        ref={ref}
        id={id}
        className={cn(
          "block w-full rounded-ds-md border-[var(--fl-color-border-strong)] shadow-sm",
          "focus:border-primary focus:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500",
          error && "focus:border-brand-mahogany-500 border-[var(--fl-color-danger-muted)] focus:ring-red-500",
          success && "border-[var(--fl-color-success-muted)] focus:border-[var(--fl-color-success)] focus:ring-green-500",
          className
        )}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option: unknown) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );

    if (!label) return selectElement;

    return (
      <FormField error={error} success={success}>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        {selectElement}
        {helperText && (
          <p id={helperId} className="text-sm text-[var(--fl-color-text-muted)]">
            {helperText}
          </p>
        )}
      </FormField>
    );
  }
);

Select.displayName = "Select";

// Accessible Checkbox
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;

    return (
      <FormField error={error}>
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={cn(
              "h-4 w-4 rounded border-[var(--fl-color-border-strong)] text-primary",
              "focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-[var(--fl-color-danger-muted)]",
              className
            )}
            aria-describedby={helperText ? helperId : undefined}
            {...props}
          />
          <div className="ml-3">
            <Label htmlFor={id} className="cursor-pointer font-normal">
              {label}
            </Label>
            {helperText && (
              <p id={helperId} className="mt-1 text-sm text-[var(--fl-color-text-muted)]">
                {helperText}
              </p>
            )}
          </div>
        </div>
      </FormField>
    );
  }
);

Checkbox.displayName = "Checkbox";

// Accessible Radio Group
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  helperText?: string;
}

interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  required,
  orientation = "vertical",
}) => {
  const groupId = useId();

  return (
    <FormField error={error}>
      <fieldset>
        {label && (
          <legend className="text-foreground mb-2 text-sm font-medium">
            {label}
            {required && (
              <span className="text-brand-mahogany-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </legend>
        )}
        <div
          className={cn("space-y-2", orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0")}
          role="radiogroup"
          aria-required={required}
          aria-invalid={!!error}
        >
          {options.map((option: unknown) => {
            const optionId = `${groupId}-${option.value}`;
            const helperId = `${optionId}-helper`;

            return (
              <div key={option.value} className="flex items-start">
                <input
                  type="radio"
                  id={optionId}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange?.(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    "h-4 w-4 border-[var(--fl-color-border-strong)] text-primary",
                    "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  aria-describedby={option.helperText ? helperId : undefined}
                />
                <div className="ml-3">
                  <Label htmlFor={optionId} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                  {option.helperText && (
                    <p id={helperId} className="mt-1 text-sm text-[var(--fl-color-text-muted)]">
                      {option.helperText}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </FormField>
  );
};
