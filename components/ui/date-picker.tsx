"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onChange?.(newDate);
  };

  return (
    <Button
      variant="outline"
      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
      onClick={() => {
        // Placeholder for date picker functionality
        const newDate = new Date();
        handleSelect(newDate);
      }}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : <span>{placeholder}</span>}
    </Button>
  );
}
