// Example usage of the new flame-ui components
// This file demonstrates how to use the migrated components

import React from "react";
import { Button, ButtonGroup } from "@/components/ui/Button-unified";

export function FlameUIExamples() {
  const { toast } = useToast();

  return (
    <div className="space-y-8 p-spacing-lg">
      {/* Badge Examples */}
      <section>
        <h2 className="mb-4 text-3xl font-bold">Badges</h2>
        <BadgeGroup>
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="glass">Glass</Badge>
          <Badge variant="gradient">Gradient</Badge>
          <Badge variant="online">Online</Badge>
          <Badge variant="default" onRemove={() => {}}>
            Removable
          </Badge>
        </BadgeGroup>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Buttons</h3>
        <Button onClick={() => {}}>Show Toast</Button>
      </section>

      {/* Add Toaster at the root level */}
      <Toaster />
    </div>
  );
}
