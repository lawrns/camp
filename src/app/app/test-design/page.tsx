'use client';

import { useEffect, useState } from 'react';

// Extend Window interface for our test function
declare global {
    interface Window {
        testDesignSystemInBrowser?: () => { passed: number; total: number };
    }
}

export default function TestDesignPage() {
    const [measurements, setMeasurements] = useState<any>(null);

    useEffect(() => {
        // Load the browser test script
        const loadBrowserTest = async () => {
            try {
                const script = document.createElement('script');
                script.src = '/test-design-system-browser.js';
                script.onload = () => {
                    // Run the test after a short delay
                    setTimeout(() => {
                        if (window.testDesignSystemInBrowser) {
                            window.testDesignSystemInBrowser();
                        }
                    }, 1000);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Failed to load browser test script:', error);
            }
        };

        loadBrowserTest();

        // Capture pixel-perfect measurements
        const captureMeasurements = () => {
            const elements = {
                spacing2: document.querySelector('.spacing-2') as HTMLElement,
                spacing4: document.querySelector('.spacing-4') as HTMLElement,
                radiusMd: document.querySelector('.rounded-ds-md') as HTMLElement,
                radiusLg: document.querySelector('.rounded-ds-lg') as HTMLElement,
                messageBubble: document.querySelector('.message-bubble') as HTMLElement,
                button: document.querySelector('.test-button') as HTMLElement,
            };

            const results: any = {};

            Object.entries(elements).forEach(([key, el]) => {
                if (el) {
                    const computed = getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    results[key] = {
                        // CSS values
                        padding: computed.padding,
                        margin: computed.margin,
                        borderRadius: computed.borderRadius,
                        fontSize: computed.fontSize,
                        lineHeight: computed.lineHeight,
                        color: computed.color,
                        backgroundColor: computed.backgroundColor,
                        border: computed.border,

                        // Pixel measurements
                        paddingTop: parseFloat(computed.paddingTop),
                        paddingRight: parseFloat(computed.paddingRight),
                        paddingBottom: parseFloat(computed.paddingBottom),
                        paddingLeft: parseFloat(computed.paddingLeft),
                        borderRadiusValue: parseFloat(computed.borderRadius),

                        // Element dimensions
                        width: rect.width,
                        height: rect.height,

                        // Position
                        x: rect.x,
                        y: rect.y,
                    };
                }
            });

            console.log('🎯 PIXEL MEASUREMENTS:', results);
            setMeasurements(results);
        };

        // Wait for fonts and styles to load
        setTimeout(captureMeasurements, 1000);
    }, []);

    return (
        <div className="min-h-screen bg-background spacing-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="page-header-h1 text-text">Design System Test Page</h1>

                {/* Spacing Tests */}
                <section className="space-y-4">
                    <h2 className="section-header">Spacing Tests (Padding)</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="spacing-2 rounded-ds-lg border-2 border-border bg-surface">
                            <div className="text-xs">spacing-2 (8px)</div>
                        </div>
                        <div className="spacing-4 rounded-ds-lg border-2 border-border bg-surface">
                            <div className="text-xs">spacing-4 (16px)</div>
                        </div>
                        <div className="spacing-6 rounded-ds-lg border-2 border-border bg-surface">
                            <div className="text-xs">spacing-6 (24px)</div>
                        </div>
                        <div className="spacing-8 rounded-ds-lg border-2 border-border bg-surface">
                            <div className="text-xs">spacing-8 (32px)</div>
                        </div>
                    </div>
                </section>

                {/* Border Radius Tests */}
                <section className="space-y-4">
                    <h2 className="section-header">Border Radius Tests</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-ds-md border-2 border-border bg-surface spacing-4">
                            <div className="text-xs">rounded-ds-md (6px)</div>
                        </div>
                        <div className="rounded-ds-lg border-2 border-border bg-surface spacing-4">
                            <div className="text-xs">rounded-ds-lg (8px)</div>
                        </div>
                        <div className="rounded-ds-xl border-2 border-border bg-surface spacing-4">
                            <div className="text-xs">rounded-ds-xl (12px)</div>
                        </div>
                        <div className="radius-2xl border-2 border-border bg-surface spacing-4">
                            <div className="text-xs">radius-2xl (16px)</div>
                        </div>
                    </div>
                </section>

                {/* Message Bubble Tests */}
                <section className="space-y-4">
                    <h2 className="section-header">Message Bubble Tests</h2>
                    <div className="space-y-4">
                        <div className="message-bubble user bg-primary text-white spacing-3 rounded-ds-lg max-w-xs ml-auto">
                            <div className="text-xs">User message bubble</div>
                        </div>
                        <div className="message-bubble agent bg-background-muted text-text spacing-3 rounded-ds-lg max-w-xs mr-auto border border-border">
                            <div className="text-xs">Agent message bubble</div>
                        </div>
                    </div>
                </section>

                {/* Button Tests */}
                <section className="space-y-4">
                    <h2 className="section-header">Button Tests</h2>
                    <div className="flex gap-4 flex-wrap">
                        <button className="test-button btn-height-sm bg-primary text-white rounded-ds-lg">
                            Small Button
                        </button>
                        <button className="test-button btn-height-md bg-primary text-white rounded-ds-lg">
                            Medium Button
                        </button>
                        <button className="test-button btn-height-lg bg-primary text-white rounded-ds-lg">
                            Large Button
                        </button>
                    </div>
                </section>

                {/* Typography Tests */}
                <section className="space-y-4">
                    <h2 className="section-header">Typography Tests</h2>
                    <div className="space-y-2">
                        <h1 className="page-header-h1">Page Header H1 (36px)</h1>
                        <h2 className="page-header-h2">Page Header H2 (30px)</h2>
                        <h3 className="page-header-h3">Page Header H3 (24px)</h3>
                        <h4 className="page-header-h4">Page Header H4 (20px)</h4>
                        <div className="section-header">Section Header (20px)</div>
                        <div className="component-header">Component Header (18px)</div>
                    </div>
                </section>

                {/* Measurements Display */}
                {measurements && (
                    <section className="space-y-4">
                        <h2 className="section-header">Pixel Measurements</h2>
                        <pre className="bg-background-muted spacing-4 rounded-ds-lg text-xs overflow-auto">
                            {JSON.stringify(measurements, null, 2)}
                        </pre>
                    </section>
                )}
            </div>
        </div>
    );
} 