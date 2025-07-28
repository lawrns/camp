/**
 * ESLint Rule: Design Token Validation
 * Prevents usage of invalid design system tokens in className attributes
 */

const VALID_TOKEN_PATTERNS = [
  // Design system spacing utilities
  /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-ds-\d+$/,
  
  // Design system border radius utilities
  /^rounded(-[trbl])?-ds-(none|xs|sm|md|lg|xl|2xl|3xl|full)$/,
  
  // Standard Tailwind utilities (allowed)
  /^(bg|text|border|flex|grid|w|h|min-h|max-w|items|justify|space|divide)-/,
  /^(inline|block|hidden|relative|absolute|fixed|sticky)$/,
  /^(transition|duration|ease|transform|hover|focus|active):/,
  
  // Color utilities from our design system
  /^(bg|text|border)-(primary|secondary|success|warning|error|info|muted|accent|card|popover|background|foreground)(-\d+)?$/,
  
  // Standard responsive and state prefixes
  /^(sm|md|lg|xl|2xl):/,
  /^(hover|focus|active|disabled|group-hover|group-focus):/,
];

const INVALID_TOKEN_PATTERNS = [
  // Invalid spacing patterns
  /gap-spacing-\w+/,
  /px-ds-spacing-\d+/,
  /py-ds-spacing-\d+/,
  /p-ds-spacing-\d+/,
  /m-ds-spacing-\d+/,
  
  // Invalid radius patterns
  /radius-(sm|md|lg|xl|full)/,
  /rounded-radius-\w+/,
  
  // Invalid text patterns
  /text-(small|h\d+|ds-text)/,
  /leading-typography-\w+/,
  
  // Invalid background patterns
  /bg-ds-(brand|surface|background)-\w+/,
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce proper design system token usage',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      invalidToken: 'Invalid design system token "{{token}}". Use proper Tailwind utilities instead.',
      suggestFix: 'Consider using "{{suggestion}}" instead of "{{token}}".',
    },
  },

  create(context) {
    function validateClassName(node, classNameValue) {
      if (typeof classNameValue !== 'string') return;

      const classes = classNameValue.split(/\s+/).filter(Boolean);
      
      classes.forEach(className => {
        // Skip if it's a valid pattern
        const isValid = VALID_TOKEN_PATTERNS.some(pattern => pattern.test(className));
        if (isValid) return;
        
        // Check if it matches invalid patterns
        const isInvalid = INVALID_TOKEN_PATTERNS.some(pattern => pattern.test(className));
        if (isInvalid) {
          const suggestion = getSuggestion(className);
          
          context.report({
            node,
            messageId: suggestion ? 'suggestFix' : 'invalidToken',
            data: {
              token: className,
              suggestion,
            },
            fix(fixer) {
              if (suggestion) {
                const newClassName = classNameValue.replace(className, suggestion);
                return fixer.replaceText(node, `"${newClassName}"`);
              }
              return null;
            },
          });
        }
      });
    }

    function getSuggestion(invalidToken) {
      const suggestions = {
        'gap-spacing-sm': 'gap-ds-2',
        'gap-spacing-md': 'gap-ds-4',
        'gap-spacing-lg': 'gap-ds-6',
        'radius-full': 'rounded-ds-full',
        'radius-lg': 'rounded-ds-lg',
        'radius-md': 'rounded-ds-md',
        'radius-sm': 'rounded-ds-sm',
        'text-small': 'text-sm',
        'text-h3': 'text-lg',
        'text-h4': 'text-base',
        'text-ds-text': 'text-foreground',
        'leading-typography-relaxed': 'leading-relaxed',
        'bg-ds-brand-hover': 'bg-primary hover:bg-primary-600',
        'bg-ds-surface': 'bg-background',
        'px-ds-spacing-4': 'px-ds-4',
        'py-ds-spacing-4': 'py-ds-4',
        'p-ds-spacing-4': 'p-ds-4',
        'm-ds-spacing-4': 'm-ds-4',
      };
      
      return suggestions[invalidToken] || null;
    }

    return {
      JSXAttribute(node) {
        if (node.name.name === 'className' && node.value) {
          if (node.value.type === 'Literal') {
            validateClassName(node.value, node.value.value);
          } else if (node.value.type === 'JSXExpressionContainer') {
            // Handle template literals and expressions
            const expression = node.value.expression;
            if (expression.type === 'TemplateLiteral') {
              expression.quasis.forEach(quasi => {
                validateClassName(node.value, quasi.value.cooked);
              });
            } else if (expression.type === 'Literal') {
              validateClassName(node.value, expression.value);
            }
          }
        }
      },
    };
  },
};
