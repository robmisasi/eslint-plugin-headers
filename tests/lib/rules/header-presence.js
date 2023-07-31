/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock.
 * @author Rob Misasi
 */
"use strict";

var path = require("path");

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
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: `/**\n * This is the expected header comment.\n */\n\nmodule.exports = 42;\n`,
    },
    {
      options: [
        {
          source: "string",
          style: "line",
          content: "This is the expected header.",
        },
      ],
      code: `// This is the expected header.\n\nmodule.exports = 42;\n`,
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment with carriage returns.",
        },
      ],
      code: `/**\r\n * This is the expected header comment with carriage returns.\r\n */\r\n\r\nmodule.exports = 42;\r\n`,
    },
    {
      options: [
        {
          source: "string",
          content:
            "This is the expected header comment\r\nwith a different EoL.",
        },
      ],
      code: `/**\n * This is the expected header comment\n * with a different EoL.\n */\n\nmodule.exports = 42;\n`,
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment with pragma.",
        },
      ],
      code: `/**\n * This is the expected header comment with pragma.\n *\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n`,
    },
    {
      options: [
        {
          source: "file",
          path: path.join(__dirname, "../../example-header.txt"),
        },
      ],
      code: `/**\n * This is the expected header.\n */\n\nmodule.exports = 42;\n`,
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header.",
        },
      ],
      code: `#! /usr/bin/node\n/**\n * This is the expected header.\n */\n\nmodule.exports = 42;`,
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
      code: `module.exports = 42;\n`,
      errors: [{ messageId: "missingHeader" }],
      output: `/**\n * This is the expected header comment.\n */\nmodule.exports = 42;\n`,
    },
    {
      options: [
        {
          source: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: `/**\n * This is the wrong header comment.\n */\nmodule.exports = 42;\n`,
      errors: [
        {
          messageId: "headerContentMismatch",
          suggestions: [
            {
              messageId: "replaceExistingHeader",
              output: `/**\n * This is the expected header comment.\n */\nmodule.exports = 42;\n`,
            },
            {
              messageId: "insertHeader",
              output: `/**\n * This is the expected header comment.\n */\n/**\n * This is the wrong header comment.\n */\nmodule.exports = 42;\n`,
            },
          ],
        },
      ],
      output: null,
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
        },
      ],
      code: "// Bad comment\nmodule.exports = 42;\n",
      errors: [
        {
          messageId: "headerContentMismatch",
          suggestions: [
            {
              messageId: "replaceExistingHeader",
              output: "/**\n * This is a header\n */\nmodule.exports = 42;\n",
            },
            {
              messageId: "insertHeader",
              output:
                "/**\n * This is a header\n */\n// Bad comment\nmodule.exports = 42;\n",
            },
          ],
        },
      ],
      output: null,
    },
    {
      options: [
        {
          source: "string",
          content: "This is a header",
        },
      ],
      code: "/**\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
      errors: [
        {
          messageId: "headerContentMismatch",
          suggestions: [
            {
              messageId: "replaceExistingHeader",
              output: "/**\n * This is a header\n */\n\nmodule.exports = 42;\n",
            },
            {
              messageId: "mergeHeaders",
              output:
                "/**\n * This is a header\n *\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
            },
            {
              messageId: "insertHeader",
              output:
                "/**\n * This is a header\n */\n/**\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
            },
          ],
        },
      ],
      output: null,
    },
  ],
});
