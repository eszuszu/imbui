import globals from 'globals';
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default tseslint.config(
  {
    ignores: [
      "eslint.config.js",
      "commitlint.config.mjs",
      "**/dist/**",
      "**/demo/**",
      "**/node_modules/**",
      "**/coverage/**"
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parser: tseslint.parser, //This tells ESLint to use the TypeScript Language
        // Service to resolve types, which correctly handles project references
        // and individual tsconfig.json files for each package.
        project: true,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      //overides / adds
    }
  }
)