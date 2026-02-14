import js from "@eslint/js";
import eslintPlugin from "eslint-plugin-eslint-plugin";
import nodePlugin from "eslint-plugin-n";
import globals from "globals";

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
  testConfig,
];
