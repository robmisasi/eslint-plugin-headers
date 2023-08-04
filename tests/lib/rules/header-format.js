/**
 * @fileoverview Verifies the content and format of a file's leading comment block.
 * @author Rob Misasi
 */
"use strict";

const path = require("path");

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/header-format"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester();
ruleTester.run("header-presence", rule, {
  valid: [
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: "/**\n * This is the expected header comment.\n */\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          style: "line",
          content: "This is the expected header.",
        },
      ],
      code: "// This is the expected header.\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          style: "line",
          content: "This is the expected line 1.\nThis is line 2.",
        },
      ],
      code: "// This is the expected line 1.\n// This is line 2.\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment with carriage returns.",
        },
      ],
      code: "/**\r\n * This is the expected header comment with carriage returns.\r\n */\r\n\r\nmodule.exports = 42;\r\n",
    },
    {
      options: [
        {
          source: "string",
          content:
            "This is the expected header comment\r\nwith a different EoL.",
        },
      ],
      code: "/**\n * This is the expected header comment\n * with a different EoL.\n */\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment with pragma.",
        },
      ],
      code: "/**\n * This is the expected header comment with pragma.\n *\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "file",
          path: path.join(__dirname, "../../example-header.txt"),
        },
      ],
      code: "/**\n * This is the expected header.\n */\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header with shebang.",
        },
      ],
      code: "#! /usr/bin/node\n/**\n * This is the expected header with shebang.\n */\n\nmodule.exports = 42;",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the header",
          blockPrefix: "blockPrefix\n",
        },
      ],
      code: "/*blockPrefix\n * This is the header\n */\nmodule.exports = 42;",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the header",
          blockSuffix: "\nblockSuffix",
        },
      ],
      code: "/**\n * This is the header\nblockSuffix*/\nmodule.exports = 42;",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the header",
          linePrefix: " # ",
        },
      ],
      code: "/**\n # This is the header\n */\nmodule.exports = 42;",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the header",
          trailingNewlines: 3,
        },
      ],
      code: "/**\n * This is the header\n */\n\n\nmodule.exports = 42;",
    },
  ],

  invalid: [
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: "module.exports = 42;\n",
      errors: [{ messageId: "missingHeader" }],
      output:
        "/**\n * This is the expected header comment.\n */\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: "/**\n * This is the wrong header comment.\n */\nmodule.exports = 42;\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output:
        "/**\n * This is the expected header comment.\n */\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
        },
      ],
      code: "// Bad comment\nmodule.exports = 42;\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output: "/**\n * This is a header\n */\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
        },
      ],
      code: "/**\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output:
        "/**\n * This is a header\n *\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
          preservePragmas: false,
        },
      ],
      code: "/**\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output: "/**\n * This is a header\n */\n\nmodule.exports = 42;\n",
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
          blockPrefix: "blockPrefix\n",
        },
      ],
      code: "/**\n * This is a header.\n */\nmodule.exports = 42;",
      errors: [{ messageId: "headerContentMismatch" }],
      output: "/*blockPrefix\n * This is a header\n */\nmodule.exports = 42;",
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
          blockSuffix: "\nblockSuffix",
        },
      ],
      code: "/**\n * This is a header.\n */\nmodule.exports = 42;",
      errors: [{ messageId: "headerContentMismatch" }],
      output: "/**\n * This is a header\nblockSuffix*/\nmodule.exports = 42;",
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header.",
          trailingNewlines: 3,
        },
      ],
      code: "/**\n * This is a header.\n */\nmodule.exports = 42;",
      errors: [{ messageId: "trailingNewlinesMismatch" }],
      output: "/**\n * This is a header.\n */\n\n\nmodule.exports = 42;",
    },
  ],
});
