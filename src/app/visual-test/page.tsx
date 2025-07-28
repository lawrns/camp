'use client';

import { Badge } from '@/components/unified-ui/components/Badge';
import { Separator } from '@/components/unified-ui/components/Separator';
import { useEffect } from 'react';

export default function VisualTestPage() {
  useEffect(() => {
    // Load the visual test script
    const script = document.createElement('script');
    script.src = '/visual-test-script.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
    };
  }, []);
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Design System Visual Test
        </h1>

        {/* Badge Component Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Badge Components</h2>
          <p className="text-muted-foreground">Testing updated Badge components with design system tokens</p>

          <div className="flex flex-wrap gap-4">
            <Badge variant="primary">Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="success">Success Badge</Badge>
            <Badge variant="warning">Warning Badge</Badge>
            <Badge variant="error">Error Badge</Badge>
            <Badge variant="info">Info Badge</Badge>
            <Badge variant="glass">Glass Badge</Badge>
            <Badge variant="gradient">Gradient Badge</Badge>
            <Badge variant="online">Online Badge</Badge>
          </div>
        </section>

        <Separator />

        {/* Color Token Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Design System Colors</h2>
          <p className="text-muted-foreground">Testing CSS custom properties with --ds-* prefixes</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[var(--ds-color-primary-600)] text-white">
              Primary 600
            </div>
            <div className="p-4 rounded-lg bg-[var(--ds-color-success-500)] text-white">
              Success 500
            </div>
            <div className="p-4 rounded-lg bg-[var(--ds-color-warning-500)] text-white">
              Warning 500
            </div>
            <div className="p-4 rounded-lg bg-[var(--ds-color-error-500)] text-white">
              Error 500
            </div>
          </div>
        </section>

        <Separator />

        {/* Spacing Token Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Design System Spacing</h2>
          <p className="text-muted-foreground">Testing spacing tokens with --ds-spacing-* prefixes</p>

          <div className="space-y-4">
            <div className="p-[var(--ds-spacing-2)] bg-muted rounded border">
              Spacing 2 (8px)
            </div>
            <div className="p-[var(--ds-spacing-4)] bg-muted rounded border">
              Spacing 4 (16px)
            </div>
            <div className="p-[var(--ds-spacing-6)] bg-muted rounded border">
              Spacing 6 (24px)
            </div>
          </div>
        </section>

        <Separator />

        {/* Border Radius Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Border Radius Tokens</h2>
          <p className="text-muted-foreground">Testing border radius with --ds-radius-* prefixes</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted border rounded-[var(--ds-rounded-ds-sm)]">
              Radius SM
            </div>
            <div className="p-4 bg-muted border rounded-[var(--ds-rounded-ds-md)]">
              Radius MD
            </div>
            <div className="p-4 bg-muted border rounded-[var(--ds-rounded-ds-lg)]">
              Radius LG
            </div>
            <div className="p-4 bg-muted border rounded-[var(--ds-rounded-ds-xl)]">
              Radius XL
            </div>
          </div>
        </section>

        <Separator />

        {/* Button-like Elements */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Button Styles</h2>
          <p className="text-muted-foreground">Testing button-like elements with design system tokens</p>

          <div className="flex flex-wrap gap-4">
            <button className="px-[var(--ds-spacing-4)] py-[var(--ds-spacing-2)] bg-[var(--ds-color-primary-600)] hover:bg-[var(--ds-color-primary-700)] text-white rounded-[var(--ds-rounded-ds-md)] transition-colors">
              Primary Button
            </button>
            <button className="px-[var(--ds-spacing-4)] py-[var(--ds-spacing-2)] bg-[var(--ds-color-success-600)] hover:bg-[var(--ds-color-success-700)] text-white rounded-[var(--ds-rounded-ds-md)] transition-colors">
              Success Button
            </button>
            <button className="px-[var(--ds-spacing-4)] py-[var(--ds-spacing-2)] bg-[var(--ds-color-warning-600)] hover:bg-[var(--ds-color-warning-700)] text-white rounded-[var(--ds-rounded-ds-md)] transition-colors">
              Warning Button
            </button>
          </div>
        </section>

        <Separator />

        {/* Focus States */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Focus States</h2>
          <p className="text-muted-foreground">Testing focus indicators with design system tokens</p>

          <div className="space-y-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ds-color-primary-500)] focus:ring-offset-2">
              Focus Test Button
            </button>
            <input
              type="text"
              placeholder="Focus test input"
              className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ds-color-primary-500)] focus:ring-offset-2"
            />
          </div>
        </section>

        {/* Automated Test Results */}
        <section className="space-y-4 mt-12">
          <h2 className="text-2xl font-semibold text-foreground">Automated Test Results</h2>
          <div id="test-results" className="p-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">Running automated tests...</p>
          </div>
          <button
            onClick={() => window.runVisualTests && window.runVisualTests()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Re-run Tests
          </button>
        </section>

        {/* Manual Test Checklist */}
        <section className="space-y-4 mt-8 p-6 bg-muted rounded-lg">
          <h2 className="text-2xl font-semibold text-foreground">Manual Test Checklist</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Badge components render with design system tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Color tokens (--ds-color-*) are working</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Spacing tokens (--ds-spacing-*) are working</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Border radius tokens (--ds-radius-*) are working</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Focus states use consistent design tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>No visual regressions in component styling</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
