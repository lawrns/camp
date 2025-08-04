'use client';

import React, { useEffect, useState } from 'react';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  element: string;
  message: string;
  fix: string;
}

interface AccessibilityTesterProps {
  children: React.ReactNode;
  onIssuesFound?: (issues: AccessibilityIssue[]) => void;
}

export function AccessibilityTester({ children, onIssuesFound }: AccessibilityTesterProps) {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runAccessibilityTest = () => {
    setIsTesting(true);
    const newIssues: AccessibilityIssue[] = [];

    // Test for missing alt attributes on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        newIssues.push({
          id: `img-${index}`,
          type: 'error',
          element: img.outerHTML.slice(0, 50) + '...',
          message: 'Image missing alt attribute',
          fix: 'Add alt="description" or aria-hidden="true"'
        });
      }
    });

    // Test for missing ARIA labels on interactive elements
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
        newIssues.push({
          id: `button-${index}`,
          type: 'warning',
          element: button.outerHTML.slice(0, 50) + '...',
          message: 'Button missing accessible label',
          fix: 'Add aria-label="description" or visible text content'
        });
      }
    });

    // Test for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName[1]);
      if (currentLevel - previousLevel > 1) {
        newIssues.push({
          id: `heading-${index}`,
          type: 'warning',
          element: heading.outerHTML.slice(0, 50) + '...',
          message: 'Skipped heading level',
          fix: `Use h${previousLevel + 1} instead of h${currentLevel}`
        });
      }
      previousLevel = currentLevel;
    });

    // Test for color contrast (basic check)
    const elements = document.querySelectorAll('*');
    elements.forEach((element, index) => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // Basic contrast check (simplified)
      if (color && backgroundColor && 
          (color.includes('rgb(0, 0, 0)') && backgroundColor.includes('rgb(0, 0, 0)')) ||
          (color.includes('rgb(255, 255, 255)') && backgroundColor.includes('rgb(255, 255, 255)'))) {
        newIssues.push({
          id: `contrast-${index}`,
          type: 'error',
          element: element.outerHTML.slice(0, 50) + '...',
          message: 'Potential contrast issue',
          fix: 'Ensure text has sufficient contrast with background'
        });
      }
    });

    // Test for keyboard navigation
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach((element, index) => {
      if (!element.getAttribute('tabindex') && element.tagName !== 'BUTTON') {
        newIssues.push({
          id: `keyboard-${index}`,
          type: 'info',
          element: element.outerHTML.slice(0, 50) + '...',
          message: 'Ensure keyboard navigation works',
          fix: 'Test tab navigation and add focus styles if needed'
        });
      }
    });

    setIssues(newIssues);
    onIssuesFound?.(newIssues);
    setIsTesting(false);
  };

  useEffect(() => {
    // Run test after component mounts
    const timer = setTimeout(runAccessibilityTest, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {children}
      
      {/* Accessibility Test Panel */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Accessibility Test</h3>
          <button
            onClick={runAccessibilityTest}
            disabled={isTesting}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Run Test'}
          </button>
        </div>
        
        {issues.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            <div className="text-xs text-gray-600 mb-2">
              Found {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </div>
            {issues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="mb-2 p-2 border-l-4 border-red-500 bg-red-50">
                <div className="text-xs font-medium text-red-800">{issue.message}</div>
                <div className="text-xs text-red-600 mt-1">{issue.fix}</div>
              </div>
            ))}
            {issues.length > 5 && (
              <div className="text-xs text-gray-500">
                ...and {issues.length - 5} more issues
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 