import React from "react";
import { Navigation } from "../components/Navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ds-min-h-screen ds-bg-background-muted ds-flex">
      <Navigation />
      <div className="ds-flex-1">
        <main className="ds-flex ds-flex-col ds-gap-6 ds-p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
