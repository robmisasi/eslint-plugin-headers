/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock
 * @author Rob Misasi
 */
"use strict";

var fs = require("fs");

var {
  formatExpectedHeader,
  generateDocblock,
  getDocblockText,
  isShebang,
  mergeDocblocks,
} = require("../utils");

/**
 * Checks if @see src starts with a comment. Ignores shebang, if present.
 * @param {string} src
 * @returns true if @see src starts with comment syntax.
 */
function hasHeaderComment(src) {
  if (isShebang(src)) {
    var m = src.match(/(\r\n|\r|\n)/);
    if (m) {
      src = src.slice(m.index + m[0].length);
    }
  }
  return src.startsWith("/*");
}
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Verifies the presence of a particular string in a file's first docblock",
      recommended: false,
    },
    messages: {
      missingHeader: "No header found.",
      headerContentMismatch: "Header does not include expected content.",
      replaceExistingHeader: "Replace existing header.",
      mergeHeaders: "Merge expected header with existing header.",
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: {
          type: {
            enum: ["file", "string"],
          },
          content: {
            type: "string",
          },
          path: {
            type: "string",
          },
          trailingNewlines: {
            type: "integer",
            default: 0,
          },
        },
        required: ["type"],
      },
    ],
  },

  create(context) {
    var expectedHeaderText =
      context.options[0]["type"] === "file"
        ? fs.readFileSync(context.options[0]["path"])
        : context.options[0]["content"];
    var trailingNewlines = context.options[0]["trailingNewlines"];

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    // any helper functions should go here or else delete this section

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      Program: function (node) {
        if (!hasHeaderComment(context.getSourceCode().getText())) {
          var newHeaderDocblock = generateDocblock(expectedHeaderText);
          context.report({
            loc: node.loc,
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                node,
                formatExpectedHeader(newHeaderDocblock, trailingNewlines + 1)
              );
            },
          });
          return;
        }

        var headerComment = context.getSourceCode().getAllComments()[0];
        var headerCommentText = getDocblockText(headerComment.value);
        if (!headerCommentText.startsWith(expectedHeaderText)) {
          var expectedDocblock = generateDocblock(expectedHeaderText);
          var mergedDocblock = mergeDocblocks(
            expectedDocblock,
            generateDocblock(headerCommentText)
          );
          context.report({
            loc: node.loc,
            messageId: "headerContentMismatch",
            suggest: [
              {
                messageId: "replaceExistingHeader",
                fix: function (fixer) {
                  return fixer.replaceText(
                    headerComment,
                    formatExpectedHeader(expectedDocblock, trailingNewlines)
                  );
                },
              },
              {
                messageId: "mergeHeaders",
                fix: function (fixer) {
                  return fixer.replaceText(
                    headerComment,
                    formatExpectedHeader(mergedDocblock, trailingNewlines)
                  );
                },
              },
            ],
          });
        }
      },
    };
  },
};
