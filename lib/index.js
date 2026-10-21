/**
 * @fileoverview Rules for linting and formatting file headers.
 * @author Rob Misasi
 */
"use strict";

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------
/** @type {import('eslint').ESLint.Plugin} */
module.exports = {
  rules: {
    "header-format": require("./rules/header-format"),
  },
};
