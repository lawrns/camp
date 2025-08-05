# Design System Migration Strategy & Implementation Plan

## Migration Overview

This document outlines the systematic approach to migrate all dashboard components to 100% design system compliance, eliminating hardcoded values and unifying component APIs.

## Phase 1: Foundation & Critical Components (Week 1)

### 1.1 MetricCard.tsx Migration (Priority: Critical)
**Current State**: 30% compliant, legacy UI imports, hardcoded colors
**Target**: Replace with StandardizedDashboard.MetricCard

#### Migration Steps:
```typescript
// BEFORE (MetricCard.tsx)
import { Card } from '@/components/ui/card';
const getTrendColor = (trend) => {
  switch (trend) {
    case 'up': return 'text-green-600';
    case 'down': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// AFTER (Use StandardizedDashboard.MetricCard)
import { MetricCard } from '@/components/dashboard/StandardizedDashboard';
// Trend colors handled by variant system
<MetricCard variant="success" trend="up" />
```

#### Breaking Changes:
- `status` prop → `variant` prop
- Remove custom color functions
- Update 15 dependent components

#### Effort: 8 hours
- 4 hours: Component migration
- 2 hours: Dependent component updates  
- 2 hours: Testing and validation

### 1.2 PremiumKPICards.tsx Migration (Priority: Critical)
**Current State**: 25% compliant, mixed token systems
**Target**: Full design token compliance

#### Migration Steps:
```typescript
// BEFORE
const colorClasses = {
  info: {
    icon: "text-blue-600",
    iconBg: "bg-blue-600/10",
    border: "border-[var(--fl-color-brand)]/20",
  }
};

// AFTER  
const colorClasses = {
  info: {
    icon: "text-[var(--fl-color-primary-600)]",
    iconBg: "bg-[var(--fl-color-primary-50)]",
    border: "border-[var(--fl-color-primary-200)]",
  }
};
```

#### Effort: 6 hours
- 3 hours: Token migration
- 2 hours: Accessibility improvements
- 1 hour: Testing

### 1.3 QuickActionButton.tsx Migration (Priority: Critical)
**Current State**: 20% compliant, no design tokens
**Target**: Complete redesign with unified tokens

#### Migration Steps:
```typescript
// BEFORE
const colorConfig = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    border: 'border-blue-200',
    icon: 'text-blue-600',
  }
};

// AFTER
const colorConfig = {
  blue: {
    bg: 'bg-[var(--fl-color-primary-gradient)]',
    border: 'border-[var(--fl-color-primary-200)]', 
    icon: 'text-[var(--fl-color-primary-600)]',
  }
};
```

#### Effort: 4 hours
- 2 hours: Complete redesign
- 1 hour: Token implementation
- 1 hour: Testing

## Phase 2: High Priority Components (Week 2)

### 2.1 EnhancedMetricCard.tsx Migration
**Current State**: 65% compliant, hardcoded gradients
**Target**: Unified API with StandardizedDashboard

#### Migration Strategy:
1. **Deprecate component** - Mark as deprecated
2. **Create migration guide** - Map props to StandardizedDashboard.MetricCard
3. **Update consumers** - 8 components need updates
4. **Remove component** - After all migrations complete

#### API Migration:
```typescript
// BEFORE
<EnhancedMetricCard
  color="blue"
  trend="up"
  change="+12%"
/>

// AFTER  
<MetricCard
  variant="info"
  change={{
    value: 12,
    trend: "up",
    period: "last month"
  }}
/>
```

#### Effort: 5 hours

### 2.2 IntercomMetricCard.tsx Migration
**Current State**: 60% compliant, custom glass effects
**Target**: Align with design system aesthetics

#### Migration Focus:
- Replace glass card styling with design system shadows
- Migrate color system to unified tokens
- Standardize animation patterns

#### Effort: 6 hours

### 2.3 RealtimeTeamDashboard.tsx Migration  
**Current State**: 35% compliant, legacy imports
**Target**: Unified import patterns and token usage

#### Migration Steps:
1. Update all imports to unified-ui
2. Replace mixed token usage (`gap-ds-4` → `gap-[var(--fl-spacing-4)]`)
3. Standardize component APIs

#### Effort: 4 hours

## Phase 3: Medium Priority & Optimization (Week 3)

### 3.1 LivePerformanceMonitor.tsx
**Target**: Standardize mixed token patterns
**Effort**: 3 hours

### 3.2 ActivityFeed.tsx  
**Target**: Minor token compliance updates
**Effort**: 2 hours

## Unified Component API Standards

### Standard MetricCard Interface
```typescript
interface StandardMetricCardProps {
  // Core properties
  title: string;
  value: string | number;
  description?: string;
  
  // Visual variants
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  
  // Interactive features
  onClick?: () => void;
  loading?: boolean;
  
  // Data visualization
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  target?: {
    value: number;
    label: string;
  };
  chart?: ReactNode;
  
  // Customization
  icon?: ComponentType;
  className?: string;
  children?: ReactNode;
}
```

### Design Token Usage Standards
```css
/* Color System */
--fl-color-primary-50     /* Light backgrounds */
--fl-color-primary-100    /* Hover states */
--fl-color-primary-500    /* Default colors */
--fl-color-primary-600    /* Text colors */
--fl-color-primary-900    /* Dark text */

/* Spacing System (4px grid) */
--fl-spacing-1    /* 4px */
--fl-spacing-2    /* 8px */
--fl-spacing-3    /* 12px */
--fl-spacing-4    /* 16px */
--fl-spacing-6    /* 24px */

/* Typography */
--fl-typography-xs        /* 12px */
--fl-typography-sm        /* 14px */
--fl-typography-base      /* 16px */
--fl-typography-lg        /* 18px */

/* Effects */
--fl-shadow-sm           /* Subtle shadows */
--fl-shadow-md           /* Card shadows */
--fl-radius-md           /* Border radius */
```

## Migration Tools & Automation

### 1. Automated Refactoring Script
```javascript
// migration-tools/refactor-imports.js
const fs = require('fs');
const path = require('path');

const IMPORT_MAPPINGS = {
  "import { Card } from '@/components/ui/card'": 
    "import { Card } from '@/components/unified-ui/components/Card'",
  "import { Button } from '@/components/ui/button'":
    "import { Button } from '@/components/unified-ui/components/Button'",
};

function migrateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(IMPORT_MAPPINGS).forEach(([oldImport, newImport]) => {
    content = content.replace(new RegExp(oldImport, 'g'), newImport);
  });
  
  fs.writeFileSync(filePath, content);
}
```

### 2. Token Migration Script
```javascript
// migration-tools/migrate-tokens.js
const TOKEN_MAPPINGS = {
  'text-blue-600': 'text-[var(--fl-color-primary-600)]',
  'bg-blue-50': 'bg-[var(--fl-color-primary-50)]',
  'border-blue-200': 'border-[var(--fl-color-primary-200)]',
  'text-green-600': 'text-[var(--fl-color-success-600)]',
  'text-red-600': 'text-[var(--fl-color-error-600)]',
};

function migrateTokens(content) {
  Object.entries(TOKEN_MAPPINGS).forEach(([hardcoded, token]) => {
    content = content.replace(new RegExp(hardcoded, 'g'), token);
  });
  return content;
}
```

### 3. Compliance Validation Script
```javascript
// migration-tools/validate-compliance.js
function validateCompliance(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for hardcoded colors
  const hardcodedColors = content.match(/(?:text|bg|border)-(?:blue|red|green|yellow)-\d+/g);
  if (hardcodedColors) {
    issues.push(`Hardcoded colors found: ${hardcodedColors.join(', ')}`);
  }
  
  // Check for legacy imports
  const legacyImports = content.match(/@\/components\/ui\//g);
  if (legacyImports) {
    issues.push(`Legacy UI imports found: ${legacyImports.length} instances`);
  }
  
  return {
    compliant: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 10))
  };
}
```

## Implementation Timeline

### Week 1: Foundation (Critical Components)
- **Day 1-2**: MetricCard.tsx migration
- **Day 3**: PremiumKPICards.tsx migration  
- **Day 4**: QuickActionButton.tsx migration
- **Day 5**: Testing and validation

### Week 2: High Priority Components
- **Day 1-2**: EnhancedMetricCard.tsx migration
- **Day 3**: IntercomMetricCard.tsx migration
- **Day 4**: RealtimeTeamDashboard.tsx migration
- **Day 5**: Integration testing

### Week 3: Optimization & Validation
- **Day 1**: LivePerformanceMonitor.tsx migration
- **Day 2**: ActivityFeed.tsx migration
- **Day 3-4**: Comprehensive testing
- **Day 5**: Documentation and cleanup

## Success Criteria

### Technical Metrics
- [ ] 100% design token compliance across all components
- [ ] Zero hardcoded color values in production code
- [ ] Unified component API consistency (single MetricCard interface)
- [ ] Single design system import pattern

### Quality Metrics  
- [ ] WCAG AA accessibility compliance for all components
- [ ] 95%+ visual consistency score across dashboard
- [ ] <100ms component render performance
- [ ] Zero TypeScript errors or warnings

### Process Metrics
- [ ] All migration scripts tested and validated
- [ ] Comprehensive test coverage for migrated components
- [ ] Documentation updated for new patterns
- [ ] Team training completed on new standards

---

*This migration strategy ensures systematic, low-risk transition to 100% design system compliance.*
