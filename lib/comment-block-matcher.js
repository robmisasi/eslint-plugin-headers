/**
 * @fileoverview Class for validating comment blocks for proper content and format.
 * @author Rob Misasi
 */
"use strict";

const { escapeRegex, normalizeComments, normalizeEol } = require("./utils");

/**
 * The comment block matcher.
 */
class CommentBlockMatcher {
  /**
   * @typedef {("pattern" | "content")} MismatchType
   *
   * @typedef MismatchInfo
   * @type {object}
   * @property {[number, number]} range The location of the mismatch.
   * @property {MismatchType} type The type of mismatch.
   *
   * @typedef PatternInfo The pattern info.
   * @type {object}
   * @property {string} pattern The pattern to match.
   *
   * @typedef PatternMap The map of names to pattern infos.
   * @type {Object.<string, PatternInfo>}
   */

  /**
   * @param {{
   *   blockPrefix?: string;
   *   blockSuffix?: string;
   *   linePrefix?:string;
   *   style: "line" | "jsdoc" | "html";
   *   expectedLines?: string[];
   *   patterns?: PatternMap
   * }} config Configuration to match against
   */
  constructor({
    blockPrefix,
    blockSuffix,
    linePrefix,
    style,
    expectedLines,
    patterns,
  } = {}) {
    this.blockPrefix = blockPrefix ? normalizeEol(blockPrefix) : "";
    this.blockSuffix = blockSuffix ? normalizeEol(blockSuffix) : "";
    this.linePrefix = linePrefix ? normalizeEol(linePrefix) : "";
    this.style = style;
    this.expectedLines = expectedLines ?? [];
    this.patterns = patterns;

    this.patternOrder = [];
    this.prefixedBodyRegex = this.buildPrefixedBodyRegex();
    this.suffixRegex = new RegExp(`${escapeRegex(this.blockSuffix)}$`);
  }

  buildPrefixedBodyRegex() {
    const escapedLinePrefix = escapeRegex(this.linePrefix);

    const bodyPattern = this.expectedLines
      .map((line) => {
        const lineRegex = line.replace(/\(([^)]+)\)/g, (match, patternName) => {
          if (/^\w+$/.test(patternName) && this.patterns[patternName]) {
            this.patternOrder.push(patternName);
            return `(${this.patterns[patternName].pattern})`;
          } else {
            return escapeRegex(match);
          }
        });
        return `${escapedLinePrefix}${lineRegex}`.trimEnd();
      })
      .join("\n");

    const prefixedBodyPattern = `^${escapeRegex(
      this.blockPrefix,
    )}${bodyPattern}`;
    return new RegExp(prefixedBodyPattern);
  }

  /**
   * Verifies {@link comments} matches the configuration.
   *
   * @param {import('@types/estree').Comment[]} comments The AST nodes to verify.
   * @returns {Object.<string, string[]> | null}} The results of the match operation. A dictionary of pattern values, if any, or null if no match was found.
   */
  match(comments) {
    this.patternOrder = [];
    const normalizedComments = normalizeComments(comments);
    const actualCommentContent = normalizedComments
      .map((comment) => comment.value)
      .join("\n");

    const prefixedBodyMatch = this.prefixedBodyRegex.test(actualCommentContent);
    const suffixMatch = this.suffixRegex.test(actualCommentContent);
    if (!prefixedBodyMatch || !suffixMatch) {
      return null;
    }

    const patternValues = {};
    this.patternOrder.forEach((name, index) => {
      patternValues[name] = patternValues[name]
        ? [...patternValues[name], prefixedBodyMatch[index + 1]]
        : [prefixedBodyMatch[index + 1]];
    });
    return patternValues;
  }
}

module.exports = CommentBlockMatcher;
