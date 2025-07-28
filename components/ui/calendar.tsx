import * as React from "react";

export interface CalendarProps {
  mode?: "single" | "multiple" | "range";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export function Calendar({ mode = "single", selected, onSelect, className = "" }: CalendarProps) {
  return (
    <div className={`spacing-3 ${className}`}>
      <div className="text-center text-sm text-muted-foreground">Calendar component placeholder</div>
    </div>
  );
}
