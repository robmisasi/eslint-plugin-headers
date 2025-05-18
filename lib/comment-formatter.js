/**
 * @fileoverview Class for formatting comment blocks.
 * @author Rob Misasi
 */
"use strict";

const { getPatternLocations } = require("./utils");

class CommentFormatter {
  constructor(
    lines,
    { blockPrefix, blockSuffix, linePrefix, eol, defaultPatternValues } = {},
  ) {
    this.blockPrefix = blockPrefix;
    this.blockSuffix = blockSuffix;
    this.linePrefix = linePrefix;
    this.eol = eol;
    /** @type {Object.<string, string>} */
    this.defaultPatternValues = defaultPatternValues;
    this.lines = lines;
  }

  /**
   * Formats the comment.
   *
   * @param {"line" | "jsdoc" | "html"} style style to format into.
   * @param {Object.<string, (string | null)[]>=} patternValues The values to insert into patters.
   * @returns {string} The formatted comment.
   */
  format(style, patternValues) {
    const formatFn = {
      line: () => this.getLineBlock(),
      jsdoc: () => this.getJsdoc(),
      html: () => this.getHtmlBlock(),
    }[style];

    let formattedComment = formatFn();
    if (this.defaultPatternValues) {
      formattedComment = this.formatPatternValues(
        formattedComment,
        patternValues,
      );
    }

    return formattedComment;
  }

  getJsdoc() {
    let blockPrefix = this.blockPrefix ?? `*${this.eol}`;
    let blockSuffix = this.blockSuffix ?? `${this.eol} `;
    let linePrefix = this.linePrefix ?? " * ";
    let body = this.lines
      .map((line) => `${linePrefix}${line}`.trimEnd())
      .join(this.eol);

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
  formatPatternValues(string, patternValues) {
    const patternLocations = getPatternLocations(
      string,
      this.defaultPatternValues,
    );
    const patternValuesCopy = { ...patternValues };

    const segments = [];
    let characterIndex = 0;
    patternLocations.forEach((pattern) => {
      const patternName = pattern[1];
      const start = characterIndex;
      const end = pattern.index;
      const literalStart = string.substring(start, end);
      segments.push(literalStart);
      const patternValue = this.getNextPatternValue(
        patternName,
        patternValuesCopy,
      );
      segments.push(patternValue);
      characterIndex = pattern.index + pattern[0].length;
    });

    const lastLiteral = string.substring(characterIndex);
    segments.push(lastLiteral);

    return segments.join("").trimEnd();
  }

  /**
   * Gets the next pattern value.
   *
   * @param {string} patternName The name of the pattern.
   * @param {Object.<string, (string | null)[]> | undefined} patternValues The pattern values.
   * @returns The next pattern value from the relevant list, or the default pattern value.
   */
  getNextPatternValue(patternName, patternValues) {
    const patternValuesList = patternValues[patternName];
    if (!patternValuesList || patternValuesList.length === 0) {
      return this.defaultPatternValues[patternName];
    }

    return patternValuesList.shift() ?? this.defaultPatternValues[patternName];
  }
}

module.exports = CommentFormatter;
