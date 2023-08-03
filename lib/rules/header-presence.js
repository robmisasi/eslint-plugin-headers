/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock
 * @author Rob Misasi
 */
"use strict";

const fs = require("fs");

const { appendNewlines, getEolCharacter } = require("../utils");
const CommentFormatter = require("../comment-formatter");
const CommentBlockMatcher = require("../comment-block-matcher");

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
 * @param {string} eol End of line character(s)
 * @returns Array of comment nodes.
 */
function getHeaderComments(context) {
  const comments = context.sourceCode.getAllComments();
  const startingIndex = comments[0].type === "Shebang" ? 1 : 0;

  if (comments[startingIndex].type === "Block") {
    return [comments[startingIndex]];
  }

  let lineComments = [comments[startingIndex]];
  for (let i = startingIndex + 1; i < comments.length; i += 1) {
    if (
      !context.sourceCode
        .getText()
        .slice(comments[i - 1].range[1], comments[i].range[0])
        .match(/(\r\n|\r|\n)$/) ||
      comments[i].type !== "Line"
    ) {
      break;
    }
    lineComments.push(comments[i]);
  }

  return lineComments;
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
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          source: {
            enum: ["file", "string"],
          },
          style: {
            enum: ["line", "jsdoc"],
            default: "jsdoc",
          },
          content: {
            type: "string",
          },
          path: {
            type: "string",
          },
          preservePragmas: {
            type: "boolean",
            default: true,
          },
          blockPrefix: {
            type: "string",
          },
          blockSuffix: {
            type: "string",
          },
          linePrefix: {
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

    const style = context.options[0]["style"];

    const defaultBlockFormat = {
      blockPrefix: `*${eol}`,
      blockSuffix: `${eol} `,
      linePrefix: " * ",
    };

    const defaultLineFormat = {
      blockPrefix: undefined,
      blockSuffix: undefined,
      linePrefix: " ",
    };

    const defaultFormat = {
      jsdoc: defaultBlockFormat,
      line: defaultLineFormat,
    }[style];

    const formatConfig = {
      blockPrefix:
        context.options[0]["blockPrefix"] || defaultFormat.blockPrefix,
      blockSuffix:
        context.options[0]["blockSuffix"] || defaultFormat.blockSuffix,
      linePrefix: context.options[0]["linePrefix"] || defaultFormat.linePrefix,
      eol,
    };

    const headerFormatter = new CommentFormatter(
      expectedHeaderText.split(eol),
      formatConfig,
    );

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
                appendNewlines(headerFormatter.format(style), eol, 1),
              );
            },
          });
          return;
        }

        const headerComments = getHeaderComments(context);
        const headerCommentLines =
          style === "jsdoc"
            ? headerComments[0].value.split(eol)
            : headerComments.map((comment) => comment.value);
        const matcher = new CommentBlockMatcher({
          ...formatConfig,
          style,
          expectedLines: expectedHeaderText.split(eol),
        });

        const match = matcher.match(headerComments);

        if (!match) {
          const headerPragmas = headerCommentLines
            .map((line) => {
              const match = line.match(/^[^\w\d]*(@\w.*)$/);
              return match ? match[1] : undefined;
            })
            .filter((x) => x);

          if (
            style === "jsdoc" &&
            context.options[0]["preservePragmas"] &&
            headerPragmas.length > 0
          ) {
            headerFormatter.lines = headerFormatter.lines.concat([
              "",
              ...headerPragmas,
            ]);
          }

          context.report({
            loc: {
              start: headerComments[0].loc.start,
              end: headerComments[headerComments.length - 1].loc.end,
            },
            messageId: "headerContentMismatch",
            fix: function (fixer) {
              return fixer.replaceTextRange(
                [
                  headerComments[0].range[0],
                  headerComments[headerComments.length - 1].range[1],
                ],
                appendNewlines(headerFormatter.format(style), eol, 0),
              );
            },
          });
        }
      },
    };
  },
};
