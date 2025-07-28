# UI Utilities

This directory contains utilities specifically for UI/presentation layer. These are helpers that format data for display, validate user input, and provide UI-specific functionality.

## Directory Structure

- **`/formatters`** - Data formatting for display (dates, numbers, etc.)
- **`/validators`** - Form validation and input sanitization
- **`/helpers`** - UI helper functions (colors, animations, etc.)

## Guidelines

1. Utilities in this directory should:
   - Be pure functions when possible
   - Focus on presentation logic only
   - Be framework-agnostic (work with any UI framework)
   - Have comprehensive unit tests
   - Be well-documented with examples

2. Utilities should NOT:
   - Make API calls
   - Access databases
   - Contain business logic
   - Manage application state

## Example Utility

```typescript
// formatters/date.ts
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

// validators/email.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// helpers/colors.ts
export function generateAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
```
