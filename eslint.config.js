const js = require("@eslint/js");
const eslintPlugin = require("eslint-plugin-eslint-plugin");
const nodePlugin = require("eslint-plugin-n");
const globals = require("globals");

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

module.exports = [
  js.configs.recommended,
  eslintPlugin.configs["flat/recommended"],
  nodePlugin.configs["flat/recommended"],
  srcConfig,
  testConfig,
];
