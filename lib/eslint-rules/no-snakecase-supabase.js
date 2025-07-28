/**
 * ESLint Rule: no-snakecase-supabase
 * 
 * Prevents snake_case field names in Supabase method calls to ensure
 * compliance with The Ten Commandments naming conventions.
 * 
 * This rule flags violations like:
 * - .eq('organization_id', value) → should be .eq('organizationId', value)
 * - .select('customer_email') → should be .select('customerEmail')
 * - .insert({ user_id: 123 }) → should be .insert({ userId: 123 })
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow snake_case field names in Supabase method calls',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedFields: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of snake_case field names that are allowed (e.g., system fields)'
          },
          excludeFiles: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of file patterns to exclude from this rule'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      snakeCaseInSupabaseCall: 'Snake_case field "{{field}}" found in Supabase {{method}} call. Use camelCase "{{suggestion}}" instead.',
      snakeCaseInObjectLiteral: 'Snake_case property "{{field}}" found in Supabase {{method}} object. Use camelCase "{{suggestion}}" instead.'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedFields = new Set(options.allowedFields || [
      'created_at',
      'updated_at', 
      'deleted_at',
      'auth_user_id'
    ]);
    const excludeFiles = options.excludeFiles || [
      '**/types/supabase.ts',
      '**/src/types/supabase.ts'
    ];
    
    // Check if current file should be excluded
    const filename = context.getFilename();
    const shouldExclude = excludeFiles.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    });
    
    if (shouldExclude) {
      return {};
    }

    /**
     * Convert snake_case to camelCase
     */
    function toCamelCase(str) {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    /**
     * Check if a string contains snake_case pattern
     */
    function hasSnakeCase(str) {
      return /^[a-z]+(_[a-z]+)+$/.test(str);
    }

    /**
     * Check if this is a Supabase method call
     */
    function isSupabaseMethod(node) {
      const supabaseMethods = [
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
        'is', 'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte',
        'rangeLt', 'rangeLte', 'rangeAdjacent', 'overlaps',
        'select', 'insert', 'update', 'upsert', 'delete',
        'order', 'limit', 'range', 'single', 'maybeSingle',
        'filter', 'match', 'not'
      ];
      
      return node.type === 'CallExpression' &&
             node.callee.type === 'MemberExpression' &&
             node.callee.property.type === 'Identifier' &&
             supabaseMethods.includes(node.callee.property.name);
    }

    /**
     * Check string literal arguments in Supabase method calls
     */
    function checkStringLiteralArguments(node) {
      if (!isSupabaseMethod(node)) return;
      
      const methodName = node.callee.property.name;
      
      // Check first argument for field names (eq, neq, gt, etc.)
      if (node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        const fieldName = node.arguments[0].value;
        
        if (typeof fieldName === 'string' && hasSnakeCase(fieldName) && !allowedFields.has(fieldName)) {
          context.report({
            node: node.arguments[0],
            messageId: 'snakeCaseInSupabaseCall',
            data: {
              field: fieldName,
              method: methodName,
              suggestion: toCamelCase(fieldName)
            },
            fix(fixer) {
              const quote = node.arguments[0].raw.charAt(0);
              return fixer.replaceText(node.arguments[0], `${quote}${toCamelCase(fieldName)}${quote}`);
            }
          });
        }
      }
      
      // Check select() calls for comma-separated field lists
      if (methodName === 'select' && node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        const selectString = node.arguments[0].value;
        if (typeof selectString === 'string') {
          const fields = selectString.split(',').map(f => f.trim());
          fields.forEach(field => {
            if (hasSnakeCase(field) && !allowedFields.has(field)) {
              context.report({
                node: node.arguments[0],
                messageId: 'snakeCaseInSupabaseCall',
                data: {
                  field: field,
                  method: methodName,
                  suggestion: toCamelCase(field)
                },
                fix(fixer) {
                  const newSelectString = selectString.replace(
                    new RegExp(`\\b${field}\\b`, 'g'),
                    toCamelCase(field)
                  );
                  const quote = node.arguments[0].raw.charAt(0);
                  return fixer.replaceText(node.arguments[0], `${quote}${newSelectString}${quote}`);
                }
              });
            }
          });
        }
      }
    }

    /**
     * Check object literal properties in Supabase method calls
     */
    function checkObjectLiteralProperties(node) {
      if (!isSupabaseMethod(node)) return;
      
      const methodName = node.callee.property.name;
      
      // Check object literals in insert, update, upsert, match calls
      const objectMethods = ['insert', 'update', 'upsert', 'match'];
      if (objectMethods.includes(methodName)) {
        node.arguments.forEach(arg => {
          if (arg.type === 'ObjectExpression') {
            arg.properties.forEach(prop => {
              if (prop.type === 'Property' && 
                  (prop.key.type === 'Identifier' || prop.key.type === 'Literal')) {
                
                const keyName = prop.key.type === 'Identifier' ? 
                  prop.key.name : 
                  prop.key.value;
                
                if (typeof keyName === 'string' && hasSnakeCase(keyName) && !allowedFields.has(keyName)) {
                  context.report({
                    node: prop.key,
                    messageId: 'snakeCaseInObjectLiteral',
                    data: {
                      field: keyName,
                      method: methodName,
                      suggestion: toCamelCase(keyName)
                    },
                    fix(fixer) {
                      if (prop.key.type === 'Identifier') {
                        return fixer.replaceText(prop.key, toCamelCase(keyName));
                      } else {
                        const quote = prop.key.raw.charAt(0);
                        return fixer.replaceText(prop.key, `${quote}${toCamelCase(keyName)}${quote}`);
                      }
                    }
                  });
                }
              }
            });
          }
        });
      }
    }

    return {
      CallExpression(node) {
        checkStringLiteralArguments(node);
        checkObjectLiteralProperties(node);
      }
    };
  }
};