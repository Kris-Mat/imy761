import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx,js}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    languageOptions: {
      globals: { 
        ...globals.node,
        ...globals.browser 
      }
    },
    plugins: {
      stylistic
    },
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      eqeqeq: "off",
      "no-unused-vars": "error",
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
      "stylistic/semi": ["error", "always"],
      '@typescript-eslint/naming-convention': [
        'error', 
        {
          selector: 'default', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] 
        }, 
        {
          selector: ['class', 'interface', 'typeParameter', 'typeAlias'],
          format: ['PascalCase']
        }, 
        {
          selector: ['objectLiteralProperty', 'objectLiteralMethod'],
          format: null
        }, 
        {
          selector: ['enum', 'enumMember'],
          format: ['PascalCase', 'snake_case']
        }, 
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        }, 
        {
          selector: 'variable',
          format: ['UPPER_CASE', 'camelCase'],
          leadingUnderscore: 'allow'
        }, 
        {
          selector: 'typeProperty',
          format: null,
          filter: {
            regex: '^_count$',
            match: true
          }
        }
      ],
      "stylistic/space-before-blocks": ["error", "always"],
      "stylistic/keyword-spacing": [
        "error",
        {
          before: true,
          after: true
        }
      ],
      "stylistic/member-delimiter-style": [
        "error",
        {
          singleline: {
            delimiter: "semi",
            requireLast: true
          },
          multiline: {
            delimiter: "semi",
            requireLast: true
          }
        }
      ],
      "stylistic/type-annotation-spacing": [
        "error",
        {
          before: false,
          after: true,
          overrides: {
            arrow: {
              before: true,
              after: true
            }
          }
        }
      ],
      "stylistic/brace-style": ["error", "1tbs"],
      "stylistic/lines-between-class-members": [
        "error",
        "always",
        {
          exceptAfterSingleLine: true
        }
      ],
      "stylistic/object-curly-spacing": ["error", "always"],
      "stylistic/indent": ["error", 2],
      "arrow-body-style": "off",
      "comma-dangle": ["error", "never"],
      "class-methods-use-this": "off",
      "max-len": [
        "error",
        {
          code: 150,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true
        }
      ],
      "no-mixed-spaces-and-tabs": ["error"],
      "import/prefer-default-export": "off",
      "import/named": "off",
      "prefer-arrow/prefer-arrow-functions": "off",
      "stylistic/object-curly-newline": [
        "error",
        {
          ObjectExpression: {
            consistent: true,
            minProperties: 2
          },
          ObjectPattern: {
            consistent: true
          },
          ImportDeclaration: {
            consistent: true
          },
          ExportDeclaration: {
            consistent: true
          }
        }
      ],
      "stylistic/object-property-newline": [
        "error",
        {
          allowAllPropertiesOnSameLine: true
        }
      ],
      "arrow-parens": "off",
      "stylistic/lines-around-comment": "off"
    }
  },
  // Config for files that commonly use different naming conventions
  {
    files: ["**/plugins/theme.ts", "**/*.config.*"],
    rules: {
      "@typescript-eslint/naming-convention": "off"
    }
  }
]);
