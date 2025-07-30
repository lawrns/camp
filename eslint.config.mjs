import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      'design-tokens': {
        rules: {
          'token-validation': await import('./lib/eslint-rules/design-token-validation.js').then(m => m.default),
        },
      },
      'campfire': {
        rules: {
          'no-snakecase-supabase': await import('./lib/eslint-rules/no-snakecase-supabase.js').then(m => m.default),
        },
      },
    },
    rules: {
      'design-tokens/token-validation': 'error',
      'campfire/no-snakecase-supabase': ['error', {
        allowedFields: [
          'created_at',
          'updated_at',
          'deleted_at',
          'auth_user_id',
          'conversation_id',
          'organization_id',
          'customer_id',
          'mailbox_id',
          'user_id',
          'message_id',
          'ai_session_id'
        ]
      }],
    },
  },
];

export default eslintConfig;
