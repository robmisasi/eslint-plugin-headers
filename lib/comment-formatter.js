/**
 * @fileoverview Class for formatting comment blocks.
 * @author Rob Misasi
 */
"use strict";

const { getPatterns } = require("./utils");

class CommentFormatter {
  constructor(
    lines,
    { blockPrefix, blockSuffix, linePrefix, eol, patternValues } = {},
  ) {
    this.blockPrefix = blockPrefix;
    this.blockSuffix = blockSuffix;
    this.linePrefix = linePrefix;
    this.eol = eol;
    /** @type {Object.<string, string[]>} */
    this.patternValues = patternValues;
    this.lines = lines;
  }

  /**
   * Formats the comment.
   *
   * @param {"line" | "jsdoc" | "html"} style style to format into
   * @returns {string} The formatted comment.
   */
  format(style) {
    const formatFn = {
      line: () => this.getLineBlock(),
      jsdoc: () => this.getJsdoc(),
      html: () => this.getHtmlBlock(),
    }[style];
    return formatFn();
  }

  getJsdoc() {
    let blockPrefix = this.blockPrefix ?? `*${this.eol}`;
    let blockSuffix = this.blockSuffix ?? `${this.eol} `;
    let linePrefix = this.linePrefix ?? " * ";
    let body = this.lines
      .map((line) => `${linePrefix}${line}`.trimEnd())
      .join(this.eol);

    if (this.patternValues) {
      body = this.formatPatternValues(body);
    }

    return `/*${blockPrefix}${body}${blockSuffix}*/`;
  }

  getLineBlock() {
    let blockPrefix =
      (this.blockPrefix && `//${this.blockPrefix}${this.eol}`) ?? "";
    let blockSuffix =
      (this.blockSuffix && `${this.eol}//${this.blockSuffix}`) ?? "";
    let linePrefix = this.linePrefix ?? " ";
    const body = this.lines
      .map((line) => `//${linePrefix}${line}`.trimEnd())
      .join(this.eol);
    return `${blockPrefix}${body}${blockSuffix}`;
  }

  getHtmlBlock() {
    let blockPrefix = this.blockPrefix ?? this.eol;
    let blockSuffix = this.blockSuffix ?? this.eol;
    let linePrefix = this.linePrefix ?? "  ";
    const body = this.lines
      .map((line) => `${linePrefix}${line}`.trimEnd())
      .join(this.eol);
    return `<!--${blockPrefix}${body}${blockSuffix}-->`;
  }

  /**
   * Replaces pattern placeholders in {@link string} with values.
   *
   * @param {string} string The string with pattern placeholders.
   * @returns {string} The formatted string.
   */
  formatPatternValues(string) {
    const patternLocations = getPatterns(string, this.patternValues);
    const patternValuesCopy = { ...this.patternValues };

    const segments = [];
    let characterIndex = 0;
    patternLocations.forEach((pattern) => {
      const patternName = pattern[1];
      const start = characterIndex;
      const end = pattern.index;
      const literalStart = string.substring(start, end);
      segments.push(literalStart);
      const patternValue = patternValuesCopy[patternName].shift();
      segments.push(patternValue);
      characterIndex = pattern.index + pattern[0].length;
    });

    const lastLiteral = string.substring(characterIndex);
    segments.push(lastLiteral);

    return segments.join("").trim();
  }
}

module.exports = CommentFormatter;
