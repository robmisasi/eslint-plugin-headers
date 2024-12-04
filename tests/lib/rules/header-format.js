/**
 * @fileoverview Verifies the content and format of a file's leading comment block.
 * @author Rob Misasi
 */
"use strict";

const path = require("path");
const os = require("os");

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
      name: "Matches an expected jsdoc header",
      options: [
        {
          source: "string",
          content: "This is the expected header comment.",
        },
      ],
      code: "/**\n * This is the expected header comment.\n */\n\nmodule.exports = 42;\n",
    },
    {
      name: "Matches an expected line-style header",
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
      name: "Matches multiline header content",
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
      name: "Matches a header agnostic to EoL characters",
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
      name: "Matches a header with correct content and a pragma expression",
      options: [
        {
          source: "string",
          content: "This is the expected header comment with pragma.",
        },
      ],
      code: "/**\n * This is the expected header comment with pragma.\n *\n * @jest-environment jsdom\n */\n\nmodule.exports = 42;\n",
    },
    {
      name: "Matches a header with content from a file",
      options: [
        {
          source: "file",
          path: path.join(__dirname, "../../example-header.txt"),
        },
      ],
      code: "/**\n * This is the expected header.\n */\n\nmodule.exports = 42;\n",
    },
    {
      name: "Matches header in file with a shebang",
      options: [
        {
          source: "string",
          content: "This is the expected header with shebang.",
        },
      ],
      code: "#! /usr/bin/node\n/**\n * This is the expected header with shebang.\n */\n\nmodule.exports = 42;",
    },
    {
      name: "Matches a custom blockPrefix",
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
      name: "Matches a custom blockSuffix",
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
      name: "Matches a custom linePrefix",
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
      name: "Matches custom trailing newlines",
      options: [
        {
          source: "string",
          content: "This is a header",
          style: "jsdoc",
          trailingNewlines: 2,
        },
      ],
      code: "/**\n * This is a header\n */\n\n/**\n * Documentation\n */\nmodule.exports = 42;\n",
    },
    {
      name: "Matches variable content",
      options: [
        {
          source: "string",
          content: "This is a {template}",
          variables: {
            template: "header",
          },
        },
      ],
      code: "/**\n * This is a header\n */\nmodule.exports = 42;\n",
    },
    {
      name: "Matches a header with mismatched line endings",
      options: [
        {
          source: "string",
          content:
            "This is line one.\nThis is line two.\n\nThis is line three.",
        },
      ],
      code: "/**\r\n * This is line one.\r\n * This is line two.\r\n *\r * This is line three.\n */\nmodule.exports = 42;",
    },
    {
      name: "Matches options configured with falsy values",
      options: [
        {
          source: "string",
          content: "This is a header.",
          style: "jsdoc",
          blockPrefix: "",
          blockSuffix: "",
          linePrefix: "",
          trailingNewlines: 0,
        },
      ],
      code: "/*This is a header.*/module.exports = 42;\n",
    },
  ],

  invalid: [
    {
      name: "Fixes a missing header in an empty file",
      options: [
        {
          source: "string",
          content: "This is a header.",
        },
      ],
      code: "",
      errors: [{ messageId: "missingHeader" }],
      output: `/**${os.EOL} * This is a header.${os.EOL} */${os.EOL}`,
    },
    {
      name: "Fixes a missing header",
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
      name: "Fixes a header with mismatched content",
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
      name: "Adds a line-comment header when expected content is split by too many newlines",
      options: [
        {
          source: "string",
          content: "This is a\nsplit comment",
          style: "line",
        },
      ],
      code: "// This is a\n\n// split comment\nmodule.exports = 42;\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output:
        "// This is a\n// split comment\n\n// split comment\nmodule.exports = 42;\n",
    },
    {
      name: "Replaces the leading header when the leading header does not match expected content",
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
      name: "Fixes missing header content when header includes a pragma expression",
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
      name: "Removes pragma expressions when configured to do so",
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
      name: "Fixes a mismatched block prefix",
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
      name: "Fixes a mismatched block suffix",
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
      name: "Fixes mismatched trailing newlines",
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
    {
      name: "Fixes a missing header and appends configured trailing newlines",
      options: [
        {
          source: "string",
          content: "This is a header with custom trailing newlines.",
          trailingNewlines: 2,
        },
      ],
      code: "module.exports = 42;\n",
      errors: [{ messageId: "missingHeader" }],
      output:
        "/**\n * This is a header with custom trailing newlines.\n */\n\nmodule.exports = 42;\n",
    },
    {
      name: "Fixes a header with mismatched variable content",
      options: [
        {
          source: "string",
          content: "This is a {template}",
          variables: {
            template: "header",
          },
        },
      ],
      code: "/**\n * This is a bad header\n */\nmodule.exports = 42;\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output: "/**\n * This is a header\n */\nmodule.exports = 42;\n",
    },
    {
      name: "Fixes a file with a shebang and no header",
      options: [
        {
          source: "string",
          content: "This is a header",
        },
      ],
      code: "#! /usr/bin/node\nmodule.exports = 42;\n",
      errors: [{ messageId: "missingHeader" }],
      output:
        "#! /usr/bin/node\n/**\n * This is a header\n */\nmodule.exports = 42;\n",
    },
    {
      name: "Fixes a file correctly when configured with falsy values",
      options: [
        {
          source: "string",
          content: "This is a header.",
          style: "jsdoc",
          blockPrefix: "",
          blockSuffix: "",
          linePrefix: "",
          trailingNewlines: 0,
        },
      ],
      code: "module.exports = 42;\n",
      errors: [{ messageId: "missingHeader" }],
      output: "/*This is a header.*/module.exports = 42;\n",
    },
  ],
});

const ruleTesterVue = new RuleTester({
  languageOptions: { parser: require("vue-eslint-parser"), ecmaVersion: 2018 },
});

const enableVueOption = { enableVueSupport: true };
ruleTesterVue.run("header-presence-html", rule, {
  valid: [
    {
      name: "Correctly matches a valid HTML header comment with the correct content",
      filename: "test.vue",
      options: [
        { source: "string", content: "This is a header", ...enableVueOption },
      ],
      code: "<!--\n  This is a header\n-->\n<template>\n  <div>This is content</div>\n</template>\n",
    },
    {
      name: "Correctly matches a valid HTML header comment with the correct content when the leading tag is not <template />",
      filename: "test.vue",
      options: [
        { source: "string", content: "This is a header", ...enableVueOption },
      ],
      code: "<!--\n  This is a header\n-->\n<style>div { font-size: 2em; }</style>\n<template>\n  <div>This is content</div>\n</template>\n",
    },
    {
      name: "Correctly matches a multiline HTML comment header",
      filename: "test.vue",
      options: [
        {
          source: "string",
          content: "This is a header\nwith another line",
          ...enableVueOption,
        },
      ],
      code: "<!--\n  This is a header\n  with another line\n-->\n<template>\n  <div>This is content</div>\n</template>\n",
    },
  ],
  invalid: [
    {
      name: "Inserts a missing header comment",
      filename: "test.vue",
      options: [
        { source: "string", content: "This is a header", ...enableVueOption },
      ],
      code: "<template>\n  <div>This is content</div>\n</template>\n",
      errors: [{ messageId: "missingHeader" }],
      output:
        "<!--\n  This is a header\n-->\n<template>\n  <div>This is content</div>\n</template>\n",
    },
    {
      name: "Fixes a header comment with mismatched content",
      filename: "test.vue",
      options: [
        {
          source: "string",
          content: "This is the expected header",
          ...enableVueOption,
        },
      ],
      code: "<!--\n  This is an incorrect header\n-->\n<template>\n  <div>This is content</div>\n</template>\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output:
        "<!--\n  This is the expected header\n-->\n<template>\n  <div>This is content</div>\n</template>\n",
    },
    {
      name: "Inserts the missing header before a script tag",
      filename: "test.vue",
      options: [
        {
          source: "string",
          content: "This is the expected header",
          ...enableVueOption,
        },
      ],
      code: "<!--\n  This is an incorrect header\n-->\n<script>import fakeModule from 'fakeModule';\nconst magicNum = 42;\n</script>\n<template>\n  <div>This is content</div>\n</template>\n",
      errors: [{ messageId: "headerContentMismatch" }],
      output:
        "<!--\n  This is the expected header\n-->\n<script>import fakeModule from 'fakeModule';\nconst magicNum = 42;\n</script>\n<template>\n  <div>This is content</div>\n</template>\n",
    },
    {
      name: "Inserts missing trailing newlines",
      filename: "test.vue",
      options: [
        {
          source: "string",
          content: "This is a header",
          trailingNewlines: 2,
          ...enableVueOption,
        },
      ],
      code: "<!--\n  This is a header\n-->\n<template>\n  <div>This is content</div>\n</template>\n",
      errors: [{ messageId: "trailingNewlinesMismatch" }],
      output:
        "<!--\n  This is a header\n-->\n\n<template>\n  <div>This is content</div>\n</template>\n",
    },
    {
      name: "Correctly identifies a missing header when another comment exists",
      filename: "test.vue",
      options: [
        { source: "string", content: "This is a header", ...enableVueOption },
      ],
      code: "<template>\n  <div>This is content</div>\n</template>\n<!-- This is a footer -->",
      errors: [{ messageId: "missingHeader" }],
      output:
        "<!--\n  This is a header\n-->\n<template>\n  <div>This is content</div>\n</template>\n<!-- This is a footer -->",
    },
  ],
});
