import * as React from "react";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value"> {
  value?: number[] | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (values: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className = "", value, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value);
      onChange?.(e);
      onValueChange?.([numValue]);
    };

    // Convert array value to single value if needed
    const singleValue = Array.isArray(value) ? value[0] : value;

    return (
      <input
        type="range"
        ref={ref}
        className={`h-2 w-full cursor-pointer appearance-none rounded-ds-lg bg-gray-200 dark:bg-neutral-700 ${className}`}
        value={singleValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
