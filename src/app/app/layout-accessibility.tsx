import React from "react";
import { SkipNavigation } from "@/lib/accessibility/components";

// Accessibility-focused CSS to be added to globals.css
const accessibilityStyles = `
/* Focus Indicators */
:focus-visible {
  outline: 2px solid var(--focus-color, #2563eb);
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--background);
  color: var(--foreground);
  padding: 8px 16px;
  z-index: 100;
  text-decoration: none;
  border-radius: 0 0 4px 0;
}

.skip-link:focus {
  top: 0;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus trap for modals */
[data-focus-guard="true"] {
  position: fixed;
  left: 0;
  right: 0;
  height: 0;
  overflow: hidden;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --background: #ffffff;
    --foreground: #000000;
    --card: #ffffff;
    --card-foreground: #000000;
    --primary: #0000ff;
    --primary-foreground: #ffffff;
    --border: #000000;
  }
  
  .dark {
    --background: #000000;
    --foreground: #ffffff;
    --card: #000000;
    --card-foreground: #ffffff;
    --primary: #ffff00;
    --primary-foreground: #000000;
    --border: #ffffff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Color contrast improvements */
.text-muted {
  color: var(--text-muted-high-contrast, #6b7280);
}

@media (prefers-contrast: high) {
  .text-muted {
    color: var(--text-muted-high-contrast, #374151);
  }
}

/* Form validation states */
.field-error {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.field-error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.field-success {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.field-success:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Keyboard navigation indicators */
.keyboard-navigation *:focus {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

/* Touch target sizing */
button,
a,
input,
select,
textarea,
[role="button"],
[role="link"] {
  min-height: 44px;
  min-width: 44px;
}

/* Icon button sizing */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

/* Visible focus for interactive elements */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}
`;
