import js from "@eslint/js";
import eslintPlugin from "eslint-plugin-eslint-plugin";
import nodePlugin from "eslint-plugin-n";
import globals from "globals";

import headersPlugin from "./lib/index.js";

const configConfig = {
  name: "eslint-config",
  files: ["eslint.config.mjs"],
  languageOptions: {
    globals: {
      ...globals.node,
    },
    sourceType: "module",
  },
};

const srcConfig = {
  name: "lib",
  files: ["**/*.js"],
  ignores: ["tests/**/*.js"],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
};

const headerConfig = {
  name: "headers",
  files: ["lib/**/*.js"],
  plugins: {
    headers: headersPlugin,
  },
  rules: {
    "headers/header-format": [
      "error",
      {
        source: "string",
        style: "jsdoc",
        content: "@fileoverview (description)\n@author (author)",
        patterns: {
          description: { pattern: ".+" },
          author: { pattern: ".+" },
        },
        trailingNewlines: 1,
      },
    ],
  },
};

const testConfig = {
  name: "test",
  files: ["tests/**/*.js"],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.mocha,
    },
  },
};

export default [
  js.configs.recommended,
  eslintPlugin.configs.recommended,
  nodePlugin.configs["flat/recommended"],
  configConfig,
  srcConfig,
  headerConfig,
  testConfig,
];
