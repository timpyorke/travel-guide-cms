import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

export default [
    {
        ignores: ["dist/**/*", "build/**/*", "coverage/**/*", "node_modules/**/*"]
    },
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        ignores: ["dist/**/*", "build/**/*", "coverage/**/*"],
        languageOptions: {
            parser: tsparser,
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                global: "readonly",
                module: "readonly",
                require: "readonly",
                exports: "readonly",
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly"
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            "@typescript-eslint": tseslint,
            "react": reactPlugin,
            "react-hooks": reactHooksPlugin,
            "react-refresh": reactRefreshPlugin
        },
        rules: {
            // Disable problematic rules
            "no-undef": "off",
            "no-unused-vars": "off", // Use TypeScript version instead
            "@typescript-eslint/no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],

            // React rules
            "react/prop-types": "off",
            "react/jsx-handler-names": "off",
            "react/jsx-fragments": "off",
            "react/no-unused-prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react-refresh/only-export-components": "warn",

            // Import/export rules
            "import/export": "off",
            "no-use-before-define": "off",
            "@typescript-eslint/no-use-before-define": "off",

            // Code style (warnings only)
            "no-empty-pattern": "off",
            "no-shadow": "warn",
            "padded-blocks": "off",
            "brace-style": "off",
            "curly": "off",
            "semi": ["warn", "always"],
            "quotes": ["warn", "double", { "avoidEscape": true }],

            // Spacing rules (less strict)
            "key-spacing": "off",
            "no-trailing-spaces": "off",
            "comma-dangle": "off",
            "no-multi-spaces": "off",
            "comma-spacing": "off",
            "keyword-spacing": "off",
            "no-multiple-empty-lines": "off",
            "object-curly-spacing": "off",
            "multiline-ternary": "off",
            "space-before-blocks": "off",
            "object-property-newline": "off",
            "eol-last": "off",
            "spaced-comment": "off",
            "indent": "off",
            "space-before-function-paren": "off"
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    }
];
