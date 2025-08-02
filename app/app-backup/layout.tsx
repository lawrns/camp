import React from "react";

export const metadata = {
  title: "Campfire - Customer Support Platform",
  description: "AI-powered customer support platform with real-time messaging",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
      {children}
    </div>
  );
}
