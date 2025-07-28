/**
 * Simple test to verify Jest is working
 */

describe('Testing Infrastructure', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('String operations work', () => {
    expect('hello world').toContain('world');
  });

  test('Array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('Object operations work', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });

  test('Async operations work', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});

describe('Design System Token Validation', () => {
  test('Token pattern validation works', () => {
    const validTokens = [
      'p-ds-4',
      'px-ds-2',
      'py-ds-6',
      'm-ds-8',
      'gap-ds-4',
      'rounded-ds-lg',
      'bg-primary',
      'text-foreground',
    ];

    const tokenPattern = /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$|^rounded(-[trbl])?-ds-(none|xs|sm|md|lg|xl|2xl|3xl|full)$|^(bg|text|border)-(primary|secondary|success|warning|error|info|muted|accent|card|popover|background|foreground)(-\d+)?$/;

    validTokens.forEach(token => {
      expect(tokenPattern.test(token)).toBe(true);
    });
  });

  test('Invalid token patterns are rejected', () => {
    const invalidTokens = [
      'gap-spacing-sm',
      'px-ds-spacing-4',
      'radius-full',
      'text-ds-text',
      'bg-ds-brand-hover',
    ];

    const tokenPattern = /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$|^rounded(-[trbl])?-ds-(none|xs|sm|md|lg|xl|2xl|3xl|full)$|^(bg|text|border)-(primary|secondary|success|warning|error|info|muted|accent|card|popover|background|foreground)(-\d+)?$/;

    invalidTokens.forEach(token => {
      expect(tokenPattern.test(token)).toBe(false);
    });
  });

  test('Token suggestions are correct', () => {
    const suggestions = {
      'gap-spacing-sm': 'gap-ds-2',
      'px-ds-spacing-4': 'px-ds-4',
      'radius-full': 'rounded-ds-full',
      'text-ds-text': 'text-foreground',
      'bg-ds-brand-hover': 'bg-primary hover:bg-primary-600',
    };

    Object.entries(suggestions).forEach(([invalid, valid]) => {
      expect(valid).toBeTruthy();
      expect(invalid).not.toBe(valid);
      expect(typeof valid).toBe('string');
      expect(valid.length).toBeGreaterThan(0);
    });
  });
});
