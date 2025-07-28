import * as React from "react";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean | undefined;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" ref={ref} className="peer sr-only" {...props} onChange={handleChange} />
        <div
          className={`peer h-6 w-11 rounded-ds-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-ds-full after:border after:border-[var(--fl-color-border-strong)] after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-neutral-700 dark:peer-focus:ring-blue-800 ${className}`}
        ></div>
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
