import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import pluginHtml from 'eslint-plugin-html';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{js,mjs,cjs,vue,html}'],
    plugins: {
      html: pluginHtml
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',

        // Chrome Extension APIs
        chrome: 'readonly',
        browser: 'readonly',

        // Node.js globals for build scripts
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',

        // Additional browser globals
        alert: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        // Browser APIs
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly'
      }
    },
    rules: {
      // JavaScript rules
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],

      // Vue specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'off',
      'vue/html-indent': ['error', 2],
      'vue/max-attributes-per-line': ['error', {
        singleline: 3,
        multiline: 1
      }],
      'vue/html-self-closing': ['error', {
        html: {
          void: 'never',
          normal: 'always',
          component: 'always'
        }
      }]
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false
      }
    }
  },
  {
    // Configuration for HTML files
    files: ['**/*.html'],
    rules: {
      'indent': ['error', 2]
    }
  },
  {
    // Configuration for popup and content scripts
    files: ['popup.js', 'src/content-script.js'],
    rules: {
      'no-console': 'off' // Allow console in extension scripts
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.git/**',
      '*.min.js',
      'coverage/**'
    ]
  }
];
