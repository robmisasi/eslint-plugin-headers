/**
 * @fileoverview Verifies the content and format of a file's leading comment block.
 * @author Rob Misasi
 */
"use strict";

const fs = require("fs");

const CommentFormatter = require("../comment-formatter");
const CommentBlockMatcher = require("../comment-block-matcher");
const { appendNewlines, getEolCharacter, normalizeEol } = require("../utils");

/**
 * Checks if the file being linted is a Vue file.
 *
 * @param {import('eslint').Rule.RuleContext} context The rule context.
 * @returns {boolean}
 */
function parseAsVue(context) {
  return context.options[0].enableVueSupport;
}

/**
 * Checks if a Vue file has a header comment.
 *
 * @param {import('@types/estree').Program} program The program AST node to check.
 * @returns {boolean} A flag indicating the presence of a leading comment
 */
function vueHasHeaderComment(program) {
  const comments = program.templateBody.parent.comments;
  if (comments.length === 0) {
    return false;
  }

  let result = true;
  const firstComment = comments[0];
  if (firstComment.range[0] !== 0) {
    result = false;
  }

  return result;
}

/**
 * Checks if {@link program} is preceded by a comment block. Ignores shebang,
 * if present.
 *
 * @param {import('@types/estree').Program} program The program AST node to check.
 * @param {import('eslint').Rule.RuleContext} context The rule context.
 * @returns {boolean} A flag indicating the presence of a leading comment.
 */
function hasHeaderComment(program, context) {
  if (parseAsVue(context)) {
    return vueHasHeaderComment(program);
  }

  const firstComments = context.sourceCode.getCommentsBefore(program);
  if (firstComments.length === 0) {
    return false;
  } else if (
    firstComments.length === 1 &&
    firstComments[0].type === "Shebang"
  ) {
    return false;
  } else {
    return true;
  }
}

/**
 * Gets header comment. Assumes at least one leading comment exists. Joins
 * consecutive line comments.
 *
 * @param {import('eslint').Rule.RuleContext} context Rule context
 * @param {import('@types/estree').Program} program Program node
 * @returns {import('@types/estree').Comment[]} Array of comment AST nodes.
 */
function getHeaderComments(context, program) {
  if (parseAsVue(context)) {
    return [program.templateBody.parent.comments[0]];
  }

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
        .match(/^(\r\n|\r|\n)$/) ||
      comments[i].type !== "Line"
    ) {
      break;
    }

    lineComments.push(comments[i]);
  }

  return lineComments;
}

function getFirstVueContentNode(program) {
  let firstVueNode;
  for (const child of program.templateBody.parent.children) {
    if (child.type === "VElement") {
      firstVueNode = child;
      break;
    }
  }

  // If a subsequent comment exists and occurs before the element node, use this instead.
  const headerCommentIndex = 0;
  if (
    program.templateBody.parent.comments.length >= hasHeaderComment + 1 &&
    program.templateBody.parent.comments[headerCommentIndex + 1].range[0] <
      firstVueNode.range[1]
  ) {
    firstVueNode = program.templateBody.parent.comments[0];
  }

  return firstVueNode;
}

/**
 * Gets the first node following a leading header comment.
 *
 * @param {import('eslint').RuleContext} context The context.
 * @param {import('@types/estree').Program} program The program AST node.
 * @param {import('@types/estree').Comment[]} headerComments The list of leading header comment nodes.
 * @returns {import('@types/estree').Node}
 */
function getFirstContentNode(context, program, headerComments) {
  if (parseAsVue(context)) {
    return getFirstVueContentNode(program);
  }

  return context.sourceCode.getTokenAfter(
    headerComments[headerComments.length - 1],
    { includeComments: true },
  );
}

/**
 * Gets the insertion node.
 *
 * @param {import('eslint').RuleContext} context The rule context
 * @param {import('@types/estree').Program} program The program node.
 * @returns Node
 */
function getMissingHeaderInsertionNode(context, program) {
  if (parseAsVue(context)) {
    return program.templateBody.parent;
  }

  return program.body[0] || program;
}

/**
 * @param {Object.<string, PatternConfig> | undefined>} patterns The pattern configuration
 * @returns {Object.<string, string> | undefined}
 */
function getDefaultPatternValues(patterns) {
  if (!patterns) {
    return undefined;
  }

  const defaultPatternValues = {};
  Object.keys(patterns).forEach((patternName) => {
    defaultPatternValues[patternName] = patterns[patternName].defaultValue;
  });
  return defaultPatternValues;
}

/**
 * @param {Object.<string, string> | undefined} variables The variables configuration.
 * @param {string} str
 * @returns A copy of {@link str} with replaced variables.
 */
function formatVariables(variables, str) {
  if (str === undefined) {
    return undefined;
  }

  if (!variables) {
    return str;
  }

  let formatted = `${str}`;
  Object.keys(variables).forEach((key) => {
    formatted = formatted.replaceAll(`{${key}}`, variables[key]);
  });
  return formatted;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * @typedef {("file" | "string")} SourceType
 *
 * @typedef {("line" | "jsdoc" | "html")} StyleType
 *
 * @typedef PatternConfig
 * @type {object}
 * @property {string} pattern
 * @property {string} defaultValue
 *
 * @typedef HeaderFormatConfigOptions
 * @type {object}
 * @property {SourceType} source
 * @property {StyleType} style
 * @property {string} content
 * @property {string} path
 * @property {boolean} preservePragmas
 * @property {string} blockPrefix
 * @property {string} blockSuffix
 * @property {string} linePrefix
 * @property {number} trailingNewlines
 * @property {Object.<string, string>} variables
 * @property {Object.<string, PatternConfig>} patterns
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Verifies the content and format of a file's leading comment block.",
      recommended: false,
    },
    messages: {
      missingHeader: "No header found.",
      headerContentMismatch: "Header does not include expected content.",
      trailingNewlinesMismatch: "Mismatched trailing newlines",
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
          trailingNewlines: {
            type: "number",
          },
          variables: {
            type: "object",
            patternProperties: {
              "^.+$": {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          patterns: {
            type: "object",
            patternProperties: {
              "^\\w+$": {
                type: "object",
                properties: {
                  pattern: {
                    type: "string",
                  },
                  defaultValue: {
                    type: "string",
                  },
                },
                required: ["pattern"],
              },
            },
            additionalProperties: false,
          },
          enableVueSupport: {
            type: "boolean",
            default: false,
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
    /** @type {HeaderFormatConfigOptions} */
    const headerFormatConfigOptions = context.options[0];
    const patterns = headerFormatConfigOptions.patterns;
    const canApplyFix = patterns
      ? Object.keys(patterns).every(
          (patternName) => patterns[patternName].defaultValue !== undefined,
        )
      : true;
    const defaultPatternValues = getDefaultPatternValues(patterns);

    /**
     * @param {import('eslint').Rule.RuleFixer} fixerFn
     */
    function getFixerFn(fixerFn) {
      return canApplyFix ? fixerFn : undefined;
    }

    const configuredHeaderContent =
      headerFormatConfigOptions.source === "file"
        ? fs.readFileSync(headerFormatConfigOptions.path, "utf-8").trimEnd()
        : headerFormatConfigOptions.content;

    const variables = headerFormatConfigOptions.variables;
    const expectedHeaderText = formatVariables(
      variables,
      configuredHeaderContent,
    );

    const normalizedHeaderText = normalizeEol(expectedHeaderText);
    const expectedHeaderLines = normalizedHeaderText.split("\n");
    const sourceEol = getEolCharacter(context.sourceCode.getText());

    let style = headerFormatConfigOptions.style;
    if (parseAsVue(context)) {
      style = "html";
    }

    const defaultBlockFormat = {
      blockPrefix: `*${sourceEol}`,
      blockSuffix: `${sourceEol} `,
      linePrefix: " * ",
    };

    const defaultLineFormat = {
      blockPrefix: undefined,
      blockSuffix: undefined,
      linePrefix: " ",
    };

    const defaultHtmlFormat = {
      blockPrefix: `${sourceEol}`,
      blockSuffix: `${sourceEol}`,
      linePrefix: "  ",
    };

    const defaultFormat = {
      jsdoc: defaultBlockFormat,
      line: defaultLineFormat,
      html: defaultHtmlFormat,
    }[style];

    const formatConfig = {
      blockPrefix:
        formatVariables(variables, headerFormatConfigOptions.blockPrefix) ??
        defaultFormat.blockPrefix,
      blockSuffix:
        formatVariables(variables, headerFormatConfigOptions.blockSuffix) ??
        defaultFormat.blockSuffix,
      linePrefix:
        formatVariables(variables, headerFormatConfigOptions.linePrefix) ??
        defaultFormat.linePrefix,
      eol: sourceEol,
      defaultPatternValues,
    };

    const headerFormatter = new CommentFormatter(
      expectedHeaderLines,
      formatConfig,
    );

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      Program: function (node) {
        if (!hasHeaderComment(node, context)) {
          const missingHeaderinsertionPoint = getMissingHeaderInsertionNode(
            context,
            node,
          );
          context.report({
            node: missingHeaderinsertionPoint,
            messageId: "missingHeader",
            fix: getFixerFn(function (fixer) {
              return fixer.insertTextBefore(
                missingHeaderinsertionPoint,
                appendNewlines(
                  headerFormatter.format(style),
                  sourceEol,
                  headerFormatConfigOptions.trailingNewlines ?? 1,
                ),
              );
            }),
          });
          return;
        }

        const headerComments = getHeaderComments(context, node);
        const headerCommentLines =
          style === "line"
            ? headerComments.map((comment) => comment.value)
            : headerComments[0].value.split(sourceEol);
        const commentBlockMatcher = new CommentBlockMatcher({
          ...formatConfig,
          style,
          expectedLines: expectedHeaderLines,
          patterns: headerFormatConfigOptions.patterns,
        });

        const patternValues = commentBlockMatcher.match(headerComments);

        if (!patternValues) {
          const headerPragmas = headerCommentLines
            .map((line) => {
              const match = line.match(/^[^\w]*(@\w.*)$/);
              return match ? match[1] : undefined;
            })
            .filter((x) => x);

          if (
            style === "jsdoc" &&
            headerFormatConfigOptions.preservePragmas &&
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
            fix: getFixerFn(function (fixer) {
              const patternValuesWithDefaults = {
                ...commentBlockMatcher.patternValues,
              };
              Object.keys(patternValuesWithDefaults).forEach((patternName) => {
                patternValuesWithDefaults[patternName] =
                  patternValuesWithDefaults[patternName].map(
                    (patternValue) =>
                      patternValue ??
                      headerFormatConfigOptions.patterns[patternName]
                        .defaultValue,
                  );
              });
              return fixer.replaceTextRange(
                [
                  headerComments[0].range[0],
                  headerComments[headerComments.length - 1].range[1],
                ],
                headerFormatter.format(style, {}),
              );
            }),
          });
        }

        const firstContentNode = getFirstContentNode(
          context,
          node,
          headerComments,
        );

        // Report newlines issue only if there's a valid AST token after the header block
        if (
          headerFormatConfigOptions.trailingNewlines &&
          firstContentNode &&
          context.sourceCode
            .getText()
            .slice(
              headerComments[headerComments.length - 1].range[1],
              firstContentNode.range[0],
            ) !== sourceEol.repeat(headerFormatConfigOptions.trailingNewlines)
        ) {
          context.report({
            loc: {
              start: headerComments[headerComments.length - 1].loc.end,
              end: firstContentNode.loc.start,
            },
            messageId: "trailingNewlinesMismatch",
            fix: function (fixer) {
              return fixer.replaceTextRange(
                [
                  headerComments[headerComments.length - 1].range[1],
                  firstContentNode.range[0],
                ],
                sourceEol.repeat(headerFormatConfigOptions.trailingNewlines),
              );
            },
          });
        }
      },
    };
  },
};
