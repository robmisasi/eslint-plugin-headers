/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock.
 * @author Rob Misasi
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/header-presence"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester();
ruleTester.run("header-presence", rule, {
  valid: [
    // give me some code that won't trigger a warning
    {
      code: "/**\n * This is an expected header comment.\n */\n\nmodule.exports = 42;\n",
    },
  ],

  invalid: [
    {
      code: "module.exports = 42;\n",
      errors: [{ messageId: "fileHeader" }],
    },
  ],
});
