/**
 * Standardized Form components with consistent prop interfaces
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { FormFieldProps, FormProps } from "./types";

// Base Form component
const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, onSubmit, isLoading, error, ...props }, ref) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isLoading) {
        await onSubmit(e);
      }
    };

    return (
      <form ref={ref} onSubmit={handleSubmit} className={cn("space-y-4", className)} {...props}>
        {error && (
          <div className="rounded-ds-md bg-destructive/10 spacing-3 text-sm text-destructive">
            {typeof error === "string" ? error : (error instanceof Error ? error.message : String(error))}
          </div>
        )}
        {children}
      </form>
    );
  }
);
Form.displayName = "Form";

// Form Field wrapper component
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, name, label, required, error, helperText, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label
            htmlFor={name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        {children}
        {(error || helperText) && (
          <p id={`${name}-description`} className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

// Form Submit button that respects form loading state
interface FormSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loadingText?: string;
}

const FormSubmit = React.forwardRef<HTMLButtonElement, FormSubmitProps>(
  ({ children, loadingText = "Submitting...", className, ...props }, ref) => {
    const formElement = React.useContext(FormContext);
    const isLoading = formElement?.isLoading || false;

    return (
      <button
        ref={ref}
        type="submit"
        disabled={isLoading}
        className={cn(
          "text-typography-sm inline-flex items-center justify-center rounded-ds-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-ds-full border-2 border-current border-t-transparent" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
FormSubmit.displayName = "FormSubmit";

// Form context for sharing state
interface FormContextValue {
  isLoading?: boolean | undefined;
}

const FormContext = React.createContext<FormContextValue | null>(null);

// Improved Form with context provider
const FormWithContext = React.forwardRef<HTMLFormElement, FormProps>(({ isLoading, ...props }, ref) => {
  const contextValue = React.useMemo<FormContextValue>(() => ({ isLoading }), [isLoading]);

  return (
    <FormContext.Provider value={contextValue}>
      <Form ref={ref} {...(isLoading !== undefined && { isLoading })} {...props} />
    </FormContext.Provider>
  );
});
FormWithContext.displayName = "FormWithContext";

export { FormWithContext as Form, FormField, FormSubmit, FormContext };
