"use client";

import React, { useEffect, useState } from "react";

export default function DebugCSSPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Get computed styles for various elements
    const testButton = document.querySelector('.test-button');
    const testCard = document.querySelector('.test-card');
    const testRounded = document.querySelector('.test-rounded-ds-lg');
    
    if (testButton && testCard && testRounded) {
      const buttonStyles = window.getComputedStyle(testButton);
      const cardStyles = window.getComputedStyle(testCard);
      const roundedStyles = window.getComputedStyle(testRounded);
      
      setDebugInfo({
        button: {
          borderRadius: buttonStyles.borderRadius,
          borderTopLeftRadius: buttonStyles.borderTopLeftRadius,
          borderTopRightRadius: buttonStyles.borderTopRightRadius,
          borderBottomLeftRadius: buttonStyles.borderBottomLeftRadius,
          borderBottomRightRadius: buttonStyles.borderBottomRightRadius,
        },
        card: {
          borderRadius: cardStyles.borderRadius,
          borderTopLeftRadius: cardStyles.borderTopLeftRadius,
          borderTopRightRadius: cardStyles.borderTopRightRadius,
          borderBottomLeftRadius: cardStyles.borderBottomLeftRadius,
          borderBottomRightRadius: cardStyles.borderBottomRightRadius,
        },
        rounded: {
          borderRadius: roundedStyles.borderRadius,
          borderTopLeftRadius: roundedStyles.borderTopLeftRadius,
          borderTopRightRadius: roundedStyles.borderTopRightRadius,
          borderBottomLeftRadius: roundedStyles.borderBottomLeftRadius,
          borderBottomRightRadius: roundedStyles.borderBottomRightRadius,
        },
        cssVariables: {
          flRadiusMd: getComputedStyle(document.documentElement).getPropertyValue('--ds-rounded-ds-md'),
          flRadiusLg: getComputedStyle(document.documentElement).getPropertyValue('--ds-rounded-ds-lg'),
          flRadiusFull: getComputedStyle(document.documentElement).getPropertyValue('--ds-rounded-ds-full'),
          radius: getComputedStyle(document.documentElement).getPropertyValue('--radius'),
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 spacing-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">🔍 CSS Debug Page</h1>
        
        {/* Test Elements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="test-button bg-blue-500 text-white px-4 py-2 rounded-ds-md">
            Test Button (.rounded-ds-md)
          </button>
          
          <div className="test-card bg-white spacing-4 border rounded-ds-lg shadow-sm">
            Test Card (.rounded-ds-lg)
          </div>
          
          <div className="test-rounded-ds-lg bg-green-200 spacing-4 rounded-ds-lg">
            Test Rounded (.rounded-ds-lg)
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-white spacing-6 rounded-ds-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Computed Styles Debug</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900">CSS Variables:</h3>
              <pre className="mt-2 text-sm bg-gray-100 spacing-3 rounded">
                {JSON.stringify(debugInfo.cssVariables, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Button (.rounded-ds-md) Computed Styles:</h3>
              <pre className="mt-2 text-sm bg-gray-100 spacing-3 rounded">
                {JSON.stringify(debugInfo.button, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Card (.rounded-ds-lg) Computed Styles:</h3>
              <pre className="mt-2 text-sm bg-gray-100 spacing-3 rounded">
                {JSON.stringify(debugInfo.card, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Rounded (.rounded-ds-lg) Computed Styles:</h3>
              <pre className="mt-2 text-sm bg-gray-100 spacing-3 rounded">
                {JSON.stringify(debugInfo.rounded, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* CSS Rules Inspection */}
        <div className="mt-8 bg-white spacing-6 rounded-ds-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">CSS Rules Analysis</h2>
          <div className="text-sm space-y-2">
            <p><strong>Expected:</strong> All elements should have border-radius values from design tokens</p>
            <p><strong>--ds-rounded-ds-md:</strong> Should be 0.75rem (12px)</p>
            <p><strong>--ds-rounded-ds-lg:</strong> Should be 1rem (16px)</p>
            <p><strong>Issue:</strong> If border-radius shows as "0px" or empty, there's a CSS override</p>
          </div>
        </div>

        {/* Manual Test Elements */}
        <div className="mt-8 bg-white spacing-6 rounded-ds-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Manual Test Elements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-200 spacing-3 radius-none text-center text-xs">radius-none</div>
            <div className="bg-red-200 spacing-3 rounded-ds-sm text-center text-xs">rounded-ds-sm</div>
            <div className="bg-red-200 spacing-3 rounded text-center text-xs">rounded</div>
            <div className="bg-red-200 spacing-3 rounded-ds-md text-center text-xs">rounded-ds-md</div>
            <div className="bg-red-200 spacing-3 rounded-ds-lg text-center text-xs">rounded-ds-lg</div>
            <div className="bg-red-200 spacing-3 rounded-ds-xl text-center text-xs">rounded-ds-xl</div>
            <div className="bg-red-200 spacing-3 radius-2xl text-center text-xs">radius-2xl</div>
            <div className="bg-red-200 spacing-3 rounded-ds-full text-center text-xs">rounded-ds-full</div>
          </div>
        </div>

        {/* Inline Style Test */}
        <div className="mt-8 bg-white spacing-6 rounded-ds-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Inline Style Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className="bg-blue-200 spacing-3 text-center text-xs"
              style={{ borderRadius: 'var(--ds-rounded-ds-sm)' }}
            >
              var(--ds-rounded-ds-sm)
            </div>
            <div 
              className="bg-blue-200 spacing-3 text-center text-xs"
              style={{ borderRadius: 'var(--ds-rounded-ds-md)' }}
            >
              var(--ds-rounded-ds-md)
            </div>
            <div 
              className="bg-blue-200 spacing-3 text-center text-xs"
              style={{ borderRadius: 'var(--ds-rounded-ds-lg)' }}
            >
              var(--ds-rounded-ds-lg)
            </div>
            <div 
              className="bg-blue-200 spacing-3 text-center text-xs"
              style={{ borderRadius: '8px' }}
            >
              8px (hardcoded)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
