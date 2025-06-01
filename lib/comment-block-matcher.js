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
    this.suffixRegex = new RegExp(
      `${this.processAndEscapeString(this.blockSuffix)}$`,
    );
  }

  buildPrefixedBodyRegex() {
    const blockPrefixPattern = this.processAndEscapeString(this.blockPrefix);
    const bodyPattern = this.expectedLines
      .map((line) => {
        const escapedLinePrefix = this.processAndEscapeString(this.linePrefix);
        const escapedLine = this.processAndEscapeString(line);
        return `${escapedLinePrefix}${escapedLine}`.trimEnd();
      })
      .join("\n");

    const prefixedBodyPattern = `^${blockPrefixPattern}${bodyPattern}`;
    return new RegExp(prefixedBodyPattern);
  }

  /**
   * Registers patterns and escapes regex in {@link str}.
   *
   * @param {string} str
   */
  processAndEscapeString(str) {
    if (!this.patterns) {
      return escapeRegex(str);
    }

    const patternPattern = /\((\w+)\)/g;
    let patternPatternMatch = patternPattern.exec(str);
    if (!patternPatternMatch) {
      return escapeRegex(str);
    }

    let startingIndex = 0;
    const segments = [];
    while (patternPatternMatch) {
      const patternName = patternPatternMatch[1];
      const nextStartingIndex =
        patternPatternMatch.index + patternPatternMatch[0].length;
      if (!this.patterns[patternName]) {
        segments.push(escapeRegex(str.slice(startingIndex, nextStartingIndex)));
      } else {
        this.patternOrder.push(patternName);
        segments.push(
          escapeRegex(str.slice(startingIndex, patternPatternMatch.index)),
        );
        segments.push(`(${this.patterns[patternName].pattern})`);
      }

      startingIndex = nextStartingIndex;
      patternPatternMatch = patternPattern.exec(str);
    }

    if (startingIndex !== str.length) {
      segments.push(escapeRegex(str.slice(startingIndex, str.length)));
    }

    return segments.join("");
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
