/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock
 * @author Rob Misasi
 */
"use strict";

var fs = require("fs");
var os = require("os");

var {
  formatExpectedHeader,
  generateDocblock,
  getDocblockText,
  mergeDocblocks,
} = require("../utils");

/**
 * Checks if {@link code} starts with a comment. Ignores shebang, if present.
 *
 * @param {string} code
 * @returns true if {@link code} starts with comment syntax.
 */
function hasHeaderComment(code) {
  var codeCpy = `${code}`;
  if (codeCpy.startsWith("#!")) {
    codeCpy = codeCpy.substring(
      codeCpy.indexOf(os.EOL) + os.EOL.length,
      codeCpy.length,
    );
  }
  return codeCpy.startsWith("/*") || codeCpy.startsWith("//");
}

/**
 * Gets header comment, ignoring shebang if present.
 *
 * @param {import('eslint').Rule.RuleContext} context Rule context
 */
function getHeaderComment(context) {
  var comments = context.sourceCode.getAllComments();
  if (comments[0].type === "Shebang") {
    return comments[1];
  }
  return comments[0];
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
      insertHeader: "Insert expected header at top of file.",
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
        },
        required: ["type"],
        allOf: [
          {
            if: {
              properties: { type: { const: "file" } },
              required: ["type"],
            },
            then: {
              required: ["path"],
            },
          },
          {
            if: {
              properties: { type: { const: "string" } },
              required: ["type"],
            },
            then: {
              required: ["content"],
            },
          },
        ],
      },
    ],
  },

  create(context) {
    var expectedHeaderText =
      context.options[0]["type"] === "file"
        ? fs.readFileSync(context.options[0]["path"], "utf-8").trimEnd()
        : context.options[0]["content"];

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      Program: function (node) {
        if (!hasHeaderComment(context.sourceCode.getText())) {
          var newHeaderDocblock = generateDocblock(expectedHeaderText);
          context.report({
            node: node.body[0],
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                node,
                formatExpectedHeader(newHeaderDocblock, 1),
              );
            },
          });
          return;
        }

        var headerComment = getHeaderComment(context);
        if (headerComment.type === "Line") {
          newHeaderDocblock = generateDocblock(expectedHeaderText);
          context.report({
            node: node.body[0],
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                headerComment,
                formatExpectedHeader(newHeaderDocblock, 1),
              );
            },
          });
          return;
        }

        var headerCommentText = getDocblockText(headerComment.value);
        if (!headerCommentText.startsWith(expectedHeaderText)) {
          var expectedDocblock = generateDocblock(expectedHeaderText);
          var mergedDocblock = mergeDocblocks(
            expectedDocblock,
            generateDocblock(headerCommentText),
          );
          context.report({
            node: headerComment,
            messageId: "headerContentMismatch",
            suggest: [
              {
                messageId: "replaceExistingHeader",
                fix: function (fixer) {
                  return fixer.replaceText(
                    headerComment,
                    formatExpectedHeader(expectedDocblock, 0),
                  );
                },
              },
              {
                messageId: "mergeHeaders",
                fix: function (fixer) {
                  return fixer.replaceText(
                    headerComment,
                    formatExpectedHeader(mergedDocblock, 0),
                  );
                },
              },
              {
                messageId: "insertHeader",
                fix: function (fixer) {
                  return fixer.insertTextBefore(
                    headerComment,
                    formatExpectedHeader(expectedDocblock, 1),
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
