/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock.
 * @author Rob Misasi
 */
"use strict";

var { EOL } = require("os");
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
          type: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: `/**${EOL} * This is the expected header comment.${EOL} */${EOL}${EOL}module.exports = 42;${EOL}`,
    },
    {
      options: [
        {
          type: "string",
          content: "This is the expected header comment with pragma.",
        },
      ],
      code: `/**${EOL} * This is the expected header comment with pragma.${EOL} *${EOL} * @jest-environment jsdom${EOL} */${EOL}${EOL}module.exports = 42;${EOL}`,
    },
    {
      options: [
        {
          type: "file",
          path: path.join(__dirname, "../../example-header.txt"),
        },
      ],
      code: `/**${EOL} * This is the expected header.${EOL} */${EOL}${EOL}module.exports = 42;${EOL}`,
    },
  ],

  invalid: [
    {
      options: [
        {
          type: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: `module.exports = 42;${EOL}`,
      errors: [{ messageId: "missingHeader" }],
      output: `/**${EOL} * This is the expected header comment.${EOL} */${EOL}module.exports = 42;${EOL}`,
    },
    {
      options: [
        {
          type: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: `/**${EOL} * This is the wrong header comment.${EOL} */${EOL}module.exports = 42;${EOL}`,
      errors: [
        {
          messageId: "headerContentMismatch",
          suggestions: [
            {
              messageId: "replaceExistingHeader",
              output: `/**${EOL} * This is the expected header comment.${EOL} */${EOL}module.exports = 42;${EOL}`,
            },
            {
              messageId: "mergeHeaders",
              output: `/**${EOL} * This is the expected header comment.${EOL} *${EOL} * This is the wrong header comment.${EOL} */${EOL}module.exports = 42;${EOL}`,
            },
            {
              messageId: "insertHeader",
              output: `/**${EOL} * This is the expected header comment.${EOL} */${EOL}/**${EOL} * This is the wrong header comment.${EOL} */${EOL}module.exports = 42;${EOL}`,
            },
          ],
        },
      ],
      output: null,
    },
    {
      options: [
        {
          type: "string",
          content: "This is a header",
        },
      ],
      code: `// Bad comment${EOL}module.exports = 42;`,
      errors: [
        {
          messageId: "missingHeader",
        },
      ],
      output: `/**${EOL} * This is a header${EOL} */${EOL}// Bad comment${EOL}module.exports = 42;`,
    },
  ],
});
