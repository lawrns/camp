import * as React from "react";

// Root Select component
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

export const Select: React.FC<SelectProps> = ({ value, onValueChange, defaultValue, disabled, children }) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  const contextValue = React.useMemo(
    () => ({
      value: value !== undefined ? value : internalValue,
      onValueChange: onValueChange || setInternalValue,
      open,
      setOpen,
    }),
    [value, internalValue, onValueChange, open]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

// SelectTrigger component
interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.setOpen(!context.open)}
        className={`flex h-10 w-full items-center justify-between rounded-ds-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

// SelectValue component
interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  return <span>{context.value || placeholder}</span>;
};

// SelectContent component
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className = "", children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within Select");

    if (!context.open) return null;

    return (
      <div
        ref={ref}
        className={`absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-ds-md border bg-popover text-popover-foreground shadow-md ${className}`}
        {...props}
      >
        <div className="spacing-1">{children}</div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

// SelectItem component
interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className = "", value, disabled, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");

    const isSelected = context.value === value;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          if (!disabled) {
            context.onValueChange?.(value);
            context.setOpen(false);
          }
        }}
        className={`relative flex cursor-pointer select-none items-center rounded-ds-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground ${
          isSelected ? "bg-accent text-accent-foreground" : ""
        } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";
