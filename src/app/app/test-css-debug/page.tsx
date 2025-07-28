"use client";

export default function CSSDebugPage() {
  return (
    <div className="min-h-screen bg-background spacing-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="text-4xl font-bold text-text">CSS Debug & Verification Page</h1>
        
        {/* Border Radius Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Border Radius Tests</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded bg-primary spacing-4 text-white">rounded</div>
            <div className="rounded-ds-sm bg-primary spacing-4 text-white">rounded-ds-sm</div>
            <div className="rounded-ds-md bg-primary spacing-4 text-white">rounded-ds-md</div>
            <div className="rounded-ds-lg bg-primary spacing-4 text-white">rounded-ds-lg</div>
            <div className="rounded-ds-xl bg-primary spacing-4 text-white">rounded-ds-xl</div>
            <div className="radius-2xl bg-primary spacing-4 text-white">radius-2xl</div>
            <div className="radius-3xl bg-primary spacing-4 text-white">radius-3xl</div>
            <div className="rounded-ds-full bg-primary px-6 py-4 text-white">rounded-ds-full</div>
          </div>
        </section>

        {/* Spacing Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Spacing Tests (Padding)</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-1">spacing-1</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-2">spacing-2</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-3">spacing-3</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-4">spacing-4</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-5">spacing-5</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-6">spacing-6</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface spacing-8">spacing-8</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface p-10">p-10</div>
          </div>
        </section>

        {/* Custom Spacing Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Custom Spacing Classes</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-ds-lg border-2 border-border bg-surface p-spacing-xs">p-spacing-xs</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface p-spacing-sm">p-spacing-sm</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface p-spacing-md">p-spacing-md</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface p-spacing-lg">p-spacing-lg</div>
            <div className="rounded-ds-lg border-2 border-border bg-surface p-spacing-xl">p-spacing-xl</div>
          </div>
        </section>

        {/* Gap Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Gap Tests</h2>
          <div className="space-y-2">
            <div className="flex gap-2 rounded-ds-lg border-2 border-border bg-surface spacing-4">
              <div className="rounded bg-primary px-3 py-1 text-white">gap-2</div>
              <div className="rounded bg-primary px-3 py-1 text-white">gap-2</div>
              <div className="rounded bg-primary px-3 py-1 text-white">gap-2</div>
            </div>
            <div className="flex gap-ds-2 rounded-ds-lg border-2 border-border bg-surface spacing-4">
              <div className="rounded bg-primary px-3 py-1 text-white">gap-ds-2</div>
              <div className="rounded bg-primary px-3 py-1 text-white">gap-ds-2</div>
              <div className="rounded bg-primary px-3 py-1 text-white">gap-ds-2</div>
            </div>
          </div>
        </section>

        {/* Shadow Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Shadow Tests</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-ds-lg bg-surface spacing-6 shadow-sm">shadow-sm</div>
            <div className="rounded-ds-lg bg-surface spacing-6 shadow-md">shadow-md</div>
            <div className="rounded-ds-lg bg-surface spacing-6 shadow-lg">shadow-lg</div>
            <div className="rounded-ds-lg bg-surface spacing-6 shadow-xl">shadow-xl</div>
            <div className="rounded-ds-lg bg-surface spacing-6 shadow-card-base">shadow-card-base</div>
            <div className="rounded-ds-lg bg-surface spacing-6 shadow-card-deep">shadow-card-deep</div>
          </div>
        </section>

        {/* Button Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Button Tests</h2>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-ds-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover">
              Standard Button
            </button>
            <button className="btn-primary">btn-primary</button>
            <button className="btn-secondary">btn-secondary</button>
            <button className="rounded-ds-full bg-success px-8 py-3 font-semibold text-white">
              Pill Button
            </button>
          </div>
        </section>

        {/* Card Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Card Tests</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="professional-card">
              <h3 className="mb-2 text-lg font-semibold">Professional Card</h3>
              <p className="text-text-muted">This uses the professional-card utility class</p>
            </div>
            <div className="radius-2xl border border-[var(--fl-color-border-subtle)] bg-surface p-spacing-lg shadow-card-deep">
              <h3 className="mb-2 text-lg font-semibold">Custom Card</h3>
              <p className="text-text-muted">Using CSS variables directly</p>
            </div>
          </div>
        </section>

        {/* Color Tests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Color Tests</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-ds-lg bg-primary spacing-4 text-white">bg-primary</div>
            <div className="rounded-ds-lg bg-success spacing-4 text-white">bg-success</div>
            <div className="rounded-ds-lg bg-warning spacing-4 text-white">bg-warning</div>
            <div className="rounded-ds-lg bg-error spacing-4 text-white">bg-error</div>
            <div className="rounded-ds-lg bg-surface-muted spacing-4">bg-surface-muted</div>
            <div className="rounded-ds-lg bg-neutral-100 spacing-4">bg-neutral-100</div>
            <div className="rounded-ds-lg border-2 border-border spacing-4">border-border</div>
            <div className="rounded-ds-lg border-2 border-primary spacing-4">border-primary</div>
          </div>
        </section>

        {/* Real-world Component Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Real-world Examples</h2>
          
          {/* Chat Message */}
          <div className="rounded-ds-xl border border-border bg-surface spacing-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-ds-full bg-primary"></div>
              <div>
                <h4 className="font-semibold">User Name</h4>
                <p className="text-sm text-text-muted">2 minutes ago</p>
              </div>
            </div>
            <p className="text-text">This is a sample chat message with proper spacing and rounded corners.</p>
          </div>

          {/* Form Elements */}
          <div className="rounded-ds-xl border border-border bg-surface spacing-6">
            <h3 className="mb-4 text-lg font-semibold">Form Elements</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Input with rounded corners"
                className="w-full rounded-ds-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
              />
              <textarea
                placeholder="Textarea with proper spacing"
                className="w-full rounded-ds-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
                rows={3}
              />
              <div className="flex gap-4">
                <button className="rounded-ds-lg bg-primary px-6 py-2 text-white hover:bg-primary-hover">
                  Submit
                </button>
                <button className="rounded-ds-lg border-2 border-border px-6 py-2 hover:bg-surface-muted">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Debug computed styles */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Computed Style Debug</h2>
          
          <div id="debug-element" className="bg-surface spacing-6 rounded-ds-lg border-2 border-primary">
            <p className="font-semibold mb-4">Debug Element with rounded-ds-lg</p>
            <div id="debug-output" className="text-sm font-mono bg-surface-muted spacing-4 rounded">
              <p>Loading computed styles...</p>
            </div>
          </div>
        </section>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Debug script to check computed styles
          window.addEventListener('load', function() {
            const debugEl = document.getElementById('debug-element');
            const outputEl = document.getElementById('debug-output');
            
            if (debugEl && outputEl) {
              const computed = window.getComputedStyle(debugEl);
              const root = window.getComputedStyle(document.documentElement);
              
              const debugInfo = {
                'Element border-radius': computed.getPropertyValue('border-radius'),
                'Element padding': computed.getPropertyValue('padding'),
                '--fl-rounded-ds-lg': root.getPropertyValue('--fl-rounded-ds-lg'),
                '--ds-rounded-ds-lg': root.getPropertyValue('--ds-rounded-ds-lg'),
                '--ds-spacing-4': root.getPropertyValue('--ds-spacing-4'),
                '--fl-spacing-4': root.getPropertyValue('--fl-spacing-4'),
              };
              
              outputEl.innerHTML = Object.entries(debugInfo)
                .map(([key, value]) => \`<div>\${key}: <strong>\${value || 'undefined'}</strong></div>\`)
                .join('');
            }
          });
        `
      }} />
    </div>
  );
}