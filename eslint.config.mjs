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
    },
    rules: {
      'design-tokens/token-validation': 'error',
    },
  },
];

export default eslintConfig;
