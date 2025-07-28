"use client";

import { useEffect, useState } from "react";

export default function CSSDetectivePage() {
  const [analysis, setAnalysis] = useState<any>({});

  useEffect(() => {
    // Create a test element and analyze what's happening to its border-radius
    const testDiv = document.createElement("div");
    testDiv.className = "rounded-ds-lg bg-red-200 spacing-4";
    testDiv.style.position = "absolute";
    testDiv.style.top = "-9999px";
    testDiv.textContent = "Test";
    document.body.appendChild(testDiv);

    const computedStyle = window.getComputedStyle(testDiv);

    // Get all CSS rules that apply to this element
    const allRules: any[] = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const styleSheet = document.styleSheets[i];
        if (styleSheet.cssRules) {
          for (let j = 0; j < styleSheet.cssRules.length; j++) {
            const rule = styleSheet.cssRules[j] as CSSStyleRule;
            if (rule.selectorText && testDiv.matches && testDiv.matches(rule.selectorText)) {
              allRules.push({
                selector: rule.selectorText,
                borderRadius: rule.style.borderRadius,
                cssText: rule.cssText,
                href: styleSheet.href,
              });
            }
          }
        }
      } catch (e) {
        // Cross-origin or other access issues
      }
    }

    setAnalysis({
      computedBorderRadius: computedStyle.borderRadius,
      computedBorderTopLeftRadius: computedStyle.borderTopLeftRadius,
      computedBorderTopRightRadius: computedStyle.borderTopRightRadius,
      computedBorderBottomLeftRadius: computedStyle.borderBottomLeftRadius,
      computedBorderBottomRightRadius: computedStyle.borderBottomRightRadius,
      cssVariables: {
        flRadiusLg: computedStyle.getPropertyValue("--fl-rounded-ds-lg"),
        flRadiusMd: computedStyle.getPropertyValue("--fl-rounded-ds-md"),
        radius: computedStyle.getPropertyValue("--radius"),
      },
      matchingRules: allRules.filter((rule) => rule.borderRadius || rule.cssText.includes("border-radius")),
    });

    document.body.removeChild(testDiv);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 spacing-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">🕵️ CSS Detective</h1>

        {/* Live Test Element */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Live Test Element</h2>
          <div className="inline-block rounded-ds-lg bg-red-200 spacing-4">This should be rounded (.rounded-ds-lg)</div>
        </div>

        {/* Analysis Results */}
        <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">CSS Analysis</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900">Computed Border Radius Values:</h3>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-100 spacing-3 text-sm">
                {JSON.stringify(
                  {
                    borderRadius: analysis.computedBorderRadius,
                    borderTopLeftRadius: analysis.computedBorderTopLeftRadius,
                    borderTopRightRadius: analysis.computedBorderTopRightRadius,
                    borderBottomLeftRadius: analysis.computedBorderBottomLeftRadius,
                    borderBottomRightRadius: analysis.computedBorderBottomRightRadius,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">CSS Custom Properties:</h3>
              <pre className="mt-2 rounded bg-gray-100 spacing-3 text-sm">
                {JSON.stringify(analysis.cssVariables, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Matching CSS Rules with Border Radius:</h3>
              <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">
                {analysis.matchingRules?.map((rule: any, index: number) => (
                  <div key={index} className="rounded bg-gray-100 spacing-3 text-sm">
                    <div>
                      <strong>Selector:</strong> {rule.selector}
                    </div>
                    <div>
                      <strong>Border Radius:</strong> {rule.borderRadius || "none"}
                    </div>
                    <div>
                      <strong>Source:</strong> {rule.href || "inline"}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">View Full CSS</summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-gray-200 spacing-2 text-xs">{rule.cssText}</pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Tests */}
        <div className="mt-8 rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Manual Tests</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-blue-200 spacing-3 text-center text-xs rounded-ds-lg">
              Tailwind rounded-ds-lg
            </div>
            <div className="bg-blue-200 spacing-3 text-center text-xs rounded-ds-xl">
              Tailwind rounded-ds-xl
            </div>
            <div className="rounded-ds-lg bg-blue-200 spacing-3 text-center text-xs">.rounded-ds-lg</div>
            <div className="rounded-ds-xl bg-blue-200 spacing-3 text-center text-xs">.rounded-ds-xl</div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mt-8 rounded-ds-lg bg-yellow-50 spacing-6">
          <h2 className="mb-4 text-xl font-semibold">🔍 Diagnosis</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Expected:</strong> border-radius should be "1rem" (16px) for .rounded-ds-lg
            </div>
            <div>
              <strong>Actual:</strong> {analysis.computedBorderRadius || "Loading..."}
            </div>
            <div>
              <strong>CSS Variable --fl-rounded-ds-lg:</strong> {analysis.cssVariables?.flRadiusLg || "Not defined"}
            </div>
            <div>
              <strong>Issue:</strong>{" "}
              {analysis.computedBorderRadius === "0px"
                ? "❌ Border radius is being reset to 0"
                : analysis.computedBorderRadius === ""
                  ? "❌ Border radius is empty/undefined"
                  : analysis.cssVariables?.flRadiusLg === ""
                    ? "❌ CSS custom property --fl-rounded-ds-lg is not defined"
                    : "✅ Border radius appears to be working"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
