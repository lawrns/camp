export default function TestStylingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          Styling Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Background Colors */}
          <div className="p-6 rounded-lg border bg-background">
            <h2 className="text-xl font-semibold mb-4">Background Colors</h2>
            <div className="space-y-3">
              <div className="h-8 rounded bg-background border"></div>
              <div className="h-8 rounded bg-muted border"></div>
              <div className="h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                Primary
              </div>
              <div className="h-8 rounded bg-secondary text-secondary-foreground flex items-center justify-center">
                Secondary
              </div>
            </div>
          </div>

          {/* Text Colors */}
          <div className="p-6 rounded-lg border bg-background">
            <h2 className="text-xl font-semibold mb-4">Text Colors</h2>
            <div className="space-y-3">
              <p className="text-foreground">Foreground Text</p>
              <p className="text-muted-foreground">Muted Text</p>
              <p className="text-primary">Primary Text</p>
              <p className="text-secondary">Secondary Text</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-6 rounded-lg border bg-background">
            <h2 className="text-xl font-semibold mb-4">Buttons</h2>
            <div className="space-y-3">
              <button className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90">
                Primary Button
              </button>
              <button className="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Secondary Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="p-6 rounded-lg border bg-background">
            <h2 className="text-xl font-semibold mb-4">Cards</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-card text-card-foreground border">
                Card Content
              </div>
              <div className="p-4 rounded-lg bg-popover text-popover-foreground border">
                Popover Content
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-lg border bg-background">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded bg-success text-success-foreground text-center">
              Success
            </div>
            <div className="p-3 rounded bg-warning text-warning-foreground text-center">
              Warning
            </div>
            <div className="p-3 rounded bg-error text-error-foreground text-center">
              Error
            </div>
            <div className="p-3 rounded bg-info text-info-foreground text-center">
              Info
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 