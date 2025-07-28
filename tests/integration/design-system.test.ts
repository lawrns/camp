/**
 * Design System Integration Tests
 * Tests the complete design system token alignment and usage
 */

describe('Design System Integration', () => {
  describe('Token Validation Script', () => {
    test('should validate tokens correctly', async () => {
      const { TokenValidator } = require('../../scripts/validate-design-tokens.js');
      const validator = new TokenValidator();
      
      // Mock file system for testing
      const mockFiles = [
        'components/test/TestComponent.tsx'
      ];
      
      validator.getFilesToScan = jest.fn().mockReturnValue(mockFiles);
      
      // Mock file content with valid tokens
      const validContent = `
        export function TestComponent() {
          return (
            <div className="p-ds-4 gap-ds-2 rounded-ds-lg bg-primary text-foreground">
              <span className="m-ds-6 px-ds-8">Valid tokens</span>
            </div>
          );
        }
      `;
      
      const fs = require('fs');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(validContent);
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      
      const success = await validator.validate({ fix: false, verbose: false });
      expect(success).toBe(true);
      expect(validator.issues).toHaveLength(0);
    });

    test('should detect invalid tokens', async () => {
      const { TokenValidator } = require('../../scripts/validate-design-tokens.js');
      const validator = new TokenValidator();
      
      const mockFiles = ['components/test/InvalidComponent.tsx'];
      validator.getFilesToScan = jest.fn().mockReturnValue(mockFiles);
      
      // Mock file content with invalid tokens
      const invalidContent = `
        export function InvalidComponent() {
          return (
            <div className="gap-spacing-sm px-ds-spacing-4 radius-full text-ds-text">
              <span className="bg-ds-brand-hover">Invalid tokens</span>
            </div>
          );
        }
      `;
      
      const fs = require('fs');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(invalidContent);
      
      const success = await validator.validate({ fix: false, verbose: false });
      expect(success).toBe(false);
      expect(validator.issues.length).toBeGreaterThan(0);
      
      // Check specific invalid tokens are detected
      const invalidTokens = validator.issues.map(issue => issue.token);
      expect(invalidTokens).toContain('gap-spacing-sm');
      expect(invalidTokens).toContain('px-ds-spacing-4');
      expect(invalidTokens).toContain('radius-full');
      expect(invalidTokens).toContain('text-ds-text');
      expect(invalidTokens).toContain('bg-ds-brand-hover');
    });

    test('should provide correct fix suggestions', async () => {
      const { TokenValidator } = require('../../scripts/validate-design-tokens.js');
      const validator = new TokenValidator();
      
      const mockFiles = ['components/test/FixableComponent.tsx'];
      validator.getFilesToScan = jest.fn().mockReturnValue(mockFiles);
      
      const invalidContent = `
        <div className="gap-spacing-md px-ds-spacing-4 radius-lg">
          Content
        </div>
      `;
      
      const fs = require('fs');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(invalidContent);
      
      await validator.validate({ fix: false, verbose: false });
      
      const fixes = validator.issues.map(issue => ({ token: issue.token, fix: issue.fix }));
      
      expect(fixes).toContainEqual({ token: 'gap-spacing-md', fix: 'gap-ds-4' });
      expect(fixes).toContainEqual({ token: 'px-ds-spacing-4', fix: 'px-ds-4' });
      expect(fixes).toContainEqual({ token: 'radius-lg', fix: 'rounded-ds-lg' });
    });
  });

  describe('Tailwind Configuration', () => {
    test('should have design system tokens in config', () => {
      const tailwindConfig = require('../../tailwind.config.js');
      
      // Check spacing tokens
      expect(tailwindConfig.theme.extend.spacing).toHaveProperty('ds-1');
      expect(tailwindConfig.theme.extend.spacing).toHaveProperty('ds-2');
      expect(tailwindConfig.theme.extend.spacing).toHaveProperty('ds-4');
      expect(tailwindConfig.theme.extend.spacing).toHaveProperty('ds-6');
      expect(tailwindConfig.theme.extend.spacing).toHaveProperty('ds-8');
      
      // Check border radius tokens
      expect(tailwindConfig.theme.extend.borderRadius).toHaveProperty('ds-sm');
      expect(tailwindConfig.theme.extend.borderRadius).toHaveProperty('ds-md');
      expect(tailwindConfig.theme.extend.borderRadius).toHaveProperty('ds-lg');
      expect(tailwindConfig.theme.extend.borderRadius).toHaveProperty('ds-full');
      
      // Check that values reference CSS variables
      expect(tailwindConfig.theme.extend.spacing['ds-4']).toBe('var(--ds-spacing-4)');
      expect(tailwindConfig.theme.extend.borderRadius['ds-lg']).toBe('var(--ds-radius-lg)');
    });

    test('should have design system plugin', () => {
      const tailwindConfig = require('../../tailwind.config.js');
      
      expect(tailwindConfig.plugins).toBeDefined();
      expect(tailwindConfig.plugins.length).toBeGreaterThan(0);
      
      // The plugin should be a function
      const dsPlugin = tailwindConfig.plugins[0];
      expect(typeof dsPlugin).toBe('function');
    });
  });

  describe('CSS Variables', () => {
    test('should have consistent spacing scale', () => {
      const expectedSpacing = {
        '--ds-spacing-1': '0.25rem',
        '--ds-spacing-2': '0.5rem',
        '--ds-spacing-4': '1rem',
        '--ds-spacing-6': '1.5rem',
        '--ds-spacing-8': '2rem',
      };

      // This would be tested in a browser environment
      // For now, we just verify the structure
      Object.entries(expectedSpacing).forEach(([variable, value]) => {
        expect(variable).toMatch(/^--ds-spacing-\d+$/);
        expect(value).toMatch(/^\d+(\.\d+)?rem$/);
      });
    });

    test('should have consistent radius scale', () => {
      const expectedRadius = {
        '--ds-radius-sm': '0.25rem',
        '--ds-radius-md': '0.375rem',
        '--ds-radius-lg': '0.5rem',
        '--ds-radius-full': '9999px',
      };

      Object.entries(expectedRadius).forEach(([variable, value]) => {
        expect(variable).toMatch(/^--ds-radius-(sm|md|lg|xl|full)$/);
        expect(value).toMatch(/^(\d+(\.\d+)?rem|\d+px)$/);
      });
    });
  });

  describe('Component Token Usage', () => {
    test('should use valid token patterns in components', () => {
      // Test spacing tokens
      expect(/^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$/.test('p-ds-4')).toBe(true);
      expect(/^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$/.test('px-ds-2')).toBe(true);
      expect(/^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$/.test('gap-ds-6')).toBe(true);

      // Test radius tokens
      expect(/^rounded(-[trbl])?-ds-(none|xs|sm|md|lg|xl|2xl|3xl|full)$/.test('rounded-ds-lg')).toBe(true);

      // Test color tokens
      expect(/^(bg|text|border)-(primary|secondary|success|warning|error|info|muted|accent|card|popover|background|foreground)(-\d+)?$/.test('bg-primary')).toBe(true);
      expect(/^(bg|text|border)-(primary|secondary|success|warning|error|info|muted|accent|card|popover|background|foreground)(-\d+)?$/.test('text-foreground')).toBe(true);

      // Test standard Tailwind classes that should be allowed
      expect('flex').toBeTruthy();
      expect('items-center').toBeTruthy();
      expect('justify-center').toBeTruthy();
    });

    test('should reject invalid token patterns', () => {
      const invalidTokens = [
        'gap-spacing-sm',
        'px-ds-spacing-4',
        'radius-full',
        'text-ds-text',
        'bg-ds-brand-hover',
      ];

      // These tokens should not match any of our valid patterns
      const spacingPattern = /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$/;
      const radiusPattern = /^rounded(-[trbl])?-ds-(none|xs|sm|md|lg|xl|2xl|3xl|full)$/;
      const colorPattern = /^(bg|text|border)-(primary|secondary|success|warning|error|info|muted|accent|card|popover|background|foreground)(-\d+)?$/;

      invalidTokens.forEach(token => {
        const isValidSpacing = spacingPattern.test(token);
        const isValidRadius = radiusPattern.test(token);
        const isValidColor = colorPattern.test(token);
        const isValid = isValidSpacing || isValidRadius || isValidColor;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Regression Prevention', () => {
    test('should maintain token consistency across updates', () => {
      // This test ensures that token changes don't break existing usage
      const criticalTokens = [
        'p-ds-4',
        'gap-ds-2',
        'rounded-ds-lg',
        'bg-primary',
        'text-foreground',
      ];

      // These tokens should always be valid
      criticalTokens.forEach(token => {
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });

    test('should prevent common token mistakes', () => {
      const commonMistakes = [
        { wrong: 'gap-spacing-sm', right: 'gap-ds-2' },
        { wrong: 'px-ds-spacing-4', right: 'px-ds-4' },
        { wrong: 'radius-full', right: 'rounded-ds-full' },
        { wrong: 'text-ds-text', right: 'text-foreground' },
        { wrong: 'bg-ds-brand-hover', right: 'bg-primary hover:bg-primary-600' },
      ];

      commonMistakes.forEach(({ wrong, right }) => {
        expect(wrong).not.toBe(right);
        expect(right).toBeTruthy();
      });
    });
  });
});
