import React from "react";

interface PageProps {
  children: React.ReactNode;
  width?: "6xl" | "7xl";
}

export const Page: React.FC<PageProps> = ({ children, width = "6xl" }) => {
  const widths: Record<NonNullable<PageProps["width"]>, string> = {
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  };
  return (
    <div className="min-h-screen bg-background">
      <div className={`container mx-auto ${widths[width]} px-6 py-8 sm:px-4 sm:py-6`}>{children}</div>
    </div>
  );
};

export const PageHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`mb-6 md:mb-8 ${className}`}>{children}</div>
);

export const PageTitle: React.FC<{ children: React.ReactNode; subtitle?: React.ReactNode }>
  = ({ children, subtitle }) => (
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{children}</h1>
    {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
  </div>
);

export const PageToolbar: React.FC<{ children: React.ReactNode; className?: string }>
  = ({ children, className = "" }) => (
  <div className={`flex flex-wrap items-center gap-2 md:gap-3 ${className}`}>{children}</div>
);

export const PageHeaderRow: React.FC<{ left: React.ReactNode; right?: React.ReactNode }>
  = ({ left, right }) => (
  <div className="flex items-center justify-between gap-3">
    <div>{left}</div>
    {right && <div className="flex items-center gap-2 md:gap-3">{right}</div>}
  </div>
);

export const PageContent: React.FC<{ children: React.ReactNode; className?: string }>
  = ({ children, className = "space-y-6" }) => (
  <div className={className}>{children}</div>
);

