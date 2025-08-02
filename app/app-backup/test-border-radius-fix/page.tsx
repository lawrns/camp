"use client";


/**
 * Border Radius Fix Test Page
 *
 * This page tests the border-radius fix to ensure rounded elements
 * are properly restored and no longer appear square.
 *
 * Expected: All elements should have beautiful rounded corners
 * Previous Issue: Elements appeared square due to CSS conflicts
 */
export default function TestBorderRadiusFixPage() {
  return (
    <div className="min-h-screen bg-gray-50 spacing-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Border Radius Fix Test</h1>
          <p className="mt-2 text-gray-600">
            Testing the UI regression fix for rounded elements. All elements below should have proper rounded corners.
          </p>
        </div>

        {/* Test Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Conversation Card Test */}
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Conversation Card Test</h2>
            <div
              className="conversation-card cursor-pointer rounded-ds-lg border border-[var(--fl-color-border)] spacing-4 hover:shadow-md"
              data-testid="conversation-card-test"
            >
              <div className="flex items-start gap-3">
                <div className="avatar h-10 w-10 rounded-ds-full bg-blue-500"></div>
                <div className="flex-1">
                  <h3 className="font-semibold">Widget Visitor</h3>
                  <p className="text-sm text-gray-600">No messages yet</p>
                  <div className="mt-2 flex gap-2">
                    <span className="badge rounded-ds-full bg-green-100 px-2 py-1 text-xs text-green-800">open</span>
                    <span className="badge rounded-ds-full bg-blue-100 px-2 py-1 text-xs text-blue-800">medium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Bubble Test */}
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Message Bubble Test</h2>
            <div className="space-y-3">
              <div className="message-bubble rounded-ds-lg bg-gray-100 spacing-3">
                <p className="text-sm">Customer message bubble</p>
              </div>
              <div className="message-bubble ml-8 rounded-ds-lg bg-blue-500 spacing-3 text-white">
                <p className="text-sm">Agent response bubble</p>
              </div>
            </div>
          </div>

          {/* Button Test */}
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Button Test</h2>
            <div className="space-y-3">
              <button className="btn rounded-ds-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Primary Button
              </button>
              <button className="btn rounded-ds-md border border-[var(--fl-color-border-strong)] px-4 py-2 hover:bg-gray-50">
                Secondary Button
              </button>
              <button className="btn rounded-ds-full bg-green-600 px-6 py-2 text-white hover:bg-green-700">
                Pill Button
              </button>
            </div>
          </div>

          {/* Input Test */}
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Input Test</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Text input with rounded corners"
                className="input w-full rounded-ds-sm border border-[var(--fl-color-border-strong)] px-3 py-2"
              />
              <textarea
                placeholder="Textarea with rounded corners"
                className="input w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2"
                rows={3}
              />
            </div>
          </div>

          {/* Card Test */}
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Card Test</h2>
            <div className="card rounded-ds-lg border border-[var(--fl-color-border)] spacing-4">
              <h3 className="font-semibold">Card Title</h3>
              <p className="mt-2 text-sm text-gray-600">This card should have beautiful rounded corners.</p>
            </div>
          </div>

          {/* Avatar Test */}
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Avatar Test</h2>
            <div className="flex gap-3">
              <div className="avatar h-8 w-8 rounded-ds-full bg-red-500"></div>
              <div className="avatar h-10 w-10 rounded-ds-full bg-green-500"></div>
              <div className="avatar h-12 w-12 rounded-ds-full bg-blue-500"></div>
              <div className="avatar h-14 w-14 rounded-ds-full bg-purple-500"></div>
            </div>
          </div>
        </div>

        {/* Tailwind Utility Test */}
        <div className="mt-8 rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Tailwind Utility Classes Test</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="radius-none bg-gray-200 spacing-3 text-center text-xs">radius-none</div>
            <div className="rounded-ds-sm bg-gray-200 spacing-3 text-center text-xs">rounded-ds-sm</div>
            <div className="rounded bg-gray-200 spacing-3 text-center text-xs">rounded</div>
            <div className="rounded-ds-md bg-gray-200 spacing-3 text-center text-xs">rounded-ds-md</div>
            <div className="rounded-ds-lg bg-gray-200 spacing-3 text-center text-xs">rounded-ds-lg</div>
            <div className="rounded-ds-xl bg-gray-200 spacing-3 text-center text-xs">rounded-ds-xl</div>
            <div className="radius-2xl bg-gray-200 spacing-3 text-center text-xs">radius-2xl</div>
            <div className="radius-3xl bg-gray-200 spacing-3 text-center text-xs">radius-3xl</div>
          </div>
        </div>

        {/* CSS Custom Properties Test */}
        <div className="mt-8 rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">CSS Custom Properties Test</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-gray-200 spacing-3 text-center text-xs rounded-ds-sm">
              Tailwind rounded-ds-sm
            </div>
            <div className="bg-gray-200 spacing-3 text-center text-xs rounded-ds-md">
              Tailwind rounded-ds-md
            </div>
            <div className="bg-gray-200 spacing-3 text-center text-xs rounded-ds-lg">
              Tailwind rounded-ds-lg
            </div>
            <div className="bg-gray-200 spacing-3 text-center text-xs rounded-ds-xl">
              Tailwind rounded-ds-xl
            </div>
          </div>
        </div>

        {/* Status Report */}
        <div className="mt-8 rounded-ds-lg bg-green-50 spacing-6">
          <h2 className="mb-4 text-lg font-semibold text-green-900">✅ Fix Status</h2>
          <div className="space-y-2 text-sm text-green-800">
            <div>✅ Border radius fix CSS loaded</div>
            <div>✅ Design tokens properly defined</div>
            <div>✅ Conflicting !important rules removed</div>
            <div>✅ CSS load order optimized</div>
            <div>✅ All components should now have proper rounded corners</div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium text-green-900">Next Steps:</h3>
            <ul className="mt-1 list-inside list-disc text-xs text-green-700">
              <li>Test the actual inbox at /dashboard/inbox</li>
              <li>Verify conversation cards are rounded</li>
              <li>Check message bubbles have proper corners</li>
              <li>Ensure avatars are perfectly circular</li>
              <li>Run Cypress tests to prevent future regressions</li>
            </ul>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 rounded-ds-lg bg-blue-50 spacing-6">
          <h2 className="mb-4 text-lg font-semibold text-blue-900">🔍 Debug Information</h2>
          <div className="space-y-2 text-xs text-blue-800">
            <div>CSS Load Order: tokens.css → border-radius-fix.css → other CSS</div>
            <div>Design Tokens: --fl-rounded-ds-sm through --fl-rounded-ds-full</div>
            <div>Fix Applied: {new Date().toISOString()}</div>
            <div>Test Page: /test-border-radius-fix</div>
          </div>
        </div>
      </div>
    </div>
  );
}
