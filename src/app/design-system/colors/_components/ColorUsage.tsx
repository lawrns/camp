import React from 'react';

export function ColorUsage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-ds-color-text">Usage Guidelines</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-ds-color-text">Text Colors</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <ColorUsageExample
              title="Primary Text"
              className="text-ds-color-text"
              description="Main text color for body content"
              code="text-ds-color-text"
            />
            <ColorUsageExample
              title="Muted Text"
              className="text-ds-color-text-muted"
              description="Secondary text for less important content"
              code="text-ds-color-text-muted"
            />
            <ColorUsageExample
              title="Subtle Text"
              className="text-ds-color-text-subtle"
              description="Tertiary text for disabled or subtle content"
              code="text-ds-color-text-subtle"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-ds-color-text">Background Colors</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <ColorUsageExample
              title="Page Background"
              className="bg-ds-color-background text-ds-color-text"
              description="Main page background color"
              code="bg-ds-color-background"
            />
            <ColorUsageExample
              title="Surface"
              className="bg-ds-color-surface text-ds-color-text border border-ds-color-border"
              description="Container background color"
              code="bg-ds-color-surface"
            />
            <ColorUsageExample
              title="Muted Background"
              className="bg-ds-color-background-muted text-ds-color-text"
              description="Subtle background for secondary content"
              code="bg-ds-color-background-muted"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-ds-color-text">Border Colors</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <ColorUsageExample
              title="Default Border"
              className="border-2 border-ds-color-border bg-ds-color-surface p-4"
              description="Default border color"
              code="border-ds-color-border"
            />
            <ColorUsageExample
              title="Interactive Border"
              className="border-2 border-ds-color-border-interactive bg-ds-color-surface p-4"
              description="Border for interactive elements"
              code="border-ds-color-border-interactive"
            />
            <ColorUsageExample
              title="Subtle Border"
              className="border-2 border-ds-color-border-subtle bg-ds-color-surface p-4"
              description="Subtle border for dividers and subtle UI elements"
              code="border-ds-color-border-subtle"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-ds-color-text">Semantic Colors</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorUsageExample
              title="Success"
              className="bg-ds-color-success-100 text-ds-color-success-800 p-4"
              description="For success states and positive actions"
              code="bg-ds-color-success-100 text-ds-color-success-800"
            />
            <ColorUsageExample
              title="Warning"
              className="bg-ds-color-warning-100 text-ds-color-warning-800 p-4"
              description="For warning states and potentially destructive actions"
              code="bg-ds-color-warning-100 text-ds-color-warning-800"
            />
            <ColorUsageExample
              title="Error"
              className="bg-ds-color-error-100 text-ds-color-error-800 p-4"
              description="For error states and destructive actions"
              code="bg-ds-color-error-100 text-ds-color-error-800"
            />
            <ColorUsageExample
              title="Info"
              className="bg-ds-color-info-100 text-ds-color-info-800 p-4"
              description="For informational states and neutral actions"
              code="bg-ds-color-info-100 text-ds-color-info-800"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ColorUsageExample({
  title,
  className,
  description,
  code,
}: {
  title: string;
  className: string;
  description: string;
  code: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`rounded-lg p-4 ${className}`}>
        <h4 className="font-medium">{title}</h4>
        <p className="text-xs opacity-80">{description}</p>
      </div>
      <code className="block text-xs p-2 bg-ds-color-background-muted rounded font-mono break-all">
        {code}
      </code>
    </div>
  );
}

export default ColorUsage;
