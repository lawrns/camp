'use client';

import { useEffect, useState } from 'react';

export default function TestDesignSystemResultsPage() {
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        // Test function to check computed values
        const testDesignSystem = () => {
            const testContainer = document.createElement('div');
            testContainer.style.position = 'absolute';
            testContainer.style.left = '-9999px';
            testContainer.style.top = '-9999px';
            testContainer.innerHTML = `
                <div class="spacing-2" id="test-spacing-2">Test</div>
                <div class="spacing-4" id="test-spacing-4">Test</div>
                <div class="spacing-6" id="test-spacing-6">Test</div>
                <div class="spacing-8" id="test-spacing-8">Test</div>
                <div class="rounded-ds-md" id="test-rounded-ds-md">Test</div>
                <div class="rounded-ds-lg" id="test-rounded-ds-lg">Test</div>
                <div class="rounded-ds-xl" id="test-rounded-ds-xl">Test</div>
                <div class="radius-2xl" id="test-radius-2xl">Test</div>
                <h1 class="page-header-h1" id="test-h1">Test</h1>
                <h2 class="page-header-h2" id="test-h2">Test</h2>
                <h3 class="page-header-h3" id="test-h3">Test</h3>
                <h4 class="page-header-h4" id="test-h4">Test</h4>
                <div class="section-header" id="test-section">Test</div>
                <div class="component-header" id="test-component">Test</div>
                <button class="btn-height-sm" id="test-btn-sm">Test</button>
                <button class="btn-height-md" id="test-btn-md">Test</button>
                <button class="btn-height-lg" id="test-btn-lg">Test</button>
            `;

            document.body.appendChild(testContainer);

            // Expected values
            const expectedValues = {
                'test-spacing-2': { padding: '8px' },
                'test-spacing-4': { padding: '16px' },
                'test-spacing-6': { padding: '24px' },
                'test-spacing-8': { padding: '32px' },
                'test-rounded-ds-md': { borderRadius: '6px' },
                'test-rounded-ds-lg': { borderRadius: '8px' },
                'test-rounded-ds-xl': { borderRadius: '12px' },
                'test-radius-2xl': { borderRadius: '16px' },
                'test-h1': { fontSize: '36px' },
                'test-h2': { fontSize: '30px' },
                'test-h3': { fontSize: '24px' },
                'test-h4': { fontSize: '20px' },
                'test-section': { fontSize: '20px' },
                'test-component': { fontSize: '18px' },
                'test-btn-sm': { height: '32px' },
                'test-btn-md': { height: '40px' },
                'test-btn-lg': { height: '48px' }
            };

            // Test each element
            const testResults: unknown = {};
            let totalTests = 0;
            let passedTests = 0;

            Object.entries(expectedValues).forEach(([elementId, expectedProps]) => {
                const element = document.getElementById(elementId);
                if (!element) {
                    testResults[elementId] = { error: 'Element not found' };
                    return;
                }

                const computedStyle = getComputedStyle(element);
                testResults[elementId] = {};

                Object.entries(expectedProps).forEach(([property, expectedValue]) => {
                    totalTests++;
                    const actualValue = computedStyle[property];

                    if (actualValue === expectedValue) {
                        passedTests++;
                        testResults[elementId][property] = {
                            expected: expectedValue,
                            actual: actualValue,
                            status: 'PASS'
                        };
                    } else {
                        testResults[elementId][property] = {
                            expected: expectedValue,
                            actual: actualValue,
                            status: 'FAIL'
                        };
                    }
                });
            });

            // Clean up
            document.body.removeChild(testContainer);

            setResults({
                testResults,
                summary: {
                    total: totalTests,
                    passed: passedTests,
                    failed: totalTests - passedTests,
                    success: passedTests === totalTests
                }
            });
        };

        // Run test after a short delay to ensure styles are loaded
        setTimeout(testDesignSystem, 1000);
    }, []);

    return (
        <div className="min-h-screen bg-background spacing-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="page-header-h1 text-text">Design System Test Results</h1>

                {results ? (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className={`rounded-ds-lg spacing-4 ${results.summary.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <h2 className="section-header">
                                {results.summary.success ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
                            </h2>
                            <p className="text-sm">
                                Passed: {results.summary.passed}/{results.summary.total} tests
                                {results.summary.failed > 0 && ` (${results.summary.failed} failed)`}
                            </p>
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-4">
                            <h2 className="section-header">Detailed Test Results</h2>

                            {Object.entries(results.testResults).map(([elementId, elementResults]: [string, any]) => (
                                <div key={elementId} className="rounded-ds-lg border border-border spacing-4">
                                    <h3 className="component-header">{elementId}</h3>

                                    {elementResults.error ? (
                                        <p className="text-red-600">{elementResults.error}</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.entries(elementResults).map(([property, result]: [string, any]) => (
                                                <div key={property} className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{property}:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm">Expected: {result.expected}</span>
                                                        <span className="text-sm">Actual: {result.actual}</span>
                                                        <span className={`text-sm font-bold ${result.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {result.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-ds-lg border border-border spacing-4">
                        <p>Running design system tests...</p>
                    </div>
                )}
            </div>
        </div>
    );
} 