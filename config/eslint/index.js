module.exports = {
  extends: [
    'next/core-web-vitals',
    'prettier',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-restricted-imports': ['error', {
      'paths': [
        { name: '@supabase/auth-helpers-nextjs', message: 'Use the consolidated factory from @/lib/supabase' },
        { name: '@supabase/ssr', importNames: ['createRouteHandlerClient', 'createClientComponentClient', 'createServerComponentClient'], message: 'Use the consolidated factory from @/lib/supabase' },
        { name: '@supabase/supabase-js', importNames: ['createClient'], message: 'Use the consolidated factory from @/lib/supabase (allowed in scripts/** and supabase/functions/** only)' }
      ]
    }]
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};