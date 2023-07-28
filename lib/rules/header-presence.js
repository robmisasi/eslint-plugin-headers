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
  getEolCharacter,
  mergeDocblocks,
} = require("../utils");

/**
 * Checks if {@link code} starts with a comment. Ignores shebang, if present.
 *
 * @param {string} code
 * @param {string} eol End of Line character(s).
 * @returns true if {@link code} starts with comment syntax.
 */
function hasHeaderComment(code, eol) {
  var codeCpy = `${code}`;
  if (codeCpy.startsWith("#!")) {
    codeCpy = codeCpy.substring(
      codeCpy.indexOf(eol) + eol.length,
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
        "Verifies the presence of a particular string in a file's first docblock or comment block",
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
          source: {
            enum: ["file", "string"],
          },
          style: {
            enum: ["line", "jsdoc"],
          },
          content: {
            type: "string",
          },
          path: {
            type: "string",
          },
        },
        required: ["source"],
        allOf: [
          {
            if: {
              properties: { source: { const: "file" } },
              required: ["source"],
            },
            then: {
              required: ["path"],
            },
          },
          {
            if: {
              properties: { source: { const: "string" } },
              required: ["source"],
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
      context.options[0]["source"] === "file"
        ? fs.readFileSync(context.options[0]["path"], "utf-8").trimEnd()
        : context.options[0]["content"];

    var headerEol = getEolCharacter(expectedHeaderText);
    var eol = getEolCharacter(context.sourceCode.getText());

    // Replace EoL from config with EoL of file being linted.
    expectedHeaderText = expectedHeaderText.replaceAll(headerEol, eol);

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      Program: function (node) {
        if (!hasHeaderComment(context.sourceCode.getText(), eol)) {
          var newHeaderDocblock = generateDocblock(expectedHeaderText, eol);
          context.report({
            node: node.body[0],
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                node,
                formatExpectedHeader(newHeaderDocblock, eol, 1),
              );
            },
          });
          return;
        }

        var headerComment = getHeaderComment(context);
        if (headerComment.type === "Line") {
          newHeaderDocblock = generateDocblock(expectedHeaderText, eol);
          context.report({
            node: node.body[0],
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                headerComment,
                formatExpectedHeader(newHeaderDocblock, eol, 1),
              );
            },
          });
          return;
        }

        var headerCommentText = getDocblockText(headerComment.value, eol);
        if (!headerCommentText.startsWith(expectedHeaderText)) {
          var expectedDocblock = generateDocblock(expectedHeaderText, eol);
          var mergedDocblock = mergeDocblocks(
            eol,
            expectedDocblock,
            generateDocblock(headerCommentText, eol),
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
                    formatExpectedHeader(expectedDocblock, eol, 0),
                  );
                },
              },
              {
                messageId: "mergeHeaders",
                fix: function (fixer) {
                  return fixer.replaceText(
                    headerComment,
                    formatExpectedHeader(mergedDocblock, eol, 0),
                  );
                },
              },
              {
                messageId: "insertHeader",
                fix: function (fixer) {
                  return fixer.insertTextBefore(
                    headerComment,
                    formatExpectedHeader(expectedDocblock, eol, 1),
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
