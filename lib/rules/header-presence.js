/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock
 * @author Rob Misasi
 */
"use strict";

const fs = require("fs");

const {
  appendNewlines,
  generateDocblock,
  generateLineCommentBlock,
  getEolCharacter,
  mergeDocblocks,
  getDocblockText,
} = require("../utils");

/**
 * Checks if {@link code} starts with a comment. Ignores shebang, if present.
 *
 * @param {string} code
 * @param {string} eol End of Line character(s).
 * @returns true if {@link code} starts with comment syntax.
 */
function hasHeaderComment(code, eol) {
  let codeCpy = `${code}`;
  if (codeCpy.startsWith("#!")) {
    codeCpy = codeCpy.substring(
      codeCpy.indexOf(eol) + eol.length,
      codeCpy.length,
    );
  }
  return codeCpy.startsWith("/*") || codeCpy.startsWith("//");
}

/**
 * Gets header comment. Assumes at least one leading comment exists. Joins
 * consecutive line comments.
 *
 * @param {import('eslint').Rule.RuleContext} context Rule context
 * @returns {{value: string; loc: {start: { line: number; column: number;}; end: { line: number; column: number; }; }; range: [number, number]; type: "Block" | "Line"}}
 */
function getHeaderComment(context) {
  const comments = [...context.sourceCode.getAllComments()];
  if (comments[0].type === "Shebang") {
    comments.shift();
  }

  if (comments[0].type === "Block") {
    return {
      value: comments[0].value,
      loc: comments[0].loc,
      range: comments[0].range,
      type: "Block",
    };
  }

  let lineComments = [];
  for (let i = 0; i < comments.length - 1; i += 1) {
    if (
      !context.sourceCode
        .getText()
        .slice(comments[i].range[1], comments[i + 1].range[0])
        .match(/(\r\n|\r|\n)$/)
    ) {
      break;
    }
    lineComments.push(comments[i]);
  }

  if (comments.length === 1) {
    lineComments = [comments[0]];
  }

  return {
    value: lineComments.map((comment) => comment.value).join(),
    range: [
      lineComments[0].range[0],
      lineComments[lineComments.length - 1].range[1],
    ],
    loc: {
      start: lineComments[0].loc.start,
      end: lineComments[lineComments.length - 1].loc.end,
    },
    type: "Line",
  };
}

/**
 * Extracts lines from {@link comment} that contain a pragma expression.
 *
 * @param {string} comment Comment to extract pragmas from
 * @param {string} eol End of line character
 * @returns string with only pragma lines from comment.
 */
function extractPragmas(comment, eol) {
  const comments = comment.split(eol);
  return comments
    .map(
      (commentFragment) =>
        commentFragment.match(/^[^\w\d]*@\w+.*$/g) && commentFragment,
    )
    .filter((x) => x)
    .join(eol);
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
    let expectedHeaderText =
      context.options[0]["source"] === "file"
        ? fs.readFileSync(context.options[0]["path"], "utf-8").trimEnd()
        : context.options[0]["content"];

    const headerEol = getEolCharacter(expectedHeaderText);
    const eol = getEolCharacter(context.sourceCode.getText());

    // Replace EoL from config with EoL of file being linted.
    expectedHeaderText = expectedHeaderText.replaceAll(headerEol, eol);

    const style = context.options[0]["style"] || "jsdoc";
    const expectedHeaderContent =
      style === "jsdoc"
        ? generateDocblock(expectedHeaderText, eol)
        : generateLineCommentBlock(expectedHeaderText, eol);

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      Program: function (node) {
        if (!hasHeaderComment(context.sourceCode.getText(), eol)) {
          context.report({
            node: node.body[0],
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                node,
                appendNewlines(expectedHeaderContent, eol, 1),
              );
            },
          });
          return;
        }

        const headerComment = getHeaderComment(context);
        const headerCommentText =
          style === "jsdoc"
            ? getDocblockText(`/*${headerComment.value}*/`, eol)
            : headerComment.value
                .split(eol)
                .map((commentFragment) => commentFragment.match(/ ?(.*)/)[1])
                .join(eol);

        if (!headerCommentText.startsWith(expectedHeaderText)) {
          const headerPragmas = extractPragmas(headerComment.value, eol);

          context.report({
            loc: headerComment.loc,
            messageId: "headerContentMismatch",
            suggest: [
              {
                messageId: "replaceExistingHeader",
                fix: function (fixer) {
                  return fixer.replaceTextRange(
                    headerComment.range,
                    appendNewlines(expectedHeaderContent, eol, 0),
                  );
                },
              },
              style === "jsdoc" && headerPragmas.length > 0
                ? {
                    messageId: "mergeHeaders",
                    fix: function (fixer) {
                      return fixer.replaceTextRange(
                        headerComment.range,
                        appendNewlines(
                          mergeDocblocks(
                            eol,
                            expectedHeaderContent,
                            `/**${eol}${headerPragmas}*/`,
                          ),
                          eol,
                          0,
                        ),
                      );
                    },
                  }
                : undefined,
              {
                messageId: "insertHeader",
                fix: function (fixer) {
                  return fixer.insertTextBeforeRange(
                    headerComment.range,
                    appendNewlines(expectedHeaderContent, eol, 1),
                  );
                },
              },
            ].filter((s) => s),
          });
        }
      },
    };
  },
};
