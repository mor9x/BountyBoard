import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "coverage",
      "node_modules",
      "contracts/**/build",
      "skills/**/agents"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
    languageOptions: {
      globals: globals.browser
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }]
    }
  },
  {
    files: ["packages/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      globals: globals.node
    }
  }
);
